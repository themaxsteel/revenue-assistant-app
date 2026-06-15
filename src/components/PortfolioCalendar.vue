<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ArrowUpRight, ArrowDownRight, MapPin, ChevronLeft, ChevronRight, ChevronDown, Settings, Pin, Check, Sparkles, X, ListPlus, CheckCircle2, Eye, ArrowUpDown, Layers, SlidersHorizontal } from 'lucide-vue-next'
import { occupancyCell } from '@/mock/occupancyMatrix'
import { propertyTypeLabel } from '@/mock/properties'
import { buildDemoSuggestions } from '@/mock/calendarSuggestions'
import { useAgentStore } from '@/stores/agent'
import { useTasksStore } from '@/stores/tasks'
import { useCalendarStore } from '@/stores/calendar'
import Badge from '@/components/ui/Badge.vue'

const props = defineProps({
  properties: { type: Array, required: true },
})

const router = useRouter()
const agent = useAgentStore()
const tasks = useTasksStore()
const cal = useCalendarStore()
const settingsOpen = ref(false)
const settingsPos = ref({ top: 0, right: 0 })
const gearRef = ref(null)
function updateSettingsPos() {
  const el = gearRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  settingsPos.value = { top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) }
}
function openSettings() {
  if (settingsOpen.value) {
    settingsOpen.value = false
    return
  }
  updateSettingsPos()
  settingsOpen.value = true
}
// Keep the popup anchored under the gear while the page (or grid) scrolls.
function onReposition() {
  if (settingsOpen.value) updateSettingsPos()
}
onMounted(() => {
  window.addEventListener('scroll', onReposition, true)
  window.addEventListener('resize', onReposition)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('resize', onReposition)
})

// ── Drill-down state. Opens on the 12-month overview; clicking a month opens
// that month's daily occupancy. ──
const view = ref('month') // 'month' | 'day'
const activeMonth = ref(null) // dayjs of the drilled-in month

const today = dayjs()

// ── B3: quick filter chips (calendar-scoped) ──
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'attention', label: 'Needs attention' },
  { key: 'low', label: 'Low occ <55%' },
  { key: 'strong', label: 'Strong ≥80%' },
]
function passesFilter(p, key = cal.activeFilter) {
  if (key === 'attention') return p.alertCount > 0 || p.occupancy < 55 || p.paceDelta <= -10
  if (key === 'low') return p.occupancy < 55
  if (key === 'strong') return p.occupancy >= 80
  return true
}
function countFor(key) {
  return props.properties.filter((p) => passesFilter(p, key)).length
}

// ── C8: row sorting (calendar-scoped) ──
const SORTS = [
  { key: 'priority', label: 'Priority' },
  { key: 'occupancy', label: 'Occupancy' },
  { key: 'name', label: 'Name (A–Z)' },
]
function attentionRank(p) {
  return p.alertCount > 0 || p.occupancy < 55 || p.paceDelta <= -10 ? 0 : 1
}
const visibleProperties = computed(() => {
  let list = props.properties.filter((p) => passesFilter(p))
  if (cal.sortKey === 'occupancy') {
    list = [...list].sort((a, b) => b.occupancy - a.occupancy)
  } else if (cal.sortKey === 'name') {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  } else {
    list = [...list].sort((a, b) => attentionRank(a) - attentionRank(b) || a.healthScore - b.healthScore)
  }
  return list
})

// ── Time columns depend on the level. ──
const columns = computed(() => {
  if (view.value === 'day' && activeMonth.value) {
    const m = activeMonth.value
    // For the current month, start from today; otherwise from the 1st.
    const startDay = m.isSame(today, 'month') ? today.date() : 1
    const length = m.daysInMonth() - startDay + 1
    return Array.from({ length }, (_, i) => {
      const d = m.date(startDay + i)
      return {
        key: d.format('YYYY-MM-DD'),
        year: d.year(),
        month: d.month(),
        day: d.date(),
        groupKey: d.format('YYYY-MM'),
        groupLabel: d.format('MMMM YYYY'),
        top: d.format('dd'),
        main: String(d.date()),
        tipLabel: d.format('ddd, D MMM YYYY'),
        isWeekend: [0, 6].includes(d.day()),
        isCurrent: d.isSame(today, 'day'),
      }
    })
  }
  const start = today.startOf('month')
  return Array.from({ length: 12 }, (_, i) => {
    const d = start.add(i, 'month')
    return {
      key: d.format('YYYY-MM'),
      year: d.year(),
      month: d.month(),
      day: null,
      groupKey: d.format('YYYY'),
      groupLabel: d.format('YYYY'),
      top: '',
      main: d.format('MMM'),
      tipLabel: d.format('MMMM YYYY'),
      isWeekend: false,
      isCurrent: d.isSame(today, 'month'),
    }
  })
})

