import type { UserProfile } from './analysis'
import { loadJson, removeKey, saveJson, storageKeys } from './storage'
import { APP_VERSION, SUPABASE_URL, supabaseHeaders } from './remote'

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
  /** True once the entry reached the online feedback table */
  synced?: boolean
}

/**
 * Every answer is kept on this device (for moderated sessions and offline use)
 * and also sent to the online feedback table. Failed sends are retried by
 * syncFeedback() the next time the app opens or another answer is saved.
 */
export function loadFeedback(): FeedbackEntry[] {
  const entries = loadJson<FeedbackEntry[]>(storageKeys.feedback, [])
  return Array.isArray(entries) ? entries : []
}

export function saveFeedback(entry: Omit<FeedbackEntry, 'id' | 'at' | 'synced'>): FeedbackEntry[] {
  const full: FeedbackEntry = {
    ...entry,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    synced: false,
  }
  const next = [full, ...loadFeedback()]
  saveJson(storageKeys.feedback, next)
  void syncFeedback()
  return next
}

let syncing: Promise<number> | null = null

/** Upload any unsent answers. Resolves to how many are still waiting. */
export function syncFeedback(): Promise<number> {
  if (!syncing) {
    syncing = uploadPending().finally(() => {
      syncing = null
    })
  }
  return syncing
}

async function uploadPending(): Promise<number> {
  const pending = loadFeedback().filter((e) => !e.synced)
  if (pending.length === 0 || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    return pending.length
  }

  const sent = new Set<string>()
  for (const e of pending) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
        method: 'POST',
        headers: supabaseHeaders({ Prefer: 'return=minimal' }),
        body: JSON.stringify({
          id: e.id,
          submitted_at: e.at,
          rating: e.rating,
          would_try: e.wouldTry.slice(0, 80),
          note: e.note.slice(0, 1000),
          lang: e.lang.slice(0, 8),
          profile: e.profile,
          top: e.top,
          app_version: APP_VERSION,
        }),
      })
      // 409 = this id is already stored (an earlier attempt got through)
      if (res.ok || res.status === 409) sent.add(e.id)
    } catch {
      break // offline or blocked — try again later
    }
  }

  if (sent.size) {
    // Re-read so answers saved while we were uploading are not lost
    const merged = loadFeedback().map((e) => (sent.has(e.id) ? { ...e, synced: true } : e))
    saveJson(storageKeys.feedback, merged)
  }
  return pending.length - sent.size
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
  'sent_online',
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
      e.synced ? 'yes' : 'no',
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
