// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { HeroMatchCard } from './HeroMatchCard'
import { I18nProvider } from '../context/I18nContext'
import { MotionProvider } from '../motion/MotionProvider'
import { mockMatchMedia } from '../test/dom'

afterEach(cleanup)

function renderCard() {
  return render(
    <I18nProvider>
      <MotionProvider>
        <HeroMatchCard />
      </MotionProvider>
    </I18nProvider>,
  )
}

const widths = () => [...document.querySelectorAll<HTMLElement>('.mini-bars i')].map((i) => i.style.width)

describe('HeroMatchCard', () => {
  it('shows the sample bars full and the card still with reduced motion', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    renderCard()
    expect(widths()).toEqual(['90%', '95%', '78%'])
    expect(['', 'none']).toContain((document.querySelector('.hero-card') as HTMLElement).style.transform)
  })

  it('starts the sample bars empty so they can fill on load', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    renderCard()
    expect(widths()).toEqual(['0%', '0%', '0%'])
  })
})
