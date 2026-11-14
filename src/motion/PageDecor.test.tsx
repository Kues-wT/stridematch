// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { MotionProvider } from './MotionProvider'
import { PageDecor } from './PageDecor'
import { useScrolled } from './useScrolled'
import { mockMatchMedia } from '../test/dom'

afterEach(cleanup)

describe('PageDecor', () => {
  it('is hidden from screen readers and never takes taps', () => {
    mockMatchMedia({})
    const { container } = render(
      <MotionProvider>
        <PageDecor />
      </MotionProvider>,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.getAttribute('aria-hidden')).toBe('true')
    expect(root.classList.contains('page-decor')).toBe(true)
  })

  it('draws two glows and three ribbons per side', () => {
    mockMatchMedia({})
    const { container } = render(
      <MotionProvider>
        <PageDecor />
      </MotionProvider>,
    )
    expect(container.querySelectorAll('.glow')).toHaveLength(2)
    expect(container.querySelectorAll('.swirl.left path')).toHaveLength(3)
    expect(container.querySelectorAll('.swirl.right path')).toHaveLength(3)
  })

  it('shows swirls fully drawn and still when the user prefers reduced motion', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const { container } = render(
      <MotionProvider>
        <PageDecor />
      </MotionProvider>,
    )
    expect(container.querySelector('.page-decor')!.classList.contains('still')).toBe(true)
    for (const path of container.querySelectorAll<SVGPathElement>('.swirl path:not(.dotted)')) {
      expect(path.style.strokeDasharray).toBe('')
    }
  })
})

describe('useScrolled', () => {
  it('turns on once the page scrolls past the threshold and off again at the top', () => {
    const { result } = renderHook(() => useScrolled(8))
    expect(result.current).toBe(false)
    act(() => {
      window.scrollY = 20
      window.dispatchEvent(new Event('scroll'))
    })
    expect(result.current).toBe(true)
    act(() => {
      window.scrollY = 0
      window.dispatchEvent(new Event('scroll'))
    })
    expect(result.current).toBe(false)
  })
})
