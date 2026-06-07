import { rng, range, intRange } from './util'

// Upsell items + AI-suggested offers (Upselling product feed).
const ITEMS = [
  { name: 'Airport Transfer', suggested: false },
  { name: 'Daily Breakfast', suggested: false },
  { name: 'Private Chef Dinner', suggested: false },
  { name: 'Early Check-in', suggested: false },
  { name: 'Late Check-out', suggested: false },
  { name: 'In-villa Spa', suggested: true },
  { name: 'Sunset Boat Tour', suggested: true },
]

export function upsellFor(id) {
  const rand = rng(60000 + parseInt(id.slice(-2), 10) * 67)
  return ITEMS.map((it, i) => ({
    id: `ups-${id}-${i}`,
    name: it.name,
    suggested: it.suggested,
    attachRate: it.suggested ? 0 : Math.round(range(rand, 6, 42)),
    price: intRange(rand, 1, 12) * 100_000,
    revenue: it.suggested ? 0 : intRange(rand, 1, 18) * 1_000_000,
  }))
}
