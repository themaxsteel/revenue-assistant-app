import { defineStore } from 'pinia'

// Persisted configuration for the Portfolio occupancy calendar (the gear popup).
// Kept in a store so the RA's preferences survive reloads (see stores/persist.js).
export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    showData: 'occupancy', // 'occupancy' | 'roomsLeft'
    sortKey: 'priority', // 'priority' | 'occupancy' | 'name'
    groupBy: 'none', // 'none' | 'region' | 'type'
    activeFilter: 'all', // 'all' | 'attention' | 'low' | 'strong'
    showBadges: true, // smart suggestion badges on cells
    compact: false, // denser rows to fit more properties
    weekendShading: true, // shade weekend columns in the daily view
  }),
})
