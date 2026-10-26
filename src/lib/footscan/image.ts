/**
 * Small, dependency-free image helpers for the foot scanner.
 * Everything works on a plain grayscale buffer so it runs (and is tested) outside the browser.
 */

export interface Gray {
  width: number
  height: number
  /** Luminance 0–255, row-major */
  data: Float32Array
}

export interface Point {
  x: number
  y: number
}

/** Rec. 601 luma from RGBA pixels (canvas ImageData layout). */
export function rgbaToGray(rgba: Uint8ClampedArray, width: number, height: number): Gray {
  const data = new Float32Array(width * height)
  for (let i = 0, p = 0; i < data.length; i++, p += 4) {
    data[i] = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2]
  }
  return { width, height, data }
}

/** Otsu's threshold over a 256-bin histogram. Returns the threshold and how well it separates the two classes. */
export function otsu(gray: Gray): { threshold: number; darkMean: number; brightMean: number } {
  const hist = new Float64Array(256)
  for (const v of gray.data) hist[Math.max(0, Math.min(255, Math.round(v)))]++
  const total = gray.data.length
  let sumAll = 0
  for (let i = 0; i < 256; i++) sumAll += i * hist[i]

  let sumB = 0
  let wB = 0
  let best = -1
  let threshold = 127
  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sumAll - sumB) / wF
    const between = wB * wF * (mB - mF) * (mB - mF)
    if (between > best) {
      best = between
      threshold = t
    }
  }

  let dark = 0
  let darkN = 0
  let bright = 0
  let brightN = 0
  for (const v of gray.data) {
    if (v <= threshold) {
      dark += v
      darkN++
    } else {
      bright += v
      brightN++
    }
  }
  // A flat image puts everything in one class — report zero separation
  const darkMean = darkN ? dark / darkN : bright / Math.max(brightN, 1)
  const brightMean = brightN ? bright / brightN : darkMean
  return { threshold, darkMean, brightMean }
}

/** 3×3 box blur — cheap denoise before thresholding phone photos. */
export function boxBlur(gray: Gray): Gray {
  const { width: w, height: h, data } = gray
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0
      let n = 0
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= h) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if (xx < 0 || xx >= w) continue
          sum += data[yy * w + xx]
          n++
        }
      }
      out[y * w + x] = sum / n
    }
  }
  return { width: w, height: h, data: out }
}

/** Variance of the Laplacian — low values mean a blurry photo. */
export function sharpness(gray: Gray): number {
  const { width: w, height: h, data } = gray
  let sum = 0
  let sumSq = 0
  let n = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const lap = data[i - w] + data[i + w] + data[i - 1] + data[i + 1] - 4 * data[i]
      sum += lap
      sumSq += lap * lap
      n++
    }
  }
  if (!n) return 0
  const mean = sum / n
  return sumSq / n - mean * mean
}

export interface Component {
  /** Pixel indices belonging to the component */
  pixels: Int32Array
  area: number
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** Connected components (4-neighbour) of a binary mask, largest first. */
export function components(mask: Uint8Array, width: number, height: number, minArea = 1): Component[] {
  const labels = new Int32Array(width * height)
  const stack = new Int32Array(width * height)
  const out: Component[] = []
  let label = 0

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start]) continue
    label++
    let top = 0
    stack[top++] = start
    labels[start] = label
    const pixels: number[] = []
    let minX = width
    let maxX = 0
    let minY = height
    let maxY = 0

    while (top) {
      const i = stack[--top]
      pixels.push(i)
      const x = i % width
      const y = (i - x) / width
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      if (x > 0 && mask[i - 1] && !labels[i - 1]) {
        labels[i - 1] = label
        stack[top++] = i - 1
      }
      if (x < width - 1 && mask[i + 1] && !labels[i + 1]) {
        labels[i + 1] = label
        stack[top++] = i + 1
      }
      if (y > 0 && mask[i - width] && !labels[i - width]) {
        labels[i - width] = label
        stack[top++] = i - width
      }
      if (y < height - 1 && mask[i + width] && !labels[i + width]) {
        labels[i + width] = label
        stack[top++] = i + width
      }
    }

    if (pixels.length >= minArea) {
      out.push({ pixels: Int32Array.from(pixels), area: pixels.length, minX, maxX, minY, maxY })
    }
  }

  return out.sort((a, b) => b.area - a.area)
}

/** Solve A·x = b (n×n, Gaussian elimination with partial pivoting). */
function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r
    if (Math.abs(M[pivot][col]) < 1e-12) return null
    ;[M[col], M[pivot]] = [M[pivot], M[col]]
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col] / M[col][col]
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]
    }
  }
  return M.map((row, i) => row[n] / row[i])
}

/** 3×3 projective transform as a flat row-major array (h33 = 1). */
export type Homography = [number, number, number, number, number, number, number, number, number]

/** Homography mapping each `from[i]` onto `to[i]` (exactly 4 point pairs). */
export function homography(from: Point[], to: Point[]): Homography | null {
  const A: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const { x, y } = from[i]
    const { x: u, y: v } = to[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    b.push(u)
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    b.push(v)
  }
  const h = solve(A, b)
  return h ? ([...h, 1] as Homography) : null
}

export function applyHomography(H: Homography, p: Point): Point {
  const w = H[6] * p.x + H[7] * p.y + H[8]
  return {
    x: (H[0] * p.x + H[1] * p.y + H[2]) / w,
    y: (H[3] * p.x + H[4] * p.y + H[5]) / w,
  }
}

/** Bilinear sample, clamped to the image edge. */
export function sample(gray: Gray, x: number, y: number): number {
  const { width: w, height: h, data } = gray
  const cx = Math.max(0, Math.min(w - 1.001, x))
  const cy = Math.max(0, Math.min(h - 1.001, y))
  const x0 = Math.floor(cx)
  const y0 = Math.floor(cy)
  const fx = cx - x0
  const fy = cy - y0
  const i = y0 * w + x0
  const top = data[i] * (1 - fx) + data[i + 1] * fx
  const bottom = data[i + w] * (1 - fx) + data[i + w + 1] * fx
  return top * (1 - fy) + bottom * fy
}
