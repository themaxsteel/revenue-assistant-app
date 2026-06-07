import dayjs from 'dayjs'
import { properties } from './properties'
import { rng, pick, intRange, idr } from './util'

// Audit trail of actions the AI Agent already executed (auto mode) or that the
// RA approved. The Pinia agent store appends new entries as the user acts.

const AUTO_ACTIONS = [
  (p) => ({ type: 'rate_nudge', summary: `Auto-raised weekend rate +6%`, before: idr(p.adr), after: idr(p.adr * 1.06) }),
  (p) => ({ type: 'parity_sync', summary: `Re-synced parity across 4 OTAs`, before: 'breach', after: 'in parity' }),
  (p) => ({ type: 'ota_open', summary: `Reopened Agoda inventory (30 days)`, before: 'closed', after: 'open' }),
  (p) => ({ type: 'min_stay', summary: `Applied 2-night min-stay on peak dates`, before: '1 night', after: '2 nights' }),
]

let n = 0
const log = []
properties.forEach((p, i) => {
  if (p.autonomyMode !== 'auto') return
  const rand = rng(70000 + i * 71)
  const count = intRange(rand, 1, 3)
  for (let k = 0; k < count; k++) {
    n += 1
    const a = pick(rand, AUTO_ACTIONS)(p)
    log.push({
      id: `act-${String(n).padStart(3, '0')}`,
      propertyId: p.id,
      timestamp: dayjs().subtract(intRange(rand, 1, 72), 'hour').toISOString(),
      mode: 'auto',
      byAgent: true,
      ...a,
    })
  }
})

export const agentLogSeed = log.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
