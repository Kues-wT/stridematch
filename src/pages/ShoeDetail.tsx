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
import { useI18n } from '../context/I18nContext'
import type { TranslationKey } from '../i18n/translations'

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
  const { t } = useI18n()
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
          <h1>{t('shoeNotFound')}</h1>
          <Link to="/results" className="btn btn-primary">
            {t('backToResults')}
          </Link>
        </div>
      </div>
    )
  }

  const saved = isShortlisted(shoe.id)
  const comparing = isComparing(shoe.id)

  const stab =
    shoe.stability === 'motion-control' ? t('motionControl') : t(shoe.stability as TranslationKey)
  const band =
    shoe.priceBand === 'budget'
      ? t('budgetBand')
      : shoe.priceBand === 'mid'
        ? t('midBand')
        : t('premiumBand')

  return (
    <div className="page narrow">
      <Link to={user ? '/results' : '/catalog'} className="back-link">
        <ArrowLeft size={16} /> {t('back')}
      </Link>

      <article className="detail">
        <div className="detail-hero">
          <ShoeImage
            src={shoe.image}
            alt={`${shoe.brand} ${shoe.name}`}
            accent={shoe.accent}
            imgClassName="detail-img"
          />
          {match && (
            <span className="match-badge large">
              {t('matchForYou', { score: match.score })}
            </span>
          )}
        </div>

        <div className="detail-body">
          <p className="shoe-brand">{shoe.brand}</p>
          <h1>{shoe.name}</h1>
          <p className="lede">{shoe.summary}</p>
          <p className="price">RM {shoe.priceMyr}</p>

          <div className="row-actions" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
            <a className="btn btn-primary" href={shoe.buyUrl} target="_blank" rel="noreferrer">
              {t('researchBuy')} <ExternalLink size={16} />
            </a>
            <a className="btn btn-secondary" href={shoe.officialUrl} target="_blank" rel="noreferrer">
              {t('officialSite')}
            </a>
          </div>

          <div className="row-actions" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`btn ${saved ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                toggleShortlist(shoe.id)
                toast(saved ? t('toastRemoved') : t('toastSaved'))
              }}
            >
              <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
              {saved ? t('saved') : t('save')}
            </button>
            <button
              type="button"
              className={`btn ${comparing ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                toggleCompare(shoe.id)
                toast(comparing ? t('toastCompareRemove') : t('toastCompareAdd'))
              }}
            >
              <GitCompareArrows size={16} />
              {comparing ? t('inCompare') : t('compare')}
            </button>
            <Link to="/stores" className="btn btn-ghost">
              {t('findMyStores')}
            </Link>
          </div>

          <div className="spec-grid">
            <Spec label={t('labelStability')} value={stab} />
            <Spec label={t('labelArchSupport')} value={shoe.archSupport} />
            <Spec label={t('labelCushion')} value={t(shoe.cushion as TranslationKey)} />
            <Spec label={t('labelDrop')} value={`${shoe.dropMm} mm`} />
            <Spec label={t('labelWeight')} value={`~${shoe.weightG} g`} />
            <Spec label={t('labelWidth')} value={shoe.width} />
            <Spec label={t('labelSurfaces')} value={shoe.surfaces.join(', ')} />
            <Spec label={t('labelPriceBand')} value={band} />
          </div>

          {dims && (
            <>
              <h2>{t('fitBreakdown')}</h2>
              <div className="fit-panel">
                <FitBars dims={dims} />
              </div>
            </>
          )}

          <h2>{t('highlights')}</h2>
          <ul className="check-list">
            {shoe.highlights.map((h) => (
              <li key={h}>
                <Check size={16} /> {h}
              </li>
            ))}
          </ul>

          <h2>{t('bestFor')}</h2>
          <div className="tag-row">
            {shoe.bestFor.map((b) => (
              <span className="tag" key={b}>
                {b}
              </span>
            ))}
          </div>

          {match && (
            <>
              <h2>{t('whyMatched')}</h2>
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
              {t('retakeAnalysis')}
            </Link>
            <Link to={user ? '/results' : '/catalog'} className="btn btn-primary">
              {user ? t('allMatches') : t('browseCatalog')}
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
