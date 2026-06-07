import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { usePortfolioStore } from './portfolio'
import { useAgentStore } from './agent'

// Reactive Morning Triage. Unlike the old static mock, this derives live from
// store state, so items disappear as the RA resolves alerts, approves/rejects
// recommendations, or dismisses signals.

function sevRank(s) {
  return { urgent: 0, watch: 1, fyi: 2 }[s]
}

export const useWorklistStore = defineStore('worklist', {
  state: () => ({
    dismissedSignals: [], // signal ids the RA cleared
  }),
  getters: {
    items() {
      const portfolio = usePortfolioStore()
      const agent = useAgentStore()
      const out = []

      // 1) Open alerts (not resolved)
      portfolio.alerts
        .filter((a) => !a.resolved)
        .forEach((a) => {
          out.push({
            id: `wl-${a.id}`,
            propertyId: a.propertyId,
            severity: a.severity,
            category: 'alert',
            title: a.label,
            reason: a.message,
            cta: 'Resolve',
            target: { tab: 'overview', focus: a.id },
            relatedId: a.id,
          })
        })

      // 2) Approval-required recommendations still pending
      agent.recommendations
        .filter((r) => r.risk === 'approval' && r.status === 'pending')
        .forEach((r) => {
          out.push({
            id: `wl-${r.id}`,
            propertyId: r.propertyId,
            severity: r.daysOut <= 7 ? 'urgent' : 'watch',
            category: 'decision',
            title: r.title,
            reason: `${r.drivers[0]} · est. ${Math.round(r.estImpact / 100000) / 10}M/wk`,
            cta: 'Review',
            target: { tab: 'agent', focus: r.id },
            relatedId: r.id,
          })
        })

      // 3) Soft health signals (dismissible)
      portfolio.properties.forEach((p) => {
        const id = `sig-${p.id}`
        if (this.dismissedSignals.includes(id)) return
        if (p.paceDelta < -6) {
          out.push({
            id: `wl-${id}`,
            propertyId: p.id,
            severity: 'watch',
            category: 'signal',
            title: 'Pace behind last year',
            reason: `Booking pace ${p.paceDelta}% vs LY — consider a demand-gen action.`,
            cta: 'Open forecast',
            target: { tab: 'forecast' },
            relatedId: id,
          })
        } else if (p.healthScore >= 85 && p.alertCount === 0) {
          out.push({
            id: `wl-${id}`,
            propertyId: p.id,
            severity: 'fyi',
            category: 'signal',
            title: 'Healthy & on track',
            reason: `Health ${p.healthScore} · occ ${p.occupancy}% · pace ${p.paceDelta > 0 ? '+' : ''}${p.paceDelta}%. No action needed.`,
            cta: 'View',
            target: { tab: 'overview' },
            relatedId: id,
          })
        }
      })

      return out.sort((a, b) => sevRank(a.severity) - sevRank(b.severity))
    },
    counts() {
      const items = this.items
      return {
        urgent: items.filter((i) => i.severity === 'urgent').length,
        watch: items.filter((i) => i.severity === 'watch').length,
        fyi: items.filter((i) => i.severity === 'fyi').length,
        // "needs attention" = actionable items (exclude the healthy FYIs)
        actionable: items.filter((i) => i.severity !== 'fyi').length,
      }
    },
  },
  actions: {
    dismissSignal(relatedId) {
      if (!this.dismissedSignals.includes(relatedId)) this.dismissedSignals.push(relatedId)
    },
  },
})
