import { applyHomography, boxBlur, components, homography, otsu, sample, sharpness, type Gray, type Point } from './image'
import type { OverlayLine, ScanIssue } from './footprint'

/** ISO 216 A4 */
export const A4_SHORT_MM = 210
export const A4_LONG_MM = 297

/** Forefoot width ÷ foot length cut-offs (adult feet average ~0.38–0.39). */
export const WIDTH_NARROW_BELOW = 0.36
export const WIDTH_WIDE_FROM = 0.405

const PX_PER_MM = 2
const BLUR_LIMIT = 6

export interface ShoeSizeEstimate {
  eu: number
  ukMen: number
  usMen: number
  usWomen: number
}

export interface SizeScan {
  ok: boolean
  issues: ScanIssue[]
  lengthMm?: number
  widthMm?: number
  widthClass?: 'narrow' | 'standard' | 'wide'
  size?: ShoeSizeEstimate
  /** Paper corners in image pixels (TL, TR, BR, BL) */
  corners?: Point[]
  overlay: OverlayLine[]
}

const half = (n: number) => Math.round(n * 2) / 2

/**
 * Foot length → shoe size. EU uses Paris points on foot length + 1.5 cm allowance;
 * US/UK follow the common running-brand chart (27.0 cm ≈ US M 9, 1/3 inch per size).
 */
export function sizeFromLength(lengthMm: number): ShoeSizeEstimate {
  const cm = lengthMm / 10
  const usMen = half(9 + (cm - 27) / 0.847)
  return {
    eu: half(1.5 * (cm + 1.5) - 0.25),
    ukMen: usMen - 1,
    usMen,
    usWomen: usMen + 1.5,
  }
}

export function widthClassFor(widthMm: number, lengthMm: number): 'narrow' | 'standard' | 'wide' {
  const ratio = widthMm / lengthMm
  if (ratio < WIDTH_NARROW_BELOW) return 'narrow'
  if (ratio >= WIDTH_WIDE_FROM) return 'wide'
  return 'standard'
}

/** Paper corners from the bright blob's extreme points: TL, TR, BR, BL. */
function paperCorners(pixels: Int32Array, width: number): Point[] {
  let tl = { x: 0, y: 0, s: Infinity }
  let br = { x: 0, y: 0, s: -Infinity }
  let tr = { x: 0, y: 0, s: -Infinity }
  let bl = { x: 0, y: 0, s: Infinity }
  for (const i of pixels) {
    const x = i % width
    const y = (i - x) / width
    const sum = x + y
    const diff = x - y
    if (sum < tl.s) tl = { x, y, s: sum }
    if (sum > br.s) br = { x, y, s: sum }
    if (diff > tr.s) tr = { x, y, s: diff }
    if (diff < bl.s) bl = { x, y, s: diff }
  }
  return [tl, tr, br, bl].map(({ x, y }) => ({ x, y }))
}

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * Measure a foot standing on a sheet of white A4 paper (on a darker floor), photographed
 * from above. The paper gives real millimetres and lets us undo the camera tilt.
 */
