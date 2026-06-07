<script setup>
import { computed } from 'vue'
import { CalendarClock } from 'lucide-vue-next'
import { forecastFor, eventsFor } from '@/mock/forecast'
import Card from '@/components/ui/Card.vue'
import StatCard from '@/components/ui/StatCard.vue'
import Badge from '@/components/ui/Badge.vue'
import ForecastChart from '@/components/charts/ForecastChart.vue'

const props = defineProps({ property: Object })
const data = computed(() => forecastFor(props.property.id))
const events = eventsFor()
const avgForecast = computed(() => Math.round(data.value.reduce((s, d) => s + d.occForecast, 0) / data.value.length))
const totalPickup = computed(() => data.value.reduce((s, d) => s + d.pickup, 0))
</script>

<template>
  <div class="space-y-5">
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="30-day forecast occ" :value="`${avgForecast}%`" :delta="property.paceDelta" />
      <StatCard label="7-day pickup" :value="`+${property.pickup7d}`" hint="rooms vs prior week" />
      <StatCard label="Pace vs LY" :value="`${property.paceDelta > 0 ? '+' : ''}${property.paceDelta}%`" :delta="property.paceDelta" />
      <StatCard label="Total pickup (30d)" :value="`+${totalPickup}`" hint="rooms forecast" />
    </div>

    <Card title="Occupancy forecast vs last year" subtitle="Next 30 days · shaded = forecast">
      <ForecastChart :data="data" />
    </Card>

    <Card title="Upcoming demand drivers">
      <div class="space-y-2">
        <div v-for="e in events" :key="e.label" class="flex items-center gap-3 rounded-xl bg-violet-50/60 p-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600"><CalendarClock class="h-4.5 w-4.5" /></div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-slate-800">{{ e.label }}</p>
            <p class="text-xs text-slate-500">{{ e.date }} · expect elevated demand — consider raising rates & min-stay.</p>
          </div>
          <Badge tone="violet" size="sm">+14% demand</Badge>
        </div>
      </div>
    </Card>
  </div>
</template>
