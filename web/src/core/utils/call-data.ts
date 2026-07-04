// Deterministic call-count generator for demo / placeholder charts.
// Produces an array of N call counts from a string seed so the same
// function/app always renders the same chart.

function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateCallCounts(seed: string, length = 7): number[] {
  const rng = mulberry32(Number(cyrb53(seed)))

  // ~10% of functions show no calls so the centered-bar state is exercised
  const hasCalls = rng() > 0.1
  if (!hasCalls) {
    return Array.from({ length }, () => 0)
  }

  const total = Math.floor(rng() * 1500) + 50
  return Array.from({ length }, () => Math.floor(rng() * total))
}
