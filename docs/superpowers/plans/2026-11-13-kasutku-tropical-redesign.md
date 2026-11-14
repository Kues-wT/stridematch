# KasutKu Tropical Trail Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-theme every page of KasutKu to the light "Tropical trail" palette and add scroll-driven motion (glows, side swirls, header shadow, reveals, bar fills, page transitions) with Framer Motion.

**Architecture:** Colours stay as CSS variables in `src/index.css`; the `:root` tokens are replaced and every hard-coded dark colour is converted to a token. Motion lives in a small `src/motion/` folder (config, `Reveal`, `PageDecor`, page transition wrapper), used from `Layout` and the pages. The router moves to `createBrowserRouter` so `<ScrollRestoration>` handles Back/Forward.

**Tech Stack:** React 19, TypeScript, Vite 6, React Router 7, plain CSS, `motion` (Framer Motion, `motion/react`), Vitest (+ jsdom and Testing Library for component tests).

**Spec:** `docs/superpowers/specs/2026-11-13-kasutku-tropical-redesign-design.md`. The visual source of truth is the mockup `.superpowers/brainstorm/1001-1794554894/content/scroll-effect-v4.html`, which is git-ignored and lives on the owner's machine only.

## Global Constraints

- Palette values and contrast targets are exactly as in the spec's palette table. Text must reach ≥ 4.5 : 1; UI edges and chart fills ≥ 3 : 1.
- No purple/violet, no copied stridematch.io layout or wording, and no invented stats or testimonials.
- localStorage keys stay `stridematch.*`.
- Light theme only: `color-scheme: light`.
- Headings, hero and logo use DM Sans weight 800. Space Grotesk is removed.
- With OS reduce-motion on, nothing moves: decoration is static (swirls fully drawn), content is shown in its final state, and route changes are instant.
- New navigation goes to the top; Back/Forward restores the previous scroll position.
- Decoration layers are `aria-hidden` and `pointer-events: none`.
- `npm test` and `npm run build` must pass after every task. All EN + BM copy stays as is.
- Pin `motion` to an exact version: the newest one published at least 14 days before install. Check with `npm view motion time --json`.

## Review Focus

1. **Share links:** `/results#p=<token>` must still load a shared profile after the router change. Results reads `window.location.hash`, and scroll restoration or transitions must not strip it. → test in Task 6.
2. **Reduce motion leaves content hidden:** with reduce-motion on, every `Reveal` child must be visible (opacity 1, no offset) on first render, not after an animation. → test in Task 3.
3. **Back after a reveal:** Catalog → shoe → Back must land at the same grid position with cards visible, not invisible and waiting for an IntersectionObserver. → check in Task 6.
4. **Text over swirls on a 375 px phone:** `--text-muted` over the strongest swirl stroke must reach ≥ 4.5 : 1. → pairs in the Task 1 contrast test, applied in Task 4.
5. **Analyze state survives transitions:** taking a photo opens the camera and returns to the same route. The page transition key must be `location.pathname` only, so the Analyze step state and photo results aren't remounted or lost. → check in Task 6.

---

### Task 1: Light palette, fonts and contrast test

**Files:**
- Create: `src/theme/contrast.ts`, `src/theme/contrast.test.ts`
- Modify: `src/index.css:1-21` (`:root`), `src/index.css` body background (radial gradients near line 36), `index.html:14` (Google Fonts URL)

**Interfaces:**
- Produces: `contrastRatio(fg: string, bg: string): number` (hex `#RRGGBB`, WCAG relative luminance); `blendOver(fg: string, alpha: number, bg: string): string` returns the hex of `fg` at `alpha` over `bg`. CSS tokens: `--bg --bg-elevated --bg-panel --bg-soft --border --border-strong --text --text-muted --accent --accent-dim --accent-text --accent-2 --accent-2-soft --accent-2-border --danger --nav-text --bar-track --shadow`. `--display` now resolves to DM Sans.

