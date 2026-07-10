import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, GitCompareArrows, Heart } from 'lucide-react'
import type { ShoeMatch } from '../lib/recommend'
import { ShoeImage } from './ShoeImage'
import { useProfile } from '../context/ProfileContext'
import { useToast } from './Toast'
import { FitBars } from './FitBars'
import { getFitBreakdown } from '../lib/fitBreakdown'
import { useI18n } from '../context/I18nContext'
import type { TranslationKey } from '../i18n/translations'

interface ShoeCardProps {
  match: ShoeMatch
  rank?: number
  showFitBars?: boolean
}

export function ShoeCard({ match, rank, showFitBars }: ShoeCardProps) {
  const { shoe, score, reasons } = match
  const { isShortlisted, toggleShortlist, isComparing, toggleCompare, asUserProfile } = useProfile()
  const { toast } = useToast()
  const { t } = useI18n()
  const user = asUserProfile()
  const saved = isShortlisted(shoe.id)
  const comparing = isComparing(shoe.id)
  const dims = user && showFitBars ? getFitBreakdown(shoe, user) : null

  const stab =
    shoe.stability === 'motion-control' ? t('motionControl') : t(shoe.stability as TranslationKey)
  const cush = t(shoe.cushion as TranslationKey)

  return (
    <article className="shoe-card">
      <div className="shoe-visual">
        {rank != null && <div className="shoe-rank">#{rank}</div>}
        <ShoeImage
          src={shoe.image}
          alt={`${shoe.brand} ${shoe.name}`}
          accent={shoe.accent}
          imgClassName="shoe-card-img"
        />
        <div className="shoe-score">
          <BadgeCheck size={16} />
          {t('matchPct', { score })}
        </div>
      </div>
      <div className="shoe-body">
        <p className="shoe-brand">{shoe.brand}</p>
        <h3>{shoe.name}</h3>
        <p className="shoe-summary">{shoe.summary}</p>
        <div className="tag-row">
          <span className="tag">{stab}</span>
          <span className="tag">{t('cushionTag', { value: cush })}</span>
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
            {t('viewDetails')} <ArrowRight size={16} />
          </Link>
          <div className="card-icon-actions">
            <button
              type="button"
              className={`icon-btn ${saved ? 'active' : ''}`}
              aria-label={saved ? t('saved') : t('save')}
              title={saved ? t('saved') : t('save')}
              onClick={() => {
                toggleShortlist(shoe.id)
                toast(saved ? t('toastRemoved') : t('toastSaved'))
              }}
            >
              <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className={`icon-btn ${comparing ? 'active' : ''}`}
              aria-label={comparing ? t('inCompare') : t('compare')}
              title={comparing ? t('inCompare') : t('compare')}
              onClick={() => {
                toggleCompare(shoe.id)
                toast(comparing ? t('toastCompareRemove') : t('toastCompareMax'))
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
