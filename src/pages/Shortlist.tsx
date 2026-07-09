import { Link } from 'react-router-dom'
import { Heart, GitCompareArrows } from 'lucide-react'
import { useMemo } from 'react'
import { shoes } from '../data/shoes'
import { useProfile } from '../context/ProfileContext'
import { recommendShoes } from '../lib/recommend'
import { ShoeCard } from '../components/ShoeCard'
import { ShoeImage } from '../components/ShoeImage'
import { useToast } from '../components/Toast'

export function Shortlist() {
  const { shortlist, toggleShortlist, toggleCompare, isComparing, asUserProfile } = useProfile()
  const { toast } = useToast()
  const user = asUserProfile()

  const savedShoes = useMemo(
    () => shortlist.map((id) => shoes.find((s) => s.id === id)).filter(Boolean) as typeof shoes,
    [shortlist],
  )

  const matches = useMemo(() => {
    if (!user) return null
    const all = recommendShoes(user, shoes.length)
    return shortlist
      .map((id) => all.find((m) => m.shoe.id === id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .sort((a, b) => b.score - a.score)
  }, [user, shortlist])

  if (savedShoes.length === 0) {
    return (
      <div className="page narrow">
        <div className="panel center-panel">
          <Heart size={28} className="empty-icon" />
          <h1>Your shortlist is empty</h1>
          <p className="muted">
            Tap the heart on any shoe from Results or Catalog to save it for later.
          </p>
          <div className="row-actions" style={{ justifyContent: 'center' }}>
            <Link to="/results" className="btn btn-primary">
              View matches
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
        <p className="eyebrow">Saved</p>
        <h1>Your shortlist</h1>
        <p className="lede">
          {savedShoes.length} shoe{savedShoes.length === 1 ? '' : 's'} saved on this device.
          {user ? ' Ranked by your current profile when available.' : ''}
        </p>
      </header>

      {matches ? (
        <div className="results-grid">
          {matches.map((m, i) => (
            <ShoeCard key={m.shoe.id} match={m} rank={i + 1} showFitBars />
          ))}
        </div>
      ) : (
        <div className="catalog-grid">
          {savedShoes.map((shoe) => (
            <article key={shoe.id} className="catalog-card">
              <div
                className="catalog-visual"
                style={{ background: `linear-gradient(145deg, ${shoe.color}, #0b1220)` }}
              >
                <ShoeImage
                  src={shoe.image}
                  alt={`${shoe.brand} ${shoe.name}`}
                  accent={shoe.accent}
                  imgClassName="catalog-img"
                />
              </div>
              <div className="catalog-body">
                <p className="shoe-brand">{shoe.brand}</p>
                <h3>{shoe.name}</h3>
                <p className="shoe-summary">{shoe.summary}</p>
                <div className="tag-row">
                  <span className="tag">RM {shoe.priceMyr}</span>
                  <span className="tag">{shoe.stability}</span>
                </div>
                <div className="card-actions">
                  <Link to={`/results/${shoe.id}`} className="btn btn-secondary btn-sm">
                    Details
                  </Link>
                  <div className="card-icon-actions">
                    <button
                      type="button"
                      className="icon-btn active"
                      onClick={() => {
                        toggleShortlist(shoe.id)
                        toast('Removed from shortlist')
                      }}
                    >
                      <Heart size={16} fill="currentColor" />
                    </button>
                    <button
                      type="button"
                      className={`icon-btn ${isComparing(shoe.id) ? 'active' : ''}`}
                      onClick={() => {
                        toggleCompare(shoe.id)
                        toast(isComparing(shoe.id) ? 'Removed from compare' : 'Added to compare')
                      }}
                    >
                      <GitCompareArrows size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
