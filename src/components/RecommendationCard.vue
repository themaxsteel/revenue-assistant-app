<script setup>
import { computed } from 'vue'
import { ShieldCheck, ArrowRight, Sparkles, ListPlus, MessageCircle, CalendarDays } from 'lucide-vue-next'
import Badge from './ui/Badge.vue'
import AppButton from './ui/AppButton.vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTasksStore } from '@/stores/tasks'
import { useChatStore } from '@/stores/chat'
import { idr } from '@/mock/util'

const props = defineProps({
  rec: { type: Object, required: true },
  showProperty: { type: Boolean, default: false },
})
const portfolio = usePortfolioStore()
const tasks = useTasksStore()
const chat = useChatStore()
const property = computed(() => portfolio.byId(props.rec.propertyId))

function pinToTask() {
  tasks.addFromRecommendation(props.rec, property.value?.name)
}
function askAI() {
  chat.explainRecommendation(props.rec, property.value?.name)
}

const statusMap = {
  pending: null,
  approved: { tone: 'green', label: 'Approved' },
  rejected: { tone: 'slate', label: 'Rejected' },
  snoozed: { tone: 'amber', label: 'Snoozed' },
  tasked: { tone: 'violet', label: 'Added to task' },
}
const done = computed(() => props.rec.status !== 'pending')
const impactM = computed(() => (props.rec.estImpact / 1_000_000).toFixed(1))
</script>

<template>
  <div
    class="flex h-full flex-col rounded-2xl border bg-white p-4 shadow-card transition-opacity duration-300"
    :class="done ? 'opacity-70 border-slate-100' : 'border-slate-200'"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <Badge :tone="rec.risk === 'auto' ? 'green' : 'amber'" size="sm">
            <ShieldCheck class="h-3 w-3" />
            {{ rec.risk === 'auto' ? 'Quick win' : 'Needs review' }}
          </Badge>
          <Badge v-if="statusMap[rec.status]" :tone="statusMap[rec.status].tone" size="sm">
            {{ statusMap[rec.status].label }}
          </Badge>
          <span v-if="showProperty && property" class="truncate text-xs font-medium text-slate-400">
            {{ property.name }}
          </span>
        </div>
        <h3 class="mt-2 text-sm font-semibold text-slate-900">{{ rec.title }}</h3>
        <p v-if="rec.dates" class="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
          <CalendarDays class="h-3.5 w-3.5 text-slate-400" /> {{ rec.dates }}
        </p>
      </div>
      <div class="shrink-0 text-right">
        <p class="text-[11px] font-medium text-slate-400">Est. impact</p>
        <p class="text-sm font-bold text-emerald-600">+{{ impactM }}M<span class="text-[11px] font-medium text-slate-400">/wk</span></p>
      </div>
    </div>

    <!-- Why: the explainability the RA needs -->
    <div class="mt-3 rounded-xl bg-slate-50 p-3">
      <p class="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <Sparkles class="h-3 w-3" /> Why
      </p>
      <ul class="space-y-1">
        <li v-for="(d, i) in rec.drivers" :key="i" class="flex items-start gap-1.5 text-xs text-slate-600">
          <span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />{{ d }}
        </li>
      </ul>
    </div>

    <div v-if="rec.type.includes('rate')" class="mt-3 flex items-center gap-2 text-sm">
      <span class="text-slate-400 line-through">{{ idr(rec.currentRate, { compact: true }) }}</span>
      <ArrowRight class="h-3.5 w-3.5 text-slate-300" />
      <span class="font-semibold text-slate-900">{{ idr(rec.recommendedRate, { compact: true }) }}</span>
      <Badge :tone="rec.deltaPct >= 0 ? 'green' : 'red'" size="sm">
        {{ rec.deltaPct >= 0 ? '+' : '' }}{{ rec.deltaPct }}%
      </Badge>
      <span class="ml-auto text-xs text-slate-400">{{ rec.confidence }}% confidence</span>
    </div>

    <div v-if="!done" class="mt-auto flex items-center gap-2 pt-4">
      <AppButton variant="primary" size="sm" title="Add as a manual follow-up task" @click="pinToTask">
        <ListPlus class="h-3.5 w-3.5" /> Add to task
      </AppButton>
      <AppButton
        variant="secondary"
        size="sm"
        title="Ask the AI to explain this recommendation"
        @click="askAI"
      >
        <MessageCircle class="h-3.5 w-3.5" /> Ask AI
      </AppButton>
    </div>
    <p v-else class="mt-auto pt-3 text-xs text-slate-400">
      {{ rec.status === 'tasked' ? 'Added to your tasks — handle it from Tasks & Activities.' : rec.applyLabel }}
    </p>
  </div>
</template>
