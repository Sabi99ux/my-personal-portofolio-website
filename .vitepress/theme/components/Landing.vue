<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import RegMark from './RegMark.vue'
import GithubIcon from './GithubIcon.vue'
import ThemeIcon from './ThemeIcon.vue'
import LedgerList from './LedgerList.vue'
import TechMarquee from './TechMarquee.vue'
import VPNavBarTranslations from 'vitepress/dist/client/theme-default/components/VPNavBarTranslations.vue'

import { data as idProjects } from '../../../id/project/project.data'
import { data as enProjects } from '../../../en/project/project.data'
import { data as zhProjects } from '../../../zh/project/project.data'
import { data as idPosts } from '../../../id/blog/blog.data'
import { data as enPosts } from '../../../en/blog/blog.data'
import { data as zhPosts } from '../../../zh/blog/blog.data'

const UI_TEXT = {
  id: {
    navWork: 'Karya',
    navWriting: 'Tulisan',
    navAbout: 'Tentang',
    aboutEyebrow: 'Tentang',
    aboutSeeAll: 'Baca selengkapnya',
    workEyebrow: 'Project saya',
    workIntro: 'Beberapa proyek yang mewakili cara saya bekerja.',
    workSeeAll: 'Lihat semua karya',
    writingEyebrow: 'Tulisan',
    writingIntro: 'Catatan tentang hal-hal yang sedang saya pelajari.',
    writingSeeAll: 'Lihat semua tulisan',
    contactEyebrow: 'Kontak',
    contactBody: 'Punya proyek atau ide yang ingin didiskusikan? Kirim email.',
    lastBuild: 'Pembaruan terakhir',
    builtWith: 'Dibangun dengan VitePress.',
    langLabel: 'Ganti bahasa'
  },
  en: {
    navWork: 'Work',
    navWriting: 'Writing',
    navAbout: 'About',
    aboutEyebrow: 'About',
    aboutSeeAll: 'Read more',
    workEyebrow: 'My projects',
    workIntro: 'A few projects that represent how I work.',
    workSeeAll: 'See all work',
    writingEyebrow: 'Writing',
    writingIntro: "Notes on things I'm currently learning.",
    writingSeeAll: 'See all writing',
    contactEyebrow: 'Contact',
    contactBody: 'Have a project or an idea worth discussing? Send an email.',
    lastBuild: 'Last build',
    builtWith: 'Built with VitePress.',
    langLabel: 'Change language'
  },
  zh: {
    navWork: '项目',
    navWriting: '文章',
    navAbout: '关于',
    aboutEyebrow: '关于我',
    aboutSeeAll: '了解更多',
    workEyebrow: '我的项目',
    workIntro: '一些能够展现我的思考方式与实践过程的项目。',
    workSeeAll: '查看所有项目',
    writingEyebrow: '文章',
    writingIntro: '记录一些我最近正在学习和探索的东西。',
    writingSeeAll: '查看所有文章',
    contactEyebrow: '联系我',
    contactBody: '有项目或想法想要交流？欢迎给我发邮件。',
    lastBuild: '最后构建',
    builtWith: '使用 VitePress 构建。',
    langLabel: '切换语言'
  }
} as const

const { lang, page, theme, frontmatter, isDark } = useData()
const isId = computed(() => lang.value.startsWith('id'))
const locale = computed<'id' | 'en' | 'zh'>(() => {
  if (isId.value) return 'id'
  return lang.value.startsWith('zh') ? 'zh' : 'en'
})

const projects = computed(() => {
  const items = locale.value === 'id' ? idProjects : locale.value === 'zh' ? zhProjects : enProjects
  return items.slice(0, 3)
})
const posts = computed(() => {
  const items = locale.value === 'id' ? idPosts : locale.value === 'zh' ? zhPosts : enPosts
  return items.slice(0, 3)
})

const githubUrl = computed(
  () =>
    theme.value.socialLinks?.find((socialLink: { icon?: string }) => socialLink.icon === 'github')
      ?.link ?? '#'
)

function toggleTheme() {
  isDark.value = !isDark.value
}
const themeToggleLabel = computed(() =>
  isDark.value ? theme.value.lightModeSwitchTitle : theme.value.darkModeSwitchTitle
)

