import { Link } from 'react-router-dom'
import { ArrowLeft, Heart } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { shoes } from '../data/shoes'
import { recommendShoes } from '../lib/recommend'
import { getFitBreakdown } from '../lib/fitBreakdown'
import { ShoeImage } from '../components/ShoeImage'
import { useMemo } from 'react'

const ROWS: { key: string; label: string; get: (id: string, ctx: RowCtx) => string | number }[] = [
  { key: 'match', label: 'Match score', get: (id, ctx) => (ctx.scores[id] != null ? `${ctx.scores[id]}%` : '—') },
  { key: 'price', label: 'Price (MYR)', get: (id, ctx) => `RM ${ctx.byId[id].priceMyr}` },
  { key: 'brand', label: 'Brand', get: (id, ctx) => ctx.byId[id].brand },
  { key: 'stability', label: 'Stability', get: (id, ctx) => ctx.byId[id].stability },
  { key: 'arch', label: 'Arch support', get: (id, ctx) => ctx.byId[id].archSupport },
  { key: 'cushion', label: 'Cushion', get: (id, ctx) => ctx.byId[id].cushion },
  { key: 'drop', label: 'Heel drop', get: (id, ctx) => `${ctx.byId[id].dropMm} mm` },
  { key: 'weight', label: 'Weight', get: (id, ctx) => `${ctx.byId[id].weightG} g` },
  { key: 'width', label: 'Width', get: (id, ctx) => ctx.byId[id].width },
  { key: 'surfaces', label: 'Surfaces', get: (id, ctx) => ctx.byId[id].surfaces.join(', ') },
  { key: 'best', label: 'Best for', get: (id, ctx) => ctx.byId[id].bestFor.join(' · ') },
]

interface RowCtx {
  byId: Record<string, (typeof shoes)[number]>
  scores: Record<string, number>
}

export function Compare() {
  const { compareIds, asUserProfile, isShortlisted, toggleShortlist, clearCompare } = useProfile()
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

  if (selected.length < 2) {
    return (
      <div className="page narrow">
        <div className="panel center-panel">
          <h1>Compare shoes</h1>
          <p className="muted">
            Add at least two shoes from Results, Catalog, or Shortlist using the compare button.
          </p>
          <div className="row-actions" style={{ justifyContent: 'center' }}>
            <Link to="/results" className="btn btn-primary">
              Go to results
            </Link>
            <Link to="/catalog" className="btn btn-secondary">
              Browse catalog
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <Link to="/results" className="back-link">
          <ArrowLeft size={16} /> Back
        </Link>
        <p className="eyebrow">Side-by-side</p>
        <h1>Compare shoes</h1>
        <p className="lede">
          Specs and fit dimensions for your shortlisted picks
          {user ? ' — scored against your saved profile.' : '.'}
        </p>
        <div className="row-actions">
          <button type="button" className="btn btn-secondary" onClick={clearCompare}>
            Clear compare
          </button>
        </div>
      </header>

      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">Spec</th>
              {selected.map((shoe) => (
                <th key={shoe.id} scope="col">
                  <div
                    className="compare-head-visual"
                    style={{ background: `linear-gradient(145deg, ${shoe.color}, #0b1220)` }}
                  >
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
                      <span className="match-badge">{scores[shoe.id]}% match</span>
                    )}
                    <div className="compare-head-actions">
                      <Link to={`/results/${shoe.id}`} className="btn btn-ghost btn-sm">
                        Details
                      </Link>
                      <button
                        type="button"
                        className={`icon-btn ${isShortlisted(shoe.id) ? 'active' : ''}`}
                        onClick={() => toggleShortlist(shoe.id)}
                        aria-label="Toggle shortlist"
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
            {ROWS.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                {selected.map((shoe) => (
                  <td key={shoe.id}>{row.get(shoe.id, ctx)}</td>
                ))}
              </tr>
            ))}
            {user &&
              ['arch', 'gait', 'cushion', 'surface', 'budget'].map((dimId) => {
                const label =
                  dimId === 'arch'
                    ? 'Fit: arch'
                    : dimId === 'gait'
                      ? 'Fit: gait'
                      : dimId === 'cushion'
                        ? 'Fit: cushion'
                        : dimId === 'surface'
                          ? 'Fit: surface'
                          : 'Fit: budget'
                return (
                  <tr key={dimId}>
                    <th scope="row">{label}</th>
                    {selected.map((shoe) => {
                      const dim = getFitBreakdown(shoe, user).find((d) => d.id === dimId)
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
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
