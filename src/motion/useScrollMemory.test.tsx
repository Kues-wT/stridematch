// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { useScrollMemory } from './useScrollMemory'

let navigate: ReturnType<typeof useNavigate>
const scrollTo = vi.fn()

function Probe() {
  useScrollMemory()
  navigate = useNavigate()
  return null
}

function setScroll(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

beforeEach(() => {
  scrollTo.mockReset()
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo
  sessionStorage.clear()
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('useScrollMemory', () => {
  it('goes to the top on a new navigation', () => {
    render(
      <MemoryRouter initialEntries={['/catalog']}>
        <Probe />
      </MemoryRouter>,
    )
    setScroll(900)
    act(() => navigate('/results/x'))
    act(() => vi.runAllTimers())
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
  })

  it('returns to the saved position on Back', () => {
    render(
      <MemoryRouter initialEntries={['/catalog']}>
        <Probe />
      </MemoryRouter>,
    )
    setScroll(900)
    act(() => navigate('/results/x'))
    act(() => vi.runAllTimers())
    setScroll(0)
    act(() => navigate(-1))
    act(() => vi.runAllTimers())
    expect(scrollTo).toHaveBeenLastCalledWith(0, 900)
  })
})