const copy = computed(() => {
  const fm = frontmatter.value as {
    SiteTitle?: string
    Name?: string
    CopyrightName?: string
    HeaderTitle?: string[]
    tagline?: string
    aboutBody?: string
    specs?: { label: string; value: string }[]
    techStack?: string[]
    email?: string
  }

  return {
    ...(locale.value === 'id' ? UI_TEXT.id : locale.value === 'zh' ? UI_TEXT.zh : UI_TEXT.en),
    siteTitle: fm.SiteTitle ?? '',
    name: fm.Name ?? '',
    copyrightName: fm.CopyrightName ?? '',
    HeaderTitle: fm.HeaderTitle ?? [],
    sub: fm.tagline ?? '',
    aboutBody: fm.aboutBody ?? '',
    specs: fm.specs ?? [],
    techStack: fm.techStack ?? [],
    contactEmail: fm.email ?? '',
    htmlLang: locale.value
  }
})

const lastBuildDisplay = computed(() => {
  if (!page.value.lastUpdated) return null
  return new Intl.DateTimeFormat(locale.value === 'id' ? 'id-ID' : locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    dateStyle: 'medium'
  }).format(new Date(page.value.lastUpdated))
})

const rootEl = ref<HTMLElement>()
const navEl = ref<HTMLElement>()
const heroEl = ref<HTMLElement>()
const marksEl = ref<HTMLElement>()
const eyebrowEl = ref<HTMLElement>()
const titleEl = ref<HTMLElement>()
const subEl = ref<HTMLElement>()

let mm: gsap.MatchMedia | undefined
const magnetCleanups: Array<() => void> = []

function magnetic(el: HTMLElement | undefined, strength = 0.3) {
  if (!el) return
  const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' })
  const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' })

  const onMove = (e: MouseEvent) => {
    const r = el.getBoundingClientRect()
    xTo((e.clientX - r.left - r.width / 2) * strength)
    yTo((e.clientY - r.top - r.height / 2) * strength)
  }
  const onLeave = () => {
    xTo(0)
    yTo(0)
  }

  el.addEventListener('mousemove', onMove)
  el.addEventListener('mouseleave', onLeave)
  magnetCleanups.push(() => {
    el.removeEventListener('mousemove', onMove)
    el.removeEventListener('mouseleave', onLeave)
  })
}

function onAnchorClick(e: MouseEvent) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const anchor = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
  const hash = anchor?.getAttribute('href')
  if (!hash || hash.length < 2) return
  const target = document.querySelector(hash)
  if (!target) return
  e.preventDefault()
  gsap.to(window, {
    duration: 1,
    ease: 'power2.inOut',
    scrollTo: { y: target as HTMLElement, offsetY: navEl.value?.offsetHeight ?? 68 }
  })
}

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrollToPlugin)
  rootEl.value?.addEventListener('click', onAnchorClick)

  mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    let split: SplitText | undefined
    const triggers: ScrollTrigger[] = []

    triggers.push(
      ScrollTrigger.create({
        start: 'top -8',
        end: 999999,
        toggleClass: { targets: navEl.value ?? '', className: 'is-scrolled' }
      })
    )

    if (titleEl.value) {
      split = SplitText.create(titleEl.value, { type: 'chars', mask: 'chars' })
    }

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })

    if (marksEl.value?.children.length) {
      tl.from(marksEl.value.children, { opacity: 0, scale: 0.5, duration: 0.7, stagger: 0.06 }, 0)
    }
    if (eyebrowEl.value) {
      tl.from(eyebrowEl.value, { opacity: 0, y: 16, duration: 0.6 }, 0.15)
    }
    if (split?.chars.length) {
      tl.from(split.chars, { yPercent: 120, opacity: 0, duration: 0.8, stagger: 0.018 }, 0.28)
    }
    if (subEl.value) {
      tl.from(subEl.value, { opacity: 0, y: 16, duration: 0.7 }, '-=0.45')
    }
    if (heroEl.value && marksEl.value) {
      const up = marksEl.value.querySelectorAll('.mark--tl, .mark--bl')
      const down = marksEl.value.querySelectorAll('.mark--tr, .mark--br')
      if (up.length) {
        gsap.to(up, {
          y: -46,
          ease: 'none',
          scrollTrigger: { trigger: heroEl.value, start: 'top top', end: 'bottom top', scrub: 0.6 }
        })
      }
      if (down.length) {
        gsap.to(down, {
          y: 46,
          ease: 'none',
          scrollTrigger: { trigger: heroEl.value, start: 'top top', end: 'bottom top', scrub: 0.6 }
        })
      }
    }

    if (rootEl.value) {
      gsap.utils.toArray<HTMLElement>('[data-reveal]', rootEl.value).forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 26,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        })
      })
    }

    requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      split?.revert()
      triggers.forEach((t) => t.kill())
    }
  })

  mm.add('(prefers-reduced-motion: reduce)', () => {
    if (rootEl.value) {
      gsap.set(rootEl.value.querySelectorAll('[data-reveal]'), { opacity: 1, y: 0 })
    }
  })
})