// Group header row: by year (month view) or the single month (day view).
const groups = computed(() => {
  const out = []
  for (const c of columns.value) {
    const last = out[out.length - 1]
    if (last && last.key === c.groupKey) last.span += 1
    else out.push({ key: c.groupKey, label: c.groupLabel, span: 1 })
  }
  return out
})

// ── D9: group rows by region / type, collapsible ──
const GROUP_BYS = [
  { key: 'none', label: 'None' },
  { key: 'region', label: 'Region' },
  { key: 'type', label: 'Type' },
]
const collapsed = ref(new Set())
function groupValue(p) {
  if (cal.groupBy === 'region') return p.city.split('—')[0].trim()
  if (cal.groupBy === 'type') return propertyTypeLabel[p.type] || p.type
  return null
}
function toggleCollapse(key) {
  const s = new Set(collapsed.value)
  s.has(key) ? s.delete(key) : s.add(key)
  collapsed.value = s
}

// ── D10: pin properties to the top ──
const pinned = ref(new Set())
function isPinned(id) {
  return pinned.value.has(id)
}
function togglePin(id) {
  const s = new Set(pinned.value)
  s.has(id) ? s.delete(id) : s.add(id)
  pinned.value = s
}

// ── Smart Suggestions on cells: live recs (pending + recently handled) + demo
// fillers. #13: handled recs stay visible so the cell shows a "done" state. ──
const liveSuggestions = computed(() =>
  agent.recommendations
    .filter((r) => ['pending', 'tasked', 'approved'].includes(r.status))
    .map((r) => {
      const s = today.add(r.daysOut ?? 0, 'day')
      const span = (r.type || '').includes('rate') ? 2 : 0
      return {
        id: r.id,
        propertyId: r.propertyId,
        type: r.type,
        risk: r.risk,
        title: r.title,
        estImpact: r.estImpact,
        confidence: r.confidence,
        start: s.format('YYYY-MM-DD'),
        end: s.add(span, 'day').format('YYYY-MM-DD'),
        source: 'live',
        status: r.status,
        handled: r.status !== 'pending',
      }
    }),
)
// Demo suggestions only fill months that have no live rec for that property.
const demoSuggestions = computed(() => {
  const liveBuckets = new Set(liveSuggestions.value.map((s) => `${s.propertyId}|${s.start.slice(0, 7)}`))
  return buildDemoSuggestions(props.properties).filter(
    (s) => !liveBuckets.has(`${s.propertyId}|${s.start.slice(0, 7)}`),
  )
})
const suggestionsByProp = computed(() => {
  const m = new Map()
  for (const s of [...liveSuggestions.value, ...demoSuggestions.value]) {
    if (!m.has(s.propertyId)) m.set(s.propertyId, [])
    m.get(s.propertyId).push(s)
  }
  return m
})
function cellSuggestions(pid, c) {
  const list = suggestionsByProp.value.get(pid)
  if (!list) return []
  if (c.day == null) {
    const ym = `${c.year}-${String(c.month + 1).padStart(2, '0')}`
    return list.filter((s) => s.start.slice(0, 7) === ym || s.end.slice(0, 7) === ym)
  }
  const d = `${c.year}-${String(c.month + 1).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`
  return list.filter((s) => s.start <= d && d <= s.end)
}

function makeRow(p) {
  return {
    property: p,
    cells: columns.value.map((c) => {
      const occ = occupancyCell(p, { year: c.year, month: c.month, day: c.day })
      const suggestions = cellSuggestions(p.id, c)
      return {
        ...occ,
        roomsLeft: Math.max(0, Math.round(p.units * (1 - occ.occupancy / 100))),
        suggestions,
        pendingSug: suggestions.filter((s) => !s.handled),
        handledSug: suggestions.filter((s) => s.handled),
      }
    }),
  }
}

