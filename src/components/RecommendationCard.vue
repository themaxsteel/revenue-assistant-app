<script setup>
import { computed, ref } from 'vue'
import { ShieldCheck, ArrowRight, Sparkles, ListPlus, MessageCircle, CalendarDays, Eye } from 'lucide-vue-next'
import Badge from './ui/Badge.vue'
import AppButton from './ui/AppButton.vue'
import Modal from './ui/Modal.vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTasksStore } from '@/stores/tasks'
import { useChatStore } from '@/stores/chat'
import { useAgentStore } from '@/stores/agent'
import { idr } from '@/mock/util'

const props = defineProps({
  rec: { type: Object, required: true },
  showProperty: { type: Boolean, default: false },
})
const portfolio = usePortfolioStore()
const tasks = useTasksStore()
const chat = useChatStore()
const agent = useAgentStore()
const property = computed(() => portfolio.byId(props.rec.propertyId))
const isRate = computed(() => props.rec.type.includes('rate'))

// #5 — before → after preview modal so a novice RA sees exactly what to change.
const preview = ref(false)
function openPreview() {
  agent.recordViewed(props.rec.id)
  preview.value = true
}

function pinToTask() {
  tasks.addFromRecommendation(props.rec)
  preview.value = false
}
function askAI() {
  chat.explainRecommendation(props.rec, property.value?.name)
  preview.value = false
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
      <AppButton variant="secondary" size="sm" title="See the exact before → after change" @click="openPreview">
        <Eye class="h-3.5 w-3.5" /> Preview
      </AppButton>
      <AppButton
        variant="ghost"
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

  <!-- #5 — Before → after preview: the exact change for the RA to make -->
  <Modal :open="preview" title="Preview change" @close="preview = false">
    <div class="flex flex-wrap items-center gap-2">
      <Badge :tone="rec.risk === 'auto' ? 'green' : 'amber'" size="sm">
        {{ rec.risk === 'auto' ? 'Quick win' : 'Needs review' }}
      </Badge>
      <span v-if="property" class="text-xs font-medium text-slate-400">{{ property.name }}</span>
      <span v-if="rec.dates" class="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-500">
        <CalendarDays class="h-3.5 w-3.5 text-slate-400" /> {{ rec.dates }}
      </span>
    </div>
    <h3 class="mt-2 text-sm font-semibold text-slate-900">{{ rec.title }}</h3>

    <!-- Before → after -->
    <div class="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl bg-slate-50 p-3">
      <div class="text-center">
        <p class="text-[11px] font-medium text-slate-400">Before</p>
        <p class="mt-0.5 text-sm font-bold text-slate-700">
          {{ isRate ? idr(rec.currentRate, { compact: true }) : 'Current setup' }}
        </p>
      </div>
      <ArrowRight class="h-4 w-4 text-slate-300" />
      <div class="text-center">
        <p class="text-[11px] font-medium text-slate-400">After</p>
        <p class="mt-0.5 text-sm font-bold text-brand-700">
          {{ isRate ? idr(rec.recommendedRate, { compact: true }) : rec.applyLabel }}
        </p>
        <Badge v-if="isRate" :tone="rec.deltaPct >= 0 ? 'green' : 'red'" size="sm" class="mt-1">
          {{ rec.deltaPct >= 0 ? '+' : '' }}{{ rec.deltaPct }}%
        </Badge>
      </div>
    </div>

    <!-- Impact + confidence -->
    <div class="mt-3 flex items-center justify-between text-sm">
      <span class="text-slate-500">Est. impact</span>
      <span class="font-semibold text-emerald-600">+{{ impactM }}M<span class="text-[11px] font-medium text-slate-400">/wk</span> · {{ rec.confidence }}% confidence</span>
    </div>

    <!-- Why -->
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

    <p class="mt-3 text-xs text-slate-500">
      Make this change in your pricing/channel tool, then add it to your tasks to track the result.
    </p>

    <template #footer>
      <AppButton variant="ghost" size="sm" @click="askAI">
        <MessageCircle class="h-3.5 w-3.5" /> Ask AI
      </AppButton>
      <AppButton variant="primary" size="sm" @click="pinToTask">
        <ListPlus class="h-3.5 w-3.5" /> Add to task
      </AppButton>
    </template>
  </Modal>
</template>
