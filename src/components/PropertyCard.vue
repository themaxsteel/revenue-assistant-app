<script setup>
import { computed, ref } from 'vue'
import { MapPin, ArrowUpRight, ArrowDownRight, CheckCircle2, ChevronRight } from 'lucide-vue-next'
import Badge from './ui/Badge.vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAgentStore } from '@/stores/agent'

const props = defineProps({
  property: { type: Object, required: true },
  view: { type: String, default: 'card' }, // 'card' | 'list'
})
const portfolio = usePortfolioStore()
const agent = useAgentStore()

const reviewedToday = computed(() => portfolio.isReviewedToday(props.property.id))
const pendingRecs = computed(
  () => agent.forProperty(props.property.id).filter((r) => r.status === 'pending').length,
)

// Photo with graceful fallback to an on-brand gradient + initials (offline).
const imgFailed = ref(false)
const initials = computed(() =>
  props.property.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase(),
)

// Plain-language status the RA can act on at a glance. "Needs attention" is
// reserved for a *real* problem (alerts, weak demand, or a clear booking drop)
// so red stays rare and meaningful — a high-occupancy property is never flagged.
const status = computed(() => {
  const p = props.property
  if (p.alertCount > 0 || p.occupancy < 55 || p.paceDelta <= -10) return 'attention'
  if (!reviewedToday.value) return 'review'
  return 'ontrack'
})
const statusMeta = {
  attention: { label: 'Needs attention', pill: 'bg-rose-50 text-rose-700' },
  review: { label: 'Needs review', pill: 'bg-amber-50 text-amber-700' },
  ontrack: { label: 'On track', pill: 'bg-emerald-50 text-emerald-700' },
}
const meta = computed(() => statusMeta[status.value])

// One plain-language line of "what's happening" — specific, with numbers, no jargon.
const headline = computed(() => {
  const p = props.property
  if (status.value === 'attention') {
    if (p.alertCount) return `${p.alertCount} alert${p.alertCount > 1 ? 's' : ''} ${p.alertCount > 1 ? 'need' : 'needs'} handling`
    if (p.occupancy < 55) return `Only ${p.occupancy}% booked — soft demand`
    if (p.paceDelta <= -10) return `Bookings down ${Math.abs(p.paceDelta)}% vs last year`
    return 'Needs a closer look'
  }
  return `Booking pace ${p.paceDelta >= 0 ? '+' : ''}${p.paceDelta}% vs last year`
})
const trendUp = computed(() => props.property.paceDelta >= 0)
</script>

<template>
  <!-- ── List row ──────────────────────────────────────────────── -->
  <RouterLink
    v-if="view === 'list'"
    :to="`/property/${property.id}/overview`"
    class="pressable group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-card transition-all duration-150 ease-out hover:border-brand-200 hover:shadow-pop"
  >
    <div class="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
      <img
        v-if="!imgFailed"
        :src="property.image"
        :alt="property.name"
        loading="lazy"
        class="h-full w-full object-cover"
        @error="imgFailed = true"
      />
      <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white/90">
        {{ initials }}
      </div>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h3 class="truncate text-sm font-semibold text-slate-900">{{ property.name }}</h3>
        <span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="meta.pill">
          {{ meta.label }}
        </span>
      </div>
      <p class="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
        <span class="flex items-center gap-1 truncate"><MapPin class="h-3 w-3 shrink-0" />{{ property.city }}</span>
        <span v-if="reviewedToday" class="flex shrink-0 items-center gap-1 font-medium text-emerald-600">
          · <CheckCircle2 class="h-3 w-3" /> Reviewed
        </span>
        <span v-else-if="status === 'attention' && pendingRecs" class="shrink-0 font-medium text-brand-600">
          · {{ pendingRecs }} to review
        </span>
      </p>
    </div>

    <p class="shrink-0 text-right text-sm">
      <span class="font-bold text-slate-800">{{ property.occupancy }}%</span>
      <span class="text-xs text-slate-400"> booked</span>
    </p>

    <ChevronRight class="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-brand-500" />
  </RouterLink>

  <!-- ── Card ──────────────────────────────────────────────────── -->
  <RouterLink
    v-else
    :to="`/property/${property.id}/overview`"
    class="pressable group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-150 ease-out hover:border-brand-200 hover:shadow-pop"
  >
    <!-- Cover photo — instant recognition; gradient + initials fallback -->
    <div class="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
      <img
        v-if="!imgFailed"
        :src="property.image"
        :alt="property.name"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        @error="imgFailed = true"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-brand-700 text-2xl font-bold tracking-wide text-white/90"
      >
        {{ initials }}
      </div>
      <!-- subtle top scrim so the status pill stays readable on bright photos -->
      <div class="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/25 to-transparent"></div>
      <span class="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm" :class="meta.pill">
        {{ meta.label }}
      </span>
    </div>

    <div class="p-4">
      <h3 class="truncate text-sm font-semibold text-slate-900">{{ property.name }}</h3>
      <p class="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
        <MapPin class="h-3 w-3" />{{ property.city }}
      </p>

      <!-- What's happening — words, not acronyms -->
      <p class="mt-2.5 flex items-center gap-1.5 text-sm text-slate-600">
        <component
          :is="trendUp ? ArrowUpRight : ArrowDownRight"
          v-if="status !== 'attention'"
          class="h-4 w-4 shrink-0"
          :class="trendUp ? 'text-emerald-500' : 'text-rose-500'"
        />
        {{ headline }}
      </p>

      <!-- One familiar number + the next step -->
      <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <p class="text-sm">
          <span class="font-bold text-slate-800">{{ property.occupancy }}%</span>
          <span class="text-xs text-slate-400"> booked</span>
        </p>
        <span v-if="reviewedToday" class="flex items-center gap-1 text-xs font-medium text-emerald-600">
          <CheckCircle2 class="h-3.5 w-3.5" /> Reviewed
        </span>
        <Badge v-else-if="status === 'attention' && pendingRecs" tone="brand" size="sm">
          {{ pendingRecs }} to review <ChevronRight class="h-3 w-3" />
        </Badge>
        <span v-else class="text-xs font-medium text-slate-400">Tap to review</span>
      </div>
    </div>
  </RouterLink>
</template>