// What each cell prints, per the "Show data" setting. Colour always reflects
// demand (occupancy): high occupancy = few rooms left = green. So the same heat
// scale reads correctly for both — only the legend wording changes.
// In month view the rooms-left figure is an avg/night, so it gets a "~" prefix.
function cellLabel(cell) {
  if (cal.showData !== 'roomsLeft') return `${cell.occupancy}%`
  return view.value === 'month' ? `~${cell.roomsLeft}` : `${cell.roomsLeft}`
}
const LEGEND = {
  occupancy: {
    title: 'Occupancy',
    items: [
      { c: 'bg-rose-300', l: '<48%' },
      { c: 'bg-orange-300', l: '48–57%' },
      { c: 'bg-amber-200', l: '58–67%' },
      { c: 'bg-emerald-300', l: '68–77%' },
      { c: 'bg-emerald-500', l: '78–87%' },
      { c: 'bg-emerald-600', l: '88%+' },
    ],
  },
  roomsLeft: {
    title: 'Rooms left',
    items: [
      { c: 'bg-rose-300', l: 'Lots left' },
      { c: 'bg-orange-300', l: 'Many left' },
      { c: 'bg-amber-200', l: 'Some left' },
      { c: 'bg-emerald-300', l: 'Few left' },
      { c: 'bg-emerald-500', l: 'Very few' },
      { c: 'bg-emerald-600', l: 'Sold out' },
    ],
  },
}
const legend = computed(() => {
  const base = LEGEND[cal.showData] || LEGEND.occupancy
  // Month cells show an avg-per-night figure — make the legend say so.
  if (cal.showData === 'roomsLeft' && view.value === 'month') return { ...base, title: 'Rooms left / night' }
  return base
})

// #12: act on a live suggestion straight from the calendar popover.
function addSuggestionToTask(s) {
  const rec = agent.recommendations.find((r) => r.id === s.id)
  if (!rec || rec.status !== 'pending') return
  tasks.addFromRecommendation(rec)
  s.handled = true // reflect in the open popover immediately
  s.status = 'tasked'
}
function statusLabel(s) {
  return s.status === 'approved' ? 'Applied' : 'Added to tasks'
}

// Sections: a pinned section first (if any), then either one flat section or
// the region/type groups.
const sections = computed(() => {
  const base = visibleProperties.value
  const pins = base.filter((p) => isPinned(p.id))
  const rest = base.filter((p) => !isPinned(p.id))
  const out = []
  if (pins.length) {
    out.push({ key: '__pinned', label: 'Pinned', pinned: true, count: pins.length, rows: pins.map(makeRow) })
  }
  if (cal.groupBy === 'none') {
    out.push({ key: '__all', label: null, count: rest.length, rows: rest.map(makeRow) })
  } else {
    const map = new Map()
    for (const p of rest) {
      const k = groupValue(p)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(p)
    }
    for (const k of [...map.keys()].sort((a, b) => a.localeCompare(b))) {
      out.push({ key: k, label: k, collapsible: true, count: map.get(k).length, rows: map.get(k).map(makeRow) })
    }
  }
  return out
})

function heat(occ) {
  if (occ >= 88) return 'bg-emerald-600 text-white'
  if (occ >= 78) return 'bg-emerald-500 text-white'
  if (occ >= 68) return 'bg-emerald-300 text-emerald-900'
  if (occ >= 58) return 'bg-amber-200 text-amber-900'
  if (occ >= 48) return 'bg-orange-300 text-orange-950'
  return 'bg-rose-300 text-rose-950'
}
function heatDot(occ) {
  if (occ >= 88) return 'bg-emerald-600'
  if (occ >= 78) return 'bg-emerald-500'
  if (occ >= 68) return 'bg-emerald-400'
  if (occ >= 58) return 'bg-amber-400'
  if (occ >= 48) return 'bg-orange-400'
  return 'bg-rose-400'
}
function fmtIdr(v) {
  return v >= 1_000_000 ? `Rp ${(v / 1_000_000).toFixed(1)}jt` : `Rp ${Math.round(v / 1_000)}rb`
}

