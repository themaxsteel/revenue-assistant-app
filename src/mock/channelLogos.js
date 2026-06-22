// Maps channel/OTA names to their logo assets. 'Direct' has no OTA logo —
// it's rendered with the RatePilot brand mark instead.
import bookingLogo from '@/assets/booking-com-logo.png'
import agodaLogo from '@/assets/agoda-logo.png'
import airbnbLogo from '@/assets/airbnb-logo.jpeg'
import travelokaLogo from '@/assets/traveloka-logo.png'
import expediaLogo from '@/assets/expedia-logo.png'
import tiketLogo from '@/assets/tiket-logo.webp'
import tripLogo from '@/assets/trip-logo.webp'
import pegipegiLogo from '@/assets/pegipegi-logo.jpg'
import tripadvisorLogo from '@/assets/tripadvisor-logo.png'

export const channelLogos = {
  'Booking.com': bookingLogo,
  Agoda: agodaLogo,
  Airbnb: airbnbLogo,
  Traveloka: travelokaLogo,
  Expedia: expediaLogo,
  'Tiket.com': tiketLogo,
  'Trip.com': tripLogo,
  Pegipegi: pegipegiLogo,
  Tripadvisor: tripadvisorLogo,
}

// Primary brand colour per channel — used to tint data bars by OTA.
// 'Direct' uses the RatePilot brand purple.
export const channelBrandColors = {
  Direct: '#8c52ff',
  'Booking.com': '#003580',
  Agoda: '#5392F9',
  Airbnb: '#FF5A5F',
  Traveloka: '#38BDF8',
  Expedia: '#FDB933',
  'Tiket.com': '#0064D2',
  'Trip.com': '#287DFA',
  Pegipegi: '#E5097F',
  Tripadvisor: '#34E0A1',
}
