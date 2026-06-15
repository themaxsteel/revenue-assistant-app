// Lightweight Pinia persistence so the prototype survives a reload — applied
// suggestion status, acceptance events, created tasks, rate changes and live
// monitoring all stick. Bump STORAGE_VERSION to invalidate old saved state when
// a mock's shape changes.
const STORAGE_VERSION = 'ra-v1'
const PERSIST = new Set(['agent', 'tasks', 'monitor', 'portfolio', 'calendar'])

export function persistPlugin({ store }) {
  if (!PERSIST.has(store.$id)) return
  const key = `${STORAGE_VERSION}:${store.$id}`

  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      store.$patch(JSON.parse(saved))
    } catch {
      localStorage.removeItem(key)
    }
  }

  store.$subscribe((_mutation, state) => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* quota / serialization issues are non-fatal in the prototype */
    }
  })
}
