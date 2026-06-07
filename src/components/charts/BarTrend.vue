<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import '@/components/charts/register'

const props = defineProps({
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
  color: { type: String, default: '#6366f1' },
  format: { type: String, default: '' }, // '%' | 'M'
})

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.values,
      backgroundColor: props.color,
      borderRadius: 6,
      maxBarThickness: 26,
    },
  ],
}))
const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 300, easing: 'easeOutQuart' },
  scales: {
    y: {
      grid: { color: '#f1f5f9' },
      ticks: { callback: (v) => (props.format === '%' ? v + '%' : props.format === 'M' ? v + 'M' : v) },
    },
    x: { grid: { display: false } },
  },
  plugins: { legend: { display: false } },
}))
</script>

<template>
  <div class="h-56"><Bar :data="chartData" :options="options" /></div>
</template>
