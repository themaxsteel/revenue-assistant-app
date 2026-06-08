<script setup>
import { computed } from 'vue'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'
import Sparkline from '@/components/ui/Sparkline.vue'

const props = defineProps({
  label: String,
  value: [String, Number],
  deltaPct: { type: Number, default: 0 },
  series: { type: Array, default: () => [] },
})
const up = computed(() => (props.deltaPct ?? 0) >= 0)
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
    <p class="text-xs font-medium text-slate-500">{{ label }}</p>
    <div class="mt-1.5 flex items-end justify-between gap-2">
      <div class="min-w-0">
        <p class="text-xl font-bold tracking-tight text-slate-900">{{ value }}</p>
        <span
          class="mt-0.5 inline-flex items-center gap-0.5 text-xs font-semibold"
          :class="up ? 'text-emerald-600' : 'text-rose-600'"
        >
          <component :is="up ? TrendingUp : TrendingDown" class="h-3.5 w-3.5" />
          {{ up ? '+' : '' }}{{ deltaPct }}%
        </span>
      </div>
      <Sparkline v-if="series.length > 1" :data="series" :tone="up ? 'green' : 'red'" :width="74" :height="34" />
    </div>
    <p class="mt-1.5 text-[11px] text-slate-400">vs last 30 days</p>
  </div>
</template>
