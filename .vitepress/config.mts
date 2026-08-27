import { defineConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar'
import type { VitePressSidebarOptions } from 'vitepress-sidebar'


const GITHUB_REPO = "w"
const GITHUB_USERNAME = 'Sabi99ux'

const baseConfig = defineConfig({
  title: 'amalsabi-portofolio',
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'dark',

  locales: {
    id: {
      label: 'Bahasa Indonesia',
      lang: 'id',
      link: '/id/',
      title: 'AMALSABI - Portofolio',
      description: 'Portofolio pribadi — karya dan tulisan.',
      themeConfig: {
        nav: [
          { text: 'Beranda', link: '/id/' },
          { text: 'Karya', link: '/id/project/' },
          { text: 'Tulisan', link: '/id/blog/' }
        ],
        outlineTitle: 'Di halaman ini',
        lastUpdatedText: 'Diperbarui terakhir',
        returnToTopLabel: 'Kembali ke atas',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Tampilan',
        lightModeSwitchTitle: 'Ganti ke mode terang',
        darkModeSwitchTitle: 'Ganti ke mode gelap',
        langMenuLabel: 'Ganti bahasa',
        skipToContentLabel: 'Langsung ke konten',
        docFooter: { prev: 'Halaman sebelumnya', next: 'Halaman berikutnya' },
        editLink: {
          pattern: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/edit/main/:path`,
          text: 'Sunting halaman ini di GitHub'
        }
      }
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      title: 'AMALSABI - Portofolio',
      description: 'Personal portfolio — work and writing.',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Work', link: '/en/project/' },
          { text: 'Writing', link: '/en/blog/' }
        ],
        lightModeSwitchTitle: 'Switch to light theme',
        darkModeSwitchTitle: 'Switch to dark theme',
        editLink: {
          pattern: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/edit/main/:path`,
          text: 'Edit this page on GitHub'
        }
      }
    }
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#15141a' }]
  ],

  themeConfig: {
    socialLinks: [{ icon: 'github', link: `https://github.com/${GITHUB_USERNAME}` }],
    search: { provider: 'local' },
    outline: [2, 3]
  }
})

const sidebarOptions: VitePressSidebarOptions[] = [
  {
    documentRootPath: 'id',
    scanStartPath: 'project',
    resolvePath: '/id/project/',
    useTitleFromFrontmatter: true,
    useFolderTitleFromIndexFile: true,
    includeRootIndexFile: true,
    collapsed: false,
    sortMenusByFrontmatterDate: true,
    sortMenusOrderByDescending: true,
    frontmatterOrderDefaultValue: 0
  },
  {
    documentRootPath: 'id',
    scanStartPath: 'blog',
    resolvePath: '/id/blog/',
    useTitleFromFrontmatter: true,
    useFolderTitleFromIndexFile: true,
    includeRootIndexFile: true,
    collapsed: false,
    sortMenusByFrontmatterDate: true,
    sortMenusOrderByDescending: true
  },
  {
    documentRootPath: 'en',
    scanStartPath: 'project',
    resolvePath: '/en/project/',
    useTitleFromFrontmatter: true,
    useFolderTitleFromIndexFile: true,
    includeRootIndexFile: true,
    collapsed: false,
    sortMenusByFrontmatterDate: true,
    sortMenusOrderByDescending: true
  },
  {
    documentRootPath: 'en',
    scanStartPath: 'blog',
    resolvePath: '/en/blog/',
    useTitleFromFrontmatter: true,
    useFolderTitleFromIndexFile: true,
    includeRootIndexFile: true,
    collapsed: false,
    sortMenusByFrontmatterDate: true,
    sortMenusOrderByDescending: true
  }
]

export default withSidebar(baseConfig, sidebarOptions)
