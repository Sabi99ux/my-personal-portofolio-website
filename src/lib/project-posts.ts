import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { isLocale, locales, type Locale } from '@/i18n/dictionary';

const postsDirectory = path.join(process.cwd(), 'content', 'blog', 'project');
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ProjectCopy {
  title: string;
  summary: string;
}

export interface ProjectCard {
  slug: string;
  copies: Record<Locale, ProjectCopy>;
}

export function getProjectSlugs(): string[] {
  if (!existsSync(postsDirectory)) return [];

  return readdirSync(postsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && validSlug.test(entry.name))
    .filter((entry) => locales.some((locale) => existsSync(path.join(postsDirectory, entry.name, `${locale}.md`))))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => entry.name);
}

export function getProjectPost(slug: string, locale: string): { markdown: string; title: string; description: string } | null {
  if (!validSlug.test(slug) || !isLocale(locale)) return null;

  const projectDirectory = path.join(postsDirectory, slug);
  const fallbackLocale = locales.find((item) => existsSync(path.join(projectDirectory, `${item}.md`)));
  const contentLocale = existsSync(path.join(projectDirectory, `${locale}.md`)) ? locale : fallbackLocale;
  if (!contentLocale) return null;

  const markdown = readFileSync(path.join(projectDirectory, `${contentLocale}.md`), 'utf8');
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || slug;
  const description =
    markdown
      .replace(/^#.*$/gm, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean)
      ?.replace(/[*_`>#]/g, '')
      .trim() || title;
  return { markdown, title, description };
}

export function getProjectCards(): ProjectCard[] {
  return getProjectSlugs().map((slug) => ({
    slug,
    copies: Object.fromEntries(
      locales.map((locale) => {
        const post = getProjectPost(slug, locale);
        return [locale, { title: post?.title ?? slug, summary: post?.description ?? slug }];
      }),
    ) as Record<Locale, ProjectCopy>,
  }));
}

export function getAvailableProjectLocales(slug: string): Locale[] {
  if (!validSlug.test(slug)) return [];
  return locales.filter((locale) => existsSync(path.join(postsDirectory, slug, `${locale}.md`)));
}
