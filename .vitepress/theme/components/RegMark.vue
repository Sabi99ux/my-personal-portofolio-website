<script setup lang="ts">

withDefaults(
  defineProps<{
    size?: number
  }>(),
  { size: 18 }
)
</script>

<template>
  <svg
    class="reg-mark"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M12 2 V9 M12 15 V22 M2 12 H9 M15 12 H22"
      stroke="currentColor"
      stroke-width="1"
    />
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1" />
  </svg>
</template>

<style scoped>
.reg-mark {
  color: var(--p-ink-dim);
  opacity: 0.55;
  display: block;
}
</style>
