import type { ArchType } from '../analysis'
import { boxBlur, components, otsu, sharpness, type Gray, type Point } from './image'

/**
 * Chippaux-Smirak index (CSI) = narrowest midfoot print width ÷ widest forefoot print width.
 * Published cut-offs vary between studies; ≥45% for flat/low arches is the most widely used,
 * and a broken or very thin midfoot print marks a high arch.
 */
export const CSI_HIGH_BELOW = 0.25
export const CSI_LOW_FROM = 0.45

export type ScanIssueCode =
  | 'low-contrast'
  | 'not-found'
  | 'cut-off'
  | 'too-small'
  | 'not-foot-shape'
  | 'blurry'
  | 'no-paper'
  | 'paper-cut-off'
  | 'toes-off-paper'
  | 'side-off-paper'

export interface ScanIssue {
  code: ScanIssueCode
  /** Blocking issues mean the numbers are not trustworthy — ask for a retake. */
  blocking: boolean
}

export interface OverlayLine {
  from: Point
  to: Point
  kind: 'axis' | 'forefoot' | 'midfoot' | 'length' | 'paper'
}

export interface FootprintScan {
  ok: boolean
  issues: ScanIssue[]
  csi?: number
  arch?: ArchType
  confidence?: number
  lengthPx?: number
  forefootWidthPx?: number
  midfootWidthPx?: number
  overlay: OverlayLine[]
}

const BINS = 60
const BLUR_LIMIT = 6

export function classifyCsi(csi: number): { arch: ArchType; confidence: number } {
  if (csi < CSI_HIGH_BELOW) {
    const dist = CSI_HIGH_BELOW - csi
    return { arch: 'high', confidence: Math.min(0.9, 0.62 + dist * 1.5) }
  }
  if (csi >= CSI_LOW_FROM) {
    const dist = csi - CSI_LOW_FROM
    return { arch: 'low', confidence: Math.min(0.9, 0.62 + dist * 1.5) }
  }
  const dist = Math.min(csi - CSI_HIGH_BELOW, CSI_LOW_FROM - csi)
  return { arch: 'normal', confidence: Math.min(0.88, 0.6 + dist * 2.2) }
}

/**
 * Measure a wet footprint photographed from above. The print must be darker than the
 * surface it is on (wet sole on brown paper, cardboard or dry concrete).
 */
