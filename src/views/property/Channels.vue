<script setup>
import { ref, computed } from 'vue'
import { AlertTriangle, CheckCircle2 } from 'lucide-vue-next'
import { channelsFor } from '@/mock/channels'
import { channelLogos } from '@/mock/channelLogos'
import { useUiStore } from '@/stores/ui'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import Toggle from '@/components/ui/Toggle.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import ChannelMix from '@/components/charts/ChannelMix.vue'
import { idr } from '@/mock/util'

const props = defineProps({ property: Object })
const ui = useUiStore()
const channels = ref(channelsFor(props.property.id))

function toggleOpen(c) {
  c.isOpen = !c.isOpen
  ui.toast(`${c.name} ${c.isOpen ? 'opened' : 'closed'} for ${props.property.name}`, c.isOpen ? 'success' : 'neutral')
}
function syncParity(c) {
  c.parityStatus = 'ok'
  ui.toast(`Parity re-synced on ${c.name}`)
}
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-[1fr_320px]">
    <Card title="Channel performance" subtitle="Bookings, revenue & parity by OTA">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
              <th class="pb-2">Channel</th>
              <th class="pb-2 text-right">Share</th>
              <th class="pb-2 text-right">Bookings</th>
              <th class="pb-2 text-right">Revenue</th>
              <th class="pb-2 text-center">Parity</th>
              <th class="pb-2 text-center">Open</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="c in channels" :key="c.name">
              <td class="py-2.5">
                <div class="flex items-center gap-2.5">
                  <img
                    v-if="channelLogos[c.name]"
                    :src="channelLogos[c.name]"
                    :alt="c.name"
                    class="h-6 w-6 shrink-0 rounded-md border border-slate-100 bg-white object-contain p-0.5"
                  />
                  <span v-else class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white">
                    <AppIcon name="logo" :size="13" />
                  </span>
                  <span class="font-medium text-slate-700">{{ c.name }}</span>
                  <span v-if="c.commission" class="text-[11px] text-slate-400">({{ c.commission }}%)</span>
                </div>
              </td>
              <td class="py-2.5 text-right text-slate-600">{{ c.share }}%</td>
              <td class="py-2.5 text-right text-slate-600">{{ c.bookings }}</td>
              <td class="py-2.5 text-right font-medium text-slate-700">{{ idr(c.revenue, { compact: true }) }}</td>
              <td class="py-2.5 text-center">
                <button v-if="c.parityStatus === 'breach'" class="pressable inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600" @click="syncParity(c)">
                  <AlertTriangle class="h-3 w-3" /> Fix
                </button>
                <CheckCircle2 v-else class="mx-auto h-4 w-4 text-emerald-500" />
              </td>
              <td class="py-2.5">
                <div class="flex justify-center"><Toggle :model-value="c.isOpen" @update:model-value="toggleOpen(c)" /></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Card title="Channel mix" subtitle="Revenue share">
      <ChannelMix :channels="channels" />
    </Card>
  </div>
</template>
