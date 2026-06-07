<script setup>
import { computed } from 'vue'
import { MapPin, Bell, Zap, Lightbulb, Hand, CheckCircle2, Clock } from 'lucide-vue-next'
import HealthRing from './ui/HealthRing.vue'
import Sparkline from './ui/Sparkline.vue'
import Badge from './ui/Badge.vue'
import { propertyTypeLabel } from '@/mock/properties'
import { idr } from '@/mock/util'
import { usePortfolioStore } from '@/stores/portfolio'

const props = defineProps({ property: { type: Object, required: true } })
const portfolio = usePortfolioStore()
const modeMeta = {
  auto: { icon: Zap, tone: 'brand', label: 'Auto' },
  suggest: { icon: Lightbulb, tone: 'slate', label: 'Suggest' },
  manual: { icon: Hand, tone: 'slate', label: 'Manual' },
}
const m = computed(() => modeMeta[props.property.autonomyMode])
const sparkTone = computed(() => (props.property.paceDelta >= 0 ? 'green' : 'red'))
const reviewedToday = computed(() => portfolio.isReviewedToday(props.property.id))
const daysSince = computed(() => portfolio.daysSinceReview(props.property.id))
const reviewLabel = computed(() => {
  if (reviewedToday.value) return null
  if (daysSince.value === null) return 'Never reviewed'
  return `Reviewed ${daysSince.value}d ago`
})
const stale = computed(() => !reviewedToday.value && (daysSince.value === null || daysSince.value > 2))
</script>

<template>
  <RouterLink
    :to="`/property/${property.id}/overview`"
    class="pressable block rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-all duration-150 ease-out hover:border-brand-200 hover:shadow-pop"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-1.5">
          <h3 class="truncate text-sm font-semibold text-slate-900">{{ property.name }}</h3>
          <CheckCircle2 v-if="reviewedToday" class="h-3.5 w-3.5 shrink-0 text-emerald-500" title="Reviewed today" />
          <Clock v-else-if="stale" class="h-3.5 w-3.5 shrink-0 text-amber-500" :title="reviewLabel" />
        </div>
        <p class="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
          <MapPin class="h-3 w-3" />{{ property.city }}
        </p>
      </div>
      <HealthRing :score="property.healthScore" :size="40" />
    </div>

    <div class="mt-3 grid grid-cols-3 gap-2 text-center">
      <div>
        <p class="text-[10px] font-medium uppercase text-slate-400">Occ</p>
        <p class="text-sm font-bold text-slate-800">{{ property.occupancy }}%</p>
      </div>
      <div>
        <p class="text-[10px] font-medium uppercase text-slate-400">ADR</p>
        <p class="text-sm font-bold text-slate-800">{{ idr(property.adr, { compact: true }) }}</p>
      </div>
      <div>
        <p class="text-[10px] font-medium uppercase text-slate-400">RevPAR</p>
        <p class="text-sm font-bold text-slate-800">{{ idr(property.revpar, { compact: true }) }}</p>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
      <div class="flex items-center gap-2">
        <Badge :tone="m.tone" size="sm"><component :is="m.icon" class="h-3 w-3" />{{ m.label }}</Badge>
        <Badge v-if="property.alertCount" tone="red" size="sm">
          <Bell class="h-3 w-3" />{{ property.alertCount }}
        </Badge>
      </div>
      <Sparkline :data="property.sparkline" :tone="sparkTone" :width="64" :height="22" />
    </div>
  </RouterLink>
</template>
