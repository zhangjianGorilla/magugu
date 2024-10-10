import { defineNavbarConfig } from 'vuepress-theme-plume'

export const navbar = defineNavbarConfig([
  { text: 'Java', link: '/notes/java/Java基础.md', activeMatch: '^/java/',},
  { text: '框架', link: '/frame/' },
  { text: '数据库', link: '/database/' },
  { text: 'MQ', link: '/mq/' },
  { text: '备忘录', link: '/memorandum/' },
  {
    text: '更多',
    items: [{ text: '示例', link: '/notes/demo/README.md' }]
  },
])