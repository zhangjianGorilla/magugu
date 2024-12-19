---
title: SQL概述
createTime: 2024/12/19 13:38:52
permalink: /database/ux6emdrf/
---

SQL 是用于访问和处理数据库的标准的计算机语言。

### 1. SQL 的分类

- DDL (Data Definition Language，数据定义语言)，这些语句定义了不同的数据库、表、视图、索引等数据库对象，还可以用来创建、删除、修改数据库和数据表的结构。
  - 主要的语句关键字包括：CREATE、ALTER、DROP、RENAME、TRUNCATE 等。
- DML (Data Manipulation Language， 数据操作语言)，用于添加、删除、更新和查找数据库记录，并检查数据完整性。
  - 主要的语句关键字包括：INSERT、DELETE、UPDATE、SELECT 等。
  - **SELECT 是 SQL 语言的基础，最为重要**。
- DCL (Data Control Language，数据控制语言)，用于定义数据库、表、字段、用户的访问权限和安全级别。
  - 主要的语句关键字包括：COMMIT、ROLLBACK、SACEPOINT、GRANT、REVOKE 等。

###  2. SQL 语言的规则和规范

#### 2.1 基本规则

- SQL 可以写在一行或者多行。为了提高可读性，各子句分行写，必要时使用缩进
- 每条命令以 ";" 或 \g 或 \G 结束
- 关键字不能被缩写也不能分行
- 关于标点符号
  - 必须保证所有的 ()、单引号、双引号是成对结束的
  - 必须使用英文状态下的半角输入方式
  - 字符串行和日期类型的数据可以使用单引号 (' ') 表示
  - 列的别名，尽量使用双引号 (" ")，而且不建议省略 as

#### 2.2 SQL大小写规范

- MySQL 在 Windows 环境下是大小写不敏感的
- MySQL 在 Linux 环境下是大小写敏感的
  - 数据库名、表名、表的别名、变量名是严格区分大小写的
  - 关键字、函数名、列名 (或字段名)、列的别名 (字段的别名) 是忽略大小写的。
- 推荐采用统一的书写规范：
  - 数据库名、表名、表别名、字段名、字段别名等都小写
  - SQL 关键字、函数名、绑定变量等都大写

#### 2.3 注释

可以使用如下格式的注释结构

```sql
#单行注释

-- 单行注释，--后必须空格

/*
多行注释
*/
```

#### 2.4 命名规则

- 数据库、表名不得超过 30 个字符，变量名限制为 29 个。
- 必须只能包含 A-Z，a-z，0-9，_ 共63个字符。
- 数据库名、表名、字段名等对象名中间不要包含空格。
- 同一个 MySQL 软件中，数据库不能同名，同一个库中，表不能重名，同一个表中，字段不能重名。
- 必须保证字段没有和保留字、数据库系统或常用方法冲突。如果坚持使用，请在 SQL 语句中使用 `` 引起来。
- 保持字段名和类型的一致性，在命名字段并为其制定数据类型的时候一定要保证一致性。加入数据类型在一个表里是整数，在另一个表里也一定要是整数。

### 3. 最基本的 SELECT 语句

- `SELECT ···`

    ```sql
    SELECT 1+1;
    SELECT 1+1 FROM DUAL;  # DUAL 伪表
    ```

- `SELECT 字段名1, 字段名2, ··· FROM 表名`

    ```sql
    SELECT name, age, six FROM user;
    ```

- `SELECT 字段名 AS 别名 FROM 表名`

    ```sql
    SELECT u_name name, u_age AS age, u_six AS "six" from user;
    ```

  别名用 " "，不要用 ' ' 号。AS 可省略。

- 去重：`SELECT DISTINCT 字段名 FROM 表名;`

    ```sql
    SELECT DISTINCT age FROM user;
    ```

- 空值 (NULL) 参与运算

  NULL 不等于 0、" "、"NULL"，代表暂时没有值，NULL 参与运算，结果也为 NULL。例如：

    ```sql
    SELECT age + 2 FROM user;
    ```

  如果有一条记录的 age 为 NULL，那么执行 SQL 后，这条记录的结果仍然是 NULL。可以通过IFNULL() 函数给 NULL 赋值。

    ```sql
    SELECT IFNULL(age, 0) + 2 FROM user;
    ```

  IFNULL() 会先判断 age 的值，如果为 NULL，则赋值为 0。

- 着重号 ``

  如果字段名或着表名与关键字相同，则需要用 `` 将字段名或表名引起来。例如：

    ```sql
    SELECT total FROM `order`;
    ```

- 查询常数

    ```sql
    SELECT `熊猫` AS name, last_name FROM user;
    ```

- 显示表结构 `DESCRIBE 表名` 或 `DESC 表名`

    ```sql
    DESCRIBE user；
    或
    DESC user;
    ```

- 过滤数据

    ```sql
    SELECT * FROM user WHERE age < 20;
    SELECT * FROM user WHERE age < 20 AND six = 0;
    ```