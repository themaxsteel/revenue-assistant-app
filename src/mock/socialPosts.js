import dayjs from 'dayjs'
import { properties } from './properties'
import { rng, pick, intRange, range } from './util'

// Per-property social feeds for the property-level Social Media tab.
// Images are curated Unsplash hospitality shots; the UI falls back to an
// on-brand gradient if any URL fails to load (offline / removed photo).

export const PLATFORMS = {
  instagram: { key: 'instagram', name: 'Instagram', color: '#e1306c', verb: 'posts' },
  facebook: { key: 'facebook', name: 'Facebook', color: '#1877f2', verb: 'posts' },
  tiktok: { key: 'tiktok', name: 'TikTok', color: '#111827', verb: 'videos' },
}

// Unsplash photo IDs (resort / villa / beach / interior / food).
const PHOTO_IDS = [
  '1566073771259-6a8506099945',
  '1571896349842-33c89424de2d',
  '1582719478250-c89cae4dc85b',
  '1520250497591-112f2f40a3f4',
  '1540541338287-41700207dee6',
  '1564013799919-ab600027ffc6',
  '1505691938895-1758d7feb511',
  '1512917774080-9991f1c4c750',
  '1551882547-ff40c63fe5fa',
  '1507525428034-b723cf961d3e',
  '1518684079-3c830dcef090',
  '1439066615861-d1af74d74000',
  '1414235077428-338989a2e8c0',
  '1455587734955-081b22074882',
  '1571003123894-1f0594d2b5d9',
  '1559599189-fe84dea4eb79',
  '1596394516093-501ba68a0ba6',
  '1502672260266-1c1ef2d93688',
]
function photo(id, size = 600) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${size}&q=70`
}

const CAPTIONS = [
  'Golden hour by the infinity pool 🌅 #villalife',
  'Your private slice of paradise awaits ✨',
  'Fresh catch, served oceanfront 🐟🌊',
  'Waking up to this view never gets old 🏝️',
  'Long weekend? Book direct & save 15% 🎉',
  'Sunset cocktails on the deck 🍹',
  'Tropical mornings, slow living 🌴',
  'Behind the scenes: our private chef experience 👨‍🍳',
  'Hidden gem just steps from the beach 🏖️',
  'Rainforest views from every room 🌿',
  'A romantic escape for two 💕',
  'Dive into the blue 🤿',
]

const TYPES = {
  instagram: ['Photo', 'Carousel', 'Reel', 'Photo', 'Reel'],
  facebook: ['Photo', 'Album', 'Video', 'Photo'],
  tiktok: ['Video', 'Video', 'Video'],
}

function handleFor(name) {
  return '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)
}

// A 7-point trend ending at `value`, consistent with deltaPct (vs 30 days ago).
function trend(rand, value, deltaPct) {
  const start = value / (1 + deltaPct / 100)
  const series = []
  for (let i = 0; i < 7; i++) {
    const t = i / 6
    const base = start + (value - start) * t
    series.push(Math.max(0, Math.round(base * (1 + range(rand, -0.05, 0.05)))))
  }
  series[6] = Math.round(value)
  return { value, deltaPct: +deltaPct.toFixed(1), series }
}

function buildAccount(prop, platformKey, propIndex) {
  const pIndex = Object.keys(PLATFORMS).indexOf(platformKey)
  const rand = rng(200000 + propIndex * 97 + pIndex * 13)
  const followersBase = platformKey === 'instagram' ? [3, 42] : platformKey === 'facebook' ? [2, 28] : [1, 60]
  const followers = intRange(rand, followersBase[0], followersBase[1]) * 1000

  // Build a feed: a couple of scheduled/needs-approval items, then published.
  const posts = []
  const total = intRange(rand, 9, 12)
  for (let i = 0; i < total; i++) {
    const future = i < 2 // first two are upcoming
    const needsApproval = i === 0 && rand() < 0.7
    const type = pick(rand, TYPES[platformKey])
    const reach = intRange(rand, 2, 70) * 1000
    const engagement = +range(rand, 2.2, 13).toFixed(1)
    posts.push({
      id: `${prop.id}-${platformKey}-${i}`,
      propertyId: prop.id,
      platform: platformKey,
      type,
      image: photo(pick(rand, PHOTO_IDS)),
      caption: pick(rand, CAPTIONS),
      postedAt: future
        ? dayjs().add(intRange(rand, 4, 60), 'hour').toISOString()
        : dayjs().subtract(intRange(rand, 1, 40), 'day').toISOString(),
      likes: intRange(rand, 80, 5200),
      comments: intRange(rand, 3, 240),
      reach,
      engagement,
      status: future ? (needsApproval ? 'needs_approval' : 'scheduled') : 'published',
    })
  }

  const postCount = intRange(rand, 60, 480)
  const engagementRate = +range(rand, 2.4, 9.1).toFixed(1)
  const followerGrowthPct = +range(rand, -1.5, 13).toFixed(1)
  const reachMonth = intRange(rand, 8, 180) * 1000

  return {
    platform: platformKey,
    handle: handleFor(prop.name),
    followers,
    postCount,
    engagementRate,
    followerGrowthPct,
    reachMonth,
    automationOn: rand() > 0.15,
    // Per-metric trend (value + delta% + 7-point sparkline) vs last 30 days.
    stats: {
      posts: trend(rand, postCount, range(rand, -4, 28)),
      followers: trend(rand, followers, followerGrowthPct),
      engagement: trend(rand, engagementRate, range(rand, -9, 16)),
      reach: trend(rand, reachMonth, range(rand, -10, 34)),
    },
    posts,
  }
}

// Pre-build every property × platform account once (deterministic).
const ACCOUNTS = {}
properties.forEach((prop, i) => {
  ACCOUNTS[prop.id] = {}
  Object.keys(PLATFORMS).forEach((key) => {
    ACCOUNTS[prop.id][key] = buildAccount(prop, key, i)
  })
})

export function socialFor(propertyId) {
  return ACCOUNTS[propertyId] || null
}

// ── Portfolio-level rollups (single source of truth for the global page) ──
const PLATFORM_KEYS = Object.keys(PLATFORMS)
const PROP_NAME = Object.fromEntries(properties.map((p) => [p.id, p.name]))

function allAccounts() {
  const out = []
  for (const pid of Object.keys(ACCOUNTS))
    for (const k of PLATFORM_KEYS) out.push({ propertyId: pid, ...ACCOUNTS[pid][k] })
  return out
}
const avg = (arr, f) => +(arr.reduce((s, a) => s + f(a), 0) / arr.length).toFixed(1)

// Per-platform performance across the whole portfolio.
export const platformSummary = PLATFORM_KEYS.map((key) => {
  const accts = properties.map((p) => ACCOUNTS[p.id][key])
  return {
    key,
    name: PLATFORMS[key].name,
    color: PLATFORMS[key].color,
    reach: accts.reduce((s, a) => s + a.reachMonth, 0),
    followers: accts.reduce((s, a) => s + a.followers, 0),
    autoPosts: accts.reduce((s, a) => s + a.posts.length, 0),
    engagementRate: avg(accts, (a) => a.engagementRate),
    followerGrowthPct: avg(accts, (a) => a.followerGrowthPct),
  }
})

// Headline numbers for the global summary cards.
export const socialSummary = (() => {
  const accts = allAccounts()
  const reach = accts.reduce((s, a) => s + a.reachMonth, 0)
  return {
    autoPosts: accts.reduce((s, a) => s + a.posts.length, 0),
    reach,
    avgEngagement: avg(accts, (a) => a.engagementRate),
    approvalsPending: accts.reduce(
      (s, a) => s + a.posts.filter((p) => p.status === 'needs_approval').length,
      0,
    ),
    bookingsAttributed: Math.round(reach / 9000),
  }
})()

// One row per property for the breakdown table (aggregated across platforms).
export const propertySocialRows = properties.map((p) => {
  const accts = PLATFORM_KEYS.map((k) => ACCOUNTS[p.id][k])
  const topPlatform = PLATFORM_KEYS[
    accts.reduce((bi, a, i, arr) => (a.reachMonth > arr[bi].reachMonth ? i : bi), 0)
  ]
  return {
    id: p.id,
    name: p.name,
    reach: accts.reduce((s, a) => s + a.reachMonth, 0),
    posts: accts.reduce((s, a) => s + a.posts.length, 0),
    engagementRate: avg(accts, (a) => a.engagementRate),
    followerGrowthPct: avg(accts, (a) => a.followerGrowthPct),
    automationOn: accts.some((a) => a.automationOn),
    topPlatform,
  }
})

// Best published posts across the portfolio (with thumbnails for drill-down).
export function topPosts(limit = 6) {
  return allAccounts()
    .flatMap((a) =>
      a.posts
        .filter((p) => p.status === 'published')
        .map((p) => ({ ...p, propertyName: PROP_NAME[a.propertyId] })),
    )
    .sort((x, y) => y.engagement - x.engagement)
    .slice(0, limit)
}

// Upcoming scheduled / needs-approval posts across the portfolio.
export function socialQueue(limit = 8) {
  return allAccounts()
    .flatMap((a) =>
      a.posts
        .filter((p) => p.status !== 'published')
        .map((p) => ({ ...p, propertyName: PROP_NAME[a.propertyId] })),
    )
    .sort((x, y) => (x.postedAt < y.postedAt ? -1 : 1))
    .slice(0, limit)
}
