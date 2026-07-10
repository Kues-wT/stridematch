import { ExternalLink, MapPin, Store } from 'lucide-react'
import { storesMy } from '../data/storesMy'
import { useI18n } from '../context/I18nContext'

export function Stores() {
  const { lang, t } = useI18n()

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
              <span className="store-type">{s.type}</span>
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
              Open in Maps <ExternalLink size={14} />
            </a>
          </article>
        ))}
      </div>

      <div className="panel tip-panel">
        <h2>{lang === 'ms' ? 'Tips cuba kasut' : 'In-store try-on tips'}</h2>
        <ul className="plain-list">
          <li>
            {lang === 'ms'
              ? 'Cuba pada petang — kaki sedikit bengkak seperti selepas berlari.'
              : 'Try shoes in the afternoon — feet are slightly swollen, closer to post-run size.'}
          </li>
          <li>
            {lang === 'ms'
              ? 'Bawa stokin lari biasa dan, jika ada, kasut lama untuk rujukan haus sole.'
              : 'Bring your usual running socks and an old pair if you have one (for wear reference).'}
          </li>
          <li>
            {lang === 'ms'
              ? 'Pastikan kira-kira ibu jari ruang di hadapan jari kaki; berlari 2–3 minit jika dibenarkan.'
              : 'Leave roughly a thumb’s width at the toe; jog 2–3 minutes if the store allows.'}
          </li>
          <li>
            {lang === 'ms'
              ? 'Bandingkan harga dan stok di kedai KK / dalam talian sebelum beli.'
              : 'Compare price and stock at KK shops or online before you buy.'}
          </li>
        </ul>
      </div>
    </div>
  )
}
