import { describe, expect, it } from 'vitest'
import { applyHomography, homography, type Gray, type Homography } from './image'
import { classifyCsi, scanFootprint } from './footprint'
import { A4_LONG_MM, A4_SHORT_MM, scanFootOnPaper, sizeFromLength, widthClassFor } from './sizing'

/** Deterministic noise so tests never flake */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/**
 * Synthetic wet footprint: heel, a lateral midfoot band of width `mid`, a forefoot of width `fore`.
 * Expected CSI ≈ mid / fore.
 */
function footprint({
  mid,
  fore = 90,
  length = 260,
  angleDeg = 0,
  w = 420,
  h = 520,
  flip = false,
  cx = w / 2,
  cy = h / 2,
}: {
  mid: number
  fore?: number
  length?: number
  angleDeg?: number
  w?: number
  h?: number
  flip?: boolean
  cx?: number
  cy?: number
}): Gray {
  const rand = rng(42)
  const data = new Float32Array(w * h)
  const a = (angleDeg * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx
      const dy = y - cy
      let u = dx * cos + dy * sin + length / 2 // 0 = heel
      const v = -dx * sin + dy * cos
      if (flip) u = length - u
      const t = u / length
      let inside = false
      if (t >= 0 && t <= 1) {
        const lateral = -fore / 2
        if (t < 0.28) {
          const heelW = fore * 0.68
          inside = Math.abs(v - (lateral + fore * 0.4)) <= heelW / 2
        } else if (t < 0.58) {
          inside = mid > 0 && v >= lateral && v <= lateral + mid
        } else if (t < 0.88) {
          inside = v >= lateral && v <= lateral + fore
        } else {
          const taper = fore * (1 - (t - 0.88) / 0.12) * 0.9
          inside = v >= lateral && v <= lateral + taper
        }
      }
      data[y * w + x] = (inside ? 70 : 175) + (rand() - 0.5) * 30
    }
  }
  return { width: w, height: h, data }
}

/** A4 sheet seen with perspective, foot of known size standing with the heel on the bottom edge. */
function footOnPaper({
  lengthMm,
  widthMm,
  corners,
  w = 900,
  h = 1100,
  heelGapMm = 0,
}: {
  lengthMm: number
  widthMm: number
  corners: { x: number; y: number }[]
  w?: number
  h?: number
  heelGapMm?: number
}): Gray {
  const rand = rng(7)
  const mmCorners = [
    { x: 0, y: 0 },
    { x: A4_SHORT_MM, y: 0 },
    { x: A4_SHORT_MM, y: A4_LONG_MM },
    { x: 0, y: A4_LONG_MM },
  ]
  const toMm = homography(corners, mmCorners) as Homography
  const data = new Float32Array(w * h)
  const heelY = A4_LONG_MM - heelGapMm
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = applyHomography(toMm, { x, y })
      let v = 55 // floor
      if (p.x >= 0 && p.x <= A4_SHORT_MM && p.y >= 0 && p.y <= A4_LONG_MM) {
        v = 228 // paper
        const t = (heelY - p.y) / lengthMm // 0 heel → 1 toe
        if (t >= 0 && t <= 1) {
          // Width profile: heel ~65%, ball of foot = full width at ~70%, rounded toes
          const profile = t < 0.3 ? 0.65 + t * 0.4 : t < 0.7 ? 0.77 + (t - 0.3) * 0.575 : 1 - ((t - 0.7) / 0.3) ** 2 * 0.6
          const half = (widthMm * profile) / 2
          if (Math.abs(p.x - A4_SHORT_MM / 2) <= half) v = 150 // skin
        }
      }
      data[y * w + x] = v + (rand() - 0.5) * 24
    }
  }
  return { width: w, height: h, data }
}

describe('arch index classification', () => {
  it('uses the published cut-offs', () => {
    expect(classifyCsi(0).arch).toBe('high')
    expect(classifyCsi(0.2).arch).toBe('high')
    expect(classifyCsi(0.35).arch).toBe('normal')
    expect(classifyCsi(0.5).arch).toBe('low')
    expect(classifyCsi(0.8).arch).toBe('low')
  })
})

