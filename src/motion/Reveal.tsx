import { createContext, useContext, type ReactNode } from 'react'
import { motion, type Variants } from 'motion/react'
import { useReduceMotion } from './useReduceMotion'

const EASE = [0.2, 0.8, 0.2, 1] as const

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

/** Set by a parent RevealGroup so children animate in its stagger instead of on their own. */
const InGroup = createContext(false)

/**
 * When true, Reveals render already shown — used for Back/Forward so restored pages
 * don't hide content that was visible a moment ago.
 */
export const RevealInstantly = createContext(false)

type Tag = 'div' | 'section' | 'li'

interface RevealProps {
  children: ReactNode
  as?: Tag
  delay?: number
  className?: string
}

/** Fades and rises into view the first time ~20% of it is on screen. */
export function Reveal({ children, as = 'div', delay = 0, className }: RevealProps) {
  const reduce = useReduceMotion()
  const grouped = useContext(InGroup)
  const instant = useContext(RevealInstantly)
  const Plain = as

  if (reduce || instant) return <Plain className={className}>{children}</Plain>

  const M = motion[as]
  if (grouped) {
    return (
      <M className={className} variants={item}>
        {children}
      </M>
    )
  }
  return (
    <M
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={item}
      transition={{ delay }}
    >
      {children}
    </M>
  )
}

interface RevealGroupProps {
  children: ReactNode
  className?: string
  stagger?: number
}

/** Reveals its direct Reveal children one after another. */
export function RevealGroup({ children, className, stagger = 0.1 }: RevealGroupProps) {
  const reduce = useReduceMotion()
  const instant = useContext(RevealInstantly)

  if (reduce || instant) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      <InGroup.Provider value>{children}</InGroup.Provider>
    </motion.div>
  )
}
