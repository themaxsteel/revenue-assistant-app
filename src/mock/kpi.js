// Per-property KPI "check" data, organised by cadence (daily / weekly / monthly).
// This is NOT a BI dashboard: each KPI is framed as a question the RA needs
// answered, with the FULL supporting data shown inline (lists + compact visuals)
// so the RA never has to navigate away. Data is pulled from the existing mocks /
// stores where available (forecast, channels, promotions, reputation) and
// synthesised deterministically only where no source exists (budget, ROI, etc).
//
// Each card carries a `detail` describing how to render its data inline:
//   list     → { type:'list', items:[{title, sub?, right?, pct?, tone?}], empty? }
//   bars     → { type:'bars', items:[{label, value, display?, tone?, highlight?}] }   (horizontal)
//   colbars  → { type:'colbars', items:[{label, value, display?, tone?}] }            (vertical)
//   spark    → { type:'spark', data:[…], caption?, tone? }
//   stats    → { type:'stats', items:[{label, value, delta?}] }
//   progress → { type:'progress', value, items:[{label, done}] }
import dayjs from 'dayjs'
import { rng, range, intRange, clamp, pick, idr } from './util'
import { forecastFor } from './forecast'
import { channelsFor } from './channels'
import { promotionsFor } from './promotions'
import { reputationFor } from './reputation'
import { channelLogos } from './channelLogos'
import { reviewSourceLogos } from './reviewLogos'

// Attach an OTA/channel logo to a row so the UI can show it next to the name.
function withLogo(name) {
  return { logo: channelLogos[name] || null, logoName: name }
}

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function sign(n) {
  return `${n > 0 ? '+' : ''}${n}`
}
function sentimentTone(s) {
  return s === 'negative' ? 'red' : s === 'neutral' ? 'amber' : 'green'
}
const MONTHS = (n) => Array.from({ length: n }, (_, i) => dayjs().subtract(n - 1 - i, 'month').format('MMM'))

