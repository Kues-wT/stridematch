import { useContext } from 'react'
import { m } from 'motion/react'
import type { FitDimension } from '../lib/fitBreakdown'
import { useReduceMotion } from '../motion/useReduceMotion'
import { RevealInstantly } from '../motion/Reveal'
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

/** Bar fill that grows to its score the first time it scrolls into view. */
function Fill({ score }: { score: number }) {
  const reduce = useReduceMotion()
  const instant = useContext(RevealInstantly)
  if (reduce || instant) return <i style={{ width: `${score}%` }} />
  return (
    <m.i
      initial={{ width: '0%' }}
      whileInView={{ width: `${score}%` }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
    />
  )
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
            <Fill score={d.score} />
          </div>
        </div>
      ))}
    </div>
  )
}
