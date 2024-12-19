---
title: MySQL 事务日志
createTime: 2024/12/19 14:23:23
permalink: /database/ry5kkdx1/
---

事务有 4 种特性：原子性、一致性、隔离性和持久性。那么事务的四种特性到底是基于什么机制实现呢？

- 事务的隔离性由锁机制实现。
- 而事务的原子性、一致性和持久性由事务的 redo 日志和 undo 日志来保证。
    - REDO LOG 称为重做日志，提供再写入操作，恢复提交事务修改的页操作，用来保证事务的持久性。
    - UNDO LOG 称为回滚日志，回滚行记录到某个特定版本，用来保证事务的原子性、一致性。

有的 DBA 或许会认为 UNDO 是 REDO 的逆过程，其实不然。REDO 和 UNDO 都可以视为一种恢复操作，但是：

- REDO LOG：是存储引擎层 (innodb) 生成的日志，记录的是物理级别上的页修改操作，比如页号xxx、偏移量yyy写入了zzz数据。主要为了保证数据的可靠性；
- UNDO LOG：是存储引擎层 (innodb) 生成的日志，记录的是逻辑操作日志，比如对某一行数据进行了 INSERT 语句操作，那么 UNDO LOG 就记录一条与之相反的 DELETE 操作。主要用于事务的回滚 (UNDO LOG 记录的是每个修改操作的逆操作) 和一致性非锁定读 (UNDO LOG 回滚行记录到某种特定的版本——MVCC，即多版本并发控制)。

### 1. redo 日志

InnoDB 存储引擎是以页为单位来管理存储空间的。在真正访问页面之前，需要把磁盘上的页缓存到内存中的 Buffer Pool 之后才可以访问。所有的变更都必须先更新缓冲池中的数据，然后缓冲池中的脏页会以一定的频率被刷入磁盘 (checkPoint 机制)，通过缓冲池来优化 CPU 和磁盘之间的鸿沟，这样就可以保证整体的性能不会下降太快。

#### 1.1 为什么需要 REDO 日志

一方面，缓冲池可以帮助我们消除 CPU 和磁盘之间的鸿沟，checkpoint 机制可以保证数据的最终落盘，然而由于 checkpoint 并不是每次变更的时候就触发的，而是 master 线程隔一段时间去处理的。所以最坏的情况是事务提交后，刚写完缓冲池，数据库宕机了，那么这段数据就丢失的，无法恢复。

另一方面，事务包含持久性的特性，就是说对于一个已经提交的事务，在事务提交后即使系统发生了崩溃，这个事务对数据库所做的更改也不能丢失。

那么如何保证这个持久性呢？一个简单的做法：在事务提交完成之前把该事务所修改的所有页面都刷新到磁盘，但是这个简单粗暴的做法有些问题：

- 修改量与刷新磁盘工作量严重不成比例

  有时候我们仅仅修改了某个页面中的一个字节，但是我们知道在 InnoDB 中是以页为单位来进行磁盘 IO 的，也就是说我们在该事务提交时不得不将一个完整的页面从内存中刷新到磁盘，我们又知道一个页面默认是 16KB 大小，只修改一个字节就要刷新 16KB 的数据到磁盘上显然是太小题大做了。

- 随机 IO 刷新较慢

  一个事务可能包含很多语句，即使是一条语句也可能修改许多页面，假如该事务修改的这些页面可能并不相邻，这就意味着在将某个事务修改的 Buffer Pool 中的页面刷新到磁盘时，需要进行很多的随机 IO，随机 IO 比顺序 IO 要慢，尤其对于传统的机械硬盘来说。

另一个解决的思路：我们只是想让已经提交了的事务对数据库中数据所作的修改永久有效，即使后来系统崩溃，在重启后也能把这种修改恢复出来。所以我们其实没有必要在每次事务提交时就把该事务在内存中修改过的全部页面刷新到磁盘，只需要把修改了哪些东西记录一下就好。比如，某个事务将系统表空间中第 10 号页面中偏移量为 100 处的那个字节的值 1 改为 2。我们只需要记录一下：将第 0 号表空间的 10 号页面的偏移量为 100 处的值更新为 2。

