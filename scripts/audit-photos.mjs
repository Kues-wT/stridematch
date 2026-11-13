#!/usr/bin/env node
/**
 * Photo audit for the shoe catalog.
 *
 *   npm run audit:photos
 *
 * Checks every shoe in src/data/shoes.ts against public/shoes and reports:
 *   - MISSING   no image file for the id (the app falls back to a silhouette)
 *   - FORMAT    real encoding does not match the file extension (e.g. AVIF named .jpg,
 *               which does not render on iOS Safari below 16.4)
 *   - LOW-RES   under MIN_WIDTH px wide, or a suspiciously small file
 *   - ORPHAN    an image with no matching shoe (left over after a catalog trim)
 *
 * Reads image headers directly — no dependencies.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SHOES_TS = join(root, 'src/data/shoes.ts')
const PHOTO_DIR = join(root, 'public/shoes')

const MIN_WIDTH = 600 // below this a detail-page hero looks soft
const MIN_BYTES = 20_000

/** Sniff the real encoding from the file's magic bytes. */
function encoding(buf) {
  if (buf.length > 8 && buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg'
  if (buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47) return 'png'
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  if (buf.length > 12 && buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12)
    if (brand.startsWith('avif') || brand.startsWith('avis')) return 'avif'
    if (brand.startsWith('heic') || brand.startsWith('heix') || brand.startsWith('mif1')) return 'heic'
  }
  return 'unknown'
}

/** Extensions a given encoding is allowed to use. */
const EXT_FOR = { jpeg: ['jpg', 'jpeg'], png: ['png'], webp: ['webp'], avif: ['avif'], heic: ['heic', 'heif'] }

/** Read pixel dimensions from JPEG / PNG / WebP / AVIF headers. */
function dimensions(buf) {
  // PNG
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  // WebP (VP8X / VP8 / VP8L)
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16)
    if (chunk === 'VP8X') return { width: (buf.readUIntLE(24, 3) & 0xffffff) + 1, height: (buf.readUIntLE(27, 3) & 0xffffff) + 1 }
    if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
  }
  // AVIF / HEIC — find the 'ispe' (image spatial extents) box
  if (buf.length > 12 && buf.toString('ascii', 4, 8) === 'ftyp') {
    const idx = buf.indexOf('ispe', 0, 'ascii')
    if (idx > 0 && idx + 12 <= buf.length) {
      return { width: buf.readUInt32BE(idx + 8), height: buf.readUInt32BE(idx + 12) }
    }
  }
  // JPEG — walk the segment markers to a start-of-frame
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i++
        continue
      }
      const marker = buf[i + 1]
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2
        continue
      }
      i += 2 + buf.readUInt16BE(i + 2)
    }
  }
  return null
}

const src = readFileSync(SHOES_TS, 'utf8')
const catalog = [...src.matchAll(/id: '([^']+)',\r?\n\s+name: '([^']+)',\r?\n\s+brand: '([^']+)'/g)].map(
  ([, id, name, brand]) => ({ id, label: `${brand} ${name}` }),
)
if (!catalog.length) {
  console.error('Could not parse any shoes out of src/data/shoes.ts')
  process.exit(1)
}

const files = readdirSync(PHOTO_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
const byId = new Map(files.map((f) => [f.replace(/\.[^.]+$/, ''), f]))

const missing = []
const lowRes = []
const mismatched = []

for (const shoe of catalog) {
  const file = byId.get(shoe.id)
  if (!file) {
    missing.push(shoe)
    continue
  }
  const path = join(PHOTO_DIR, file)
  const bytes = statSync(path).size
  const buf = readFileSync(path)
  const dim = dimensions(buf)
  const enc = encoding(buf)
  const ext = file.split('.').pop().toLowerCase()

  if (enc !== 'unknown' && !EXT_FOR[enc].includes(ext)) {
    mismatched.push({ ...shoe, file, enc, ext, bytes, dim })
  }
  if ((dim && dim.width < MIN_WIDTH) || bytes < MIN_BYTES) {
    lowRes.push({ ...shoe, file, bytes, dim })
  }
}

const orphans = [...byId.entries()]
  .filter(([id]) => !catalog.some((s) => s.id === id))
  .map(([, file]) => file)

const kb = (n) => `${Math.round(n / 1024)} KB`
const px = (d) => (d ? `${d.width}x${d.height}` : 'unreadable')

console.log(`\nKasutKu photo audit — ${catalog.length} shoes, ${files.length} images\n`)

if (missing.length) {
  console.log(`MISSING (${missing.length}) — add public/shoes/{id}.jpg:`)
  for (const s of missing) console.log(`  ${s.id.padEnd(34)} ${s.label}`)
  console.log()
}

if (mismatched.length) {
  console.log(`FORMAT MISMATCH (${mismatched.length}) — file contents do not match the extension:`)
  for (const s of mismatched) {
    const note = s.enc === 'avif' ? 'AVIF: blank on iOS Safari < 16.4' : s.enc === 'heic' ? 'HEIC: not supported by browsers' : `${s.enc} data`
    console.log(`  ${s.file.padEnd(38)} ${s.enc.padEnd(5)} ${px(s.dim).padEnd(11)} ${kb(s.bytes).padStart(7)}   ${note}`)
  }
  console.log('  -> re-export these as real JPEGs (same filename) before user testing\n')
}

if (lowRes.length) {
  console.log(`LOW-RES (${lowRes.length}) — replace before user testing (want >= ${MIN_WIDTH}px wide):`)
  for (const s of [...lowRes].sort((a, b) => (a.dim?.width ?? 0) - (b.dim?.width ?? 0))) {
    console.log(`  ${s.file.padEnd(38)} ${px(s.dim).padEnd(11)} ${kb(s.bytes).padStart(7)}   ${s.label}`)
  }
  console.log()
}

if (orphans.length) {
  console.log(`ORPHAN (${orphans.length}) — no shoe uses these, safe to delete:`)
  for (const f of orphans) console.log(`  ${f}`)
  console.log()
}

if (!missing.length && !lowRes.length && !orphans.length && !mismatched.length) {
  console.log('All catalog photos present and sharp enough. Nothing to do.\n')
}

// Non-zero only for missing images: low-res is a warning, not a build blocker.
process.exit(missing.length ? 1 : 0)
