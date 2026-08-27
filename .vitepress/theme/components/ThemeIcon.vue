<script setup lang="ts">

withDefaults(
  defineProps<{
    size?: number
    dark?: boolean
  }>(),
  { size: 18, dark: false }
)
</script>

<template>
  <svg
    class="theme-icon"
    :class="{ 'is-dark': dark }"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <g class="theme-icon__sun">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.3" />
      <path
        d="M12 2.5V5M12 19V21.5M21.5 12H19M5 12H2.5M18.36 5.64L16.6 7.4M7.4 16.6L5.64 18.36M18.36 18.36L16.6 16.6M7.4 7.4L5.64 5.64"
        stroke="currentColor"
        stroke-width="1.3"
        stroke-linecap="round"
      />
    </g>
    <path
      class="theme-icon__moon"
      d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z"
      stroke="currentColor"
      stroke-width="1.3"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.theme-icon {
  color: var(--p-ink-dim);
  display: block;
}
.theme-icon__sun,
.theme-icon__moon {
  transition: opacity 0.3s var(--p-ease);
}
.theme-icon__moon {
  opacity: 0;
}
.theme-icon.is-dark .theme-icon__sun {
  opacity: 0;
}
.theme-icon.is-dark .theme-icon__moon {
  opacity: 1;
}
</style>
