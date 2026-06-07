<script setup>
import { computed } from 'vue'
import { BarChart3, Bot, CheckSquare, Repeat, Sparkles } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAgentStore } from '@/stores/agent'
import { useTasksStore } from '@/stores/tasks'
import { channelsFor, channelNames } from '@/mock/channels'
import Card from '@/components/ui/Card.vue'
import StatCard from '@/components/ui/StatCard.vue'
import BarTrend from '@/components/charts/BarTrend.vue'
import ChannelMix from '@/components/charts/ChannelMix.vue'
import { idr } from '@/mock/util'

const portfolio = usePortfolioStore()
const agent = useAgentStore()
const tasks = useTasksStore()

// "Your month in review" — what the RA + agent actually got done.
const monthReview = computed(() => {
  const impact = tasks.activities.reduce((s, a) => s + (a.impact || 0), 0)
  return {
    actions: agent.log.length,
    tasksDone: tasks.done.length,
    routines: tasks.routinesKept,
    impact,
    autoShare: agent.log.length ? Math.round((agent.log.filter((a) => a.byAgent).length / agent.log.length) * 100) : 0,
  }
})

// Aggregate channel contribution across the portfolio.
const aggChannels = computed(() => {
  const totals = {}
  portfolio.properties.forEach((p) => {
    channelsFor(p.id).forEach((c) => {
      totals[c.name] = (totals[c.name] || 0) + c.revenue
    })
  })
  const grand = Object.values(totals).reduce((a, b) => a + b, 0)
  return channelNames
    .map((name) => ({ name, share: Math.round((totals[name] / grand) * 100) }))
    .sort((a, b) => b.share - a.share)
})

// Top properties by RevPAR
const topProps = computed(() =>
  [...portfolio.properties].sort((a, b) => b.revpar - a.revpar).slice(0, 8),
)

// 6-month RevPAR trend (synthetic)
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const revparTrend = [62, 68, 71, 66, 74, 81]
const totalRevpar = computed(() => idr(portfolio.totalRevpar, { compact: true }))
</script>

<template>
  <div>
    <h1 class="flex items-center gap-2 text-xl font-bold text-slate-900"><BarChart3 class="h-5 w-5 text-brand-600" /> Analytics</h1>
    <p class="text-sm text-slate-500">Portfolio-wide BI & deep analysis across all properties.</p>

    <!-- Month in review: what you & the agent accomplished -->
    <div class="mt-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-5 shadow-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="flex items-center gap-2 text-sm font-semibold text-slate-900"><Sparkles class="h-4 w-4 text-brand-600" /> Your month in review</h2>
          <p class="text-xs text-slate-500">Everything you and the AI Agent moved this month</p>
        </div>
        <span class="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">{{ monthReview.autoShare }}% handled by AI</span>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-xl bg-white p-3.5 shadow-sm">
          <div class="flex items-center gap-1.5 text-xs font-medium text-slate-500"><Bot class="h-3.5 w-3.5 text-brand-500" /> Actions executed</div>
          <p class="mt-1 text-2xl font-bold text-slate-900">{{ monthReview.actions }}</p>
        </div>
        <div class="rounded-xl bg-white p-3.5 shadow-sm">
          <div class="flex items-center gap-1.5 text-xs font-medium text-slate-500"><CheckSquare class="h-3.5 w-3.5 text-emerald-500" /> Tasks completed</div>
          <p class="mt-1 text-2xl font-bold text-slate-900">{{ monthReview.tasksDone }}</p>
        </div>
        <div class="rounded-xl bg-white p-3.5 shadow-sm">
          <div class="flex items-center gap-1.5 text-xs font-medium text-slate-500"><Repeat class="h-3.5 w-3.5 text-violet-500" /> Routines kept</div>
          <p class="mt-1 text-2xl font-bold text-slate-900">{{ monthReview.routines }}</p>
        </div>
        <div class="rounded-xl bg-white p-3.5 shadow-sm">
          <div class="flex items-center gap-1.5 text-xs font-medium text-slate-500"><Sparkles class="h-3.5 w-3.5 text-amber-500" /> Revenue impact</div>
          <p class="mt-1 text-2xl font-bold text-emerald-600">+{{ idr(monthReview.impact, { compact: true }) }}</p>
        </div>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Avg Occupancy" :value="`${portfolio.avgOccupancy}%`" :delta="6" />
      <StatCard label="Daily RevPAR (portfolio)" :value="totalRevpar" :delta="9" />
      <StatCard label="Avg Health" :value="portfolio.avgHealth" :delta="4" />
      <StatCard label="Direct Booking Share" :value="`${aggChannels[0]?.name === 'Direct' ? aggChannels[0].share : 28}%`" :delta="3" />
    </div>

    <div class="mt-5 grid gap-5 lg:grid-cols-2">
      <Card title="RevPAR trend" subtitle="Portfolio index, last 6 months">
        <BarTrend :labels="months" :values="revparTrend" :format="'%'" />
      </Card>
      <Card title="Channel contribution" subtitle="Share of revenue across all properties">
        <ChannelMix :channels="aggChannels" />
      </Card>
    </div>

    <Card class="mt-5" title="Top properties by RevPAR">
      <div class="space-y-2">
        <div v-for="p in topProps" :key="p.id" class="flex items-center gap-3">
          <RouterLink :to="`/property/${p.id}/overview`" class="w-44 shrink-0 truncate text-sm font-medium text-slate-700 hover:text-brand-700">{{ p.name }}</RouterLink>
          <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out" :style="{ width: `${(p.revpar / topProps[0].revpar) * 100}%` }" />
          </div>
          <span class="w-20 shrink-0 text-right text-sm font-semibold text-slate-800">{{ idr(p.revpar, { compact: true }) }}</span>
        </div>
      </div>
    </Card>
  </div>
</template>
