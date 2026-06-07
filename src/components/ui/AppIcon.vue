<script setup>
// Custom icon set for the Revenue Assistant app. Hand-drawn on a 24×24 grid,
// 1.75 stroke, round caps/joins — one cohesive family tuned to the indigo theme,
// instead of mixing generic stock icons. Use: <AppIcon name="today" :size="20" />
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  strokeWidth: { type: [Number, String], default: 1.75 },
})

// Inner SVG markup per icon. Stroke icons inherit stroke=currentColor;
// solid shapes set fill="currentColor" stroke="none" explicitly.
const ICONS = {
  // ── Navigation ──────────────────────────────────────────────
  today: `
    <circle cx="12" cy="12" r="3.6"/>
    <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"/>`,
  portfolio: `
    <rect x="3.5" y="3.5" width="7" height="7" rx="2"/>
    <rect x="13.5" y="3.5" width="7" height="7" rx="2"/>
    <rect x="3.5" y="13.5" width="7" height="7" rx="2"/>
    <rect x="13.5" y="13.5" width="7" height="7" rx="2"/>`,
  agent: `
    <path d="M4.5 17.5C3.1 16.2 2.25 14.35 2.25 12.25C2.25 7.95 6.25 4.5 11.25 4.5C16.25 4.5 20.25 7.95 20.25 12.25C20.25 16.55 16.25 20 11.25 20C9.95 20 8.7 19.75 7.6 19.3L3.25 20.5L4.5 17.5Z"/>
    <path d="M8.25 12.25H8.3M11.25 12.25H11.3M14.25 12.25H14.3" stroke-width="2.2"/>
    <path d="M19 2.75L19.85 4.65L21.75 5.5L19.85 6.35L19 8.25L18.15 6.35L16.25 5.5L18.15 4.65L19 2.75Z"/>`,
  tasks: `
    <path d="M9 4H7.75C6.65 4 5.75 4.9 5.75 6V19C5.75 20.1 6.65 21 7.75 21H16.25C17.35 21 18.25 20.1 18.25 19V6C18.25 4.9 17.35 4 16.25 4H15"/>
    <path d="M9 5.5C9 4.67 9.67 4 10.5 4H13.5C14.33 4 15 4.67 15 5.5V6.25H9V5.5Z"/>
    <path d="M9 11L10.15 12.15L12 10.25"/>
    <path d="M13.75 11.25H16"/>
    <path d="M9 15L10.15 16.15L12 14.25"/>
    <path d="M13.75 15.25H16"/>`,
  reports: `
    <path d="M7 4H14.5L18 7.5V18C18 19.1 17.1 20 16 20H7C5.9 20 5 19.1 5 18V6C5 4.9 5.9 4 7 4Z"/>
    <path d="M14.5 4V7.5H18"/>
    <path d="M8.5 10.5H11"/>
    <path d="M8.5 14H14.5"/>
    <path d="M8.5 17H13"/>
    <path d="M8 2.5H16.5C17.6 2.5 18.5 3.4 18.5 4.5V16" stroke-width="1.4" opacity="0.55"/>`,
  social: `
    <path d="M4.75 15.5C3.65 14.45 3 13.05 3 11.5C3 8.2 6.05 5.5 9.8 5.5C13.55 5.5 16.6 8.2 16.6 11.5C16.6 14.8 13.55 17.5 9.8 17.5C8.9 17.5 8.05 17.35 7.25 17.05L4 18L4.75 15.5Z"/>
    <path d="M9 17.55C10.05 19.25 12.05 20.4 14.35 20.4C15.15 20.4 15.9 20.25 16.6 20L20 21L19.2 18.45C20.3 17.45 21 16.05 21 14.5C21 12.05 19.35 9.95 17 9.05"/>
    <path d="M7.2 11.5H7.25M9.8 11.5H9.85M12.4 11.5H12.45" stroke-width="2.1"/>`,
  analytics: `
    <path d="M4.5 5.5H19.5C20.33 5.5 21 6.17 21 7V17C21 17.83 20.33 18.5 19.5 18.5H4.5C3.67 18.5 3 17.83 3 17V7C3 6.17 3.67 5.5 4.5 5.5Z"/>
    <path d="M6.5 15L10 11.5L13 13.5L17.5 9"/>
    <path d="M17.5 9H14.75"/>
    <path d="M17.5 9V11.75"/>`,
  alerts: `
    <path d="M11.15 4.55L3.3 18.05C2.85 18.83 3.4 19.8 4.3 19.8H19.7C20.6 19.8 21.15 18.83 20.7 18.05L12.85 4.55C12.48 3.9 11.52 3.9 11.15 4.55Z"/>
    <path d="M12 9V13"/>
    <path d="M12 16.25H12.01" stroke-width="2.2"/>`,
  settings: `
    <path d="M12 15.25C13.79 15.25 15.25 13.79 15.25 12C15.25 10.21 13.79 8.75 12 8.75C10.21 8.75 8.75 10.21 8.75 12C8.75 13.79 10.21 15.25 12 15.25Z"/>
    <path d="M19.15 13.65C19.25 13.12 19.25 12.88 19.25 12C19.25 11.12 19.25 10.88 19.15 10.35L21 8.9L19 5.45L16.78 6.35C16.35 6.03 15.87 5.75 15.35 5.55L15 3.2H11L10.65 5.55C10.13 5.75 9.65 6.03 9.22 6.35L7 5.45L5 8.9L6.85 10.35C6.75 10.88 6.75 11.12 6.75 12C6.75 12.88 6.75 13.12 6.85 13.65L5 15.1L7 18.55L9.22 17.65C9.65 17.97 10.13 18.25 10.65 18.45L11 20.8H15L15.35 18.45C15.87 18.25 16.35 17.97 16.78 17.65L19 18.55L21 15.1L19.15 13.65Z"/>`,

  // ── Affordances ─────────────────────────────────────────────
  bell: `
    <path d="M9.3 18.5a2.7 2.7 0 0 0 5.4 0"/>
    <path d="M18 16.5H6l1.5-2.3a2.2 2.2 0 0 0 .35-1.2V10a4.15 4.15 0 1 1 8.3 0v3a2.2 2.2 0 0 0 .35 1.2L18 16.5z"/>`,
  power: `
    <path d="M12 3.5v6.8"/>
    <path d="M7.6 6.7a6.6 6.6 0 1 0 8.8 0"/>`,
  search: `
    <circle cx="11" cy="11" r="6.3"/>
    <path d="M15.8 15.8L20 20"/>`,
  sparkles: `
    <path d="M12 3.5c.45 4.6 1.4 5.55 6 6-4.6.45-5.55 1.4-6 6-.45-4.6-1.4-5.55-6-6 4.6-.45 5.55-1.4 6-6z" fill="currentColor" stroke="none"/>
    <path d="M18.5 13.5c.22 2.1.68 2.55 2.8 2.78-2.12.23-2.58.68-2.8 2.72-.22-2.04-.68-2.49-2.8-2.72 2.12-.23 2.58-.68 2.8-2.78z" fill="currentColor" stroke="none"/>`,
  send: `
    <path d="M12 19.5V5.5"/>
    <path d="M6.5 11L12 5.5 17.5 11"/>`,
  close: `<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>`,
  collapse: `<path d="M13.5 7l-5 5 5 5"/>`,
  expand: `<path d="M10.5 7l5 5-5 5"/>`,
  'chevron-down': `<path d="M7 10l5 5 5-5"/>`,

  // ── Brand mark (ascending revenue bars) ─────────────────────
  logo: `
    <rect x="4" y="12.5" width="3.6" height="6.5" rx="1.6" fill="currentColor" stroke="none"/>
    <rect x="10.2" y="8.5" width="3.6" height="10.5" rx="1.6" fill="currentColor" stroke="none"/>
    <rect x="16.4" y="4.5" width="3.6" height="14.5" rx="1.6" fill="currentColor" stroke="none"/>`,
}

const inner = computed(() => ICONS[props.name] || '')
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="inner"
  />
</template>
