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
  const { t, lang } = useI18n()

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
              <ShieldCheck size={16} />{' '}
              {lang === 'ms' ? 'Analisis kekal dalam pelayar' : 'Analysis stays in your browser'}
            </li>
            <li>
              <Zap size={16} />{' '}
              {lang === 'ms' ? 'Keputusan dalam masa 2 minit' : 'Results in under 2 minutes'}
            </li>
            <li>
              <Footprints size={16} />{' '}
              {lang === 'ms'
                ? 'Katalog sebenar · harga MYR · kedai MY'
                : 'Real models · MYR prices · MY store tips'}
            </li>
          </ul>
        </div>
        <div className="hero-panel">
          <div className="hero-card">
            <div className="hero-card-top">
              <span className="pill">Sample match</span>
              <span className="match-badge">92% match</span>
            </div>
            <div className="hero-shoe">
              <div className="hero-shoe-shape" />
            </div>
            <h3>ASICS Gel-Kayano 32</h3>
            <p>Stability · balanced cushion · ~RM 749</p>
            <div className="mini-bars">
              <div>
                <span>Arch fit</span>
                <i style={{ width: '90%' }} />
              </div>
              <div>
                <span>Gait support</span>
                <i style={{ width: '95%' }} />
              </div>
              <div>
                <span>Mileage</span>
                <i style={{ width: '78%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          {lang === 'ms' ? 'Tiga langkah ke kasut yang lebih sesuai' : 'Three steps to a better pair'}
        </h2>
        <div className="feature-grid">
          <article className="feature">
            <div className="feature-icon">
              <Camera size={22} />
            </div>
            <h3>{lang === 'ms' ? '1. Foto kaki (+ haus kasut)' : '1. Capture your foot'}</h3>
            <p>
              {lang === 'ms'
                ? 'Foto atas, sisi, dan pilihan sole kasut lama. Heuristik di peranti menganggarkan arka, lebar, dan isyarat pronasi.'
                : 'Top-down, optional side view, and optional old-shoe wear. On-device heuristics estimate arch, width, and pronation cues.'}
            </p>
          </article>
          <article className="feature">
            <div className="feature-icon">
              <ClipboardList size={22} />
            </div>
            <h3>{lang === 'ms' ? '2. Ceritakan cara anda berlari' : '2. Tell us how you run'}</h3>
            <p>
              {lang === 'ms'
                ? 'Pronasi, jarak mingguan, permukaan, pengalaman, kusyen, dan bajet membentuk padanan.'
                : 'Pronation, weekly distance, surface, experience, cushion preference, and budget shape the match.'}
            </p>
          </article>
          <article className="feature">
            <div className="feature-icon">
              <Sparkles size={22} />
            </div>
            <h3>{lang === 'ms' ? '3. Dapatkan pilihan berperingkat' : '3. Get ranked picks'}</h3>
            <p>
              {lang === 'ms'
                ? 'Model sebenar (ASICS, HOKA, Brooks…) dengan skor, sebab, shortlist, banding, dan pautan beli.'
                : 'Real models (ASICS, HOKA, Brooks…) with scores, reasons, shortlist, compare, and research links.'}
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          {lang === 'ms' ? 'Selepas anda dapat padanan' : 'After you match'}
        </h2>
        <div className="feature-grid">
          <article className="feature">
            <div className="feature-icon">
              <Heart size={22} />
            </div>
            <h3>{lang === 'ms' ? 'Shortlist kegemaran' : 'Shortlist favorites'}</h3>
            <p>
              {lang === 'ms'
                ? `Simpan kasut pada peranti ini${shortlist.length ? ` (${shortlist.length} disimpan)` : ''} — tanpa akaun.`
                : `Save shoes on this device${shortlist.length ? ` (${shortlist.length} saved)` : ''} — no account required.`}
            </p>
          </article>
          <article className="feature">
            <div className="feature-icon">
              <GitCompareArrows size={22} />
            </div>
            <h3>{lang === 'ms' ? 'Banding sisi ke sisi' : 'Compare side by side'}</h3>
            <p>
              {lang === 'ms'
                ? 'Banding hingga 3 kasut: berat, drop, kestabilan, harga, dan bar padanan anda.'
                : 'Stack up to three shoes on weight, drop, stability, price, and your personal fit bars.'}
            </p>
          </article>
          <article className="feature">
            <div className="feature-icon">
              <MapPin size={22} />
            </div>
            <h3>{lang === 'ms' ? 'Cuba di Malaysia' : 'Try on in Malaysia'}</h3>
            <p>
              {lang === 'ms'
                ? 'Tips kedai untuk Kuching, KL, dan beli dalam talian — buka halaman Kedai (MY).'
                : 'Store tips for Kuching, KL, and online buying — open Stores (MY).'}
            </p>
          </article>
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>
            {lang === 'ms'
              ? 'Bersedia berhenti meneka di rak kasut?'
              : 'Ready to stop guessing at the shoe wall?'}
          </h2>
          <p>
            {lang === 'ms'
              ? 'Tiada akaun diperlukan. Pemprosesan foto tidak meninggalkan peranti ini.'
              : 'No account needed. Photo processing never leaves this device.'}
          </p>
        </div>
        <Link to={isComplete ? '/results' : '/analyze'} className="btn btn-primary btn-lg">
          {isComplete ? t('viewMatches') : t('ctaFind')}
        </Link>
      </section>
    </div>
  )
}