// Day view scrolls horizontally (up to 31 cols); month view fills the width.
const isScroll = computed(() => view.value === 'day')
const timeColClass = computed(() =>
  isScroll.value ? 'w-[58px] shrink-0' : 'flex-1 basis-0 min-w-[52px]',
)
const nameColClass = computed(() =>
  isScroll.value ? 'sticky left-0 z-10 w-[184px] shrink-0' : 'w-[184px] shrink-0',
)
function groupStyle(g) {
  return isScroll.value
    ? { width: `${g.span * 58}px`, flexShrink: 0 }
    : { flexGrow: g.span, flexBasis: '0%', minWidth: `${g.span * 52}px` }
}

// ── Drill in / out ──
function openMonth(c) {
  if (view.value !== 'month') return
  activeMonth.value = dayjs(new Date(c.year, c.month, 1))
  view.value = 'day'
  hideTip()
}
function backToMonths() {
  view.value = 'month'
  activeMonth.value = null
  hideTip()
}

// ── Hover tooltip (teleported so overflow can't clip it). ──
const tip = ref(null)
function showTip(e, property, cell, column) {
  if (pop.value) return // don't fight with an open popover
  const r = e.currentTarget.getBoundingClientRect()
  const above = r.top > 230
  tip.value = {
    property,
    cell,
    label: column.tipLabel,
    suggestions: cell.suggestions || [],
    x: Math.min(Math.max(r.left + r.width / 2, 130), window.innerWidth - 130),
    y: above ? r.top - 10 : r.bottom + 10,
    above,
  }
}
function hideTip() {
  tip.value = null
}

// ── Click popover with suggestion detail (persistent until dismissed). ──
const pop = ref(null)
function openPopover(e, property, cell, column) {
  const r = e.currentTarget.getBoundingClientRect()
  const above = r.top > 320
  pop.value = {
    property,
    label: column.tipLabel,
    items: cell.suggestions,
    x: Math.min(Math.max(r.left + r.width / 2, 180), window.innerWidth - 180),
    y: above ? r.top - 8 : r.bottom + 8,
    above,
  }
  hideTip()
}
function closePopover() {
  pop.value = null
}
function fmtImpact(v) {
  return v >= 1_000_000 ? `Rp ${(v / 1_000_000).toFixed(1)}jt/wk` : `Rp ${Math.round(v / 1_000)}rb/wk`
}

function openProperty(p) {
  router.push(`/property/${p.id}/overview`)
}
// Cells with suggestions open the popover; otherwise jump to the property.
function onCellClick(e, property, cell, column) {
  if (cell.suggestions.length) openPopover(e, property, cell, column)
  else openProperty(property)
}
function goToSmartSuggest() {
  const id = pop.value?.property.id
  closePopover()
  if (id) router.push(`/property/${id}/agent`)
}
</script>

