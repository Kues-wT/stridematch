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
