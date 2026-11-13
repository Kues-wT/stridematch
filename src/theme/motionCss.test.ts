import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

/** Body of the first rule whose comma-separated selector list includes exactly `selector`. */
function ruleBody(scope: string, selector: string): string | null {
  for (const m of scope.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(',').map((s) => s.trim().replace(/^.*\n/s, (x) => (x.includes('{') ? '' : x)).trim())
    if (selectors.some((s) => s.split('\n').pop()!.trim() === selector)) return m[2]
  }
  return null
}

describe('CSS motion rules', () => {
  const reduceBlock = (() => {
    const start = css.indexOf('@media (prefers-reduced-motion: reduce)')
    if (start < 0) return ''
    let depth = 0
    for (let i = css.indexOf('{', start); i < css.length; i++) {
      if (css[i] === '{') depth++
      if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1)
    }
    return ''
  })()

  it('stops the page and toast entrance animations when the user prefers reduced motion', () => {
    expect(ruleBody(reduceBlock, '.page')).toMatch(/animation:\s*none/)
    expect(ruleBody(reduceBlock, '.toast')).toMatch(/animation:\s*none/)
  })

  it('does not fade a page in again on Back/Forward', () => {
    expect(ruleBody(css, '.page-transition.instant .page')).toMatch(/animation:\s*none/)
  })
})
