import { defineStore } from 'pinia'

let toastId = 0

export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarCollapsed: false,
    search: '',
    toasts: [],
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    // action (optional): { label, onClick } renders a button (e.g. Undo).
    toast(message, type = 'success', action = null) {
      const id = ++toastId
      this.toasts.push({ id, message, type, action })
      setTimeout(() => this.dismissToast(id), action ? 5000 : 3200)
      return id
    },
    dismissToast(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
  },
})
