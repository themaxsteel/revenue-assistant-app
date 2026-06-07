<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { forecastFor } from '@/mock/forecast'
import { useUiStore } from '@/stores/ui'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import { idr, rng, range } from '@/mock/util'

const props = defineProps({ property: Object })
const ui = useUiStore()

// Build a 28-day rate calendar with recommended rates + gap-night & min-stay flags.
const forecast = computed(() => forecastFor(props.property.id))
const days = computed(() => {
  const rand = rng(80000 + parseInt(props.property.id.slice(-2), 10))
  return forecast.value.slice(0, 28).map((d, i) => {
    const weekend = d.weekend
    const base = props.property.adr
    const rec = Math.round((base * (1 + (weekend ? 0.12 : -0.03) + (d.event ? 0.18 : 0))) / 10000) * 10000
    const gapNight = !weekend && range(rand, 0, 1) > 0.82
    return {
      ...d,
      current: base,
      recommended: rec,
      delta: Math.round(((rec - base) / base) * 100),
      gapNight,
      minStay: d.event ? 2 : props.property.minStay,
    }
  })
})

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const leadPad = computed(() => (dayjs(days.value[0].date).day() + 6) % 7)

function apply(day) {
  ui.toast(`Rate for ${day.label} set to ${idr(day.recommended, { compact: true })}`)
}
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-[1fr_300px]">
    <Card title="Rate calendar" subtitle="Recommended BAR per night · click a day to apply">
      <div class="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-slate-400">
        <div v-for="w in weekdays" :key="w">{{ w }}</div>
      </div>
      <div class="mt-1.5 grid grid-cols-7 gap-1.5">
        <div v-for="n in leadPad" :key="'pad' + n" />
        <button
          v-for="day in days"
          :key="day.date"
          class="pressable rounded-lg border p-1.5 text-left transition-colors duration-150 ease-out hover:border-brand-300 hover:bg-brand-50/40"
          :class="day.weekend ? 'border-slate-200 bg-slate-50' : 'border-slate-100'"
          @click="apply(day)"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-600">{{ dayjs(day.date).format('D') }}</span>
            <span v-if="day.event" class="h-1.5 w-1.5 rounded-full bg-violet-500" :title="day.event" />
          </div>
          <p class="mt-1 text-[11px] font-bold text-slate-800">{{ idr(day.recommended, { compact: true }) }}</p>
          <div class="mt-0.5 flex flex-wrap gap-0.5">
            <span v-if="day.delta !== 0" class="text-[9px] font-semibold" :class="day.delta > 0 ? 'text-emerald-600' : 'text-rose-500'">{{ day.delta > 0 ? '+' : '' }}{{ day.delta }}%</span>
            <span v-if="day.minStay > 1" class="rounded bg-amber-100 px-1 text-[9px] font-medium text-amber-700">{{ day.minStay }}n</span>
            <span v-if="day.gapNight" class="rounded bg-rose-100 px-1 text-[9px] font-medium text-rose-600">gap</span>
          </div>
        </button>
      </div>
      <div class="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-400">
        <span class="flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-violet-500" /> Event</span>
        <span class="flex items-center gap-1"><span class="rounded bg-amber-100 px-1 text-amber-700">2n</span> Min-stay</span>
        <span class="flex items-center gap-1"><span class="rounded bg-rose-100 px-1 text-rose-600">gap</span> Gap night</span>
      </div>
    </Card>

    <div class="space-y-4">
      <Card title="Pricing rules" padding="p-5">
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500">Current BAR</dt><dd class="font-semibold text-slate-800">{{ idr(property.adr, { compact: true }) }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Floor</dt><dd class="font-semibold text-slate-800">{{ idr(property.adr * 0.7, { compact: true }) }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Ceiling</dt><dd class="font-semibold text-slate-800">{{ idr(property.adr * 1.8, { compact: true }) }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Default min-stay</dt><dd class="font-semibold text-slate-800">{{ property.minStay }} night(s)</dd></div>
        </dl>
      </Card>
      <Card title="Gap nights detected" padding="p-5">
        <p class="text-2xl font-bold text-rose-600">{{ days.filter(d => d.gapNight).length }}</p>
        <p class="text-xs text-slate-400">Single-night gaps between stays in the next 28 days. Agent can lower midweek rates to fill them.</p>
      </Card>
    </div>
  </div>
</template>
