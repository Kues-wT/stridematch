import type { UserProfile } from './analysis'

/** Compact shareable profile payload (no photo data). */
export type SharePayload = {
  v: 1
  arch: UserProfile['arch']
  archSource: UserProfile['archSource']
  widthHint: UserProfile['widthHint']
  pronation: UserProfile['pronation']
  experience: UserProfile['experience']
  weeklyDistance: UserProfile['weeklyDistance']
  surface: UserProfile['surface']
  cushion: UserProfile['cushion']
  budget: UserProfile['budget']
}

export function profileToShare(profile: UserProfile): SharePayload {
  return {
    v: 1,
    arch: profile.arch,
    archSource: profile.archSource,
    widthHint: profile.widthHint,
    pronation: profile.pronation,
    experience: profile.experience,
    weeklyDistance: profile.weeklyDistance,
    surface: profile.surface,
    cushion: profile.cushion,
    budget: profile.budget,
  }
}

export function encodeShare(payload: SharePayload): string {
  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeShare(token: string): SharePayload | null {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
    const binary = atob(padded + pad)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    const data = JSON.parse(json) as SharePayload
    if (data.v !== 1 || !data.arch || !data.pronation) return null
    return data
  } catch {
    return null
  }
}

export function buildShareUrl(payload: SharePayload): string {
  const token = encodeShare(payload)
  const url = new URL(window.location.href)
  url.pathname = '/results'
  url.search = ''
  url.hash = `p=${token}`
  return url.toString()
}
