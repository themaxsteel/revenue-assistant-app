<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import { Share2, CalendarClock, Heart, TrendingUp, Bot, Check } from 'lucide-vue-next'
import {
  platformStats, socialSummary, scheduledPosts, topPosts, propertySocial,
} from '@/mock/social'
import { useUiStore } from '@/stores/ui'
import Card from '@/components/ui/Card.vue'
import StatCard from '@/components/ui/StatCard.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'

const ui = useUiStore()

function fmtK(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`
}
const maxReach = computed(() => Math.max(...platformStats.map((p) => p.reach)))

function approve(post) {
  post.status = 'scheduled'
  ui.toast(`Post approved & scheduled for ${post.propertyName}`)
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-xl font-bold text-slate-900"><Share2 class="h-5 w-5 text-brand-600" /> Social Media</h1>
        <p class="text-sm text-slate-500">Monitor the automation engine across all properties — this month.</p>
      </div>
      <Badge tone="brand"><Bot class="h-3.5 w-3.5" /> Automation active</Badge>
    </div>

    <!-- Summary -->
    <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Auto-published posts" :value="socialSummary.autoPosts" :delta="12" hint="this month" />
      <StatCard label="Total reach" :value="fmtK(socialSummary.reach)" :delta="9" />
      <StatCard label="Avg engagement" :value="`${socialSummary.avgEngagement}%`" :delta="3" />
      <StatCard label="Bookings attributed" :value="socialSummary.bookingsAttributed" :delta="7" hint="social → direct" />
    </div>

    <div class="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
      <div class="space-y-5">
        <!-- Platform performance -->
        <Card title="Performance by platform">
          <div class="space-y-4">
            <div v-for="p in platformStats" :key="p.key">
              <div class="mb-1 flex items-center justify-between text-sm">
                <span class="flex items-center gap-2 font-medium text-slate-700">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ background: p.color }" />{{ p.name }}
                </span>
                <span class="text-slate-500">{{ fmtK(p.reach) }} reach · {{ p.engagementRate }}% eng.</span>
              </div>
              <ProgressBar :value="(p.reach / maxReach) * 100" tone="brand" />
              <div class="mt-1 flex gap-4 text-xs text-slate-400">
                <span>{{ p.autoPosts }} auto-posts</span>
                <span>{{ fmtK(p.followers) }} followers</span>
                <span :class="p.followerGrowthPct >= 0 ? 'text-emerald-600' : 'text-rose-500'">
                  {{ p.followerGrowthPct >= 0 ? '+' : '' }}{{ p.followerGrowthPct }}% growth
                </span>
              </div>
            </div>
          </div>
        </Card>

        <!-- Per-property breakdown -->
        <Card title="By property" subtitle="Automation reach & engagement per property">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
                  <th class="pb-2">Property</th>
                  <th class="pb-2 text-right">Posts</th>
                  <th class="pb-2 text-right">Reach</th>
                  <th class="pb-2 text-right">Engagement</th>
                  <th class="pb-2 text-right">Growth</th>
                  <th class="pb-2 text-center">Auto</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="s in propertySocial" :key="s.id">
                  <td class="py-2.5">
                    <RouterLink :to="`/property/${s.id}/overview`" class="font-medium text-slate-700 hover:text-brand-700">{{ s.name }}</RouterLink>
                  </td>
                  <td class="py-2.5 text-right text-slate-600">{{ s.autoPosts }}</td>
                  <td class="py-2.5 text-right text-slate-600">{{ fmtK(s.reach) }}</td>
                  <td class="py-2.5 text-right text-slate-600">{{ s.engagementRate }}%</td>
                  <td class="py-2.5 text-right font-medium" :class="s.followerGrowthPct >= 0 ? 'text-emerald-600' : 'text-rose-500'">
                    {{ s.followerGrowthPct >= 0 ? '+' : '' }}{{ s.followerGrowthPct }}%
                  </td>
                  <td class="py-2.5 text-center">
                    <Badge :tone="s.automationOn ? 'green' : 'slate'" size="sm">{{ s.automationOn ? 'On' : 'Off' }}</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div class="space-y-5">
        <!-- Scheduled queue -->
        <Card title="Automation queue" subtitle="Upcoming auto-scheduled posts">
          <div class="space-y-2.5">
            <div v-for="post in scheduledPosts" :key="post.id" class="rounded-xl border border-slate-200 p-3">
              <div class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full" :style="{ background: post.platformColor }" />
                <span class="text-xs font-semibold text-slate-700">{{ post.platform }}</span>
                <Badge tone="slate" size="sm">{{ post.type }}</Badge>
                <Badge v-if="post.status === 'needs_approval'" tone="amber" size="sm">Needs approval</Badge>
                <span class="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
                  <CalendarClock class="h-3 w-3" />{{ dayjs(post.scheduledAt).format('DD MMM, HH:mm') }}
                </span>
              </div>
              <p class="mt-1.5 truncate text-sm text-slate-600">{{ post.caption }}</p>
              <p class="text-[11px] text-slate-400">{{ post.propertyName }}</p>
              <AppButton v-if="post.status === 'needs_approval'" variant="success" size="sm" class="mt-2" @click="approve(post)">
                <Check class="h-3.5 w-3.5" /> Approve
              </AppButton>
            </div>
          </div>
        </Card>

        <!-- Top posts -->
        <Card title="Top performing posts">
          <ul class="space-y-3">
            <li v-for="t in topPosts" :key="t.id" class="flex items-center gap-3">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" :style="{ background: t.platformColor }">
                <Heart class="h-4 w-4" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-700">{{ t.propertyName }}</p>
                <p class="text-[11px] text-slate-400">{{ t.platform }} · {{ t.type }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-emerald-600">{{ t.engagement }}%</p>
                <p class="text-[11px] text-slate-400">{{ fmtK(t.reach) }} reach</p>
              </div>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  </div>
</template>
