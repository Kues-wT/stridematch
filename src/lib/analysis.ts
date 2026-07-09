export type ArchType = 'low' | 'normal' | 'high'
export type Pronation = 'over' | 'neutral' | 'under'
export type Experience = 'beginner' | 'intermediate' | 'advanced'
export type WeeklyDistance = 'short' | 'moderate' | 'long'
export type PreferredCushion = 'firm' | 'balanced' | 'max'
export type Budget = 'budget' | 'mid' | 'premium' | 'any'
export type PrimarySurface = 'road' | 'trail' | 'mixed' | 'track'

export interface FootAnalysisResult {
  arch: ArchType
  archConfidence: number
  widthHint: 'narrow' | 'standard' | 'wide'
  brightness: number
  notes: string[]
  previewDataUrl?: string
  mode: 'top-down' | 'side' | 'combined'
  sideArchRatio?: number
}

export interface WearAnalysisResult {
  pronationHint: Pronation
  confidence: number
  medialWear: number
  lateralWear: number
  heelWear: number
  notes: string[]
  previewDataUrl?: string
}

export interface UserProfile {
  arch: ArchType
  archSource: 'photo' | 'manual'
  widthHint: 'narrow' | 'standard' | 'wide'
  pronation: Pronation
  experience: Experience
  weeklyDistance: WeeklyDistance
  surface: PrimarySurface
  cushion: PreferredCushion
  budget: Budget
  photoAnalysis?: FootAnalysisResult
  wearAnalysis?: WearAnalysisResult
}

/**
 * Client-side heuristic foot analysis.
 * - Top-down: wet-test style midfoot contact (arch + width)
 * - Side-view: arch height ratio from sole-to-instep darkness silhouette
 * Not medical diagnosis.
 */