- [ ] **Step 1: Write the failing test** `src/theme/contrast.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { blendOver, contrastRatio } from './contrast'

const T = { bg: '#F3FBF6', panel: '#FFFFFF', soft: '#E8F5EE', text: '#12261C', muted: '#3F5248',
  accent: '#047857', accentDim: '#D1FAE5', accentText: '#065F46', accent2: '#EA580C',
  accent2Soft: '#FED7AA', accent2Border: '#C2410C', danger: '#B91C1C', nav: '#2D3734' }

describe('palette contrast', () => {
  it.each([
    ['text on bg', T.text, T.bg, 4.5], ['text on panel', T.text, T.panel, 4.5],
    ['muted on panel', T.muted, T.panel, 4.5], ['muted on soft', T.muted, T.soft, 4.5],
    ['white on accent', '#FFFFFF', T.accent, 4.5], ['accent-text on bg', T.accentText, T.bg, 4.5],
    ['accent-text on accent-dim', T.accentText, T.accentDim, 4.5], ['nav on bg', T.nav, T.bg, 4.5],
    ['danger on bg', T.danger, T.bg, 4.5], ['secondary btn text', '#7C2D12', T.accent2Soft, 4.5],
    ['secondary btn border', T.accent2Border, T.bg, 3], ['bar fill on panel', T.accent2, T.panel, 3],
  ])('%s', (_name, fg, bg, min) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min)
  })

  it('muted text stays readable over the strongest phone swirl stroke', () => {
    // Phone stroke opacity is chosen in Task 4; keep these two constants in sync with PageDecor
    const PHONE_STROKE_OPACITY = 0.3
    for (const stroke of ['#34D399', '#FDBA74']) {
      const under = blendOver(stroke, PHONE_STROKE_OPACITY, T.bg)
      expect(contrastRatio(T.muted, under)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/theme/contrast.test.ts`
Expected: FAIL, cannot resolve `./contrast`.

- [ ] **Step 3: Implement `contrastRatio` and `blendOver` in `src/theme/contrast.ts`**

Use the standard sRGB relative-luminance formula (the same as `footscan` docs use). `blendOver` mixes each channel with `fg*a + bg*(1-a)`.

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run src/theme/contrast.test.ts`
Expected: PASS. If the swirl test fails, lower `PHONE_STROKE_OPACITY` until it passes and note the value for Task 4.

- [ ] **Step 5: Replace the `:root` tokens and fonts**

- Set every token to its spec value and set `color-scheme: light`.
- Set `--display: 'DM Sans', system-ui, sans-serif`.
- Give headings `font-weight: 800`.
- Replace the body's dark radial gradients with a flat `var(--bg)` (the glows come from `PageDecor` in Task 4).
- In `index.html`, load DM Sans `0,9..40,400;500;600;700;800` plus italic 400, and drop Space Grotesk.

- [ ] **Step 6: Verify and commit**

Run: `npm test && npm run build`. Expected: all pass.

```bash
git add src/theme index.html src/index.css
git commit -m "feat(theme): Tropical trail light palette, DM Sans 800, contrast test"
```

### Task 2: Convert hard-coded dark colours on every page

**Files:**
- Modify: `src/index.css` (all rules), and inline styles in `src/components/*.tsx` / `src/pages/*.tsx` that hard-code dark colours (about 10 `style={{…}}` uses; leave `shoe.color` / `shoe.accent`)

**Interfaces:**
- Consumes: the Task 1 tokens. Produces: no new names. Selector names stay the same.

- [ ] **Step 1: List the leftovers**

Run: `grep -nE "#0f172a|#a3e635|#4ade80|#d9f99d|#bef264|#65a30d|rgba\((7, 11, 20|2, 6, 23|255, 255, 255, 0\.0|163, 230, 53|56, 189, 248|148, 163, 184|0, 0, 0)" src/index.css src/components src/pages`
Expected: a list of matches, which is what this task converts.

- [ ] **Step 2: Convert each match to a token or a light equivalent**

Mapping:
- dark panels → `--bg-panel` / `--bg-soft`
- white-alpha overlays → `--bg-soft` or `rgba(18, 38, 28, 0.04–0.08)`
- lime → `--accent`, sky → `--accent-2` or `--accent-dim`
- dark shadows → `--shadow`

Restyle the components named in the spec:
- `.eyebrow` → `--accent-text`, 800, 12.5 px, uppercase, 0.1em tracking
- `.btn-primary` → `--accent` background, white text, green shadow
- `.btn-secondary` → `--accent-2-soft` background, `#7C2D12` text, `inset 0 0 0 2px var(--accent-2-border)`
- `.fit-bar-track` → 10 px, `--bar-track`; its fill → `--accent-2`
- desktop nav links → `--nav-text`, 600

- [ ] **Step 3: Confirm nothing is left**

Run the Step 1 grep again. Expected: no output.

- [ ] **Step 4: Visual pass**

Run `npm run dev` and open each route at 375 px and 1280 px:

`/`, `/analyze` (all 4 steps, including issue lists and the AI tick box), `/results`, `/results/<id>`, `/catalog`, `/shortlist`, `/compare`, `/stores`, `/how-it-works`, `/feedback`

Also check the mobile menu, toast, compare bar and feedback prompt. Expected: no dark panels, all text readable, shoe silhouettes and photos look right on white cards.

- [ ] **Step 5: Verify and commit**

Run: `npm test && npm run build`

```bash
git add src
git commit -m "feat(theme): convert remaining dark-theme colours on all pages"
```

### Task 3: Motion setup and `Reveal`

**Files:**
- Modify: `package.json` (add `motion` pinned exact; dev: `jsdom`, `@testing-library/react`), `vite.config.ts` (Vitest `environmentMatchGlobs` or per-file `// @vitest-environment jsdom`)
- Create: `src/motion/MotionProvider.tsx`, `src/motion/Reveal.tsx`, `src/motion/Reveal.test.tsx`
- Modify: `src/App.tsx` (wrap the tree in `MotionProvider`)

**Interfaces:**
- Produces:
  - `MotionProvider({ children }: { children: ReactNode })`: wraps `MotionConfig reducedMotion="user"`.
  - `Reveal({ children, as?: 'div' | 'section' | 'li', delay?: number, className?: string })`: fades from 0 and rises 28 px over 0.7 s, once, at `amount: 0.2`.
  - `RevealGroup({ children, className?: string, stagger?: number /* default 0.1 */ })`: its direct `Reveal` children animate in order.
  - With reduced motion (`useReducedMotion()` is true) both render children in their final state with no animation props.

- [ ] **Step 1: Write the failing test** `src/motion/Reveal.test.tsx` (`// @vitest-environment jsdom`)

