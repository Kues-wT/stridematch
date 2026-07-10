import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ExternalLink, GitCompareArrows, Heart } from 'lucide-react'
import { shoes } from '../data/shoes'
import { useProfile } from '../context/ProfileContext'
import { recommendShoes } from '../lib/recommend'
import { useMemo } from 'react'
import { FitBars } from '../components/FitBars'
import { getFitBreakdown } from '../lib/fitBreakdown'
import { useToast } from '../components/Toast'
import { ShoeImage } from '../components/ShoeImage'

export function ShoeDetail() {
  const { id } = useParams()
  const shoe = shoes.find((s) => s.id === id)
  const {
    asUserProfile,
    isShortlisted,
    toggleShortlist,
    isComparing,
    toggleCompare,
  } = useProfile()
  const { toast } = useToast()
  const user = asUserProfile()

  const match = useMemo(() => {
    if (!user || !shoe) return null
    return recommendShoes(user, shoes.length).find((m) => m.shoe.id === shoe.id) ?? null
  }, [user, shoe])

  const dims = useMemo(() => {
    if (!user || !shoe) return null
    return getFitBreakdown(shoe, user)
  }, [user, shoe])

  if (!shoe) {
    return (
      <div className="page narrow">
        <div className="panel center-panel">
          <h1>Shoe not found</h1>
          <Link to="/results" className="btn btn-primary">
            Back to results
          </Link>
        </div>
      </div>
    )
  }

  const saved = isShortlisted(shoe.id)
  const comparing = isComparing(shoe.id)

  return (
    <div className="page narrow">
      <Link to={user ? '/results' : '/catalog'} className="back-link">
        <ArrowLeft size={16} /> Back
      </Link>

      <article className="detail">
        <div
          className="detail-hero"
          style={{ background: `linear-gradient(160deg, ${shoe.color}, #020617)` }}
        >
          <ShoeImage
            src={shoe.image}
            alt={`${shoe.brand} ${shoe.name}`}
            accent={shoe.accent}
            imgClassName="detail-img"
          />
          {match && <span className="match-badge large">{match.score}% match for you</span>}
        </div>

        <div className="detail-body">
          <p className="shoe-brand">{shoe.brand}</p>
          <h1>{shoe.name}</h1>
          <p className="lede">{shoe.summary}</p>
          <p className="price">RM {shoe.priceMyr}</p>

          <div className="row-actions" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
            <a
              className="btn btn-primary"
              href={shoe.buyUrl}
              target="_blank"
              rel="noreferrer"
            >
              Research / buy <ExternalLink size={16} />
            </a>
            <a
              className="btn btn-secondary"
              href={shoe.officialUrl}
              target="_blank"
              rel="noreferrer"
            >
              Official site
            </a>
          </div>

          <div className="row-actions" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`btn ${saved ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                toggleShortlist(shoe.id)
                toast(saved ? 'Removed from shortlist' : 'Saved to shortlist')
              }}
            >
              <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Saved' : 'Save'}
            </button>
            <button
              type="button"
              className={`btn ${comparing ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                toggleCompare(shoe.id)
                toast(comparing ? 'Removed from compare' : 'Added to compare')
              }}
            >
              <GitCompareArrows size={16} />
              {comparing ? 'In compare' : 'Compare'}
            </button>
            <Link to="/stores" className="btn btn-ghost">
              Find MY stores
            </Link>
          </div>

          <div className="spec-grid">
            <Spec label="Stability" value={shoe.stability} />
            <Spec label="Arch support" value={shoe.archSupport} />
            <Spec label="Cushion" value={shoe.cushion} />
            <Spec label="Drop" value={`${shoe.dropMm} mm`} />
            <Spec label="Weight" value={`~${shoe.weightG} g`} />
            <Spec label="Width" value={shoe.width} />
            <Spec label="Surfaces" value={shoe.surfaces.join(', ')} />
            <Spec label="Price band" value={shoe.priceBand} />
          </div>

          {dims && (
            <>
              <h2>Fit breakdown</h2>
              <div className="fit-panel">
                <FitBars dims={dims} />
              </div>
            </>
          )}

          <h2>Highlights</h2>
          <ul className="check-list">
            {shoe.highlights.map((h) => (
              <li key={h}>
                <Check size={16} /> {h}
              </li>
            ))}
          </ul>

          <h2>Best for</h2>
          <div className="tag-row">
            {shoe.bestFor.map((b) => (
              <span className="tag" key={b}>
                {b}
              </span>
            ))}
          </div>

          {match && (
            <>
              <h2>Why it matched you</h2>
              <ul className="reason-list detail-reasons">
                {match.reasons.map((r) => (
                  <li key={r.label}>
                    <strong>{r.label}:</strong> {r.detail}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="row-actions">
            <Link to="/analyze" className="btn btn-secondary">
              Retake analysis
            </Link>
            <Link to={user ? '/results' : '/catalog'} className="btn btn-primary">
              {user ? 'All matches' : 'Browse catalog'}
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="spec">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
