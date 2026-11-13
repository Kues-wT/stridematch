// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { useContext, useEffect, useState } from 'react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { MotionProvider } from './MotionProvider'
import { PageTransition } from './PageTransition'
import { Reveal, RevealInstantly } from './Reveal'
import { mockMatchMedia, stubIntersectionObserver } from '../test/dom'

let mounts: string[] = []
let rerenderShell: () => void
let navigate: ReturnType<typeof useNavigate>

function Page({ name }: { name: string }) {
  const instant = useContext(RevealInstantly)
  useEffect(() => {
    mounts.push(`${name}:${instant ? 'instant' : 'animated'}`)
  }, [name, instant])
  return <p>{name}</p>
}

function Shell() {
  const [, setN] = useState(0)
  rerenderShell = () => setN((n) => n + 1)
  navigate = useNavigate()
  return <PageTransition />
}

function renderAt(path: string) {
  render(
    <MotionProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Shell />}>
            <Route path="a" element={<Page name="a" />} />
            <Route path="b" element={<Page name="b" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </MotionProvider>,
  )
}

beforeEach(() => {
  mounts = []
  mockMatchMedia({})
  stubIntersectionObserver()
})
afterEach(cleanup)

describe('PageTransition', () => {
  it('mounts a directly opened page once, with its reveals animated, even when the layout re-renders', () => {
    renderAt('/a')
    act(() => rerenderShell())
    act(() => rerenderShell())
    expect(mounts).toEqual(['a:animated'])
  })

  it('lets glide-ins on a directly opened page start hidden so they can animate in', () => {
    render(
      <MotionProvider>
        <MemoryRouter initialEntries={['/c']}>
          <Routes>
            <Route element={<Shell />}>
              <Route
                path="c"
                element={
                  <Reveal>
                    <p>Card</p>
                  </Reveal>
                }
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </MotionProvider>,
    )
    expect((screen.getByText('Card').parentElement as HTMLElement).style.opacity).toBe('0')
  })

  it('shows content instantly when going Back', async () => {
    renderAt('/a')
    await act(async () => navigate('/b'))
    await act(async () => navigate(-1))
    await act(async () => new Promise((r) => setTimeout(r, 50)))
    expect(mounts[mounts.length - 1]).toBe('a:instant')
  })
})