InnoDB 引擎的事务采用了 WAL (Write-Ahead Logging)，这种技术的思想就是先写日志，在写磁盘，只有日志写入成功，才算事务提交成功，这里的日志就是 redo log。当发生宕机且数据未刷到磁盘的时候，可以通过 redo log 来回复，保证 ACID 中的 D，这就是 redo log 的作用。

![redo概念图](/mysql/redo概念图.png)

#### 1.2 REDO 日志的好处、特点

**好处**：

- redo 日志降低了刷盘频率
- redo 日志占用的空间非常小

存储表空间 ID、页号、偏移量以及需要更新的值，所需的存储空间是很小的，刷盘快。

**特点**：

- redo 日志是顺序写入磁盘的

在执行事务的过程中，没执行一条语句，就可能产生若干条 redo 日志，这些日志是按照产生的顺序写入磁盘的，也就是使用顺序 IO，效率比随机 IO 快。

- 事务执行过程中，redo log 不断记录

redo log 跟 bin log 的区别，redo log 是存储引擎层产生的，而 bin log 是数据库层产生的。假设一个事务，对表做 10 万行的记录插入，在这个过程中，一直不断往 redo log 顺序记录，而 bin log 不会记录，直到这个事务提交，才会一次写入到 bin log 文件中。

#### 1.3 redo 的组成

Redo log 可以简单分为以下两个部分：

- 重做日志的缓冲 (redo log buffer)，保存在内存中，是易失的。

  在服务器启动时就向操作系统申请了一大片称之为 redo log buffer 的连续内存空间，翻译成中文就是 redo 日志缓冲区。这片内存空间被划分成若干个连续的 redo log block。一个 redo log block 占用 512 字节大小。

  ![logbuffer结构示意图](/mysql/logbuffer结构示意图.png)

  **参数设置：innodb_log_buffer_size：**

  redo log buffer 大小，默认 16M，最大值时 4096M，最小值为 1M。

    ```sql
    SHOW VARIABLES LIKE '%innodb_log_buffer_size%';
    +------------------------+----------+
    | Variable_name          | Value    |
    +------------------------+----------+
    | innodb_log_buffer_size | 16777216 |
    +------------------------+----------+
    ```

- 重做日志文件 (redo log file)，保存在硬盘中，是持久的。

  REDO 日志文件如图所示，其中的 ib_logfile0 和 ib_logfile1 即为 REDO 日志。

#### 1.4 redo 的整体流程

以一个更新事务为例，redo log 流转过程，如下图所示：

![更新事务](/mysql/更新事务redolog.png)

```text
第一步：先将原始数据从磁盘中读入内存中来，修改数据的内存拷贝
第二步：生成一条重做日志并写入 redo log buffer，记录的是数据被修改后的值
第三步：当事务 commit 时，将 redo log buffer 中的内容刷新到 redo log file，对 redo log file 采用追加写的方式
第四步：定期将内存中修改的数据刷新到磁盘中
```

>体会：
>
>Write-Ahead Log (预先日志持久化)：在持久化一个数据页之前，先将内存中相应的日志页持久化。

#### 1.5 redo log 的刷盘策略

redo log 的写入并不是直接写入磁盘的，InnoDB 引擎会在写 redo log 的时候先写 redo log buffer，之后以一定的频率刷入到真正的 redo log file 中。这里的一定频率怎么看待呢？这就是我们要说的刷盘策略。

![redo刷盘](/mysql/redolog刷盘策略.png)

