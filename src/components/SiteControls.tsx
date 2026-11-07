'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useI18n } from '@/i18n/I18nProvider';
import { localeMeta, locales } from '@/i18n/dictionary';
import { siteConfig } from '@/lib/seo';
import { feedback } from '@/lib/feedback';

export function SiteControls() {
  const { locale, setLocale, t } = useI18n();
  const [sound, setSound] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  useEffect(() => {
    setSound(feedback.init());
  }, []);

  // Slide the pill under the active language (first placement is instant).
  useGSAP(
    () => {
      const active = groupRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!active || !pillRef.current) return;
      gsap.to(pillRef.current, { x: active.offsetLeft, width: active.offsetWidth, duration: placed.current ? 0.6 : 0, ease: 'expo.out' });
      placed.current = true;
    },
    { dependencies: [locale], scope: groupRef },
  );

  const toggleSound = () => {
    feedback.set(!sound);
    setSound(!sound);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-[5vw] py-5 text-white mix-blend-difference">
      <a href="#top" data-magnetic className="font-medium tracking-tight">
        {siteConfig.name}
      </a>

      <nav aria-label="Primary" className="hidden gap-8 text-sm md:flex">
        <a href="#work" data-magnetic>
          {t.nav.work}
        </a>
        <a href="#craft" data-magnetic>
          {t.nav.craft}
        </a>
        <a href="#contact" data-magnetic>
          {t.nav.contact}
        </a>
      </nav>

      <div className="flex items-center gap-2">
        <div ref={groupRef} role="group" aria-label={t.ui.language} className="relative flex rounded-full border border-white/40 p-0.5 text-xs">
          <span ref={pillRef} aria-hidden="true" className="absolute bottom-0.5 left-0 top-0.5 w-0 rounded-full bg-white" />
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              lang={localeMeta[l].html}
              title={localeMeta[l].native}
              aria-pressed={l === locale}
              data-magnetic
              onClick={() => {
                feedback.press();
                void setLocale(l);
              }}
              className={`relative z-10 rounded-full px-3 py-1.5 transition-colors duration-300 ${l === locale ? 'text-black' : 'text-white'}`}
            >
              {localeMeta[l].short}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleSound}
          aria-label={t.ui.sound}
          aria-pressed={sound}
          data-magnetic
          className="grid size-9 place-items-center rounded-full border border-white/40"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M4 10v4h3l5 4V6L7 10H4Z" />
            {sound ? <path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /> : <path d="m16 9 5 6m0-6-5 6" />}
          </svg>
        </button>
      </div>
    </header>
  );
}
