import { Link, NavLink, Outlet } from 'react-router-dom'
import { Activity, Footprints, Heart } from 'lucide-react'
import { CompareBar } from './CompareBar'
import { useProfile } from '../context/ProfileContext'
import { useI18n } from '../context/I18nContext'

export function Layout() {
  const { shortlist, isComplete } = useProfile()
  const { lang, setLang, t } = useI18n()

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden>
            <Footprints size={20} strokeWidth={2.25} />
          </span>
          <span className="brand-text">
            Stride<span>Match</span>
          </span>
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            {t('navHome')}
          </NavLink>
          <NavLink to="/analyze">{t('navAnalyze')}</NavLink>
          <NavLink to="/catalog">{t('navCatalog')}</NavLink>
          {isComplete && <NavLink to="/results">{t('navResults')}</NavLink>}
          <NavLink to="/shortlist" className="nav-shortlist">
            {t('navShortlist')}
            {shortlist.length > 0 && <span className="nav-badge">{shortlist.length}</span>}
          </NavLink>
          <NavLink to="/stores">{t('navStores')}</NavLink>
          <NavLink to="/how-it-works">{t('navHow')}</NavLink>
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
            {t('ctaFind')}
          </Link>
        </div>
      </header>
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
