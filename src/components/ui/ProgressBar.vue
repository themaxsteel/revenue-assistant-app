<script setup>
import { computed } from 'vue'
const props = defineProps({
  value: { type: Number, required: true }, // 0-100
  tone: { type: String, default: 'brand' },
  height: { type: String, default: 'h-2' },
})
const tones = {
  brand: 'bg-brand-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
  slate: 'bg-slate-400',
}
const w = computed(() => `${Math.max(0, Math.min(100, props.value))}%`)
</script>

<template>
  <div class="w-full overflow-hidden rounded-full bg-slate-100" :class="height">
    <!-- width animates; only transform/opacity would be cheaper, but width here is fine for a non-repeated bar -->
    <div
      class="h-full rounded-full transition-[width] duration-500 ease-out"
      :class="tones[tone]"
      :style="{ width: w }"
    />
  </div>
</template>
