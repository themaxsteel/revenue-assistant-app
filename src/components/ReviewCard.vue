<script setup>
import { computed } from 'vue'
import { MessageCircle, Check, Star } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useReputationStore } from '@/stores/reputation'
import { useChatStore } from '@/stores/chat'
import { reviewSourceLogos } from '@/mock/reviewLogos'
import Badge from '@/components/ui/Badge.vue'

const props = defineProps({
  review: { type: Object, required: true },
  showProperty: { type: Boolean, default: false },
})

const portfolio = usePortfolioStore()
const reputation = useReputationStore()
const chat = useChatStore()

const property = computed(() => portfolio.byId(props.review.propertyId))
const sentimentMeta = {
  positive: { tone: 'green', label: 'Positive' },
  neutral: { tone: 'slate', label: 'Neutral' },
  negative: { tone: 'red', label: 'Negative' },
}
const meta = computed(() => sentimentMeta[props.review.sentiment] || sentimentMeta.neutral)
const scoreColor = computed(() =>
  props.review.sentiment === 'negative'
    ? 'text-rose-600'
    : props.review.sentiment === 'neutral'
      ? 'text-slate-600'
      : 'text-emerald-600',
)
const ageText = computed(() =>
  props.review.daysAgo === 0 ? 'today' : `${props.review.daysAgo}d ago`,
)

const logo = computed(() => reviewSourceLogos[props.review.source])

function askAI() {
  chat.askReviewReply(props.review, property.value?.name)
}
function markReplied() {
  reputation.markReplied(props.review.id)
}
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <img
            v-if="logo"
            :src="logo"
            :alt="review.sourceName"
            :title="review.sourceName"
            class="h-7 w-7 shrink-0 rounded-md border border-slate-100 bg-white object-contain p-1"
          />
          <Badge :tone="meta.tone" size="sm">{{ meta.label }}</Badge>
          <RouterLink
            v-if="showProperty && property"
            :to="`/property/${property.id}/reputation`"
            class="truncate text-xs font-medium text-slate-400 hover:text-brand-600"
          >{{ property.name }}</RouterLink>
        </div>
        <p class="mt-1.5 text-xs text-slate-400">{{ review.author }} · {{ ageText }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <Star class="h-4 w-4 text-amber-400" />
        <span class="text-sm font-bold" :class="scoreColor">{{ review.rating }}</span>
        <span class="text-[11px] text-slate-400">/{{ review.scale }}</span>
      </div>
    </div>

    <p class="mt-2.5 text-sm leading-relaxed text-slate-700">{{ review.text }}</p>

    <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
      <span
        v-for="t in review.themes"
        :key="t"
        class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500"
      >{{ t }}</span>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
      <span v-if="review.responded" class="flex items-center gap-1 text-xs font-medium text-emerald-600">
        <Check class="h-3.5 w-3.5" /> Replied
      </span>
      <template v-else>
        <button
          class="pressable inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-brand-700"
          @click="askAI"
        >
          <MessageCircle class="h-3.5 w-3.5" /> Ask AI to draft a reply
        </button>
        <button
          class="pressable ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50"
          @click="markReplied"
        >
          <Check class="h-3.5 w-3.5" /> Mark replied
        </button>
      </template>
    </div>
  </div>
</template>
