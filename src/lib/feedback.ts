import type { UserProfile } from './analysis'
import { loadJson, removeKey, saveJson, storageKeys } from './storage'

export type FeedbackRating = 'spot-on' | 'close' | 'off'

export interface FeedbackEntry {
  id: string
  /** ISO timestamp */
  at: string
  rating: FeedbackRating
  /** Shoe id the tester says they'd actually try on ('' = none of them) */
  wouldTry: string
  note: string
  lang: string
  profile: Pick<
    UserProfile,
    | 'arch'
    | 'archSource'
    | 'widthHint'
    | 'pronation'
    | 'experience'
    | 'weeklyDistance'
    | 'surface'
    | 'cushion'
    | 'budget'
  >
  /** Ranked shoes the tester was reacting to */
  top: { id: string; score: number }[]
}

/**
 * Feedback never leaves the device — same promise as the rest of the app.
 * The facilitator exports it from /feedback after a session.
 */
export function loadFeedback(): FeedbackEntry[] {
  const entries = loadJson<FeedbackEntry[]>(storageKeys.feedback, [])
  return Array.isArray(entries) ? entries : []
}

export function saveFeedback(entry: Omit<FeedbackEntry, 'id' | 'at'>): FeedbackEntry[] {
  const full: FeedbackEntry = {
    ...entry,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  }
  const next = [full, ...loadFeedback()]
  saveJson(storageKeys.feedback, next)
  return next
}

export function clearFeedback() {
  removeKey(storageKeys.feedback)
}

function csvCell(value: string | number): string {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const CSV_COLUMNS = [
  'when',
  'rating',
  'would_try',
  'note',
  'arch',
  'arch_source',
  'width',
  'pronation',
  'experience',
  'weekly_distance',
  'surface',
  'cushion_pref',
  'budget',
  'top1',
  'top1_score',
  'top2',
  'top2_score',
  'top3',
  'top3_score',
  'lang',
]

/** Spreadsheet-friendly export — one row per response. */
export function feedbackToCsv(entries: FeedbackEntry[]): string {
  const rows = entries.map((e) =>
    [
      e.at,
      e.rating,
      e.wouldTry,
      e.note,
      e.profile.arch,
      e.profile.archSource,
      e.profile.widthHint,
      e.profile.pronation,
      e.profile.experience,
      e.profile.weeklyDistance,
      e.profile.surface,
      e.profile.cushion,
      e.profile.budget,
      e.top[0]?.id ?? '',
      e.top[0]?.score ?? '',
      e.top[1]?.id ?? '',
      e.top[1]?.score ?? '',
      e.top[2]?.id ?? '',
      e.top[2]?.score ?? '',
      e.lang,
    ]
      .map(csvCell)
      .join(','),
  )
  return [CSV_COLUMNS.join(','), ...rows].join('\n')
}

/** Counts per rating, for the at-a-glance summary on the export page. */
export function feedbackTally(entries: FeedbackEntry[]): Record<FeedbackRating, number> {
  return entries.reduce(
    (acc, e) => {
      acc[e.rating] = (acc[e.rating] ?? 0) + 1
      return acc
    },
    { 'spot-on': 0, close: 0, off: 0 } as Record<FeedbackRating, number>,
  )
}
