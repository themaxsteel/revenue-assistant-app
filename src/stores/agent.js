import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { recommendations as seedRecs } from '@/mock/recommendations'
import { agentLogSeed } from '@/mock/agentLog'
import { globalGuardrails } from '@/mock/guardrails'
import { suggestionEventsSeed } from '@/mock/suggestionEvents'
import { usePortfolioStore } from './portfolio'
import { useUiStore } from './ui'
import { useMonitorStore, MONITORABLE_TYPES } from './monitor'
import { idr } from '@/mock/util'

let logCounter = 1000
let eventCounter = 2000

export const useAgentStore = defineStore('agent', {
  state: () => ({
    recommendations: seedRecs.map((r) => ({ ...r })),
    log: agentLogSeed.map((a) => ({ ...a })),
    guardrails: { ...globalGuardrails },
    // Suggestion lifecycle events — the adoption/acceptance data contract.
    events: suggestionEventsSeed.map((e) => ({ ...e })),
  }),
  getters: {
    pending: (state) => state.recommendations.filter((r) => r.status === 'pending'),
    pendingApproval: (state) =>
      state.recommendations.filter((r) => r.status === 'pending' && r.risk === 'approval'),
    snoozed: (state) => state.recommendations.filter((r) => r.status === 'snoozed'),
    forProperty: (state) => (id) => state.recommendations.filter((r) => r.propertyId === id),
    logForProperty: (state) => (id) => state.log.filter((a) => a.propertyId === id),
    estPipeline: (state) =>
      state.recommendations
        .filter((r) => r.status === 'pending')
        .reduce((s, r) => s + r.estImpact, 0),
    // Adoption: accepted (tasked/applied) over all decided (excludes snooze).
    acceptanceStats: (state) => {
      const accepted = state.events.filter((e) => e.type === 'tasked' || e.type === 'applied').length
      const rejected = state.events.filter((e) => e.type === 'rejected').length
      const decided = accepted + rejected
      return { accepted, rejected, decided, rate: decided ? Math.round((accepted / decided) * 100) : 0 }
    },
  },
  actions: {
    // Append a suggestion lifecycle event (adoption tracking).
    _recordEvent(rec, type, reason = null) {
      this.events.unshift({
        id: `evt-${++eventCounter}`,
        recId: rec.id,
        propertyId: rec.propertyId,
        type,
        reason,
        at: dayjs().toISOString(),
      })
    },
    // Record a 'viewed' once per recommendation (the acceptance denominator).
    recordViewed(recId) {
      const rec = this.recommendations.find((r) => r.id === recId)
      if (!rec) return
      if (this.events.some((e) => e.recId === recId && e.type === 'viewed')) return
      this._recordEvent(rec, 'viewed')
    },
    _logAction(rec, mode) {
      const portfolio = usePortfolioStore()
      const p = portfolio.byId(rec.propertyId)
      this.log.unshift({
        id: `act-${++logCounter}`,
        propertyId: rec.propertyId,
        timestamp: dayjs().toISOString(),
        mode,
        byAgent: false,
        type: rec.type,
        summary: rec.applyLabel,
        before: rec.type.includes('rate') ? idr(rec.currentRate) : '—',
        after: rec.type.includes('rate') ? idr(rec.recommendedRate) : '—',
      })
      if (rec.type.includes('rate') && p) {
        portfolio.applyRate(rec.propertyId, rec.recommendedRate)
      }
    },
    approve(recId) {
      const rec = this.recommendations.find((r) => r.id === recId)
      if (!rec || rec.status !== 'pending') return
      rec.status = 'approved'
      this._recordEvent(rec, 'applied')
      this._logAction(rec, 'approved')
      // Windowed actions go straight into the Monitoring loop.
      if (MONITORABLE_TYPES.has(rec.type)) useMonitorStore().trackFromRecommendation(rec)
      useUiStore().toast(`Approved: ${rec.title}`)
    },
    reject(recId, reason = null) {
      const rec = this.recommendations.find((r) => r.id === recId)
      if (!rec) return
      rec.status = 'rejected'
      this._recordEvent(rec, 'rejected', reason)
      useUiStore().toast(`Dismissed: ${rec.title}`, 'neutral', {
        label: 'Undo',
        onClick: () => this.unreject(recId),
      })
    },
    // Undo a dismiss — back to the inbox, drop the rejected event.
    unreject(recId) {
      const rec = this.recommendations.find((r) => r.id === recId)
      if (!rec) return
      rec.status = 'pending'
      const i = this.events.findIndex((e) => e.recId === recId && e.type === 'rejected')
      if (i !== -1) this.events.splice(i, 1)
    },
    snooze(recId) {
      const rec = this.recommendations.find((r) => r.id === recId)
      if (!rec) return
      rec.status = 'snoozed'
      rec.snoozedUntil = dayjs().add(1, 'day').toISOString()
      this._recordEvent(rec, 'snoozed')
      useUiStore().toast('Snoozed until tomorrow', 'neutral', {
        label: 'Undo',
        onClick: () => this.unsnooze(recId),
      })
    },
    unsnooze(recId) {
      const rec = this.recommendations.find((r) => r.id === recId)
      if (!rec || rec.status !== 'snoozed') return
      rec.status = 'pending'
      rec.snoozedUntil = null
      useUiStore().toast('Recommendation back in your inbox')
    },
    // Pinned as a manual follow-up task → leaves the AI inbox (handled by the RA).
    markTasked(recId) {
      const rec = this.recommendations.find((r) => r.id === recId)
      if (!rec || rec.status !== 'pending') return
      rec.status = 'tasked'
      this._recordEvent(rec, 'tasked')
    },
    // Undo an "add to task" — back to the inbox, drop the tasked event.
    unmarkTasked(recId) {
      const rec = this.recommendations.find((r) => r.id === recId)
      if (!rec || rec.status !== 'tasked') return
      rec.status = 'pending'
      const i = this.events.findIndex((e) => e.recId === recId && e.type === 'tasked')
      if (i !== -1) this.events.splice(i, 1)
    },
    // Bring back any snoozed items whose time has elapsed (called on app load).
    resurfaceSnoozed() {
      const now = dayjs()
      this.recommendations.forEach((r) => {
        if (r.status === 'snoozed' && r.snoozedUntil && now.isAfter(dayjs(r.snoozedUntil))) {
          r.status = 'pending'
          r.snoozedUntil = null
        }
      })
    },
  },
})
