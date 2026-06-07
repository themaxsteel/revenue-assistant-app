<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  width: { type: Number, default: 96 },
  height: { type: Number, default: 28 },
  tone: { type: String, default: 'brand' }, // brand | green | red
})

const colors = { brand: '#6366f1', green: '#10b981', red: '#f43f5e' }

const path = computed(() => {
  const d = props.data
  const min = Math.min(...d)
  const max = Math.max(...d)
  const span = max - min || 1
  const step = props.width / (d.length - 1)
  return d
    .map((v, i) => {
      const x = i * step
      const y = props.height - ((v - min) / span) * (props.height - 4) - 2
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" fill="none">
    <path :d="path" :stroke="colors[tone]" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
