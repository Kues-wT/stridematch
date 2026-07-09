import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, GitCompareArrows, Heart } from 'lucide-react'
import type { ShoeMatch } from '../lib/recommend'
import { ShoeImage } from './ShoeImage'
import { useProfile } from '../context/ProfileContext'
import { useToast } from './Toast'
import { FitBars } from './FitBars'
import { getFitBreakdown } from '../lib/fitBreakdown'

interface ShoeCardProps {
  match: ShoeMatch
  rank?: number
  showFitBars?: boolean
}

export function ShoeCard({ match, rank, showFitBars }: ShoeCardProps) {
  const { shoe, score, reasons } = match
  const { isShortlisted, toggleShortlist, isComparing, toggleCompare, asUserProfile } = useProfile()
  const { toast } = useToast()
  const user = asUserProfile()
  const saved = isShortlisted(shoe.id)
  const comparing = isComparing(shoe.id)
  const dims = user && showFitBars ? getFitBreakdown(shoe, user) : null

  return (
    <article className="shoe-card">
      <div className="shoe-visual" style={{ background: `linear-gradient(145deg, ${shoe.color}, #0b1220)` }}>
        {rank != null && <div className="shoe-rank">#{rank}</div>}
        <ShoeImage
          src={shoe.image}
          alt={`${shoe.brand} ${shoe.name}`}
          accent={shoe.accent}
          imgClassName="shoe-card-img"
        />
        <div className="shoe-score">
          <BadgeCheck size={16} />
          {score}% match
        </div>
      </div>
      <div className="shoe-body">
        <p className="shoe-brand">{shoe.brand}</p>
        <h3>{shoe.name}</h3>
        <p className="shoe-summary">{shoe.summary}</p>
        <div className="tag-row">
          <span className="tag">{shoe.stability}</span>
          <span className="tag">{shoe.cushion} cushion</span>
          <span className="tag">RM {shoe.priceMyr}</span>
        </div>

        {dims && <FitBars dims={dims} compact />}

        <ul className="reason-list">
          {reasons.slice(0, 2).map((r) => (
            <li key={r.label}>
              <strong>{r.label}:</strong> {r.detail}
            </li>
          ))}
        </ul>

        <div className="card-actions">
          <Link to={`/results/${shoe.id}`} className="btn btn-ghost">
            View details <ArrowRight size={16} />
          </Link>
          <div className="card-icon-actions">
            <button
              type="button"
              className={`icon-btn ${saved ? 'active' : ''}`}
              aria-label={saved ? 'Remove from shortlist' : 'Save to shortlist'}
              title={saved ? 'Saved' : 'Save'}
              onClick={() => {
                toggleShortlist(shoe.id)
                toast(saved ? 'Removed from shortlist' : 'Saved to shortlist')
              }}
            >
              <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className={`icon-btn ${comparing ? 'active' : ''}`}
              aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
              title={comparing ? 'In compare' : 'Compare'}
              onClick={() => {
                toggleCompare(shoe.id)
                toast(comparing ? 'Removed from compare' : 'Added to compare (max 3)')
              }}
            >
              <GitCompareArrows size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
