import { Link } from 'react-router-dom'
import { GitCompareArrows, X } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { shoes } from '../data/shoes'
import { ShoeSilhouette } from './ShoeSilhouette'

export function CompareBar() {
  const { compareIds, toggleCompare, clearCompare } = useProfile()
  if (compareIds.length === 0) return null

  const items = compareIds
    .map((id) => shoes.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))

  return (
    <div className="compare-bar" role="region" aria-label="Compare tray">
      <div className="compare-bar-inner">
        <div className="compare-bar-label">
          <GitCompareArrows size={16} />
          Compare ({items.length}/3)
        </div>
        <div className="compare-chips">
          {items.map((shoe) => (
            <div key={shoe.id} className="compare-chip">
              <span
                className="compare-chip-swatch"
                style={{ background: `linear-gradient(135deg, ${shoe.color}, ${shoe.accent})` }}
              >
                <ShoeSilhouette accent={shoe.accent} className="chip-svg" />
              </span>
              <span className="compare-chip-name">{shoe.name}</span>
              <button
                type="button"
                className="chip-remove"
                aria-label={`Remove ${shoe.name}`}
                onClick={() => toggleCompare(shoe.id)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="compare-bar-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={clearCompare}>
            Clear
          </button>
          <Link
            to="/compare"
            className={`btn btn-primary btn-sm ${items.length < 2 ? 'is-disabled' : ''}`}
            aria-disabled={items.length < 2}
            onClick={(e) => {
              if (items.length < 2) e.preventDefault()
            }}
          >
            Compare now
          </Link>
        </div>
      </div>
    </div>
  )
}
