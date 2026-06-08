import dayjs from 'dayjs'
import { properties } from './properties'
import { rng, range, clamp } from './util'

// "Tracked actions" = the closed-loop monitor. After the RA applies an action
// (e.g. a 7-day Holiday Promo discount on Booking.com), it watches the impact
// across a measurement window and lands on a decision: extend / stop / make
// permanent / roll back. Each entry carries a baseline (the 7 days before),
// an explicit success target, and a daily series measured during the window.

function buildSeries(start, baseline, units, { adrPct, occPts, days, rand }) {
  const adr = Math.round((baseline.adr * (1 + adrPct / 100)) / 1000) * 1000
  const out = []
  for (let d = 1; d <= days; d++) {
    const ramp = Math.min(1, d / 2) // effect lands by ~day 2
    const occ = Math.round(clamp(baseline.occupancy + occPts * ramp + range(rand, -2.5, 2.5), 8, 100))
    const revpar = Math.round((adr * occ) / 100)
    out.push({
      day: d,
      date: start.add(d - 1, 'day').toISOString(),
      occupancy: occ,
      adr,
      revpar,
      bookings: Math.max(0, Math.round((units * occ) / 100)),
    })
  }
  return out
}

let n = 0
function build(propId, cfg) {
  n += 1
  const p = properties.find((x) => x.id === propId)
  const rand = rng(90000 + n * 37)
  const baseline = {
    occupancy: p.occupancy,
    adr: p.adr,
    revpar: Math.round((p.adr * p.occupancy) / 100),
    bookingsPerDay: Math.round((p.units * p.occupancy) / 100),
  }
  const start = dayjs().subtract(cfg.elapsed, 'day')
  const seriesDays = Math.min(cfg.elapsed, cfg.windowDays)
  const series =
    cfg.elapsed > 0
      ? buildSeries(start, baseline, p.units, {
          adrPct: cfg.adrPct,
          occPts: cfg.occPts,
          days: seriesDays,
          rand,
        })
      : []
  const ended = cfg.elapsed >= cfg.windowDays
  return {
    id: `mon-${String(n).padStart(3, '0')}`,
    propertyId: propId,
    recId: cfg.recId || null,
    taskId: null,
    title: cfg.title,
    type: cfg.type,
    channel: cfg.channel,
    actionLabel: cfg.actionLabel,
    discountPct: cfg.discountPct || 0,
    windowDays: cfg.windowDays,
    startAt: start.toISOString(),
    endAt: start.add(cfg.windowDays, 'day').toISOString(),
    status: cfg.decision ? 'decided' : ended ? 'ended' : cfg.elapsed <= 0 ? 'scheduled' : 'active',
    decision: cfg.decision || null,
    target: cfg.target,
    baseline,
    units: p.units,
    series,
  }
}

export const trackedActionsSeed = [
  // ⭐ Hero case (CEO example): mid-window, winning.
  build('prop-09', {
    title: 'Holiday Promo −15% · Booking.com',
    type: 'promo',
    channel: 'Booking.com',
    actionLabel: '−15% holiday discount · 7-night window',
    discountPct: 15,
    windowDays: 7,
    elapsed: 3,
    adrPct: -15,
    occPts: 16,
    target: { metric: 'occupancy', label: '+12 pts occupancy', goalDelta: 12 },
  }),
  // Underperforming discount → should prompt a stop/rollback.
  build('prop-02', {
    title: 'Midweek Flash −10% · Agoda',
    type: 'promo',
    channel: 'Agoda',
    actionLabel: '−10% Tue–Thu gap-night filler',
    discountPct: 10,
    windowDays: 7,
    elapsed: 4,
    adrPct: -10,
    occPts: 4,
    target: { metric: 'occupancy', label: '+10 pts occupancy', goalDelta: 10 },
  }),
  // Rate move, mid-window, roughly on track.
  build('prop-01', {
    title: 'Weekend rate +8%',
    type: 'rate_increase',
    channel: 'All channels',
    actionLabel: '+8% Fri–Sun rate',
    discountPct: 0,
    windowDays: 14,
    elapsed: 6,
    adrPct: 8,
    occPts: -3,
    target: { metric: 'revpar', label: '+6% RevPAR', goalDelta: 6, pctMode: true },
  }),
  // Ended → needs a decision (strong winner).
  build('prop-07', {
    title: 'Early-bird 15% promo · Direct + Booking.com',
    type: 'promo',
    channel: 'Direct + Booking.com',
    actionLabel: '−15% for stays 60+ days out',
    discountPct: 15,
    windowDays: 10,
    elapsed: 10,
    adrPct: -15,
    occPts: 18,
    target: { metric: 'occupancy', label: '+14 pts occupancy', goalDelta: 14 },
  }),
  // OTA reopen, mid-window, filling nicely.
  build('prop-05', {
    title: 'Reopened Agoda inventory (30d)',
    type: 'ota_open',
    channel: 'Agoda',
    actionLabel: 'Agoda inventory reopened',
    discountPct: 0,
    windowDays: 14,
    elapsed: 9,
    adrPct: 0,
    occPts: 7,
    target: { metric: 'bookings', label: '+5 bookings/day', goalDelta: 5 },
  }),
  // Already decided → kept permanently.
  build('prop-03', {
    title: 'NYE peak rate +20%',
    type: 'rate_increase',
    channel: 'All channels',
    actionLabel: '+20% for NYE peak',
    discountPct: 0,
    windowDays: 7,
    elapsed: 7,
    decision: 'made_permanent',
    adrPct: 20,
    occPts: -2,
    target: { metric: 'revpar', label: '+15% RevPAR', goalDelta: 15, pctMode: true },
  }),
]

