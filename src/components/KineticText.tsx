'use client';

import { createContext, createElement, useContext, useRef, type ElementType } from 'react';
import { gsap, prefersReducedMotion, SplitText, useGSAP } from '@/lib/gsap';
import { useI18n } from '@/i18n/I18nProvider';

/**
 * A horizontally pinned scroller provides its scrub tween here so the text inside can trigger against it.
 *   undefined → not inside a scroller (normal vertical triggers)
 *   null      → inside a scroller whose tween does not exist yet (wait)
 *   Animation → use as containerAnimation
 */
export const ContainerAnimationContext = createContext<gsap.core.Animation | null | undefined>(undefined);

export type KineticMode = 'lines' | 'words' | 'chars' | 'fade';

interface KineticTextProps {
  children: string;
  as?: ElementType;
  mode?: KineticMode;
  /** 'scroll' reveals on entering the viewport (or the horizontal scroller); 'load' reveals right away. */
  on?: 'scroll' | 'load';
  delay?: number;
  start?: string;
  className?: string;
}

const UNIT_CLASS = { lines: 'linesClass', words: 'wordsClass', chars: 'charsClass' } as const;
const REVEAL = {
  lines: { duration: 1.15, stagger: 0.09 },
  words: { duration: 0.95, stagger: 0.05 },
  chars: { duration: 0.85, stagger: 0.02 },
} as const;

export function KineticText({ children: text, as: Tag = 'p', mode = 'lines', on = 'scroll', delay = 0, start = 'top 88%', className }: KineticTextProps) {
  const { locale } = useI18n();
  const container = useContext(ContainerAnimationContext);
  const ref = useRef<HTMLElement>(null);

  // Chinese has no spaces: "words" and "lines" would treat a whole sentence as one unit, so reveal per character.
  const kind: KineticMode = locale === 'zh' && mode !== 'fade' ? 'chars' : mode;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || container === null) return; // inside a scroller that is not ready yet
      if (prefersReducedMotion()) {
        el.dataset.ready = '';
        return;
      }

      const scrollTrigger =
        on === 'load'
          ? undefined
          : container
            ? { trigger: el, containerAnimation: container, start: 'left 85%', once: true }
            : { trigger: el, start, once: true };

      if (kind === 'fade') {
        gsap.from(el, { autoAlpha: 0, y: 14, duration: 1, ease: 'power3.out', delay, scrollTrigger });
        el.dataset.ready = '';
        return;
      }

      SplitText.create(el, {
        type: kind === 'chars' ? (locale === 'zh' ? 'chars' : 'words,chars') : kind,
        mask: kind,
        [UNIT_CLASS[kind]]: 'k-unit',
        autoSplit: true,
        // The returned tween is tracked by SplitText: on a re-split (resize, webfont swap) it is reverted and the
        // new tween resumes at the same progress, so a finished reveal never replays.
        onSplit(self) {
          el.dataset.ready = '';
          return gsap.from(self[kind], { yPercent: 110, ease: 'expo.out', delay, scrollTrigger, ...REVEAL[kind] });
        },
      });
    },
    // locale is a dependency even when the text is identical across languages: the keyed node is new, so it must be split again
    { dependencies: [text, kind, on, container, locale], revertOnUpdate: true },
  );

  // key={locale} makes React REPLACE the node on a language change. SplitText rewrites its own children,
  // so letting React patch the text in place would fight it (and revert() would restore the old language).
  return createElement(Tag, { key: locale, ref, className, 'data-kinetic': kind === 'fade' ? 'fade' : 'split' }, text);
}
