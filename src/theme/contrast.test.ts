import { describe, expect, it } from 'vitest'
import { blendOver, contrastRatio } from './contrast'
import { PALETTE as T, RIBBONS, SWIRL_PHONE_OPACITY, SWIRL_SIDES } from './palette'

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

  // Every ribbon PageDecor draws, at desktop opacity and at the phone cap
  const strokes = (['left', 'right'] as const).flatMap((side) =>
    RIBBONS.map((r, i) => ({ colour: SWIRL_SIDES[side][i], opacity: r.opacity, dotted: !!r.dotted })),
  )
  const phone = (o: number) => Math.min(o, SWIRL_PHONE_OPACITY)

  it.each(strokes.map((s) => [`${s.colour} @ ${s.opacity}`, s] as const))(
    'muted text stays readable over ribbon %s (desktop and phone)',
    (_name, s) => {
      for (const o of [s.opacity, phone(s.opacity)]) {
        expect(contrastRatio(T.muted, blendOver(s.colour, o, T.bg))).toBeGreaterThanOrEqual(4.5)
      }
    },
  )

  it('muted text stays readable where the two solid ribbons cross (desktop and phone)', () => {
    for (const side of ['left', 'right'] as const) {
      const solid = RIBBONS.map((r, i) => ({ ...r, colour: SWIRL_SIDES[side][i] })).filter((r) => !r.dotted)
      for (const cap of [(o: number) => o, phone]) {
        const under = solid.reduce((bg, r) => blendOver(r.colour, cap(r.opacity), bg), T.bg as string)
        expect(contrastRatio(T.muted, under)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('measures known WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
  })
})
