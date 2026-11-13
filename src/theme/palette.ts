/**
 * Tropical trail palette — the same values as the `:root` tokens in index.css.
 * Kept here so the contrast test and the page decoration read one source.
 */
export const PALETTE = {
  bg: '#F3FBF6',
  panel: '#FFFFFF',
  soft: '#E8F5EE',
  text: '#12261C',
  muted: '#3F5248',
  accent: '#047857',
  accentDim: '#D1FAE5',
  accentText: '#065F46',
  accent2: '#EA580C',
  accent2Soft: '#FED7AA',
  accent2Ink: '#7C2D12',
  accent2Border: '#C2410C',
  danger: '#B91C1C',
  nav: '#2D3734',
  barTrack: '#B7C9BE',
} as const

/** Side-swirl stroke colours (mint, mango) and the opacity they drop to on phones. */
export const SWIRL_STROKES = ['#34D399', '#FDBA74'] as const
export const SWIRL_PHONE_OPACITY = 0.3
