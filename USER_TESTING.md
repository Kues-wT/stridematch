# Running a StrideMatch user test (KK)

Short runbook for the first rounds of moderated testing. Target: 3–5 people,
15–20 minutes each. No account, no upload, nothing leaves the tester's device.

## Before the session

1. `npm run audit:photos` — make sure nothing is missing or low-res.
2. `npm run build` locally, push, and confirm https://stridematch.vercel.app is current.
3. Decide the device. Using **one phone you own** keeps every response in one
   localStorage bucket and makes the export easy. If testers use their own phones,
   you have to export from each phone separately.
4. Open `/feedback` on that device and clear anything left over from a previous session.

## During the session

Let them drive. Say as little as possible.

Ask them to think aloud through the flow:
Home → Analyze (photos optional) → Confirm → Goals quiz → Results.

Things worth watching for:

- Do they understand the analysis is a **photo estimate, not a measurement**?
- Do they hesitate at the confirm step — and do they override the arch reading?
- Do the match percentages feel believable, or too good?
- Do they scroll past the reasons, or read them?
- Does anything read wrong in **BM** if they switch language?
- Would they actually walk into Imago / Suria Sabah and ask for the top pick?

## Collecting the feedback

At the bottom of the results page there's a short prompt:
*"Was this a good match?"* → Spot on / Close, not quite / Way off, plus which pair
they'd actually try on and an optional note.

Ask the tester to fill it in themselves — it takes about 20 seconds, and their own
wording is more useful than your paraphrase.

## Exporting

Open **`/feedback`** on the test device (it is not linked from the nav on purpose,
so testers don't wander into other people's answers).

You get a tally, every response in full, and:

- **Copy CSV** — paste straight into Sheets / Excel
- **Download CSV** — `stridematch-feedback-YYYY-MM-DD.csv`
- **Copy JSON** — full records including the profile behind each match
- **Clear all** — wipe the device before handing the phone back

Each row carries the profile that produced the match (arch, arch source, width,
pronation, experience, weekly distance, surface, cushion preference, budget) and the
top three shoes with their scores — so a "way off" answer can be traced back to the
inputs that caused it.

> Feedback lives in `localStorage` under `stridematch.feedback.v1`. Clearing browser
> data, using private mode, or switching browsers loses it. **Export before you clear.**

## After 3–5 sessions

Look for patterns, not one-offs:

- Repeated "way off" from the same profile shape → a scoring weight to revisit in
  `src/lib/recommend.ts`.
- Everyone picking shoe #3 over #1 → ranking or copy problem, not a catalog problem.
- "Too expensive" recurring → a catalog gap. Cheapest support option is now the ASICS
  GT-1000 14 at ~RM 429; below that the catalog is neutral-only (see CATALOG_DATA.md).
- Confusion at the confirm step → wording, not scoring.

Only add affiliate links after testing is done and the matching feels right — see
AFFILIATE.md.
