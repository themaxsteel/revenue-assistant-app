import { properties } from './properties'
import { rng, pick, range, intRange, clamp } from './util'

// Reputation / reviews mock. Focused on the review-heavy OTAs an RA actually
// watches. Scores are on each platform's native scale; `norm10` normalises to a
// /10 scale so the portfolio can be averaged across mixed-scale sources.
export const REVIEW_SOURCES = [
  { key: 'booking', name: 'Booking.com', scale: 10 },
  { key: 'airbnb', name: 'Airbnb', scale: 5 },
  { key: 'agoda', name: 'Agoda', scale: 10 },
  { key: 'tripadvisor', name: 'Tripadvisor', scale: 5 },
  { key: 'google', name: 'Google', scale: 5 },
]
export const sourceByKey = Object.fromEntries(REVIEW_SOURCES.map((s) => [s.key, s]))

export const REVIEW_THEMES = [
  'Cleanliness', 'Check-in', 'Location', 'Value', 'Staff',
  'Wi-Fi', 'Air conditioning', 'Noise', 'Breakfast', 'Comfort',
]

const AUTHORS = [
  'Andi', 'Sophie', 'Hiroshi', 'Maria', 'Budi', 'Emma', 'Liam', 'Putri',
  'Chen', 'Olivia', 'Rizal', 'Hannah', 'David', 'Aisyah', 'Noah', 'Clara',
  'Yusuf', 'Mia', 'Lukas', 'Dewi',
]

const POSITIVE = [
  'Spotless room and a wonderful host — would absolutely book again.',
  'Amazing location, walking distance to everything. Loved it.',
  'The staff went above and beyond to make our stay special.',
  'Comfortable bed, great water pressure, and a beautiful view.',
  'Smooth check-in and the place was exactly as pictured.',
]
const NEUTRAL = [
  'Decent stay overall. Nothing fancy but does the job.',
  'Good value for the price, though breakfast was average.',
  'Nice place, but parking was a little tricky to find.',
]
const NEGATIVE = [
  'The air conditioning barely worked during our whole stay.',
  'Check-in took over an hour and no one answered the phone.',
  'Room was not clean on arrival — found hair in the bathroom.',
  'Wi-Fi kept dropping, which made working impossible.',
  'Very noisy at night, could not sleep well.',
]

const THEMES_BY_SENTIMENT = {
  positive: ['Location', 'Staff', 'Cleanliness', 'Comfort', 'Value'],
  neutral: ['Value', 'Breakfast', 'Location'],
  negative: ['Air conditioning', 'Check-in', 'Cleanliness', 'Wi-Fi', 'Noise'],
}

function textFor(sentiment, rand) {
  return pick(rand, sentiment === 'positive' ? POSITIVE : sentiment === 'negative' ? NEGATIVE : NEUTRAL)
}

// Per-property aggregate scores per source + an 8-week trend. Deterministic.
export function reputationFor(id) {
  const p = properties.find((x) => x.id === id)
  const rand = rng(90000 + parseInt(id.slice(-2), 10) * 37)
  const base = p.rating // 0–10 aggregate
  const sources = REVIEW_SOURCES.map((s) => {
    const drift = range(rand, -0.5, 0.4)
    const score =
      s.scale === 10
        ? +clamp(base + drift, 6, 9.9).toFixed(1)
        : +clamp(base / 2 + drift / 2, 3, 5).toFixed(1)
    const norm10 = s.scale === 10 ? score : +(score * 2).toFixed(1)
    return { ...s, score, norm10, reviewCount: intRange(rand, 40, 480) }
  })
  const totalReviews = sources.reduce((a, b) => a + b.reviewCount, 0)
  const avg10 = +(
    sources.reduce((a, b) => a + b.norm10 * b.reviewCount, 0) / totalReviews
  ).toFixed(1)
  const trend = Array.from({ length: 8 }, (_, i) =>
    +clamp(avg10 + range(rand, -0.5, 0.5) + (i - 4) * 0.04, 5, 10).toFixed(1),
  )
  return { sources, totalReviews, avg10, trend }
}

// Flat seed of recent reviews across the whole portfolio.
let rid = 0
function buildReviews() {
  const out = []
  properties.forEach((p, i) => {
    const rand = rng(60000 + i * 53)
    const n = intRange(rand, 3, 6)
    for (let k = 0; k < n; k++) {
      const r = rand()
      const sentiment = r < 0.62 ? 'positive' : r < 0.8 ? 'neutral' : 'negative'
      const src = pick(rand, REVIEW_SOURCES)
      const rating =
        sentiment === 'positive'
          ? src.scale === 10 ? +range(rand, 8.5, 10).toFixed(1) : +range(rand, 4.5, 5).toFixed(1)
          : sentiment === 'neutral'
            ? src.scale === 10 ? +range(rand, 6.5, 8).toFixed(1) : +range(rand, 3.5, 4).toFixed(1)
            : src.scale === 10 ? +range(rand, 3, 6).toFixed(1) : +range(rand, 1.5, 3).toFixed(1)
      // Positives are usually answered; negatives often still need a reply.
      const responded = sentiment === 'negative' ? rand() < 0.35 : rand() < 0.7
      out.push({
        id: `rev-${String(++rid).padStart(3, '0')}`,
        propertyId: p.id,
        source: src.key,
        sourceName: src.name,
        scale: src.scale,
        author: pick(rand, AUTHORS),
        rating,
        sentiment,
        text: textFor(sentiment, rand),
        themes: [pick(rand, THEMES_BY_SENTIMENT[sentiment])],
        daysAgo: intRange(rand, 0, 29),
        responded,
      })
    }
  })
  return out.sort((a, b) => a.daysAgo - b.daysAgo)
}

export const reviewsSeed = buildReviews()
