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
  link: '/database/',
  sidebar: [
    {
      text: '数据库',
      icon: 'iconoir:database-tag',
      collapsed: false,
      items: [
        '',
        {
          text: 'MySQL',
          icon: 'skill-icons:mysql-light',
          prefix: 'mysql',
          collapsed: true,
          items: [
            '安装',
            'SQL概述',
            '运算符',
            '排序与分页',
            '多表查询',
            '函数',
            '子查询',
            '创建和管理表',
            '数据处理之增删改',
            'MySQL 数据类型精讲',
            '约束',
            '视图',
            '存储过程与存储函数',
            '变量、流程控制与游标',
            '触发器',
            'MySQL 8 其它新特性',
            '用户与权限管理',
            '逻辑架构',
            '存储引擎',
            '索引的数据结构',
            'InnoDB 数据存储结构',
            '索引的创建与设计原则',
            '性能分析工具的使用',
            '索引优化与查询优化',
            '数据库的设计规范',
            '数据库其它调优策略',
            '事务基础知识',
            'MySQL 事务日志',
          ],
        },
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
