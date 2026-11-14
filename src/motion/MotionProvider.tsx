import type { ReactNode } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'

/**
 * App-wide motion settings: follow the phone's "reduce motion" setting, and load only the
 * animation features we use (LazyMotion + `m` components) to keep the phone bundle small.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
