import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'

/** App-wide motion settings: follow the phone's "reduce motion" setting. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
