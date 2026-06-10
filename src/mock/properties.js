import { rng, intRange, range, clamp } from './util'

// Curated Unsplash hospitality shots (villas, resorts, tropical stays). Assigned
// deterministically per property so each card keeps the same photo. The UI falls
// back to an on-brand gradient if a URL fails to load (offline / removed photo).
const PHOTO_IDS = [
  '1566073771259-6a8506099945', '1571896349842-33c89424de2d', '1582719478250-c89cae4dc85b',
  '1520250497591-112f2f40a3f4', '1540541338287-41700207dee6', '1564013799919-ab600027ffc6',
  '1505691938895-1758d7feb511', '1512917774080-9991f1c4c750', '1551882547-ff40c63fe5fa',
  '1507525428034-b723cf961d3e', '1518684079-3c830dcef090', '1439066615861-d1af74d74000',
  '1596394516093-501ba68a0ba6', '1455587734955-081b22074882', '1571003123894-1f0594d2b5d9',
  '1559599189-fe84dea4eb79', '1502672260266-1c1ef2d93688', '1520637736862-4d197d17c52a',
  '1521783988139-89397d761dce', '1470770841072-f978cf4d019e',
]
function propertyPhoto(i, size = 640) {
  return `https://images.unsplash.com/photo-${PHOTO_IDS[i % PHOTO_IDS.length]}?auto=format&fit=crop&w=${size}&q=70`
}

// 20 small properties across Indonesian leisure destinations.
const NAMES = [
  ['Uluwatu Cliff Villas', 'villa', 'Bali — Uluwatu'],
  ['Canggu Surf Guesthouse', 'guesthouse', 'Bali — Canggu'],
  ['Ubud Rice Terrace Villa', 'villa', 'Bali — Ubud'],
  ['Seminyak Beach Retreat', 'boutique', 'Bali — Seminyak'],
  ['Sanur Garden Bungalows', 'guesthouse', 'Bali — Sanur'],
  ['Nusa Penida Ocean Villa', 'villa', 'Bali — Nusa Penida'],
  ['Gili Air Beach House', 'villa', 'Lombok — Gili Air'],
  ['Kuta Lombok Boutique', 'boutique', 'Lombok — Kuta'],
  ['Labuan Bajo Hilltop Villa', 'villa', 'Flores — Labuan Bajo'],
  ['Komodo View Guesthouse', 'guesthouse', 'Flores — Labuan Bajo'],
  ['Yogyakarta Heritage House', 'boutique', 'Yogyakarta — Prawirotaman'],
  ['Borobudur Sunrise Villa', 'villa', 'Yogyakarta — Magelang'],
  ['Bandung Highland Lodge', 'guesthouse', 'West Java — Lembang'],
  ['Dieng Plateau Cabins', 'guesthouse', 'Central Java — Dieng'],
  ['Bromo Caldera Retreat', 'boutique', 'East Java — Bromo'],
  ['Raja Ampat Dive Villa', 'villa', 'West Papua — Raja Ampat'],
  ['Toba Lakeside Cottage', 'guesthouse', 'North Sumatra — Lake Toba'],
  ['Mentawai Surf Lodge', 'boutique', 'West Sumatra — Mentawai'],
  ['Belitung Coral Villa', 'villa', 'Belitung — Tanjung Tinggi'],
  ['Bukit Lawang Jungle Stay', 'guesthouse', 'North Sumatra — Bukit Lawang'],
]

const UNITS = { villa: [3, 8], guesthouse: [6, 16], boutique: [12, 28] }

const OWNERS = [
  'Pak Wayan', 'Bu Sari', 'Mr. Tanaka', 'Ms. Clara', 'Pak Budi', 'Bu Indah',
  'Mr. Lukas', 'Ms. Aisyah', 'Pak Gede', 'Bu Maya', 'Mr. Chen', 'Ms. Putri',
  'Pak Rizal', 'Bu Dewi', 'Mr. Adi', 'Ms. Hana', 'Pak Eko', 'Bu Ratna',
  'Mr. Yusuf', 'Bu Lina',
]

function healthFrom(occ, paceDelta, alerts) {
  let score = 60 + (occ - 70) * 0.8 + paceDelta * 1.2 - alerts * 6
  return Math.round(clamp(score, 18, 99))
}

export const properties = NAMES.map(([name, type, city], i) => {
  const rand = rng(1000 + i * 7)
  const [umin, umax] = UNITS[type]
  const units = intRange(rand, umin, umax)
  const occupancy = Math.round(range(rand, 48, 94))
  const adr = Math.round(
    (type === 'villa' ? range(rand, 1_400_000, 4_200_000)
      : type === 'boutique' ? range(rand, 650_000, 1_500_000)
      : range(rand, 380_000, 850_000)) / 10_000,
  ) * 10_000
  const revpar = Math.round((adr * occupancy) / 100)
  const paceDelta = Math.round(range(rand, -14, 22)) // % vs last year
  const pickup7d = Math.round(range(rand, -8, 26)) // rooms picked up last 7d trend
  const alertCount = rand() < 0.35 ? intRange(rand, 1, 3) : 0
  const sparkline = Array.from({ length: 12 }, () =>
    Math.round(clamp(occupancy + range(rand, -18, 18), 20, 100)),
  )

  return {
    id: `prop-${String(i + 1).padStart(2, '0')}`,
    name,
    type,
    city,
    image: propertyPhoto(i),
    units,
    occupancy,
    adr,
    revpar,
    paceDelta,
    pickup7d,
    alertCount,
    healthScore: healthFrom(occupancy, paceDelta, alertCount),
    ownerName: OWNERS[i],
    ownerPhone: `+62 81${intRange(rand, 10, 99)}-${intRange(rand, 1000, 9999)}-${intRange(rand, 1000, 9999)}`,
    raId: 'ra-01',
    sparkline,
    minStay: type === 'villa' ? intRange(rand, 1, 3) : 1,
    rating: +range(rand, 8.3, 9.6).toFixed(1),
  }
})

export function propertyById(id) {
  return properties.find((p) => p.id === id)
}

export const propertyTypeLabel = {
  villa: 'Villa',
  guesthouse: 'Guesthouse',
  boutique: 'Boutique Hotel',
}
