<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import '@/components/charts/register'

const props = defineProps({ channels: { type: Array, required: true } })
const palette = ['#8c52ff', '#9a66ff', '#a87dff', '#c0a1ff', '#d8c6ff', '#ece2ff']

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