export function scanFootprint(input: Gray): FootprintScan {
  const issues: ScanIssue[] = []
  const gray = boxBlur(input)
  const { width: w, height: h } = gray
  const total = w * h

  if (sharpness(input) < BLUR_LIMIT) issues.push({ code: 'blurry', blocking: false })

  const { threshold, darkMean, brightMean } = otsu(gray)
  if (brightMean - darkMean < 22) {
    issues.push({ code: 'low-contrast', blocking: true })
    return { ok: false, issues, overlay: [] }
  }

  const mask = new Uint8Array(total)
  for (let i = 0; i < total; i++) mask[i] = gray.data[i] <= threshold ? 1 : 0

  // Skip dark regions that span the whole frame (shadows, floor edges) — the print sits inside the photo.
  const comps = components(mask, w, h, Math.round(total * 0.004)).filter(
    (c) => !(c.maxX - c.minX >= w - 2 || c.maxY - c.minY >= h - 2),
  )
  const main = comps[0]
  if (!main) {
    issues.push({ code: 'not-found', blocking: true })
    return { ok: false, issues, overlay: [] }
  }
  if (main.area < total * 0.02) {
    issues.push({ code: 'too-small', blocking: true })
    return { ok: false, issues, overlay: [] }
  }

  // A high arch can split the print into heel + forefoot blobs. Toes are far smaller, so the size filter skips them.
  const parts = [main]
  const second = comps[1]
  if (second && second.area >= main.area * 0.2) parts.push(second)

  const touchesEdge = parts.some((c) => c.minX <= 1 || c.minY <= 1 || c.maxX >= w - 2 || c.maxY >= h - 2)
  if (touchesEdge) issues.push({ code: 'cut-off', blocking: true })

  // Principal axis of the print
  let n = 0
  let mx = 0
  let my = 0
  for (const c of parts) {
    for (const i of c.pixels) {
      mx += i % w
      my += Math.floor(i / w)
      n++
    }
  }
  mx /= n
  my /= n
  let cxx = 0
  let cyy = 0
  let cxy = 0
  for (const c of parts) {
    for (const i of c.pixels) {
      const dx = (i % w) - mx
      const dy = Math.floor(i / w) - my
      cxx += dx * dx
      cyy += dy * dy
      cxy += dx * dy
    }
  }
  const theta = 0.5 * Math.atan2(2 * cxy, cxx - cyy)
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)

  let uMin = Infinity
  let uMax = -Infinity
  const us = new Float32Array(n)
  const vs = new Float32Array(n)
  let k = 0
  for (const c of parts) {
    for (const i of c.pixels) {
      const dx = (i % w) - mx
      const dy = Math.floor(i / w) - my
      const u = dx * cos + dy * sin
      const v = -dx * sin + dy * cos
      us[k] = u
      vs[k] = v
      k++
      if (u < uMin) uMin = u
      if (u > uMax) uMax = u
    }
  }
  const length = uMax - uMin
  const vMin = new Float32Array(BINS).fill(Infinity)
  const vMax = new Float32Array(BINS).fill(-Infinity)
  for (let j = 0; j < n; j++) {
    const b = Math.min(BINS - 1, Math.floor(((us[j] - uMin) / length) * BINS))
    if (vs[j] < vMin[b]) vMin[b] = vs[j]
    if (vs[j] > vMax[b]) vMax[b] = vs[j]
  }
  let widths = Array.from({ length: BINS }, (_, b) => (vMax[b] >= vMin[b] ? vMax[b] - vMin[b] + 1 : 0))
  let lo = Array.from(vMin)
  let hi = Array.from(vMax)

  // Orient heel → toes: the forefoot end is the wider one.
  const band = (from: number, to: number) => {
    const slice = widths.slice(Math.floor(BINS * from), Math.ceil(BINS * to))
    return slice.reduce((a, b) => a + b, 0) / Math.max(slice.length, 1)
  }
  const flipped = band(0.05, 0.3) > band(0.7, 0.95)
  if (flipped) {
    widths = widths.reverse()
    lo = lo.reverse()
    hi = hi.reverse()
  }

  const range = (from: number, to: number) =>
    Array.from({ length: Math.ceil(BINS * to) - Math.floor(BINS * from) }, (_, j) => Math.floor(BINS * from) + j)

  const foreBin = range(0.55, 0.9).reduce((best, b) => (widths[b] > widths[best] ? b : best), Math.floor(BINS * 0.55))
  const midBin = range(0.3, 0.6).reduce((best, b) => (widths[b] < widths[best] ? b : best), Math.floor(BINS * 0.3))
  const forefoot = widths[foreBin]
  const midfoot = widths[midBin]

  const aspect = length / Math.max(forefoot, 1)
  if (aspect < 1.9 || aspect > 4.8) issues.push({ code: 'not-foot-shape', blocking: true })

  const csi = midfoot / Math.max(forefoot, 1)
  const { arch, confidence } = classifyCsi(csi)

  // Lines in image coordinates for the preview overlay
  const toImage = (u: number, v: number): Point => ({ x: mx + u * cos - v * sin, y: my + u * sin + v * cos })
  const binU = (b: number) => {
    const t = (b + 0.5) / BINS
    return flipped ? uMax - t * length : uMin + t * length
  }
  const crossLine = (b: number, kind: OverlayLine['kind']): OverlayLine => {
    const u = binU(b)
    const vLo = Number.isFinite(lo[b]) ? lo[b] : 0
    const vHi = Number.isFinite(hi[b]) ? hi[b] : 0
    return { from: toImage(u, vLo), to: toImage(u, vHi), kind }
  }
  const overlay: OverlayLine[] = [
    { from: toImage(uMin, 0), to: toImage(uMax, 0), kind: 'axis' },
    crossLine(foreBin, 'forefoot'),
    crossLine(midBin, 'midfoot'),
  ]

  const blocking = issues.some((i) => i.blocking)
  return {
    ok: !blocking,
    issues,
    csi,
    arch,
    confidence: issues.some((i) => i.code === 'blurry') ? confidence * 0.85 : confidence,
    lengthPx: length,
    forefootWidthPx: forefoot,
    midfootWidthPx: midfoot,
    overlay,
  }
}
