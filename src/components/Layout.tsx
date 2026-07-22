import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Activity, Footprints, Heart, Menu, X } from 'lucide-react'
import { CompareBar } from './CompareBar'
import { useProfile } from '../context/ProfileContext'
import { useI18n } from '../context/I18nContext'

export function Layout() {
  const { shortlist, isComplete } = useProfile()
  const { lang, setLang, t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const navLinks = (
    <>
      <NavLink to="/" end onClick={() => setMenuOpen(false)}>
        {t('navHome')}
      </NavLink>
      <NavLink to="/analyze" onClick={() => setMenuOpen(false)}>
        {t('navAnalyze')}
      </NavLink>
      <NavLink to="/catalog" onClick={() => setMenuOpen(false)}>
        {t('navCatalog')}
      </NavLink>
      {isComplete && (
        <NavLink to="/results" onClick={() => setMenuOpen(false)}>
          {t('navResults')}
        </NavLink>
      )}
      <NavLink to="/shortlist" className="nav-shortlist" onClick={() => setMenuOpen(false)}>
        {t('navShortlist')}
        {shortlist.length > 0 && <span className="nav-badge">{shortlist.length}</span>}
      </NavLink>
      <NavLink to="/stores" onClick={() => setMenuOpen(false)}>
        {t('navStores')}
      </NavLink>
      <NavLink to="/how-it-works" onClick={() => setMenuOpen(false)}>
        {t('navHow')}
      </NavLink>
    </>
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          type="button"
          className="icon-btn menu-toggle"
          aria-label={menuOpen ? t('menuClose') : t('menuOpen')}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden>
            <Footprints size={20} strokeWidth={2.25} />
          </span>
          <span className="brand-text">
            Stride<span>Match</span>
          </span>
        </Link>

        <nav className="nav desktop-nav" aria-label="Main">
          {navLinks}
        </nav>

        <div className="topbar-right">
          <div className="lang-toggle" role="group" aria-label="Language">
            <button
              type="button"
              className={lang === 'en' ? 'active' : ''}
              onClick={() => setLang('en')}
            >
              {t('langEn')}
            </button>
            <button
              type="button"
              className={lang === 'ms' ? 'active' : ''}
              onClick={() => setLang('ms')}
            >
              {t('langMs')}
            </button>
          </div>
          <Link to="/shortlist" className="icon-btn topbar-heart" aria-label={t('navShortlist')}>
            <Heart size={18} />
            {shortlist.length > 0 && <span className="nav-badge float">{shortlist.length}</span>}
          </Link>
          <Link to="/analyze" className="btn btn-primary btn-sm topbar-cta">
            <Activity size={16} />
            <span className="cta-label">{t('ctaFind')}</span>
          </Link>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`nav-backdrop ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <nav
        id="mobile-nav"
        className={`mobile-nav ${menuOpen ? 'open' : ''}`}
        aria-label="Mobile"
        aria-hidden={!menuOpen}
      >
        <div className="mobile-nav-head">
          <span className="mobile-nav-title">{t('menuTitle')}</span>
          <button
            type="button"
            className="icon-btn"
            aria-label={t('menuClose')}
            onClick={() => setMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="mobile-nav-links">{navLinks}</div>
        <div className="mobile-nav-lang">
          <span className="muted">{t('language')}</span>
          <div className="lang-toggle" role="group" aria-label="Language">
            <button
              type="button"
              className={lang === 'en' ? 'active' : ''}
              onClick={() => setLang('en')}
            >
              {t('langEn')}
            </button>
            <button
              type="button"
              className={lang === 'ms' ? 'active' : ''}
              onClick={() => setLang('ms')}
            >
              {t('langMs')}
            </button>
          </div>
        </div>
        <Link
          to="/analyze"
          className="btn btn-primary mobile-nav-cta"
          onClick={() => setMenuOpen(false)}
        >
          <Activity size={16} />
          {t('ctaFind')}
        </Link>
      </nav>

      <main className="main">
        <Outlet />
      </main>
      <CompareBar />
      <footer className="footer">
        <p>{t('footer')}</p>
      </footer>
    </div>
  )
}
