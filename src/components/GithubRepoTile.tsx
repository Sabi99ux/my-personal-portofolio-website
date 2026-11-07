'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { siteConfig } from '@/lib/seo';

interface RepoStats {
  stars: number;
  forks: number;
  watchers: number;
}

const DEFAULT_STATS: RepoStats = {
  stars: 0,
  forks: 0,
  watchers: 0,
};

const CACHE_TTL = 60 * 1000;
const REFRESH_INTERVAL = 5 * 60 * 1000;

export function GithubRepoTile({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  const [stats, setStats] = useState<RepoStats>(DEFAULT_STATS);

  const repoFullName = siteConfig.githubRepo;
  const repoUrl = `https://github.com/${repoFullName}`;

  useEffect(() => {
    let isMounted = true;
    const cacheKey = `gh_stats_${repoFullName}`;
    let hasFreshCache = false;

    // Show cached numbers immediately, then revalidate when they are more than a minute old.
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          typeof parsed.timestamp === 'number' &&
          parsed.data &&
          typeof parsed.data.stars === 'number' &&
          typeof parsed.data.forks === 'number' &&
          typeof parsed.data.watchers === 'number'
        ) {
          setStats(parsed.data);
          hasFreshCache = Date.now() - parsed.timestamp < CACHE_TTL;
        }
      }
    } catch {
      // sessionStorage unavailable / blocked
    }

    async function fetchStats() {
      try {
        const res = await fetch(`https://api.github.com/repos/${repoFullName}`, {
          headers: { Accept: 'application/vnd.github.v3+json' },
          cache: 'no-store',
        });

        if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);

        const data = await res.json();
        const nextStats: RepoStats = {
          stars: data.stargazers_count ?? 0,
          forks: data.forks_count ?? 0,
          watchers: data.subscribers_count ?? data.watchers_count ?? 0,
        };

        if (isMounted) {
          setStats(nextStats);
          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ timestamp: Date.now(), data: nextStats })
            );
          } catch {
            // The live stats still work when sessionStorage is unavailable.
          }
        }
      } catch (error) {
        console.error('Unable to refresh GitHub repository stats:', error);
      }
    }

    if (!hasFreshCache) void fetchStats();
    const intervalId = window.setInterval(() => void fetchStats(), REFRESH_INTERVAL);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [repoFullName]);

  const copy = t.craft.repo;

  return (
    <div
      className={`tile relative flex flex-col justify-between gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8 overflow-hidden transition-all duration-300 hover:border-white/20 ${className}`}
    >
      {/* Top Header Area */}
      <div className="flex flex-col gap-4">
        {/* GitHub Brand Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] shadow-sm">
              {/* GitHub Official Octocat Icon */}
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </div>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
              GitHub
            </span>
          </div>

        </div>

        {/* Headline & Link */}
        <div>
          <h3 className="text-xl md:text-2xl font-medium leading-snug text-[var(--fg)]">
            {copy.title}
          </h3>

          <div className="mt-2.5">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span className="underline underline-offset-4">{copy.cta}</span>
              {/* External Arrow */}
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Live Metrics (Forks, Stars, Watchers/Mata) */}
      <dl className="grid grid-cols-3 gap-3 border-t border-[var(--line)] pt-5 tabular-nums">
        {/* 1. FORK */}
        <div className="flex flex-col gap-1.5">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
            {/* Git Fork Icon */}
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 text-purple-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="6" y1="3" x2="6" y2="15" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
            <span>{copy.forks}</span>
          </dt>
          <dd className="font-mono text-2xl md:text-3xl font-light text-[var(--fg)]">
            {stats.forks}
          </dd>
        </div>

        {/* 2. STARS */}
        <div className="flex flex-col gap-1.5">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
            {/* Star Icon */}
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-amber-400" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>{copy.stars}</span>
          </dt>
          <dd className="font-mono text-2xl md:text-3xl font-light text-[var(--fg)]">
            {stats.stars}
          </dd>
        </div>

        {/* 3. WATCHERS (MATA) */}
        <div className="flex flex-col gap-1.5">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
            {/* Eye (Mata) Icon */}
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 text-sky-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>{copy.watchers}</span>
          </dt>
          <dd className="font-mono text-2xl md:text-3xl font-light text-[var(--fg)]">
            {stats.watchers}
          </dd>
        </div>
      </dl>
    </div>
  );
}
