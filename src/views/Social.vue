<script setup>
import { computed, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import {
  Share2, CalendarClock, Heart, MessageCircle, Eye, TrendingUp, Bot, Check, Play,
  Instagram, Facebook, Music2,
} from 'lucide-vue-next'
import {
  PLATFORMS, platformSummary, socialSummary, propertySocialRows, topPosts, socialQueue,
} from '@/mock/socialPosts'
import { useUiStore } from '@/stores/ui'
import Card from '@/components/ui/Card.vue'
import StatCard from '@/components/ui/StatCard.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'

const ui = useUiStore()

const PLATFORM_ICON = { instagram: Instagram, facebook: Facebook, tiktok: Music2 }
const GRADIENTS = [
  'from-rose-200 to-orange-200',
  'from-sky-200 to-brand-300',
  'from-emerald-200 to-teal-200',
  'from-violet-200 to-fuchsia-200',
  'from-amber-200 to-rose-200',
]
const failed = reactive(new Set())
function onImgError(id) {
  failed.add(id)
}
function gradientFor(id) {
  let h = 0
  for (const c of id) h = (h + c.charCodeAt(0)) % GRADIENTS.length
  return GRADIENTS[h]
}

function fmtK(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`
}
function socialLink(propertyId, platform) {
  return `/property/${propertyId}/social?platform=${platform}`
}

// Sort by engagement, show the top 8 by default with a reveal-the-rest toggle.
const sortedRows = [...propertySocialRows].sort((a, b) => b.engagementRate - a.engagementRate)
const showAll = ref(false)
const visibleRows = computed(() => (showAll.value ? sortedRows : sortedRows.slice(0, 8)))
const top = topPosts(6)
const queue = reactive(socialQueue(7))
const maxReach = computed(() => Math.max(...platformSummary.map((p) => p.reach)))

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
            <div v-for="p in platformSummary" :key="p.key">
              <div class="mb-1 flex items-center justify-between text-sm">
                <span class="flex items-center gap-2 font-medium text-slate-700">
                  <component :is="PLATFORM_ICON[p.key]" class="h-4 w-4" :style="{ color: p.color }" />{{ p.name }}
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
        <Card title="By property" subtitle="Sorted by engagement">
          <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <RouterLink
              v-for="s in visibleRows"
              :key="s.id"
              :to="socialLink(s.id, s.topPlatform)"
              class="group block rounded-xl border border-slate-200 p-3 transition-colors duration-150 hover:border-brand-200 hover:bg-brand-50/40"
            >
              <div class="flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="s.automationOn ? 'bg-emerald-500' : 'bg-slate-300'" />
                <p class="truncate text-sm font-semibold text-slate-800 group-hover:text-brand-700">{{ s.name }}</p>
              </div>
              <div class="mt-2.5 flex items-center justify-between gap-1 text-xs">
                <div>
                  <p class="text-[10px] uppercase tracking-wide text-slate-400">Eng.</p>
                  <p class="font-semibold text-slate-700">{{ s.engagementRate }}%</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wide text-slate-400">Reach</p>
                  <p class="font-semibold text-slate-700">{{ fmtK(s.reach) }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wide text-slate-400">Growth</p>
                  <p class="font-semibold" :class="s.followerGrowthPct >= 0 ? 'text-emerald-600' : 'text-rose-500'">
                    {{ s.followerGrowthPct >= 0 ? '+' : '' }}{{ s.followerGrowthPct }}%
                  </p>
                </div>
              </div>
            </RouterLink>
          </div>
          <button
            v-if="sortedRows.length > 8"
            class="pressable mt-3 w-full rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
            @click="showAll = !showAll"
          >
            {{ showAll ? 'Show less' : `Show all ${sortedRows.length} properties` }}
          </button>
        </Card>

        <!-- Top posts -->
        <Card title="Top performing posts" subtitle="Best engagement across the portfolio">
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <RouterLink
              v-for="t in top"
              :key="t.id"
              :to="socialLink(t.propertyId, t.platform)"
              class="group flex flex-col overflow-hidden rounded-xl border border-slate-200 transition-colors duration-150 hover:border-brand-200"
            >
              <div class="relative h-24 w-full bg-gradient-to-br" :class="gradientFor(t.id)">
                <img
                  v-if="!failed.has(t.id)"
                  :src="t.image"
                  :alt="t.caption"
                  loading="lazy"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  @error="onImgError(t.id)"
                />
                <span class="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  <component :is="PLATFORM_ICON[t.platform]" class="h-2.5 w-2.5" />{{ t.type }}
                </span>
                <span v-if="t.type === 'Reel' || t.type === 'Video'" class="absolute right-1.5 top-1.5 text-white drop-shadow"><Play class="h-3.5 w-3.5 fill-white" /></span>
              </div>
              <div class="p-2.5">
                <p class="truncate text-xs font-medium text-slate-700">{{ t.propertyName }}</p>
                <div class="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                  <span class="flex items-center gap-1 font-semibold text-emerald-600"><TrendingUp class="h-3 w-3" />{{ t.engagement }}%</span>
                  <span class="flex items-center gap-1"><Heart class="h-3 w-3 text-rose-400" />{{ fmtK(t.likes) }}</span>
                  <span class="flex items-center gap-1"><Eye class="h-3 w-3 text-slate-400" />{{ fmtK(t.reach) }}</span>
                </div>
              </div>
            </RouterLink>
          </div>
        </Card>
      </div>

      <div class="space-y-5">
        <!-- Scheduled queue -->
        <Card title="Automation queue" subtitle="Upcoming auto-scheduled posts">
          <div class="space-y-2.5">
            <div v-for="post in queue" :key="post.id" class="rounded-xl border border-slate-200 p-2.5">
              <div class="flex gap-2.5">
                <RouterLink :to="socialLink(post.propertyId, post.platform)" class="relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br" :class="gradientFor(post.id)">
                  <img
                    v-if="!failed.has(post.id)"
                    :src="post.image"
                    :alt="post.caption"
                    loading="lazy"
                    class="h-full w-full object-cover"
                    @error="onImgError(post.id)"
                  />
                </RouterLink>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="h-2 w-2 rounded-full" :style="{ background: PLATFORMS[post.platform].color }" />
                    <span class="text-xs font-semibold text-slate-700">{{ PLATFORMS[post.platform].name }}</span>
                    <Badge tone="slate" size="sm">{{ post.type }}</Badge>
                    <Badge v-if="post.status === 'needs_approval'" tone="amber" size="sm">Approval</Badge>
                  </div>
                  <p class="mt-1 line-clamp-2 text-xs text-slate-600">{{ post.caption }}</p>
                  <p class="text-[11px] text-slate-400">{{ post.propertyName }} · {{ dayjs(post.postedAt).format('DD MMM, HH:mm') }}</p>
                </div>
              </div>
              <AppButton v-if="post.status === 'needs_approval'" variant="success" size="sm" class="mt-2" @click="approve(post)">
                <Check class="h-3.5 w-3.5" /> Approve
              </AppButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