// ── DAILY ──────────────────────────────────────────────────────────────
function dailyCards(property, ctx) {
  const rand = rng(hash(property.id + '|daily'))
  const fc = forecastFor(property.id)
  const next7 = fc.slice(0, 7)
  const next14 = fc.slice(0, 14)
  const channels = channelsFor(property.id)

  // New bookings split across the top channels by share.
  const newBookings = intRange(rand, 4, 11)
  const topCh = channels.slice(0, 4)
  const shareSum = topCh.reduce((a, c) => a + c.share, 0)
  let acc = 0
  const bookingItems = topCh
    .map((c, i) => {
      const n = i === topCh.length - 1 ? newBookings - acc : Math.round((newBookings * c.share) / shareSum)
      acc += Math.max(0, n)
      return { label: c.name, value: Math.max(0, n), ...withLogo(c.name) }
    })
    .filter((x) => x.value > 0)

  // Cancellations today.
  const cancelCount = rand() < 0.5 ? intRange(rand, 1, 2) : 0
  const cancelItems = Array.from({ length: cancelCount }, () => {
    const d = pick(rand, next7)
    const ch = pick(rand, channels)
    return {
      title: ch.name,
      sub: d.label,
      right: idr(property.adr * intRange(rand, 1, 2), { compact: true }),
      tone: 'red',
      ...withLogo(ch.name),
    }
  })

  const pickupItems = next14.map((d) => ({ label: dayjs(d.date).format('DD'), full: dayjs(d.date).format('DD MMMM'), value: d.pickup, tone: 'brand' }))
  const pickup7 = next7.reduce((s, d) => s + d.pickup, 0)
  const pickup14 = next14.slice(7).reduce((s, d) => s + d.pickup, 0)
  const lateSlow = pickup14 < pickup7 * 0.6

  // Occupancy health over the next 7 days vs a fixed 75% target.
  const OCC_TARGET = 75
  const occAvg = Math.round(next7.reduce((s, d) => s + d.occForecast, 0) / next7.length)
  const softDates = next7.filter((d) => d.occForecast < OCC_TARGET)
  const softCount = softDates.length
  const occStatus = softCount === 0 ? 'good' : softCount <= 2 ? 'watch' : 'attention'
  const occGap = Math.max(0, OCC_TARGET - occAvg)
  const occFirst = dayjs(next7[0].date)
  const occLast = dayjs(next7[next7.length - 1].date)
  const occMonthLabel =
    occFirst.month() === occLast.month()
      ? occFirst.format('MMMM YYYY')
      : occFirst.year() === occLast.year()
        ? `${occFirst.format('MMM')} – ${occLast.format('MMM YYYY')}`
        : `${occFirst.format('MMM YYYY')} – ${occLast.format('MMM YYYY')}`
  const occDays = next7.map((d) => {
    const dj = dayjs(d.date)
    return {
      day: dj.format('DD'),
      dow: dj.format('ddd'),
      weekend: [0, 6].includes(dj.day()),
      occ: d.occForecast,
    }
  })

  // High-demand: all next-7-days as a heatmap with rate-uplift suggestions.
  const hiDays = next7.map((d) => {
    const uplift = Math.max(0, Math.min(25, Math.round((d.occForecast - 80) / 1.5)))
    const current = property.adr
    const suggested = uplift > 0 ? Math.round((current * (1 + uplift / 100)) / 10_000) * 10_000 : current
    return {
      day: dayjs(d.date).format('DD'),
      dow: dayjs(d.date).format('ddd'),
      month: dayjs(d.date).format('MMM'),
      demand: d.occForecast,
      uplift,
      currentText: idr(current, { compact: true }),
      suggestedText: idr(suggested, { compact: true }),
    }
  })
  const hiCount = next7.filter((d) => d.occForecast >= 85).length

  const leftItems = next7.map((d) => {
    const rooms = Math.round((property.units * (100 - d.occForecast)) / 100)
    return { title: d.label, rooms, right: `${rooms}/${property.units}`, pct: (rooms / property.units) * 100, tone: 'brand' }
  })
  const leftTotal = leftItems.reduce((s, r) => s + Math.round((r.pct / 100) * property.units), 0)

  const reviews = ctx.reviews || []

  return [
    {
      id: 'new-bookings',
      label: 'New bookings',
      question: 'Where are new bookings coming from?',
      answer: `${newBookings} new bookings · last 7 days`,
      status: 'good',
      detail: { type: 'bars', items: bookingItems },
    },
    {
      id: 'cancellations',
      label: 'Cancellations',
      question: 'Any cancellation that needs a pickup?',
      answer: cancelCount ? `${cancelCount} cancellation${cancelCount > 1 ? 's' : ''} today — needs pickup` : 'No cancellations today',
      status: cancelCount ? 'attention' : 'good',
      detail: { type: 'list', items: cancelItems, empty: 'Nothing to recover right now.' },
    },
    {
      id: 'pickup',
      label: 'Pickup · next 14 days',
      question: 'Which dates are moving or slow?',
      answer: `${pickup7} rooms (7d) · ${pickup14} rooms (8–14d)${lateSlow ? ' — far dates slow' : ''}`,
      status: lateSlow ? 'watch' : 'good',
      detail: { type: 'colbars', items: pickupItems },
    },
    {
      id: 'low-occ',
      label: 'Occupancy',
      question: 'Are the next 7 days on track?',
      answer:
        occStatus === 'good'
          ? `${occAvg}% · above target, no soft dates`
          : occStatus === 'watch'
            ? `${occAvg}% · just below target, ${softCount} softening`
            : `Occupancy ${occAvg}% — ${softCount} soft dates need a promo`,
      status: occStatus,
      detail: {
        type: 'occupancy',
        avg: occAvg,
        target: OCC_TARGET,
        gap: occGap,
        softCount,
        soft: softDates.map((d) => ({ label: d.label + (d.weekend ? ' · wknd' : ''), occ: d.occForecast })),
        monthLabel: occMonthLabel,
        days: occDays,
      },
    },
    {
      id: 'high-demand',
      label: 'High-demand dates',
      question: 'Which dates could take a higher rate?',
      answer: hiCount ? `${hiCount} high-demand date${hiCount > 1 ? 's' : ''} — raise rate` : 'No demand peaks in the next 7 days',
      status: hiCount ? 'watch' : 'good',
      detail: {
        type: 'high-demand',
        monthLabel: occMonthLabel,
        days: hiDays,
      },
    },
    {
      id: 'left-to-sell',
      label: 'Left to sell · next 7 days',
      question: 'How many rooms are left per date?',
      answer: `~${leftTotal} room-nights still open`,
      status: 'good',
      detail: { type: 'list', items: leftItems },
    },
    {
      id: 'reviews',
      label: 'Reviews / messages',
      question: 'Anything that needs a reply?',
      answer: reviews.length ? `${reviews.length} review${reviews.length > 1 ? 's' : ''} need a reply` : 'All caught up',
      status: reviews.length ? 'attention' : 'good',
      detail: {
        type: 'list',
        items: reviews.map((r) => ({
          title: r.author,
          sub: r.text,
          right: `${r.rating}${r.scale === 5 ? '/5' : ''}`,
          tone: sentimentTone(r.sentiment),
          logo: reviewSourceLogos[r.source] || channelLogos[r.sourceName] || null,
          logoName: r.sourceName,
        })),
        empty: 'No pending guest replies.',
      },
    },
  ]
}

