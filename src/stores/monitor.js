import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { trackedActionsSeed } from '@/mock/trackedActions'
import { usePortfolioStore } from './portfolio'
import { useUiStore } from './ui'

let counter = 500

export const useMonitorStore = defineStore('monitor', {
  state: () => ({
    actions: trackedActionsSeed.map((a) => ({ ...a, series: a.series.map((s) => ({ ...s })) })),
  }),
  getters: {
    all: (s) => s.actions,
    byId: (s) => (id) => s.actions.find((a) => a.id === id),
    forProperty: (s) => (id) => s.actions.filter((a) => a.propertyId === id),
    active: (s) => s.actions.filter((a) => a.status === 'active'),
    needsDecision: (s) => s.actions.filter((a) => a.status === 'ended'),
    needsDecisionForProperty: (s) => (id) =>
      s.actions.filter((a) => a.propertyId === id && a.status === 'ended'),
    // Find an existing monitor spawned from a given task (or its source rec).
    forTask: (s) => (taskId, recId = null) =>
      s.actions.find((a) => a.taskId === taskId || (recId && a.recId === recId)) || null,
  },
  actions: {
    // Bridge: approving a windowed recommendation spins up live monitoring.
    trackFromRecommendation(rec) {
      if (this.actions.some((a) => a.recId === rec.id)) return
      const portfolio = usePortfolioStore()
      const p = portfolio.byId(rec.propertyId)
      if (!p) return
      counter += 1
      const isDiscount = rec.type === 'promo' || rec.type === 'rate_decrease'
      const windowDays = rec.type === 'promo' ? 7 : rec.type.includes('rate') ? 14 : 14
      const start = dayjs()
      const baseline = {
        occupancy: p.occupancy,
        adr: p.adr,
        revpar: Math.round((p.adr * p.occupancy) / 100),
        bookingsPerDay: Math.round((p.units * p.occupancy) / 100),
      }
      const target = isDiscount
        ? { metric: 'occupancy', label: '+12 pts occupancy', goalDelta: 12 }
        : rec.type.includes('rate')
          ? { metric: 'revpar', label: '+6% RevPAR', goalDelta: 6, pctMode: true }
          : { metric: 'bookings', label: '+5 bookings/day', goalDelta: 5 }
      this.actions.unshift({
        id: `mon-${counter}`,
        propertyId: rec.propertyId,
        recId: rec.id,
        taskId: null,
        title: rec.title,
        type: rec.type,
        channel: rec.type === 'promo' ? 'Direct + Booking.com' : 'All channels',
        actionLabel: rec.applyLabel,
        discountPct: isDiscount ? Math.abs(rec.deltaPct || 0) : 0,
        windowDays,
        startAt: start.toISOString(),
        endAt: start.add(windowDays, 'day').toISOString(),
        status: 'active',
        decision: null,
        target,
        baseline,
        units: p.units,
        series: [], // monitoring just began — first datapoint expected tomorrow
      })
      useUiStore().toast('Now tracking this action in Monitoring')
    },
    // Bridge for manually-applied actions: start monitoring from a task.
    // `cfg` carries the parameters a bare task can't infer (channel, window, target…).
    trackFromTask(task, cfg) {
      const portfolio = usePortfolioStore()
      const propertyId = cfg.propertyId || task.propertyId
      const p = portfolio.byId(propertyId)
      if (!p) {
        useUiStore().toast('Attach a property before monitoring', 'neutral')
        return null
      }
      const recId = task.link?.type === 'recommendation' ? task.link.id : null
      if (this.forTask(task.id, recId)) {
        useUiStore().toast('This action is already being monitored', 'neutral')
        return null
      }
      counter += 1
      const isDiscount = cfg.type === 'promo' || cfg.type === 'rate_decrease'
      const start = dayjs()
      const baseline = {
        occupancy: p.occupancy,
        adr: p.adr,
        revpar: Math.round((p.adr * p.occupancy) / 100),
        bookingsPerDay: Math.round((p.units * p.occupancy) / 100),
      }
      const target = buildTarget(cfg.targetMetric, cfg.targetGoal)
      const actionLabel = isDiscount
        ? `−${cfg.discountPct}% · ${cfg.channel}`
        : cfg.type === 'ota_open'
          ? `Inventory reopened · ${cfg.channel}`
          : cfg.type.includes('rate')
            ? `Rate change · ${cfg.channel}`
            : task.note?.trim() || `Manual action · ${cfg.channel}`
      const id = `mon-${counter}`
      this.actions.unshift({
        id,
        propertyId,
        recId,
        taskId: task.id,
        title: task.title,
        type: cfg.type,
        channel: cfg.channel,
        actionLabel,
        discountPct: isDiscount ? Number(cfg.discountPct) || 0 : 0,
        windowDays: Number(cfg.windowDays) || 7,
        startAt: start.toISOString(),
        endAt: start.add(Number(cfg.windowDays) || 7, 'day').toISOString(),
        status: 'active',
        decision: null,
        target,
        baseline,
        units: p.units,
        series: [],
      })
      useUiStore().toast('Now tracking this action in Monitoring')
      return id
    },
    // Close out a monitored action. Nothing is applied/reverted by the system —
    // the RA acts manually; this just clears it from "needs decision".
    close(id, decision = 'closed') {
      const a = this.byId(id)
      if (!a) return
      a.status = 'decided'
      a.decision = decision
      useUiStore().toast(
        decision === 'tasked' ? 'Added to your tasks — handle it manually' : 'Monitoring closed',
        decision === 'tasked' ? 'success' : 'neutral',
      )
    },
    extend(id, days = 7) {
      const a = this.byId(id)
      if (!a) return
      a.windowDays += days
      a.endAt = dayjs(a.endAt).add(days, 'day').toISOString()
      a.status = 'active'
      a.decision = null
      useUiStore().toast(`Window extended by ${days} days — still monitoring`)
    },
    stop(id) {
      const a = this.byId(id)
      if (!a) return
      a.status = 'decided'
      a.decision = 'stopped'
      useUiStore().toast('Action stopped — monitoring closed', 'neutral')
    },
    makePermanent(id) {
      const a = this.byId(id)
      if (!a) return
      a.status = 'decided'
      a.decision = 'made_permanent'
      useUiStore().toast('Action kept permanently', 'success')
    },
    rollback(id) {
      const a = this.byId(id)
      if (!a) return
      a.status = 'decided'
      a.decision = 'rolled_back'
      useUiStore().toast('Action rolled back to baseline', 'danger')
    },
  },
})

// Build a target spec from a metric + goal number (used by the task→monitor form).
function buildTarget(metric, goal) {
  const g = Number(goal) || 0
  if (metric === 'revpar') return { metric: 'revpar', label: `+${g}% RevPAR`, goalDelta: g, pctMode: true }
  if (metric === 'bookings') return { metric: 'bookings', label: `+${g} bookings/day`, goalDelta: g }
  return { metric: 'occupancy', label: `+${g} pts occupancy`, goalDelta: g }
}

// Recommendation types worth watching after they go live.
export const MONITORABLE_TYPES = new Set([
  'promo',
  'rate_increase',
  'rate_decrease',
  'big_rate_move',
  'ota_open',
  'close_inventory',
])
