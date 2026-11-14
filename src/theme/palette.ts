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

export interface Ribbon {
  d: string
  width: number
  /** Desktop opacity; phones cap every ribbon at SWIRL_PHONE_OPACITY */
  opacity: number
  dotted?: boolean
}

/** Side-swirl ribbons (viewBox 0 0 260 900), shared by PageDecor and the contrast test. */
export const RIBBONS: Ribbon[] = [
  { d: 'M150 -40 C 40 120, 240 220, 120 360 S 20 560, 160 680 S 230 860, 90 960', width: 16, opacity: 0.55 },
  { d: 'M190 -40 C 80 140, 260 260, 150 390 S 60 590, 190 710 S 250 880, 130 980', width: 9, opacity: 0.7 },
  { d: 'M110 -40 C 10 110, 200 200, 90 330 S -10 530, 120 650 S 190 830, 50 940', width: 3, opacity: 0.25, dotted: true },
]

/** Ribbon colours per side, in RIBBONS order. */
export const SWIRL_SIDES = {
  left: ['#34D399', '#FDBA74', '#047857'],
  right: ['#FDBA74', '#34D399', '#F97316'],
} as const

export const SWIRL_PHONE_OPACITY = 0.3
