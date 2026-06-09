<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 }, // 0–100
  size: { type: Number, default: 76 },
  stroke: { type: Number, default: 6 },
  color: { type: String, default: '#8c52ff' },
  track: { type: String, default: '#e2e8f0' },
})

const r = computed(() => (props.size - props.stroke) / 2)
const circ = computed(() => 2 * Math.PI * r.value)
const center = computed(() => props.size / 2)
const dash = computed(() => {
  const v = Math.min(100, Math.max(0, props.value))
  return `${(v / 100) * circ.value} ${circ.value}`
})
</script>

<template>
  <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="-rotate-90">
      <circle :cx="center" :cy="center" :r="r" fill="none" :stroke="track" :stroke-width="stroke" />
      <circle
        :cx="center"
        :cy="center"
        :r="r"
        fill="none"
        :stroke="color"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="dash"
        class="transition-[stroke-dasharray] duration-500 ease-out"
      />
    </svg>
    <div class="absolute inset-0 flex items-center justify-center text-center leading-tight">
      <slot />
    </div>
  </div>
</template>
