# KasutKu "Tropical trail" redesign — design

Date: 2026-11-13 · Branch: `feat/feedback-scanner-catalog` (or a new branch cut from it)

## Intent

KasutKu (formerly StrideMatch) is about to go in front of real testers on their phones. The current
look is dark navy with neon lime. The owner wants it **vibrant and approachable, not "neon dark"**,
with a sporty feel. They were drawn to the scroll feel of stridematch.io — soft colour glows that
seem to follow you down the page and content gliding in as you scroll — and asked for swirly shapes
on the sides. They said they don't mind a lot of movement.

The approved reference is the throwaway mockup
`.superpowers/brainstorm/1001-1794554894/content/scroll-effect-v4.html` (git-ignored, on the
owner's machine). Treat it as the visual source of truth for colours, the hero, the glows, the side
swirls, the header shadow and the reveal/bar animations.

## Goals

- Re-theme **every page** to the light "Tropical trail" palette below, so the app feels like one product.
- Bring the mockup's motion into the real app, everywhere:
  1. Drifting colour glows that move with scroll.
  2. Swirly ribbon lines down both sides that draw themselves and twist with scroll.
  3. A header that gains a shadow and turns whiter once you scroll.
  4. Sections and cards that fade/rise into view, lists staggered.
  5. Fit bars that fill up when they come into view.
  6. Gentle transitions between pages (the owner chose a library partly so fancier motion is easy).
- Keep everything readable: every text/background pair at least 4.5 : 1, UI edges and chart fills at least 3 : 1.

## Non-goals

- No change to features, routes, the scanner, matching, feedback sync or the catalog data.
- No new copy beyond what the restyle needs. Wording stays as is (EN + BM).
- No dark-mode toggle. The app becomes light-only.

## Anti-goals (would make this a failure even if it "works")

- **Looking like stridematch.io.** No purple/violet, no copying their layout section by section, logo
  style or wording. Take only the general feel (glow + scroll motion).
- **Invented social proof.** No made-up statistics ("1/2 of runners injured…") or testimonials.
- **Unreadable on a phone outdoors.** Faint text, low-contrast buttons or animations that hide content
  for long.
- **Janky phones.** Animations must stay smooth on a mid-range Android; nothing that blocks the
  scanner or quiz from being usable.
- **Losing testers' saved data.** localStorage keys (`stridematch.*`) must not change.

## Constraints

- Stack stays: React 19, TypeScript, Vite 6, React Router 7, plain CSS in `src/index.css`
  (~2,200 lines, ~200 uses of CSS variables, ~60 hard-coded dark-theme colours), lucide-react icons.
- Free hosting (Vercel Hobby) — no server changes needed.
- Must honour the OS "reduce motion" setting.
- `npm test` (13 scanner tests) and `npm run build` must keep passing.

## Approaches considered

| | Approach | Trade-off |
|---|---|---|
| A | Re-theme whole app via CSS variables; motion in plain code (IntersectionObserver + scroll listeners, as in the mockup) | Consistent, no new dependency; fancier motion later means hand-written code |
| B | Home page only | Fastest, but jumping from bright home page into the old dark app feels broken |
| **C (picked)** | **A, but all motion built with Framer Motion** | +~40 KB on phones and one dependency; much easier to add richer motion (page transitions, springy cards) now and later |

**The owner picked C.** The re-theme part is identical to A.

## Decided: palette (Tropical trail)

Light theme. Replace the `:root` tokens in `src/index.css` and set `color-scheme: light`. Existing
token names stay (so the ~200 `var(--…)` uses keep working); new ones are added for the orange accent.

| Token | Value | Role / measured contrast |
|---|---|---|
| `--bg` | `#F3FBF6` | page background (soft mint) |
| `--bg-elevated`, `--bg-panel` | `#FFFFFF` | cards, panels, header when scrolled |
| `--bg-soft` | `#E8F5EE` | subtle fills, inputs, chips |
| `--border` | `rgba(18, 38, 28, 0.12)` | hairlines |
| `--border-strong` | `rgba(4, 120, 87, 0.45)` | selected/focused outlines |
| `--text` | `#12261C` | body + headings · 15.1 : 1 on bg |
| `--text-muted` | `#3F5248` | secondary text · 8.4 : 1 on white, 7.5 : 1 on bg-soft |
| `--accent` | `#047857` | primary buttons, links, logo "Ku" · white text on it 5.5 : 1 |
| `--accent-dim` | `#D1FAE5` | selected chips/option cards |
| `--accent-text` | `#065F46` | small green labels (eyebrows) · 7.3 : 1 on bg, 6.8 : 1 on accent-dim |
| `--accent-2` (new) | `#EA580C` | fit-bar fills, match-score highlights · 3.6 : 1 on white |
| `--accent-2-soft` (new) | `#FED7AA` | secondary button / chips · `#7C2D12` text on it 6.9 : 1 |
| `--accent-2-border` (new) | `#C2410C` | secondary button border · 4.9 : 1 on bg |
| `--danger` | `#B91C1C` | errors, retake advice · 6.1 : 1 on bg |
| `--nav-text` (new) | `#2D3734` | top nav links, weight 600 · 11.7 : 1 |
| `--bar-track` (new) | `#B7C9BE` | empty part of fit bars; bars 10 px tall |
| `--shadow` | `0 18px 50px rgba(18, 38, 28, 0.10)` | cards |

Glow colours (decorative only): mint `#6EE7B7`, mango `#FDBA74`. Swirl strokes: `#34D399`, `#FDBA74`,
`#047857` (dotted), mirrored on the right with mint/mango swapped and `#F97316` dotted.

Specific components (from the reviewed mockup):

- **Eyebrow / overline labels:** `--accent-text`, weight 800, ~12.5 px, uppercase, 0.1em tracking.
- **Primary button:** `--accent` background, white text, pill shape, soft green shadow.
- **Secondary button:** `--accent-2-soft` background, `#7C2D12` text, 2 px `--accent-2-border` inset border.
- **Fit bars:** 10 px, `--bar-track` track, `--accent-2` fill.
- **Per-shoe colours** (`shoe.color` / `shoe.accent` in `shoes.ts`, used by `ShoeSilhouette` and
  `ShoeCard`) stay as they are; check they still read well on white cards.
- **Scanner preview overlays** (lines drawn on the user's photo in `footscan/browser.ts`) stay as they are —
  they sit on photos, not on the page.

## Decided: motion (Framer Motion)

Use the `motion` package (Framer Motion's current name; import from `motion/react`). Pin an exact
version that supports React 19.

Wrap the app in `MotionConfig reducedMotion="user"` so OS "reduce motion" switches off transforms.

1. **Page decoration layer** (rendered once in `Layout`, behind content, `pointer-events: none`,
   `aria-hidden`): two blurred glows + left and right swirl SVGs, `position: fixed`. Drive them from
   page scroll (`useScroll` → `useTransform`):
   - glow 1 drifts down-right (~0.15x / 0.35x of scroll), glow 2 up-left (~-0.1x / -0.2x);
   - solid swirl strokes go from ~40% drawn to fully drawn over the length of the page
     (`pathLength`); both swirl groups drift up and rotate a few degrees in opposite directions.
   - On narrow screens (<720 px) swirls are narrower and lighter (see "Settled after review").
2. **Header:** transparent mint blur at the top; once scrolled > ~8 px, white background + soft
   shadow (animate between the two).
3. **Reveal on scroll:** a small reusable wrapper (e.g. `<Reveal>`) — fade from 0 and rise ~28 px,
   ~0.7 s, triggers once when ~20% visible. Lists/grids (steps, shoe cards, catalog grid, option
   cards) stagger children by ~0.1 s.
4. **Fit bars:** animate width from 0 to the score when visible (~1 s ease-out). Used on Home hero
   card, Results, Shoe detail, Compare.
5. **Hero match card** (Home): fills its bars on load and floats up slightly as you scroll.
6. **Page transitions:** a short fade + slight rise between routes (`AnimatePresence` around the
   route outlet). Scroll behaviour on navigation: see "Settled after review".

Content must never depend on an animation finishing: if JS is slow or motion is reduced, everything
is visible and usable.

### Settled after review (designer's calls — owner can override)

- **Swirls may sit behind the page edges, including under text**, as in the approved mockup. The
  readability rule still applies *over the strokes*: text must reach 4.5 : 1 against the worst point
  of any stroke behind it. On phones (<720 px) lower stroke opacity (and/or width) until
  `--text-muted` over the strongest stroke passes; tap targets must stay fully tappable
  (decoration is `pointer-events: none`). The contrast check includes these over-stroke pairs.
- **Scroll on navigation:** a *new* navigation goes to the top; **Back/Forward restores the previous
  scroll position** (e.g. Catalog → shoe → Back returns to the same spot in the grid). Moving to
  `createBrowserRouter` + `<ScrollRestoration>` is acceptable, as is custom saving. Restored pages
  show already-revealed content immediately (no re-hiding).
- **Type:** headings, hero and logo switch to **DM Sans weight 800**, matching the approved mockup.
  Drop Space Grotesk; load DM Sans 400/500/600/700/800 from Google Fonts. Point `--display` at DM Sans.
- **Reduce motion (OS setting on):** nothing moves.
  - Glows are shown static at their start position.
  - Swirls are shown static and fully drawn, with no drift or rotation.
  - The hero card doesn't float.
  - Reveal content and fit bars appear in their final state with no fade or fill.
  - Page transitions are instant.
  - Each scroll-linked piece checks `useReducedMotion`, since `MotionConfig` alone doesn't stop them.

## Scope: pages and shared parts to restyle

Shared: `Layout` (header, mobile menu, footer), `Toast`, `CompareBar`, `OptionCard`, `StepIndicator`,
`ShoeCard`, `FitBars`, `ShoeImage`/`ShoeSilhouette`, `FeedbackPrompt`.

Pages: Home, Analyze (photo slots, AI tick box, retake/issue lists, quiz option cards, measured-size
box), Results (size line, feedback prompt), ShoeDetail, Catalog (search, filter dropdowns, sort),
Shortlist, Compare (table), Stores, HowItWorks, Feedback (facilitator page).

Every hard-coded dark colour (`#0f172a`, `rgba(7, 11, 20, …)`, `rgba(255, 255, 255, 0.0x)` overlays,
old lime/sky `rgba`s, `#a3e635`, `#4ade80`, `#d9f99d`, the body radial gradients) is replaced by a
token or a light equivalent.

## How we'll know it's done

- Every route checked at phone width (375 px) and desktop: readable, nothing overlapping, no
  horizontal scroll, swirls never blocking taps and text over them still readable.
- A small contrast check (script or test) over the token pairs above passes, including text over
  the strongest swirl stroke.
- Reduced-motion mode: no movement, all content visible.
- `npm test` and `npm run build` pass; note the bundle size change.
- Smooth scrolling on a phone (owner checks on their own device via the Vercel preview).

## Left to the builder

- Component boundaries and file names for the motion pieces.
- Exact easing, durations and swirl path shapes (keep the mockup's character).
- Whether page transitions also slide, as long as they're short (≤ 0.35 s) and never delay content.
- How to split the CSS conversion into commits.
