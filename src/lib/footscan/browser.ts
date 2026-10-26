import { deviceId, SUPABASE_URL, supabaseHeaders } from '../remote'
import { rgbaToGray, type Gray } from './image'
import { scanFootprint, type FootprintScan, type OverlayLine } from './footprint'
import { scanFootOnPaper, type SizeScan } from './sizing'

const MAX_SIDE = 900
const AI_MAX_SIDE = 768

interface LoadedPhoto {
  gray: Gray
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}

async function loadPhoto(file: File, maxSide = MAX_SIDE): Promise<LoadedPhoto> {
  const img = await loadImage(file)
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(64, Math.round(img.naturalWidth * scale))
  const h = Math.max(64, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  return { gray: rgbaToGray(data, w, h), canvas, ctx }
}

const COLORS: Record<OverlayLine['kind'], string> = {
  axis: 'rgba(255, 255, 255, 0.7)',
  forefoot: 'rgba(163, 230, 53, 0.95)',
  midfoot: 'rgba(56, 189, 248, 0.95)',
  length: 'rgba(163, 230, 53, 0.95)',
  paper: 'rgba(250, 204, 21, 0.9)',
}

function drawOverlay(photo: LoadedPhoto, lines: OverlayLine[]): string {
  const { ctx, canvas } = photo
  ctx.lineCap = 'round'
  ctx.lineWidth = Math.max(2, Math.round(canvas.width / 220))
  for (const line of lines) {
    ctx.strokeStyle = COLORS[line.kind]
    ctx.setLineDash(line.kind === 'axis' ? [6, 6] : [])
    ctx.beginPath()
    ctx.moveTo(line.from.x, line.from.y)
    ctx.lineTo(line.to.x, line.to.y)
    ctx.stroke()
  }
  ctx.setLineDash([])
  return canvas.toDataURL('image/jpeg', 0.85)
}

export async function scanFootprintFile(file: File): Promise<{ scan: FootprintScan; previewDataUrl: string }> {
  const photo = await loadPhoto(file)
  const scan = scanFootprint(photo.gray)
  return { scan, previewDataUrl: drawOverlay(photo, scan.overlay) }
}

export async function scanPaperFile(file: File): Promise<{ scan: SizeScan; previewDataUrl: string }> {
  const photo = await loadPhoto(file)
  const scan = scanFootOnPaper(photo.gray)
  return { scan, previewDataUrl: drawOverlay(photo, scan.overlay) }
}

export interface AiCheck {
  usable: boolean
  problems: string[]
  retakeTip: string
  archGuess: 'low' | 'normal' | 'high' | 'unknown'
  explanation: string
}

export type AiCheckError = 'not-configured' | 'limit-reached' | 'offline' | 'failed'

/**
 * Optional second opinion from the foot-check Edge Function (Gemini free tier).
 * Only called when the user has switched the AI check on.
 */
export async function aiCheckPhoto(
  file: File,
  kind: 'footprint' | 'paper',
  lang: 'en' | 'ms',
  measured: Record<string, unknown>,
): Promise<{ ok: true; check: AiCheck } | { ok: false; error: AiCheckError }> {
  let imageBase64: string
  try {
    const photo = await loadPhoto(file, AI_MAX_SIDE)
    imageBase64 = photo.canvas.toDataURL('image/jpeg', 0.8).split(',')[1] ?? ''
  } catch {
    return { ok: false, error: 'failed' }
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/foot-check`, {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify({ kind, imageBase64, deviceId: deviceId(), lang, measured }),
    })
    if (res.status === 503) return { ok: false, error: 'not-configured' }
    if (res.status === 429) return { ok: false, error: 'limit-reached' }
    if (!res.ok) return { ok: false, error: 'failed' }
    return { ok: true, check: (await res.json()) as AiCheck }
  } catch {
    return { ok: false, error: 'offline' }
  }
}
