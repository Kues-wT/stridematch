// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { FitBars } from './FitBars'
import { I18nProvider } from '../context/I18nContext'
import { MotionProvider } from '../motion/MotionProvider'
import { RevealInstantly } from '../motion/Reveal'
import { mockMatchMedia, stubIntersectionObserver } from '../test/dom'

afterEach(cleanup)

const dims = [{ id: 'arch', label: 'Arch', score: 88 }]

function renderBars() {
  return render(
    <I18nProvider>
      <MotionProvider>
        <FitBars dims={dims} />
      </MotionProvider>
    </I18nProvider>,
  )
}

describe('FitBars', () => {
  it('renders bars at their final width with reduced motion', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    stubIntersectionObserver()
    renderBars()
    const fill = document.querySelector('.fit-bar-track i') as HTMLElement
    expect(fill.style.width).toBe('88%')
  })

  it('shows bars already full when returning with Back', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    stubIntersectionObserver()
    render(
      <I18nProvider>
        <MotionProvider>
          <RevealInstantly.Provider value>
            <FitBars dims={dims} />
          </RevealInstantly.Provider>
        </MotionProvider>
      </I18nProvider>,
    )
    const fill = document.querySelector('.fit-bar-track i') as HTMLElement
    expect(fill.style.width).toBe('88%')
  })

  it('starts empty and waits to fill until the bar is on screen', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    stubIntersectionObserver()
    renderBars()
    const fill = document.querySelector('.fit-bar-track i') as HTMLElement
    expect(fill.style.width).toBe('0%')
  })
})
