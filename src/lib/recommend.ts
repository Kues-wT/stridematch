import { shoes, type Shoe, type Stability } from '../data/shoes'
import type { UserProfile } from './analysis'

export interface MatchReason {
  label: string
  detail: string
}

export interface ShoeMatch {
  shoe: Shoe
  score: number
  reasons: MatchReason[]
}

const ARCH_SUPPORT_MAP = {
  low: { low: 1, medium: 0.55, high: 0.15 },
  normal: { low: 0.55, medium: 1, high: 0.55 },
  high: { low: 0.15, medium: 0.6, high: 1 },
} as const

const PRONATION_STABILITY: Record<UserProfile['pronation'], Record<Stability, number>> = {
  over: { neutral: 0.25, stability: 1, 'motion-control': 0.9 },
  neutral: { neutral: 1, stability: 0.55, 'motion-control': 0.2 },
  under: { neutral: 1, stability: 0.35, 'motion-control': 0.1 },
}

const CUSHION_MAP = {
  firm: { firm: 1, balanced: 0.55, max: 0.2 },
  balanced: { firm: 0.55, balanced: 1, max: 0.55 },
  max: { firm: 0.2, balanced: 0.6, max: 1 },
} as const

const DISTANCE_CUSHION_BIAS = {
  short: { firm: 0.9, balanced: 1, max: 0.7 },
  moderate: { firm: 0.6, balanced: 1, max: 0.9 },
  long: { firm: 0.3, balanced: 0.75, max: 1 },
} as const

