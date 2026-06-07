<script setup>
import { computed } from 'vue'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

const props = defineProps({
  label: String,
  value: [String, Number],
  delta: { type: Number, default: null }, // percentage change
  hint: String,
})
const positive = computed(() => props.delta != null && props.delta >= 0)
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
    <p class="text-xs font-medium text-slate-500">{{ label }}</p>
    <div class="mt-1.5 flex items-baseline justify-between">
      <p class="text-2xl font-bold tracking-tight text-slate-900">{{ value }}</p>
      <span
        v-if="delta != null"
        class="inline-flex items-center gap-0.5 text-xs font-semibold"
        :class="positive ? 'text-emerald-600' : 'text-rose-600'"
      >
        <component :is="positive ? TrendingUp : TrendingDown" class="h-3.5 w-3.5" />
        {{ positive ? '+' : '' }}{{ delta }}%
      </span>
    </div>
    <p v-if="hint" class="mt-1 text-xs text-slate-400">{{ hint }}</p>
  </div>
</template>
