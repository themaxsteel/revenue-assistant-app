<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import '@/components/charts/register'

const props = defineProps({ data: { type: Array, required: true } })

const chartData = computed(() => ({
  labels: props.data.map((d) => d.label),
  datasets: [
    {
      label: 'Forecast',
      data: props.data.map((d) => d.occForecast),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      borderWidth: 2,
    },
    {
      label: 'Last year',
      data: props.data.map((d) => d.occLY),
      borderColor: '#cbd5e1',
      borderDash: [4, 4],
      fill: false,
      tension: 0.35,
      pointRadius: 0,
      borderWidth: 1.5,
    },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 280, easing: 'easeOutQuart' },
  interaction: { mode: 'index', intersect: false },
  scales: {
    y: { min: 0, max: 100, ticks: { callback: (v) => v + '%' }, grid: { color: '#f1f5f9' } },
    x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
  },
  plugins: { legend: { position: 'top', align: 'end' } },
}
</script>

<template>
  <div class="h-56"><Line :data="chartData" :options="options" /></div>
</template>
