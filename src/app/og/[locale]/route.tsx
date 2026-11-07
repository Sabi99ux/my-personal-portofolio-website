import { ImageResponse } from 'next/og';
import { defaultLocale, dictionary, isLocale, locales } from '@/i18n/dictionary';
import { ridgeFill } from '@/lib/ridge';
import { siteConfig } from '@/lib/seo';

// /og/en, /og/id, /og/zh: prerendered once per locale at build time.
export const dynamic = 'force-static';
export const generateStaticParams = () => locales.map((locale) => ({ locale }));

const SIZE = { width: 1200, height: 630 };

/** Fetches just the glyphs this image needs as a TTF (Satori cannot read WOFF2). Null → fall back to the built-in font. */
async function loadFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`)).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return src ? await (await fetch(src)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

const RIDGES = [
  { seed: 3, base: 0.7, rise: 0.46, peaks: 6.5, jag: 0.35, fill: '#8d6f9c' },
  { seed: 17, base: 0.8, rise: 0.5, peaks: 5.2, jag: 0.45, fill: '#5d5489' },
  // everything below sits IN FRONT of the headline, which is how the type ends up half-hidden by the peaks
  { seed: 41, base: 0.95, rise: 0.4, peaks: 3.4, jag: 0.6, fill: '#262858' },
  { seed: 67, base: 1.03, rise: 0.22, peaks: 7, jag: 0.9, fill: '#10132a' },
].map((r) => ({ ...r, d: ridgeFill({ ...r, width: SIZE.width, height: SIZE.height }) }));

const fill = { position: 'absolute', top: 0, left: 0, width: SIZE.width, height: SIZE.height } as const;

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: requested } = await params;
  const locale = isLocale(requested) ? requested : defaultLocale;
  const t = dictionary[locale];
  const headline = t.hero.title;

  const font = await loadFont(locale === 'zh' ? 'Noto+Sans+SC' : 'Bricolage+Grotesque', 700, `${headline}${siteConfig.name}${t.meta.jobTitle}`);

  return new ImageResponse(
    (
      <div style={{ ...fill, display: 'flex', background: 'linear-gradient(180deg, #0c1330 0%, #3a3872 52%, #e48f68 100%)', fontFamily: 'Display' }}>
        <svg width={SIZE.width} height={SIZE.height} viewBox={`0 0 ${SIZE.width} ${SIZE.height}`} style={fill}>
          {RIDGES.slice(0, 2).map((r) => (
            <path key={r.seed} d={r.d} fill={r.fill} />
          ))}
        </svg>
        <div style={{ ...fill, display: 'flex', flexDirection: 'column', padding: '64px 72px', color: '#f6efe2' }}>
          <div style={{ display: 'flex', fontSize: 30, opacity: 0.85 }}>{siteConfig.name}</div>
          <div style={{ display: 'flex', marginTop: 52, fontSize: locale === 'zh' ? 120 : 132, lineHeight: 1, letterSpacing: -4, fontWeight: 700, maxWidth: 940 }}>{headline}</div>
        </div>
        <svg width={SIZE.width} height={SIZE.height} viewBox={`0 0 ${SIZE.width} ${SIZE.height}`} style={fill}>
          {RIDGES.slice(2).map((r) => (
            <path key={r.seed} d={r.d} fill={r.fill} />
          ))}
        </svg>
        <div style={{ position: 'absolute', left: 72, bottom: 44, display: 'flex', fontSize: 28, color: '#f6efe2', opacity: 0.9 }}>{t.meta.jobTitle}</div>
      </div>
    ),
    { ...SIZE, fonts: font ? [{ name: 'Display', data: font, weight: 700, style: 'normal' }] : undefined },
  );
}
