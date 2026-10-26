import { loadJson, saveJson, storageKeys } from './storage'

/**
 * Supabase project for tester feedback + the optional AI photo check.
 * The publishable key is safe to ship in the browser — the feedback table is
 * insert-only for the public role and nothing can be read back through it.
 * Override per environment with VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.
 */
export const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL || 'https://ppvmkxxprtzcibrblzpa.supabase.co'

export const SUPABASE_PUBLISHABLE_KEY: string =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_lP9loW-L4VgajmD9OsCDHQ_ZhuVTE3J'

export const APP_VERSION = '1.6.0'

/** Random per-browser id — not tied to the person, only used for AI rate limits. */
export function deviceId(): string {
  const existing = loadJson<string>(storageKeys.device, '')
  if (existing) return existing
  const id = `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  saveJson(storageKeys.device, id)
  return id
}

export function supabaseHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json',
    ...extra,
  }
}
