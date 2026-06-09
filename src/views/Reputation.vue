<script setup>
import { ref, computed } from 'vue'
import { Star, MessageSquare, ThumbsDown, ChevronDown, Check } from 'lucide-vue-next'
import { useReputationStore } from '@/stores/reputation'
import { usePortfolioStore } from '@/stores/portfolio'
import { reputationFor, REVIEW_SOURCES } from '@/mock/reputation'
import { reviewSourceLogos } from '@/mock/reviewLogos'
import ReviewCard from '@/components/ReviewCard.vue'
import Card from '@/components/ui/Card.vue'
import Sparkline from '@/components/ui/Sparkline.vue'

const rep = useReputationStore()
const portfolio = usePortfolioStore()

function scoreTone(s) {
  return s >= 8.5 ? 'text-emerald-600' : s >= 7.5 ? 'text-amber-600' : 'text-rose-600'
}

const portfolioTrend = computed(() => {
  const reps = portfolio.properties.map((p) => reputationFor(p.id).trend)
  return Array.from({ length: 8 }, (_, i) =>
    +(reps.reduce((a, t) => a + t[i], 0) / reps.length).toFixed(2),
  )
})
const trendUp = computed(() => portfolioTrend.value.at(-1) >= portfolioTrend.value[0])

// Reviews inbox
const kind = ref('needs') // needs | all | negative
const sourceFilter = ref('all')
const sourceOpen = ref(false)
const sourceLabel = computed(() =>
  sourceFilter.value === 'all' ? 'All sources' : REVIEW_SOURCES.find((s) => s.key === sourceFilter.value)?.name,
)
function pickSource(key) {
  sourceFilter.value = key
  sourceOpen.value = false
}
const inbox = computed(() => {
  let list =
    kind.value === 'needs'
      ? rep.needsReply
      : kind.value === 'negative'
        ? rep.reviews.filter((r) => r.sentiment === 'negative')
        : rep.reviews
  if (sourceFilter.value !== 'all') list = list.filter((r) => r.source === sourceFilter.value)
  return [...list].sort((a, b) => a.daysAgo - b.daysAgo)
})
</script>