// Pure derivation — single source of truth for every monitor card/page.
export function deriveMonitor(a) {
  const days = a.windowDays
  const elapsed = a.series.length
  const dayOf = Math.min(elapsed, days)
  const current = a.series[a.series.length - 1] || null
  const b = a.baseline

  const occDelta = current ? current.occupancy - b.occupancy : 0
  const adrDeltaPct = current ? ((current.adr - b.adr) / b.adr) * 100 : 0
  const revparDeltaPct = current && b.revpar ? ((current.revpar - b.revpar) / b.revpar) * 100 : 0

  // Net uplift (IDR): Σ (revpar_actual − revpar_baseline) × units over elapsed days.
  // RevPAR already nets out the discount, so this is the honest bottom line.
  const netUplift = a.series.reduce((s, d) => s + (d.revpar - b.revpar) * a.units, 0)
  // Revenue "given away" by the discount, for context.
  const discountCost = a.series.reduce(
    (s, d) => s + Math.max(0, b.adr - d.adr) * Math.round((a.units * d.occupancy) / 100),
    0,
  )

  // Pace toward the explicit target.
  const goal = a.target?.goalDelta ?? 0
  const actualForTarget =
    a.target?.metric === 'occupancy'
      ? occDelta
      : a.target?.metric === 'revpar'
        ? revparDeltaPct
        : a.target?.metric === 'bookings'
          ? current
            ? current.bookings - b.bookingsPerDay
            : 0
          : 0
  const pacePct = goal ? clamp((actualForTarget / goal) * 100, 0, 160) : 0
  const timeFrac = days ? dayOf / days : 0
  let paceState = 'at_risk'
  if (pacePct >= 100) paceState = 'exceeded'
  else if (pacePct >= timeFrac * 80) paceState = 'on_track'

  const ended = a.status === 'ended' || a.status === 'decided' || dayOf >= days

  let verdict
  if (a.status === 'scheduled') verdict = 'scheduled'
  else if (elapsed === 0) verdict = 'starting'
  else if (ended) verdict = revparDeltaPct > 1 ? (pacePct >= 100 ? 'exceeded' : 'succeeded') : 'underperformed'
  else verdict = paceState

  return {
    dayOf,
    days,
    elapsed,
    timeProgressPct: Math.round(timeFrac * 100),
    current,
    baseline: b,
    occDelta,
    adrDeltaPct,
    revparDeltaPct,
    netUplift,
    discountCost,
    actualForTarget,
    goal,
    pacePct: Math.round(pacePct),
    paceState,
    verdict,
    needsDecision: a.status === 'ended' || (a.status === 'active' && dayOf >= days),
    revparSeries: a.series.map((d) => d.revpar),
  }
}

export const VERDICT_META = {
  scheduled: { tone: 'slate', label: 'Scheduled' },
  starting: { tone: 'brand', label: 'Monitoring started' },
  at_risk: { tone: 'amber', label: 'At risk' },
  on_track: { tone: 'brand', label: 'On track' },
  exceeded: { tone: 'green', label: 'Exceeding target' },
  succeeded: { tone: 'green', label: 'Met target' },
  underperformed: { tone: 'red', label: 'Underperformed' },
}

export const DECISION_META = {
  extended: { tone: 'brand', label: 'Extended' },
  stopped: { tone: 'slate', label: 'Stopped' },
  made_permanent: { tone: 'green', label: 'Made permanent' },
  rolled_back: { tone: 'red', label: 'Rolled back' },
}
