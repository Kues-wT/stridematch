import type { Shoe } from '../data/shoes'
import type { UserProfile } from './analysis'
import { recommendShoes } from './recommend'

export interface FitDimension {
  id: string
  label: string
  score: number // 0–100
}

/**
 * UI fit bars — calibrated so “perfect” 100s are rare.
 * Exact category matches top out ~90–94; near matches sit lower.
 * Inspired by lab-style nuance (e.g. RunRepeat “moderate stability”) rather than binary yes/no.
 */
export function getFitBreakdown(shoe: Shoe, profile: UserProfile): FitDimension[] {
  const full = recommendShoes(profile, shoesLimit()).find((m) => m.shoe.id === shoe.id)
  const overall = full?.score ?? 50

  // Cap exact matches below 100 so multiple bars don’t all read “perfect”
  const archMap = {
    low: { low: 93, medium: 62, high: 22 },
    normal: { low: 58, medium: 92, high: 58 },
    high: { low: 22, medium: 64, high: 93 },
  } as const

  // Mild/guide stability scores high for overpronation but not always max
  const stabMap = {
    over: { neutral: 32, stability: 91, 'motion-control': 88 },
    neutral: { neutral: 90, stability: 52, 'motion-control': 28 },
    under: { neutral: 91, stability: 38, 'motion-control': 18 },
  } as const

  const cushMap = {
    firm: { firm: 92, balanced: 58, max: 28 },
    balanced: { firm: 55, balanced: 90, max: 62 },
    max: { firm: 26, balanced: 64, max: 93 },
  } as const

  const surfaceScore = (() => {
    if (profile.surface === 'road') {
      if (!shoe.surfaces.includes('road')) return 18
      // Dedicated road slightly higher than road+gym hybrid
      if (shoe.surfaces.length === 1) return 90
      return 84
    }
    if (profile.surface === 'trail') {
      if (!shoe.surfaces.includes('trail')) return 16
      return shoe.surfaces.length === 1 ? 91 : 82
    }
    if (profile.surface === 'track') {
      if (shoe.surfaces.includes('track')) return 92
      if (shoe.surfaces.includes('road')) return 72
      return 20
    }
    // mixed
    if (shoe.surfaces.includes('trail') && shoe.surfaces.includes('road')) return 90
    if (shoe.surfaces.includes('trail') || shoe.surfaces.includes('road')) return 68
    return 28
  })()

  const budgetScore = (() => {
    if (profile.budget === 'any') return 76 // don’t free-perfect everyone
    if (profile.budget === shoe.priceBand) return 88
    if (profile.budget === 'mid' && shoe.priceBand === 'budget') return 70
    if (profile.budget === 'premium' && shoe.priceBand === 'mid') return 66
    if (profile.budget === 'budget' && shoe.priceBand === 'mid') return 38
    if (profile.budget === 'mid' && shoe.priceBand === 'premium') return 42
    return 24
  })()

  // Soft penalty when shoe is a racer and user is beginner, etc. (shows on overall mainly)
  let arch: number = archMap[profile.arch][shoe.archSupport]
  let gait: number = stabMap[profile.pronation][shoe.stability]
  let cushion: number = cushMap[profile.cushion][shoe.cushion]

  // Wide preference: tiny nudge on arch bar if width fights the shoe
  if (profile.widthHint === 'wide' && shoe.width === 'standard') {
    arch = Math.max(18, arch - 6)
  }
  if (profile.widthHint === 'narrow' && shoe.width === 'wide') {
    arch = Math.max(18, arch - 4)
  }

  // Beginners + firm light racers: cushion/gait feel less ideal
  if (
    profile.experience === 'beginner' &&
    shoe.cushion === 'firm' &&
    shoe.weightG < 230 &&
    shoe.stability === 'neutral'
  ) {
    cushion = Math.min(cushion, 48)
    gait = Math.min(gait, 70)
  }

  const dims: FitDimension[] = [
    { id: 'arch', label: 'Arch fit', score: arch },
    { id: 'gait', label: 'Gait support', score: gait },
    { id: 'cushion', label: 'Cushion feel', score: cushion },
    { id: 'surface', label: 'Surface', score: surfaceScore },
    { id: 'budget', label: 'Budget', score: budgetScore },
    { id: 'overall', label: 'Overall match', score: overall },
  ]

  return dims
}

function shoesLimit() {
  // score all shoes for breakdown lookup
  return 200
}
