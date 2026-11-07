'use client';

import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Lenis, { type LenisOptions } from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';

export type SmoothScrollOptions = Partial<LenisOptions> & {
  /** When this key changes (a route change) the page jumps to the top and every trigger is re-measured. */
  routeKey?: string;
};

/**
 * Lenis smooth scrolling driven by GSAP's ticker and kept in lock-step with ScrollTrigger.
 *
 *  - Lenis has no loop of its own (autoRaf: false): gsap.ticker is the single clock, so ScrollTrigger scrubs,
 *    pins and Lenis' interpolated position are always evaluated in the same frame (no jitter, no double smoothing).
 *  - lagSmoothing(0): GSAP must never "catch up" after a slow frame, or it would desync from Lenis.
 *  - Lenis honours prefers-reduced-motion on its own (respectReducedMotion defaults to true).
 *  - Options are read once, on mount.
 */
export function useGsapSmoothScroll({ routeKey, ...overrides }: SmoothScrollOptions = {}): Lenis | null {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lastRoute = useRef(routeKey);

  useEffect(() => {
    const instance = new Lenis({
      autoRaf: false,
      lerp: 0.085,
      wheelMultiplier: 0.9,
      anchors: true, // <a href="#work"> glides instead of jumping
      ...overrides,
    });

    const tick = (time: number) => instance.raf(time * 1000);
    const refresh = () => ScrollTrigger.refresh();
    const resize = () => instance.resize(); // pin spacers change the document height

    instance.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.addEventListener('refresh', resize);
    if (document.readyState !== 'complete') window.addEventListener('load', refresh, { once: true });
    void document.fonts.ready.then(refresh);
    setLenis(instance);

    return () => {
      window.removeEventListener('load', refresh);
      ScrollTrigger.removeEventListener('refresh', resize);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33); // GSAP defaults
      instance.destroy();
      setLenis(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options are initial-only by design
  }, []);

  useEffect(() => {
    if (lastRoute.current === routeKey) return;
    lastRoute.current = routeKey;
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [routeKey, lenis]);

  return lenis;
}

const SmoothScrollContext = createContext<Lenis | null>(null);

/** The Lenis instance: null on the server and before mount. Use it for scrollTo / stop / start / velocity. */
export const useLenis = () => useContext(SmoothScrollContext);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // "/en/projects" → "projects". Switching language only swaps the first segment, which must NOT count as navigation.
  const routeKey = pathname.split('/').slice(2).join('/');
  const lenis = useGsapSmoothScroll({ routeKey });
  return createElement(SmoothScrollContext.Provider, { value: lenis }, children);
}
