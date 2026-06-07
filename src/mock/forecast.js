import dayjs from 'dayjs'
import { propertyById } from './properties'
import { rng, range, clamp, intRange } from './util'

// 30-day forward forecast curve per property: occupancy forecast vs last year,
// daily pickup, and pace. Drives the Demand & Forecast tab and BI charts.

const EVENTS = [
  { offset: 12, label: 'Long weekend' },
  { offset: 24, label: 'Local festival' },
]

export function forecastFor(id) {
  const p = propertyById(id)
  const rand = rng(20000 + parseInt(id.slice(-2), 10) * 31)
  const base = p ? p.occupancy : 70
  return Array.from({ length: 30 }, (_, d) => {
    const date = dayjs().add(d, 'day')
    const weekend = [5, 6].includes(date.day())
    const eventBoost = EVENTS.some((e) => Math.abs(e.offset - d) <= 1) ? 14 : 0
    const occForecast = Math.round(
      clamp(base + (weekend ? 16 : 0) + eventBoost + range(rand, -12, 8), 15, 100),
    )
    const occLY = Math.round(clamp(occForecast - p.paceDelta * 0.6 + range(rand, -8, 8), 12, 100))
    return {
      date: date.format('YYYY-MM-DD'),
      label: date.format('DD MMM'),
      weekend,
      event: EVENTS.find((e) => e.offset === d)?.label || null,
      occForecast,
      occLY,
      pickup: intRange(rand, 0, 5),
    }
  })
}

export function eventsFor() {
  return EVENTS.map((e) => ({ ...e, date: dayjs().add(e.offset, 'day').format('DD MMM') }))
}
