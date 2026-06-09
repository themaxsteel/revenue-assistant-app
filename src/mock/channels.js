import { propertyById } from './properties'
import { rng, range, intRange } from './util'

// Channel / distribution mix per property. Drives Channels & Distribution tab
// and the portfolio channel-contribution chart in Analytics.
const CHANNELS = [
  'Direct',
  'Booking.com',
  'Agoda',
  'Airbnb',
  'Traveloka',
  'Expedia',
  'Tiket.com',
  'Trip.com',
  'Pegipegi',
  'Tripadvisor',
]

export function channelsFor(id) {
  const p = propertyById(id)
  const rand = rng(40000 + parseInt(id.slice(-2), 10) * 53)
  const weights = CHANNELS.map(() => range(rand, 0.4, 1.6))
  const total = weights.reduce((a, b) => a + b, 0)
  const monthlyRevenue = p.revpar * p.units * 30
  return CHANNELS.map((name, idx) => {
    const share = Math.round((weights[idx] / total) * 100)
    const revenue = Math.round((monthlyRevenue * share) / 100)
    const parityStatus = name === 'Booking.com' && rand() < 0.4 ? 'breach' : 'ok'
    return {
      name,
      bookings: intRange(rand, 4, 60),
      revenue,
      share,
      parityStatus, // 'ok' | 'breach'
      isOpen: !(name === 'Agoda' && rand() < 0.25),
      commission: name === 'Direct' ? 0 : intRange(rand, 12, 20),
    }
  }).sort((a, b) => b.share - a.share)
}

export const channelNames = CHANNELS
