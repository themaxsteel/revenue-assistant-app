<script setup>
import { computed } from 'vue'
const props = defineProps({
  score: { type: Number, required: true },
  size: { type: Number, default: 44 },
})
const r = computed(() => props.size / 2 - 4)
const circ = computed(() => 2 * Math.PI * r.value)
const offset = computed(() => circ.value * (1 - props.score / 100))
const color = computed(() =>
  props.score >= 75 ? '#10b981' : props.score >= 55 ? '#f59e0b' : '#f43f5e',
)
</script>

<template>
  <div class="relative inline-flex items-center justify-center" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" class="-rotate-90">
      <circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" stroke="#f1f5f9" stroke-width="4" />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        fill="none"
        :stroke="color"
        stroke-width="4"
        stroke-linecap="round"
        :stroke-dasharray="circ"
        :stroke-dashoffset="offset"
        style="transition: stroke-dashoffset 600ms var(--ease-out)"
      />
    </svg>
    <span class="absolute text-xs font-bold text-slate-700">{{ score }}</span>
  </div>
</template>
