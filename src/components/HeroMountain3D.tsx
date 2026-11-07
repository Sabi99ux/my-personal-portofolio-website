'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { gsap, useGSAP } from '@/lib/gsap';
import { useI18n } from '@/i18n/I18nProvider';
import { KineticText } from './KineticText';
import type { Hero3DState } from './Hero3DScene';
import {
  getTimePhase,
  WEATHER_PRESETS,
  type TimePhase,
} from '@/lib/weatherPresets';

const Scene = dynamic(() => import('./Hero3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#10132a]" />,
});

// Module scope: cinematic intro must not replay on a language switch.
let introPlayed = false;

// Altitude descends from mountain summit (2400m) to surface of Lake Toba (905m)
const ALTITUDE = { from: 2400, to: 905 };

export function HeroMountain3D() {
  const { t } = useI18n();
  const rootRef = useRef<HTMLElement>(null);
  const delay = introPlayed ? 0 : 1.15;

  // Keep a ref to the current scroll label so ScrollTrigger.onUpdate has it without re-creating the timeline
  const scrollLabelRef = useRef(t.hero.scroll);
  useEffect(() => {
    scrollLabelRef.current = t.hero.scroll;
  }, [t.hero.scroll]);

  // ── Automatic Device Time Detection (Otomatis 100% mengikuti jam perangkat) ──
  const [timePhase, setTimePhase] = useState<TimePhase>('malam');

  useEffect(() => {
    const syncDeviceTime = () => {
      setTimePhase(getTimePhase(new Date()));
    };
    syncDeviceTime();
    const interval = setInterval(syncDeviceTime, 30000); // periksa setiap 30 detik
    return () => clearInterval(interval);
  }, []);

  const preset = WEATHER_PRESETS[timePhase] || WEATHER_PRESETS.malam;

  // Mutable state shared with R3F canvas (no re-renders of the 3D scene)
  const state = useMemo<Hero3DState>(
    () => ({
      progress: 0,
      introProgress: introPlayed ? 1 : 0,
      phase: timePhase,
    }),
    [],
  );

  // Sync state.phase with detected time
  useEffect(() => {
    state.phase = timePhase;
  }, [timePhase, state]);

  // useGSAP must only run once on mount (dependency array []).
  // Language changes only re-mount KineticText and update text nodes, without re-pinning or breaking ScrollTrigger.
  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;
    const one = <T extends Element>(s: string) => root.querySelector<T>(s)!;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const cta            = one<HTMLElement>('[data-cta]');
      const gauge          = one<HTMLElement>('[data-gauge]');
      const altitude       = one<HTMLElement>('[data-altitude]');
      const altitudeLabel  = one<HTMLElement>('[data-altitude-label]');
      const hint           = one<HTMLElement>('[data-hint]');
      const title          = one<HTMLElement>('[data-title]');
      const copy           = one<HTMLElement>('[data-copy]');
      const lakeTransition = one<HTMLElement>('[data-lake-transition]');

      /* 1 ─ cinematic intro: camera pulls back, overlays stagger in */
      if (!introPlayed) {
        gsap
          .timeline({ onComplete: () => { introPlayed = true; } })
          .to(state, { introProgress: 1, duration: 2.8, ease: 'power2.out' }, 0)
          .fromTo([cta, gauge], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.12 }, 1.6)
          .fromTo(hint, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 2.2)
          .to(hint, { autoAlpha: 0, duration: 0.6 }, 5.5);
      } else {
        gsap.set([cta, gauge], { autoAlpha: 1 });
      }

      /* 2 ─ pinned scroll dive: camera swoops down toward the lake and seamlessly merges into the next section */
      gsap
        .timeline({
          defaults: { ease: 'none', duration: 1 },
          scrollTrigger: {
            id: 'hero-pin',
            trigger: root,
            start: 'top top',
            end: '+=180%',
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 2,
            onUpdate: ({ progress: p }) => {
              state.progress = p;

              // Descent countdown from 2400m to 905m (Lake Toba altitude)
              const currentAlt = Math.round(ALTITUDE.from - p * (ALTITUDE.from - ALTITUDE.to));
              if (altitude) {
                altitude.textContent = String(currentAlt).padStart(4, '0');
              }

              if (altitudeLabel) {
                altitudeLabel.textContent = p > 0.75 ? 'Danau Toba' : scrollLabelRef.current;
              }
            },
          },
        })
        // Fade out headlines early so viewport is clear for the lake dive
        .to(title, { autoAlpha: 0, y: -50, scale: 0.94, duration: 0.35, ease: 'power1.in' }, 0)
        .to(copy, { autoAlpha: 0, y: -30, duration: 0.28 }, 0)
        .to(hint, { autoAlpha: 0, duration: 0.15 }, 0)
        .to(gauge, { autoAlpha: 0, duration: 0.2 }, 0.82)
        // Seamless transition overlay: as camera skims the water surface, screen melts into #10132a
        .fromTo(
          lakeTransition,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.3, ease: 'power2.inOut' },
          0.7
        );
    });

    root.dataset.ready = '';
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="top"
      data-hero
      className="relative h-svh min-h-[40rem] w-full overflow-clip transition-colors duration-1000"
      style={{ backgroundColor: preset.bgColor }}
    >
      {/* ── 3D interactive canvas with dynamic lighting ── */}
      <div className="absolute inset-0 z-[1] cursor-grab active:cursor-grabbing">
        <Scene state={state} phase={timePhase} />
      </div>

      {/* ── gradient veil for text readability ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            'linear-gradient(to top, rgba(16,19,42,0.65) 0%, transparent 35%, transparent 70%, rgba(16,19,42,0.35) 100%)',
        }}
      />

      {/* ── seamless lake transition layer (blends 100% into the next #work section background #10132a) ── */}
      <div
        data-lake-transition
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[8] opacity-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(16, 19, 42, 0.45) 30%, #10132a 85%)',
        }}
      />

      {/* ── headline ── */}
      <div
        data-title
        className="absolute inset-x-0 top-[17%] z-[4] flex justify-center px-[5vw] text-center will-change-transform pointer-events-none"
        style={{ '--title': '#f6efe2' } as React.CSSProperties}
      >
        <KineticText as="h1" mode="lines" on="load" delay={delay} className="hero-title mx-auto max-w-[14ch] text-balance">
          {t.hero.title}
        </KineticText>
      </div>

      {/* ── copy + CTA ── */}
      <div data-copy className="absolute bottom-[6%] left-[5vw] z-10 flex max-w-[30rem] flex-col items-start gap-6">
        <KineticText
          as="p"
          mode="fade"
          on="load"
          delay={delay + 0.9}
          className="text-[clamp(1rem,1.15vw,1.2rem)] leading-relaxed text-[#c8c4d6] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
        >
          {t.hero.sub}
        </KineticText>
        <a data-cta data-magnetic href="#work" className="cta shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          {t.hero.cta}
        </a>
      </div>

      {/* ── altitude gauge (counts down to Lake Toba surface) ── */}
      <div data-gauge className="pointer-events-none absolute bottom-[6%] right-[5vw] z-10 text-right tabular-nums">
        <p className="text-sm text-[#9a9bb8]">{t.hero.altitude}</p>
        <p className="text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-none text-[#e9e6f2]">
          <span data-altitude>{ALTITUDE.from}</span>
          <span className="ml-1 text-[0.4em] text-[#9a9bb8]">m</span>
        </p>
        <p data-altitude-label className="mt-3 text-sm text-[#9a9bb8] transition-colors duration-300">
          {t.hero.scroll}
        </p>
      </div>

      {/* ── interaction hint (auto-dismisses after a few seconds) ── */}
      <div data-hint className="pointer-events-none absolute bottom-[18%] left-1/2 z-10 -translate-x-1/2 opacity-0">
        <p className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/70 backdrop-blur-sm border border-white/10">
          🖱️ Drag to rotate · Scroll to dive to the lake
        </p>
      </div>
    </section>
  );
}
