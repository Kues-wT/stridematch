import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Link2, RotateCcw, Share2 } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { recommendShoes } from '../lib/recommend'
import { ShoeCard } from '../components/ShoeCard'
import { buildShareUrl, decodeShare, profileToShare } from '../lib/share'
import { useToast } from '../components/Toast'

export function Results() {
  const navigate = useNavigate()
  const { asUserProfile, profile, reset, applySharePayload, hydrated } = useProfile()
  const { toast } = useToast()
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
      toast('Loaded shared runner profile')
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once after hydrate
  }, [hydrated])

  const user = asUserProfile()
  const matches = useMemo(() => (user ? recommendShoes(user, 5) : []), [user])

  if (!hydrated) {
    return (
      <div className="page narrow">
        <div className="panel center-panel">
          <p className="muted">Loading your profile…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page narrow">
        <div className="panel center-panel">
          <h1>No profile yet</h1>
          <p className="muted">Complete the foot analysis and quiz to see recommendations.</p>
          <Link to="/analyze" className="btn btn-primary">
            Start analysis
          </Link>
        </div>
      </div>
    )
  }

  const copySummary = async () => {
    const text = `My StrideMatch top pick: ${matches[0]?.shoe.brand} ${matches[0]?.shoe.name} (${matches[0]?.score}% match) — ${profile.arch} arch, ${pronationLabel(profile.pronation!)}`
    try {
      await navigator.clipboard.writeText(text)
      toast('Summary copied')
    } catch {
      toast(text)
    }
  }

  const copyLink = async () => {
    const url = buildShareUrl(profileToShare(user))
    try {
      await navigator.clipboard.writeText(url)
      toast('Share link copied')
    } catch {
      toast('Could not copy link — try again')
    }
  }

  return (
    <div className="page">
      <header className="page-header results-header">
        <p className="eyebrow">Your matches</p>
        <h1>Shoes ranked for your stride</h1>
        <p className="lede">
          Based on a <strong>{profile.arch}</strong> arch
          {profile.archSource === 'photo' ? ' (photo-assisted)' : ''},{' '}
          <strong>{pronationLabel(profile.pronation!)}</strong>,{' '}
          <strong>{profile.surface}</strong> running, and{' '}
          <strong>{profile.cushion}</strong> cushion preference.
          {fromShare ? ' · Opened from a shared link.' : ' · Profile saved on this device.'}
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
            <RotateCcw size={16} /> Start over
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void copySummary()}>
            <Share2 size={16} /> Copy summary
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void copyLink()}>
            <Link2 size={16} /> Copy share link
          </button>
          <Link to="/catalog" className="btn btn-ghost">
            Browse all
          </Link>
        </div>
      </header>

      <div className="results-grid">
        {matches.map((m, i) => (
          <ShoeCard key={m.shoe.id} match={m} rank={i + 1} showFitBars />
        ))}
      </div>

      <p className="disclaimer">
        StrideMatch is a consumer fitting guide. If you have pain, injury, or a medical condition,
        consult a qualified professional or specialty running store before purchasing.
      </p>
    </div>
  )
}

function pronationLabel(p: string) {
  if (p === 'over') return 'overpronation tendency'
  if (p === 'under') return 'underpronation tendency'
  return 'neutral gait'
}
