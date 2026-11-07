'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { ridgeFill } from '@/lib/ridge';
import { siteConfig } from '@/lib/seo';
import { KineticText } from './KineticText';
import { CelestialSky } from './CelestialSky';
import { GithubRepoTile } from './GithubRepoTile';

// Lane 1: Core personal tech stack
const MY_TECH = ['TensorFlow', 'scikit-learn', 'pandas', 'NumPy', 'Python', 'Julia', 'C++', 'PyTorch'];

// Lane 2: The exact technologies built for this website
const THIS_WEB_TECH = ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'GSAP', 'WebGL', 'Three.js'];

// Same generator as the hero, tinted with the hero's own theme variables so the tile belongs to the scene.
const SUMMITS = [0, 1, 2].map((i) => ({
  d: ridgeFill({ seed: 140 + i * 9, width: 800, height: 300, base: 0.98, rise: 0.8 - i * 0.16, peaks: 2.4 + i * 0.8, jag: 0.5 + i * 0.15 }),
  fill: `var(--m${i + 1}-a)`,
}));

/** One tile. A radial spotlight follows the pointer through two CSS variables (see .tile in globals.css). */
function Tile({ className = '', id, children }: { className?: string; id?: string; children: ReactNode }) {
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--sx', `${e.clientX - box.left}px`);
    e.currentTarget.style.setProperty('--sy', `${e.clientY - box.top}px`);
  };
  return (
    <div id={id} onPointerMove={onMove} className={`tile relative flex flex-col justify-between gap-8 overflow-hidden p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

export function BentoGrid() {
  const { t } = useI18n();
  const rootRef = useRef<HTMLElement>(null);
  const c = t.craft;

  return (
    <section ref={rootRef} id="craft" className="relative bg-[var(--bg)] px-[5vw] py-[18vh]">
      <KineticText as="h2" mode="lines" className="display max-w-[16ch] text-[clamp(2.5rem,6vw,6rem)]">
        {c.title}
      </KineticText>

      <div className="mt-[10vh] grid auto-rows-[minmax(13rem,auto)] grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
        {/* Celestial tracker: dynamic sun & moon synced to device clock & weather */}
        <Tile className="min-h-[26rem] !p-0 rounded-[2rem] bg-transparent border-0 md:col-span-7 md:row-span-2">
          <CelestialSky summits={SUMMITS} />
        </Tile>

        {/* Open source GitHub repository tile */}
        <GithubRepoTile className="md:col-span-5" />

        {/* tech lanes */}
        <Tile className="rounded-xl border border-[var(--line)] !px-0 md:col-span-5 flex flex-col justify-center gap-7 py-7">
          {/* Lane 1: My Tech */}
          <div className="flex flex-col gap-2">
            <p className="px-6 text-xs font-medium uppercase tracking-widest text-[var(--muted)] md:px-8">
              {c.stack.myTech}
            </p>
            <div className="overflow-hidden" aria-label={MY_TECH.join(', ')}>
              <div className="marquee flex w-max text-2xl md:text-3xl font-light text-[var(--fg)]">
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 gap-10 pr-10">
                    {MY_TECH.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>

          {/* Lane 2: This Web Tech */}
          <div className="flex flex-col gap-2">
            <p className="px-6 text-xs font-medium uppercase tracking-widest text-[var(--muted)] md:px-8">
              {c.stack.thisWeb}
            </p>
            <div className="overflow-hidden" aria-label={THIS_WEB_TECH.join(', ')}>
              <div className="marquee-reverse flex w-max text-2xl md:text-3xl font-light text-[var(--fg)]">
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 gap-10 pr-10">
                    {THIS_WEB_TECH.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </Tile>

        {/* activities */}
        <Tile className="rounded-2xl border border-[var(--line)] md:col-span-7">
          <h3 className="text-xl font-medium">{c.experience.title}</h3>
          <ul className="divide-y divide-[var(--line)]">
            {c.experience.rows.map((row) => (
              <li key={row.role} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 py-4 text-sm md:text-base">
                <div className="flex items-baseline gap-4 md:gap-8">
                  <span className="tabular-nums font-mono text-xs md:text-sm text-[var(--muted)] shrink-0">{row.years}</span>
                  <span className="font-normal text-[var(--fg)] text-base md:text-lg">{row.role}</span>
                </div>
                {row.org && <span className="text-xs md:text-sm text-[var(--muted)] shrink-0">{row.org}</span>}
              </li>
            ))}
          </ul>
        </Tile>

        {/* contact: the inverted tile closes the page */}
        <Tile id="contact" className="rounded-[2rem] bg-[var(--fg)] text-[var(--bg)] md:col-span-5">
          <h3 className="max-w-[14ch] text-3xl font-medium leading-tight md:text-4xl">{c.contact.title}</h3>
          <a data-magnetic href={`mailto:${siteConfig.email}`} className="cta self-start">
            {c.contact.cta}
          </a>
        </Tile>
      </div>
    </section>
  );
}
