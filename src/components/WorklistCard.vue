<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { AlertOctagon, Eye, Info, ArrowRight, Check, X, ListPlus } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'

const props = defineProps({ item: { type: Object, required: true } })
const emit = defineEmits(['approve', 'reject', 'resolve', 'dismiss', 'pin'])
const router = useRouter()
const portfolio = usePortfolioStore()
const property = computed(() => portfolio.byId(props.item.propertyId))

const sev = {
  urgent: { ring: 'border-t-rose-400', icon: AlertOctagon, tone: 'text-rose-500', chip: 'bg-rose-50 text-rose-600' },
  watch: { ring: 'border-t-amber-400', icon: Eye, tone: 'text-amber-500', chip: 'bg-amber-50 text-amber-600' },
  fyi: { ring: 'border-t-slate-200', icon: Info, tone: 'text-slate-400', chip: 'bg-slate-100 text-slate-500' },
}
const s = computed(() => sev[props.item.severity])

function go() {
  const t = props.item.target
  router.push({ path: `/property/${props.item.propertyId}/${t.tab}`, query: t.focus ? { focus: t.focus } : {} })
}
</script>

<template>
  <div
    class="group flex h-full flex-col rounded-xl border border-slate-200 border-t-4 bg-white p-3.5 shadow-card transition-colors duration-150 ease-out"
    :class="s.ring"
  >
    <!-- Header: severity icon + property -->
    <div class="flex items-center gap-2">
      <component :is="s.icon" class="h-4 w-4 shrink-0" :class="s.tone" />
      <p class="truncate text-xs font-medium text-slate-500">{{ property?.name }}</p>
    </div>

    <!-- Body (clickable → property) -->
    <button class="pressable mt-2 flex-1 text-left" @click="go">
      <p class="line-clamp-2 text-sm font-semibold text-slate-900 transition-colors duration-150 group-hover:text-brand-700">
        {{ item.title }}
      </p>
      <p class="mt-1 line-clamp-2 text-xs text-slate-500">{{ item.reason }}</p>
      <span class="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-600 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        Open <ArrowRight class="h-3 w-3" />
      </span>
    </button>

    <!-- Actions: full-width row, with text -->
    <div class="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3">
      <template v-if="item.category === 'decision'">
        <button
          class="pressable inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
          @click.stop="emit('approve', item.relatedId)"
        >
          <Check class="h-3.5 w-3.5" /> Approve
        </button>
        <button
          class="pressable inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-150 hover:bg-rose-50 hover:text-rose-600"
          @click.stop="emit('reject', item.relatedId)"
        >
          <X class="h-3.5 w-3.5" /> Reject
        </button>
        <button
          class="pressable inline-flex items-center justify-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2 py-1.5 text-xs font-medium text-brand-700 transition-colors duration-150 hover:bg-brand-100"
          title="Add as a manual follow-up task"
          @click.stop="emit('pin', item)"
        >
          <ListPlus class="h-3.5 w-3.5" /> Task
        </button>
      </template>

      <template v-else-if="item.category === 'alert'">
        <button
          class="pressable inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
          @click.stop="emit('resolve', item.relatedId)"
        >
          <Check class="h-3.5 w-3.5" /> Resolve
        </button>
        <button
          class="pressable inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2 py-1.5 text-xs font-medium text-brand-700 transition-colors duration-150 hover:bg-brand-100"
          title="Add as a manual follow-up task"
          @click.stop="emit('pin', item)"
        >
          <ListPlus class="h-3.5 w-3.5" /> Add to task
        </button>
      </template>

      <template v-else>
        <button
          class="pressable inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors duration-150 hover:bg-slate-100"
          @click.stop="emit('dismiss', item.relatedId)"
        >
          <X class="h-3.5 w-3.5" /> Dismiss
        </button>
      </template>
    </div>
  </div>
</template>
