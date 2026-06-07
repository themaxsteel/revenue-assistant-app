// Deterministic helpers so the dummy data is stable across reloads.
// Backend team: treat the exported shapes here and in sibling files as the
// initial data contract for each module.

// Seeded pseudo-random generator (mulberry32) — same seed => same numbers.
export function rng(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)]
}

export function range(rand, min, max) {
  return min + rand() * (max - min)
}

export function intRange(rand, min, max) {
  return Math.round(range(rand, min, max))
}

// Indonesian Rupiah formatting
export function idr(value, { compact = false } = {}) {
  if (compact) {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}B`
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `Rp ${Math.round(value / 1_000)}K`
    return `Rp ${Math.round(value)}`
  }
  return 'Rp ' + Math.round(value).toLocaleString('id-ID')
}

export function pct(value, digits = 0) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}
