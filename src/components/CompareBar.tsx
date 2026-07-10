import { Link } from 'react-router-dom'
import { GitCompareArrows, X } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { shoes } from '../data/shoes'
import { ShoeImage } from './ShoeImage'
import { useI18n } from '../context/I18nContext'

export function CompareBar() {
  const { compareIds, toggleCompare, clearCompare } = useProfile()
  const { t } = useI18n()
  if (compareIds.length === 0) return null

  const items = compareIds
    .map((id) => shoes.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))

  return (
    <div className="compare-bar" role="region" aria-label={t('compare')}>
      <div className="compare-bar-inner">
        <div className="compare-bar-label">
          <GitCompareArrows size={16} />
          {t('compareTray', { count: items.length })}
        </div>
        <div className="compare-chips">
          {items.map((shoe) => (
            <div key={shoe.id} className="compare-chip">
              <span className="compare-chip-swatch">
                <ShoeImage
                  src={shoe.image}
                  alt=""
                  accent={shoe.accent}
                  imgClassName="chip-img"
                />
              </span>
              <span className="compare-chip-name">{shoe.name}</span>
              <button
                type="button"
                className="chip-remove"
                aria-label={`${t('clear')} ${shoe.name}`}
                onClick={() => toggleCompare(shoe.id)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="compare-bar-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={clearCompare}>
            {t('clear')}
          </button>
          <Link
            to="/compare"
            className={`btn btn-primary btn-sm ${items.length < 2 ? 'is-disabled' : ''}`}
            aria-disabled={items.length < 2}
            onClick={(e) => {
              if (items.length < 2) e.preventDefault()
            }}
          >
            {t('compareNow')}
          </Link>
        </div>
      </div>
    </div>
  )
}
