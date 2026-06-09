<script setup>
import { ref, computed } from 'vue'
import { Star } from 'lucide-vue-next'
import { useReputationStore } from '@/stores/reputation'
import { reputationFor } from '@/mock/reputation'
import { reviewSourceLogos } from '@/mock/reviewLogos'
import ReviewCard from '@/components/ReviewCard.vue'
import Card from '@/components/ui/Card.vue'
import Sparkline from '@/components/ui/Sparkline.vue'

const props = defineProps({ property: Object })
const rep = useReputationStore()

const data = computed(() => reputationFor(props.property.id))
const reviews = computed(() => rep.forProperty(props.property.id))
const needsReply = computed(() => rep.needsReplyForProperty(props.property.id).length)
const trendUp = computed(() => data.value.trend.at(-1) >= data.value.trend[0])

function scoreTone(s) {
  return s >= 8.5 ? 'text-emerald-600' : s >= 7.5 ? 'text-amber-600' : 'text-rose-600'
}

const kind = ref('needs') // needs | all
const inbox = computed(() => {
  const list = kind.value === 'needs' ? reviews.value.filter((r) => !r.responded) : reviews.value
  return [...list].sort((a, b) => a.daysAgo - b.daysAgo)
})

// Recurring complaints from this property's negative reviews.
const themeCounts = computed(() => {
  const counts = {}
  reviews.value
    .filter((r) => r.sentiment === 'negative')
    .forEach((r) => r.themes.forEach((t) => (counts[t] = (counts[t] || 0) + 1)))
  return Object.entries(counts)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
})
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-[1fr_300px]">
    <!-- Reviews -->
    <div>
      <div class="mb-3 flex items-center gap-2">
        <p class="text-sm font-semibold text-slate-700">Reviews</p>
        <div class="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
          <button
            v-for="f in [['needs','Needs reply'],['all','All']]"
            :key="f[0]"
            class="pressable rounded-lg px-3 py-1.5 font-medium transition-colors duration-150 ease-out"
            :class="kind === f[0] ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'"
            @click="kind = f[0]"
          >{{ f[1] }}</button>
        </div>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <ReviewCard v-for="r in inbox" :key="r.id" :review="r" />
        <p v-if="!inbox.length" class="rounded-2xl border border-dashed border-slate-200 py-14 text-center text-sm text-slate-400 sm:col-span-2">
          Nothing here — all caught up. 🎉
        </p>
      </div>
    </div>

    <!-- Side: scores -->
    <div class="space-y-4">
      <Card padding="p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500">Overall score</p>
            <p class="text-2xl font-bold" :class="scoreTone(data.avg10)">{{ data.avg10 }}<span class="text-sm font-semibold text-slate-400">/10</span></p>
            <p class="text-xs text-slate-400">{{ data.totalReviews.toLocaleString('id-ID') }} reviews</p>
          </div>
          <Sparkline :data="data.trend" :tone="trendUp ? 'green' : 'red'" :width="84" :height="36" />
        </div>
        <p v-if="needsReply" class="mt-3 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-700">
          {{ needsReply }} review{{ needsReply > 1 ? 's' : '' }} awaiting your reply.
        </p>
      </Card>

      <Card title="By source" padding="p-4">
        <div class="space-y-2.5">
          <div v-for="s in data.sources" :key="s.key" class="flex items-center gap-2">
            <img v-if="reviewSourceLogos[s.key]" :src="reviewSourceLogos[s.key]" :alt="s.name" :title="s.name" class="h-6 w-6 shrink-0 rounded-md border border-slate-100 bg-white object-contain p-1" />
            <span class="w-20 shrink-0 truncate text-sm text-slate-600">{{ s.name }}</span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full bg-brand-400" :style="{ width: `${s.norm10 * 10}%` }" />
            </div>
            <span class="flex shrink-0 items-center gap-0.5 text-xs font-bold" :class="scoreTone(s.norm10)">
              <Star class="h-3 w-3 text-amber-400" />{{ s.score }}<span class="font-medium text-slate-400">/{{ s.scale }}</span>
            </span>
          </div>
        </div>
      </Card>

      <Card title="Recurring complaints" subtitle="From negative reviews" padding="p-4">
        <div v-if="themeCounts.length" class="space-y-2">
          <div v-for="t in themeCounts.slice(0, 6)" :key="t.theme" class="flex items-center gap-2">
            <span class="w-24 shrink-0 truncate text-sm text-slate-600">{{ t.theme }}</span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full bg-rose-400" :style="{ width: `${(t.count / themeCounts[0].count) * 100}%` }" />
            </div>
            <span class="w-5 shrink-0 text-right text-xs font-semibold text-slate-500">{{ t.count }}</span>
          </div>
        </div>
        <p v-else class="py-4 text-center text-sm text-slate-400">No recurring complaints. 🎉</p>
      </Card>
    </div>
  </div>
</template>
