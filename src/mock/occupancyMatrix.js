// Deterministic per-property occupancy / ADR / RevPAR for the calendar (matrix)
// view. There's no real time-series in the seed data, so we synthesise stable
// numbers from each property's base figures + leisure seasonality. Same inputs
// always produce the same cell, so the grid is steady across reloads.
import { rng, clamp } from './util'

// Indonesian leisure seasonality, % points added to base occupancy by calendar
// month (0 = Jan … 11 = Dec). Peaks at mid-year (Jul–Aug) and year-end holidays.
const MONTH_SEASON = [8, -6, 0, 2, 4, 9, 15, 13, 1, -2, -8, 11]

// FNV-1a string hash → stable 32-bit seed for the rng.
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Compute a single cell. `day` omitted → monthly bucket; provided → daily bucket
// (adds a weekend uplift). Returns { occupancy, adr, revpar, paceDelta }.
export function occupancyCell(property, { year, month, day = null }) {
  const key =
    day != null
      ? `${property.id}|${year}-${month}-${day}`
      : `${property.id}|${year}-${month}`
  const rand = rng(hash(key))
  const season = MONTH_SEASON[month] ?? 0

  let weekend = 0
  if (day != null) {
    const dow = new Date(year, month, day).getDay()
    weekend = dow === 5 || dow === 6 ? 11 : dow === 0 ? 4 : 0
  }

  const noise = (rand() - 0.5) * (day != null ? 22 : 14)
  const occupancy = Math.round(clamp(property.occupancy + season + weekend + noise, 14, 100))
  const adr =
    Math.round((property.adr * (1 + season / 130 + (rand() - 0.5) * 0.14)) / 10_000) * 10_000
  const revpar = Math.round((adr * occupancy) / 100)
  const paceDelta = Math.round(clamp(property.paceDelta + (rand() - 0.5) * 18, -32, 36))

  return { occupancy, adr, revpar, paceDelta }
}
