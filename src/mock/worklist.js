import { properties, propertyById } from './properties'
import { recommendations } from './recommendations'
import { alerts } from './alerts'

// Morning Triage items: the prioritized "what needs attention today" feed.
// Built from alerts (urgent ops), approval-required recommendations (decisions),
// and soft-health signals (FYI). This is the dynamic logic the backend will own.

function severityRank(s) {
  return { urgent: 0, watch: 1, fyi: 2 }[s]
}

const items = []

// 1) Alerts → worklist entries
alerts.forEach((a) => {
  items.push({
    id: `wl-${a.id}`,
    propertyId: a.propertyId,
    severity: a.severity,
    category: 'alert',
    title: a.label,
    reason: a.message,
    cta: 'Review alert',
    target: { tab: 'channels' },
    relatedId: a.id,
  })
})

// 2) Approval-required recommendations → decisions awaiting RA
recommendations
  .filter((r) => r.risk === 'approval' && r.status === 'pending')
  .forEach((r) => {
    const p = propertyById(r.propertyId)
    items.push({
      id: `wl-${r.id}`,
      propertyId: r.propertyId,
      severity: r.daysOut <= 7 ? 'urgent' : 'watch',
      category: 'decision',
      title: r.title,
      reason: `${r.drivers[0]} · est. impact ${Math.round(r.estImpact / 100000) / 10}M/wk`,
      cta: 'Review recommendation',
      target: { tab: 'agent' },
      relatedId: r.id,
    })
  })

// 3) Soft health signals → FYI nudges
properties.forEach((p) => {
  if (p.paceDelta < -6) {
    items.push({
      id: `wl-pace-${p.id}`,
      propertyId: p.id,
      severity: 'watch',
      category: 'signal',
      title: 'Pace behind last year',
      reason: `Booking pace ${p.paceDelta}% vs LY — consider a demand-gen action.`,
      cta: 'Open forecast',
      target: { tab: 'forecast' },
      relatedId: null,
    })
  } else if (p.healthScore >= 85 && p.alertCount === 0) {
    items.push({
      id: `wl-ok-${p.id}`,
      propertyId: p.id,
      severity: 'fyi',
      category: 'signal',
      title: 'Healthy & on track',
      reason: `Health ${p.healthScore} · occ ${p.occupancy}% · pace ${p.paceDelta > 0 ? '+' : ''}${p.paceDelta}%. No action needed.`,
      cta: 'View property',
      target: { tab: 'overview' },
      relatedId: null,
    })
  }
})

export const worklist = items.sort(
  (a, b) => severityRank(a.severity) - severityRank(b.severity),
)

export const worklistCounts = {
  urgent: worklist.filter((i) => i.severity === 'urgent').length,
  watch: worklist.filter((i) => i.severity === 'watch').length,
  fyi: worklist.filter((i) => i.severity === 'fyi').length,
}
