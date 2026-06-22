<script setup>
// New bookings: doughnut (left) + OTA list with % pills (right).
// Segment & dot colours come from each channel's brand colour. Hovering a
// segment or row highlights both and dims the rest.
import { computed, ref } from 'vue'
import { channelBrandColors } from '@/mock/channelLogos'
import OtaLogo from '@/components/OtaLogo.vue'

const props = defineProps({ items: { type: Array, default: () => [] } })

const SIZE = 120
const STROKE = 18
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R
const GAP = 8 // circumference gap between segments

const total = computed(() => props.items.reduce((a, b) => a + b.value, 0) || 1)
const segments = computed(() => {
  let off = 0
  return props.items.map((it, i) => {
    const frac = it.value / total.value
    const len = frac * C
    const seg = {
      ...it,
      i,
      color: channelBrandColors[it.label] || '#94a3b8',
      dash: `${Math.max(2, len - GAP)} ${C}`,
      offset: -off,
      pct: Math.round(frac * 100),
    }
    off += len
    return seg
  })
})
const hovered = ref(null)
</script>

<template>
  <div class="flex items-center gap-5">
    <!-- Doughnut -->
    <div class="relative shrink-0" :style="{ width: SIZE + 'px', height: SIZE + 'px' }">
      <svg :width="SIZE" :height="SIZE" :viewBox="`0 0 ${SIZE} ${SIZE}`">
        <g :transform="`rotate(-90 ${SIZE / 2} ${SIZE / 2})`">
          <circle
            v-for="seg in segments"
            :key="seg.i"
            :cx="SIZE / 2"
            :cy="SIZE / 2"
            :r="R"
            fill="none"
            :stroke="seg.color"
            :stroke-width="STROKE"
            stroke-linecap="round"
            :stroke-dasharray="seg.dash"
            :stroke-dashoffset="seg.offset"
            class="cursor-pointer transition-opacity duration-150 ease-out"
            :class="hovered != null && hovered !== seg.i ? 'opacity-30' : ''"
            @mouseenter="hovered = seg.i"
            @mouseleave="hovered = null"
          />
        </g>
      </svg>
      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-bold tracking-tight text-slate-900">{{ total }}</span>
        <span class="text-[11px] text-slate-400">Total booked</span>
      </div>
    </div>

    <!-- OTA list -->
    <div class="min-w-0 flex-1">
      <div class="space-y-1">
        <div
          v-for="seg in segments"
          :key="seg.i"
          class="flex items-center gap-2.5 rounded-md px-1.5 py-1 transition-all duration-150 ease-out"
          :class="hovered === seg.i ? 'bg-slate-50' : hovered != null ? 'opacity-40' : ''"
          @mouseenter="hovered = seg.i"
          @mouseleave="hovered = null"
        >
          <OtaLogo :src="seg.logo" :name="seg.logoName || seg.label" :size="24" />
          <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{{ seg.label }}</span>
          <span class="shrink-0 text-sm font-bold tabular-nums text-slate-900">{{ seg.value }}</span>
          <span
            class="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
            :style="{ color: seg.color, backgroundColor: seg.color + '22' }"
          >{{ seg.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
