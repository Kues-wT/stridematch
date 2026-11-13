import { useRef } from 'react'
import { useLocation, useNavigationType, useOutlet } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { RevealInstantly } from './Reveal'
import { useReduceMotion } from './useReduceMotion'

/**
 * Short fade + rise between pages, keyed by pathname only (so language switches or
 * in-page state like the Analyze steps never remount). Back/Forward is instant and
 * shows already-revealed content, so scroll restoration lands on visible cards.
 */
export function PageTransition() {
  const outlet = useOutlet()
  const { pathname } = useLocation()
  const navType = useNavigationType()
  const reduce = useReduceMotion()
  const firstRender = useRef(true)
  const isFirst = firstRender.current
  firstRender.current = false

  const backOrForward = navType === 'POP' && !isFirst

  if (reduce || backOrForward) {
    return (
      <div className="page-transition" key={pathname}>
        <RevealInstantly.Provider value={backOrForward}>{outlet}</RevealInstantly.Provider>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        className="page-transition"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {outlet}
      </m.div>
    </AnimatePresence>
  )
}
