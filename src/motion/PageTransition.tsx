import { useRef } from 'react'
import { useLocation, useNavigationType, useOutlet } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { RevealInstantly } from './Reveal'
import { useReduceMotion } from './useReduceMotion'

/** Fired when the old page has finished leaving, so scroll-to-top can wait for it. */
export const PAGE_EXIT_EVENT = 'kasutku:page-exit-complete'

const EASE = [0.2, 0.8, 0.2, 1] as const

/**
 * Short fade + rise between pages, keyed by pathname only (so language switches or
 * in-page state like the Analyze steps never remount). Back/Forward is instant and
 * shows already-revealed content, so scroll restoration lands on visible cards.
 * The tree shape never changes, so re-renders never remount the page.
 */
export function PageTransition() {
  const outlet = useOutlet()
  const location = useLocation()
  const navType = useNavigationType()
  const reduce = useReduceMotion()
  const initialKey = useRef(location.key)
  const hasNavigated = useRef(false)
  if (location.key !== initialKey.current) hasNavigated.current = true

  // The first page of a visit is also a POP; only POPs after a navigation are Back/Forward
  // (including Back to that first page, which returns to the initial history entry).
  const backOrForward = navType === 'POP' && hasNavigated.current
  const instant = reduce || backOrForward
  const duration = instant ? 0 : 0.25

  return (
    // No initial={false} here: it would also switch off every Reveal inside the first page
    <AnimatePresence
      mode="wait"
      onExitComplete={() => window.dispatchEvent(new Event(PAGE_EXIT_EVENT))}
    >
      <m.div
        key={location.pathname}
        className={`page-transition${instant ? ' instant' : ''}`}
        initial={instant ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={instant ? { opacity: 1, y: 0, transition: { duration: 0 } } : { opacity: 0, y: -8 }}
        transition={{ duration, ease: EASE }}
      >
        <RevealInstantly.Provider value={backOrForward}>{outlet}</RevealInstantly.Provider>
      </m.div>
    </AnimatePresence>
  )
}
