import type { CSSProperties } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useReduceMotion } from './useReduceMotion'
import { SWIRL_PHONE_OPACITY } from '../theme/palette'

interface Ribbon {
  d: string
  width: number
  opacity: number
  dotted?: boolean
}

/** Three ribbons per side, from the approved mockup (viewBox 0 0 260 900). */
const RIBBONS: Ribbon[] = [
  { d: 'M150 -40 C 40 120, 240 220, 120 360 S 20 560, 160 680 S 230 860, 90 960', width: 16, opacity: 0.55 },
  { d: 'M190 -40 C 80 140, 260 260, 150 390 S 60 590, 190 710 S 250 880, 130 980', width: 9, opacity: 0.7 },
  { d: 'M110 -40 C 10 110, 200 200, 90 330 S -10 530, 120 650 S 190 830, 50 940', width: 3, opacity: 0.45, dotted: true },
]

const SIDES = {
  left: ['#34D399', '#FDBA74', '#047857'],
  right: ['#FDBA74', '#34D399', '#F97316'],
} as const

interface Motion {
  drawn: MotionValue<number>
  y: MotionValue<number>
  rotate: MotionValue<number>
}

function Swirl({ side, motionValues }: { side: 'left' | 'right'; motionValues?: Motion }) {
  const colours = SIDES[side]
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
    return <motion.path key={i} {...common} style={{ ...common.style, pathLength: motionValues.drawn }} />
  })

  return (
    <svg className={`swirl ${side}`} viewBox="0 0 260 900" preserveAspectRatio="none">
      {motionValues ? (
        <motion.g
          className="swirl-group"
          style={{ y: motionValues.y, rotate: motionValues.rotate }}
        >
          {paths}
        </motion.g>
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
      <motion.div className="glow glow-mint" style={{ x: g1x, y: g1y }} />
      <motion.div className="glow glow-mango" style={{ x: g2x, y: g2y }} />
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