```tsx
it('shows content immediately when the user prefers reduced motion', () => {
  mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
  render(<MotionProvider><Reveal><p>Hello</p></Reveal></MotionProvider>)
  const el = screen.getByText('Hello').parentElement!
  expect(el.style.opacity === '' || el.style.opacity === '1').toBe(true)
  expect(el.style.transform === '' || el.style.transform === 'none').toBe(true)
})

it('starts hidden when motion is allowed', () => {
  mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
  stubIntersectionObserver() // never fires
  render(<MotionProvider><Reveal><p>Hello</p></Reveal></MotionProvider>)
  expect(screen.getByText('Hello').parentElement!.style.opacity).toBe('0')
})
```

`mockMatchMedia` and `stubIntersectionObserver` are small helpers at the top of the test file.

- [ ] **Step 2: Install, run, and confirm it fails**

Run: `npm i -E motion@<version picked per Global Constraints> && npm i -D jsdom @testing-library/react && npx vitest run src/motion`
Expected: FAIL, `Reveal` not found.

- [ ] **Step 3: Implement `MotionProvider`, `Reveal`, `RevealGroup`**

Use `motion.div` (or `motion.section` / `motion.li`) with `initial` / `whileInView` / `viewport={{ once: true, amount: 0.2 }}`. `RevealGroup` uses `variants` with `staggerChildren`. Wrap `App` in `MotionProvider`.

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test && npm run build`. Expected: all pass. Note the JS bundle size before and after in the commit message.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/motion src/App.tsx
git commit -m "feat(motion): add motion, MotionProvider and Reveal (reduced-motion safe)"
```

### Task 4: Page decoration (glows + swirls) and scrolling header

**Files:**
- Create: `src/motion/PageDecor.tsx`, `src/motion/useScrolled.ts`
- Modify: `src/components/Layout.tsx` (render `<PageDecor />` first inside the layout root; header `className` adds `scrolled`), `src/index.css` (`.page-decor`, `.glow`, `.swirl`, `.topbar.scrolled`)

