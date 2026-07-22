# StrideMatch — Product Plan

**Tagline:** Find your perfect running shoes with photo-based foot analysis.

**Vibe:** Clean, athletic, modern (Nike/Strava-inspired).

---

## 1. Problem

Most runners buy shoes based on brand hype, store pressure, or a single treadmill glance. The wrong shoe increases injury risk and kills motivation. Specialty gait labs are expensive and hard to access.

## 2. Solution

**StrideMatch** is a web app that combines:

1. **Photo foot analysis** — user uploads a top-down foot photo; client-side analysis estimates arch type and foot shape cues.
2. **Optional gait cues** — short guidance + self-reported or video-assisted pronation check.
3. **Goal & lifestyle quiz** — distance, surface, experience, cushion preference, budget.
4. **Smart matching** — scores a curated catalog of real-world-style shoe profiles and explains *why* each match fits.

## 3. Target users

| Segment | Need |
|--------|------|
| Beginners | Simple path; plain-language explanations |
| Intermediate hobbyists | Better fit for longer distances / injury prevention |
| Returning runners | Avoid old bad shoe habits |
| Gift / research buyers | Structured comparison without a store visit |

## 4. Core user flow (MVP)

```
Landing → Analyze Foot (photo) → Gait & Goals quiz
       → Results (ranked shoes + reasons)
       → Shoe detail → Save / restart
```

## 5. MVP feature set

### In this build (MVP + v1.1)
- [x] Landing page with clear CTA
- [x] Foot photo upload + client-side analysis (arch / width cues)
- [x] Guided multi-step quiz (pronation, weekly km, surface, experience, cushion, budget)
- [x] Recommendation engine with weighted scoring
- [x] Results with match %, tags, and plain-English “why”
- [x] Shoe detail view
- [x] Responsive, athletic dark UI
- [x] Works fully offline in the browser (no backend required)
- [x] Persist profile + shortlist + compare tray (localStorage)
- [x] Shortlist (heart) across Results / Catalog / Detail
- [x] Side-by-side compare (up to 3 shoes)
- [x] Catalog browse with search + filters + sort by match
- [x] Fit breakdown bars (arch, gait, cushion, surface, budget)
- [x] Shareable results link (encoded profile hash, no photo)

### Not in MVP (roadmap)
- True ML pose estimation / plantar pressure
- Live store inventory / affiliate checkout
- User accounts & cloud history
- Wearable gait data (Garmin, Strava, Apple Health)
- Physical retailer partner API
- Multi-language (starting with English; MY market later)
- Old-shoe wear-pattern photo analysis

## 6. Analysis approach (honest MVP)

**What we do now (client-side heuristics):**
- Resize image, sample brightness/contrast of sole region proxies
- Estimate arch category: low / normal / high from midfoot “gap” darkness heuristics + user confirmation
- Combine with self-reported gait (overpronation / neutral / underpronation)
- Never claim medical diagnosis

**What we should add later:**
- MediaPipe / TensorFlow.js foot landmarks
- Side-view arch height ratio
- Wear-pattern photo of old shoes
- Optional video of treadmill / outdoor stride

## 7. Matching model (simplified)

Each shoe has attributes:
- `archSupport`: low | medium | high
- `stability`: neutral | stability | motion-control
- `cushion`: firm | balanced | max
- `dropMm`, `weightG`, `surfaces[]`, `bestFor[]`
- `priceBand`: budget | mid | premium
- `width`: standard | wide options

Score = weighted sum of:
- Arch fit (25%)
- Pronation / stability (25%)
- Distance & cushion (20%)
- Surface (15%)
- Budget (10%)
- Experience / weight preference (5%)

Top 3–5 returned with explanations.

## 8. Tech stack (MVP)

| Layer | Choice |
|-------|--------|
| UI | React 19 + TypeScript + Vite |
| Routing | react-router-dom |
| Icons | lucide-react |
| Styling | Custom CSS (no heavy UI kit) |
| Analysis | Canvas 2D image heuristics in browser |
| Data | Local TypeScript catalog |
| Deploy | Any static host (Vercel, Netlify, Cloudflare Pages) |

## 9. Success metrics (post-launch)

- Completion rate of photo + quiz flow
- % users who open ≥2 shoe details
- Self-reported “would buy this shoe” on results
- Return visits within 30 days
- Affiliate CTR / partner conversions (later)

## 10. Roadmap

| Phase | Focus |
|-------|--------|
| **MVP** | Photo + quiz + ranked catalog |
| **v1.1** | localStorage profile, shortlist, compare, catalog filters, share link, fit bars |
| **v1.2–v1.5 (now)** | Real brand catalog + buy links; side-view + wear analysis; EN/BM; MY stores; deploy configs |
| **v2** | Accounts, affiliate tracking, live inventory APIs, fuller BM copy |
| **v3** | Partner running stores in Kuching / KL; in-store QR flow; MediaPipe landmarks |

## 11. Risks & ethics

- **Not medical advice** — always show disclaimer
- Photo privacy — process in-browser; do not upload by default
- Catalog accuracy — shoes change yearly; keep versioned data
- Bias — include wide-fit and budget options, not only hype models

## 12. Brand notes

- Name: **StrideMatch**
- Colors: deep ink navy, electric lime accent, clean white surfaces
- Tone: confident, coach-like, never snobby
