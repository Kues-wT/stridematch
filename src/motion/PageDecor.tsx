import type { CSSProperties } from 'react'
import { m, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useReduceMotion } from './useReduceMotion'
import { RIBBONS, SWIRL_PHONE_OPACITY, SWIRL_SIDES } from '../theme/palette'

interface Motion {
  drawn: MotionValue<number>
  y: MotionValue<number>
  rotate: MotionValue<number>
}

function Swirl({ side, motionValues }: { side: 'left' | 'right'; motionValues?: Motion }) {
  const colours = SWIRL_SIDES[side]
  const paths = RIBBONS.map((r, i) => {
    const common = {
      d: r.d,
      stroke: colours[i],
      strokeWidth: r.width,
      strokeLinecap: 'round' as const,
      fill: 'none',
      className: r.dotted ? 'dotted' : undefined,
      style: { '--ribbon-opacity': r.opacity } as CSSProperties,
    }
    if (r.dotted) return <path key={i} {...common} strokeDasharray="2 12" />
    if (!motionValues) return <path key={i} {...common} />
    return <m.path key={i} {...common} style={{ ...common.style, pathLength: motionValues.drawn }} />
  })

  return (
    <svg className={`swirl ${side}`} viewBox="0 0 260 900" preserveAspectRatio="none">
      {motionValues ? (
        <m.g
          className="swirl-group"
          style={{ y: motionValues.y, rotate: motionValues.rotate }}
        >
          {paths}
        </m.g>
      ) : (
        <g className="swirl-group">{paths}</g>
      )}
    </svg>
  )
}

function MovingDecor() {
  const { scrollY, scrollYProgress } = useScroll()
  const g1x = useTransform(scrollY, (y) => y * 0.15)
  const g1y = useTransform(scrollY, (y) => y * 0.35)
  const g2x = useTransform(scrollY, (y) => -y * 0.1)
  const g2y = useTransform(scrollY, (y) => -y * 0.2)
  const drawn = useTransform(scrollYProgress, [0, 1], [0.4, 1])
  const lift = useTransform(scrollYProgress, [0, 1], [0, -120])
  const turnLeft = useTransform(scrollYProgress, [0, 1], [0, 14])
  const turnRight = useTransform(scrollYProgress, [0, 1], [0, -14])

  return (
    <>
      <m.div className="glow glow-mint" style={{ x: g1x, y: g1y }} />
      <m.div className="glow glow-mango" style={{ x: g2x, y: g2y }} />
      <Swirl side="left" motionValues={{ drawn, y: lift, rotate: turnLeft }} />
      <Swirl side="right" motionValues={{ drawn, y: lift, rotate: turnRight }} />
    </>
  )
}

/**
 * Soft colour glows and ribbon swirls behind every page. They drift, draw and twist
 * as you scroll; with "reduce motion" on they stay still and fully drawn.
 */
export function PageDecor() {
  const reduce = useReduceMotion()
  return (
    <div
      className={`page-decor${reduce ? ' still' : ''}`}
      aria-hidden="true"
      style={{ '--swirl-phone-opacity': SWIRL_PHONE_OPACITY } as CSSProperties}
    >
      {reduce ? (
        <>
          <div className="glow glow-mint" />
          <div className="glow glow-mango" />
          <Swirl side="left" />
          <Swirl side="right" />
        </>
      ) : (
        <MovingDecor />
      )}
    </div>
  )
}
