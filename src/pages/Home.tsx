import { Link } from 'react-router-dom'
import {
  Camera,
  ClipboardList,
  Sparkles,
  ShieldCheck,
  Zap,
  Footprints,
  Heart,
  GitCompareArrows,
  MapPin,
} from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { useI18n } from '../context/I18nContext'

export function Home() {
  const { isComplete, shortlist } = useProfile()
  const { t } = useI18n()
  const countBit = shortlist.length ? ` (${shortlist.length})` : ''

  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <Sparkles size={14} /> {t('heroEyebrow')}
          </p>
          <h1>
            {t('heroTitle1')}
            <span className="accent-text">{t('heroTitle2')}</span>
          </h1>
          <p className="lede">{t('heroLede')}</p>
          <div className="hero-actions">
            {isComplete ? (
              <>
                <Link to="/results" className="btn btn-primary btn-lg">
                  <Sparkles size={18} />
                  {t('viewMatches')}
                </Link>
                <Link to="/analyze" className="btn btn-secondary btn-lg">
                  {t('retakeAnalysis')}
                </Link>
              </>
            ) : (
              <>
                <Link to="/analyze" className="btn btn-primary btn-lg">
                  <Camera size={18} />
                  {t('startAnalysis')}
                </Link>
                <Link to="/catalog" className="btn btn-secondary btn-lg">
                  {t('browseCatalog')}
                </Link>
              </>
            )}
          </div>
          <ul className="hero-points">
            <li>
              <ShieldCheck size={16} /> {t('homePointPrivacy')}
            </li>
            <li>
              <Zap size={16} /> {t('homePointSpeed')}
            </li>
            <li>
              <Footprints size={16} /> {t('homePointCatalog')}
            </li>
          </ul>
        </div>
        <div className="hero-panel">
          <div className="hero-card">
            <div className="hero-card-top">
              <span className="pill">{t('sampleMatch')}</span>
              <span className="match-badge">{t('matchPct', { score: 92 })}</span>
            </div>
            <div className="hero-shoe">
              <div className="hero-shoe-shape" />
            </div>
            <h3>ASICS Gel-Kayano 32</h3>
            <p>Stability · balanced cushion · RM 749</p>
            <div className="mini-bars">
              <div>
                <span>{t('fitBarArch')}</span>
                <i style={{ width: '90%' }} />
              </div>
              <div>
                <span>{t('fitBarGait')}</span>
                <i style={{ width: '95%' }} />
              </div>
              <div>
                <span>{t('fitBarCushion')}</span>
                <i style={{ width: '78%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">{t('homeStepsTitle')}</h2>
        <div className="feature-grid">
          <article className="feature">
            <div className="feature-icon">
              <Camera size={22} />
            </div>
            <h3>{t('homeStep1Title')}</h3>
            <p>{t('homeStep1Body')}</p>
          </article>
          <article className="feature">
            <div className="feature-icon">
              <ClipboardList size={22} />
            </div>
            <h3>{t('homeStep2Title')}</h3>
            <p>{t('homeStep2Body')}</p>
          </article>
          <article className="feature">
            <div className="feature-icon">
              <Sparkles size={22} />
            </div>
            <h3>{t('homeStep3Title')}</h3>
            <p>{t('homeStep3Body')}</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">{t('homeAfterTitle')}</h2>
        <div className="feature-grid">
          <article className="feature">
            <div className="feature-icon">
              <Heart size={22} />
            </div>
            <h3>{t('homeShortlistTitle')}</h3>
            <p>{t('homeShortlistBody', { count: countBit })}</p>
          </article>
          <article className="feature">
            <div className="feature-icon">
              <GitCompareArrows size={22} />
            </div>
            <h3>{t('homeCompareTitle')}</h3>
            <p>{t('homeCompareBody')}</p>
          </article>
          <article className="feature">
            <div className="feature-icon">
              <MapPin size={22} />
            </div>
            <h3>{t('homeStoresTitle')}</h3>
            <p>{t('homeStoresBody')}</p>
          </article>
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>{t('homeCtaTitle')}</h2>
          <p>{t('homeCtaBody')}</p>
        </div>
        <Link to={isComplete ? '/results' : '/analyze'} className="btn btn-primary btn-lg">
          {isComplete ? t('viewMatches') : t('ctaFind')}
        </Link>
      </section>
    </div>
  )
}
