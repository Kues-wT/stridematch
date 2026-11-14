import { m, useScroll, useTransform } from 'motion/react'
import { useI18n } from '../context/I18nContext'
import { useReduceMotion } from '../motion/useReduceMotion'
import type { TranslationKey } from '../i18n/translations'

const BARS: { key: TranslationKey; score: number }[] = [
  { key: 'fitBarArch', score: 90 },
  { key: 'fitBarGait', score: 95 },
  { key: 'fitBarCushion', score: 78 },
]

function CardBody({ animate }: { animate: boolean }) {
  const { t } = useI18n()
  return (
    <>
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
        {BARS.map((b, i) => (
          <div key={b.key}>
            <span>{t(b.key)}</span>
            {animate ? (
              <m.i
                initial={{ width: '0%' }}
                animate={{ width: `${b.score}%` }}
                transition={{ duration: 1.1, delay: 0.25 + i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
              />
            ) : (
              <i style={{ width: `${b.score}%` }} />
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function FloatingCard() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 400], [0, -32], { clamp: true })
  return (
    <m.div className="hero-card" style={{ y }}>
      <CardBody animate />
    </m.div>
  )
}

/** Sample match card on the home page: bars fill on load and the card floats up as you scroll. */
export function HeroMatchCard() {
  const reduce = useReduceMotion()
  if (reduce) {
    return (
      <div className="hero-card">
        <CardBody animate={false} />
      </div>
    )
  }
  return <FloatingCard />
}
