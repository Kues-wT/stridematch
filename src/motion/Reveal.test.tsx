// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MotionProvider } from './MotionProvider'
import { Reveal, RevealGroup } from './Reveal'
import { mockMatchMedia, stubIntersectionObserver } from '../test/dom'

afterEach(cleanup)

const wrapperOf = (text: string) => screen.getByText(text).parentElement as HTMLElement

describe('Reveal', () => {
  it('shows content immediately when the user prefers reduced motion', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    stubIntersectionObserver()
    render(
      <MotionProvider>
        <Reveal>
          <p>Hello</p>
        </Reveal>
      </MotionProvider>,
    )
    const el = wrapperOf('Hello')
    expect(['', '1']).toContain(el.style.opacity)
    expect(['', 'none']).toContain(el.style.transform)
  })

  it('starts hidden when motion is allowed and it is not on screen yet', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    stubIntersectionObserver()
    render(
      <MotionProvider>
        <Reveal>
          <p>Hello</p>
        </Reveal>
      </MotionProvider>,
    )
    expect(wrapperOf('Hello').style.opacity).toBe('0')
  })

  it('shows grouped content immediately with reduced motion', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    stubIntersectionObserver()
    render(
      <MotionProvider>
        <RevealGroup>
          <Reveal>
            <p>One</p>
          </Reveal>
          <Reveal>
            <p>Two</p>
          </Reveal>
        </RevealGroup>
      </MotionProvider>,
    )
    for (const t of ['One', 'Two']) expect(['', '1']).toContain(wrapperOf(t).style.opacity)
  })
})
