import type { Shoe } from '../data/shoes'
import type { UserProfile } from './analysis'
import { recommendShoes } from './recommend'

export interface FitDimension {
  id: string
  label: string
  score: number // 0–100
}

/**
 * Recompute per-dimension scores for UI bars by isolating each weight
 * against a synthetic single-factor profile blend.
 */
export function getFitBreakdown(shoe: Shoe, profile: UserProfile): FitDimension[] {
  // Use full recommend pass and also derive dimension proxies from shoe attrs
  const full = recommendShoes(profile, 50).find((m) => m.shoe.id === shoe.id)
  const overall = full?.score ?? 50

  const archMap = {
    low: { low: 100, medium: 55, high: 15 },
    normal: { low: 55, medium: 100, high: 55 },
    high: { low: 15, medium: 60, high: 100 },
  } as const

  const stabMap = {
    over: { neutral: 25, stability: 100, 'motion-control': 90 },
    neutral: { neutral: 100, stability: 55, 'motion-control': 20 },
    under: { neutral: 100, stability: 35, 'motion-control': 10 },
  } as const

  const cushMap = {
    firm: { firm: 100, balanced: 55, max: 20 },
    balanced: { firm: 55, balanced: 100, max: 55 },
    max: { firm: 20, balanced: 60, max: 100 },
  } as const

  const surfaceScore = (() => {
    if (profile.surface === 'road') return shoe.surfaces.includes('road') ? 100 : 20
    if (profile.surface === 'trail') return shoe.surfaces.includes('trail') ? 100 : 15
    if (profile.surface === 'track')
      return shoe.surfaces.includes('track') || shoe.surfaces.includes('road') ? 95 : 20
    if (shoe.surfaces.includes('trail') && shoe.surfaces.includes('road')) return 100
    if (shoe.surfaces.includes('trail') || shoe.surfaces.includes('road')) return 70
    return 30
  })()

  const budgetScore = (() => {
    if (profile.budget === 'any') return 100
    if (profile.budget === shoe.priceBand) return 100
    if (profile.budget === 'mid' && shoe.priceBand === 'budget') return 75
    if (profile.budget === 'premium' && shoe.priceBand === 'mid') return 70
    if (profile.budget === 'budget' && shoe.priceBand === 'mid') return 35
    return 25
  })()

  const dims: FitDimension[] = [
    { id: 'arch', label: 'Arch fit', score: archMap[profile.arch][shoe.archSupport] },
    { id: 'gait', label: 'Gait support', score: stabMap[profile.pronation][shoe.stability] },
    { id: 'cushion', label: 'Cushion feel', score: cushMap[profile.cushion][shoe.cushion] },
    { id: 'surface', label: 'Surface', score: surfaceScore },
    { id: 'budget', label: 'Budget', score: budgetScore },
    { id: 'overall', label: 'Overall match', score: overall },
  ]

  return dims
}
