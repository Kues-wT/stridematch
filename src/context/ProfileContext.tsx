import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { FootAnalysisResult, UserProfile, WearAnalysisResult } from '../lib/analysis'
import { loadJson, removeKey, saveJson, storageKeys } from '../lib/storage'
import type { SharePayload } from '../lib/share'

interface StoredProfileState {
  profile: Partial<UserProfile>
  analysis: FootAnalysisResult | null
  wearAnalysis: WearAnalysisResult | null
}

interface ProfileContextValue {
  profile: Partial<UserProfile>
  setProfile: (patch: Partial<UserProfile>) => void
  photoPreview: string | null
  setPhotoPreview: (url: string | null) => void
  analysis: FootAnalysisResult | null
  setAnalysis: (result: FootAnalysisResult | null) => void
  wearAnalysis: WearAnalysisResult | null
  setWearAnalysis: (result: WearAnalysisResult | null) => void
  shortlist: string[]
  toggleShortlist: (id: string) => void
  isShortlisted: (id: string) => boolean
  compareIds: string[]
  toggleCompare: (id: string) => void
  clearCompare: () => void
  isComparing: (id: string) => boolean
  reset: () => void
  isComplete: boolean
  asUserProfile: () => UserProfile | null
  applySharePayload: (payload: SharePayload) => void
  hydrated: boolean
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

const emptyProfile: Partial<UserProfile> = {}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Partial<UserProfile>>(emptyProfile)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [analysis, setAnalysisState] = useState<FootAnalysisResult | null>(null)
  const [wearAnalysis, setWearAnalysisState] = useState<WearAnalysisResult | null>(null)
  const [shortlist, setShortlist] = useState<string[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadJson<StoredProfileState | null>(storageKeys.profile, null)
    if (stored?.profile) {
      setProfileState(stored.profile)
      if (stored.analysis) {
        const { previewDataUrl: _d, ...rest } = stored.analysis
        setAnalysisState({ ...rest, notes: stored.analysis.notes })
      }
      if (stored.wearAnalysis) {
        const { previewDataUrl: _w, ...rest } = stored.wearAnalysis
        setWearAnalysisState({ ...rest, notes: stored.wearAnalysis.notes })
      }
    }
    setShortlist(loadJson<string[]>(storageKeys.shortlist, []))
    setCompareIds(loadJson<string[]>(storageKeys.compare, []).slice(0, 3))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveJson(storageKeys.profile, {
      profile,
      analysis: analysis ? { ...analysis, previewDataUrl: undefined } : null,
      wearAnalysis: wearAnalysis ? { ...wearAnalysis, previewDataUrl: undefined } : null,
    } satisfies StoredProfileState)
  }, [profile, analysis, wearAnalysis, hydrated])

  useEffect(() => {
    if (!hydrated) return
    saveJson(storageKeys.shortlist, shortlist)
  }, [shortlist, hydrated])

  useEffect(() => {
    if (!hydrated) return
    saveJson(storageKeys.compare, compareIds)
  }, [compareIds, hydrated])

  const setProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfileState((prev) => ({ ...prev, ...patch }))
  }, [])

  const setAnalysis = useCallback((result: FootAnalysisResult | null) => {
    setAnalysisState(result)
  }, [])

  const setWearAnalysis = useCallback((result: WearAnalysisResult | null) => {
    setWearAnalysisState(result)
  }, [])

  const toggleShortlist = useCallback((id: string) => {
    setShortlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const isShortlisted = useCallback((id: string) => shortlist.includes(id), [shortlist])

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }, [])

  const clearCompare = useCallback(() => setCompareIds([]), [])
  const isComparing = useCallback((id: string) => compareIds.includes(id), [compareIds])

  const reset = useCallback(() => {
    setProfileState(emptyProfile)
    setPhotoPreview(null)
    setAnalysisState(null)
    setWearAnalysisState(null)
    removeKey(storageKeys.profile)
  }, [])

  const asUserProfile = useCallback((): UserProfile | null => {
    const {
      arch,
      archSource,
      widthHint,
      pronation,
      experience,
      weeklyDistance,
      surface,
      cushion,
      budget,
    } = profile

    if (
      !arch ||
      !archSource ||
      !widthHint ||
      !pronation ||
      !experience ||
      !weeklyDistance ||
      !surface ||
      !cushion ||
      !budget
    ) {
      return null
    }

    return {
      arch,
      archSource,
      widthHint,
      pronation,
      experience,
      weeklyDistance,
      surface,
      cushion,
      budget,
      photoAnalysis: analysis ?? undefined,
      wearAnalysis: wearAnalysis ?? undefined,
    }
  }, [profile, analysis, wearAnalysis])

  const applySharePayload = useCallback((payload: SharePayload) => {
    setProfileState({
      arch: payload.arch,
      archSource: payload.archSource,
      widthHint: payload.widthHint,
      pronation: payload.pronation,
      experience: payload.experience,
      weeklyDistance: payload.weeklyDistance,
      surface: payload.surface,
      cushion: payload.cushion,
      budget: payload.budget,
    })
    setAnalysisState(null)
    setWearAnalysisState(null)
    setPhotoPreview(null)
  }, [])

  const isComplete = asUserProfile() !== null

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      setProfile,
      photoPreview,
      setPhotoPreview,
      analysis,
      setAnalysis,
      wearAnalysis,
      setWearAnalysis,
      shortlist,
      toggleShortlist,
      isShortlisted,
      compareIds,
      toggleCompare,
      clearCompare,
      isComparing,
      reset,
      isComplete,
      asUserProfile,
      applySharePayload,
      hydrated,
    }),
    [
      profile,
      setProfile,
      photoPreview,
      analysis,
      setAnalysis,
      wearAnalysis,
      setWearAnalysis,
      shortlist,
      toggleShortlist,
      isShortlisted,
      compareIds,
      toggleCompare,
      clearCompare,
      isComparing,
      reset,
      isComplete,
      asUserProfile,
      applySharePayload,
      hydrated,
    ],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
