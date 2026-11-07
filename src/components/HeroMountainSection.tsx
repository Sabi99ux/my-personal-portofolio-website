'use client';

import { useRef } from 'react';
import { gsap, prefersReducedMotion, useGSAP } from '@/lib/gsap';
import { useI18n } from '@/i18n/I18nProvider';
import { ridgeFill, ridgeLine, type RidgeOptions } from '@/lib/ridge';
import { KineticText } from './KineticText';

/* ───────────────────────────── scene definition ───────────────────────────── */

interface LayerDef extends RidgeOptions {
  key: string;
  /** 0 = far haze, 1 = foreground. Drives scroll travel, scale and pointer parallax. */
  depth: number;
  z: number;
  /** rim-light opacity along the crest */
  rim: number;
}

// z-order: far(1) mid-a(2) mid-b(3) → HEADLINE(4) → near-a(5) → mist(6) → near-b(7) → fore(8) → copy(10)
const DEFS: LayerDef[] = [
  { key: 'far', depth: 0.08, z: 1, seed: 3, base: 0.52, rise: 0.46, peaks: 6.5, jag: 0.35, rim: 0.5 },
  { key: 'mid-a', depth: 0.22, z: 2, seed: 17, base: 0.6, rise: 0.5, peaks: 5.2, jag: 0.45, rim: 0.4 },
  { key: 'mid-b', depth: 0.4, z: 3, seed: 29, base: 0.68, rise: 0.52, peaks: 4.2, jag: 0.55, rim: 0.3 },
  { key: 'near-a', depth: 0.6, z: 5, seed: 41, base: 0.78, rise: 0.46, peaks: 3.4, jag: 0.6, rim: 0.18 },
  { key: 'near-b', depth: 0.8, z: 7, seed: 53, base: 0.88, rise: 0.38, peaks: 2.8, jag: 0.65, rim: 0.1 },
  { key: 'fore', depth: 1, z: 8, seed: 67, base: 0.97, rise: 0.22, peaks: 7, jag: 0.9, rim: 0 },
];

// Computed once at import. Deterministic, so server HTML and client render are identical (no hydration drift).
const LAYERS = DEFS.map((def) => ({ ...def, fill: ridgeFill(def, 1), line: ridgeLine(def) }));

const ALTITUDE = { from: 1200, to: 3142 }; // metres, read out while climbing

// Module scope on purpose: a language switch re-mounts the headline, and the cinematic intro must not replay.
let introPlayed = false;

/* ─────────────────────────────── mist particles ───────────────────────────── */

interface Puff {
  x: number;
  y: number;
  r: number;
  speed: number;
  alpha: number;
  phase: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
}

/** Soft fog banks drifting across the ridges. The pointer acts as wind; springs pull each puff back. */
function Mist() {
  const ref = useRef<HTMLCanvasElement>(null);

  useGSAP(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || prefersReducedMotion()) return;

    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 128;
    const pointer = { x: -9999, y: -9999 };
    let puffs: Puff[] = [];
    let w = 0;
    let h = 0;
    let visible = true;

    // Tinted from the --mist CSS variable, so the fog follows the dark/light theme.
    const bake = () => {
      const [r, g, b] = (getComputedStyle(document.documentElement).getPropertyValue('--mist').trim() || '214 224 250').split(/\s+/);
      const s = sprite.getContext('2d')!;
      const grad = s.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.55)`);
      grad.addColorStop(0.55, `rgba(${r},${g},${b},0.16)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      s.clearRect(0, 0, 128, 128);
      s.fillStyle = grad;
      s.fillRect(0, 0, 128, 128);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      puffs = Array.from({ length: Math.round(gsap.utils.clamp(10, 26, w / 70)) }, () => {
        const r = gsap.utils.random(w * 0.14, w * 0.32);
        return {
          x: gsap.utils.random(0, w),
          y: gsap.utils.random(h * 0.4, h * 0.95),
          r,
          speed: gsap.utils.random(5, 20),
          alpha: gsap.utils.random(0.35, 0.8),
          phase: gsap.utils.random(0, 6.28),
          ox: 0,
          oy: 0,
          vx: 0,
          vy: 0,
        };
      });
    };

    const tick = (time: number, deltaMs: number) => {
      if (!visible) return;
      const dt = Math.min(deltaMs, 50) / 1000;
      const reach = Math.max(200, w * 0.16);
      ctx.clearRect(0, 0, w, h);
      for (const p of puffs) {
        p.x += p.speed * dt;
        if (p.x - p.r > w) p.x = -p.r;
        const dx = p.x + p.ox - pointer.x;
        const dy = p.y + p.oy - pointer.y;
        const dist = Math.hypot(dx, dy) || 1;
        const wind = dist < reach ? 1 - dist / reach : 0;
        p.vx += ((dx / dist) * wind * 1400 - p.ox * 5 - p.vx * 2.6) * dt;
        p.vy += ((dy / dist) * wind * 1400 - p.oy * 5 - p.vy * 2.6) * dt;
        p.ox += p.vx * dt;
        p.oy += p.vy * dt;
        ctx.globalAlpha = p.alpha;
        const bob = Math.sin(time * 0.35 + p.phase) * 10;
        ctx.drawImage(sprite, p.x + p.ox - p.r, p.y + p.oy + bob - p.r * 0.55, p.r * 2, p.r * 1.1);
      }
    };

    const onMove = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      pointer.x = e.clientX - b.left;
      pointer.y = e.clientY - b.top;
    };

    bake();
    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);
    const visibleObs = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibleObs.observe(canvas);
    const themeObs = new MutationObserver(bake);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('pointermove', onMove, { passive: true });
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', onMove);
      resizeObs.disconnect();
      visibleObs.disconnect();
      themeObs.disconnect();
    };
  }, []);

  return <canvas ref={ref} data-mist aria-hidden className="pointer-events-none absolute inset-0 z-[6] size-full" />;
}

