<script setup>
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { CalendarClock, TrendingUp, TrendingDown, ChevronRight, ListPlus } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useMonitorStore } from '@/stores/monitor'
import { useTasksStore } from '@/stores/tasks'
import { deriveMonitor, VERDICT_META, DECISION_META } from '@/mock/trackedActions'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import Sparkline from '@/components/ui/Sparkline.vue'
import Modal from '@/components/ui/Modal.vue'
import { idr } from '@/mock/util'

const props = defineProps({
  action: { type: Object, required: true },
  showProperty: { type: Boolean, default: false },
})

const portfolio = usePortfolioStore()
const monitor = useMonitorStore()
const tasks = useTasksStore()
const d = computed(() => deriveMonitor(props.action))
const property = computed(() => portfolio.byId(props.action.propertyId))

const verdict = computed(() => VERDICT_META[d.value.verdict] || VERDICT_META.starting)
const decision = computed(() => (props.action.decision ? DECISION_META[props.action.decision] : null))

const paceTone = computed(() =>
  ({ exceeded: 'green', on_track: 'brand', at_risk: 'amber' }[d.value.paceState] || 'slate'),
)
const netTone = computed(() => (d.value.netUplift >= 0 ? 'text-emerald-600' : 'text-rose-600'))

// Plain-language pill classes for the headline verdict.
const TONE_PILL = {
  green: 'bg-emerald-50 text-emerald-700',
  brand: 'bg-brand-50 text-brand-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
}
const verdictPill = computed(() => TONE_PILL[verdict.value.tone] || TONE_PILL.slate)

const daysLeft = computed(() => Math.max(0, d.value.days - d.value.dayOf))
const open = ref(false)

// Plain-language follow-up suggestion once the window has ended — the RA acts on
// it manually; the app never applies or reverts anything itself.
const followUp = computed(() => {
  const v = d.value.verdict
  if (['exceeded', 'succeeded', 'on_track'].includes(v)) return 'Worked well — consider keeping this change.'
  if (['at_risk', 'underperformed'].includes(v)) return "Didn't deliver — consider reverting this change."
  return 'Too early to tell — give it a little more time.'
})

function addFollowUp() {
  tasks.addTask({
    title: `Follow up: ${props.action.title}`,
    propertyId: props.action.propertyId,
    priority: 'medium',
    dueAt: dayjs().add(1, 'day').toISOString(),
    note: followUp.value,
  })
  monitor.close(props.action.id, 'tasked')
  open.value = false
}
function markClosed() {
  monitor.close(props.action.id, 'closed')
  open.value = false
}

function pctStr(v, digits = 1) {
  return `${v > 0 ? '+' : ''}${v.toFixed(digits)}%`
}
function ptsStr(v) {
  return `${v > 0 ? '+' : ''}${v} pts`
}
</script>