**Interfaces:**
- Consumes: `MotionProvider` (Task 3); the swirl colours and `PHONE_STROKE_OPACITY` value from the Task 1 test.
- Produces:
  - `PageDecor()`: a fixed, `aria-hidden`, `pointer-events: none` layer behind content.
  - `useScrolled(threshold = 8): boolean`

- [ ] **Step 1: Implement `PageDecor`**

Two blurred glows: mint `#6EE7B7` at top-left, mango `#FDBA74` at the right around 40% height, opacity 0.55, blur 70 px.

Left and right swirl SVGs: copy the three paths per side from the mockup (viewBox `0 0 260 900`, right side mirrored with `scaleX(-1)` and colours swapped).

Drive everything from `useScroll().scrollY` and `scrollYProgress` with `useTransform`:
- glow 1 → `x = y*0.15`, `y = y*0.35`
- glow 2 → `x = -y*0.1`, `y = -y*0.2`
- solid strokes → `pathLength` from `0.4` to `1` over `scrollYProgress`
- swirl groups → `y` from `0` to `-120`, `rotate` from `0` to `±14deg`

Below 720 px: swirls are 150 px wide at `-60px`, with stroke opacity = `PHONE_STROKE_OPACITY`.

When `useReducedMotion()` is true: render the same shapes with fixed values (glows at their start position, `pathLength` 1, no rotation or offset), with no motion values attached.

- [ ] **Step 2: Implement `useScrolled` and the header style**

`.topbar` starts as `rgba(243, 251, 246, 0.8)` with a backdrop blur. `.topbar.scrolled` becomes `rgba(255, 255, 255, 0.92)` with `box-shadow: 0 8px 24px rgba(18, 38, 28, 0.10)` and a 0.3 s transition.

- [ ] **Step 3: Check it in the browser**

Run `npm run dev`. Scroll `/` and `/catalog` at 375 px and 1280 px.

Expected:
- the glows drift
- the swirls draw and twist
- the header gains its shadow
- no horizontal scroll
- every button under a swirl is still tappable

With reduce-motion emulated in DevTools (Rendering → `prefers-reduced-motion: reduce`), nothing moves and the swirls are fully drawn.

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run build`

```bash
git add src/motion src/components/Layout.tsx src/index.css
git commit -m "feat(motion): scroll-driven glows, side swirls and lifting header"
```

### Task 5: Reveals, fit-bar fills and the hero card on every page

**Files:**
- Modify: `src/components/FitBars.tsx`, `src/components/FitBars.test.tsx` (create), `src/pages/Home.tsx`, and add `Reveal` / `RevealGroup` in `src/pages/{Results,Catalog,ShoeDetail,Compare,Shortlist,Stores,HowItWorks,Analyze}.tsx`

**Interfaces:**
- Consumes: `Reveal`, `RevealGroup` (Task 3).
- Produces: `FitBars({ dims, compact?, animate? = true })`. The bar fill animates `width` from `0%` to `${score}%` over 1 s ease-out, once, when in view. With reduced motion it renders at the final width.

- [ ] **Step 1: Write the failing test** `src/components/FitBars.test.tsx` (jsdom)

```tsx
it('renders bars at their final width with reduced motion', () => {
  mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
  render(<I18nProvider><MotionProvider><FitBars dims={[{ id: 'arch', score: 88 }]} /></MotionProvider></I18nProvider>)
  const fill = document.querySelector('.fit-bar-track i') as HTMLElement
  expect(fill.style.width).toBe('88%')
})
```

Adjust the `dims` shape to the real `FitDimension` type.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/components/FitBars.test.tsx`
Expected: FAIL. The fill is a plain `<i>`, or it isn't wrapped in the providers yet.

- [ ] **Step 3: Animate the fill**

