import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { MagneticCursor } from '@/components/MagneticCursor';
import { SiteControls } from '@/components/SiteControls';
import { SmoothScrollProvider } from '@/hooks/useGsapSmoothScroll';
import { I18nProvider } from '@/i18n/I18nProvider';
import { isLocale, localeMeta, locales } from '@/i18n/dictionary';
import { getProjectCards } from '@/lib/project-posts';
import { buildJsonLd, buildMetadata, serializeJsonLd, viewport as seoViewport } from '@/lib/seo';
import '../globals.css';

// One variable family. The wdth axis is animated on the hero headline as it is swallowed by the ridges.
const sans = Bricolage_Grotesque({ subsets: ['latin', 'latin-ext'], axes: ['opsz', 'wdth'], variable: '--font-sans', display: 'swap' });

type Params = { params: Promise<{ locale: string }> };

export const dynamicParams = false; // anything but /en /id /zh is a 404
export const generateStaticParams = () => locales.map((locale) => ({ locale }));
export const viewport: Viewport = seoViewport;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? buildMetadata(locale) : {};
}

// Runs before first paint: forces dark theme and sets the "js" flag that gates reveal animations.
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');d.dataset.theme='dark';})();`;

export default async function RootLayout({ children, params }: Params & { children: ReactNode }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={localeMeta[locale].html} data-theme="dark" className={sans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildJsonLd(locale, getProjectCards())) }} />
        <I18nProvider initialLocale={locale}>
          <SmoothScrollProvider>
            <SiteControls />
            <MagneticCursor />
            {children}
          </SmoothScrollProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
