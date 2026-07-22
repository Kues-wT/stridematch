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

/** Exact matches score high but rarely a perfect 1.0 — keeps rankings believable. */
const ARCH_SUPPORT_MAP = {
  low: { low: 0.94, medium: 0.58, high: 0.18 },
  normal: { low: 0.55, medium: 0.93, high: 0.55 },
  high: { low: 0.18, medium: 0.6, high: 0.94 },
} as const

const PRONATION_STABILITY: Record<UserProfile['pronation'], Record<Stability, number>> = {
  over: { neutral: 0.28, stability: 0.92, 'motion-control': 0.9 },
  neutral: { neutral: 0.91, stability: 0.5, 'motion-control': 0.24 },
  under: { neutral: 0.92, stability: 0.36, 'motion-control': 0.14 },
}

const CUSHION_MAP = {
  firm: { firm: 0.93, balanced: 0.55, max: 0.24 },
  balanced: { firm: 0.52, balanced: 0.91, max: 0.6 },
  max: { firm: 0.22, balanced: 0.62, max: 0.94 },
} as const

const DISTANCE_CUSHION_BIAS = {
  short: { firm: 0.88, balanced: 0.92, max: 0.72 },
  moderate: { firm: 0.58, balanced: 0.93, max: 0.88 },
  long: { firm: 0.32, balanced: 0.78, max: 0.94 },
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

  const archScore = ARCH_SUPPORT_MAP[profile.arch][shoe.archSupport]
  total += archScore * 25
  weightSum += 25
  if (archScore >= 0.88) {
    reasons.push({
      label: 'Arch support',
      detail: `Built for ${shoe.archSupport} arch support — aligns well with your ${profile.arch} arch profile.`,
    })
  } else if (archScore >= 0.5) {
    reasons.push({
      label: 'Arch support',
      detail: `Offers ${shoe.archSupport} support — a workable option for ${profile.arch} arches.`,
    })
  }

  const stabScore = PRONATION_STABILITY[profile.pronation][shoe.stability]
  total += stabScore * 25
  weightSum += 25
  if (stabScore >= 0.85) {
    reasons.push({
      label: 'Gait support',
      detail: stabilityCopy(profile.pronation, shoe.stability),
    })
  }

  const cushionPref = CUSHION_MAP[profile.cushion][shoe.cushion]
  const distanceBias = DISTANCE_CUSHION_BIAS[profile.weeklyDistance][shoe.cushion]
  const cushionScore = cushionPref * 0.65 + distanceBias * 0.35
  total += cushionScore * 20
  weightSum += 20
  if (cushionScore >= 0.78) {
    reasons.push({
      label: 'Cushion & mileage',
      detail: `${capitalize(shoe.cushion)} cushion suits your preference and ${distanceLabel(profile.weeklyDistance)}.`,
    })
  }

  const surfaceScore = surfaceFit(shoe, profile.surface)
  total += surfaceScore * 15
  weightSum += 15
  if (surfaceScore >= 0.82) {
    reasons.push({
      label: 'Surface',
      detail: `Suited to ${shoe.surfaces.join(' & ')} — a solid match for your ${profile.surface} running.`,
    })
  }

  const budgetScore = budgetFit(shoe, profile.budget)
  total += budgetScore * 10
  weightSum += 10
  if (profile.budget !== 'any' && budgetScore >= 0.85) {
    reasons.push({
      label: 'Budget',
      detail: `Around RM ${shoe.priceMyr} fits your ${profile.budget} range.`,
    })
  }

  const expScore = experienceFit(shoe, profile.experience)
  total += expScore * 5
  weightSum += 5
  if (expScore >= 0.88 && profile.experience === 'beginner') {
    reasons.push({
      label: 'Experience level',
      detail: 'Forgiving daily trainer — a solid pick while you build consistency.',
    })
  } else if (expScore >= 0.88 && profile.experience === 'advanced') {
    reasons.push({
      label: 'Experience level',
      detail: 'Responsive enough for faster work once form and volume are solid.',
    })
  }

  // Width — small influence only
  if (profile.widthHint === 'wide' && (shoe.width === 'wide' || shoe.width === 'both')) {
    total += 2.5
    weightSum += 2.5
    reasons.push({
      label: 'Width',
      detail: 'Available in a roomier / wide-friendly fit.',
    })
  } else if (profile.widthHint === 'wide' && shoe.width === 'standard') {
    total += 0.8
    weightSum += 2.5
  } else if (profile.widthHint === 'narrow' && shoe.width === 'standard') {
    total += 2
    weightSum += 2
  } else if (profile.widthHint === 'standard') {
    total += 1.5
    weightSum += 2
  } else {
    total += 1
    weightSum += 2
  }

  if (reasons.length === 0) {
    reasons.push({
      label: 'Overall fit',
      detail: shoe.summary,
    })
  }

  // Soft ceiling so overall match rarely hits 99–100
  const raw = (total / weightSum) * 100
  const score = Math.round(Math.min(96, raw * 0.97))
  return { shoe, score, reasons: reasons.slice(0, 4) }
}