<template>
  <div>
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-slate-900"><Star class="h-5 w-5 text-brand-600" /> Reputation</h1>
      <p class="text-sm text-slate-500">Keep ratings high and reviews answered across every OTA — your central reputation desk.</p>
    </div>

    <!-- Top stats -->
    <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card padding="p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500">Portfolio score</p>
            <p class="text-2xl font-bold" :class="scoreTone(rep.portfolioScore)">{{ rep.portfolioScore }}<span class="text-sm font-semibold text-slate-400">/10</span></p>
          </div>
          <Sparkline :data="portfolioTrend" :tone="trendUp ? 'green' : 'red'" :width="72" :height="32" />
        </div>
      </Card>
      <Card padding="p-4">
        <p class="text-xs font-medium text-slate-500">Response rate</p>
        <p class="mt-1 text-2xl font-bold text-slate-800">{{ rep.responseRate }}%</p>
        <p class="text-xs text-slate-400">reviews answered</p>
      </Card>
      <Card padding="p-4">
        <p class="flex items-center gap-1 text-xs font-medium text-slate-500"><MessageSquare class="h-3.5 w-3.5" /> Needs reply</p>
        <p class="mt-1 text-2xl font-bold" :class="rep.needsReply.length ? 'text-amber-600' : 'text-emerald-600'">{{ rep.needsReply.length }}</p>
        <p class="text-xs text-slate-400">awaiting your response</p>
      </Card>
      <Card padding="p-4">
        <p class="flex items-center gap-1 text-xs font-medium text-slate-500"><ThumbsDown class="h-3.5 w-3.5" /> Need attention</p>
        <p class="mt-1 text-2xl font-bold" :class="rep.attention.length ? 'text-rose-600' : 'text-emerald-600'">{{ rep.attention.length }}</p>
        <p class="text-xs text-slate-400">properties to look at</p>
      </Card>
    </div>

    <!-- Per-source averages -->
    <div class="mt-3 flex flex-wrap gap-2">
      <div
        v-for="s in rep.sourceAverages"
        :key="s.key"
        class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-card"
      >
        <img v-if="reviewSourceLogos[s.key]" :src="reviewSourceLogos[s.key]" :alt="s.name" :title="s.name" class="h-6 w-6 shrink-0 rounded-md border border-slate-100 bg-white object-contain p-1" />
        <span class="text-sm font-bold" :class="scoreTone(s.scale === 10 ? s.score : s.score * 2)">{{ s.score }}<span class="text-[11px] font-medium text-slate-400">/{{ s.scale }}</span></span>
      </div>
    </div>

    <div class="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
      <!-- Reviews inbox -->
      <div>
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <p class="shrink-0 text-sm font-semibold text-slate-700">Reviews</p>
          <div class="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
            <button
              v-for="f in [['needs','Needs reply'],['negative','Negative'],['all','All']]"
              :key="f[0]"
              class="pressable rounded-lg px-3 py-1.5 font-medium transition-colors duration-150 ease-out"
              :class="kind === f[0] ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'"
              @click="kind = f[0]"
            >{{ f[1] }}</button>
          </div>
          <!-- Source filter — custom dropdown so each option shows its logo -->
          <div class="relative ml-auto">
            <button
              class="pressable inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50"
              @click="sourceOpen = !sourceOpen"
            >
              <img v-if="reviewSourceLogos[sourceFilter]" :src="reviewSourceLogos[sourceFilter]" :alt="sourceLabel" class="h-4 w-4 shrink-0 rounded bg-white object-contain" />
              {{ sourceLabel }}
              <ChevronDown class="h-3.5 w-3.5 text-slate-400" />
            </button>
            <div v-if="sourceOpen" class="fixed inset-0 z-10" @click="sourceOpen = false"></div>
            <div v-if="sourceOpen" class="absolute right-0 z-20 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-pop">
              <button
                class="pressable flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-150"
                :class="sourceFilter === 'all' ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-600 hover:bg-slate-50'"
                @click="pickSource('all')"
              >
                <span class="flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold text-slate-400">All</span>
                <span class="flex-1">All sources</span>
                <Check v-if="sourceFilter === 'all'" class="h-4 w-4 shrink-0 text-brand-600" />
              </button>
              <button
                v-for="s in REVIEW_SOURCES"
                :key="s.key"
                class="pressable flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-150"
                :class="sourceFilter === s.key ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-600 hover:bg-slate-50'"
                @click="pickSource(s.key)"
              >
                <img v-if="reviewSourceLogos[s.key]" :src="reviewSourceLogos[s.key]" :alt="s.name" class="h-5 w-5 shrink-0 rounded bg-white object-contain" />
                <span class="flex-1">{{ s.name }}</span>
                <Check v-if="sourceFilter === s.key" class="h-4 w-4 shrink-0 text-brand-600" />
              </button>
            </div>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <ReviewCard v-for="r in inbox" :key="r.id" :review="r" show-property />
          <p v-if="!inbox.length" class="rounded-2xl border border-dashed border-slate-200 py-14 text-center text-sm text-slate-400 sm:col-span-2">
            Nothing here — all caught up. 🎉
          </p>
        </div>
      </div>

      <!-- Side rail: attention + themes -->
      <div class="space-y-4">
        <Card title="Needs attention" padding="p-4">
          <div v-if="rep.attention.length" class="space-y-2">
            <RouterLink
              v-for="a in rep.attention.slice(0, 6)"
              :key="a.property.id"
              :to="`/property/${a.property.id}/reputation`"
              class="pressable flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 transition-colors duration-150 hover:border-brand-200 hover:bg-brand-50/40"
            >
              <span class="text-sm font-bold tabular-nums" :class="scoreTone(a.rep.avg10)">{{ a.rep.avg10 }}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-slate-700">{{ a.property.name }}</span>
                <span class="block truncate text-xs text-slate-400">
                  <template v-if="a.negOpen">{{ a.negOpen }} negative review{{ a.negOpen > 1 ? 's' : '' }} unanswered</template>
                  <template v-else-if="a.openReplies">{{ a.openReplies }} review{{ a.openReplies > 1 ? 's' : '' }} to reply</template>
                  <template v-else>Score below target</template>
                </span>
              </span>
            </RouterLink>
          </div>
          <p v-else class="py-4 text-center text-sm text-slate-400">All properties look healthy.</p>
        </Card>

        <Card title="Recurring complaints" subtitle="From negative reviews" padding="p-4">
          <div v-if="rep.themeCounts.length" class="space-y-2">
            <div v-for="t in rep.themeCounts.slice(0, 6)" :key="t.theme" class="flex items-center gap-2">
              <span class="w-28 shrink-0 truncate text-sm text-slate-600">{{ t.theme }}</span>
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-rose-400" :style="{ width: `${(t.count / rep.themeCounts[0].count) * 100}%` }" />
              </div>
              <span class="w-5 shrink-0 text-right text-xs font-semibold text-slate-500">{{ t.count }}</span>
            </div>
          </div>
          <p v-else class="py-4 text-center text-sm text-slate-400">No recurring complaints. 🎉</p>
        </Card>
      </div>
    </div>
  </div>
</template>
