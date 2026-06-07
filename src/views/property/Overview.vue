<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import dayjs from 'dayjs'
import { ArrowRight, Bell, Check, ListTodo, AlertTriangle } from 'lucide-vue-next'
import { useAgentStore } from '@/stores/agent'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTasksStore } from '@/stores/tasks'
import { useUiStore } from '@/stores/ui'
import StatCard from '@/components/ui/StatCard.vue'
import Card from '@/components/ui/Card.vue'
import AppButton from '@/components/ui/AppButton.vue'
import RecommendationCard from '@/components/RecommendationCard.vue'
import Sparkline from '@/components/ui/Sparkline.vue'
import { idr } from '@/mock/util'

const props = defineProps({ property: Object })
const route = useRoute()
const agent = useAgentStore()
const portfolio = usePortfolioStore()
const ui = useUiStore()

const tasksStore = useTasksStore()
const pending = computed(() => agent.forProperty(props.property.id).filter((r) => r.status === 'pending').slice(0, 3))
const log = computed(() => agent.logForProperty(props.property.id).slice(0, 4))
const alerts = computed(() => portfolio.alerts.filter((a) => a.propertyId === props.property.id && !a.resolved))

const tasksOpenCount = computed(() =>
  tasksStore.forProperty(props.property.id).filter((t) => t.status === 'todo').length,
)
const tasksOverdueCount = computed(() =>
  tasksStore.overdue.filter((t) => t.propertyId === props.property.id).length,
)

function resolve(id) {
  portfolio.resolveAlert(id)
  ui.toast('Alert resolved')
}

// Deep-link focus from a worklist alert click.
const focused = ref(null)
function applyFocus() {
  const id = route.query.focus
  if (!id) return
  focused.value = id
  nextTick(() => document.getElementById(`alert-anchor-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  setTimeout(() => { focused.value = null }, 2600)
}
watch(() => route.query.focus, applyFocus, { immediate: true })
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-3">
    <div class="space-y-5 lg:col-span-2">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Occupancy" :value="`${property.occupancy}%`" :delta="property.paceDelta" />
        <StatCard label="ADR" :value="idr(property.adr, { compact: true })" :delta="Math.round(property.paceDelta * 0.4)" />
        <StatCard label="RevPAR" :value="idr(property.revpar, { compact: true })" :delta="property.paceDelta" />
        <StatCard label="Pace vs LY" :value="`${property.paceDelta > 0 ? '+' : ''}${property.paceDelta}%`" :delta="property.paceDelta" />
      </div>

      <!-- Tasks summary chip — links to dedicated Tasks tab -->
      <RouterLink :to="`/property/${property.id}/tasks`" class="group block">
        <div
          class="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-card transition-colors duration-150 ease-out group-hover:border-brand-200 group-hover:bg-brand-50"
          :class="tasksOverdueCount > 0 ? 'border-rose-200' : 'border-slate-200'"
        >
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            :class="tasksOverdueCount > 0 ? 'bg-rose-100' : 'bg-brand-50'"
          >
            <AlertTriangle v-if="tasksOverdueCount > 0" class="h-4 w-4 text-rose-600" />
            <ListTodo v-else class="h-4 w-4 text-brand-600" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold" :class="tasksOverdueCount > 0 ? 'text-rose-700' : 'text-slate-800'">
              <template v-if="tasksOpenCount === 0">All tasks complete</template>
              <template v-else-if="tasksOverdueCount > 0">{{ tasksOverdueCount }} overdue task{{ tasksOverdueCount > 1 ? 's' : '' }}</template>
              <template v-else>{{ tasksOpenCount }} open task{{ tasksOpenCount > 1 ? 's' : '' }}</template>
            </p>
            <p class="text-xs text-slate-400">
              <template v-if="tasksOpenCount === 0">Nothing pending for this property.</template>
              <template v-else-if="tasksOverdueCount > 0">{{ tasksOpenCount }} open · {{ tasksOverdueCount }} past due — review now</template>
              <template v-else>{{ tasksOpenCount }} open — click to manage</template>
            </p>
          </div>
          <ArrowRight class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-brand-500" />
        </div>
      </RouterLink>

      <Card title="Recommendations for this property">
        <template #actions>
          <RouterLink :to="`/property/${property.id}/agent`"><AppButton variant="ghost" size="sm">View all <ArrowRight class="h-3.5 w-3.5" /></AppButton></RouterLink>
        </template>
        <div v-if="pending.length" class="space-y-3">
          <RecommendationCard v-for="rec in pending" :key="rec.id" :rec="rec" />
        </div>
        <p v-else class="py-6 text-center text-sm text-slate-400">No pending recommendations — this property is on track.</p>
      </Card>
    </div>

    <div class="space-y-5">
      <Card title="14-day occupancy trend" padding="p-5">
        <Sparkline :data="property.sparkline" :tone="property.paceDelta >= 0 ? 'green' : 'red'" :width="240" :height="56" />
        <p class="mt-2 text-xs text-slate-400">Booking pace {{ property.paceDelta > 0 ? '+' : '' }}{{ property.paceDelta }}% vs last year.</p>
      </Card>

      <Card v-if="alerts.length" title="Active alerts">
        <ul class="space-y-2">
          <li
            v-for="a in alerts"
            :id="`alert-anchor-${a.id}`"
            :key="a.id"
            class="flex items-start gap-2 rounded-lg p-1.5 text-sm transition-all duration-300"
            :class="focused === a.id ? 'bg-brand-50 ring-2 ring-brand-300' : ''"
          >
            <Bell class="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
            <span class="flex-1 text-slate-600">{{ a.message }}</span>
            <button class="pressable shrink-0 rounded-lg p-1 text-emerald-600 hover:bg-emerald-50" title="Resolve" @click="resolve(a.id)">
              <Check class="h-3.5 w-3.5" />
            </button>
          </li>
        </ul>
      </Card>

      <Card title="Recent agent activity">
        <ol v-if="log.length" class="space-y-3">
          <li v-for="a in log" :key="a.id" class="text-sm">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full" :class="a.byAgent ? 'bg-brand-500' : 'bg-emerald-500'" />
              <p class="font-medium text-slate-700">{{ a.summary }}</p>
            </div>
            <p class="ml-4 text-xs text-slate-400">{{ dayjs(a.timestamp).format('DD MMM, HH:mm') }} · {{ a.byAgent ? 'Auto' : 'Approved' }}</p>
          </li>
        </ol>
        <p v-else class="py-4 text-center text-sm text-slate-400">No activity yet.</p>
      </Card>
    </div>
  </div>
</template>
