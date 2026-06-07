<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import '@/components/charts/register'

const props = defineProps({ channels: { type: Array, required: true } })
const palette = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']

const chartData = computed(() => ({
  labels: props.channels.map((c) => c.name),
  datasets: [
    {
      data: props.channels.map((c) => c.share),
      backgroundColor: palette,
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
}))
const options = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '64%',
  animation: { duration: 300, easing: 'easeOutQuart' },
  plugins: {
    legend: { position: 'right', labels: { padding: 12 } },
    tooltip: { callbacks: { label: (c) => `${c.label}: ${c.raw}%` } },
  },
}
</script>

<template>
  <div class="h-52"><Doughnut :data="chartData" :options="options" /></div>
</template>
