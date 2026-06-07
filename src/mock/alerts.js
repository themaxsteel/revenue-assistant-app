import dayjs from 'dayjs'
import { properties } from './properties'
import { rng, pick, intRange } from './util'

// Operational alerts surfaced near-real-time (webhook-style in production).
const TYPES = {
  parity: {
    label: 'Rate Parity',
    severity: 'urgent',
    message: (p) => `Booking.com rate is 7% below Direct — parity breach at ${p.name}.`,
  },
  demand: {
    label: 'Demand Spike',
    severity: 'watch',
    message: (p) => `Search demand +63% for ${p.city.split('—')[1]?.trim()} next month — review pricing.`,
  },
  pickup: {
    label: 'Pickup Drop',
    severity: 'watch',
    message: (p) => `7-day pickup at ${p.name} fell below pace — forward occupancy softening.`,
  },
  otaClose: {
    label: 'OTA Auto-Closed',
    severity: 'urgent',
    message: (p) => `Agoda inventory closed itself after a sold-out window at ${p.name}.`,
  },
  event: {
    label: 'Local Event',
    severity: 'fyi',
    message: (p) => `Festival detected near ${p.name} — possible rate opportunity.`,
  },
}

let n = 0
const alerts = []
properties.forEach((prop, i) => {
  if (prop.alertCount === 0) return
  const rand = rng(9000 + i * 17)
  const keys = Object.keys(TYPES)
  for (let k = 0; k < prop.alertCount; k++) {
    n += 1
    const typeKey = pick(rand, keys)
    const t = TYPES[typeKey]
    alerts.push({
      id: `alert-${String(n).padStart(3, '0')}`,
      propertyId: prop.id,
      type: typeKey,
      label: t.label,
      severity: t.severity,
      message: t.message(prop),
      time: dayjs().subtract(intRange(rand, 5, 600), 'minute').toISOString(),
      read: false,
    })
  }
})

export const alertDefs = TYPES
export { alerts }

export function alertsForProperty(id) {
  return alerts.filter((a) => a.propertyId === id)
}
