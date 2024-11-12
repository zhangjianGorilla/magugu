import { defineNavbarConfig } from 'vuepress-theme-plume'

export const navbar = defineNavbarConfig([
  {
    text: '履历',
    link: '/notes/personhistory/',
    activeMatch: '^/personhisitory/',
    icon: 'mdi:person-badge-outline',
    //icon: 'material-symbols:menu-book',
  },
  { 
    text: 'Java', 
    link: '/notes/java/Java基础.md', 
    activeMatch: '^/java/',
    icon: 'devicon:java-wordmark',
  },
  { 
    text: '框架', 
    link: '/notes/frame/Spring.md', 
    activeMatch: '^/frame/', 
    icon: 'devicon:spring-wordmark'
  },
  { text: '数据库', 
    link: '/notes/database/MySQL.md', 
    activeMatch: '^/database/', 
    icon: 'iconoir:database-tag',
  },
  { text: 'MQ', 
    link: '/notes/mq/RabbitMQ.md', 
    activeMatch: '^/mq/', 
    icon: 'mdi:mq',
  },
  { text: '备忘录', 
    link: '/notes/memorandum/', 
    activeMatch: '^/memorandum/', 
    icon: 'emojione:memo'
  },
  {
    text: '更多',
    icon: 'mingcute:more-3-fill',
    items: [
      { 
        text: 'ArchLinux', 
        link: '/notes/other/ArchLinux.md',
        icon: 'devicon:archlinux'
      },
      {
        text: 'Hyprland',
        link: '/notes/other/Hyprland.md',
        icon: 'simple-icons:hyprland'
      },
      {
        text: 'foo',
        link: '/notes/other/foo.md',
        // icon: 'simple-icons:hyprland'
      }
    ]
  },
])