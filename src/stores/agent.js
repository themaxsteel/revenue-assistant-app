import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { recommendations as seedRecs } from '@/mock/recommendations'
import { agentLogSeed } from '@/mock/agentLog'
import { globalGuardrails } from '@/mock/guardrails'
import { usePortfolioStore } from './portfolio'
import { useUiStore } from './ui'
import { useMonitorStore, MONITORABLE_TYPES } from './monitor'
import { idr } from '@/mock/util'

let logCounter = 1000

export const useAgentStore = defineStore('agent', {
  state: () => ({
    recommendations: seedRecs.map((r) => ({ ...r })),
    log: agentLogSeed.map((a) => ({ ...a })),
    guardrails: { ...globalGuardrails },
  }),
  getters: {
    pending: (state) => state.recommendations.filter((r) => r.status === 'pending'),
    pendingApproval: (state) =>
      state.recommendations.filter((r) => r.status === 'pending' && r.risk === 'approval'),
    // Auto-eligible excludes properties the RA has set to Manual — those are
    // hands-off-automation, so bulk "Run all auto-eligible" must not touch them.
    autoEligible() {
      const portfolio = usePortfolioStore()
      return this.recommendations.filter(
        (r) =>
          r.status === 'pending' &&
          r.risk === 'auto' &&
          portfolio.byId(r.propertyId)?.autonomyMode !== 'manual',
      )
    },
    snoozed: (state) => state.recommendations.filter((r) => r.status === 'snoozed'),
    forProperty: (state) => (id) => state.recommendations.filter((r) => r.propertyId === id),
    logForProperty: (state) => (id) => state.log.filter((a) => a.propertyId === id),
    estPipeline: (state) =>
      state.recommendations
        .filter((r) => r.status === 'pending')
        .reduce((s, r) => s + r.estImpact, 0),
  },
  actions: {
    _logAction(rec, mode) {
      const portfolio = usePortfolioStore()
      const p = portfolio.byId(rec.propertyId)
      this.log.unshift({
        id: `act-${++logCounter}`,
        propertyId: rec.propertyId,
        timestamp: dayjs().toISOString(),
        mode,
        byAgent: mode === 'auto',
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
      this._logAction(rec, 'approved')
      // Windowed actions go straight into the Monitoring loop.
      if (MONITORABLE_TYPES.has(rec.type)) useMonitorStore().trackFromRecommendation(rec)
      useUiStore().toast(`Approved: ${rec.title}`)
    },
    reject(recId) {
      const rec = this.recommendations.find((r) => r.id === recId)
      if (!rec) return
      rec.status = 'rejected'
      useUiStore().toast(`Rejected: ${rec.title}`, 'neutral')
    },
    snooze(recId) {
      const rec = this.recommendations.find((r) => r.id === recId)
      if (!rec) return
      rec.status = 'snoozed'
      rec.snoozedUntil = dayjs().add(1, 'day').toISOString()
      useUiStore().toast('Snoozed until tomorrow — find it under “Snoozed”', 'neutral')
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
    approveAllAuto() {
      if (this.guardrails.killSwitch) {
        useUiStore().toast('Kill-switch is ON — auto-execution disabled', 'danger')
        return
      }
      const auto = this.autoEligible
      auto.forEach((rec) => {
        rec.status = 'auto-executed'
        this._logAction(rec, 'auto')
      })
      useUiStore().toast(`${auto.length} auto-eligible actions executed`)
    },
    // When a property is switched to 'auto', execute its eligible recs.
    runAutoForProperty(propertyId) {
      if (this.guardrails.killSwitch) return
      this.recommendations
        .filter((r) => r.propertyId === propertyId && r.status === 'pending' && r.risk === 'auto')
        .forEach((rec) => {
          rec.status = 'auto-executed'
          this._logAction(rec, 'auto')
        })
    },
    toggleKillSwitch() {
      this.guardrails.killSwitch = !this.guardrails.killSwitch
      useUiStore().toast(
        this.guardrails.killSwitch
          ? 'Global kill-switch ON — AI Agent paused'
          : 'Kill-switch OFF — AI Agent resumed',
        this.guardrails.killSwitch ? 'danger' : 'success',
      )
    },
  },
})
