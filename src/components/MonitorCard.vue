<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import { ArrowRight, Radio, CalendarClock, TrendingUp, TrendingDown } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useMonitorStore } from '@/stores/monitor'
import { deriveMonitor, VERDICT_META, DECISION_META } from '@/mock/trackedActions'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import Sparkline from '@/components/ui/Sparkline.vue'
import { idr } from '@/mock/util'

const props = defineProps({
  action: { type: Object, required: true },
  showProperty: { type: Boolean, default: false },
})

const portfolio = usePortfolioStore()
const monitor = useMonitorStore()
const d = computed(() => deriveMonitor(props.action))
const property = computed(() => portfolio.byId(props.action.propertyId))

const verdict = computed(() => VERDICT_META[d.value.verdict] || VERDICT_META.starting)
const decision = computed(() => (props.action.decision ? DECISION_META[props.action.decision] : null))

const paceTone = computed(() =>
  ({ exceeded: 'green', on_track: 'brand', at_risk: 'amber' }[d.value.paceState] || 'slate'),
)
const netTone = computed(() => (d.value.netUplift >= 0 ? 'text-emerald-600' : 'text-rose-600'))

function pctStr(v, digits = 1) {
  return `${v > 0 ? '+' : ''}${v.toFixed(digits)}%`
}
function ptsStr(v) {
  return `${v > 0 ? '+' : ''}${v} pts`
}
</script>

<template>
  <div
    class="rounded-2xl border bg-white p-4 shadow-card transition-colors duration-150"
    :class="d.needsDecision ? 'border-amber-300' : 'border-slate-200'"
  >
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <Badge tone="slate" size="sm"><Radio class="h-3 w-3" />{{ action.channel }}</Badge>
          <Badge :tone="verdict.tone" size="sm">{{ verdict.label }}</Badge>
          <Badge v-if="decision" :tone="decision.tone" size="sm">{{ decision.label }}</Badge>
          <RouterLink
            v-if="showProperty && property"
            :to="`/property/${property.id}/monitor`"
            class="truncate text-xs font-medium text-slate-400 hover:text-brand-600"
          >
            {{ property.name }}
          </RouterLink>
        </div>
        <h3 class="mt-1.5 text-sm font-semibold text-slate-900">{{ action.title }}</h3>
        <p class="text-xs text-slate-400">{{ action.actionLabel }}</p>
      </div>
      <div class="shrink-0 text-right">
        <p class="text-[11px] font-medium text-slate-400">Net uplift so far</p>
        <p class="text-sm font-bold" :class="netTone">
          {{ d.netUplift >= 0 ? '+' : '−' }}{{ idr(Math.abs(d.netUplift), { compact: true }) }}
        </p>
      </div>
    </div>

    <!-- Window progress -->
    <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
      <CalendarClock class="h-3.5 w-3.5 text-slate-400" />
      <span class="font-medium text-slate-600">Day {{ d.dayOf }} of {{ d.days }}</span>
      <span class="text-slate-400">· ends {{ dayjs(action.endAt).format('DD MMM') }}</span>
      <span class="ml-auto text-slate-400">{{ d.timeProgressPct }}% of window</span>
    </div>
    <ProgressBar :value="d.timeProgressPct" tone="slate" height="h-1.5" class="mt-1.5" />

    <!-- No data yet -->
    <div v-if="!d.current" class="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
      Monitoring just started — first measurement expected tomorrow. Baseline locked at
      {{ action.baseline.occupancy }}% occ · {{ idr(action.baseline.adr, { compact: true }) }} ADR.
    </div>

    <template v-else>
      <!-- Metric grid: baseline → current -->
      <div class="mt-3 grid grid-cols-3 gap-2">
        <div class="rounded-xl bg-slate-50 p-2.5">
          <p class="text-[11px] font-medium text-slate-400">Occupancy</p>
          <p class="text-sm font-bold text-slate-900">{{ d.current.occupancy }}%</p>
          <p class="text-[11px]" :class="d.occDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ ptsStr(d.occDelta) }} vs {{ action.baseline.occupancy }}%
          </p>
        </div>
        <div class="rounded-xl bg-slate-50 p-2.5">
          <p class="text-[11px] font-medium text-slate-400">ADR</p>
          <p class="text-sm font-bold text-slate-900">{{ idr(d.current.adr, { compact: true }) }}</p>
          <p class="text-[11px]" :class="d.adrDeltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ pctStr(d.adrDeltaPct) }}
          </p>
        </div>
        <div class="rounded-xl bg-slate-50 p-2.5">
          <p class="text-[11px] font-medium text-slate-400">RevPAR (net)</p>
          <div class="flex items-center gap-1">
            <p class="text-sm font-bold text-slate-900">{{ idr(d.current.revpar, { compact: true }) }}</p>
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
      <div class="mt-3">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-slate-600">Target: {{ action.target.label }}</span>
          <Badge :tone="paceTone" size="sm">{{ d.pacePct }}% to goal</Badge>
        </div>
        <ProgressBar :value="d.pacePct" :tone="paceTone" height="h-1.5" class="mt-1.5" />
      </div>

      <!-- RevPAR trend + discount cost -->
      <div class="mt-3 flex items-center gap-3">
        <Sparkline
          v-if="d.revparSeries.length > 1"
          :data="d.revparSeries"
          :tone="d.revparDeltaPct >= 0 ? 'green' : 'red'"
          :width="120"
          :height="32"
        />
        <p v-if="action.discountPct" class="text-[11px] text-slate-400">
          Discount given away so far:
          <span class="font-medium text-slate-500">{{ idr(d.discountCost, { compact: true }) }}</span>
        </p>
      </div>
    </template>

    <!-- Decisions -->
    <div v-if="d.needsDecision" class="mt-4 border-t border-slate-100 pt-3">
      <p class="mb-2 text-xs font-medium text-slate-500">Window ended — what next?</p>
      <div class="flex flex-wrap items-center gap-2">
        <AppButton variant="success" size="sm" @click="monitor.makePermanent(action.id)">Make permanent</AppButton>
        <AppButton variant="secondary" size="sm" @click="monitor.extend(action.id, 7)">Extend 7d</AppButton>
        <AppButton variant="secondary" size="sm" @click="monitor.stop(action.id)">Stop</AppButton>
        <AppButton variant="danger" size="sm" @click="monitor.rollback(action.id)">Roll back</AppButton>
      </div>
    </div>
    <div
      v-else-if="action.status === 'active'"
      class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"
    >
      <span class="text-xs text-slate-400">Auto-decision at end of window</span>
      <div class="flex items-center gap-2">
        <AppButton
          v-if="d.verdict === 'at_risk'"
          variant="danger"
          size="sm"
          title="End early and revert"
          @click="monitor.rollback(action.id)"
        >
          Stop early
        </AppButton>
        <AppButton
          variant="ghost"
          size="sm"
          title="Commit this action permanently now, before the window ends"
          @click="monitor.makePermanent(action.id)"
        >
          Commit now <ArrowRight class="h-3.5 w-3.5" />
        </AppButton>
      </div>
    </div>
  </div>
</template>
