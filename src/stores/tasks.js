import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { seedTasks, seedActivities } from '@/mock/tasks'
import { useAgentStore } from './agent'
import { usePortfolioStore } from './portfolio'
import { useUiStore } from './ui'
import { idr } from '@/mock/util'
import { howToSteps } from '@/mock/recoSteps'

let taskCounter = 100
let actCounter = 100

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: seedTasks.map((t) => ({ ...t })),
    manualActivities: seedActivities.map((a) => ({ ...a })),
  }),
  getters: {
    open: (state) => state.tasks.filter((t) => t.status === 'todo'),
    done: (state) => state.tasks.filter((t) => t.status === 'done'),
    overdue: (state) =>
      state.tasks.filter((t) => t.status === 'todo' && t.dueAt && dayjs(t.dueAt).isBefore(dayjs(), 'day')),
    dueToday: (state) =>
      state.tasks.filter((t) => t.status === 'todo' && t.dueAt && dayjs(t.dueAt).isSame(dayjs(), 'day')),
    forProperty: (state) => (id) => state.tasks.filter((t) => t.propertyId === id),
    // Routines kept = completed recurring occurrences (streak signal).
    routinesKept: (state) => state.tasks.filter((t) => t.status === 'done' && t.recurring).length,
    // Unified timeline: manual activities + completed tasks + AI agent audit log.
    activities() {
      const agent = useAgentStore()
      const fromTasks = this.done.map((t) => ({
        id: `act-task-${t.id}`,
        kind: 'manual',
        propertyId: t.propertyId,
        summary: t.title,
        timestamp: t.completedAt,
        impact: t.outcome?.impact || 0,
        outcomeNote: t.outcome?.note || null,
      }))
      const fromAgent = agent.log.map((a) => ({
        id: a.id,
        kind: 'ai',
        propertyId: a.propertyId,
        summary: a.summary,
        timestamp: a.timestamp,
        impact: 0,
        outcomeNote: a.before !== '—' ? `${a.before} → ${a.after}` : null,
      }))
      return [...this.manualActivities, ...fromTasks, ...fromAgent]
        .filter((a) => a.timestamp)
        .sort((x, y) => (x.timestamp < y.timestamp ? 1 : -1))
    },
  },
  actions: {
    addTask({ title, propertyId = null, ownerName = null, priority = 'medium', dueAt = null, recurring = null, link = null, note = '', steps = null }) {
      if (!title?.trim()) return
      this.tasks.unshift({
        id: `task-${++taskCounter}`,
        title: title.trim(),
        note,
        steps, // optional "how to do it" checklist (from an AI recommendation)
        propertyId,
        ownerName,
        link,
        priority,
        status: 'todo',
        dueAt,
        recurring,
        createdAt: dayjs().toISOString(),
        completedAt: null,
        outcome: null,
      })
      useUiStore().toast('Task added')
    },
    complete(id, outcome = null) {
      const t = this.tasks.find((x) => x.id === id)
      if (!t || t.status === 'done') return
      t.status = 'done'
      t.completedAt = dayjs().toISOString()
      if (outcome) t.outcome = outcome
      // Recurring tasks respawn for the next cycle.
      let spawnedId = null
      if (t.recurring) {
        const next = t.recurring === 'daily' ? dayjs().add(1, 'day') : dayjs().add(1, 'week')
        spawnedId = `task-${++taskCounter}`
        this.tasks.unshift({
          ...t,
          id: spawnedId,
          status: 'todo',
          completedAt: null,
          outcome: null,
          createdAt: dayjs().toISOString(),
          dueAt: next.toISOString(),
        })
      }
      const msg = t.recurring
        ? `Task done · next ${dayjs(spawnedId ? this.tasks.find((x) => x.id === spawnedId).dueAt : undefined).format('DD MMM')}`
        : 'Task completed'
      useUiStore().toast(msg, 'success', { label: 'Undo', onClick: () => this._undoComplete(id, spawnedId) })
    },
    _undoComplete(id, spawnedId) {
      if (spawnedId) this.tasks = this.tasks.filter((t) => t.id !== spawnedId)
      const t = this.tasks.find((x) => x.id === id)
      if (t) {
        t.status = 'todo'
        t.completedAt = null
      }
      useUiStore().toast('Completion undone', 'neutral')
    },
    reopen(id) {
      const t = this.tasks.find((x) => x.id === id)
      if (t) {
        t.status = 'todo'
        t.completedAt = null
      }
    },
    // Edit any task fields (title, note/description, priority, dueAt, recurring, propertyId…).
    updateTask(id, patch) {
      const t = this.tasks.find((x) => x.id === id)
      if (t) Object.assign(t, patch)
    },
    remove(id) {
      this.tasks = this.tasks.filter((t) => t.id !== id)
    },
    // Reschedule every open overdue task to today (bulk cleanup).
    rescheduleOverdue() {
      let n = 0
      this.tasks.forEach((t) => {
        if (t.status === 'todo' && t.dueAt && dayjs(t.dueAt).isBefore(dayjs(), 'day')) {
          t.dueAt = dayjs().toISOString()
          n += 1
        }
      })
      if (n) useUiStore().toast(`${n} overdue task${n > 1 ? 's' : ''} moved to today`)
      return n
    },
    // Guard against creating a duplicate task for the same source.
    _existingFor(type, id) {
      return this.tasks.find((t) => t.status === 'todo' && t.link?.type === type && t.link?.id === id)
    },
    // Convert a recommendation or alert into a manual follow-up task (the bridge).
    addFromRecommendation(rec) {
      if (this._existingFor('recommendation', rec.id)) {
        useUiStore().toast('Already in your tasks', 'neutral')
        return
      }
      // Concrete, do-it-yourself instruction so the RA knows exactly what to change.
      const instruction =
        rec.type?.includes('rate') && rec.recommendedRate
          ? `Set the nightly rate to ${idr(rec.recommendedRate)} (${rec.deltaPct >= 0 ? '+' : ''}${rec.deltaPct}%).`
          : rec.applyLabel || rec.drivers?.[0] || ''
      const where = usePortfolioStore().byId(rec.propertyId)?.name || 'this property'
      this.addTask({
        title: `Apply: ${rec.title}`,
        propertyId: rec.propertyId,
        priority: rec.risk === 'approval' ? 'high' : 'medium',
        dueAt: dayjs().add(1, 'day').toISOString(),
        link: { type: 'recommendation', id: rec.id, label: 'AI recommendation' },
        note: [instruction, rec.drivers?.[0]].filter(Boolean).join(' ').trim(),
        steps: howToSteps(rec, where),
      })
      // Pinned recommendations leave the AI inbox — the RA owns it now.
      useAgentStore().markTasked(rec.id)
    },
    addFromAlert(alert) {
      if (this._existingFor('alert', alert.id)) {
        useUiStore().toast('Already in your tasks', 'neutral')
        return
      }
      this.addTask({
        title: `Resolve: ${alert.label}`,
        propertyId: alert.propertyId,
        priority: alert.severity === 'urgent' ? 'high' : 'medium',
        dueAt: dayjs().toISOString(),
        link: { type: 'alert', id: alert.id, label: `${alert.label} alert` },
        note: alert.message,
      })
    },
  },
})
