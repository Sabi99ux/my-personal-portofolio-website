<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { gsap } from 'gsap'
import { Icon } from '@iconify/vue'

interface TechDef {
  name: string
  icon: string
}

const ICON_ALIASES: Record<string, string> = {
  'c++': 'devicon:cplusplus',
  vitepress: 'simple-icons:vitepress'
}

const props = defineProps<{ items: string[] }>()

const resolved = computed(() =>
  props.items
    .map((raw): TechDef => {
      const normalized = raw.trim().toLowerCase()
      const slug = ICON_ALIASES[normalized] ?? normalized.replace(/\s+/g, '-')
      return { name: raw.trim(), icon: slug.includes(':') ? slug : `logos:${slug}` }
    })
)

const prefersReducedMotion = ref(false)

const displayItems = computed(() =>
  prefersReducedMotion.value ? resolved.value : [...resolved.value, ...resolved.value]
)

const trackEl = ref<HTMLElement>()
let tween: gsap.core.Tween | undefined

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion.value || !trackEl.value || resolved.value.length === 0) return

  tween = gsap.to(trackEl.value, {
    xPercent: -50,
    duration: Math.max(20, resolved.value.length * 5),
    ease: 'none',
    repeat: -1
  })
})

onBeforeUnmount(() => {
  tween?.kill()
})
</script>

<template>
  <div
    v-if="resolved.length"
    class="tech-marquee"
    :class="{ 'is-static': prefersReducedMotion }"
  >
    <div ref="trackEl" class="tech-marquee__track">
      <span
        v-for="(tech, i) in displayItems"
        :key="i"
        class="tech-marquee__item"
        :aria-hidden="i >= resolved.length ? 'true' : undefined"
        :aria-label="i < resolved.length ? tech.name : undefined"
        :title="i < resolved.length ? tech.name : undefined"
        role="img"
      >
        <Icon :icon="tech.icon" class="tech-marquee__icon" aria-hidden="true" />
      </span>
    </div>
  </div>
</template>

<style scoped>
.tech-marquee {
  --tm-fade: clamp(24px, 6vw, 64px);
  overflow: hidden;
  margin-top: 1.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--p-line);
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 var(--tm-fade),
    #000 calc(100% - var(--tm-fade)),
    transparent 100%
  );
  mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 var(--tm-fade),
    #000 calc(100% - var(--tm-fade)),
    transparent 100%
  );
}

.tech-marquee__track {
  display: flex;
  width: max-content;
  gap: clamp(1.5rem, 4vw, 2.75rem);
}

.tech-marquee.is-static .tech-marquee__track {
  flex-wrap: wrap;
  gap: 1.5rem;
}

.tech-marquee__item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: none;
}

.tech-marquee__icon {
  width: clamp(38px, 4vw, 48px);
  height: clamp(38px, 4vw, 48px);
  opacity: 0.85;
  transition:
    opacity 0.3s var(--p-ease),
    transform 0.3s var(--p-ease);
}

.tech-marquee__item:hover .tech-marquee__icon {
  opacity: 1;
  transform: scale(1.08);
}

</style>