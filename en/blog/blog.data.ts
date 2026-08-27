import { createContentLoader } from 'vitepress'

export interface PostItem {
  title: string
  description: string
  url: string
  date: string
  dateDisplay: string
}

declare const data: PostItem[]
export { data }

export default createContentLoader('en/blog/*.md', {
  excerpt: false,
  render: false,
  transform(raw): PostItem[] {
    return raw
      .filter((page) => page.frontmatter.date && !page.frontmatter.draft)
      .map((page) => ({
        title: page.frontmatter.title ?? '',
        description: page.frontmatter.description ?? '',
        url: page.url,
        date: page.frontmatter.date,
        dateDisplay: new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(
          new Date(page.frontmatter.date)
        )
      }))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
  }
})
