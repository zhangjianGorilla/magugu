import { defineNoteConfig, defineNotesConfig } from 'vuepress-theme-plume'

const javaNote = defineNoteConfig({
  dir: 'java',
  link: '/java',
  sidebar:[
    {
      text: 'Java',
      collapsed: false,
      items: [
        'Java基础',
        'JVM',
      ],
    },
  ]
})

const frameNote = defineNoteConfig({
  dir: 'frame',
  link: '/frame',
  sidebar: [
    {
      text: '框架',
      collapsed: false,
      items: [
        'Spring',
        'Spring MVC',
        'Spring Boot',
        'Spring Cloud',
        'Mybatis',
        'Mybatis-Plus',
      ]
    }
  ]
})

const databaseNote = defineNoteConfig({
  dir: 'database',
  link: '/database',
  sidebar: [
    {
      text: '数据库',
      collapsed: false,
      items: [
        'MySQL',
        'Redis',
        'Mongo',
        'Elastic Search',
        'Nebula Graph',
      ]
    }
  ]
})

const mqNote = defineNoteConfig({
  dir: 'mq',
  link: '/mq',
  sidebar: [
    {
      text: 'MQ',
      collapsed: false,
      items: [
        'RabbitMQ',
        'RocketMQ',
        'Kafka',
      ]
    }
  ]
})

const otherNote = defineNoteConfig({
  dir: 'other',
  link: '/other',
  sidebar: [
    {
      text: '更多',
      collapsed: false,
      items: [
        'ArchLinux',
        'Hyprland',
        'foo'
      ]
    }
  ],
})

export const notes = defineNotesConfig({
  dir: 'notes',
  link: '/',
  notes: [javaNote, frameNote, databaseNote, mqNote, otherNote],
})
