import type { Metadata, Viewport } from 'next';
import { defaultLocale, dictionary, localeMeta, locales, type Locale } from '@/i18n/dictionary';
import type { ProjectCard } from '@/lib/project-posts';

/** Replace every placeholder below. Set NEXT_PUBLIC_SITE_URL in production. */
export const siteConfig = {
  name: 'Amalsabi',
  givenName: 'Amal',
  familyName: 'Sabi',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com').replace(/\/$/, ''),
  email: 'sabibachtiar@gmail.com',
  handle: '@amalsabi',
  githubRepo: 'Sabi99ux/my-personal-portofolio-website',
  country: 'ID',
  sameAs: ['https://github.com/Sabi99ux', 'https://www.linkedin.com/in/amalsabi'],
  knowsAbout: ['Artificial intelligence', 'Machine learning', 'Deep learning', 'TensorFlow', 'scikit-learn', 'pandas', 'NumPy', 'Python', 'Julia', 'C++', 'PyTorch'],
  themeColor: '#10132a',
} as const;

export const localePath = (locale: Locale) => `/${locale}`;
export const absoluteUrl = (path = '') => `${siteConfig.url}${path}`;
/** Dynamic OG image for a locale (rendered by app/og/[locale]/route.tsx). */
export const ogImagePath = (locale: Locale) => `/og/${locale}`;

/** hreflang map shared by <link rel="alternate"> and the sitemap. */
export const languageAlternates = (base = '') => ({
  ...Object.fromEntries(locales.map((l) => [localeMeta[l].html, `${base}${localePath(l)}`])),
  'x-default': `${base}${localePath(defaultLocale)}`,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: siteConfig.themeColor,
};

export function buildMetadata(locale: Locale): Metadata {
  const { meta } = dictionary[locale];
  const image = { url: ogImagePath(locale), width: 1200, height: 630, alt: meta.title };

  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: meta.title, template: `%s · ${siteConfig.name}` },
    description: meta.description,
    keywords: meta.keywords,
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    category: 'portfolio',
    alternates: { canonical: localePath(locale), languages: languageAlternates() },
    openGraph: {
      type: 'profile',
      url: localePath(locale),
      siteName: siteConfig.name,
      title: meta.title,
      description: meta.description,
      locale: localeMeta[locale].og,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeMeta[l].og),
      firstName: siteConfig.givenName,
      lastName: siteConfig.familyName,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.description, creator: siteConfig.handle, images: [image] },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    formatDetection: { email: false, address: false, telephone: false },
  };
}

/** schema.org graph: Person ← ProfilePage → WebSite, plus the work as an ItemList of CreativeWork. */
export function buildJsonLd(locale: Locale, projectCards: ProjectCard[]) {
  const t = dictionary[locale];
  const lang = localeMeta[locale].html;
  const pageUrl = absoluteUrl(localePath(locale));
  const personId = `${siteConfig.url}/#person`;
  const websiteId = `${siteConfig.url}/#website`;
  const image = absoluteUrl(ogImagePath(locale));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: siteConfig.name,
        givenName: siteConfig.givenName,
        familyName: siteConfig.familyName,
        jobTitle: t.meta.jobTitle,
        description: t.meta.description,
        url: siteConfig.url,
        image,
        email: `mailto:${siteConfig.email}`,
        sameAs: siteConfig.sameAs,
        knowsAbout: siteConfig.knowsAbout,
        knowsLanguage: locales.map((l) => localeMeta[l].html),
        address: { '@type': 'PostalAddress', addressCountry: siteConfig.country },
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: siteConfig.url,
        name: siteConfig.name,
        inLanguage: locales.map((l) => localeMeta[l].html),
        publisher: { '@id': personId },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${pageUrl}#profile`,
        url: pageUrl,
        name: t.meta.title,
        description: t.meta.description,
        inLanguage: lang,
        isPartOf: { '@id': websiteId },
        mainEntity: { '@id': personId },
        primaryImageOfPage: { '@type': 'ImageObject', url: image, width: 1200, height: 630 },
      },
      {
        '@type': 'ItemList',
        '@id': `${pageUrl}#work`,
        name: t.work.title,
        itemListElement: projectCards.map((project, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'CreativeWork',
            name: project.copies[locale].title,
            description: project.copies[locale].summary,
            url: `${pageUrl}/blog/project/${project.slug}`,
            inLanguage: lang,
            creator: { '@id': personId },
          },
        })),
      },
    ],
  };
}

/** JSON for <script type="application/ld+json">. "<" is escaped so a stray "</script>" in any string can never break out. */
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
