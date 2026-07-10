import type { FitDimension } from '../lib/fitBreakdown'
import { useI18n } from '../context/I18nContext'
import type { TranslationKey } from '../i18n/translations'

const LABEL_KEY: Record<string, TranslationKey> = {
  arch: 'fitBarArch',
  gait: 'fitBarGait',
  cushion: 'fitBarCushion',
  surface: 'fitBarSurface',
  budget: 'fitBarBudget',
  overall: 'fitBarOverall',
}

export function FitBars({ dims, compact }: { dims: FitDimension[]; compact?: boolean }) {
  const { t } = useI18n()
  const list = compact ? dims.filter((d) => d.id !== 'overall') : dims
  return (
    <div className={`fit-bars ${compact ? 'compact' : ''}`}>
      {list.map((d) => (
        <div key={d.id} className="fit-bar-row">
          <div className="fit-bar-meta">
            <span>{t(LABEL_KEY[d.id] ?? 'fitBarOverall')}</span>
            <strong>{d.score}%</strong>
          </div>
          <div className="fit-bar-track" aria-hidden>
            <i style={{ width: `${d.score}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
