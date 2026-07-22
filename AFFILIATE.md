# Affiliate links — when & how

## Should you add affiliate links **before** user testing?

**Recommendation: not yet (or only as optional later).**

| Before testing | After testing |
|----------------|---------------|
| Focus on fit quality, photos, UX | Add monetisation once people finish the quiz |
| Affiliate approval can take days/weeks | You already know which models users click |
| Testers may distrust “buy” pressure | You can A/B soft CTAs (“Search Shopee”) |

**What we did instead (ready for affiliates later):**

1. Every shoe has a **`buyUrl`** — primary “Research / buy” button.  
2. Detail page also has **Shopee MY** and **Lazada MY** search buttons (non-affiliate).  
3. When you get affiliate links, you only replace `buyUrl` (or paste affiliate Shopee links there).

---

## How to add an affiliate link per shoe

### 1. Get approved

Common for Malaysia:

- **Shopee Affiliate** (Shopee Partner / Affiliate)
- **Lazada Affiliate**
- Brand programs (Nike Member, etc. — rarer for small sites)

You need a **live website URL** (your Vercel link is fine).

### 2. Create a tracking link for a product or search

In the affiliate dashboard:

1. Search the shoe model  
2. Generate **affiliate / tracking URL**  
3. Copy the full link (includes your ID)

### 3. Paste into `src/data/shoes.ts`

Find the shoe object and set:

```ts
buyUrl: 'https://YOUR-AFFILIATE-TRACKING-LINK-HERE',
```

Example:

```ts
{
  id: 'nike-pegasus-41',
  name: 'Pegasus 41',
  brand: 'Nike',
  // ...
  buyUrl: 'https://s.shopee.com.my/......', // ← affiliate link
  officialUrl: 'https://www.nike.com/my/',
},
```

The **Research / buy** button on the detail page uses `buyUrl` only.

### 4. Deploy

```powershell
git add src/data/shoes.ts
git commit -m "Add affiliate buy links for selected shoes"
git push origin main
```

---

## Optional: different links for Shopee vs Lazada

Today Shopee/Lazada buttons use **search URLs** (no tracking).

If you later want separate affiliate fields, we can add:

```ts
shopeeUrl?: string
lazadaUrl?: string
```

and wire the buttons to those when present.

---

## Rules of thumb

- Disclose when required (“Links may earn a commission”).  
- Don’t put affiliates on every button until UX is solid.  
- Prefer product pages that match the **exact model name**.  
- Prices in the app stay **estimates** — affiliates don’t fix stock/price accuracy.

---

## Quick decision

| Goal | Do this |
|------|---------|
| Test with friends this week | Keep current links; use Shopee search |
| Already approved on Shopee | Paste tracking URLs into `buyUrl` for top 10 models first |
| Not approved yet | Ignore affiliates; ship catalog + search buttons |
