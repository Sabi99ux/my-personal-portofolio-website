'use client';

import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { useI18n } from '@/i18n/I18nProvider';
import { useLenis } from '@/hooks/useGsapSmoothScroll';
import { ridgeLine } from '@/lib/ridge';
import type { ProjectCard } from '@/lib/project-posts';
import { ContainerAnimationContext, KineticText } from './KineticText';

// The trail along the bottom edge: drawn and walked as the track travels.
const TRAIL = ridgeLine({ seed: 91, width: 1200, height: 80, base: 0.9, rise: 0.85, peaks: 4.5, jag: 0.3, step: 6 });
const DRAG_THRESHOLD = 6; // px of mouse travel before a press counts as a drag (and swallows the click)

export function ProjectShowcase({ projects }: { projects: ProjectCard[] }) {
  const { t, locale } = useI18n();
  const lenis = useLenis();
  const total = String(projects.length).padStart(2, '0');
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const drag = useRef({ active: false, captured: false, x: 0, scroll: 0, moved: 0 });
  // undefined: not a pinned scroller (reduced motion) · null: pinned scroller still being built · Animation: ready
  const [scrub, setScrub] = useState<gsap.core.Animation | null | undefined>(null);

  useGSAP(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;

    const mm = gsap.matchMedia();
    // matchMedia only calls back when a condition matches, so the reduced-motion case needs its own condition
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', still: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      if (!(ctx.conditions as Record<string, boolean>).motion) {
        setScrub(undefined); // not a pinned scroller: a native, snap-scrolling row (see .work:not(.is-pinned))
        return;
      }
      root.classList.add('is-pinned');

      const panels = gsap.utils.toArray<HTMLElement>('[data-panel]', track);
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      // A paused timeline scrubbed by hand: the trail draws and its marker walks it in step with the track.
      const trail = gsap
        .timeline({ paused: true, defaults: { ease: 'none', duration: 1 } })
        .fromTo(trailRef.current, { drawSVG: '0%' }, { drawSVG: '100%' }, 0)
        .to(markerRef.current, { motionPath: { path: trailRef.current!, alignOrigin: [0.5, 0.5] } }, 0);

      let stops: number[] = []; // scroll progress at which each panel is centred
      let active = -1;
      const measure = () => {
        stops = panels.map((p) => (p.offsetLeft + p.offsetWidth / 2 - window.innerWidth / 2) / (distance() || 1));
      };

      /* The one pin. Everything else below hangs off this tween via containerAnimation. */
      const move = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          id: 'work-pin',
          trigger: root,
          start: 'top top',
          end: () => `+=${distance()}`, // function-based: re-evaluated on every refresh (language, fonts, resize)
          pin: true,
          scrub: true, // Lenis supplies the smoothing
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1, // measured after the hero pin, before everything below
          onRefresh: measure,
          onUpdate: ({ progress }) => {
            trail.progress(progress);
            const nearest = stops.reduce((best, s, i) => (Math.abs(s - progress) < Math.abs(stops[best] - progress) ? i : best), 0);
            if (nearest !== active && counterRef.current) {
              active = nearest;
              counterRef.current.textContent = String(nearest + 1).padStart(2, '0');
            }
          },
        },
      });
      measure();

      // Peaks rise and drift as each panel crosses the viewport (triggers measured in the track's own coordinates).
      panels.forEach((panel) => {
        const driver = { trigger: panel, containerAnimation: move, scrub: true };
        gsap.fromTo(panel.querySelector('[data-drift]'), { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { ...driver, start: 'left right', end: 'right left' } });
        gsap.fromTo(panel.querySelector('[data-rise]'), { yPercent: 16 }, { yPercent: 0, ease: 'none', scrollTrigger: { ...driver, start: 'left 100%', end: 'left 55%' } });
      });

      setScrub(move); // releases the headline reveals that were waiting for a containerAnimation
      return () => {
        root.classList.remove('is-pinned');
        setScrub(null);
      };
    });

    return () => mm.revert();
  }, []);

  /* Tabbing to an off-screen panel must move the PAGE (the track is transformed, not scrolled). */
  const focusPanel = (index: number) => {
    const track = trackRef.current;
    const pin = ScrollTrigger.getById('work-pin');
    const panel = track?.querySelectorAll<HTMLElement>('[data-panel]')[index];
    if (!track || !pin || !panel || !lenis) return;
    const travel = Math.max(0, track.scrollWidth - window.innerWidth);
    const offset = Math.min(travel, Math.max(0, panel.offsetLeft + panel.offsetWidth / 2 - window.innerWidth / 2));
    lenis.scrollTo(pin.start + offset, { duration: 0.9 });
  };

  /* Mouse drag scrolls the pinned track (touch keeps native vertical scrolling). */
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !lenis || !rootRef.current?.classList.contains('is-pinned')) return;
    drag.current = { active: true, captured: false, x: e.clientX, scroll: lenis.scroll, moved: 0 };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || !lenis) return;
    const dx = e.clientX - d.x;
    d.moved = Math.max(d.moved, Math.abs(dx));
    if (!d.captured && d.moved > DRAG_THRESHOLD) {
      d.captured = true; // capture only once it is clearly a drag, so plain clicks still reach the links
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (d.captured) lenis.scrollTo(d.scroll - dx, { immediate: true });
  };
  const endDrag = () => {
    drag.current.active = false;
  };

  return (
    <ContainerAnimationContext.Provider value={scrub}>
      <section ref={rootRef} id="work" aria-label={t.work.title} className="work relative h-svh min-h-[40rem] w-full overflow-clip bg-[var(--bg)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-end justify-between gap-8 px-[5vw] pt-[13vh]">
          <KineticText as="h2" mode="words" className="display max-w-[12ch] text-[clamp(2.5rem,6.2vw,6.5rem)]">
            {t.work.title}
          </KineticText>
          <div className="shrink-0 pb-2 text-right text-sm text-[var(--muted)]">
            <p>{t.work.hint}</p>
            <p className="mt-1 tabular-nums text-[var(--fg)]">
              <span ref={counterRef}>01</span> / {total}
            </p>
          </div>
        </div>

        <div
          ref={trackRef}
          data-track
          data-cursor="drag"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={(e) => {
            if (drag.current.moved > DRAG_THRESHOLD) {
              e.preventDefault();
              e.stopPropagation();
              drag.current.moved = 0;
            }
          }}
          className="relative flex h-full w-max select-none items-end gap-[6vw] px-[5vw] pb-[17vh] pt-[36vh] [touch-action:pan-y]"
        >
          {projects.map((p, i) => {
            const copy = p.copies[locale];
            const projectUrl = `/${locale}/blog/project/${p.slug}`;
            return (
              <article key={p.slug} data-panel className="w-[78vw] shrink-0 md:w-[var(--pw)]" style={{ '--pw': `${[64, 54, 70, 58][i % 4]}vw` } as CSSProperties}>
                <a href={projectUrl} draggable={false} data-cursor="view" data-magnetic onFocus={() => focusPanel(i)} className="group flex items-center justify-center rounded-sm outline-offset-8" style={{ aspectRatio: '1000 / 380' }}>
                  <div data-drift className="flex size-full items-center justify-center">
                    <div data-rise className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] transition-colors group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]" aria-hidden="true">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
                        <path d="m4.5 7.75 7.5 4.5 7.5-4.5M12 12.5V21" />
                      </svg>
                    </div>
                  </div>
                </a>
                <div className="mt-6 flex items-start justify-between gap-8">
                  <div>
                    <a href={projectUrl} className="outline-offset-4">
                      <KineticText as="h3" mode="chars" className="display text-[clamp(2rem,4vw,3.75rem)]">
                        {copy.title}
                      </KineticText>
                    </a>
                    <p className="mt-3 max-w-[36ch] text-[var(--muted)]">{copy.summary}</p>
                  </div>
                  <a href={projectUrl} className="shrink-0 pt-2 text-right text-sm text-[var(--muted)] hover:text-[var(--fg)]">
                    {t.cursor.view}
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <svg data-trail viewBox="0 0 1200 80" className="pointer-events-none absolute inset-x-[5vw] bottom-[4vh] z-10 h-auto w-[90vw]" aria-hidden="true" focusable="false">
          <path d={TRAIL} fill="none" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 8" vectorEffect="non-scaling-stroke" />
          <path ref={trailRef} d={TRAIL} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <g ref={markerRef}>
            <circle r="5" fill="var(--accent)" />
            <circle r="12" fill="none" stroke="var(--accent)" strokeOpacity="0.4" />
          </g>
        </svg>
      </section>
    </ContainerAnimationContext.Provider>
  );
}
