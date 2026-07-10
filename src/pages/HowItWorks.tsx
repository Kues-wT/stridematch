import { Link } from 'react-router-dom'
import { Camera, BrainCircuit, ListChecks, Shield, Footprints, SportShoe } from 'lucide-react'
import { useI18n } from '../context/I18nContext'

export function HowItWorks() {
  const { t } = useI18n()

  return (
    <div className="page narrow">
      <header className="page-header">
        <p className="eyebrow">{t('howEyebrow')}</p>
        <h1>{t('howTitle')}</h1>
        <p className="lede">{t('howLede')}</p>
      </header>

      <div className="info-stack">
        <section className="info-card">
          <Camera size={22} className="info-icon" />
          <div>
            <h2>{t('howTopTitle')}</h2>
            <p>{t('howTopBody')}</p>
          </div>
        </section>

        <section className="info-card">
          <Footprints size={22} className="info-icon" />
          <div>
            <h2>{t('howSideTitle')}</h2>
            <p>{t('howSideBody')}</p>
          </div>
        </section>

        <section className="info-card">
          <SportShoe size={22} className="info-icon" />
          <div>
            <h2>{t('howWearTitle')}</h2>
            <p>{t('howWearBody')}</p>
          </div>
        </section>

        <section className="info-card">
          <ListChecks size={22} className="info-icon" />
          <div>
            <h2>{t('howQuizTitle')}</h2>
            <p>{t('howQuizBody')}</p>
          </div>
        </section>

        <section className="info-card">
          <BrainCircuit size={22} className="info-icon" />
          <div>
            <h2>{t('howScoreTitle')}</h2>
            <p>{t('howScoreIntro')}</p>
            <ul className="plain-list">
              <li>{t('howScore1')}</li>
              <li>{t('howScore2')}</li>
              <li>{t('howScore3')}</li>
              <li>{t('howScore4')}</li>
              <li>{t('howScore5')}</li>
              <li>{t('howScore6')}</li>
            </ul>
            <p>{t('howScoreOutro')}</p>
          </div>
        </section>

        <section className="info-card">
          <Shield size={22} className="info-icon" />
          <div>
            <h2>{t('howPrivacyTitle')}</h2>
            <p>{t('howPrivacyBody')}</p>
          </div>
        </section>
      </div>

      <div className="page-actions">
        <Link to="/analyze" className="btn btn-primary btn-lg">
          {t('startAnalysis')}
        </Link>
      </div>
    </div>
  )
}
