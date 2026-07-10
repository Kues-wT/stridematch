import { ExternalLink, MapPin, Store } from 'lucide-react'
import { storesMy } from '../data/storesMy'
import { useI18n } from '../context/I18nContext'
import type { TranslationKey } from '../i18n/translations'

export function Stores() {
  const { lang, t } = useI18n()

  const typeKey = (type: string): TranslationKey => {
    if (type === 'mall') return 'storeTypeMall'
    if (type === 'specialty') return 'storeTypeSpecialty'
    if (type === 'brand') return 'storeTypeBrand'
    return 'storeTypeOnline'
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">
          <MapPin size={14} /> Malaysia
        </p>
        <h1>{t('storesTitle')}</h1>
        <p className="lede">{t('storesLede')}</p>
      </header>

      <div className="store-grid">
        {storesMy.map((s) => (
          <article key={s.id} className="store-card panel">
            <div className="store-card-top">
              <span className="store-type">{t(typeKey(s.type))}</span>
              <span className="muted">
                {s.city}, {s.state}
              </span>
            </div>
            <h2>
              <Store size={18} /> {s.name}
            </h2>
            <p className="muted">{lang === 'ms' ? s.notesMs : s.notes}</p>
            <a
              className="btn btn-secondary btn-sm"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.mapQuery)}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('openInMaps')} <ExternalLink size={14} />
            </a>
          </article>
        ))}
      </div>

      <div className="panel tip-panel">
        <h2>{t('tryOnTips')}</h2>
        <ul className="plain-list">
          <li>{t('tryTip1')}</li>
          <li>{t('tryTip2')}</li>
          <li>{t('tryTip3')}</li>
          <li>{t('tryTip4')}</li>
        </ul>
      </div>
    </div>
  )
}
