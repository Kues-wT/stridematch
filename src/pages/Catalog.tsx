import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, GitCompareArrows, Heart } from 'lucide-react'
import { shoes, type Cushion, type PriceBand, type Stability, type Surface } from '../data/shoes'
import { useProfile } from '../context/ProfileContext'
import { recommendShoes } from '../lib/recommend'
import { ShoeSilhouette } from '../components/ShoeSilhouette'
import { useToast } from '../components/Toast'

export function Catalog() {
  const { asUserProfile, isShortlisted, toggleShortlist, isComparing, toggleCompare } = useProfile()
  const { toast } = useToast()
  const user = asUserProfile()

  const [q, setQ] = useState('')
  const [surface, setSurface] = useState<Surface | 'all'>('all')
  const [stability, setStability] = useState<Stability | 'all'>('all')
  const [cushion, setCushion] = useState<Cushion | 'all'>('all')
  const [price, setPrice] = useState<PriceBand | 'all'>('all')
  const [sort, setSort] = useState<'match' | 'price-asc' | 'price-desc' | 'name'>('match')

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
    if (surface !== 'all') list = list.filter((s) => s.surfaces.includes(surface))
    if (stability !== 'all') list = list.filter((s) => s.stability === stability)
    if (cushion !== 'all') list = list.filter((s) => s.cushion === cushion)
    if (price !== 'all') list = list.filter((s) => s.priceBand === price)

    list.sort((a, b) => {
      if (sort === 'price-asc') return a.priceMyr - b.priceMyr
      if (sort === 'price-desc') return b.priceMyr - a.priceMyr
      if (sort === 'name') return a.name.localeCompare(b.name)
      // match
      const sa = scoreMap.get(a.id) ?? -1
      const sb = scoreMap.get(b.id) ?? -1
      if (sa !== sb) return sb - sa
      return a.name.localeCompare(b.name)
    })
    return list
  }, [q, surface, stability, cushion, price, sort, scoreMap])

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Browse</p>
        <h1>Shoe catalog</h1>
        <p className="lede">
          Explore the full sample lineup. Filter by surface, support, and budget
          {user ? ' — sorted by your match score when available.' : '.'}
        </p>
      </header>

      <div className="filters panel">
        <label className="search-field">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search name, brand, use case…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <div className="filter-row">
          <Select
            label="Surface"
            value={surface}
            onChange={(v) => setSurface(v as Surface | 'all')}
            options={[
              ['all', 'All surfaces'],
              ['road', 'Road'],
              ['trail', 'Trail'],
              ['track', 'Track'],
              ['gym', 'Gym'],
            ]}
          />
          <Select
            label="Stability"
            value={stability}
            onChange={(v) => setStability(v as Stability | 'all')}
            options={[
              ['all', 'All'],
              ['neutral', 'Neutral'],
              ['stability', 'Stability'],
              ['motion-control', 'Motion control'],
            ]}
          />
          <Select
            label="Cushion"
            value={cushion}
            onChange={(v) => setCushion(v as Cushion | 'all')}
            options={[
              ['all', 'All'],
              ['firm', 'Firm'],
              ['balanced', 'Balanced'],
              ['max', 'Max'],
            ]}
          />
          <Select
            label="Budget"
            value={price}
            onChange={(v) => setPrice(v as PriceBand | 'all')}
            options={[
              ['all', 'Any price'],
              ['budget', 'Budget'],
              ['mid', 'Mid'],
              ['premium', 'Premium'],
            ]}
          />
          <Select
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as typeof sort)}
            options={[
              ['match', user ? 'Best match' : 'Best match (need profile)'],
              ['price-asc', 'Price: low → high'],
              ['price-desc', 'Price: high → low'],
              ['name', 'Name'],
            ]}
          />
        </div>
        <p className="muted filter-count">
          {filtered.length} shoe{filtered.length === 1 ? '' : 's'}
          {!user && sort === 'match' ? ' · complete analysis to unlock personal ranking' : ''}
        </p>
      </div>

      <div className="catalog-grid">
        {filtered.map((shoe) => {
          const score = scoreMap.get(shoe.id)
          const saved = isShortlisted(shoe.id)
          const comparing = isComparing(shoe.id)
          return (
            <article key={shoe.id} className="catalog-card">
              <div
                className="catalog-visual"
                style={{ background: `linear-gradient(145deg, ${shoe.color}, #0b1220)` }}
              >
                <ShoeSilhouette accent={shoe.accent} />
                {score != null && <span className="shoe-score">{score}% match</span>}
              </div>
              <div className="catalog-body">
                <p className="shoe-brand">{shoe.brand}</p>
                <h3>{shoe.name}</h3>
                <p className="shoe-summary">{shoe.summary}</p>
                <div className="tag-row">
                  <span className="tag">{shoe.stability}</span>
                  <span className="tag">{shoe.cushion}</span>
                  <span className="tag">RM {shoe.priceMyr}</span>
                </div>
                <div className="card-actions">
                  <Link to={`/results/${shoe.id}`} className="btn btn-secondary btn-sm">
                    Details
                  </Link>
                  <div className="card-icon-actions">
                    <button
                      type="button"
                      className={`icon-btn ${saved ? 'active' : ''}`}
                      onClick={() => {
                        toggleShortlist(shoe.id)
                        toast(saved ? 'Removed from shortlist' : 'Saved to shortlist')
                      }}
                      aria-label="Shortlist"
                    >
                      <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      className={`icon-btn ${comparing ? 'active' : ''}`}
                      onClick={() => {
                        toggleCompare(shoe.id)
                        toast(comparing ? 'Removed from compare' : 'Added to compare')
                      }}
                      aria-label="Compare"
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
          <h2>No shoes match those filters</h2>
          <p className="muted">Try clearing search or widening surface / budget.</p>
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
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
  )
}
