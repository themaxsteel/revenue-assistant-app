import { propertyById, propertyTypeLabel } from './properties'
import { rng, range, intRange } from './util'

// Competitor rate-shopping snapshot for the Compset tab.
const COMP_NAMES = [
  'The Coral Edge', 'Bamboo Sky Retreat', 'Ocean Pulse Villas',
  'Lumbung Stay', 'Tropical Nest', 'Horizon Hideaway',
]

export function compsetFor(id) {
  const p = propertyById(id)
  const rand = rng(30000 + parseInt(id.slice(-2), 10) * 41)
  const you = {
    name: `${p.name} (You)`,
    isYou: true,
    rate: p.adr,
    rating: p.rating,
    distanceKm: 0,
    type: propertyTypeLabel[p.type],
  }
  const comps = COMP_NAMES.slice(0, intRange(rand, 4, 6)).map((name) => {
    const factor = range(rand, 0.82, 1.28)
    return {
      name,
      isYou: false,
      rate: Math.round((p.adr * factor) / 10_000) * 10_000,
      rating: +range(rand, 8.0, 9.5).toFixed(1),
      distanceKm: +range(rand, 0.3, 4.5).toFixed(1),
      type: propertyTypeLabel[p.type],
    }
  })
  const all = [you, ...comps].sort((a, b) => b.rate - a.rate)
  const avgComp = Math.round(comps.reduce((s, c) => s + c.rate, 0) / comps.length)
  const positionPct = Math.round(((p.adr - avgComp) / avgComp) * 100)
  return { rows: all, avgComp, positionPct }
}
