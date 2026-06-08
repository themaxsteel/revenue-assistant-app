<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import {
  Instagram, Facebook, Music2, Heart, MessageCircle, Play, CalendarClock,
  Check, Bot, TrendingUp, Eye,
} from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import { socialFor, PLATFORMS } from '@/mock/socialPosts'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import Modal from '@/components/ui/Modal.vue'
import SocialStatCard from '@/components/SocialStatCard.vue'

const props = defineProps({ property: Object })
const ui = useUiStore()

const PLATFORM_ICON = { instagram: Instagram, facebook: Facebook, tiktok: Music2 }
const GRADIENTS = [
  'from-rose-200 to-orange-200',
  'from-sky-200 to-brand-300',
  'from-emerald-200 to-teal-200',
  'from-violet-200 to-fuchsia-200',
  'from-amber-200 to-rose-200',
]

// Deep clone so approvals mutate locally without touching the shared mock.
const route = useRoute()
const data = reactive(JSON.parse(JSON.stringify(socialFor(props.property.id))))
// Allow deep-linking to a platform, e.g. /property/:id/social?platform=facebook
const selected = ref(PLATFORMS[route.query.platform] ? route.query.platform : 'instagram')
watch(
  () => route.query.platform,
  (p) => {
    if (PLATFORMS[p]) selected.value = p
  },
)
const account = computed(() => data[selected.value])
const published = computed(() => account.value.posts.filter((p) => p.status === 'published'))
const upcoming = computed(() => account.value.posts.filter((p) => p.status !== 'published'))

const failed = reactive(new Set())
function onImgError(id) {
  failed.add(id)
}
function gradientFor(id) {
  let h = 0
  for (const c of id) h = (h + c.charCodeAt(0)) % GRADIENTS.length
  return GRADIENTS[h]
}

const detail = ref(null)
function openPost(p) {
  detail.value = p
}
function approve(post) {
  post.status = 'scheduled'
  ui.toast('Post approved & scheduled')
}

