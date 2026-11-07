'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useI18n } from '@/i18n/I18nProvider';
import { feedback } from '@/lib/feedback';

type Kind = 'idle' | 'link' | 'view' | 'drag';

const SHAPE: Record<Kind, { w: number; h: number; r: number }> = {
  idle: { w: 12, h: 12, r: 6 },
  link: { w: 56, h: 56, r: 28 },
  view: { w: 148, h: 52, r: 26 },
  drag: { w: 88, h: 88, r: 44 },
};
const PULL_CURSOR = 0.35; // how far the cursor is drawn toward a magnetic element's centre
const PULL_ELEMENT = 0.3; // how far a magnetic element leans toward the cursor

/**
 * Fine-pointer only. The cursor is a damped spring simulated on gsap.ticker (so it has real inertia and
 * stretches along its velocity); its shape morphs per target:  [data-cursor="view" | "drag"], any link/button,
 * or nothing. Elements marked [data-magnetic] lean toward the pointer with an elastic return.
 */
export function MagneticCursor() {
  const { t } = useI18n();
  const rigRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const copy = useRef(t.cursor);
  copy.current = t.cursor; // always the current language, without re-running the effect

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const rig = rigRef.current!;
      const press = pressRef.current!;
      const shape = shapeRef.current!;
      const label = labelRef.current!;
      const html = document.documentElement;
      html.classList.add('has-cursor');

      const p = { x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0, tx: innerWidth / 2, ty: innerHeight / 2 };
      let kind: Kind = 'idle';
      let magnet: HTMLElement | null = null;
      let seen = false;

      const leans = new WeakMap<HTMLElement, { x: (v: number) => void; y: (v: number) => void }>();
      const lean = (el: HTMLElement) => {
        let q = leans.get(el);
        if (!q) {
          const vars = { duration: 0.8, ease: 'elastic.out(1, 0.55)' };
          q = { x: gsap.quickTo(el, 'x', vars), y: gsap.quickTo(el, 'y', vars) };
          leans.set(el, q);
        }
        return q;
      };

      const morph = (next: Kind) => {
        if (next === kind) return;
        kind = next;
        const s = SHAPE[next];
        const text = next === 'view' ? copy.current.view : next === 'drag' ? copy.current.drag : '';
        rig.dataset.kind = next;
        label.textContent = text;
        gsap.to(shape, { width: s.w, height: s.h, borderRadius: s.r, duration: 0.55, ease: 'expo.out', overwrite: 'auto' });
        gsap.to(label, { autoAlpha: text ? 1 : 0, duration: text ? 0.35 : 0.15, delay: text ? 0.08 : 0, overwrite: 'auto' });
      };

      const setMagnet = (next: HTMLElement | null) => {
        if (next === magnet) return;
        if (magnet) {
          lean(magnet).x(0);
          lean(magnet).y(0);
        }
        magnet = next;
        if (next) feedback.tick();
      };

      const onOver = (e: PointerEvent) => {
        const el = (e.target as Element | null)?.closest<HTMLElement>('[data-cursor], [data-magnetic], a, button');
        const declared = el?.dataset.cursor as Kind | undefined;
        morph(declared ?? (el ? 'link' : 'idle'));
        setMagnet(el?.closest<HTMLElement>('[data-magnetic]') ?? null);
      };

      const onMove = (e: PointerEvent) => {
        if (!seen) {
          seen = true;
          p.x = p.tx = e.clientX;
          p.y = p.ty = e.clientY;
          gsap.to(rig, { autoAlpha: 1, duration: 0.4 });
        }
        p.tx = e.clientX;
        p.ty = e.clientY;
        if (magnet) {
          const r = magnet.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          p.tx += (cx - e.clientX) * PULL_CURSOR;
          p.ty += (cy - e.clientY) * PULL_CURSOR;
          lean(magnet).x((e.clientX - cx) * PULL_ELEMENT);
          lean(magnet).y((e.clientY - cy) * PULL_ELEMENT);
        }
      };

      // Damped spring, frame-rate independent (k = 1 at 60fps). ~6% overshoot: it trails, then settles.
      const tick = () => {
        const k = gsap.ticker.deltaRatio(60);
        const damp = Math.pow(0.62, k);
        p.vx = (p.vx + (p.tx - p.x) * 0.16 * k) * damp;
        p.vy = (p.vy + (p.ty - p.y) * 0.16 * k) * damp;
        p.x += p.vx * k;
        p.y += p.vy * k;
        rig.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;

        const speed = Math.hypot(p.vx, p.vy);
        const round = kind !== 'view'; // the pill keeps its shape; circles stretch along their velocity
        const stretch = round ? Math.min(speed / 38, 0.5) : 0;
        const angle = round && speed > 0.4 ? Math.atan2(p.vy, p.vx) * (180 / Math.PI) : 0;
        shape.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${1 + stretch}, ${1 - stretch * 0.45})`;
      };

      const down = () => {
        gsap.to(press, { scale: 0.86, duration: 0.18, ease: 'power2.out', overwrite: 'auto' });
        feedback.press();
      };
      const up = () => gsap.to(press, { scale: 1, duration: 0.5, ease: 'back.out(3)', overwrite: 'auto' });
      const hide = () => gsap.to(rig, { autoAlpha: 0, duration: 0.25 });
      const show = () => seen && gsap.to(rig, { autoAlpha: 1, duration: 0.25 });

      document.addEventListener('pointerover', onOver, { passive: true });
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', down);
      window.addEventListener('pointerup', up);
      html.addEventListener('mouseleave', hide);
      html.addEventListener('mouseenter', show);
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        document.removeEventListener('pointerover', onOver);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerdown', down);
        window.removeEventListener('pointerup', up);
        html.removeEventListener('mouseleave', hide);
        html.removeEventListener('mouseenter', show);
        html.classList.remove('has-cursor');
        setMagnet(null);
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={rigRef} data-kind="idle" aria-hidden="true" className="cursor-rig pointer-events-none fixed left-0 top-0 z-[100] opacity-0">
      <div ref={pressRef}>
        <div ref={shapeRef} className="cursor-shape absolute left-0 top-0 size-3 rounded-full" />
        <span ref={labelRef} className="cursor-label absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-medium opacity-0" />
      </div>
    </div>
  );
}
