import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, GitCompareArrows, Heart, ChevronDown } from 'lucide-react'
import { shoes, type Cushion, type PriceBand, type Stability, type Surface } from '../data/shoes'
import { useProfile } from '../context/ProfileContext'
import { recommendShoes } from '../lib/recommend'
import { ShoeImage } from '../components/ShoeImage'
import { useToast } from '../components/Toast'
import { useI18n } from '../context/I18nContext'
import type { TranslationKey } from '../i18n/translations'

export function Catalog() {
  const { asUserProfile, isShortlisted, toggleShortlist, isComparing, toggleCompare } = useProfile()
  const { toast } = useToast()
  const { t } = useI18n()
  const user = asUserProfile()

  const [q, setQ] = useState('')
  const [brand, setBrand] = useState<string>('all')
  const [surface, setSurface] = useState<Surface | 'all'>('all')
  const [stability, setStability] = useState<Stability | 'all'>('all')
  const [cushion, setCushion] = useState<Cushion | 'all'>('all')
  const [price, setPrice] = useState<PriceBand | 'all'>('all')
  const [sort, setSort] = useState<'match' | 'price-asc' | 'price-desc' | 'name'>('match')

  const brands = useMemo(
    () => [...new Set(shoes.map((s) => s.brand))].sort((a, b) => a.localeCompare(b)),
    [],
  )

  const scoreMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!user) return map
    recommendShoes(user, shoes.length).forEach((m) => map.set(m.shoe.id, m.score))
    return map
  }, [user])

  const filtered = useMemo(() => {
    let list = [...shoes]
    const query = q.trim().toLowerCase()
    if (query) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.brand.toLowerCase().includes(query) ||
          s.bestFor.some((b) => b.toLowerCase().includes(query)),
      )
    }
    if (brand !== 'all') list = list.filter((s) => s.brand === brand)
    if (surface !== 'all') list = list.filter((s) => s.surfaces.includes(surface))
    if (stability !== 'all') list = list.filter((s) => s.stability === stability)
    if (cushion !== 'all') list = list.filter((s) => s.cushion === cushion)
    if (price !== 'all') list = list.filter((s) => s.priceBand === price)

    list.sort((a, b) => {
      if (sort === 'price-asc') return a.priceMyr - b.priceMyr
      if (sort === 'price-desc') return b.priceMyr - a.priceMyr
      if (sort === 'name') return a.name.localeCompare(b.name)
      const sa = scoreMap.get(a.id) ?? -1
      const sb = scoreMap.get(b.id) ?? -1
      if (sa !== sb) return sb - sa
      return a.name.localeCompare(b.name)
    })
    return list
  }, [q, brand, surface, stability, cushion, price, sort, scoreMap])

  const labelStab = (v: string) =>
    v === 'motion-control' ? t('motionControl') : t(v as TranslationKey)
  const labelCush = (v: string) => t(v as TranslationKey)

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{t('catalogEyebrow')}</p>
        <h1>{t('catalogTitle')}</h1>
        <p className="lede">
          {t('catalogLede', { ranked: user ? t('catalogRanked') : '.' })}
        </p>
      </header>

      <div className="filters panel">
        <label className="search-field">
          <Search size={16} />
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <div className="filter-row">
          <Select
            label={t('filterBrand')}
            value={brand}
            onChange={setBrand}
            options={[['all', t('allBrands')], ...brands.map((b) => [b, b] as [string, string])]}
          />
          <Select
            label={t('filterSurface')}
            value={surface}
            onChange={(v) => setSurface(v as Surface | 'all')}
            options={[
              ['all', t('allSurfaces')],
              ['road', t('road')],
              ['trail', t('trail')],
              ['track', t('track')],
              ['gym', t('gym')],
            ]}
          />
          <Select
            label={t('filterStability')}
            value={stability}
            onChange={(v) => setStability(v as Stability | 'all')}
            options={[
              ['all', t('all')],
              ['neutral', t('neutral')],
              ['stability', t('stability')],
              ['motion-control', t('motionControl')],
            ]}
          />
          <Select
            label={t('filterCushion')}
            value={cushion}
            onChange={(v) => setCushion(v as Cushion | 'all')}
            options={[
              ['all', t('all')],
              ['firm', t('firm')],
              ['balanced', t('balanced')],
              ['max', t('max')],
            ]}
          />
          <Select
            label={t('filterBudget')}
            value={price}
            onChange={(v) => setPrice(v as PriceBand | 'all')}
            options={[
              ['all', t('anyPrice')],
              ['budget', t('budgetBand')],
              ['mid', t('midBand')],
              ['premium', t('premiumBand')],
            ]}
          />
          <Select
            label={t('filterSort')}
            value={sort}
            onChange={(v) => setSort(v as typeof sort)}
            options={[
              ['match', user ? t('sortMatch') : t('sortMatchNeed')],
              ['price-asc', t('sortPriceAsc')],
              ['price-desc', t('sortPriceDesc')],
              ['name', t('sortName')],
            ]}
          />
        </div>
        <p className="muted filter-count">
          {t(filtered.length === 1 ? 'shoesCount' : 'shoesCountPlural', { count: filtered.length })}
          {!user && sort === 'match' ? t('finishForRank') : ''}
        </p>
      </div>

      <div className="catalog-grid">
        {filtered.map((shoe) => {
          const score = scoreMap.get(shoe.id)
          const saved = isShortlisted(shoe.id)
          const comparing = isComparing(shoe.id)
          return (
            <article key={shoe.id} className="catalog-card">
              <div className="catalog-visual">
                <ShoeImage
                  src={shoe.image}
                  alt={`${shoe.brand} ${shoe.name}`}
                  accent={shoe.accent}
                  imgClassName="catalog-img"
                />
                {score != null && (
                  <span className="shoe-score">{t('matchPct', { score })}</span>
                )}
              </div>
              <div className="catalog-body">
                <p className="shoe-brand">{shoe.brand}</p>
                <h3>{shoe.name}</h3>
                <p className="shoe-summary">{shoe.summary}</p>
                <div className="tag-row">
                  <span className="tag">{labelStab(shoe.stability)}</span>
                  <span className="tag">{labelCush(shoe.cushion)}</span>
                  <span className="tag">RM {shoe.priceMyr}</span>
                </div>
                <div className="card-actions">
                  <Link to={`/results/${shoe.id}`} className="btn btn-secondary btn-sm">
                    {t('details')}
                  </Link>
                  <div className="card-icon-actions">
                    <button
                      type="button"
                      className={`icon-btn ${saved ? 'active' : ''}`}
                      onClick={() => {
                        toggleShortlist(shoe.id)
                        toast(saved ? t('toastRemoved') : t('toastSaved'))
                      }}
                      aria-label={t('save')}
                    >
                      <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      className={`icon-btn ${comparing ? 'active' : ''}`}
                      onClick={() => {
                        toggleCompare(shoe.id)
                        toast(comparing ? t('toastCompareRemove') : t('toastCompareAdd'))
                      }}
                      aria-label={t('compare')}
                    >
                      <GitCompareArrows size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="panel center-panel" style={{ marginTop: '1rem' }}>
          <h2>{t('noFilterTitle')}</h2>
          <p className="muted">{t('noFilterBody')}</p>
        </div>
      )}
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <div className="select-shell">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map(([v, text]) => (
            <option key={v} value={v}>
              {text}
            </option>
          ))}
        </select>
        <ChevronDown className="select-chevron" size={16} aria-hidden />
      </div>
    </label>
  )
}