function fmtK(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`
}
const initials = computed(() =>
  props.property.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase(),
)
</script>

<template>
  <div class="space-y-5">
    <!-- Platform sub-tabs -->
    <div class="flex gap-1.5">
      <button
        v-for="(p, key) in PLATFORMS"
        :key="key"
        class="pressable inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out"
        :class="selected === key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'"
        @click="selected = key"
      >
        <component :is="PLATFORM_ICON[key]" class="h-4 w-4" />
        {{ p.name }}
      </button>
    </div>

    <!-- Profile identity -->
    <Card padding="p-5">
      <div class="flex flex-wrap items-center gap-4">
        <div
          class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm"
          :style="{ background: PLATFORMS[selected].color }"
        >
          {{ initials }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-base font-bold text-slate-900">{{ property.name }}</h2>
            <Badge :tone="account.automationOn ? 'green' : 'slate'" size="sm">
              <Bot class="h-3 w-3" />{{ account.automationOn ? 'Automation on' : 'Automation off' }}
            </Badge>
          </div>
          <p class="text-sm text-slate-400">{{ account.handle }} · {{ PLATFORMS[selected].name }}</p>
        </div>
      </div>
    </Card>

    <!-- Stat cards with trend -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SocialStatCard
        label="Posts"
        :value="account.stats.posts.value"
        :delta-pct="account.stats.posts.deltaPct"
        :series="account.stats.posts.series"
      />
      <SocialStatCard
        label="Followers"
        :value="fmtK(account.stats.followers.value)"
        :delta-pct="account.stats.followers.deltaPct"
        :series="account.stats.followers.series"
      />
      <SocialStatCard
        label="Engagement"
        :value="`${account.stats.engagement.value}%`"
        :delta-pct="account.stats.engagement.deltaPct"
        :series="account.stats.engagement.series"
      />
      <SocialStatCard
        label="Reach (30d)"
        :value="fmtK(account.stats.reach.value)"
        :delta-pct="account.stats.reach.deltaPct"
        :series="account.stats.reach.series"
      />
    </div>

    <!-- Upcoming / needs approval -->
    <Card v-if="upcoming.length" title="Automation queue" subtitle="Scheduled & awaiting approval">
      <div class="flex gap-3 overflow-x-auto pb-1">
        <div v-for="post in upcoming" :key="post.id" class="w-56 shrink-0 rounded-xl border border-slate-200 p-2.5">
          <div class="relative mb-2 h-28 overflow-hidden rounded-lg bg-gradient-to-br" :class="gradientFor(post.id)">
            <img
              v-if="!failed.has(post.id)"
              :src="post.image"
              :alt="post.caption"
              loading="lazy"
              class="h-full w-full object-cover"
              @error="onImgError(post.id)"
            />
            <span class="absolute left-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">{{ post.type }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
            <CalendarClock class="h-3 w-3" />{{ dayjs(post.postedAt).format('DD MMM, HH:mm') }}
          </div>
          <p class="mt-1 line-clamp-2 text-xs text-slate-600">{{ post.caption }}</p>
          <Badge v-if="post.status === 'needs_approval'" tone="amber" size="sm" class="mt-2">Needs approval</Badge>
          <Badge v-else tone="slate" size="sm" class="mt-2">Scheduled</Badge>
          <AppButton v-if="post.status === 'needs_approval'" variant="success" size="sm" class="ml-2 mt-2" @click="approve(post)">
            <Check class="h-3.5 w-3.5" /> Approve
          </AppButton>
        </div>
      </div>
    </Card>

    <!-- Published posts — small cards -->
    <Card title="Recent posts" :subtitle="`${published.length} published`">
      <div v-if="published.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <button
          v-for="post in published"
          :key="post.id"
          class="group flex flex-col overflow-hidden rounded-xl border border-slate-200 text-left transition-colors duration-150 hover:border-brand-200"
          @click="openPost(post)"
        >
          <div class="relative h-28 w-full bg-gradient-to-br" :class="gradientFor(post.id)">
            <img
              v-if="!failed.has(post.id)"
              :src="post.image"
              :alt="post.caption"
              loading="lazy"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              @error="onImgError(post.id)"
            />
            <span class="absolute left-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">{{ post.type }}</span>
            <span v-if="post.type === 'Reel' || post.type === 'Video'" class="absolute right-1.5 top-1.5 text-white drop-shadow">
              <Play class="h-4 w-4 fill-white" />
            </span>
          </div>
          <div class="flex flex-1 flex-col p-2.5">
            <p class="line-clamp-2 text-xs text-slate-600">{{ post.caption }}</p>
            <div class="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-500">
              <span class="flex items-center gap-1"><Heart class="h-3 w-3 text-rose-400" />{{ fmtK(post.likes) }}</span>
              <span class="flex items-center gap-1"><MessageCircle class="h-3 w-3 text-slate-400" />{{ fmtK(post.comments) }}</span>
              <span class="flex items-center gap-1"><Eye class="h-3 w-3 text-slate-400" />{{ fmtK(post.reach) }}</span>
              <span class="flex items-center gap-1 font-medium text-emerald-600"><TrendingUp class="h-3 w-3" />{{ post.engagement }}%</span>
            </div>
          </div>
        </button>
      </div>
      <p v-else class="py-8 text-center text-sm text-slate-400">No published posts yet on this platform.</p>
    </Card>

    <!-- Post detail modal -->
    <Modal :open="!!detail" title="Post" size="lg" @close="detail = null">
      <div v-if="detail" class="grid gap-4 sm:grid-cols-[1fr_220px]">
        <div class="overflow-hidden rounded-xl bg-gradient-to-br" :class="gradientFor(detail.id)">
          <img
            v-if="!failed.has(detail.id)"
            :src="detail.image"
            :alt="detail.caption"
            class="h-full max-h-[360px] w-full object-cover"
            @error="onImgError(detail.id)"
          />
          <div v-else class="flex h-64 items-center justify-center text-sm text-slate-500">Image unavailable</div>
        </div>
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <component :is="PLATFORM_ICON[detail.platform]" class="h-4 w-4 text-slate-500" />
            <Badge tone="slate" size="sm">{{ detail.type }}</Badge>
            <Badge v-if="detail.status !== 'published'" :tone="detail.status === 'needs_approval' ? 'amber' : 'slate'" size="sm">
              {{ detail.status === 'needs_approval' ? 'Needs approval' : 'Scheduled' }}
            </Badge>
          </div>
          <p class="text-sm text-slate-700">{{ detail.caption }}</p>
          <p class="text-xs text-slate-400">{{ dayjs(detail.postedAt).format('DD MMM YYYY, HH:mm') }}</p>
          <div class="grid grid-cols-2 gap-2 pt-1">
            <div class="rounded-xl bg-slate-50 p-2.5">
              <p class="flex items-center gap-1 text-[11px] text-slate-400"><Heart class="h-3 w-3" /> Likes</p>
              <p class="text-sm font-bold text-slate-900">{{ fmtK(detail.likes) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 p-2.5">
              <p class="flex items-center gap-1 text-[11px] text-slate-400"><MessageCircle class="h-3 w-3" /> Comments</p>
              <p class="text-sm font-bold text-slate-900">{{ fmtK(detail.comments) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 p-2.5">
              <p class="flex items-center gap-1 text-[11px] text-slate-400"><Eye class="h-3 w-3" /> Reach</p>
              <p class="text-sm font-bold text-slate-900">{{ fmtK(detail.reach) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 p-2.5">
              <p class="flex items-center gap-1 text-[11px] text-slate-400"><TrendingUp class="h-3 w-3" /> Engagement</p>
              <p class="text-sm font-bold text-emerald-600">{{ detail.engagement }}%</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>
