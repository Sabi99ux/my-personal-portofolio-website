import type { MetadataRoute } from 'next';
import { defaultLocale, localeMeta, locales } from '@/i18n/dictionary';
import { absoluteUrl, languageAlternates, localePath } from '@/lib/seo';
import { getAvailableProjectLocales, getProjectSlugs } from '@/lib/project-posts';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const homePages = locales.map((locale) => ({
    url: absoluteUrl(localePath(locale)),
    changeFrequency: 'monthly' as const,
    priority: locale === defaultLocale ? 1 : 0.9,
    alternates: { languages: languageAlternates(absoluteUrl()) },
  }));
  const projectPages = getProjectSlugs().flatMap((slug) => {
    const availableLocales = getAvailableProjectLocales(slug);
    return availableLocales.map((locale) => ({
      url: absoluteUrl(`${localePath(locale)}/blog/project/${slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(
          availableLocales.map((language) => [
            localeMeta[language].html,
            absoluteUrl(`${localePath(language)}/blog/project/${slug}`),
          ]),
        ),
      },
    }));
  });

  return [...homePages, ...projectPages];
}
