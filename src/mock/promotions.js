import { propertyById } from './properties'
import { rng, pick, intRange } from './util'

// Promotions & campaigns per property (CRM/Marketing + Booking Engine driven).
const TEMPLATES = [
  { name: 'Early Bird 15%', type: 'Early booking', discount: 15, status: 'active' },
  { name: 'Last-Minute Deal', type: 'Last minute', discount: 10, status: 'active' },
  { name: 'Stay 3 Pay 2', type: 'Length of stay', discount: 33, status: 'suggested' },
  { name: 'Direct-Only Perk', type: 'Channel exclusive', discount: 8, status: 'suggested' },
  { name: 'Long Weekend Flash', type: 'Flash sale', discount: 12, status: 'draft' },
]
const CHANNELS = ['Direct', 'Booking.com', 'Agoda', 'All channels']

export function promotionsFor(id) {
  const rand = rng(50000 + parseInt(id.slice(-2), 10) * 59)
  const n = intRange(rand, 2, 4)
  return TEMPLATES.slice(0, n).map((t, i) => ({
    id: `promo-${id}-${i}`,
    propertyId: id,
    ...t,
    channel: pick(rand, CHANNELS),
    redemptions: t.status === 'active' ? intRange(rand, 3, 40) : 0,
    revenue: t.status === 'active' ? intRange(rand, 2, 28) * 1_000_000 : 0,
  }))
}