function surfaceFit(shoe: Shoe, surface: UserProfile['surface']): number {
  if (surface === 'road') {
    if (!shoe.surfaces.includes('road')) return 0.18
    return shoe.surfaces.length === 1 ? 0.9 : 0.84
  }
  if (surface === 'trail') {
    if (!shoe.surfaces.includes('trail')) return 0.15
    return shoe.surfaces.length === 1 ? 0.91 : 0.8
  }
  if (surface === 'track') {
    if (shoe.surfaces.includes('track')) return 0.92
    if (shoe.surfaces.includes('road')) return 0.72
    return 0.2
  }
  if (shoe.surfaces.includes('trail') && shoe.surfaces.includes('road')) return 0.9
  if (shoe.surfaces.includes('trail') || shoe.surfaces.includes('road')) return 0.68
  return 0.28
}

function budgetFit(shoe: Shoe, budget: UserProfile['budget']): number {
  if (budget === 'any') return 0.76
  if (budget === shoe.priceBand) return 0.88
  if (budget === 'mid' && shoe.priceBand === 'budget') return 0.7
  if (budget === 'premium' && shoe.priceBand === 'mid') return 0.66
  if (budget === 'budget' && shoe.priceBand === 'mid') return 0.36
  if (budget === 'mid' && shoe.priceBand === 'premium') return 0.4
  return 0.24
}

function experienceFit(shoe: Shoe, experience: UserProfile['experience']): number {
  if (experience === 'beginner') {
    if (shoe.bestFor.some((b) => /beginner|daily|easy|value/i.test(b))) return 0.92
    if (shoe.cushion === 'firm' && shoe.stability === 'neutral' && shoe.weightG < 220) return 0.34
    if (/race|tempo|plate|carbon/i.test(shoe.summary + shoe.bestFor.join(' '))) return 0.4
    return 0.68
  }
  if (experience === 'advanced') {
    if (shoe.bestFor.some((b) => /tempo|race|marathon|trail/i.test(b))) return 0.93
    return 0.78
  }
  return 0.85
}

function stabilityCopy(pronation: UserProfile['pronation'], stability: Stability): string {
  if (pronation === 'over') {
    return stability === 'motion-control'
      ? 'Strong structured support for heavier overpronation.'
      : 'Stability features help guide excess inward roll (guide-rail style, not a rigid brick).'
  }
  if (pronation === 'under') {
    return 'Neutral platform preserves natural motion for a supinated / underpronating gait.'
  }
  return 'Neutral-friendly ride that stays supportive without feeling locked-in.'
}

function distanceLabel(d: UserProfile['weeklyDistance']): string {
  if (d === 'short') return 'shorter weekly volume'
  if (d === 'long') return 'higher weekly mileage'
  return 'moderate weekly mileage'
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