export async function analyzeFootPhoto(
  file: File,
  mode: 'top-down' | 'side' = 'top-down',
): Promise<FootAnalysisResult> {
  const image = await loadImage(file)
  const maxSide = 520
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
  const w = Math.max(64, Math.round(image.width * scale))
  const h = Math.max(64, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return fallbackResult('Could not read image pixels in this browser.', mode)
  }

  ctx.drawImage(image, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  if (mode === 'side') {
    return analyzeSideView(ctx, data, w, h, canvas)
  }
  return analyzeTopDown(ctx, data, w, h, canvas)
}

export async function analyzeWearPhoto(file: File): Promise<WearAnalysisResult> {
  const image = await loadImage(file)
  const maxSide = 480
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
  const w = Math.max(64, Math.round(image.width * scale))
  const h = Math.max(64, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return {
      pronationHint: 'neutral',
      confidence: 0.35,
      medialWear: 0.5,
      lateralWear: 0.5,
      heelWear: 0.5,
      notes: ['Could not analyse wear photo. Set pronation manually.'],
    }
  }

  ctx.drawImage(image, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  // Outsole wear often appears as smoother / lighter / more reflective rubber.
  // We sample left (medial) vs right (lateral) thirds of the lower 70% of the frame.
  const medial = sampleWearZone(data, w, h, 0.08, 0.38, 0.25, 0.9)
  const lateral = sampleWearZone(data, w, h, 0.62, 0.92, 0.25, 0.9)
  const heel = sampleWearZone(data, w, h, 0.3, 0.7, 0.72, 0.95)

  // Higher "wear score" = brighter + lower local contrast (smoothed rubber)
  const medialWear = medial.wearScore
  const lateralWear = lateral.wearScore
  const heelWear = heel.wearScore
  const bias = medialWear - lateralWear

  let pronationHint: Pronation = 'neutral'
  let confidence = 0.5
  const notes: string[] = []

  if (bias > 0.08) {
    pronationHint = 'over'
    confidence = clamp(0.52 + bias * 1.2, 0.52, 0.82)
    notes.push('Inner (medial) sole region looks more worn — often linked to overpronation.')
  } else if (bias < -0.08) {
    pronationHint = 'under'
    confidence = clamp(0.52 + Math.abs(bias) * 1.2, 0.52, 0.82)
    notes.push('Outer (lateral) sole region looks more worn — often linked to underpronation / supination.')
  } else {
    pronationHint = 'neutral'
    confidence = 0.55
    notes.push('Medial and lateral wear look fairly even — often a more neutral pattern.')
  }

  if (heelWear > Math.max(medialWear, lateralWear) + 0.05) {
    notes.push('Heel area shows relatively high wear — common for heel-strikers.')
  }

  notes.push('Wear photos vary by shoe age, surface, and camera angle. Confirm how your ankles feel.')

  // Overlay zones
  ctx.strokeStyle = 'rgba(163, 230, 53, 0.85)'
  ctx.lineWidth = 2
  drawRect(ctx, w * 0.08, h * 0.25, w * 0.3, h * 0.65)
  drawRect(ctx, w * 0.62, h * 0.25, w * 0.3, h * 0.65)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)'
  drawRect(ctx, w * 0.3, h * 0.72, w * 0.4, h * 0.23)
  ctx.fillStyle = 'rgba(163, 230, 53, 0.9)'
  ctx.font = '12px sans-serif'
  ctx.fillText('Medial', w * 0.1, h * 0.23)
  ctx.fillText('Lateral', w * 0.64, h * 0.23)

  return {
    pronationHint,
    confidence,
    medialWear,
    lateralWear,
    heelWear,
    notes,
    previewDataUrl: canvas.toDataURL('image/jpeg', 0.85),
  }
}

/** Merge top-down + optional side results into a stronger arch estimate. */
export function combineFootAnalyses(
  top?: FootAnalysisResult | null,
  side?: FootAnalysisResult | null,
): FootAnalysisResult | null {
  if (!top && !side) return null
  if (top && !side) return { ...top, mode: 'top-down' }
  if (side && !top) return { ...side, mode: 'side' }

  const t = top!
  const s = side!
  const score = (a: ArchType) => (a === 'low' ? 0 : a === 'normal' ? 1 : 2)
  const avg = (score(t.arch) * t.archConfidence + score(s.arch) * s.archConfidence) /
    Math.max(t.archConfidence + s.archConfidence, 0.01)

  let arch: ArchType = 'normal'
  if (avg < 0.7) arch = 'low'
  else if (avg > 1.35) arch = 'high'

  const conf = clamp((t.archConfidence + s.archConfidence) / 2 + 0.08, 0.5, 0.92)
  return {
    arch,
    archConfidence: conf,
    widthHint: t.widthHint,
    brightness: (t.brightness + s.brightness) / 2,
    notes: [
      `Combined top-down (${t.arch}) and side-view (${s.arch}) estimates → ${arch} arch.`,
      ...t.notes.filter((n) => !n.includes('not a medical')),
      ...s.notes.filter((n) => !n.includes('not a medical')),
      'This is a visual estimate only — not a medical diagnosis.',
    ].slice(0, 6),
    previewDataUrl: t.previewDataUrl || s.previewDataUrl,
    mode: 'combined',
    sideArchRatio: s.sideArchRatio,
  }
}

function analyzeTopDown(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  w: number,
  h: number,
  canvas: HTMLCanvasElement,
): FootAnalysisResult {
  const heel = sampleBand(data, w, h, 0.72, 0.92)
  const mid = sampleBand(data, w, h, 0.42, 0.62)
  const fore = sampleBand(data, w, h, 0.12, 0.32)

  const overall = (heel.avg + mid.avg + fore.avg) / 3
  const midRelative = mid.avg / Math.max(overall, 1)
  const contactRatio = mid.darkRatio / Math.max((heel.darkRatio + fore.darkRatio) / 2, 0.01)

  // Edge-based midfoot width: higher span of dark pixels in mid band → lower arch
  const midSpan = horizontalDarkSpan(data, w, h, 0.45, 0.58)
  const heelSpan = horizontalDarkSpan(data, w, h, 0.78, 0.9)
  const spanRatio = midSpan / Math.max(heelSpan, 0.05)

  let arch: ArchType = 'normal'
  let archConfidence = 0.55
  const notes: string[] = []

  const lowSignal = contactRatio > 1.12 || spanRatio > 0.92
  const highSignal = contactRatio < 0.78 || spanRatio < 0.55

  if (lowSignal && !highSignal) {
    arch = 'low'
    archConfidence = clamp(0.58 + (contactRatio - 1) * 0.4 + (spanRatio - 0.85) * 0.5, 0.55, 0.9)
    notes.push('Midfoot contact looks filled — often associated with lower arches.')
  } else if (highSignal && !lowSignal) {
    arch = 'high'
    archConfidence = clamp(0.58 + (0.9 - contactRatio) * 0.4 + (0.65 - spanRatio) * 0.5, 0.55, 0.9)
    notes.push('Midfoot looks more open / narrow — often associated with higher arches.')
  } else {
    arch = 'normal'
    archConfidence = 0.62
    notes.push('Midfoot pattern looks balanced — typical of a normal arch profile.')
  }

  if (midRelative > 1.12) {
    notes.push('Midfoot is brighter than average — possible high-arch lighting cue.')
  }

  const widthHint = estimateWidth(data, w, h)
  if (widthHint === 'wide') notes.push('Forefoot outline appears relatively wide.')
  else if (widthHint === 'narrow') notes.push('Forefoot outline appears relatively narrow.')
  else notes.push('Foot width looks about average from this angle.')

  notes.push('This is a visual estimate only — not a medical diagnosis. Confirm how your feet feel.')

  ctx.strokeStyle = 'rgba(163, 230, 53, 0.85)'
  ctx.lineWidth = 2
  ;[0.22, 0.52, 0.82].forEach((yRatio) => {
    const y = Math.round(h * yRatio)
    ctx.beginPath()
    ctx.moveTo(w * 0.15, y)
    ctx.lineTo(w * 0.85, y)
    ctx.stroke()
  })

  return {
    arch,
    archConfidence,
    widthHint,
    brightness: overall,
    notes,
    previewDataUrl: canvas.toDataURL('image/jpeg', 0.85),
    mode: 'top-down',
  }
}

function analyzeSideView(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  w: number,
  h: number,
  canvas: HTMLCanvasElement,
): FootAnalysisResult {
  // Find dark foot silhouette bounds, then measure midfoot gap from floor line
  const { minY, maxY, minX, maxX } = silhouetteBounds(data, w, h)
  const footH = Math.max(maxY - minY, 1)
  const footW = Math.max(maxX - minX, 1)
  const midX0 = Math.floor(minX + footW * 0.4)
  const midX1 = Math.floor(minX + footW * 0.6)

  // From bottom of foot, how quickly do we leave the dark sole into a bright arch gap?
  let soleTop = maxY
  for (let y = maxY; y >= minY; y--) {
    let dark = 0
    let count = 0
    for (let x = midX0; x < midX1; x++) {
      count++
      if (luminance(data, w, x, y) < 115) dark++
    }
    if (count && dark / count > 0.35) soleTop = y
    else if (maxY - y > footH * 0.08) break
  }

  // Instep height: first continuous dark band above the arch gap
  let instepY = soleTop
  for (let y = soleTop - 2; y >= minY; y--) {
    let dark = 0
    let count = 0
    for (let x = midX0; x < midX1; x++) {
      count++
      if (luminance(data, w, x, y) < 125) dark++
    }
    if (count && dark / count > 0.28) {
      instepY = y
      break
    }
  }

  const archClearance = Math.max(0, soleTop - instepY) // inverted logic safety
  // Better metric: gap height between sole contact and dorsum underside
  const gapHeight = Math.max(0, (soleTop - minY) * 0.15)
  // Use relative arch height: distance from floor (maxY) to midfoot underside
  let midfootUnderside = maxY
  for (let y = maxY; y >= minY; y--) {
    let dark = 0
    let n = 0
    for (let x = midX0; x < midX1; x++) {
      n++
      if (luminance(data, w, x, y) < 120) dark++
    }
    if (n && dark / n < 0.2) {
      // bright = gap
      midfootUnderside = y
    } else if (maxY - y > 4 && dark / n > 0.35) {
      break
    }
  }

  // Arch ratio: clearance under midfoot / foot height. Higher = higher arch.
  const clearance = Math.max(0, maxY - midfootUnderside)
  const sideArchRatio = clearance / footH

  let arch: ArchType = 'normal'
  let archConfidence = 0.55
  const notes: string[] = []

  if (sideArchRatio < 0.12) {
    arch = 'low'
    archConfidence = clamp(0.6 + (0.12 - sideArchRatio) * 2, 0.55, 0.88)
    notes.push('Side view shows limited midfoot clearance — often a lower arch.')
  } else if (sideArchRatio > 0.28) {
    arch = 'high'
    archConfidence = clamp(0.6 + (sideArchRatio - 0.28) * 1.5, 0.55, 0.88)
    notes.push('Side view shows a clearer midfoot rise — often a higher arch.')
  } else {
    arch = 'normal'
    archConfidence = 0.64
    notes.push('Side-view arch height looks in a typical mid range.')
  }

  notes.push(`Estimated arch clearance ratio: ${(sideArchRatio * 100).toFixed(0)}% of foot height.`)
  notes.push('Shoot from the inside of the foot, phone level with the ankle, full sole on the floor.')
  notes.push('This is a visual estimate only — not a medical diagnosis.')

  // Guides
  ctx.strokeStyle = 'rgba(163, 230, 53, 0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(midX0, minY)
  ctx.lineTo(midX0, maxY)
  ctx.moveTo(midX1, minY)
  ctx.lineTo(midX1, maxY)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'
  ctx.beginPath()
  ctx.moveTo(minX, maxY)
  ctx.lineTo(maxX, maxY)
  ctx.stroke()

  void gapHeight
  void archClearance

  return {
    arch,
    archConfidence,
    widthHint: 'standard',
    brightness: sampleBand(data, w, h, 0.3, 0.7).avg,
    notes,
    previewDataUrl: canvas.toDataURL('image/jpeg', 0.85),
    mode: 'side',
    sideArchRatio,
  }
}

function sampleWearZone(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  x0r: number,
  x1r: number,
  y0r: number,
  y1r: number,
) {
  const x0 = Math.floor(w * x0r)
  const x1 = Math.floor(w * x1r)
  const y0 = Math.floor(h * y0r)
  const y1 = Math.floor(h * y1r)
  let sum = 0
  let sumSq = 0
  let count = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const lum = luminance(data, w, x, y)
      sum += lum
      sumSq += lum * lum
      count++
    }
  }
  const avg = count ? sum / count : 128
  const variance = count ? sumSq / count - avg * avg : 0
  const contrast = Math.sqrt(Math.max(variance, 0)) / 128
  // Worn rubber often lighter + smoother (lower contrast)
  const wearScore = clamp(avg / 255 * 0.65 + (1 - clamp(contrast, 0, 1)) * 0.35, 0, 1)
  return { avg, wearScore }
}

