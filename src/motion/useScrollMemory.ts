import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const STORE_KEY = 'kasutku.scroll.v1'
const RETRIES = 12
const RETRY_MS = 50

function loadSaved(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) ?? '{}') as Record<string, number>
  } catch {
    return {}
  }
}

function persist(saved: Record<string, number>) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(saved))
  } catch {
    // private mode / quota — memory only
  }
}

/**
 * New navigation → top of the page. Back/Forward → the position you left that page at.
 * Retries briefly so the restore waits for the page's content to be tall enough.
 */
export function useScrollMemory() {
  const location = useLocation()
  const navType = useNavigationType()
  const saved = useRef<Record<string, number>>(loadSaved())
  const currentKey = useRef(location.key)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    const onScroll = () => {
      saved.current[currentKey.current] = window.scrollY
      persist(saved.current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    currentKey.current = location.key
    const target = navType === 'POP' ? (saved.current[location.key] ?? 0) : 0
    let tries = 0
    let timer: ReturnType<typeof setTimeout>
    const apply = () => {
      const tallEnough = document.documentElement.scrollHeight - window.innerHeight >= target
      if (tallEnough || tries >= RETRIES) {
        window.scrollTo(0, target)
        return
      }
      tries++
      timer = setTimeout(apply, RETRY_MS)
    }
    timer = setTimeout(apply, 0)
    return () => clearTimeout(timer)
  }, [location.key, navType])
}