onBeforeUnmount(() => {
  rootEl.value?.removeEventListener('click', onAnchorClick)
  mm?.revert()
  magnetCleanups.forEach((fn) => fn())
  magnetCleanups.length = 0
})
</script>

<template>
  <div ref="rootEl" class="landing" :lang="copy.htmlLang">
    <nav ref="navEl" class="l-nav">
      <a class="l-nav__brand" :href="withBase(`/${locale}/`)">{{ copy.siteTitle }}</a>

      <div class="l-nav__links">
        <a :href="withBase(`/${locale}/project/`)">{{ copy.navWork }}</a>
        <a :href="withBase(`/${locale}/blog/`)">{{ copy.navWriting }}</a>
        <a :href="withBase(`/${locale}/about`)">{{ copy.navAbout }}</a>
      </div>

      <div class="l-nav__meta">
        <VPNavBarTranslations class="l-nav__translations" />
        <button
          type="button"
          class="l-nav__theme"
          @click="toggleTheme"
          :aria-label="themeToggleLabel"
          :title="themeToggleLabel"
        >
          <ThemeIcon :size="16" :dark="isDark" />
        </button>
        <a
          class="l-nav__github"
          :href="githubUrl"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <GithubIcon :size="18" />
        </a>
      </div>
    </nav>

    <header ref="heroEl" class="l-hero">
      <div ref="marksEl" class="l-hero__marks" aria-hidden="true">
        <RegMark class="mark mark--tl" :size="20" />
        <RegMark class="mark mark--tr" :size="20" />
        <RegMark class="mark mark--bl" :size="20" />
        <RegMark class="mark mark--br" :size="20" />
      </div>

      <p ref="eyebrowEl" class="l-hero__eyebrow">{{ copy.name }}</p>

      <h1 ref="titleEl" class="l-hero__title">
        <span v-for="line in copy.HeaderTitle" :key="line" class="l-hero__line">{{ line }}</span>
      </h1>

      <p ref="subEl" class="l-hero__sub">{{ copy.sub }}</p>

      <div class="l-hero__scrollcue" aria-hidden="true"><span /></div>
    </header>

    <main>
      <section id="about" class="l-section">
        <div class="l-section__head" data-reveal>
          <RegMark :size="14" />
          <span class="l-section__eyebrow">{{ copy.aboutEyebrow }}</span>
        </div>

        <div class="l-about__grid">
          <p class="l-about__body" data-reveal>{{ copy.aboutBody }}</p>

          <dl class="l-about__specs">
            <div v-for="spec in copy.specs" :key="spec.label" class="l-about__spec" data-reveal>
              <dt>{{ spec.label }}</dt>
              <dd>{{ spec.value }}</dd>
            </div>
          </dl>
        </div>

        <TechMarquee v-if="copy.techStack.length" :items="copy.techStack" data-reveal />

        <a
          class="l-section__seeall"
          data-reveal
          :href="withBase(`/${locale}/about`)"
          >{{ copy.aboutSeeAll }} &rarr;</a
        >
      </section>

      <section id="work" class="l-section">
        <div class="l-section__head" data-reveal>
          <RegMark :size="14" />
          <span class="l-section__eyebrow">{{ copy.workEyebrow }}</span>
        </div>
        <p class="l-section__intro" data-reveal>{{ copy.workIntro }}</p>

        <LedgerList :items="projects" :lang="locale" />

        <a class="l-section__seeall" data-reveal :href="withBase(`/${locale}/project/`)"
          >{{ copy.workSeeAll }} &rarr;</a
        >
      </section>

      <section id="writing" class="l-section">
        <div class="l-section__head" data-reveal>
          <RegMark :size="14" />
          <span class="l-section__eyebrow">{{ copy.writingEyebrow }}</span>
        </div>
        <p class="l-section__intro" data-reveal>{{ copy.writingIntro }}</p>

        <LedgerList :items="posts" :lang="locale" />

        <a class="l-section__seeall" data-reveal :href="withBase(`/${locale}/blog/`)"
          >{{ copy.writingSeeAll }} &rarr;</a
        >
      </section>

      <section id="contact" class="l-contact">
        <div class="l-section__head" data-reveal>
          <RegMark :size="14" />
          <span class="l-section__eyebrow">{{ copy.contactEyebrow }}</span>
        </div>

        <p class="l-contact__body" data-reveal>{{ copy.contactBody }}</p>
        <a class="l-contact__email" data-reveal :href="`mailto:${copy.contactEmail}`">{{
          copy.contactEmail
        }}</a>
      </section>
    </main>

    <footer class="l-footer" data-reveal>
      <RegMark :size="14" />
      <span>&copy; {{ new Date().getFullYear() }} {{ copy.copyrightName }}</span>
      <a
        :href="githubUrl"
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub"
      >
        <GithubIcon :size="15" />
      </a>
      <span class="l-footer__spacer" />
      <span class="l-footer__stamp">{{ copy.builtWith }}</span>
      <span v-if="lastBuildDisplay" class="l-footer__stamp"
        >{{ copy.lastBuild }}: {{ lastBuildDisplay }}</span
      >
    </footer>
  </div>
