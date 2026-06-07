import dayjs from 'dayjs'
import { properties } from './properties'
import { rng, pick, intRange, range } from './util'

// Social Media Automation performance feed. The automation engine schedules &
// auto-publishes content per property; the RA monitors how it performs.
// Backend: served by the "Social Media Automation for Hospitality" product.

const PLATFORMS = [
  { key: 'instagram', name: 'Instagram', color: '#e1306c' },
  { key: 'facebook', name: 'Facebook', color: '#1877f2' },
  { key: 'tiktok', name: 'TikTok', color: '#111827' },
]

const POST_TYPES = ['Reel', 'Carousel', 'Story', 'Photo', 'Promo']

// Portfolio-level platform performance (this month).
export const platformStats = PLATFORMS.map((p, i) => {
  const rand = rng(110000 + i * 13)
  return {
    ...p,
    autoPosts: intRange(rand, 40, 220),
    reach: intRange(rand, 80, 640) * 1000,
    engagementRate: +range(rand, 2.4, 8.7).toFixed(1),
    followers: intRange(rand, 4, 48) * 1000,
    followerGrowthPct: +range(rand, -1.2, 14).toFixed(1),
  }
})

export const socialSummary = {
  autoPosts: platformStats.reduce((s, p) => s + p.autoPosts, 0),
  reach: platformStats.reduce((s, p) => s + p.reach, 0),
  avgEngagement: +(
    platformStats.reduce((s, p) => s + p.engagementRate, 0) / platformStats.length
  ).toFixed(1),
  bookingsAttributed: intRange(rng(99), 60, 180),
  approvalsPending: intRange(rng(7), 1, 5),
}

// Upcoming auto-scheduled posts queue.
export const scheduledPosts = Array.from({ length: 7 }, (_, i) => {
  const rand = rng(120000 + i * 29)
  const prop = pick(rand, properties)
  const platform = pick(rand, PLATFORMS)
  return {
    id: `sp-${i}`,
    propertyId: prop.id,
    propertyName: prop.name,
    platform: platform.name,
    platformColor: platform.color,
    type: pick(rand, POST_TYPES),
    caption: pick(rand, [
      'Sunset views you cannot miss 🌅',
      'Last rooms for the long weekend — book direct',
      'Behind the scenes: our private chef experience',
      'Why guests keep coming back ✨',
      'Midweek escape, special rate inside',
    ]),
    scheduledAt: dayjs().add(intRange(rand, 1, 72), 'hour').toISOString(),
    status: rand() < 0.25 ? 'needs_approval' : 'scheduled',
  }
})

// Top performing recent posts.
export const topPosts = Array.from({ length: 5 }, (_, i) => {
  const rand = rng(130000 + i * 37)
  const prop = pick(rand, properties)
  const platform = pick(rand, PLATFORMS)
  return {
    id: `tp-${i}`,
    propertyName: prop.name,
    platform: platform.name,
    platformColor: platform.color,
    type: pick(rand, POST_TYPES),
    reach: intRange(rand, 8, 120) * 1000,
    engagement: +range(rand, 3.5, 14).toFixed(1),
    likes: intRange(rand, 200, 9000),
  }
})

// Per-property social health for the breakdown table.
export const propertySocial = properties.map((p, i) => {
  const rand = rng(140000 + i * 41)
  return {
    id: p.id,
    name: p.name,
    autoPosts: intRange(rand, 6, 28),
    engagementRate: +range(rand, 1.8, 9.2).toFixed(1),
    followerGrowthPct: +range(rand, -2, 12).toFixed(1),
    reach: intRange(rand, 4, 90) * 1000,
    automationOn: rand() > 0.12,
  }
})
