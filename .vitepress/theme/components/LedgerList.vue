<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { withBase } from 'vitepress'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface LedgerItem {
  title: string
  description: string
  url: string
  date?: string
  year?: string
  dateDisplay?: string
  tags?: string[]
  link?: string
}

const props = withDefaults(
  defineProps<{
    items: LedgerItem[]
    lang?: 'id' | 'en'
  }>(),
  { lang: 'en' }
)

const emptyText =
  props.lang === 'id' ? 'Belum ada yang ditulis di sini.' : 'Nothing written here yet.'
const externalLabel = props.lang === 'id' ? 'Tautan' : 'Link'


const rootEl = ref<HTMLElement>()
let mm: gsap.MatchMedia | undefined

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)
  mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    if (!rootEl.value) return
    const rows = gsap.utils.toArray<HTMLElement>('.ledger__row', rootEl.value)

    rows.forEach((row) => {
      const rule = row.querySelector('.ledger__rule')
      gsap
        .timeline({
          scrollTrigger: { trigger: row, start: 'top 90%', toggleActions: 'play none none none' }
        })
        .from(row, { opacity: 0, y: 22, duration: 0.7, ease: 'power3.out' })
        .from(rule, { scaleX: 0, duration: 0.6, ease: 'power3.out' }, '<0.05')
    })

    requestAnimationFrame(() => ScrollTrigger.refresh())
  })

  mm.add('(prefers-reduced-motion: reduce)', () => {
    if (rootEl.value) {
      gsap.set(rootEl.value.querySelectorAll('.ledger__row'), { opacity: 1, y: 0 })
    }
  })
})

onBeforeUnmount(() => mm?.revert())
</script>

<template>
  <ol ref="rootEl" class="ledger">
    <li v-if="items.length === 0" class="ledger__empty">{{ emptyText }}</li>

    <li v-for="item in items" :key="item.url" class="ledger__row">
      <span class="ledger__rule" aria-hidden="true" />
      <a class="ledger__link" :href="withBase(item.url)">
        <span class="ledger__meta">{{ item.year ?? item.dateDisplay }}</span>

        <span class="ledger__body">
          <span class="ledger__title">{{ item.title }}</span>
          <span class="ledger__desc">{{ item.description }}</span>
          <span v-if="item.tags?.length" class="ledger__tags">
            <span v-for="(tag, i) in item.tags" :key="tag">
              <span v-if="i > 0" class="ledger__dot">&middot;</span>{{ tag }}
            </span>
          </span>
        </span>

        <span class="ledger__arrow" aria-hidden="true">&rarr;</span>
      </a>

      <a
        v-if="item.link"
        class="ledger__external"
        :href="item.link"
        target="_blank"
        rel="noreferrer"
        >{{ externalLabel }} &#8599;</a
      >
    </li>
  </ol>
</template>

<style scoped>
.ledger {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ledger__empty {
  padding: 28px 0;
  color: var(--p-ink-dim);
  font-family: var(--p-font-mono);
  font-size: 0.85rem;
}

.ledger__row {
  position: relative;
  border-top: 1px solid var(--p-line);
}

.ledger__rule {
  position: absolute;
  top: -1px;
  left: 0;
  height: 1px;
  width: 100%;
  background: var(--p-ink);
  transform-origin: left;
  pointer-events: none;
}

.ledger__link {
  display: grid;
  grid-template-columns: 4.5rem 1fr auto;
  align-items: baseline;
  gap: 1.25rem;
  padding: 1.4rem 0.25rem;
  text-decoration: none;
  color: inherit;
}

.ledger__meta {
  font-family: var(--p-font-mono);
  font-size: 0.8rem;
  color: var(--p-ink-dim);
  padding-top: 0.2rem;
}

.ledger__body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.ledger__title {
  font-family: var(--p-font-display);
  font-weight: 600;
  font-size: 1.28rem;
  letter-spacing: -0.01em;
  transition: color var(--p-dur-1) var(--p-ease);
}

.ledger__row:hover .ledger__title,
.ledger__row:focus-within .ledger__title {
  color: var(--p-brass);
}

.ledger__desc {
  color: var(--p-ink-dim);
  font-size: 0.95rem;
  max-width: 46rem;
}

.ledger__tags {
  font-family: var(--p-font-mono);
  font-size: 0.76rem;
  color: var(--p-ink-dim);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 0.15rem;
}

.ledger__dot {
  margin: 0 0.45em;
  opacity: 0.6;
}

.ledger__arrow {
  font-family: var(--p-font-mono);
  color: var(--p-ink-dim);
  transform: translateX(-4px);
  opacity: 0;
  transition:
    transform var(--p-dur-1) var(--p-ease),
    opacity var(--p-dur-1) var(--p-ease);
  padding-top: 0.2rem;
}

.ledger__row:hover .ledger__arrow,
.ledger__row:focus-within .ledger__arrow {
  transform: translateX(0);
  opacity: 1;
}

.ledger__external {
  font-family: var(--p-font-mono);
  font-size: 0.76rem;
  color: var(--p-slate);
  text-decoration: none;
  display: inline-block;
  padding: 0 0.25rem 1rem;
}

.ledger__external:hover {
  color: var(--p-brass);
}

@media (max-width: 640px) {
  .ledger__link {
    grid-template-columns: 1fr auto;
    row-gap: 0.5rem;
  }
  .ledger__meta {
    order: -1;
    grid-column: 1 / -1;
  }
}
</style>