// ── WEEKLY ─────────────────────────────────────────────────────────────
function weeklyCards(property, ctx) {
  const rand = rng(hash(property.id + '|weekly'))

  // Booking window — lead-time distribution.
  const buckets = [
    { label: '0–3d', value: intRange(rand, 10, 35) },
    { label: '4–7d', value: intRange(rand, 15, 35) },
    { label: '8–14d', value: intRange(rand, 15, 30) },
    { label: '15d+', value: intRange(rand, 10, 30) },
  ]
  const bTotal = buckets.reduce((a, b) => a + b.value, 0)
  const avgLead = Math.round((buckets[0].value * 2 + buckets[1].value * 5 + buckets[2].value * 11 + buckets[3].value * 20) / bTotal)
  const shortening = buckets[0].value + buckets[1].value > bTotal * 0.5

  // ADR trend — 8 weeks around the base ADR.
  const adrSeries = Array.from({ length: 8 }, (_, i) => Math.round(property.adr * (1 + (i - 4) * 0.01 + range(rand, -0.05, 0.05))))
  const adrWoW = Math.round(((adrSeries[7] - adrSeries[6]) / adrSeries[6]) * 100)

  // Compset — you vs 3 competitors.
  const comps = [
    { label: 'Comp A', value: Math.round(property.adr * (1 + range(rand, -0.12, 0.12))) },
    { label: 'Comp B', value: Math.round(property.adr * (1 + range(rand, -0.12, 0.12))) },
    { label: 'Comp C', value: Math.round(property.adr * (1 + range(rand, -0.12, 0.12))) },
  ]
  const median = [...comps.map((c) => c.value)].sort((a, b) => a - b)[1]
  const compIdx = Math.round((property.adr / median) * 100)
  const compBars = [{ label: 'You', value: property.adr, highlight: true }, ...comps].map((c) => ({
    ...c,
    display: idr(c.value, { compact: true }),
  }))

  // Promo performance — active promotions.
  const promos = promotionsFor(property.id).filter((p) => p.status === 'active')
  const promoItems = promos.map((p) => {
    const showLogo = channelLogos[p.channel] || p.channel === 'Direct'
    return {
      title: p.name,
      sub: `${p.discount}% off · ${p.channel} · ${p.redemptions} redemptions`,
      right: idr(p.revenue, { compact: true }),
      tone: p.discount >= 20 ? 'amber' : 'green',
      logo: channelLogos[p.channel] || null,
      logoName: showLogo ? p.channel : null,
    }
  })
  const heavyPromo = promos.some((p) => p.discount >= 20)

  // Review sentiment — recurring negative themes for THIS property.
  const themes = ctx.negThemes || []

  return [
    {
      id: 'booking-window',
      label: 'Booking window',
      question: 'Are guests booking closer or further out?',
      answer: `Avg lead time ~${avgLead} days · ${shortening ? 'shortening' : 'lengthening'}`,
      status: shortening && avgLead < 7 ? 'watch' : 'good',
      detail: { type: 'bars', items: buckets },
    },
    {
      id: 'adr-trend',
      label: 'ADR trend · 8 weeks',
      question: 'Is price going up or down?',
      answer: `${idr(adrSeries[7], { compact: true })} now · ${adrWoW >= 0 ? 'up' : 'down'} ${Math.abs(adrWoW)}% WoW`,
      delta: adrWoW,
      deltaUnit: '%',
      status: adrWoW >= 0 ? 'good' : 'watch',
      detail: { type: 'spark', data: adrSeries, caption: 'last 8 weeks', tone: adrWoW >= 0 ? 'green' : 'red' },
    },
    {
      id: 'compset',
      label: 'Compset price index',
      question: 'Where do you sit vs competitors?',
      answer: `Index ${compIdx} · ${sign(compIdx - 100)}% vs market median`,
      delta: compIdx - 100,
      deltaUnit: '%',
      status: compIdx > 108 || compIdx < 95 ? 'watch' : 'good',
      detail: { type: 'bars', items: compBars },
    },
    {
      id: 'promo-performance',
      label: 'Promo performance',
      question: 'Is the promo helping or hurting ADR?',
      answer: promos.length ? `${promos.length} active promo${promos.length > 1 ? 's' : ''}${heavyPromo ? ' — deep discount, watch ADR' : ''}` : 'No active promotions',
      status: heavyPromo ? 'watch' : 'good',
      detail: { type: 'list', items: promoItems, empty: 'No promotions running this week.' },
    },
    {
      id: 'review-sentiment',
      label: 'Review sentiment',
      question: 'Any recurring operational issue?',
      answer: themes.length ? `Top issue: "${themes[0].theme}" (${themes[0].count}×)` : 'No recurring negative themes',
      status: themes.length && themes[0].count >= 2 ? 'attention' : 'good',
      detail: {
        type: 'bars',
        items: themes.map((t) => ({ label: t.theme, value: t.count, tone: 'red' })),
        empty: 'Guests are happy — no repeated complaints.',
      },
    },
  ]
}

