import { Link } from 'react-router-dom'
import { ArrowLeft, Heart } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { shoes } from '../data/shoes'
import { recommendShoes } from '../lib/recommend'
import { getFitBreakdown } from '../lib/fitBreakdown'
import { ShoeImage } from '../components/ShoeImage'
import { useMemo } from 'react'
import { useI18n } from '../context/I18nContext'
import type { TranslationKey } from '../i18n/translations'

interface RowCtx {
  byId: Record<string, (typeof shoes)[number]>
  scores: Record<string, number>
}

export function Compare() {
  const { compareIds, asUserProfile, isShortlisted, toggleShortlist, clearCompare } = useProfile()
  const { t } = useI18n()
  const user = asUserProfile()

  const selected = useMemo(
    () =>
      compareIds
        .map((id) => shoes.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [compareIds],
  )

  const scores = useMemo(() => {
    const map: Record<string, number> = {}
    if (!user) return map
    recommendShoes(user, shoes.length).forEach((m) => {
      map[m.shoe.id] = m.score
    })
    return map
  }, [user])

  const byId = useMemo(() => Object.fromEntries(selected.map((s) => [s.id, s])), [selected])
  const ctx: RowCtx = { byId, scores }

  const rows: { key: string; labelKey: TranslationKey; get: (id: string, c: RowCtx) => string | number }[] = [
    { key: 'match', labelKey: 'rowMatch', get: (id, c) => (c.scores[id] != null ? `${c.scores[id]}%` : '—') },
    { key: 'price', labelKey: 'rowPrice', get: (id, c) => `RM ${c.byId[id].priceMyr}` },
    { key: 'brand', labelKey: 'rowBrand', get: (id, c) => c.byId[id].brand },
    { key: 'stability', labelKey: 'rowStability', get: (id, c) => c.byId[id].stability },
    { key: 'arch', labelKey: 'rowArch', get: (id, c) => c.byId[id].archSupport },
    { key: 'cushion', labelKey: 'rowCushion', get: (id, c) => c.byId[id].cushion },
    { key: 'drop', labelKey: 'rowDrop', get: (id, c) => `${c.byId[id].dropMm} mm` },
    { key: 'weight', labelKey: 'rowWeight', get: (id, c) => `${c.byId[id].weightG} g` },
    { key: 'width', labelKey: 'rowWidth', get: (id, c) => c.byId[id].width },
    { key: 'surfaces', labelKey: 'rowSurfaces', get: (id, c) => c.byId[id].surfaces.join(', ') },
    { key: 'best', labelKey: 'rowBestFor', get: (id, c) => c.byId[id].bestFor.join(' · ') },
  ]

  if (selected.length < 2) {
    return (
      <div className="page narrow">
        <div className="panel center-panel">
          <h1>{t('compareTitle')}</h1>
          <p className="muted">{t('compareEmptyBody')}</p>
          <div className="row-actions" style={{ justifyContent: 'center' }}>
            <Link to="/results" className="btn btn-primary">
              {t('compareGoResults')}
            </Link>
            <Link to="/catalog" className="btn btn-secondary">
              {t('browseCatalog')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const fitKeys: { id: string; labelKey: TranslationKey }[] = [
    { id: 'arch', labelKey: 'fitArch' },
    { id: 'gait', labelKey: 'fitGait' },
    { id: 'cushion', labelKey: 'fitCushion' },
    { id: 'surface', labelKey: 'fitSurface' },
    { id: 'budget', labelKey: 'fitBudget' },
  ]

  return (
    <div className="page">
      <header className="page-header">
        <Link to="/results" className="back-link">
          <ArrowLeft size={16} /> {t('back')}
        </Link>
        <p className="eyebrow">{t('compareEyebrow')}</p>
        <h1>{t('compareTitle')}</h1>
        <p className="lede">
          {t('compareLede', { scored: user ? t('compareScored') : '.' })}
        </p>
        <div className="row-actions">
          <button type="button" className="btn btn-secondary" onClick={clearCompare}>
            {t('clearCompare')}
          </button>
        </div>
      </header>

      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">{t('spec')}</th>
              {selected.map((shoe) => (
                <th key={shoe.id} scope="col">
                  <div className="compare-head-visual">
                    <ShoeImage
                      src={shoe.image}
                      alt={`${shoe.brand} ${shoe.name}`}
                      accent={shoe.accent}
                      imgClassName="compare-head-img"
                    />
                  </div>
                  <div className="compare-head-meta">
                    <span className="shoe-brand">{shoe.brand}</span>
                    <strong>{shoe.name}</strong>
                    {scores[shoe.id] != null && (
                      <span className="match-badge">{t('matchPct', { score: scores[shoe.id] })}</span>
                    )}
                    <div className="compare-head-actions">
                      <Link to={`/results/${shoe.id}`} className="btn btn-ghost btn-sm">
                        {t('details')}
                      </Link>
                      <button
                        type="button"
                        className={`icon-btn ${isShortlisted(shoe.id) ? 'active' : ''}`}
                        onClick={() => toggleShortlist(shoe.id)}
                        aria-label={t('save')}
                      >
                        <Heart size={14} fill={isShortlisted(shoe.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{t(row.labelKey)}</th>
                {selected.map((shoe) => (
                  <td key={shoe.id}>{row.get(shoe.id, ctx)}</td>
                ))}
              </tr>
            ))}
            {user &&
              fitKeys.map((fk) => (
                <tr key={fk.id}>
                  <th scope="row">{t(fk.labelKey)}</th>
                  {selected.map((shoe) => {
                    const dim = getFitBreakdown(shoe, user).find((d) => d.id === fk.id)
                    const score = dim?.score ?? 0
                    return (
                      <td key={shoe.id}>
                        <div className="mini-fit">
                          <span>{score}%</span>
                          <div className="fit-bar-track">
                            <i style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
