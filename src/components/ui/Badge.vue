<script setup>
import { computed } from 'vue'
const props = defineProps({
  tone: { type: String, default: 'slate' }, // slate | brand | green | amber | red | violet
  size: { type: String, default: 'md' },
})
const tones = {
  slate: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-rose-50 text-rose-700',
  violet: 'bg-violet-50 text-violet-700',
}
const cls = computed(() => [
  'inline-flex items-center gap-1 rounded-full font-medium',
  tones[props.tone],
  props.size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
])
</script>

<template>
  <span :class="cls"><slot /></span>
</template>