export function scanFootOnPaper(input: Gray): SizeScan {
  const issues: ScanIssue[] = []
  const gray = boxBlur(input)
  const { width: w, height: h } = gray
  const total = w * h

  if (sharpness(input) < BLUR_LIMIT) issues.push({ code: 'blurry', blocking: false })

  const { threshold, darkMean, brightMean } = otsu(gray)
  if (brightMean - darkMean < 22) {
    // Without contrast there is no white sheet to find
    issues.push({ code: 'no-paper', blocking: true })
    return { ok: false, issues, overlay: [] }
  }

  const bright = new Uint8Array(total)
  for (let i = 0; i < total; i++) bright[i] = gray.data[i] > threshold ? 1 : 0
  const paper = components(bright, w, h, Math.round(total * 0.05))[0]
  if (!paper || paper.area < total * 0.1) {
    issues.push({ code: 'no-paper', blocking: true })
    return { ok: false, issues, overlay: [] }
  }
  if (paper.minX <= 1 || paper.minY <= 1 || paper.maxX >= w - 2 || paper.maxY >= h - 2) {
    issues.push({ code: 'paper-cut-off', blocking: true })
    return { ok: false, issues, overlay: [] }
  }

  const corners = paperCorners(paper.pixels, w)
  const [tl, tr, br, bl] = corners
  const vertical = (dist(tl, bl) + dist(tr, br)) / 2
  const horizontal = (dist(tl, tr) + dist(bl, br)) / 2
  const sideRatio = Math.max(vertical, horizontal) / Math.max(Math.min(vertical, horizontal), 1)
  if (sideRatio > 2.4 || Math.min(vertical, horizontal) < 20) {
    issues.push({ code: 'no-paper', blocking: true })
    return { ok: false, issues, overlay: [] }
  }

  // Rectified sheet with the long side running top → bottom
  const portrait = vertical >= horizontal
  const rw = A4_SHORT_MM * PX_PER_MM
  const rh = A4_LONG_MM * PX_PER_MM
  const target = portrait
    ? [{ x: 0, y: 0 }, { x: rw, y: 0 }, { x: rw, y: rh }, { x: 0, y: rh }]
    : [{ x: 0, y: rh }, { x: 0, y: 0 }, { x: rw, y: 0 }, { x: rw, y: rh }]
  const H = homography(target, corners)
  if (!H) {
    issues.push({ code: 'no-paper', blocking: true })
    return { ok: false, issues, overlay: [] }
  }

  const rect: Gray = { width: rw, height: rh, data: new Float32Array(rw * rh) }
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const p = applyHomography(H, { x: x + 0.5, y: y + 0.5 })
      rect.data[y * rw + x] = sample(input, p.x, p.y)
    }
  }

  // Foot = darker than the paper. Ignore a thin rim where corner detection is least exact.
  const rim = Math.round(1.5 * PX_PER_MM)
  const local = otsu(rect)
  const footMask = new Uint8Array(rw * rh)
  for (let y = rim; y < rh - rim; y++) {
    for (let x = rim; x < rw - rim; x++) {
      footMask[y * rw + x] = rect.data[y * rw + x] <= local.threshold ? 1 : 0
    }
  }
  const foot = components(footMask, rw, rh, Math.round(rw * rh * 0.02))[0]
  if (!foot || local.brightMean - local.darkMean < 20) {
    issues.push({ code: 'not-found', blocking: true })
    return { ok: false, issues, corners, overlay: paperOverlay(corners) }
  }

  const edge = 4 * PX_PER_MM
  const nearTop = foot.minY <= rim + edge
  const nearBottom = foot.maxY >= rh - rim - edge
  if (nearTop && nearBottom) issues.push({ code: 'toes-off-paper', blocking: true })

  // Heel against one short edge (the guided setup): measure from that edge. Otherwise use the print extent.
  let heelY: number
  let toeY: number
  if (nearBottom && !nearTop) {
    heelY = rh
    toeY = foot.minY
  } else if (nearTop && !nearBottom) {
    heelY = 0
    toeY = foot.maxY + 1
  } else {
    heelY = foot.maxY + 1
    toeY = foot.minY
  }
  const lengthMm = Math.abs(heelY - toeY) / PX_PER_MM

  // Widest row across the ball of the foot (50–85% of the way from heel to toe)
  const rowMin = new Int32Array(rh).fill(rw)
  const rowMax = new Int32Array(rh).fill(-1)
  for (const i of foot.pixels) {
    const x = i % rw
    const y = (i - x) / rw
    if (x < rowMin[y]) rowMin[y] = x
    if (x > rowMax[y]) rowMax[y] = x
  }
  const at = (t: number) => Math.round(heelY + (toeY - heelY) * t)
  const yA = Math.min(at(0.5), at(0.85))
  const yB = Math.max(at(0.5), at(0.85))
  let widest = 0
  let widestY = yA
  for (let y = Math.max(0, yA); y <= Math.min(rh - 1, yB); y++) {
    if (rowMax[y] < 0) continue
    const span = rowMax[y] - rowMin[y] + 1
    if (span > widest) {
      widest = span
      widestY = y
    }
  }
  const widthMm = widest / PX_PER_MM
  if (rowMin[widestY] <= rim + 2 || rowMax[widestY] >= rw - rim - 3) {
    issues.push({ code: 'side-off-paper', blocking: true })
  }

  if (lengthMm < 150 || lengthMm > 320 || widthMm < 55 || widthMm > 135) {
    issues.push({ code: 'not-foot-shape', blocking: true })
  }

  // Overlay: map rectified measurements back into the photo
  const back = (x: number, y: number) => applyHomography(H, { x, y })
  const midX = rw / 2
  const overlay: OverlayLine[] = [
    ...paperOverlay(corners),
    { from: back(midX, heelY), to: back(midX, toeY), kind: 'length' },
    { from: back(rowMin[widestY], widestY), to: back(rowMax[widestY] + 1, widestY), kind: 'forefoot' },
  ]

  const blocking = issues.some((i) => i.blocking)
  return {
    ok: !blocking,
    issues,
    lengthMm,
    widthMm,
    widthClass: widthClassFor(widthMm, lengthMm),
    size: sizeFromLength(lengthMm),
    corners,
    overlay,
  }
}

function paperOverlay(corners: Point[]): OverlayLine[] {
  return corners.map((c, i) => ({ from: c, to: corners[(i + 1) % 4], kind: 'paper' as const }))
}