Make the fill a `motion.i` with `initial={{ width: 0 }}` and `whileInView={{ width: score + '%' }}`, gated on `useReducedMotion()`.

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run src/components/FitBars.test.tsx`. Expected: PASS.

- [ ] **Step 5: Hero card on Home**

The Home hero match card fills its bars on load (bars appear 0.25 s after mount) and floats up with `useTransform(scrollY, [0, 400], [0, -32])`. It stays static with reduced motion.

- [ ] **Step 6: Wrap sections and grids on every page**

- Section headers and panels: `Reveal`
- Card grids (Home steps, Results matches, Catalog grid, Shortlist, Stores list, HowItWorks steps, Analyze option grids): `RevealGroup`
- Leave forms, the photo slots and the toast unwrapped, so tapping never waits on an animation.

- [ ] **Step 7: Verify and commit**

Run: `npm test && npm run build`, then scroll each page at 375 px. Expected: content glides in, and nothing stays invisible.

```bash
git add src/components src/pages
git commit -m "feat(motion): reveal sections, animate fit bars, floating hero card"
```

### Task 6: Data router, scroll restoration and page transitions

**Files:**
- Modify: `src/App.tsx` (replace `<BrowserRouter><Routes>` with `createBrowserRouter` + `RouterProvider`; the same paths, including the `*` redirect), `src/components/Layout.tsx` (add `<ScrollRestoration />`, wrap `<Outlet />` in the transition)
- Create: `src/motion/PageTransition.tsx`, `src/App.routes.test.tsx`

**Interfaces:**
- Consumes: `MotionProvider` (Task 3), `PageDecor` (Task 4, must stay outside the transition so it doesn't re-mount).
- Produces:
  - `routes: RouteObject[]` exported from `src/App.tsx` for tests.
  - `PageTransition({ children })`: `AnimatePresence mode="wait"`, keyed by `location.pathname`, fade + `y: 12 → 0` in at most 0.35 s. Instant with reduced motion.

- [ ] **Step 1: Write the failing test** `src/App.routes.test.tsx` (jsdom)

```tsx
it('keeps the share hash on /results so a shared profile still loads', async () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/results#p=abc'] })
  render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  expect(router.state.location.hash).toBe('#p=abc')
})

it('redirects unknown paths home', async () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/nope'] })
  render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  expect(router.state.location.pathname).toBe('/')
})
```

`AppProviders` is the provider stack (`I18n`, `Profile`, `Toast`, `MotionProvider`), exported from `App.tsx` so the tests can reuse it.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/App.routes.test.tsx`
Expected: FAIL, `routes` / `AppProviders` aren't exported.

- [ ] **Step 3: Migrate the router and add transitions**

Export `routes` and `AppProviders`. Render `<ScrollRestoration />` once in `Layout`; it restores on Back/Forward and goes to the top on new navigation. Wrap the outlet in `PageTransition`.

Restored pages must show already-revealed content. `Reveal` uses `viewport.once`, so a remounted page could re-hide its content. Prevent that by passing `initial={false}` when `useNavigationType() === 'POP'`.

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test && npm run build`. Expected: all pass.

- [ ] **Step 5: Check the Review Focus items in the browser**

1. Open a share link (Results → "Copy share link", paste it in a new tab). Expected: the shared profile loads.
2. Scroll the Catalog halfway, open a shoe, press Back. Expected: the same scroll position, with cards visible.
3. On `/analyze`, add a footprint photo, then switch language EN ↔ BM. Expected: the photo result is still shown, with no remount.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.routes.test.tsx src/components/Layout.tsx src/motion/PageTransition.tsx
git commit -m "feat(motion): data router with scroll restoration and page transitions"
```

### Task 7: Final verification and preview

**Files:**
- Modify: `README.md` (one short "Design" section naming the palette, `src/theme/contrast.test.ts` and `src/motion/`)

- [ ] **Step 1: Full check**

Run: `npm test && npm run build && npx oxlint src`
Expected: tests and build pass, with no new lint errors.

Record the gzipped JS size against the 129 KB baseline.

- [ ] **Step 2: Route sweep**

Check every route at 375 px and 1280 px, with motion on and with reduce-motion emulated, against the spec's "How we'll know it's done" list.

- [ ] **Step 3: Commit and push**

```bash
git add README.md
git commit -m "docs: note the Tropical trail design system"
git push
```

Then fetch the new Vercel preview URL from the GitHub deployment record and give it to the owner for the phone check.