function silhouetteBounds(data: Uint8ClampedArray, w: number, h: number) {
  let minX = w
  let maxX = 0
  let minY = h
  let maxY = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (luminance(data, w, x, y) < 118) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (minX > maxX) {
    return { minX: 0, maxX: w - 1, minY: 0, maxY: h - 1 }
  }
  return { minX, maxX, minY, maxY }
}

function horizontalDarkSpan(data: Uint8ClampedArray, w: number, h: number, y0r: number, y1r: number) {
  const y0 = Math.floor(h * y0r)
  const y1 = Math.floor(h * y1r)
  let minX = w
  let maxX = 0
  let hits = 0
  for (let y = y0; y < y1; y++) {
    for (let x = Math.floor(w * 0.1); x < Math.floor(w * 0.9); x++) {
      if (luminance(data, w, x, y) < 115) {
        hits++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
      }
    }
  }
  if (hits < 20) return 0.5
  return (maxX - minX) / w
}

function fallbackResult(message: string, mode: 'top-down' | 'side'): FootAnalysisResult {
  return {
    arch: 'normal',
    archConfidence: 0.4,
    widthHint: 'standard',
    brightness: 128,
    notes: [message, 'You can set arch type manually in the next step.'],
    mode,
  }
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
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

function sampleBand(data: Uint8ClampedArray, w: number, h: number, y0: number, y1: number) {
  const top = Math.floor(h * y0)
  const bottom = Math.floor(h * y1)
  const left = Math.floor(w * 0.2)
  const right = Math.floor(w * 0.8)
  let sum = 0
  let count = 0
  let dark = 0

  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      const lum = luminance(data, w, x, y)
      sum += lum
      count++
      if (lum < 110) dark++
    }
  }

  return {
    avg: count ? sum / count : 128,
    darkRatio: count ? dark / count : 0,
  }
}

function estimateWidth(data: Uint8ClampedArray, w: number, h: number): 'narrow' | 'standard' | 'wide' {
  const y0 = Math.floor(h * 0.18)
  const y1 = Math.floor(h * 0.35)
  let minX = w
  let maxX = 0
  let hits = 0

  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < w; x++) {
      if (luminance(data, w, x, y) < 120) {
        hits++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
      }
    }
  }

  if (hits < 30) return 'standard'
  const span = (maxX - minX) / w
  if (span > 0.62) return 'wide'
  if (span < 0.38) return 'narrow'
  return 'standard'
}

function luminance(data: Uint8ClampedArray, w: number, x: number, y: number) {
  const i = (y * w + x) * 4
  return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
}

function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, rw: number, rh: number) {
  ctx.strokeRect(x, y, rw, rh)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}