describe('scanFootprint', () => {
  it('measures a normal arch close to the true index', () => {
    const scan = scanFootprint(footprint({ mid: 32 }))
    expect(scan.ok).toBe(true)
    expect(scan.csi!).toBeGreaterThan(0.3)
    expect(scan.csi!).toBeLessThan(0.42)
    expect(scan.arch).toBe('normal')
  })

  it('flags a flat foot', () => {
    const scan = scanFootprint(footprint({ mid: 62 }))
    expect(scan.ok).toBe(true)
    expect(scan.arch).toBe('low')
  })

  it('flags a high arch when the print breaks at the midfoot', () => {
    const scan = scanFootprint(footprint({ mid: 0 }))
    expect(scan.ok).toBe(true)
    expect(scan.csi!).toBeLessThan(0.1)
    expect(scan.arch).toBe('high')
  })

  it('gives the same answer when the print is rotated or upside down', () => {
    const straight = scanFootprint(footprint({ mid: 32 })).csi!
    const rotated = scanFootprint(footprint({ mid: 32, angleDeg: 35 })).csi!
    const flipped = scanFootprint(footprint({ mid: 32, flip: true, angleDeg: -20 })).csi!
    expect(Math.abs(rotated - straight)).toBeLessThan(0.06)
    expect(Math.abs(flipped - straight)).toBeLessThan(0.06)
  })

  it('asks for a retake when the print runs off the photo', () => {
    const scan = scanFootprint(footprint({ mid: 32, cx: 60 }))
    expect(scan.ok).toBe(false)
    expect(scan.issues.map((i) => i.code)).toContain('cut-off')
  })

  it('asks for a retake on a blank, low-contrast photo', () => {
    const blank: Gray = { width: 200, height: 200, data: new Float32Array(200 * 200).fill(120) }
    const scan = scanFootprint(blank)
    expect(scan.ok).toBe(false)
    expect(scan.issues.map((i) => i.code)).toContain('low-contrast')
  })
})

describe('scanFootOnPaper', () => {
  const straight = [
    { x: 240, y: 150 },
    { x: 660, y: 150 },
    { x: 660, y: 744 },
    { x: 240, y: 744 },
  ]
  // Phone tilted: far edge of the sheet looks narrower, sheet slightly rotated
  const tilted = [
    { x: 300, y: 170 },
    { x: 640, y: 190 },
    { x: 720, y: 900 },
    { x: 190, y: 870 },
  ]

  it('measures foot length and width to within a few millimetres', () => {
    const scan = scanFootOnPaper(footOnPaper({ lengthMm: 265, widthMm: 100, corners: straight }))
    expect(scan.ok).toBe(true)
    expect(Math.abs(scan.lengthMm! - 265)).toBeLessThan(4)
    expect(Math.abs(scan.widthMm! - 100)).toBeLessThan(4)
  })

  it('undoes camera tilt using the paper corners', () => {
    const scan = scanFootOnPaper(footOnPaper({ lengthMm: 245, widthMm: 96, corners: tilted }))
    expect(scan.ok).toBe(true)
    expect(Math.abs(scan.lengthMm! - 245)).toBeLessThan(5)
    expect(Math.abs(scan.widthMm! - 96)).toBeLessThan(5)
  })

  it('still measures when the heel is not quite on the edge', () => {
    const scan = scanFootOnPaper(footOnPaper({ lengthMm: 255, widthMm: 98, corners: straight, heelGapMm: 12 }))
    expect(scan.ok).toBe(true)
    expect(Math.abs(scan.lengthMm! - 255)).toBeLessThan(4)
  })

  it('reports when the sheet is cut off by the frame', () => {
    const cut = [
      { x: 240, y: -40 },
      { x: 660, y: -40 },
      { x: 660, y: 560 },
      { x: 240, y: 560 },
    ]
    const scan = scanFootOnPaper(footOnPaper({ lengthMm: 265, widthMm: 100, corners: cut }))
    expect(scan.ok).toBe(false)
    expect(scan.issues.map((i) => i.code)).toContain('paper-cut-off')
  })
})

describe('size conversion', () => {
  it('matches the common running-brand chart', () => {
    expect(sizeFromLength(270)).toMatchObject({ usMen: 9, ukMen: 8, usWomen: 10.5, eu: 42.5 })
    expect(sizeFromLength(250).usMen).toBe(6.5)
    expect(sizeFromLength(290).usMen).toBe(11.5)
  })

  it('classifies width relative to length', () => {
    expect(widthClassFor(92, 265)).toBe('narrow')
    expect(widthClassFor(100, 265)).toBe('standard')
    expect(widthClassFor(110, 265)).toBe('wide')
  })
})
