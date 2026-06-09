<script setup>
import { ref, computed } from 'vue'
import { Bot, ShieldCheck } from 'lucide-vue-next'
import { useAgentStore } from '@/stores/agent'
import { usePortfolioStore } from '@/stores/portfolio'
import RecommendationCard from '@/components/RecommendationCard.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import dayjs from 'dayjs'
import { idr } from '@/mock/util'

const agent = useAgentStore()
const portfolio = usePortfolioStore()
const tab = ref('inbox')
const filter = ref('all') // all | approval | auto

const inbox = computed(() => {
  if (filter.value === 'snoozed') return agent.snoozed
  let list = agent.pending
  if (filter.value === 'approval') list = list.filter((r) => r.risk === 'approval')
  if (filter.value === 'auto') list = list.filter((r) => r.risk === 'auto')
  return list
})
const propName = (id) => portfolio.byId(id)?.name
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-xl font-bold text-slate-900"><Bot class="h-5 w-5 text-brand-600" /> AI Recommendations</h1>
        <p class="text-sm text-slate-500">{{ agent.pending.length }} pending · est. {{ idr(agent.estPipeline, { compact: true }) }}/wk impact — every action needs your approval</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mt-4 flex gap-1 border-b border-slate-200">
      <button
        v-for="t in [['inbox','Recommendations',inbox.length],['log','Activity log',agent.log.length]]"
        :key="t[0]"
        class="pressable relative px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ease-out"
        :class="tab === t[0] ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700'"
        @click="tab = t[0]"
      >
        {{ t[1] }} <span class="ml-1 text-xs text-slate-400">{{ t[2] }}</span>
        <span v-if="tab === t[0]" class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
      </button>
    </div>

    <!-- Inbox -->
    <div v-if="tab === 'inbox'" class="mt-5">
      <div class="mb-3 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 text-xs w-fit">
        <button
          v-for="f in [['all','All'],['approval','Needs review'],['auto','Low risk'],['snoozed','Snoozed']]"
          :key="f[0]"
          class="pressable rounded-lg px-3 py-1.5 font-medium transition-colors duration-150 ease-out"
          :class="filter === f[0] ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'"
          @click="filter = f[0]"
        >
          {{ f[1] }}
          <span v-if="f[0] === 'snoozed' && agent.snoozed.length" class="ml-1 rounded-full bg-slate-200 px-1.5 text-slate-600">{{ agent.snoozed.length }}</span>
        </button>
      </div>
      <div v-if="inbox.length" class="stagger grid gap-3 lg:grid-cols-2">
        <RecommendationCard
          v-for="(rec, i) in inbox"
          :key="rec.id"
          :rec="rec"
          show-property
          :style="{ '--i': i % 6 }"
        />
      </div>
      <div v-else class="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
        <ShieldCheck class="mx-auto h-8 w-8 text-emerald-400" />
        <p class="mt-2 text-sm font-medium text-slate-600">Inbox zero — all recommendations handled.</p>
      </div>
    </div>

    <!-- Activity log -->
    <div v-else class="mt-5">
      <Card title="Audit trail" subtitle="Every action the agent executed or you approved">
        <ol class="relative space-y-4 border-l border-slate-100 pl-5">
          <li v-for="a in agent.log" :key="a.id" class="relative">
            <span class="absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full" :class="a.byAgent ? 'bg-brand-500' : 'bg-emerald-500'" />
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-medium text-slate-800">{{ a.summary }}</p>
              <Badge :tone="a.byAgent ? 'brand' : 'green'" size="sm">{{ a.byAgent ? 'Auto' : 'Approved' }}</Badge>
            </div>
            <p class="mt-0.5 text-xs text-slate-400">
              {{ propName(a.propertyId) }} · {{ dayjs(a.timestamp).format('DD MMM, HH:mm') }}
              <span v-if="a.before !== '—'"> · {{ a.before }} → {{ a.after }}</span>
            </p>
          </li>
        </ol>
      </Card>
    </div>
  </div>
</template>
