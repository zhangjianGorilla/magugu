import { defineNoteConfig, defineNotesConfig } from 'vuepress-theme-plume'

const demoNote = defineNoteConfig({
  dir: 'demo',
  link: '/demo',
  sidebar: ['', 'foo', 'bar'],
})

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

export const notes = defineNotesConfig({
  dir: 'notes',
  link: '/',
  notes: [javaNote, demoNote],
})
