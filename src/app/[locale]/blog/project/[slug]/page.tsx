import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarkdownContent } from '@/components/MarkdownContent';
import { isLocale, localeMeta } from '@/i18n/dictionary';
import { getAvailableProjectLocales, getProjectPost, getProjectSlugs } from '@/lib/project-posts';

type Params = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getProjectPost(slug, locale);
  if (!post || !isLocale(locale)) return {};

  const description = post.description.slice(0, 160);
  const canonical = `/${locale}/blog/project/${slug}`;
  const availableLocales = getAvailableProjectLocales(slug);

  return {
    title: post.title,
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries(availableLocales.map((item) => [localeMeta[item].html, `/${item}/blog/project/${slug}`])),
    },
  };
}

export default async function ProjectPostPage({ params }: Params) {
  const { locale, slug } = await params;
  const post = getProjectPost(slug, locale);
  if (!post || !isLocale(locale)) notFound();

  return (
    <main className="min-h-screen bg-[var(--bg)] px-[6vw] py-28 text-[var(--fg)]">
      <article className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-12 text-sm text-[var(--muted)]">
          <Link href={`/${locale}`} className="hover:text-[var(--fg)]">
            ← {locale === 'id' ? 'Kembali ke beranda' : locale === 'zh' ? '返回首页' : 'Back to home'}
          </Link>
        </nav>
        <h1 className="display mb-10 text-[clamp(2.5rem,7vw,5rem)] leading-tight">{post.title}</h1>
        <MarkdownContent markdown={post.markdown} />
      </article>
    </main>
  );
}