export function recommendShoes(profile: UserProfile, limit = 5): ShoeMatch[] {
  return shoes
    .map((shoe) => scoreShoe(shoe, profile))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function scoreShoe(shoe: Shoe, profile: UserProfile): ShoeMatch {
  const reasons: MatchReason[] = []
  let total = 0
  let weightSum = 0

  // Arch (25%)
  const archScore = ARCH_SUPPORT_MAP[profile.arch][shoe.archSupport]
  total += archScore * 25
  weightSum += 25
  if (archScore >= 0.9) {
    reasons.push({
      label: 'Arch support',
      detail: `Built for ${shoe.archSupport} arch support — matches your ${profile.arch} arch profile.`,
    })
  } else if (archScore >= 0.5) {
    reasons.push({
      label: 'Arch support',
      detail: `Offers ${shoe.archSupport} support, a workable fit for ${profile.arch} arches.`,
    })
  }

  // Pronation / stability (25%)
  const stabScore = PRONATION_STABILITY[profile.pronation][shoe.stability]
  total += stabScore * 25
  weightSum += 25
  if (stabScore >= 0.85) {
    reasons.push({
      label: 'Gait support',
      detail: stabilityCopy(profile.pronation, shoe.stability),
    })
  }

  // Cushion + distance (20%)
  const cushionPref = CUSHION_MAP[profile.cushion][shoe.cushion]
  const distanceBias = DISTANCE_CUSHION_BIAS[profile.weeklyDistance][shoe.cushion]
  const cushionScore = cushionPref * 0.65 + distanceBias * 0.35
  total += cushionScore * 20
  weightSum += 20
  if (cushionScore >= 0.75) {
    reasons.push({
      label: 'Cushion & mileage',
      detail: `${capitalize(shoe.cushion)} cushion suits your preference and ${distanceLabel(profile.weeklyDistance)}.`,
    })
  }

  // Surface (15%)
  const surfaceScore = surfaceFit(shoe, profile.surface)
  total += surfaceScore * 15
  weightSum += 15
  if (surfaceScore >= 0.85) {
    reasons.push({
      label: 'Surface',
      detail: `Designed for ${shoe.surfaces.join(' & ')} — aligned with your ${profile.surface} running.`,
    })
  }

  // Budget (10%)
  const budgetScore = budgetFit(shoe, profile.budget)
  total += budgetScore * 10
  weightSum += 10
  if (profile.budget !== 'any' && budgetScore >= 0.9) {
    reasons.push({
      label: 'Budget',
      detail: `Priced at RM ${shoe.priceMyr} within your ${profile.budget} range.`,
    })
  }

  // Experience / weight preference (5%)
  const expScore = experienceFit(shoe, profile.experience)
  total += expScore * 5
  weightSum += 5
  if (expScore >= 0.9 && profile.experience === 'beginner') {
    reasons.push({
      label: 'Experience level',
      detail: 'Forgiving daily trainer — a solid pick while you build consistency.',
    })
  } else if (expScore >= 0.9 && profile.experience === 'advanced') {
    reasons.push({
      label: 'Experience level',
      detail: 'Responsive enough for faster work once form and volume are solid.',
    })
  }

  // Width bonus (soft)
  if (
    (profile.widthHint === 'wide' && (shoe.width === 'wide' || shoe.width === 'both')) ||
    (profile.widthHint === 'narrow' && shoe.width === 'standard') ||
    profile.widthHint === 'standard'
  ) {
    total += 2
    weightSum += 2
    if (profile.widthHint === 'wide' && (shoe.width === 'wide' || shoe.width === 'both')) {
      reasons.push({
        label: 'Width',
        detail: 'Available in a roomier / wide-friendly fit.',
      })
    }
  }

  if (reasons.length === 0) {
    reasons.push({
      label: 'Overall fit',
      detail: shoe.summary,
    })
  }

  const score = Math.round((total / weightSum) * 100)
  return { shoe, score, reasons: reasons.slice(0, 4) }
}

function surfaceFit(shoe: Shoe, surface: UserProfile['surface']): number {
  if (surface === 'road') return shoe.surfaces.includes('road') ? 1 : 0.2
  if (surface === 'trail') return shoe.surfaces.includes('trail') ? 1 : 0.15
  if (surface === 'track') return shoe.surfaces.includes('track') || shoe.surfaces.includes('road') ? 0.95 : 0.2
  // mixed
  if (shoe.surfaces.includes('trail') && shoe.surfaces.includes('road')) return 1
  if (shoe.surfaces.includes('trail') || shoe.surfaces.includes('road')) return 0.7
  return 0.3
}

function budgetFit(shoe: Shoe, budget: UserProfile['budget']): number {
  if (budget === 'any') return 1
  if (budget === shoe.priceBand) return 1
  if (budget === 'mid' && shoe.priceBand === 'budget') return 0.75
  if (budget === 'premium' && shoe.priceBand === 'mid') return 0.7
  if (budget === 'budget' && shoe.priceBand === 'mid') return 0.35
  return 0.25
}

function experienceFit(shoe: Shoe, experience: UserProfile['experience']): number {
  if (experience === 'beginner') {
    if (shoe.bestFor.some((b) => /beginner|daily|easy|value/i.test(b))) return 1
    if (shoe.cushion === 'firm' && shoe.stability === 'neutral' && shoe.weightG < 220) return 0.35
    return 0.7
  }
  if (experience === 'advanced') {
    if (shoe.bestFor.some((b) => /tempo|race|marathon|trail/i.test(b))) return 1
    return 0.75
  }
  return 0.85
}

function stabilityCopy(pronation: UserProfile['pronation'], stability: Stability): string {
  if (pronation === 'over') {
    return stability === 'motion-control'
      ? 'Strong structured support for heavier overpronation.'
      : 'Stability features help guide excess inward roll.'
  }
  if (pronation === 'under') {
    return 'Neutral platform preserves natural motion for a supinated / underpronating gait.'
  }
  return 'Neutral ride matches a centered gait pattern.'
}

function distanceLabel(d: UserProfile['weeklyDistance']): string {
  if (d === 'short') return 'shorter weekly volume'
  if (d === 'long') return 'higher weekly mileage'
  return 'moderate weekly mileage'
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
