export const locales = ['en', 'id', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const isLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

export const localeMeta: Record<Locale, { native: string; short: string; html: string; og: string }> = {
  en: { native: 'English', short: 'EN', html: 'en', og: 'en_US' },
  id: { native: 'Bahasa Indonesia', short: 'ID', html: 'id', og: 'id_ID' },
  zh: { native: '简体中文', short: '中文', html: 'zh-CN', og: 'zh_CN' },
};

const en = {
  meta: {
    title: 'Amalsabi — Creative Technologist & Interactive Developer',
    description:
      'Portfolio of Amalsabi, a creative technologist building cinematic, high-performance web experiences with WebGL, GSAP and Next.js.',
    keywords: ['creative technologist', 'interactive developer', 'WebGL', 'GSAP', 'Next.js', 'portfolio'],
    jobTitle: 'Creative Technologist & Interactive Developer',
  },
  nav: { work: 'Work', craft: 'Craft', contact: 'Contact' },
  hero: {
    title: 'Hi there, I am Amalsabi',
    sub: 'I’m a student from Indonesia with a keen interest in artificial intelligence, and I often experiment with machine learning and deep learning.',
    cta: 'View selected work',
    altitude: 'Altitude',
    scroll: 'Scroll to climb',
  },
  work: {
    title: 'Selected expeditions',
    hint: 'Scroll or drag sideways',
  },
  craft: {
    title: 'Built with precision, tuned by feel.',
    motion: { title: 'Motion and WebGL', body: 'Scroll-driven stories, shaders and physics that hold 60 fps on real devices.' },
    perf: {
      title: 'Performance budget',
      body: 'Budgets are enforced in CI from the first commit, not audited at the end.',
      lcp: 'Largest paint',
      cls: 'Layout shift',
      inp: 'Interaction delay',
    },
    repo: {
      title: "This website's source code is open source",
      cta: 'Click here',
      forks: 'Forks',
      stars: 'Stars',
      watchers: 'Watchers',
    },
    stack: { title: 'Toolbox', myTech: 'My Core Tech', thisWeb: 'This Website Stack' },
    experience: {
      title: 'Aktifitas',
      rows: [
        { years: '2022 – now', role: 'Learning Machine Learning and Deep Learning', org: 'AI & Data Science' },
      ],
    },
    contact: { title: 'Have a summit in mind?', cta: 'Say hello' },
  },
  cursor: { view: 'View project', drag: 'Drag' },
  ui: { language: 'Language', theme: 'Switch theme', sound: 'Sound and haptics' },
};

export type Dictionary = typeof en;

const id: Dictionary = {
  meta: {
    title: 'Amalsabi — Creative Technologist & Interactive Developer',
    description:
      'Portofolio Amalsabi, teknolog kreatif yang membangun pengalaman web sinematik berperforma tinggi dengan WebGL, GSAP, dan Next.js.',
    keywords: ['teknolog kreatif', 'pengembang interaktif', 'WebGL', 'GSAP', 'Next.js', 'portofolio'],
    jobTitle: 'Teknolog Kreatif & Pengembang Interaktif',
  },
  nav: { work: 'Karya', craft: 'Keahlian', contact: 'Kontak' },
  hero: {
    title: 'Halo, saya Amalsabi',
    sub: 'Saya adalah pelajar asal Indonesia yang tertarik pada kecerdasan buatan dan sering bereksperimen dengan machine learning dan deep learning.',
    cta: 'Lihat karya pilihan',
    altitude: 'Ketinggian',
    scroll: 'Gulir untuk mendaki',
  },
  work: {
    title: 'Ekspedisi pilihan',
    hint: 'Gulir atau seret ke samping',
  },
  craft: {
    title: 'Dibangun presisi, disetel dengan rasa.',
    motion: { title: 'Gerak dan WebGL', body: 'Cerita berbasis scroll, shader, dan fisika yang tetap 60 fps di perangkat nyata.' },
    perf: {
      title: 'Anggaran performa',
      body: 'Batas performa ditegakkan di CI sejak commit pertama, bukan diaudit di akhir.',
      lcp: 'Render terbesar',
      cls: 'Pergeseran tata letak',
      inp: 'Jeda interaksi',
    },
    repo: {
      title: 'Source code website ini terbuka',
      cta: 'klik disini',
      forks: 'Forks',
      stars: 'Stars',
      watchers: 'Watchers',
    },
    stack: { title: 'Perkakas', myTech: 'Teknologi Utama', thisWeb: 'Teknologi Website Ini' },
    experience: {
      title: 'Aktifitas',
      rows: [
        { years: '2022 – now', role: 'Learning Machine Learning and Deep Learning', org: 'AI & Data Science' },
      ],
    },
    contact: { title: 'Punya puncak yang ingin didaki?', cta: 'Sapa saya' },
  },
  cursor: { view: 'Lihat proyek', drag: 'Seret' },
  ui: { language: 'Bahasa', theme: 'Ganti tema', sound: 'Suara dan haptik' },
};

const zh: Dictionary = {
  meta: {
    title: 'Amalsabi — 创意技术专家与交互开发工程师',
    description: 'Amalsabi 的作品集：创意技术专家，使用 WebGL、GSAP 与 Next.js 打造电影感、高性能的网页体验。',
    keywords: ['创意技术专家', '交互开发', 'WebGL', 'GSAP', 'Next.js', '作品集'],
    jobTitle: '创意技术专家与交互开发工程师',
  },
  nav: { work: '作品', craft: '技艺', contact: '联系' },
  hero: {
    title: '你好，我是 Amalsabi',
    sub: '我是一名来自印度尼西亚的学生，对人工智能很感兴趣，也经常进行机器学习和深度学习实验。',
    cta: '查看精选作品',
    altitude: '海拔',
    scroll: '向下滚动，开始攀登',
  },
  work: {
    title: '精选远征',
    hint: '滚动或左右拖动',
  },
  craft: {
    title: '以精度构建，以手感打磨。',
    motion: { title: '动效与 WebGL', body: '由滚动驱动的叙事、着色器与物理效果，在真实设备上稳定 60 帧。' },
    perf: {
      title: '性能预算',
      body: '从第一次提交起就在 CI 中强制执行性能预算，而不是最后才审计。',
      lcp: '最大内容绘制',
      cls: '布局偏移',
      inp: '交互延迟',
    },
    repo: {
      title: '本站源代码已完全开源',
      cta: '点击这里',
      forks: 'Forks',
      stars: 'Stars',
      watchers: 'Watchers',
    },
    stack: { title: '工具箱', myTech: '核心技术栈', thisWeb: '本站构建技术' },
    experience: {
      title: '近期活动',
      rows: [
        { years: '2022 – now', role: 'Learning Machine Learning and Deep Learning', org: 'AI & Data Science' },
      ],
    },
    contact: { title: '心中有座山峰？', cta: '打个招呼' },
  },
  cursor: { view: '查看项目', drag: '拖动' },
  ui: { language: '语言', theme: '切换主题', sound: '声音与触感' },
};

export const dictionary: Record<Locale, Dictionary> = { en, id, zh };
