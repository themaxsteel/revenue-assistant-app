<script setup>
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import { compsetFor } from '@/mock/compset'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { idr } from '@/mock/util'

const props = defineProps({ property: Object })
const data = computed(() => compsetFor(props.property.id))
const maxRate = computed(() => Math.max(...data.value.rows.map((r) => r.rate)))
</script>

<template>
  <div class="space-y-5">
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatCard label="Your rate" :value="idr(property.adr, { compact: true })" />
      <StatCard label="Compset average" :value="idr(data.avgComp, { compact: true })" />
      <StatCard label="Your position" :value="`${data.positionPct > 0 ? '+' : ''}${data.positionPct}%`" :delta="data.positionPct" hint="vs compset avg" />
    </div>

    <Card title="Rate shopping" subtitle="Live competitor rates within your market radius">
      <div class="space-y-2.5">
        <div v-for="r in data.rows" :key="r.name" class="flex items-center gap-3">
          <div class="w-48 shrink-0">
            <p class="truncate text-sm font-medium" :class="r.isYou ? 'text-brand-700' : 'text-slate-700'">{{ r.name }}</p>
            <p class="flex items-center gap-1 text-[11px] text-slate-400">
              <Star class="h-3 w-3 text-amber-400" />{{ r.rating }} · {{ r.isYou ? 'this property' : r.distanceKm + ' km' }}
            </p>
          </div>
          <div class="h-6 flex-1 overflow-hidden rounded-lg bg-slate-100">
            <div
              class="flex h-full items-center justify-end rounded-lg px-2 text-[11px] font-semibold text-white transition-[width] duration-500 ease-out"
              :class="r.isYou ? 'bg-brand-600' : 'bg-slate-400'"
              :style="{ width: `${(r.rate / maxRate) * 100}%` }"
            >
              {{ idr(r.rate, { compact: true }) }}
            </div>
          </div>
          <Badge v-if="r.isYou" tone="brand" size="sm">You</Badge>
        </div>
      </div>
    </Card>
  </div>
</template>
