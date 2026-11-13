import { describe, expect, it } from 'vitest'
import { blendOver, contrastRatio } from './contrast'
import { PALETTE as T, SWIRL_MAX_OPACITY, SWIRL_PHONE_OPACITY, SWIRL_STROKES } from './palette'

describe('palette contrast', () => {
  it.each([
    ['text on bg', T.text, T.bg, 4.5],
    ['text on panel', T.text, T.panel, 4.5],
    ['muted on panel', T.muted, T.panel, 4.5],
    ['muted on soft', T.muted, T.soft, 4.5],
    ['white on accent', '#FFFFFF', T.accent, 4.5],
    ['accent-text on bg', T.accentText, T.bg, 4.5],
    ['accent-text on accent-dim', T.accentText, T.accentDim, 4.5],
    ['nav on bg', T.nav, T.bg, 4.5],
    ['danger on bg', T.danger, T.bg, 4.5],
    ['secondary btn text', T.accent2Ink, T.accent2Soft, 4.5],
    ['secondary btn border', T.accent2Border, T.bg, 3],
    ['bar fill on panel', T.accent2, T.panel, 3],
  ])('%s', (_name, fg, bg, min) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min)
  })

  it('muted text stays readable over the strongest phone swirl stroke', () => {
    for (const stroke of SWIRL_STROKES) {
      const under = blendOver(stroke, SWIRL_PHONE_OPACITY, T.bg)
      expect(contrastRatio(T.muted, under)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('muted text stays readable over the strongest desktop swirl stroke', () => {
    for (const stroke of SWIRL_STROKES) {
      const under = blendOver(stroke, SWIRL_MAX_OPACITY, T.bg)
      expect(contrastRatio(T.muted, under)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('measures known WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
  })
})
