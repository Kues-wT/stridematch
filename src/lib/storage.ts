const PROFILE_KEY = 'stridematch.profile.v1'
const SHORTLIST_KEY = 'stridematch.shortlist.v1'
const COMPARE_KEY = 'stridematch.compare.v1'

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota / private mode — ignore
  }
}

export function removeKey(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export const storageKeys = {
  profile: PROFILE_KEY,
  shortlist: SHORTLIST_KEY,
  compare: COMPARE_KEY,
}
