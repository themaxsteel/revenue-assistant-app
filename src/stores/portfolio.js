import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { properties as seedProperties } from '@/mock/properties'
import { currentUser, team } from '@/mock/team'
import { alerts as seedAlerts } from '@/mock/alerts'

// Seed a realistic spread of last-review timestamps so "reviewed today" and
// staleness are meaningful on day one of the demo.
function seedReview(i) {
  const m = i % 4
  if (m === 0) return dayjs().toISOString() // reviewed today
  if (m === 1) return dayjs().subtract(2, 'day').toISOString()
  if (m === 2) return dayjs().subtract(6, 'day').toISOString()
  return null // never reviewed
}

export const usePortfolioStore = defineStore('portfolio', {
  state: () => ({
    properties: seedProperties.map((p, i) => ({ ...p, lastReviewedAt: seedReview(i) })),
    alerts: seedAlerts.map((a) => ({ ...a, resolved: false })),
    currentUser,
    team,
  }),
  getters: {
    byId: (state) => (id) => state.properties.find((p) => p.id === id),
    count: (state) => state.properties.length,
    avgOccupancy: (state) =>
      Math.round(state.properties.reduce((s, p) => s + p.occupancy, 0) / state.properties.length),
    totalRevpar: (state) => state.properties.reduce((s, p) => s + p.revpar * p.units, 0),
    avgHealth: (state) =>
      Math.round(state.properties.reduce((s, p) => s + p.healthScore, 0) / state.properties.length),
    modeCounts: (state) => ({
      auto: state.properties.filter((p) => p.autonomyMode === 'auto').length,
      suggest: state.properties.filter((p) => p.autonomyMode === 'suggest').length,
      manual: state.properties.filter((p) => p.autonomyMode === 'manual').length,
    }),
    unreadAlerts: (state) => state.alerts.filter((a) => !a.read && !a.resolved).length,
    openAlerts: (state) => state.alerts.filter((a) => !a.resolved),
    needsAttention: (state) =>
      state.properties.filter((p) => p.healthScore < 60 || p.alertCount > 0).length,
    // Reviewed-today is DERIVED from the timestamp, so it resets at midnight on its own.
    isReviewedToday: (state) => (id) => {
      const p = state.properties.find((x) => x.id === id)
      return !!p?.lastReviewedAt && dayjs(p.lastReviewedAt).isSame(dayjs(), 'day')
    },
    daysSinceReview: (state) => (id) => {
      const p = state.properties.find((x) => x.id === id)
      return p?.lastReviewedAt ? dayjs().diff(dayjs(p.lastReviewedAt), 'day') : null
    },
    reviewedCount() {
      return this.properties.filter((p) => this.isReviewedToday(p.id)).length
    },
    staleCount() {
      // Not reviewed today AND (never reviewed or >2 days ago)
      return this.properties.filter((p) => {
        const d = this.daysSinceReview(p.id)
        return !this.isReviewedToday(p.id) && (d === null || d > 2)
      }).length
    },
  },
  actions: {
    setAutonomy(propertyId, mode) {
      const p = this.byId(propertyId)
      if (p) p.autonomyMode = mode
    },
    markAlertsRead(propertyId) {
      this.alerts.forEach((a) => {
        if (!propertyId || a.propertyId === propertyId) a.read = true
      })
    },
    resolveAlert(id) {
      const a = this.alerts.find((x) => x.id === id)
      if (a) {
        a.resolved = true
        a.read = true
        const p = this.byId(a.propertyId)
        if (p && p.alertCount > 0) p.alertCount -= 1
      }
    },
    setReviewed(propertyId, value = true) {
      const p = this.byId(propertyId)
      if (p) p.lastReviewedAt = value ? dayjs().toISOString() : null
    },
    applyRate(propertyId, newAdr) {
      const p = this.byId(propertyId)
      if (p) {
        p.adr = newAdr
        p.revpar = Math.round((p.adr * p.occupancy) / 100)
      }
    },
  },
})