// ── MONTHLY ────────────────────────────────────────────────────────────
function monthlyCards(property) {
  const rand = rng(hash(property.id + '|monthly'))
  const channels = channelsFor(property.id)
  const rep = reputationFor(property.id)
  const months = MONTHS(6)

  const monthlyRevenue = property.revpar * property.units * 30
  const target = monthlyRevenue
  const revSeries = months.map(() => Math.round(monthlyRevenue * (1 + range(rand, -0.12, 0.16))))
  const revVsBudget = Math.round(((revSeries[5] - target) / target) * 100)

  const revparMoM = Math.round(range(rand, -5, 12))
  const revparSeries = months.map(() => Math.round(property.revpar * (1 + range(rand, -0.12, 0.12))))

  // Channel mix — the showcase visual.
  const channelBars = channels.slice(0, 7).map((c, i) => ({
    label: c.name,
    value: c.revenue,
    display: `${idr(c.revenue, { compact: true })} · ${c.share}%`,
    highlight: i === 0,
    tone: c.name === 'Direct' ? 'green' : 'brand',
    ...withLogo(c.name),
  }))
  const direct = channels.find((c) => c.name === 'Direct')
  const directShare = direct ? direct.share : intRange(rand, 8, 24)
  const directDelta = Math.round(range(rand, -3, 6))
  const directSeries = months.map((_, i) => Math.round(clamp(directShare + (i - 5) * 0.6 + range(rand, -2, 2), 4, 40)))

  const cancelRate = intRange(rand, 4, 14)
  const cancelSeries = months.map(() => intRange(rand, Math.max(2, cancelRate - 4), cancelRate + 4))

  const promos = promotionsFor(property.id).filter((p) => p.status === 'active')
  const promoRoi = +range(rand, 1.5, 4.2).toFixed(1)
  const promoBars = promos.map((p) => ({ label: p.name, value: p.revenue, display: idr(p.revenue, { compact: true }) }))

  const scoreDelta = +(rep.trend[7] - rep.trend[0]).toFixed(1)

  const contentPct = intRange(rand, 60, 98)
  const contentItems = [
    { label: 'Photos (20+ per listing)', done: contentPct > 70 },
    { label: 'Descriptions complete', done: contentPct > 80 },
    { label: 'Amenities up to date', done: contentPct > 85 },
    { label: 'Policies & house rules', done: contentPct > 90 },
  ]

  const breaches = channels.filter((c) => c.parityStatus === 'breach')
  const leakage = breaches.length ? breaches.length * intRange(rand, 1, 3) * 400_000 : 0

  const compIdx = intRange(rand, 95, 112)
  const compSeries = months.map(() => intRange(rand, compIdx - 6, compIdx + 6))

  return [
    {
      id: 'rev-vs-budget',
      label: 'Revenue vs budget',
      question: 'Evaluate the business target',
      answer: `${sign(revVsBudget)}% vs target this month`,
      delta: revVsBudget,
      deltaUnit: '%',
      status: revVsBudget >= 0 ? 'good' : 'attention',
      detail: {
        type: 'colbars',
        items: revSeries.map((v, i) => ({ label: months[i], value: v, display: idr(v, { compact: true }), tone: v >= target ? 'green' : 'red' })),
      },
    },
    {
      id: 'occ-adr-revpar',
      label: 'Occupancy / ADR / RevPAR',
      question: 'Evaluate the revenue strategy',
      answer: `RevPAR ${sign(revparMoM)}% month-over-month`,
      delta: revparMoM,
      deltaUnit: '%',
      status: revparMoM >= 0 ? 'good' : 'watch',
      detail: {
        type: 'stats',
        items: [
          { label: 'Occupancy', value: `${property.occupancy}%` },
          { label: 'ADR', value: idr(property.adr, { compact: true }) },
          { label: 'RevPAR', value: idr(property.revpar, { compact: true }), delta: revparMoM },
        ],
      },
    },
    {
      id: 'net-rev-channel',
      label: 'Net revenue by channel',
      question: 'Evaluate channel quality',
      answer: `${channels[0].name} leads with ${channels[0].share}% of revenue`,
      status: channels[0].share > 45 ? 'watch' : 'good',
      detail: { type: 'bars', items: channelBars },
    },
    {
      id: 'direct-share',
      label: 'Direct booking share · 6 mo',
      question: 'Evaluate brand independence',
      answer: `Direct ${directShare}% (${sign(directDelta)}pts)`,
      delta: directDelta,
      deltaUnit: 'pts',
      status: directShare >= 15 ? 'good' : 'watch',
      detail: { type: 'spark', data: directSeries, caption: 'direct share %, 6 mo', tone: directDelta >= 0 ? 'green' : 'red' },
    },
    {
      id: 'cancel-rate',
      label: 'Cancellation rate · 6 mo',
      question: 'Evaluate booking quality',
      answer: `${cancelRate}% of bookings cancelled`,
      status: cancelRate > 12 ? 'attention' : 'good',
      detail: { type: 'spark', data: cancelSeries, caption: 'cancellation %, 6 mo', tone: cancelRate > 12 ? 'red' : 'brand' },
    },
    {
      id: 'promo-roi',
      label: 'Promo ROI',
      question: 'Evaluate discount effectiveness',
      answer: `Promo ROI ${promoRoi}× this month`,
      status: promoRoi >= 2 ? 'good' : 'watch',
      detail: { type: 'bars', items: promoBars, empty: 'No active promotions to measure.' },
    },
    {
      id: 'review-score',
      label: 'Review score · 8 weeks',
      question: 'Evaluate reputation',
      answer: `Score ${rep.avg10} (${sign(scoreDelta)} over 8 wks)`,
      delta: scoreDelta,
      status: scoreDelta >= 0 ? 'good' : 'watch',
      detail: { type: 'spark', data: rep.trend, caption: 'avg score /10, 8 wks', tone: scoreDelta >= 0 ? 'green' : 'red' },
    },
    {
      id: 'content-completion',
      label: 'Content completion',
      question: 'Evaluate listing quality',
      answer: `Listing ${contentPct}% complete`,
      status: contentPct < 85 ? 'watch' : 'good',
      detail: { type: 'progress', value: contentPct, items: contentItems },
    },
    {
      id: 'rate-leakage',
      label: 'Rate leakage',
      question: 'Measure revenue loss',
      answer: leakage ? `~${idr(leakage, { compact: true })} lost to parity gaps` : 'No rate leakage detected',
      status: leakage ? 'attention' : 'good',
      detail: {
        type: 'list',
        items: breaches.map((c) => ({ title: c.name, sub: 'Price parity breach', right: idr(intRange(rand, 1, 3) * 400_000, { compact: true }), tone: 'red', ...withLogo(c.name) })),
        empty: 'Rates are consistent across channels.',
      },
    },
    {
      id: 'market-share',
      label: 'Market share index · 6 mo',
      question: 'Evaluate competitiveness',
      answer: `Compset index ${compIdx} · ${compIdx >= 100 ? 'above' : 'below'} market`,
      delta: compIdx - 100,
      deltaUnit: '',
      status: compIdx >= 100 ? 'good' : 'watch',
      detail: { type: 'spark', data: compSeries, caption: 'compset index, 6 mo', tone: compIdx >= 100 ? 'green' : 'brand' },
    },
  ]
}

export const KPI_CADENCES = [
  { key: 'daily', label: 'Daily', caption: 'Triage what needs you today' },
  { key: 'weekly', label: 'Weekly', caption: 'Reflect & adjust strategy' },
  { key: 'monthly', label: 'Monthly', caption: 'Evaluate the month' },
]

export function kpiFor(property, cadence, ctx = {}) {
  if (!property) return []
  if (cadence === 'weekly') return weeklyCards(property, ctx)
  if (cadence === 'monthly') return monthlyCards(property)
  return dailyCards(property, ctx)
}
