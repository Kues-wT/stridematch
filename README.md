# StrideMatch

Find suitable running shoes with **multi-photo foot analysis**, a gait & goals quiz, a **real-model catalog** (MYR estimates), shortlist, compare, Bahasa Melayu toggle, and Malaysia store tips.

## Quick start

```bash
cd running-shoe-finder
npm install
npm run dev
```

## Features

### Matching
- Top-down foot photo (arch + width heuristics)
- Optional **side-view** arch clearance estimate
- Optional **old-shoe outsole wear** → pronation cue
- Quiz: pronation, experience, weekly km, surface, cushion, MYR budget
- Weighted recommendations + fit breakdown bars

### Catalog (real models)
ASICS, Brooks, HOKA, Saucony, Nike, New Balance, adidas, Altra, On — with approx. drop, weight, stability, MYR street prices, and research links.

### Product layer
- localStorage profile / shortlist / compare
- Shareable results link (no photo data)
- EN / **BM (Bahasa Melayu)** chrome toggle
- **Stores (MY)** tips for Kuching, KL, online

## Deploy

See [`DEPLOY.md`](./DEPLOY.md). SPA rewrites included for Vercel & Netlify.

```bash
npm run build   # → dist/
```

## Routes

| Path | Page |
|------|------|
| `/` | Landing |
| `/analyze` | Photos + quiz |
| `/results` | Ranked matches |
| `/results/:id` | Shoe detail + buy links |
| `/catalog` | Browse / filter |
| `/shortlist` | Saved shoes |
| `/compare` | Side-by-side |
| `/stores` | Malaysia try-on tips |
| `/how-it-works` | Transparency |

## Stack

React 19 · TypeScript · Vite · React Router · lucide-react

## Disclaimer

Not medical advice. Photo analysis is an on-device heuristic. Shoe specs and MYR prices are simplified estimates — confirm with retailers before purchase.

## Online services (free tier)

StrideMatch uses one Supabase project (`stridematch`, Singapore region) for two things. The
publishable key in `src/lib/remote.ts` is meant to be public.

**Tester feedback.** Every answer to the results-page prompt is saved on the device and sent to
the `feedback` table (insert-only for the public — nobody can read it back through the app).
Read everyone's answers in Supabase → Table Editor → `feedback`, and use Export → CSV for a
spreadsheet. `/feedback` still shows the answers given on the current device.

**Optional AI photo check.** The `foot-check` Edge Function sends a smaller copy of a foot photo to
Google Gemini's free tier, only when the user ticks the AI box on the Analyze page. To switch it on:

1. Create a free API key at <https://aistudio.google.com/apikey> (no billing needed).
2. Supabase → Edge Functions → Secrets → add `GEMINI_API_KEY` with that key.

Optional secrets: `GEMINI_MODEL` (default `gemini-3.8-flash`), `AI_DEVICE_LIMIT` (checks per device
per day, default 6) and `AI_DAILY_LIMIT` (total per day, default 150). Without the key, the
measurements still work and the app says the AI check isn't switched on.

## Foot scanner

`src/lib/footscan/` measures, rather than guesses:

- **Wet footprint** → Chippaux-Smirak arch index (narrowest midfoot ÷ widest forefoot print).
  Under 25% reads as a high arch, 45%+ as low/flat (`footprint.ts`).
- **Foot on A4 paper** → the sheet's corners undo camera tilt and give real millimetres, so we get
  foot length, width and a size suggestion (`sizing.ts`).
- Blurry, cut-off or paper-less photos are rejected with retake advice instead of guessed.

`npm test` runs the scanner tests against generated footprints and tilted A4 photos with known answers.
