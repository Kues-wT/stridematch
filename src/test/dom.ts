/** Browser APIs jsdom lacks, for component tests. */

export function mockMatchMedia(matches: Record<string, boolean>) {
  window.matchMedia = ((query: string) => ({
    matches: matches[query] ?? false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

/** An IntersectionObserver that never reports anything as visible. */
export function stubIntersectionObserver() {
  class NeverVisible {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  window.IntersectionObserver = NeverVisible as unknown as typeof IntersectionObserver
}
