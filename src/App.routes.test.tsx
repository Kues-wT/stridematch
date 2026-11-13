// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AppProviders, routes } from './App'
import { mockMatchMedia, stubIntersectionObserver } from './test/dom'

beforeEach(() => {
  mockMatchMedia({})
  stubIntersectionObserver()
  window.scrollTo = () => {}
})
afterEach(cleanup)

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return router
}

describe('routes', () => {
  it('keeps the share hash on /results so a shared profile can still load', () => {
    const router = renderAt('/results#p=abc')
    expect(router.state.location.pathname).toBe('/results')
    expect(router.state.location.hash).toBe('#p=abc')
  })

  it('redirects unknown paths home', async () => {
    const router = renderAt('/nope')
    expect(router.state.location.pathname).toBe('/')
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy()
  })

  it('renders the decoration layer once, outside the page transition', () => {
    renderAt('/')
    expect(document.querySelectorAll('.page-decor')).toHaveLength(1)
    expect(document.querySelector('.page-transition .page-decor')).toBeNull()
  })
})
