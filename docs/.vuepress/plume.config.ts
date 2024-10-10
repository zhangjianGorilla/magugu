import { defineThemeConfig } from 'vuepress-theme-plume'
import { navbar } from './navbar'
import { notes } from './notes'

/**
 * @see https://theme-plume.vuejs.press/config/basic/
 */
export default defineThemeConfig({
  logo: '/logo.svg',
  // your git repo url
  docsRepo: 'https://github.com/zhangjianGorilla/magugu',
  docsDir: 'docs',

  appearance: true,

  profile: {
    avatar: 'https://theme-plume.vuejs.press/plume.png',
    name: '麻咕咕',
    description: '麻咕咕？你知道是啥吗？',
    // circle: true,
    // location: '',
    // organization: '',
  },

  navbar,
  notes,
  social: [
    { icon: 'github', link: 'https://github.com/zhangjianGorilla/magugu' },
  ],

})