注意，redo log buffer 刷盘到 redo log file 的过程并不是真正的刷到磁盘中去，只是刷入到文件系统缓存 (page cache) 中去 (这是现代操作系统为了提高文件写入效率做的一个优化)，真正的写入会交给系统自己来决定 (比如 page cache 足够大了)。那么对于 InnoDB 来说就存在一个问题，如果交给系统来同步，同样如果系统宕机，那么数据也丢失了 (虽然整个系统宕机的概率还是比较小的)。

针对这种情况，InnoDB 给出 `innodb_flush_log_at_trx_commit` 参数，该参数控制 commit 提交事务时，如何将 redo log buffer 中的日志刷新到 redo log file 中。它支持三种策略：

- 设置为 0：表示每次事务提交时不进行刷盘操作。(系统默认 master thread 每隔 1s 进行一次重做日志的同步)
- 设置为 1：表示每次事务提交时都将进行同步，刷盘操作 (默认值)
- 设置为 2：表示每次事务提交时都只把 redo log buffer 内容写入 page cache，不进行同步。由 os 自己决定什么时候同步到磁盘文件。

```sql
SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit';
+--------------------------------+-------+
| Variable_name                  | Value |
+--------------------------------+-------+
| innodb_flush_log_at_trx_commit | 1     |
+--------------------------------+-------+
```

另外，InnoDB 存储引擎有一个后台线程，每隔 1 秒，就会把 `redo log buffer` 中的内容写到文件系统缓存 (page cache)，然后调用刷盘操作。

![redolog刷盘](/mysql/redolog刷盘-1.png)

也就是说，一个没有提交事务的 redo log 记录，也可能会刷盘。因为在事务执行过程 redo log 记录是会写入 redo log buffer 中，这些 redo log 记录会被后台线程刷盘。

![redolog刷盘](/mysql/redolog刷盘-2.png)

除了后台线程每秒 1 次的轮训操作，还有一种情况，当 redo log buffer 占用的空间即将达到 innodb_log_buffer_size (这个参数默认是 16M) 的一半的时候，后台线程会主动刷盘。

#### 1.6 不同刷盘策略演示

- 流程图

  ![刷盘策略流程图](/mysql/innodb_flush_log_at_trx_commit为1.png)

  > 小结：innodb_flush_log_at_trx_commit=1
  >
  > 为 1 时，只要事务提交成功，redo log 记录就一定在硬盘里，不会有任何数据丢失。
  >
  > 如果事务执行期间 MySQL 挂了或宕机，这部分日志丢了，但是事务并没有提交，所以日志丢了也不会有损失。可以保证 ACID 的 D，数据绝对不会丢失，但是效率最差的。
  >
  > 建议使用默认值，虽然操作系统宕机的概率理论小于数据库宕机的概率，但是一般既然使用了事务，那么数据的安全相对来说更重要些。

  ![innodb_flush_log_at_trx_commit=2](/mysql/innodb_flush_log_at_trx_commit为2.png)

  > 小结：innodb_flush_log_at_trx_commit=2
  >
  > 为 2 时，只要事务提交成功，redo log buffer 中的内容只写入文件系统缓存 (page cache)。
  >
  > 如果仅仅只是 MySQL 挂了不会有任何数据丢失，但是操作系统宕机可能会有 1 秒数据的丢失，这种情况下无法满足 ACID 中的 D。但是数值 2 肯定是效率最高的。

  ![innodb_flush_log_at_trx_commit为0](/mysql/innodb_flush_log_at_trx_commit为0.png)

  > 小结：innodb_flush_log_at_trx_commit=0
  >
  > 为 0 时，master thread 中每 1 秒进行一次重做日志的 fsync 操作，因此实例 crash 最多丢失 1 秒钟内的事务。(master thread 是负责将缓冲池中的数据异步刷新到磁盘，保证数据的一致性)
  >
  > 数值 0 的话，是一种折中的做法，它的 IO 效率理论是高于 1 的，低于 2 的，这种策略也有丢失数据的风险，也无法保证 D。

#### 1.7 写入 redo log buffer 过程

**1. **
