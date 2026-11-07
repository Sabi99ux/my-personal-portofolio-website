'use client';

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { dictionary, localeMeta, locales, type Dictionary, type Locale } from './dictionary';

interface I18nValue {
  locale: Locale;
  t: Dictionary;
  /** Plays the exit animation, swaps the copy, then syncs <html lang> and the URL (no navigation, no remount). */
  setLocale: (next: Locale) => Promise<void>;
}

const I18nContext = createContext<I18nValue | null>(null);
const LOCALE_SEGMENT = new RegExp(`^/(${locales.join('|')})(?=/|$)`);

const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
};

/** Lifts every visible headline unit out of its mask and fades visible labels. Resolves when done. */
function playExit(): Promise<void> {
  const hosts = gsap.utils.toArray<HTMLElement>('[data-kinetic][data-ready]').filter(onScreen);
  const units = hosts.flatMap((h) => (h.dataset.kinetic === 'split' ? Array.from(h.querySelectorAll('.k-unit')) : []));
  const labels = hosts.filter((h) => h.dataset.kinetic === 'fade');
  if (!units.length && !labels.length) return Promise.resolve();

  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: resolve });
    if (units.length) tl.to(units, { yPercent: -115, duration: 0.5, ease: 'power3.in', stagger: 0.035, overwrite: 'auto' }, 0);
    if (labels.length) tl.to(labels, { autoAlpha: 0, y: -10, duration: 0.3, ease: 'power2.in', overwrite: 'auto' }, 0);
  });
}

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const current = useRef<Locale>(initialLocale);
  const busy = useRef(false);
  const mounted = useRef(false);

  const setLocale = useCallback(async (next: Locale) => {
    if (busy.current || next === current.current) return;
    busy.current = true;
    await playExit();
    current.current = next;
    setLocaleState(next); // KineticText is keyed by locale, so its DOM is replaced rather than patched

    // Keep the homepage transition remount-free; content pages navigate so their server-rendered locale updates.
    const { pathname, search, hash } = window.location;
    const nextPath = pathname.replace(LOCALE_SEGMENT, `/${next}`);
    if (pathname.replace(LOCALE_SEGMENT, '') === '' || pathname.replace(LOCALE_SEGMENT, '') === '/') {
      window.history.replaceState(window.history.state, '', nextPath + search + hash);
    } else {
      router.replace(nextPath + search + hash, { scroll: false });
    }
    busy.current = false;
  }, [router]);

  useLayoutEffect(() => {
    document.documentElement.lang = localeMeta[locale].html;
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    // Children's layout effects (SplitText) have already re-split the new copy. Wait one frame and for
    // any webfont slices, then re-measure every pin / start / end exactly once.
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      void document.fonts.ready.then(() => {
        if (!cancelled) ScrollTrigger.refresh();
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [locale]);

  const value = useMemo<I18nValue>(() => ({ locale, t: dictionary[locale], setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