<template>
  <div
    class="group cursor-pointer rounded-2xl border bg-white p-4 shadow-card transition-all duration-150 hover:border-brand-200 hover:shadow-pop"
    :class="d.needsDecision ? 'border-amber-300' : 'border-slate-200'"
    @click="open = true"
  >
    <!-- ── Summary: verdict + what + result ── -->
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="verdictPill">{{ verdict.label }}</span>
          <Badge v-if="decision" :tone="decision.tone" size="sm">{{ decision.label }}</Badge>
        </div>
        <h3 class="mt-1.5 truncate text-sm font-semibold text-slate-900">{{ action.title }}</h3>
        <RouterLink
          v-if="showProperty && property"
          :to="`/property/${property.id}/monitor`"
          class="text-xs font-medium text-slate-400 hover:text-brand-600"
          @click.stop
        >
          {{ property.name }}
        </RouterLink>
        <p v-else class="text-xs text-slate-400">{{ action.actionLabel }}</p>
      </div>
      <div v-if="d.current" class="shrink-0 text-right">
        <p class="text-[11px] font-medium text-slate-400">Extra earned so far</p>
        <p class="text-base font-bold" :class="netTone">
          {{ d.netUplift >= 0 ? '+' : '−' }}{{ idr(Math.abs(d.netUplift), { compact: true }) }}
        </p>
      </div>
    </div>

    <!-- ── Time left + open-details hint ── -->
    <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
      <CalendarClock class="h-3.5 w-3.5 text-slate-400" />
      <span v-if="d.needsDecision" class="font-medium text-amber-600">Window ended — decide below</span>
      <span v-else-if="action.status === 'active'" class="font-medium text-slate-600">
        {{ daysLeft }} {{ daysLeft === 1 ? 'day' : 'days' }} left
      </span>
      <span v-else class="font-medium text-slate-600">Finished</span>
      <span class="ml-auto inline-flex items-center gap-0.5 font-medium text-slate-400 transition-colors group-hover:text-brand-600">
        View details <ChevronRight class="h-3.5 w-3.5" />
      </span>
    </div>

    <!-- ── Window ended: plain follow-up + light manual actions ── -->
    <div v-if="d.needsDecision" class="mt-4 border-t border-slate-100 pt-3" @click.stop>
      <p class="mb-2 text-xs font-medium text-slate-600">{{ followUp }}</p>
      <div class="flex flex-wrap items-center gap-2">
        <AppButton variant="primary" size="sm" @click="addFollowUp">
          <ListPlus class="h-3.5 w-3.5" /> Add to task
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="markClosed">Mark as closed</AppButton>
      </div>
    </div>
  </div>

  <!-- ── Detail modal ── -->
  <Modal :open="open" :title="action.title" size="lg" @close="open = false">
    <!-- Recap -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="verdictPill">{{ verdict.label }}</span>
          <Badge v-if="decision" :tone="decision.tone" size="sm">{{ decision.label }}</Badge>
        </div>
        <p class="mt-1.5 text-xs text-slate-400">
          {{ action.actionLabel }}<template v-if="property"> · {{ property.name }}</template>
        </p>
      </div>
      <div v-if="d.current" class="shrink-0 text-right">
        <p class="text-[11px] font-medium text-slate-400">Extra earned so far</p>
        <p class="text-lg font-bold" :class="netTone">
          {{ d.netUplift >= 0 ? '+' : '−' }}{{ idr(Math.abs(d.netUplift), { compact: true }) }}
        </p>
      </div>
    </div>

    <!-- No data yet -->
    <div v-if="!d.current" class="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
      Monitoring just started — first measurement expected tomorrow. Baseline locked at
      {{ action.baseline.occupancy }}% occ · {{ idr(action.baseline.adr, { compact: true }) }} ADR.
    </div>

    <template v-else>
      <!-- Window progress -->
      <div class="mt-4">
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <CalendarClock class="h-3.5 w-3.5 text-slate-400" />
          <span class="font-medium text-slate-600">Day {{ d.dayOf }} of {{ d.days }}</span>
          <span class="text-slate-400">· {{ action.channel }} · ends {{ dayjs(action.endAt).format('DD MMM') }}</span>
          <span class="ml-auto text-slate-400">{{ d.timeProgressPct }}% of window</span>
        </div>
        <ProgressBar :value="d.timeProgressPct" tone="slate" height="h-1.5" class="mt-1.5" />
      </div>

      <!-- Metric grid: baseline → current -->
      <div class="mt-4 grid grid-cols-3 gap-2">
        <div class="rounded-xl bg-slate-50 p-3">
          <p class="text-[11px] font-medium text-slate-400">Occupancy</p>
          <p class="text-base font-bold text-slate-900">{{ d.current.occupancy }}%</p>
          <p class="text-[11px]" :class="d.occDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ ptsStr(d.occDelta) }} vs {{ action.baseline.occupancy }}%
          </p>
        </div>
        <div class="rounded-xl bg-slate-50 p-3">
          <p class="text-[11px] font-medium text-slate-400">ADR</p>
          <p class="text-base font-bold text-slate-900">{{ idr(d.current.adr, { compact: true }) }}</p>
          <p class="text-[11px]" :class="d.adrDeltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ pctStr(d.adrDeltaPct) }}
          </p>
        </div>
        <div class="rounded-xl bg-slate-50 p-3">
          <p class="text-[11px] font-medium text-slate-400">RevPAR (net)</p>
          <div class="flex items-center gap-1">
            <p class="text-base font-bold text-slate-900">{{ idr(d.current.revpar, { compact: true }) }}</p>
            <component
              :is="d.revparDeltaPct >= 0 ? TrendingUp : TrendingDown"
              class="h-3.5 w-3.5"
              :class="d.revparDeltaPct >= 0 ? 'text-emerald-500' : 'text-rose-500'"
            />
          </div>
          <p class="text-[11px]" :class="d.revparDeltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ pctStr(d.revparDeltaPct) }} vs baseline
          </p>
        </div>
      </div>

      <!-- Pace toward target -->
      <div class="mt-4">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-slate-600">Target: {{ action.target.label }}</span>
          <Badge :tone="paceTone" size="sm">{{ d.pacePct }}% to goal</Badge>
        </div>
        <ProgressBar :value="d.pacePct" :tone="paceTone" height="h-1.5" class="mt-1.5" />
      </div>

      <!-- RevPAR trend + discount cost -->
      <div class="mt-4 flex items-center gap-3">
        <Sparkline
          v-if="d.revparSeries.length > 1"
          :data="d.revparSeries"
          :tone="d.revparDeltaPct >= 0 ? 'green' : 'red'"
          :width="160"
          :height="40"
        />
        <p v-if="action.discountPct" class="text-[11px] text-slate-400">
          Discount given away so far:
          <span class="font-medium text-slate-500">{{ idr(d.discountCost, { compact: true }) }}</span>
        </p>
      </div>
    </template>

    <!-- Window-ended follow-up note -->
    <div v-if="d.needsDecision" class="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-600">
      {{ followUp }}
    </div>

    <!-- Light manual actions inside the modal -->
    <template v-if="d.needsDecision" #footer>
      <AppButton variant="secondary" size="sm" @click="markClosed">Mark as closed</AppButton>
      <AppButton variant="primary" size="sm" @click="addFollowUp">
        <ListPlus class="h-3.5 w-3.5" /> Add to task
      </AppButton>
    </template>
  </Modal>
</template>
