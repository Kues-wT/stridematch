// Optional AI second opinion on a foot photo, using Gemini's free tier.
// The browser never sees the Gemini key. Photos are forwarded once and never stored here.
//
// Secrets (Supabase dashboard → Edge Functions → Secrets):
//   GEMINI_API_KEY   required — free key from https://aistudio.google.com/apikey
//   GEMINI_MODEL     optional — defaults to gemini-3.8-flash, falls back to gemini-3.5-flash-lite
//   AI_DAILY_LIMIT   optional — total checks per day across all users (default 150)
//   AI_DEVICE_LIMIT  optional — checks per device per day (default 6)
import { createClient } from 'npm:@supabase/supabase-js@2.49.4'

const keyFrom = (name: string) => {
  try {
    return JSON.parse(Deno.env.get(name) ?? '{}')['default'] as string | undefined
  } catch {
    return undefined
  }
}
const PUBLISHABLE_KEY = keyFrom('SUPABASE_PUBLISHABLE_KEYS')
const SECRET_KEY = keyFrom('SUPABASE_SECRET_KEYS') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FALLBACK_MODEL = 'gemini-3.5-flash-lite'
const MAX_IMAGE_BASE64 = 1_400_000 // ~1 MB JPEG

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, content-type, authorization, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Kind = 'footprint' | 'paper'

interface CheckRequest {
  kind: Kind
  imageBase64: string
  deviceId: string
  lang?: 'en' | 'ms'
  measured?: { arch?: string; csi?: number; lengthMm?: number; widthMm?: number }
}

const schema = {
  type: 'OBJECT',
  properties: {
    usable: { type: 'BOOLEAN' },
    problems: { type: 'ARRAY', items: { type: 'STRING' } },
    retakeTip: { type: 'STRING' },
    archGuess: { type: 'STRING', enum: ['low', 'normal', 'high', 'unknown'] },
    explanation: { type: 'STRING' },
  },
  required: ['usable', 'problems', 'retakeTip', 'archGuess', 'explanation'],
}

function prompt(req: CheckRequest): string {
  const language = req.lang === 'ms' ? 'Bahasa Melayu' : 'English'
  const measured = JSON.stringify(req.measured ?? {})
  const setup =
    req.kind === 'footprint'
      ? 'The photo should show a single wet footprint (darker print) on brown paper, cardboard or a dry floor, taken from directly above, with the whole print in frame.'
      : 'The photo should show a bare foot standing on a whole sheet of white A4 paper on a darker floor, taken from directly above. All four paper corners must be visible, the heel should touch one short edge of the paper and the toes must stay on the paper.'
  return [
    'You check photos for a running-shoe fitting web app. You are not a doctor and give no medical advice.',
    setup,
    `The app measured these values with image code: ${measured}.`,
    'Tasks:',
    '1. Decide if the photo is usable for that setup (usable). List concrete problems (cut off, blurry, wrong subject, shadows, paper corners hidden, socks on, etc.).',
    '2. If not usable, give one short retake tip the user can follow. If usable, retakeTip is an empty string.',
    req.kind === 'footprint'
      ? '3. From the footprint shape, guess the arch: "low" if the midfoot print is filled in, "high" if the midfoot is very thin or broken, otherwise "normal". Use "unknown" if you cannot tell.'
      : '3. archGuess must be "unknown" for this photo type.',
    `4. explanation: one or two friendly sentences for a runner about what the photo shows. Write problems, retakeTip and explanation in ${language}.`,
    'If the image is not a foot or footprint at all, set usable=false.',
  ].join('\n')
}

async function callGemini(model: string, key: string, req: CheckRequest) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt(req) },
            { inline_data: { mime_type: 'image/jpeg', data: req.imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        response_mime_type: 'application/json',
        response_schema: schema,
      },
    }),
  })
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return json(405, { error: 'method-not-allowed' })
  if (!PUBLISHABLE_KEY || request.headers.get('apikey') !== PUBLISHABLE_KEY) {
    return json(401, { error: 'unauthorized' })
  }

  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiKey) return json(503, { error: 'ai-not-configured' })

  let req: CheckRequest
  try {
    req = await request.json()
  } catch {
    return json(400, { error: 'bad-json' })
  }
  if (
    (req.kind !== 'footprint' && req.kind !== 'paper') ||
    typeof req.imageBase64 !== 'string' ||
    req.imageBase64.length < 1000 ||
    req.imageBase64.length > MAX_IMAGE_BASE64 ||
    typeof req.deviceId !== 'string' ||
    req.deviceId.length < 8 ||
    req.deviceId.length > 64
  ) {
    return json(400, { error: 'bad-request' })
  }

  // Free-tier guard rails: per device and across everyone
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY)
  const { data: usage, error: usageError } = await admin.rpc('bump_ai_usage', { p_device_id: req.deviceId })
  if (usageError) return json(500, { error: 'usage-failed' })
  const row = Array.isArray(usage) ? usage[0] : usage
  const deviceLimit = Number(Deno.env.get('AI_DEVICE_LIMIT') ?? 6)
  const dailyLimit = Number(Deno.env.get('AI_DAILY_LIMIT') ?? 150)
  if (row.device_count > deviceLimit || row.global_count > dailyLimit) {
    return json(429, { error: 'limit-reached' })
  }

  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash'
  let res = await callGemini(model, geminiKey, req)
  if ((res.status === 429 || res.status === 404) && model !== FALLBACK_MODEL) {
    res = await callGemini(FALLBACK_MODEL, geminiKey, req)
  }
  if (res.status === 429) return json(429, { error: 'limit-reached' })
  if (!res.ok) {
    console.error('gemini error', res.status, (await res.text()).slice(0, 300))
    return json(502, { error: 'ai-failed' })
  }

  try {
    const body = await res.json()
    const text: string = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const parsed = JSON.parse(text)
    return json(200, {
      usable: Boolean(parsed.usable),
      problems: Array.isArray(parsed.problems) ? parsed.problems.slice(0, 4).map(String) : [],
      retakeTip: String(parsed.retakeTip ?? ''),
      archGuess: ['low', 'normal', 'high'].includes(parsed.archGuess) ? parsed.archGuess : 'unknown',
      explanation: String(parsed.explanation ?? ''),
    })
  } catch {
    return json(502, { error: 'ai-failed' })
  }
})
