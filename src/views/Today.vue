<script setup>
import { computed } from 'vue'
import { AlertOctagon, Eye, Info, Sparkles, Zap, ArrowRight, CheckCircle2, PartyPopper } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAgentStore } from '@/stores/agent'
import { useWorklistStore } from '@/stores/worklist'
import { useTasksStore } from '@/stores/tasks'
import { useUiStore } from '@/stores/ui'
import WorklistCard from '@/components/WorklistCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import Card from '@/components/ui/Card.vue'
import { idr } from '@/mock/util'

const portfolio = usePortfolioStore()
const agent = useAgentStore()
const worklist = useWorklistStore()
const tasks = useTasksStore()
const ui = useUiStore()

const groups = computed(() => ({
  urgent: worklist.items.filter((i) => i.severity === 'urgent'),
  watch: worklist.items.filter((i) => i.severity === 'watch'),
  fyi: worklist.items.filter((i) => i.severity === 'fyi'),
}))

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})

const sections = computed(() => [
  { key: 'urgent', label: 'Urgent', icon: AlertOctagon, tone: 'text-rose-500', items: groups.value.urgent },
  { key: 'watch', label: 'Watch', icon: Eye, tone: 'text-amber-500', items: groups.value.watch },
  { key: 'fyi', label: 'FYI', icon: Info, tone: 'text-slate-400', items: groups.value.fyi },
])

const autoCount = computed(() => agent.autoEligible.length)
const pipeline = computed(() => idr(agent.estPipeline, { compact: true }))
const actionable = computed(() => worklist.counts.actionable)
const allClear = computed(() => actionable.value === 0)

// Quick-action handlers from worklist cards
function pinItem(item) {
  if (item.category === 'decision') {
    const rec = agent.recommendations.find((r) => r.id === item.relatedId)
    if (rec) tasks.addFromRecommendation(rec, portfolio.byId(rec.propertyId)?.name)
  } else if (item.category === 'alert') {
    const alert = portfolio.alerts.find((a) => a.id === item.relatedId)
    if (alert) tasks.addFromAlert(alert)
  }
}
function resolveAlert(id) {
  portfolio.resolveAlert(id)
  ui.toast('Alert resolved')
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-900">{{ greeting }}, {{ portfolio.currentUser.name.split(' ')[0] }} 👋</h1>
        <p class="mt-1 text-sm text-slate-500">
          Triage across <span class="font-semibold text-slate-700">{{ portfolio.count }} properties</span> —
          {{ groups.urgent.length }} urgent, {{ groups.watch.length }} to watch ·
          <span class="font-medium text-slate-600">{{ portfolio.reviewedCount }}/{{ portfolio.count }} reviewed today</span>
        </p>
      </div>
      <RouterLink to="/agent">
        <AppButton variant="primary" size="sm">
          <Zap class="h-4 w-4" /> Review AI recommendations <ArrowRight class="h-3.5 w-3.5" />
        </AppButton>
      </RouterLink>
    </div>

    <!-- Top summary -->
    <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card padding="p-4">
        <p class="text-xs font-medium text-slate-500">Needs attention</p>
        <p class="mt-1 text-2xl font-bold" :class="actionable ? 'text-rose-600' : 'text-emerald-600'">{{ actionable }}</p>
        <p class="text-xs text-slate-400">actionable items today</p>
      </Card>
      <Card padding="p-4">
        <p class="text-xs font-medium text-slate-500">Auto-eligible actions</p>
        <p class="mt-1 text-2xl font-bold text-brand-600">{{ autoCount }}</p>
        <p class="text-xs text-slate-400">ready to execute in guardrails</p>
      </Card>
      <Card padding="p-4">
        <p class="text-xs font-medium text-slate-500">Pending impact</p>
        <p class="mt-1 text-2xl font-bold text-emerald-600">{{ pipeline }}</p>
        <p class="text-xs text-slate-400">est. weekly RevPAR uplift</p>
      </Card>
      <Card padding="p-4">
        <p class="text-xs font-medium text-slate-500">Portfolio health</p>
        <p class="mt-1 text-2xl font-bold text-slate-800">{{ portfolio.avgHealth }}</p>
        <p class="text-xs text-slate-400">avg · occ {{ portfolio.avgOccupancy }}%</p>
      </Card>
    </div>

    <!-- One-click batch (only when there's something to do) -->
    <div v-if="autoCount" class="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
        <Sparkles class="h-5 w-5" />
      </div>
      <div class="flex-1">
        <p class="text-sm font-semibold text-slate-800">{{ autoCount }} low-risk actions are safe to auto-execute</p>
        <p class="text-xs text-slate-500">Rate nudges, parity syncs and OTA reopens — within guardrails, skipping Manual-mode properties.</p>
      </div>
      <AppButton variant="primary" size="sm" @click="agent.approveAllAuto()">
        <Zap class="h-4 w-4" /> Run all auto-eligible
      </AppButton>
    </div>
    <div v-else class="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
      <CheckCircle2 class="h-5 w-5 text-emerald-500" />
      <p class="text-sm font-medium text-slate-700">No auto-eligible actions waiting — automation is all caught up.</p>
    </div>

    <!-- Worklist groups OR inbox-zero -->
    <div v-if="!allClear" class="mt-6 space-y-6">
      <div v-for="sec in sections" :key="sec.key" v-show="sec.items.length">
        <div class="mb-2.5 flex items-center gap-2">
          <component :is="sec.icon" class="h-4 w-4" :class="sec.tone" />
          <h2 class="text-sm font-semibold text-slate-700">{{ sec.label }}</h2>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{{ sec.items.length }}</span>
        </div>
        <TransitionGroup name="wl" tag="div" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <WorklistCard
            v-for="item in sec.items"
            :key="item.id"
            :item="item"
            @approve="agent.approve"
            @reject="agent.reject"
            @resolve="resolveAlert"
            @dismiss="worklist.dismissSignal"
            @pin="pinItem"
          />
        </TransitionGroup>
      </div>
    </div>

    <!-- Inbox zero -->
    <div v-else class="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
        <PartyPopper class="h-7 w-7 text-emerald-500" />
      </div>
      <h2 class="mt-4 text-lg font-bold text-slate-900">You're all caught up 🎉</h2>
      <p class="mt-1 max-w-sm text-sm text-slate-500">
        No urgent items or pending decisions across your {{ portfolio.count }} properties. The AI Agent
        is handling routine moves — check back later or review your forecast.
      </p>
      <div class="mt-4 flex gap-2">
        <RouterLink to="/portfolio"><AppButton variant="secondary" size="sm">View portfolio</AppButton></RouterLink>
        <RouterLink to="/analytics"><AppButton variant="primary" size="sm">Open analytics</AppButton></RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Items leave smoothly when resolved/approved/dismissed (interruptible transition) */
.wl-enter-active,
.wl-leave-active {
  transition: opacity 220ms var(--ease-out), transform 220ms var(--ease-out);
}
.wl-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
.wl-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
.wl-move {
  transition: transform 220ms var(--ease-out);
}
</style>