<template>
  <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
    <!-- Toolbar: filter chips (B3) + sort (C8) -->
    <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2.5">
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          class="pressable inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150"
          :class="cal.activeFilter === f.key ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'"
          @click="cal.activeFilter = f.key"
        >
          {{ f.label }}
          <span
            class="rounded-full px-1.5 text-[10px] font-bold leading-tight"
            :class="cal.activeFilter === f.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'"
          >{{ countFor(f.key) }}</span>
        </button>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <span class="hidden text-[11px] text-slate-400 sm:inline">{{ visibleProperties.length }} of {{ properties.length }}</span>

        <!-- Settings (gear) — popup is teleported below -->
        <button
          ref="gearRef"
          class="pressable inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50"
          title="Calendar settings"
          @click="openSettings"
        >
          <Settings class="h-4 w-4 text-slate-400" /> <span class="hidden sm:inline">Settings</span>
        </button>
      </div>
    </div>

    <!-- Settings popup (teleported so the card's overflow can't clip it) -->
    <Teleport to="body">
      <div v-if="settingsOpen" class="fixed inset-0 z-[55]" @click="settingsOpen = false"></div>
      <Transition name="pop">
        <div
          v-if="settingsOpen"
          class="fixed z-[60] w-72 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop"
          :style="{ top: settingsPos.top + 'px', right: settingsPos.right + 'px' }"
        >
          <!-- Header -->
          <div class="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <Settings class="h-4 w-4 text-brand-600" />
            <p class="text-sm font-semibold text-slate-900">Calendar settings</p>
            <button
              class="pressable -mr-1.5 ml-auto rounded-lg p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600"
              @click="settingsOpen = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="divide-y divide-slate-100 px-4">
            <!-- Show data -->
            <div class="py-3.5">
              <p class="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <Eye class="h-3.5 w-3.5" /> Show data
              </p>
              <div class="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  v-for="d in [['occupancy','Occupancy'],['roomsLeft','Rooms left']]"
                  :key="d[0]"
                  class="pressable rounded-lg px-2 py-1.5 text-xs font-semibold transition-all duration-150"
                  :class="cal.showData === d[0] ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                  @click="cal.showData = d[0]"
                >{{ d[1] }}</button>
              </div>
            </div>

            <!-- Sort -->
            <div class="py-3.5">
              <p class="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <ArrowUpDown class="h-3.5 w-3.5" /> Sort properties by
              </p>
              <div class="space-y-0.5">
                <button
                  v-for="s in SORTS"
                  :key="s.key"
                  class="pressable flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] transition-colors duration-150"
                  :class="cal.sortKey === s.key ? 'bg-brand-50 font-semibold text-brand-700' : 'font-medium text-slate-600 hover:bg-slate-50'"
                  @click="cal.sortKey = s.key"
                >
                  {{ s.label }}
                  <Check v-if="cal.sortKey === s.key" class="h-4 w-4 shrink-0 text-brand-600" />
                </button>
              </div>
            </div>

            <!-- Group -->
            <div class="py-3.5">
              <p class="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <Layers class="h-3.5 w-3.5" /> Group by
              </p>
              <div class="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  v-for="g in GROUP_BYS"
                  :key="g.key"
                  class="pressable rounded-lg px-2 py-1.5 text-xs font-semibold transition-all duration-150"
                  :class="cal.groupBy === g.key ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                  @click="cal.groupBy = g.key"
                >{{ g.label }}</button>
              </div>
            </div>

            <!-- Display toggles -->
            <div class="py-3.5">
              <p class="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <SlidersHorizontal class="h-3.5 w-3.5" /> Display
              </p>
              <div class="space-y-0.5">
                <button
                  v-for="t in [
                    { key: 'showBadges', label: 'Smart suggestion badges' },
                    { key: 'compact', label: 'Compact rows' },
                    { key: 'weekendShading', label: 'Weekend shading' },
                  ]"
                  :key="t.key"
                  class="pressable flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50"
                  @click="cal[t.key] = !cal[t.key]"
                >
                  {{ t.label }}
                  <span
                    class="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150"
                    :class="cal[t.key] ? 'bg-brand-500' : 'bg-slate-300'"
                  >
                    <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-150" :class="cal[t.key] ? 'left-4' : 'left-0.5'"></span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Scroll viewport: header sticks to top (A1), name column sticks left -->
    <div class="max-h-[68vh] overflow-auto">
      <div :class="isScroll ? 'min-w-max' : 'w-full'">
        <!-- Sticky header (group row + column header row) -->
        <div class="sticky top-0 z-20">
          <!-- Group row: year (month view) or month + back button (day view) -->
          <div class="flex border-b border-slate-200 bg-slate-50">
            <div
              class="flex items-center border-r border-slate-200 bg-slate-50 px-3 py-1.5"
              :class="nameColClass"
            >
              <button
                v-if="view === 'day'"
                class="pressable inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition-colors duration-150 hover:bg-slate-50"
                @click="backToMonths"
              >
                <ChevronLeft class="h-3.5 w-3.5" /> 12 months
              </button>
              <span v-else class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Next 12 months
              </span>
            </div>
            <div
              v-for="g in groups"
              :key="g.key"
              class="flex items-center justify-center border-r border-slate-200 py-1.5 text-center last:border-r-0"
              :style="groupStyle(g)"
            >
              <span class="text-xs font-bold text-slate-600">{{ g.label }}</span>
            </div>
          </div>

          <!-- Column header row -->
          <div class="flex border-b border-slate-200 bg-slate-50">
            <div
              class="flex items-center border-r border-slate-200 bg-slate-50 px-3 py-2"
              :class="nameColClass"
            >
              <span class="text-sm font-semibold text-slate-700">Properties</span>
            </div>
            <component
              :is="view === 'month' ? 'button' : 'div'"
              v-for="c in columns"
              :key="c.key"
              class="relative flex flex-col items-center justify-center gap-0.5 border-r border-slate-100 px-1 py-2 text-center last:border-r-0"
              :class="[
                timeColClass,
                c.isWeekend && cal.weekendShading ? 'bg-sky-100/80' : '',
                view === 'month' ? 'pressable cursor-pointer transition-colors duration-150 hover:bg-brand-50' : '',
              ]"
              :title="view === 'month' ? 'Click to view daily occupancy' : null"
              @click="view === 'month' && openMonth(c)"
            >
              <span v-if="c.top" class="text-[10px] font-medium uppercase tracking-wide" :class="c.isWeekend && cal.weekendShading ? 'text-sky-600' : 'text-slate-400'">{{ c.top }}</span>
              <span class="text-sm font-bold leading-none" :class="c.isWeekend && cal.weekendShading ? 'text-sky-700' : 'text-slate-700'">{{ c.main }}</span>
              <ChevronRight v-if="view === 'month'" class="absolute right-0.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-300" />
            </component>
          </div>
        </div>

        <!-- Sections (pinned + groups), each with property rows -->
        <template v-for="section in sections" :key="section.key">
          <!-- Group / pinned band header (whole band clickable to collapse) -->
          <div
            v-if="section.label"
            class="flex border-b border-slate-200 bg-slate-100/80"
            :class="section.collapsible ? 'cursor-pointer hover:bg-slate-200/70' : ''"
            @click="section.collapsible && toggleCollapse(section.key)"
          >
            <div
              class="flex items-center gap-1.5 border-r border-slate-200 bg-slate-100 px-3 py-1.5"
              :class="nameColClass"
            >
              <template v-if="section.collapsible">
                <ChevronDown v-if="!collapsed.has(section.key)" class="h-4 w-4 text-slate-400" />
                <ChevronRight v-else class="h-4 w-4 text-slate-400" />
              </template>
              <Pin v-else class="h-3.5 w-3.5 fill-brand-500 text-brand-500" />
              <span class="truncate text-xs font-bold text-slate-700">{{ section.label }}</span>
              <span class="rounded-full bg-slate-200 px-1.5 text-[10px] font-bold leading-tight text-slate-500">{{ section.count }}</span>
            </div>
            <div class="flex-1"></div>
          </div>

          <!-- Rows -->
          <template v-if="!section.collapsible || !collapsed.has(section.key)">
            <div
              v-for="(row, ri) in section.rows"
              :key="row.property.id"
              class="group/row flex border-b border-slate-100 last:border-b-0"
            >
              <div
                class="flex items-center gap-1 border-r border-slate-200 pl-2 pr-1 transition-colors duration-150 hover:bg-slate-50"
                :class="[nameColClass, ri % 2 ? 'bg-slate-50' : 'bg-white']"
              >
                <button
                  class="pressable flex shrink-0 items-center transition-all duration-150 hover:text-brand-600"
                  :class="isPinned(row.property.id) ? 'text-brand-500' : 'text-slate-300 opacity-0 group-hover/row:opacity-100'"
                  :title="isPinned(row.property.id) ? 'Unpin' : 'Pin to top'"
                  @click.stop="togglePin(row.property.id)"
                >
                  <Pin class="h-3.5 w-3.5" :class="isPinned(row.property.id) ? 'fill-brand-500' : ''" />
                </button>
                <button
                  class="pressable min-w-0 flex-1 text-left"
                  :class="cal.compact ? 'py-1' : 'py-2'"
                  @click="openProperty(row.property)"
                >
                  <span class="block truncate text-sm font-semibold text-slate-800">{{ row.property.name }}</span>
                  <span v-if="!cal.compact" class="block truncate text-[11px] text-slate-400">{{ row.property.city }}</span>
                </button>
              </div>

              <button
                v-for="(cell, ci) in row.cells"
                :key="ci"
                class="pressable group relative flex items-center justify-center border-r border-slate-100 p-1 transition-transform duration-150 last:border-r-0 hover:scale-[1.06]"
                :class="[timeColClass, columns[ci].isWeekend && cal.weekendShading ? 'bg-sky-100/70' : '']"
                @click="onCellClick($event, row.property, cell, columns[ci])"
                @mouseenter="showTip($event, row.property, cell, columns[ci])"
                @mouseleave="hideTip"
              >
                <span
                  class="flex w-full items-center justify-center rounded-lg text-xs font-bold leading-none shadow-sm"
                  :class="[heat(cell.occupancy), cal.compact ? 'h-[30px]' : 'h-[44px]']"
                >
                  {{ cellLabel(cell) }}
                </span>
                <!-- Smart Suggestion badge: pending count (brand) or handled (✓) -->
                <span
                  v-if="cal.showBadges && cell.pendingSug.length"
                  class="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white shadow ring-2 ring-white"
                  :title="`${cell.pendingSug.length} smart suggestion${cell.pendingSug.length > 1 ? 's' : ''}`"
                >{{ cell.pendingSug.length }}</span>
                <span
                  v-else-if="cal.showBadges && cell.handledSug.length"
                  class="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white"
                  title="Suggestion handled"
                ><Check class="h-2.5 w-2.5" /></span>
              </button>
            </div>
          </template>
        </template>

        <!-- Empty state when a filter matches nothing -->
        <p v-if="!visibleProperties.length" class="px-4 py-12 text-center text-sm text-slate-400">
          No properties match this filter.
        </p>
      </div>
    </div>

    <!-- Legend (switches with the "Show data" setting) -->
    <div class="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-500">
      <span class="font-medium text-slate-600">{{ legend.title }}</span>
      <span v-for="it in legend.items" :key="it.l" class="flex items-center gap-1">
        <span class="h-3 w-3 rounded" :class="it.c"></span>{{ it.l }}
      </span>
      <span class="ml-auto text-slate-400">
        {{ view === 'month' ? 'Click a month to see daily occupancy' : 'Click any cell to open the property' }}
      </span>
    </div>
  </div>

  <!-- Hover tooltip -->
  <Teleport to="body">
    <Transition name="tip">
      <div
        v-if="tip"
        class="pointer-events-none fixed z-[60] w-60 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-pop"
        :class="tip.above ? '-translate-y-full' : ''"
        :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
      >
        <p class="truncate text-sm font-semibold text-slate-900">{{ tip.property.name }}</p>
        <p class="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
          <MapPin class="h-3 w-3" /> {{ tip.property.city }}
        </p>
        <p class="mt-2 text-[11px] font-medium uppercase tracking-wide text-brand-600">{{ tip.label }}</p>

        <div class="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
          <span class="flex items-center gap-1.5 text-xs text-slate-500">
            <span class="h-2.5 w-2.5 rounded-full" :class="heatDot(tip.cell.occupancy)"></span> Occupancy
          </span>
          <span class="text-base font-bold text-slate-900">{{ tip.cell.occupancy }}%</span>
        </div>
        <div class="mt-1.5 flex items-center justify-between text-xs">
          <span class="text-slate-500">{{ view === 'month' ? 'Avg rooms left / night' : 'Rooms left' }}</span>
          <span class="font-semibold text-slate-800">{{ view === 'month' ? '≈' : '' }}{{ tip.cell.roomsLeft }} of {{ tip.property.units }}</span>
        </div>
        <div class="mt-1.5 flex items-center justify-between text-xs">
          <span class="text-slate-500">Pace vs last year</span>
          <span
            class="inline-flex items-center gap-0.5 font-semibold"
            :class="tip.cell.paceDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'"
          >
            <ArrowUpRight v-if="tip.cell.paceDelta >= 0" class="h-3.5 w-3.5" />
            <ArrowDownRight v-else class="h-3.5 w-3.5" />
            {{ tip.cell.paceDelta >= 0 ? '+' : '' }}{{ tip.cell.paceDelta }}%
          </span>
        </div>

        <!-- Smart suggestions for this cell -->
        <div v-if="tip.suggestions.length" class="mt-2 border-t border-slate-100 pt-2">
          <p class="flex items-center gap-1 text-[11px] font-semibold text-brand-600">
            <Sparkles class="h-3 w-3" /> {{ tip.suggestions.length }} smart suggestion{{ tip.suggestions.length > 1 ? 's' : '' }}
          </p>
          <ul class="mt-1 space-y-1">
            <li v-for="s in tip.suggestions.slice(0, 3)" :key="s.id" class="flex items-start gap-1.5 text-[11px] text-slate-600">
              <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" :class="s.risk === 'approval' ? 'bg-amber-400' : 'bg-brand-500'"></span>
              <span class="min-w-0 flex-1 truncate">{{ s.title }}</span>
            </li>
          </ul>
        </div>

        <p class="mt-2 text-[10px] text-slate-400">
          {{ tip.suggestions.length ? 'Click for details' : 'Click to open property' }}
        </p>
      </div>
    </Transition>
  </Teleport>

  <!-- Click popover: suggestion detail -->
  <Teleport to="body">
    <div v-if="pop">
      <div class="fixed inset-0 z-[55]" @click="closePopover"></div>
      <div
        class="fixed z-[60] w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-pop"
        :class="pop.above ? '-translate-y-full' : ''"
        :style="{ left: pop.x + 'px', top: pop.y + 'px' }"
      >
        <div class="flex items-start gap-2">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-slate-900">{{ pop.property.name }}</p>
            <p class="text-[11px] font-medium uppercase tracking-wide text-brand-600">{{ pop.label }}</p>
          </div>
          <button class="pressable -mr-1 -mt-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" @click="closePopover">
            <X class="h-4 w-4" />
          </button>
        </div>

        <p class="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand-600">
          <Sparkles class="h-3.5 w-3.5" /> {{ pop.items.length }} smart suggestion{{ pop.items.length > 1 ? 's' : '' }}
        </p>
        <ul class="mt-1.5 max-h-64 space-y-1.5 overflow-auto">
          <li v-for="s in pop.items" :key="s.id" class="rounded-lg border border-slate-100 bg-slate-50/70 p-2" :class="s.handled ? 'opacity-70' : ''">
            <div class="flex items-start justify-between gap-2">
              <span class="text-xs font-semibold text-slate-800">{{ s.title }}</span>
              <Badge :tone="s.risk === 'approval' ? 'amber' : 'green'" size="sm" class="shrink-0">
                {{ s.risk === 'approval' ? 'Needs review' : 'Quick win' }}
              </Badge>
            </div>
            <div class="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
              <span class="font-medium text-emerald-600">{{ fmtImpact(s.estImpact) }}</span>
              <span>{{ s.confidence }}% confidence</span>
            </div>
            <!-- #12/#13: act in place or show handled state -->
            <div class="mt-1.5 flex items-center justify-end">
              <span v-if="s.handled" class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 class="h-3.5 w-3.5" /> {{ statusLabel(s) }}
              </span>
              <button
                v-else-if="s.source === 'live'"
                class="pressable inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white transition-colors duration-150 hover:bg-brand-700"
                @click="addSuggestionToTask(s)"
              >
                <ListPlus class="h-3.5 w-3.5" /> Add to task
              </button>
              <span v-else class="text-[10px] italic text-slate-400">Forecast preview</span>
            </div>
          </li>
        </ul>

        <button
          class="pressable mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-brand-700"
          @click="goToSmartSuggest"
        >
          <Sparkles class="h-3.5 w-3.5" /> Open in Smart Suggest
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tip-enter-active,
.tip-leave-active {
  transition: opacity 120ms var(--ease-out), transform 120ms var(--ease-out);
}
.tip-enter-from,
.tip-leave-to {
  opacity: 0;
}
.pop-enter-active {
  transition: opacity 150ms var(--ease-out), transform 150ms var(--ease-out);
}
.pop-leave-active {
  transition: opacity 110ms var(--ease-out), transform 110ms var(--ease-out);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}
</style>