/* ───────────────────────────────── the hero ───────────────────────────────── */

export function HeroMountainSection() {
  const { t } = useI18n();
  const rootRef = useRef<HTMLElement>(null);
  const delay = introPlayed ? 0 : 1.15;

  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;
    const one = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
    const many = <T extends Element>(selector: string) => gsap.utils.toArray<T>(selector, root);

    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', fine: '(hover: hover) and (pointer: fine)' }, (ctx) => {
      const { motion, fine } = ctx.conditions as Record<string, boolean>;
      if (!motion) return; // reduced motion: the finished, static scene

      const layers = many<HTMLElement>('[data-layer]');
      const arts = many<SVGSVGElement>('[data-art]');
      const [sky, dusk, sun, title, mist, lantern] = ['sky', 'dusk', 'sun', 'title', 'mist', 'lantern'].map((n) => one<HTMLElement>(`[data-${n}]`));
      const [copy, cta, gauge, altitude] = ['copy', 'cta', 'gauge', 'altitude'].map((n) => one<HTMLElement>(`[data-${n}]`));

      /* 1 ─ the one orchestrated moment: dawn breaks, ridges rise far → near, copy settles last */
      gsap
        .timeline({ defaults: { ease: 'expo.out' }, onComplete: () => (introPlayed = true) })
        .fromTo(sky, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.6, ease: 'power2.out' }, 0)
        .fromTo(sun, { autoAlpha: 0, yPercent: 22 }, { autoAlpha: 1, yPercent: 0, duration: 2.4 }, 0.1)
        .fromTo(layers, { autoAlpha: 0, yPercent: 16 }, { autoAlpha: 1, yPercent: 0, duration: 1.8, stagger: 0.14 }, 0.2)
        .fromTo(mist, { autoAlpha: 0 }, { autoAlpha: 1, duration: 2.4, ease: 'power1.out' }, 0.8)
        .fromTo([cta, gauge], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.12 }, 1.6);

      /* 2 ─ pinned climb: near ridges rise and swell, swallowing the headline as it condenses and scales */
      const climb = gsap.timeline({
        defaults: { ease: 'none', duration: 1 },
        scrollTrigger: {
          id: 'hero-pin',
          trigger: root,
          start: 'top top',
          end: '+=150%',
          pin: true,
          scrub: 0.5, // Lenis already smooths the scroll; a little extra scrub only adds weight
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 2, // the topmost pin must be measured first
          onUpdate: ({ progress }) => {
            altitude.textContent = String(Math.round(ALTITUDE.from + progress * (ALTITUDE.to - ALTITUDE.from))).padStart(4, '0');
          },
        },
      });
      arts.forEach((art, i) => {
        const { depth } = LAYERS[i];
        climb.to(art, { yPercent: -30 * depth, scale: 1 + 0.5 * depth, transformOrigin: '50% 100%' }, 0);
      });
      climb
        .fromTo(title, { scale: 1, yPercent: 0, fontVariationSettings: "'wdth' 100" }, { scale: 1.55, yPercent: -8, fontVariationSettings: "'wdth' 76", transformOrigin: '50% 100%' }, 0)
        .to(title, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 0.7)
        .to(sun, { y: () => window.innerHeight * 0.22 }, 0)
        .to(dusk, { autoAlpha: 1 }, 0)
        .to(copy, { autoAlpha: 0, y: -48, duration: 0.25 }, 0);

      /* 3 ─ lighting: layers drift against the pointer (deeper = further), a lantern glow follows it */
      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        drift.forEach(({ depth, x, y }) => {
          x(-nx * 56 * depth);
          y(-ny * 20 * depth);
        });
        titleX(nx * 18);
        sunX(-nx * 80);
        if (!lit) {
          lit = true;
          gsap.set(lantern, { x: e.clientX, y: e.clientY });
          gsap.to(lantern, { autoAlpha: 1, duration: 1.2 });
        }
        lanternX(e.clientX);
        lanternY(e.clientY);
      };
      let lit = false;
      const drift = layers.map((el, i) => {
        const { depth } = LAYERS[i];
        const to = { duration: 1.6 - depth * 0.9, ease: 'power3' };
        return { depth, x: gsap.quickTo(el, 'x', to), y: gsap.quickTo(el, 'y', to) };
      });
      const titleX = gsap.quickTo(title, 'x', { duration: 1.2, ease: 'power3' });
      const sunX = gsap.quickTo(sun, 'x', { duration: 1.8, ease: 'power3' });
      const lanternX = gsap.quickTo(lantern, 'x', { duration: 0.7, ease: 'power3' });
      const lanternY = gsap.quickTo(lantern, 'y', { duration: 0.7, ease: 'power3' });
      if (fine) window.addEventListener('pointermove', onMove, { passive: true });

      return () => window.removeEventListener('pointermove', onMove);
    });

    root.dataset.ready = ''; // lifts the CSS "hidden until GSAP owns the state" gate (prevents a flash of the finished scene)
    return () => mm.revert();
  }, []);

  return (
    <section ref={rootRef} id="top" data-hero className="relative h-svh min-h-[40rem] w-full overflow-clip bg-[var(--bg)]">
      <div data-sky className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, var(--sky-0) 0%, var(--sky-1) 52%, var(--sky-2) 100%)' }} />
      <div data-dusk className="absolute inset-0 opacity-0" style={{ background: 'linear-gradient(to bottom, var(--dusk-0), var(--dusk-1))' }} />
      <div
        data-sun
        className="absolute aspect-square w-[72vmax] rounded-full"
        style={{ left: 'calc(50% - 36vmax)', top: 'calc(40% - 36vmax)', background: 'radial-gradient(closest-side, var(--sun-core), var(--sun-halo) 38%, transparent 70%)' }}
      />

      {LAYERS.map((layer, i) => (
        <div key={layer.key} data-layer className="pointer-events-none absolute inset-x-[-6%] bottom-0 h-[84%]" style={{ zIndex: layer.z }}>
          <svg data-art viewBox="0 0 1600 700" preserveAspectRatio="xMidYMax slice" className="size-full overflow-visible" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id={`ridge-${layer.key}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="700">
                <stop offset="0" style={{ stopColor: `var(--m${i}-a)` }} />
                <stop offset="1" style={{ stopColor: `var(--m${i}-b)` }} />
              </linearGradient>
            </defs>
            <path d={layer.fill} fill={`url(#ridge-${layer.key})`} />
            {layer.rim > 0 && <path d={layer.line} fill="none" stroke="var(--rim)" strokeOpacity={layer.rim} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
          </svg>
        </div>
      ))}

      {/* The headline sits BETWEEN the ridges: z-4, behind near-a, near-b and the foreground */}
      <div data-title className="absolute inset-x-0 top-[17%] z-[4] flex justify-center px-[5vw] text-center will-change-transform">
        <KineticText as="h1" mode="lines" on="load" delay={delay} className="hero-title mx-auto max-w-[14ch] text-balance">
          {t.hero.title}
        </KineticText>
      </div>

      <Mist />
      <div
        data-lantern
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-[9] -ml-[28vmax] -mt-[28vmax] size-[56vmax] rounded-full opacity-0"
        style={{ background: 'radial-gradient(closest-side, var(--lantern), transparent 70%)' }}
      />

      <div data-copy className="absolute bottom-[6%] left-[5vw] z-10 flex max-w-[30rem] flex-col items-start gap-6">
        <KineticText as="p" mode="fade" on="load" delay={delay + 0.9} className="text-[clamp(1rem,1.15vw,1.2rem)] leading-relaxed">
          {t.hero.sub}
        </KineticText>
        <a data-cta data-magnetic href="#work" className="cta">
          {t.hero.cta}
        </a>
      </div>

      <div data-gauge className="pointer-events-none absolute bottom-[6%] right-[5vw] z-10 text-right tabular-nums">
        <p className="text-sm text-[var(--muted)]">{t.hero.altitude}</p>
        <p className="text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-none">
          <span data-altitude>{ALTITUDE.from}</span>
          <span className="ml-1 text-[0.4em] text-[var(--muted)]">m</span>
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">{t.hero.scroll}</p>
      </div>
    </section>
  );
}
