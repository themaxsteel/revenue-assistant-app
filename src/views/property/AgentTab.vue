<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { ShieldCheck } from 'lucide-vue-next'
import { useAgentStore } from '@/stores/agent'
import RecommendationCard from '@/components/RecommendationCard.vue'
import Card from '@/components/ui/Card.vue'

const props = defineProps({ property: Object })
const route = useRoute()
const agent = useAgentStore()
const recs = computed(() => agent.forProperty(props.property.id))
const pending = computed(() => recs.value.filter((r) => r.status === 'pending'))
const log = computed(() => agent.logForProperty(props.property.id))

// Deep-link focus: scroll to & highlight the recommendation from a worklist click.
const focused = ref(null)
function applyFocus() {
  const id = route.query.focus
  if (!id) return
  focused.value = id
  nextTick(() => {
    const el = document.getElementById(`rec-anchor-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
  setTimeout(() => { focused.value = null }, 2600)
}
watch(() => route.query.focus, applyFocus, { immediate: true })
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-[1fr_300px]">
    <div>
      <div v-if="pending.length" class="stagger grid gap-3 sm:grid-cols-2">
        <div
          v-for="(rec, i) in pending"
          :id="`rec-anchor-${rec.id}`"
          :key="rec.id"
          class="rounded-2xl transition-all duration-300"
          :class="focused === rec.id ? 'ring-2 ring-brand-400 ring-offset-2' : ''"
          :style="{ '--i': i }"
        >
          <RecommendationCard :rec="rec" />
        </div>
      </div>
      <div v-else class="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
        <ShieldCheck class="mx-auto h-8 w-8 text-emerald-400" />
        <p class="mt-2 text-sm font-medium text-slate-600">No pending recommendations for this property.</p>
      </div>
    </div>

    <div class="space-y-4">
      <Card title="How this works" padding="p-5">
        <p class="text-xs leading-relaxed text-slate-500">
          The Revenue Assistant reviews this property and prepares recommendations with the reasoning behind each one.
          <strong class="text-slate-600">Nothing is applied automatically</strong> — you approve, reject, or snooze every action.
        </p>
      </Card>

      <Card title="Action history" padding="p-5">
        <ol v-if="log.length" class="space-y-3">
          <li v-for="a in log" :key="a.id" class="text-sm">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full" :class="a.byAgent ? 'bg-brand-500' : 'bg-emerald-500'" />
              <p class="font-medium text-slate-700">{{ a.summary }}</p>
            </div>
            <p class="ml-4 text-xs text-slate-400">{{ dayjs(a.timestamp).format('DD MMM, HH:mm') }}</p>
          </li>
        </ol>
        <p v-else class="py-4 text-center text-sm text-slate-400">No actions yet.</p>
      </Card>
    </div>
  </div>
</template>
