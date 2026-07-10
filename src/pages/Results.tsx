import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Link2, RotateCcw, Share2 } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { recommendShoes } from '../lib/recommend'
import { ShoeCard } from '../components/ShoeCard'
import { buildShareUrl, decodeShare, profileToShare } from '../lib/share'
import { useToast } from '../components/Toast'
import { useI18n } from '../context/I18nContext'
import type { TranslationKey } from '../i18n/translations'

export function Results() {
  const navigate = useNavigate()
  const { asUserProfile, profile, reset, applySharePayload, hydrated } = useProfile()
  const { toast } = useToast()
  const { t } = useI18n()
  const [fromShare, setFromShare] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    const hash = window.location.hash.replace(/^#/, '')
    const params = new URLSearchParams(hash)
    const token = params.get('p')
    if (!token) return
    const payload = decodeShare(token)
    if (payload) {
      applySharePayload(payload)
      setFromShare(true)
      toast(t('toastSharedLoaded'))
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  const user = asUserProfile()
  const matches = useMemo(() => (user ? recommendShoes(user, 5) : []), [user])

  if (!hydrated) {
    return (
      <div className="page narrow">
        <div className="panel center-panel">
          <p className="muted">{t('loadingProfile')}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page narrow">
        <div className="panel center-panel">
          <h1>{t('noProfileTitle')}</h1>
          <p className="muted">{t('noProfileBody')}</p>
          <Link to="/analyze" className="btn btn-primary">
            {t('startAnalysis')}
          </Link>
        </div>
      </div>
    )
  }

  const archKey = (`arch${profile.arch![0].toUpperCase()}${profile.arch!.slice(1)}Label` as TranslationKey)
  const surfaceKey = (
    profile.surface === 'road'
      ? 'surfaceRoadLabel'
      : profile.surface === 'trail'
        ? 'surfaceTrailLabel'
        : profile.surface === 'mixed'
          ? 'surfaceMixedLabel'
          : 'surfaceTrackLabel'
  ) as TranslationKey
  const cushionKey = (profile.cushion === 'firm' ? 'firm' : profile.cushion === 'max' ? 'max' : 'balanced') as TranslationKey
  const pronationKey = (
    profile.pronation === 'over'
      ? 'pronationOverLabel'
      : profile.pronation === 'under'
        ? 'pronationUnderLabel'
        : 'pronationNeutralLabel'
  ) as TranslationKey

  const copySummary = async () => {
    const text = `${matches[0]?.shoe.brand} ${matches[0]?.shoe.name} (${matches[0]?.score}%) — ${t(archKey)}, ${t(pronationKey)}`
    try {
      await navigator.clipboard.writeText(text)
      toast(t('toastSummaryCopied'))
    } catch {
      toast(text)
    }
  }

  const copyLink = async () => {
    const url = buildShareUrl(profileToShare(user))
    try {
      await navigator.clipboard.writeText(url)
      toast(t('toastShareCopied'))
    } catch {
      toast(t('toastShareFail'))
    }
  }

  return (
    <div className="page">
      <header className="page-header results-header">
        <p className="eyebrow">{t('resultsEyebrow')}</p>
        <h1>{t('resultsTitle')}</h1>
        <p className="lede">
          {t('resultsBased', {
            arch: t(archKey),
            photo: profile.archSource === 'photo' ? t('photoAssisted') : '',
            pronation: t(pronationKey),
            surface: t(surfaceKey),
            cushion: t(cushionKey),
            saved: fromShare ? t('fromShare') : t('profileSaved'),
          })}
        </p>
        <div className="row-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              reset()
              navigate('/analyze')
            }}
          >
            <RotateCcw size={16} /> {t('startOver')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void copySummary()}>
            <Share2 size={16} /> {t('copySummary')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void copyLink()}>
            <Link2 size={16} /> {t('copyShareLink')}
          </button>
          <Link to="/catalog" className="btn btn-ghost">
            {t('browseAll')}
          </Link>
        </div>
      </header>

      <div className="results-grid">
        {matches.map((m, i) => (
          <ShoeCard key={m.shoe.id} match={m} rank={i + 1} showFitBars />
        ))}
      </div>
    </div>
  )
}
