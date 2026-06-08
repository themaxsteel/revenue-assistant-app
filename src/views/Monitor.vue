<script setup>
import { computed, ref } from 'vue'
import { Activity } from 'lucide-vue-next'
import { useMonitorStore } from '@/stores/monitor'
import { deriveMonitor } from '@/mock/trackedActions'
import MonitorCard from '@/components/MonitorCard.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { idr } from '@/mock/util'

const monitor = useMonitorStore()

const filter = ref('all') // all | needs | active | closed
const filters = [
  { key: 'all', label: 'All' },
  { key: 'needs', label: 'Needs decision' },
  { key: 'active', label: 'Monitoring' },
  { key: 'closed', label: 'Closed' },
]

const needsDecision = computed(() => monitor.needsDecision)
const active = computed(() => monitor.active)
const closed = computed(() => monitor.all.filter((a) => a.status === 'decided' || a.status === 'scheduled'))

const list = computed(() => {
  if (filter.value === 'needs') return needsDecision.value
  if (filter.value === 'active') return active.value
  if (filter.value === 'closed') return closed.value
  // all → needs-decision first, then active, then closed
  return [...needsDecision.value, ...active.value, ...closed.value]
})

// Net uplift across everything currently live or just ended.
const totalNet = computed(() =>
  [...active.value, ...needsDecision.value].reduce((s, a) => s + deriveMonitor(a).netUplift, 0),
)
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-bold text-slate-900">Action Monitoring</h1>
      <p class="text-sm text-slate-400">
        Every applied action, watched against its baseline and target until the Revenue Assistant decides to keep, extend, or roll it back.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatCard label="Monitoring now" :value="String(active.length)" hint="actions live in their window" />
      <StatCard label="Needs decision" :value="String(needsDecision.length)" hint="windows ended — awaiting call" />
      <StatCard label="Net uplift (live)" :value="`${totalNet >= 0 ? '+' : '−'}${idr(Math.abs(totalNet), { compact: true })}`" hint="vs baseline, net of discounts" />
    </div>

    <!-- Filter -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="f in filters"
        :key="f.key"
        class="pressable rounded-xl px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out"
        :class="filter === f.key ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100'"
        @click="filter = f.key"
      >
        {{ f.label }}
        <span v-if="f.key === 'needs' && needsDecision.length" class="ml-1 rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-700">{{ needsDecision.length }}</span>
      </button>
    </div>

    <div v-if="list.length" class="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
      <MonitorCard v-for="a in list" :key="a.id" :action="a" show-property />
    </div>
    <div v-else class="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
      <Activity class="mx-auto h-8 w-8 text-slate-300" />
      <p class="mt-2 text-sm font-medium text-slate-600">Nothing here.</p>
      <p class="mt-1 text-xs text-slate-400">Approve a recommendation to start monitoring its impact.</p>
    </div>
  </div>
</template>
