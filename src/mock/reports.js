import dayjs from 'dayjs'
import { propertyById } from './properties'
import { recsForProperty } from './recommendations'
import { agentLogSeed } from './agentLog'
import { idr } from './util'

// Owner report payload. Generated on demand from live KPIs + actions taken.
// Delivered as PDF via WhatsApp in production (simulated here).
export function buildReport(propertyId, period = 'Last 7 days') {
  const p = propertyById(propertyId)
  const actions = [
    ...agentLogSeed.filter((a) => a.propertyId === propertyId).map((a) => a.summary),
    ...recsForProperty(propertyId)
      .filter((r) => r.status === 'approved')
      .map((r) => r.applyLabel),
  ]
  return {
    propertyId,
    propertyName: p.name,
    ownerName: p.ownerName,
    ownerPhone: p.ownerPhone,
    period,
    generatedAt: dayjs().format('DD MMM YYYY, HH:mm'),
    kpis: [
      { label: 'Occupancy', value: `${p.occupancy}%`, delta: p.paceDelta },
      { label: 'ADR', value: idr(p.adr, { compact: true }), delta: Math.round(p.paceDelta * 0.4) },
      { label: 'RevPAR', value: idr(p.revpar, { compact: true }), delta: p.paceDelta },
      { label: 'Pace vs LY', value: `${p.paceDelta > 0 ? '+' : ''}${p.paceDelta}%`, delta: p.paceDelta },
    ],
    actionsTaken: actions.length ? actions : ['Pricing held steady — market stable this period.'],
    outlook:
      p.paceDelta >= 0
        ? `Forward bookings are pacing ahead of last year. We are holding firm on rates and protecting peak dates with minimum-stay rules.`
        : `Pace is slightly behind last year. We have queued demand-generation actions (early-bird promo + midweek rate adjustments) to recover occupancy.`,
  }
}

// History of previously sent reports.
export const sentReports = [
  { id: 'rep-01', propertyId: 'prop-01', period: 'Last 7 days', sentVia: 'WhatsApp', sentAt: dayjs().subtract(2, 'day').format('DD MMM, HH:mm') },
  { id: 'rep-02', propertyId: 'prop-04', period: 'Last 30 days', sentVia: 'WhatsApp', sentAt: dayjs().subtract(3, 'day').format('DD MMM, HH:mm') },
  { id: 'rep-03', propertyId: 'prop-07', period: 'Last 7 days', sentVia: 'WhatsApp', sentAt: dayjs().subtract(5, 'day').format('DD MMM, HH:mm') },
]
