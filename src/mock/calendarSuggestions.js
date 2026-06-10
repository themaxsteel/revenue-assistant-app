// Demo Smart Suggestions spread across the next 12 months, used to fill the
// calendar's empty months (the real recommendations only reach ~45 days out).
// Deterministic per property so badges stay stable across reloads.
import dayjs from 'dayjs'
import { rng, pick, intRange, range } from './util'

const DEMO_ACTIONS = [
  { type: 'rate_increase', risk: 'auto', label: (a) => `Raise weekend rate +${a}%` },
  { type: 'rate_decrease', risk: 'auto', label: (a) => `Lower midweek rate -${a}% to fill gaps` },
  { type: 'min_stay', risk: 'auto', label: () => `Add 2-night min-stay on peak dates` },
  { type: 'ota_open', risk: 'auto', label: () => `Reopen OTA inventory` },
  { type: 'promo', risk: 'approval', label: (a) => `Launch ${a}% early-bird promo` },
  { type: 'big_rate_move', risk: 'approval', label: (a) => `Event surge rate +${a}%` },
]

// Returns a flat list of suggestion objects with a concrete start/end date.
export function buildDemoSuggestions(properties, monthsAhead = 12) {
  const start = dayjs().startOf('month')
  const out = []
  properties.forEach((p, pi) => {
    const rand = rng(9000 + pi * 31)
    for (let m = 0; m < monthsAhead; m++) {
      const month = start.add(m, 'month')
      const n = rand() < 0.5 ? intRange(rand, 1, 2) : 0
      for (let k = 0; k < n; k++) {
        const day = intRange(rand, 1, month.daysInMonth())
        const date = month.date(day)
        const action = pick(rand, DEMO_ACTIONS)
        const amt = intRange(rand, 5, 24)
        const span = action.type.includes('rate') ? 2 : 0
        out.push({
          id: `demo-${p.id}-${m}-${k}`,
          propertyId: p.id,
          type: action.type,
          risk: action.risk,
          title: action.label(amt),
          estImpact: Math.round(range(rand, 600_000, 5_000_000) / 100_000) * 100_000,
          confidence: intRange(rand, 70, 95),
          start: date.format('YYYY-MM-DD'),
          end: date.add(span, 'day').format('YYYY-MM-DD'),
          source: 'demo',
        })
      }
    }
  })
  return out
}
