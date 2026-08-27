import { createContentLoader } from 'vitepress'

export interface ProjectItem {
  title: string
  description: string
  url: string
  date: string
  year: string
  tags: string[]
  link?: string
}

declare const data: ProjectItem[]
export { data }

export default createContentLoader('id/project/*.md', {
  excerpt: false,
  render: false,
  transform(raw): ProjectItem[] {
    return raw
      .filter((page) => page.frontmatter.date && !page.frontmatter.draft)
      .map((page) => ({
        title: page.frontmatter.title ?? '',
        description: page.frontmatter.description ?? '',
        url: page.url,
        date: page.frontmatter.date,
        year: new Intl.DateTimeFormat('id-ID', { year: 'numeric' }).format(
          new Date(page.frontmatter.date)
        ),
        tags: page.frontmatter.tags ?? [],
        link: page.frontmatter.link
      }))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
  }
})