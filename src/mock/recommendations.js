import dayjs from 'dayjs'
import { properties } from './properties'
import { rng, pick, intRange, range } from './util'

// AI recommendations. risk = 'auto' (a quick win — low risk, reversible) or
// 'approval' (higher-impact, needs a closer review). Nothing is applied
// automatically; status drives the manual approve/reject/task flow in Pinia.

const ACTIONS = [
  {
    type: 'rate_increase',
    risk: 'auto',
    title: (p) => `Raise weekend rate +${p.amt}% (${p.dates})`,
    drivers: () => [
      'Pickup +18% vs last year for these dates',
      'Compset sits +9% above your current rate',
      'Long weekend demand window in 12 days',
    ],
    apply: (rec) => `Rate ${rec.dates} → ${rec.recommendedRate}`,
  },
  {
    type: 'rate_decrease',
    risk: 'auto',
    title: (p) => `Lower midweek rate -${p.amt}% to fill gap nights`,
    drivers: () => [
      'Tue–Thu occupancy lagging at 41%',
      '6 gap-nights detected between confirmed stays',
      'Compset undercutting you by 12% midweek',
    ],
    apply: (rec) => `Rate ${rec.dates} → ${rec.recommendedRate}`,
  },
  {
    type: 'min_stay',
    risk: 'auto',
    title: () => `Add 2-night min-stay on peak dates`,
    drivers: () => [
      'High-demand long weekend approaching',
      'Protects against revenue-diluting 1-night gaps',
      'Compset already enforcing 2–3 night minimums',
    ],
    apply: () => `Min-stay 2 nights applied on peak dates`,
  },
  {
    type: 'ota_open',
    risk: 'auto',
    title: () => `Reopen Agoda inventory for next 30 days`,
    drivers: () => [
      'Agoda was auto-closed during a past sold-out window',
      'Availability has since reopened (cancellations)',
      'Agoda drives 22% of your bookings historically',
    ],
    apply: () => `Agoda inventory reopened (30 days)`,
  },
  {
    type: 'parity_sync',
    risk: 'auto',
    title: () => `Sync rate parity across OTAs`,
    drivers: () => [
      'Booking.com is 7% cheaper than Direct',
      'Parity breach risks OTA penalty + lost direct revenue',
    ],
    apply: () => `Parity re-synced across all channels`,
  },
  {
    type: 'big_rate_move',
    risk: 'approval',
    title: (p) => `Increase rate +${p.amt}% for event surge`,
    drivers: () => [
      'Major local event detected (festival) driving demand',
      'Compset already +24% above baseline',
      'Exceeds daily auto-change guardrail — needs your approval',
    ],
    apply: (rec) => `Rate ${rec.dates} → ${rec.recommendedRate}`,
  },
  {
    type: 'promo',
    risk: 'approval',
    title: () => `Launch 15% early-bird promo (60+ days out)`,
    drivers: () => [
      'Forward occupancy soft 60+ days out',
      'Direct channel needs a booking-pace boost',
      'New discount creation requires approval',
    ],
    apply: () => `Early-bird 15% promo created (Direct + Booking.com)`,
  },
  {
    type: 'close_inventory',
    risk: 'approval',
    title: () => `Close OTAs for sold-out peak night`,
    drivers: () => [
      'Property near sell-out for the date',
      'Shift remaining demand to higher-margin direct',
      'Closing inventory in high demand requires approval',
    ],
    apply: () => `OTAs closed for the peak night (direct stays open)`,
  },
]

let counter = 0
function buildRec(prop, action, rand) {
  counter += 1
  const amt = intRange(rand, 5, 28)
  const daysOut = intRange(rand, 2, 45)
  const date = dayjs().add(daysOut, 'day')
  const dates =
    action.type.includes('rate') || action.type === 'big_rate_move'
      ? `${date.format('DD MMM')}–${date.add(2, 'day').format('DD MMM')}`
      : date.format('DD MMM')
  const direction = action.type === 'rate_decrease' ? -1 : 1
  const currentRate = prop.adr
  const recommendedRate =
    Math.round((currentRate * (1 + (direction * amt) / 100)) / 10_000) * 10_000
  const estImpact = Math.round(range(rand, 800_000, 6_500_000) / 100_000) * 100_000

  const ctx = { amt, dates }
  return {
    id: `rec-${String(counter).padStart(3, '0')}`,
    propertyId: prop.id,
    type: action.type,
    risk: action.risk,
    title: action.title(ctx),
    drivers: action.drivers(),
    dates,
    daysOut,
    currentRate,
    recommendedRate,
    deltaPct: direction * amt,
    estImpact, // weekly RevPAR uplift estimate, IDR
    confidence: intRange(rand, 72, 96),
    status: 'pending', // pending | approved | rejected | snoozed | tasked
    createdAt: dayjs().subtract(intRange(rand, 0, 6), 'hour').toISOString(),
    applyLabel: action.apply({ dates, recommendedRate: 'updated' }),
  }
}

// Generate 1–4 recommendations per property.
const recs = []
properties.forEach((prop, i) => {
  const rand = rng(5000 + i * 13)
  const n = intRange(rand, 1, 4)
  for (let k = 0; k < n; k++) {
    const action = pick(rand, ACTIONS)
    recs.push(buildRec(prop, action, rand))
  }
})

export const recommendations = recs

export function recsForProperty(id) {
  return recommendations.filter((r) => r.propertyId === id)
}