</template>

<style scoped>
.landing {
  --p-nav-h: 68px;
  min-height: 100vh;
  background: var(--p-bg);
  color: var(--p-ink);
  font-family: var(--p-font-body);
}

.landing section[id] {
  scroll-margin-top: var(--p-nav-h);
}

.l-nav {
  position: fixed;
  inset-inline: 0;
  top: 0;
  z-index: 40;
  height: var(--p-nav-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(1.25rem, 4vw, 3rem);
  border-bottom: 1px solid transparent;
  background: transparent;
  backdrop-filter: blur(0px);
  transition:
    background-color 0.4s var(--p-ease),
    border-color 0.4s var(--p-ease),
    backdrop-filter 0.4s var(--p-ease);
}

.l-nav.is-scrolled {
  background: color-mix(in srgb, var(--p-bg) 82%, transparent);
  border-color: var(--p-line);
  backdrop-filter: blur(14px);
}

.l-nav__brand {
  font-family: var(--p-font-mono);
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  text-decoration: none;
  color: var(--p-ink);
}

.l-nav__links {
  display: flex;
  gap: clamp(1.25rem, 3vw, 2.25rem);
  font-size: 0.9rem;
}

.l-nav__links a {
  color: var(--p-ink-dim);
  text-decoration: none;
  transition: color 0.3s var(--p-ease);
}
.l-nav__links a:hover {
  color: var(--p-ink);
}

.l-nav__meta {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.l-nav__translations {
  display: flex;
  align-items: center;
}
.l-nav__translations :deep(.VPMenu) {
  width: max-content;
  min-width: 0;
}

.l-nav__theme {
  display: flex;
  align-items: center;
  color: var(--p-ink-dim);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: color 0.3s var(--p-ease);
}
.l-nav__theme:hover {
  color: var(--p-ink);
}

.l-nav__github {
  color: var(--p-ink-dim);
  display: flex;
  transition: color 0.3s var(--p-ease);
}
.l-nav__github:hover {
  color: var(--p-ink);
}

@media (max-width: 640px) {
  .l-nav__links {
    display: none;
  }
}

.l-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: calc(var(--p-nav-h) + 2rem) clamp(1.25rem, 6vw, 4rem) 4rem;
  max-width: 1240px;
  margin: 0 auto;
}

.l-hero__marks {
  position: absolute;
  inset: clamp(1rem, 4vw, 2.5rem);
  pointer-events: none;
}
.mark {
  position: absolute;
}
.mark--tl {
  top: 0;
  left: 0;
}
.mark--tr {
  top: 0;
  right: 0;
}
.mark--bl {
  bottom: 0;
  left: 0;
}
.mark--br {
  bottom: 0;
  right: 0;
}

.l-hero__eyebrow {
  font-family: var(--p-font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  color: var(--p-brass);
  margin: 0 0 1.25rem;
}

.l-hero__title {
  margin: 0;
  font-family: var(--p-font-display);
  font-weight: 600;
  font-size: clamp(3.25rem, 11vw, 8rem);
  line-height: 0.94;
  letter-spacing: -0.03em;
}

.l-hero__line {
  display: block;
}

.l-hero__sub {
  max-width: 34rem;
  margin: 1.75rem 0 0;
  font-size: clamp(1rem, 1.6vw, 1.2rem);
  color: var(--p-ink-dim);
}

.l-hero__scrollcue {
  position: absolute;
  bottom: clamp(1.5rem, 4vw, 2.5rem);
  left: clamp(1.25rem, 6vw, 4rem);
  width: 1px;
  height: 42px;
  background: var(--p-line-strong);
  overflow: hidden;
}
.l-hero__scrollcue span {
  position: absolute;
  inset: 0;
  background: var(--p-brass);
  transform: translateY(-100%);
  animation: scrollcue 2.4s var(--p-ease) infinite;
}
@keyframes scrollcue {
  0% {
    transform: translateY(-100%);
  }
  50% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .l-hero__scrollcue span {
    animation: none;
    transform: translateY(0);
  }
}

.l-section,
.l-contact {
  max-width: 1240px;
  margin: 0 auto;
  padding: clamp(4rem, 9vw, 7rem) clamp(1.25rem, 6vw, 4rem);
  border-top: 1px solid var(--p-line);
}

.l-section__head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.l-section__eyebrow {
  font-family: var(--p-font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--p-ink-dim);
}

.l-section__intro {
  font-family: var(--p-font-display);
  font-size: clamp(1.4rem, 2.6vw, 2rem);
  font-weight: 500;
  max-width: 34rem;
  margin: 0 0 2.5rem;
  letter-spacing: -0.01em;
}

.l-section__seeall {
  display: inline-block;
  margin-top: 1.75rem;
  font-family: var(--p-font-mono);
  font-size: 0.85rem;
  color: var(--p-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--p-line-strong);
  padding-bottom: 2px;
  transition:
    border-color 0.3s var(--p-ease),
    color 0.3s var(--p-ease);
}
.l-section__seeall:hover {
  border-color: var(--p-brass);
  color: var(--p-brass);
}

.l-about__grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 3rem;
  align-items: start;
}
.l-about__body {
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  line-height: 1.55;
  max-width: 34rem;
  font-family: var(--p-font-display);
  font-weight: 400;
  letter-spacing: -0.005em;
}
.l-about__specs {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  margin: 0;
  border-top: 1px solid var(--p-line);
  padding-top: 1.1rem;
}
.l-about__spec {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.9rem;
}
.l-about__spec dt {
  font-family: var(--p-font-mono);
  color: var(--p-ink-dim);
  text-transform: uppercase;
  font-size: 0.76rem;
  letter-spacing: 0.06em;
  padding-top: 0.15rem;
}
.l-about__spec dd {
  margin: 0;
  text-align: right;
}

@media (max-width: 800px) {
  .l-about__grid {
    grid-template-columns: 1fr;
  }
}

.l-contact__body {
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  max-width: 30rem;
  color: var(--p-ink-dim);
  margin: 0 0 1.5rem;
}
.l-contact__email {
  font-family: var(--p-font-display);
  font-size: clamp(1.75rem, 5vw, 3rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--p-ink);
  text-decoration: none;
  background-image: linear-gradient(var(--p-brass), var(--p-brass));
  background-size: 0% 1px;
  background-repeat: no-repeat;
  background-position: left bottom;
  transition:
    background-size 0.5s var(--p-ease),
    color 0.3s var(--p-ease);
  padding-bottom: 0.15em;
  display: inline-block;
}
.l-contact__email:hover {
  background-size: 100% 1px;
  color: var(--p-brass);
}

.l-footer {
  max-width: 1240px;
  margin: 0 auto;
  padding: 2rem clamp(1.25rem, 6vw, 4rem) 3rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  font-family: var(--p-font-mono);
  font-size: 0.78rem;
  color: var(--p-ink-dim);
}
.l-footer a {
  color: var(--p-ink-dim);
  display: flex;
}
.l-footer a:hover {
  color: var(--p-ink);
}
.l-footer__spacer {
  flex: 1;
}
.l-footer__stamp {
  opacity: 0.75;
}
@media (max-width: 640px) {
  .l-footer__spacer {
    display: none;
  }
}
</style>