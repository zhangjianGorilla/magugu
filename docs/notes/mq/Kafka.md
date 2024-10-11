---
title: Kafka
tags:
  - MQ
  - 低延时
createTime: 2024/10/11 09:46:54
permalink: /mq/ypxabaw4/
---

## 消息队列的流派

### 什么是 MQ

Message Queue (MQ)，消息队列中间件。很多人都说：MQ 通过将消息的发送和接收分离来实现应用程序的异步和解偶，这个给人的直觉是——MQ 是异步的，用来解偶的，但是这个只是 MQ 的效果而不是目的。MQ 真正的目的是为了通讯，屏蔽底层复杂的通讯协议，定义了一套应用层的、更加简单的通讯协议。一个分布式系统中两个模块之间的通讯要么是 HTTP，要么是自己开发的 (rpc) TCP，但是这两种协议其实都是原始的协议。HTTP 协议很难实现两端通讯——模块 A 可以调用 B，B 也可以主动调用 A，如果要做到这个两端都要背上 WebServer，而且还不支持长连接 (HTTP 2.0 的库根本找不到)。TCP 就更加原始了，粘包、心跳、私有的协议，想一想头皮就发麻。MQ 所要做的就是在这些协议之上构建一个简单的“协议”——生产者/消费者模型。MQ 带给我们的“协议”不是具体的通讯协议，而是更高层次通讯模型。它定义了两个对象——发送数据的叫生产者；接收数据的叫消费者，提供一个 SDK 让我们可以定义自己的生产者和消费者实现消息通讯而无视底层通讯协议。**消息队列具体解决的是什么问题——通信问题**。

### 有 Broker 的 MQ

这个流派通常有一台服务器作为 Broker，所有的消息都通过它中转。生产者吧消息发送给它就结束自己的任务了，Broker 则把消息主动推送给消费者 (或者消费者主动轮询)。

#### 重 Topic

Kafka、JMS (ActiveMQ) 就属于这个流派，生产者会发送 key 和数据到 Broker，由 Broker 比较 key 之后决定给哪个消费者。这种模式是我们最常见的模式，是我们对 MQ 最多的印象。在这种模式下一个 topic 往往是一个比较大的概念，甚至一个系统就可能只有一个 topic，topic 某种意义上就是 queue，生产者发送 key 相当于说：“hi，把数据放到 key 的队列中”。

比如一个 Broker 定义了三个队列：key1、key2、key3，生产者发送数据 {key:key data:data}，Broker 在推送数据的时候则推送 data 给匹配的 key。

虽然架构一样但是 kafka 的性能要比 jms 的性能不知道高到多少倍，所以基本这种类型的 MQ 只有 kafka 一种备选方案。如果你需要一条暴力的数据流 (在乎性能而非灵活性) 那么 kafka 是最好的选择。

#### 轻 Topic

这种的代表是 RabbitMQ (或者说是 AMQP)。生产者发送 key 和数据，消费者定义订阅的队列，Broker 收到数据之后会通过一定的逻辑计算出 key 对应的队列，然后把数据交给队列。

这种模式下解偶了 key 和 queue，在这种架构中 queue 是非常轻量级的 (在 RabbitMQ 中它的上限取决于你的内存)，消费者关心的只是自己的 queue；生产者不必关心数据最终给谁只要指定 key 就行了，中间的那层映射在 AMQP 中叫 exchange (交换机)。

AMQP 中有四种 exchange

- Direct exchange：key 就等于 queue
- Fanout exchange：无视 key，给所有的 queue 都来一份
- Topic exchange：key 可以用“宽字符”模糊匹配 queue
- Headers exchange：无视 key，通过查看消息的头部元数据来决定发给哪个 queue (AMQP 头部元数据非常丰富而且可以自定义)

这种结构的架构给通讯带来了很大的灵活性，我们能想到的通讯方式都可以用这四种 exchange 表达出来。如果你需要一个企业数据总线 (在乎灵活性) 那么 RabbitMQ 绝对的值得一用。

### 无 Broker 的 MQ

无 Broker 的 MQ 的代表是 ZeroMQ。该作者非常睿智，他非常敏锐的意识到——MQ 是更高级的 Socket，它是解决通讯问题的。所以 ZeroMQ 被设计成了一个“库”而不是一个中间件，这种实现也可以达到——没有 Broker 的目的。

节点之间通讯的消息都是发送到彼此的队列中，每隔节点都既是生产者又是消费者。ZeroMQ 做的事情就是封装出一套类似于 Socket 的API 可以完成发送数据，读取数据。

ZeroMQ 其实就是一个跨语言的、重量级的 Actor 模型邮箱库。你可以把自己的程序想象成一个 Actor，ZeroMQ 就是提供邮箱功能的库；ZeroMQ 可以实现同一台机器的 RPC 通讯，也可以实现不同机器的 TCP、UDP 通讯，如果你需要一个强大的、灵活、野蛮的通讯能力，别犹豫 ZeroMQ。

## Kafka 介绍

Kafka 是最初由 Linkedin 公司开发，是一个分布式、支持分区的 (partition)、多副本的 (replica)，基于 zookeeper 协调的分布式消息系统，它的最大的特性就是可以实时的处理大量数据已满足各种需求场景：比如基于 hadoop 的批处理系统、低延迟的实时系统、Storm/Spark 流式处理引擎，web/nginx 日志、访问日志，消息服务等等，用 scala 语言编写，Linkedin 于 2010 年贡献给了 Apache 基金会并成为顶级开源项目。

### Kafka 的使用场景

- 日志收集：一个公司可以用 Kafka 收集各种服务的 log，通过 Kafka 以统一接口服务的方式开放给各种 consumer，例如 hadoop、Hbase、Solr 等。
- 消息系统：解耦和生产者和消费者、缓存消息等。
- 用户活动跟踪：Kafka 经常被用来记录 web 用户或者 app 用户的各种活动，如浏览网页、搜索、点击等活动，这些活动信息被各个服务器发布到 Kafka 的 topic 中，然后订阅者通过订阅这些 topic 来做实时的监控分析，或者装载到 hadoop、数据仓库中做离线分析和挖掘。
- 运营指标：Kafka 也经常用来记录运营监控数据。包括收集各种分布式应用的数据，生产各种操作的集中反馈，比如报警和报告。

### Kafka 安装

- 安装 JDK

- 下载 Kafka 安装包：http://kafka.apache.org/downloads

- 上传到 Kafka 服务器上：`/opt/kafka`

- 解压缩

- 进入到 config 目录，修改 server.properties

    ```sql
    # broker.id 属性在 kafka 集群中必须是唯一
    broker.id=0
    # kafka 部署的机器 ip 和提供服务的端口号
    listeners=PLAINTEXT://服务器ip:9092
    # kafka 的消息存储文件
    log.dir=/opt/kafka/log
    # kafka 连接 zookeeper 的地址
    zookeeper.connect=zookeeper服务器ip:2181
    ```

    **server.properties 核心配置详解**：

    | Property                   | Default                    | Descrition                                                   |
    | -------------------------- | -------------------------- | ------------------------------------------------------------ |
    | brocker.id                 | 0                          | 每个 broker 都可以用一个唯一的非负整数 id 进行标识；这个 id 可以作为 broker 的名字，你可以选择任意你喜欢的数字作为 id，只要 id 是唯一的即可。 |
    | log.dirs                   | /tmp/kafka-logs            | kafka 存放数据的路径。这个路径并不是唯一的，可以是多个，路径之间只需要使用逗号分隔即可；每当创建 partition 时，都会选择在包含最少 partitions 的路径下进行。 |
    | listeners                  | PLAINTEXT://localhost:9092 | server 接收客户端连接的端口，ip 配置 kafka 本机 ip 即可      |
    | zookeeper.connect          | localhost:2181             | zookeeper 连接字符串的格式为：hostname:port，此处 hostname 和 port 分别是 zookeeper 集群中某个节点的 host 和 port；zookeeper 如果是集群，连接方式为 hostname1:port1,hostname2:port2,hostname3:port3 |
    | log.retention.hours        | 168                        | 每个日志文件删除之前保存的时间。默认数据保存时间对所有 topic 都一样 |
    | default.replication.factor | 1                          | 自动创建 topic 的默认副本数量，建议设置为大于等于 2          |
    | min.insync.replicas        | 1                          | 当 producer 设置 ack 为 -1 时，min.insync.replicas 指定 replicas 的最小数目 (必须确认每一个 replica 的写数据都是成功的)，如果这个数目没有达到，producer 发送消息会产生异常 |
    | delete.topic.enable        | false                      | 是否允许删除主题                                             |
    | num.partitions             | 1                          | 创建 topic 的默认分区数                                      |

    

- 进入到 bin 目录内，执行一下命令来启动 kafka 服务器 

    `./kafka-server-start.sh -daemon ../config/server.properties`

- 校验 kafka 是否启动成功：

    进入到 zk 内查看是否有 kafka 的节点：`ls /brokers/ids/`

### Kafka 基本概念

Kafka 是一个分布式的，分区的消息 (官方称之为 commit log) 服务。它提供了一个消息系统应该具备的功能，但是却用独特的设计。可以这样来说，Kafka 借鉴了 JMS 规范的思想，但是却并没有完全遵循 JMS 规范。

基础的消息 (Message) 相关术语：

| 名称          | 解释                                                         |
| ------------- | ------------------------------------------------------------ |
| Broker        | 消息中间件处理节点，一个 kafka 节点就是一个 broker，一个或者多个 Broker 可以组成一个 kafka 集群 |
| Topic         | Kafka 根据 topic 对消息进行归类，发布到 Kafka 集群的每条消息都需要指定一个 topic |
| Producer      | 消息生产者，向 Broker 发送消息的客户端                       |
| Consumer      | 消息消费者，从 Broker 读取消息的客户端                       |
| ConsumerGroup | 每个 Consumer 属于一个特定的 Consumer Group，一条消息可以被多个不同的 Consumer Group 消费，但是一个 Consumer Group 中只能有一个 Consumer 能够消费该消息。 |
| Partition     | 物理上的概念，一个 topic 可以分为多个 partition，每个 partition 内部消息是有序的 |

![kafka基本概念](/images/kafka/kafka基本概念.png)

## Kafka 基本使用

### 创建主题 topic

topic 是什么概念？topic 可以实现消息的分类，不同消费者订阅不同的 topic。

执行以下命令创建 topic，这个 topic 只有一个 partition，并且备份因子也设置为1:

```shell
./kafka-topics.sh --create --zookeeper zk服务器ip:2181 --replication-factor 1 --partitions 1 --topic topic名
```

查看当前 kafka 内有哪些 topic

```shell
./kafka-topic.sh --list --zookeeper zk服务器ip:2181
```

### 发送消息

kafka 自带了一个 producer 命令客户端，可以从本地文件中读取内容，或者我们也可以以命令的行中直接输入内容，并将这些内容以消息的形式发送到 kafka 集群中。在默认情况下，每一个行会被当做成一个独立的消息。使用 kafka 的发送消息的客户端，指定发送到的 kafka 服务器地址和 topic。

```shell
./kafka-console-producer.sh --broker-list kafka服务器ip:9092 --topic topic名
```

### 消费消息

对于 consumer，kafka 同样也携带了一个命令行客户端，会将获取到内容在命令中进行输出，默认是消费最新的消息。使用 kafka 的消费者消息的客户端，从制定 kafka 服务器的指定 topic 中消费消息。

- 方式一：从最后一条消息的偏移量 +1 开始消费

    ```shell
    ./kafka-console-consumer.sh --bootstrap-server kafka服务器ip:9092 --topic topic名
    ```

- 方式二：从头开始消费

    ```shell
    ./kafka-console-consumer.sh --bootstrap-server kafka服务器ip:9092 --from-beginning --topic test
    ```

几个注意点：

- 消息会被存储
- 消息是顺序存储
- 消息是有偏移量的
- 消费时可以指明偏移量进行消费 

## 关于消息的细节

### 消息的顺序存储

- 生产者将消息发送给 broker，broker 会将消息保存在本地的日志文件中

    ```shell
    /opt/kafka/log/kafka-logs/分区-主题/00000000.log
    ```

- 消息的保存是有序的，通过 offset 偏移量来描述消息的有序性

- 消费者消费消息时也是通过 offset 来描述当前要消费的那条消息的位置

### 单播消息的实现

单播消息：一个消费组里只会有一个消费者能消费到某一个 topic 中的消息。于是可以创建多个消费者，这些消费者在同一个消费组中。

```shell
./kafka-console-consumer.sh --bootstrap-server kafka服务器ip:9092 --consumer-property group.id=消费组名 --topic topic名
```

![kafka单播消息](/images/kafka/kafka单播消息.png)

### 多播消息的实现

在一些业务场景中需要让一条消息被多个消费者消费，那么就可以使用多播模式。

kafka 实现多播，只需要让不同的消费者处于不同的消费组就可以。

```shell
./kafka-console-consumer.sh --bootstrap-server kafka服务器ip:9092 --consumer-property group.id=消费组名1 --topic topic名
./kafka-console-consumer.sh --bootstrap-server kafka服务器ip:9092 --consumer-property group.id=消费组名2 --topic topic名
```

![kafka多播消息](/images/kafka/kafka多播消息.png)

### 查看消费组及信息

```shell
# 查看当前主题下有哪些消费组
./kafka-consumer-groups.sh --bootstrap-server kafka服务器ip:9092 --list

# 查看消费组中的具体信息：比如当前偏移量、最后一条消息的偏移量、堆积的消息数量
./kafka-consumer-groups.sh --bootstrap-server kafka服务器ip:9092 --describe --group 消费组名
```

- Current-offset：当前消费组的已消费偏移量
- Log-end-offset：主题对应分区消息的结束偏移量 (HW)
- Lag：当前消费组未消费的消息数

## 主题、分区的概念

### 主题 Topic

主题 Topic 可以理解成是一个类别的名称。

### 分区 Partition

![分区](/images/kafka/partition.png)

一个主题中的消息量是非常大的，因此可以通过分区的设置，来分布式存储这些消息。比如一个 topic 创建了三个分区。那么 topic 中的消息就会分别存放在这三个分区中。

为一个主题创建多个分区

```shell
./kafka-topics.sh --create --zookeeper zk服务器ip:2181 --partition 分区数 --topic topic名
```

可以通过这样的命令查看 topic 的分区信息

```shell
./kafka-topics.sh --describe --bootstrap-server kafka服务器ip:9092 --topic topic名
```

分区的作用：

- 可以分布式存储
- 可以并行写

实际上是存在/log/kafka-logs/topic-分区/000000000.log 文件中

消费者吧定期将自己消费分区的 offset 提交给 kafka 内部的 topic：_consumer_offsets，提交过去的时候，key 是 consumerGroupId + Topic + 分区号，value 就是当前 offset 的值，kafka 会定期清理 topic 里的消息，最后就保留最新的那条数据。

因为 _consumer_offsets 可能会接收高并发的请求，kafka 默认给其分配 50 个分区 (可以通过 offsets.topic.num.partitions 设置)，这样可以通过加机器的方式抗大并发。

通过如下公式可以选出 consumer 消费的 offset 要提交到 _consumer_offsets 哪个分区

公式：`hash(consumerGroupId) % _consumer_offsets` 主题的分区数

## Kafka 集群操作

### 在一台服务器上搭建 kafka 集群

```shell
# 0 1 2
broker.id=2
# 9092 9093 9094
listeners=PLAINTEXT://ip地址:9092
# log-0 log-1 log-2
log.dir=/opt/kafka/log-1

# 启动
./kafka-server-start.sh -daemon ../config/server.properties
# 查看是否启动成功，进入zookeeper服务器
ls /brokers/ids
```

### 副本的概念

副本是对分区的备份。在集群中，不同的副本会被部署在不同的 broker 上。创建一个主题，两个分区，三个副本。

```shell
./kafka-topic.sh --create --zookeeper zk服务器ip：2181 --replication-factor 3 --partitions 2 --topic topic名

# 查看 topic 情况
./kafka-topics.sh --describe --zookeeper zk服务器ip:2181 --topic topic名
```

通过查看主题信息，其中的关键数据：

- replicas：当前副本存在的 broker 节点
- leader：副本里的概念。每个 partition 都有一个 broker 作为 leader。消息发送方要把消息发给哪个 broker？就看副本的 leader 是在哪个 broker 上面。副本里的 leader 专门用来接收消息。接收到消息，其他 follower 通过 poll 的方式来同步数据。
- follower：leader 处理所有针对这个 partition 的读写请求，而 follower 被动复制 leader，不提供读写 (主要是为了保证多副本数据与消费的一致性)，如果 leader 所在的 broker 挂掉，那么就会进行新 leader 选举。通过 kill 掉 leader 后再查看主体情况
- isr：可以同步的 broker 节点和已同步的 broker 节点，存放在 isr 集合中。

![主题、分区和副本的概念](/images/kafka/主题、分区和副本的概念.png)

### kafka 集群消息的发送

```shell
./kafka-console-producer.sh --broker-list kafka服务器0ip:9092,kafka服务器1ip:9092,kafka服务器2ip:9092 --topic topic名
```

### kafka 集群消息的消费

```shell
./kafka-console-consumer.sh --boostrap-server kafka服务器0ip:9092,kafka服务器1ip:9092,kafka服务器2ip:9092 --from-beginning --consumer-property group.id=group名 --topic topic名
```

### 关于分区消费组消费者的细节

![分区消费组消费者](/images/kafka/分区消费组消费者.png)

图中 Kafka 集群有两个 broker，每个 broker 中有多个 partition。一个 partition 只能被一个消费组里的某一个消费组消费，从而保证消费顺序。kafka 只在 partition 的范围内保证消息消费的局部顺序性，不能在同一个 topic 中的多个 partition 中保证总的消费顺序性。一个消费者可以消费多个partition。消费组中消费者的数量不能比一个 topic 中的 partition 数量多，否则多出来的消费者消费不到消息。

## Java 客户端实现生产者

### 基本实现

```java
public class SimpleProducer {

    private final static String TOPIC_NAME = "donkey-topic";

    public static void main(String[] args) throws InterruptedException {
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "121.4.107.132:9092");
        
        // 把发送的key从字符串序列化为字节数组
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        // 把发送的消息value从字符串序列化为字节数组
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());

        // 发送消息的客户端
        KafkaProducer<String, String> producer = new KafkaProducer<>(props);

        ProducerRecord<String, String> producerRecord = new ProducerRecord<>(TOPIC_NAME, "key", "value");
				RecordMetadata metadata = producer.send(producerRecord).get();
      	System.out.println("同步方式发送消息结果：" + "topic-" + metadata.topic() + "|partition-" + metadata.partition() + "|offset-" + metadata.offset());
    }
}
```

### 发送消息到指定分区上

```java
ProducerRecord<String, String> producerRecord = new ProducerRecord<>(TOPIC_NAME, 0, "key", "value");
```

### 未指定分区

会通过业务 key 的 hash 运算，算出消息往哪个分区上发

```java
ProducerRecord<String, String> producerRecord = new ProducerRecord<>(TOPIC_NAME, "key", "value");
```

### 同步发送

生产者同步发送消息，在收到 kafka 的 ack 告知发送成功之前一直处于阻塞状态，阻塞到 3s 的时间，如果还没有收到消息，会进行重试，重试的次数为 3 次。

```sql
RecordMetadata metadata = producer.send(producerRecord).get();
// ======阻塞=========
System.out.println("同步方式发送消息结果：" + "topic-" + metadata.topic() + "|partition-" + metadata.partition() + "|offset-" + metadata.offset());
```

### 异步发送

```java
producer.send(producerRecord, new Callback() {
      @Override
      public void onCompletion(RecordMetadata recordMetadata, Exception e) {
          if (e != null) {
              System.out.println("发送消息失败：" + e.getStackTrace());
          }
          if (recordMetadata != null) {
              System.out.println("异步方式发送消息结果：" + "topic-" + recordMetadata.topic() + "｜partition-" + recordMetadata.partition() + "|offset-" + recordMetadata.offset());
          }
          countDownLatch.countDown();
      }
  });
}
Thread.sleep(10000);
```

### 生产者中的 ack 配置

在同步发送的前提下，生产者在获得集群返回的 ack 之前会一直阻塞。ack 的三个值：

 * acks=0：表示producer不需要等待任何broker确认收到消息的回复，就可以继续发送下一条消息。性能最高，但是最容易丢消息。
 * acks=1 (默认值)：至少要等待leader已经成功将数据写入本地log，但是不需要等待所有follower是否成功写入。就可以继续发送吓一跳消息。这种情况下，如果follower没有成功备份数据，而此时leader又挂掉，则消息会丢失。
 * acks=-1/all：需要等待 min.insync.replicas(默认为1，推荐配置大于等于2)这个参数配置的副本个数都成功写入日志，这种策略会保证只要有一个备份存活就不会丢失数据。这是最强的数据保证。一般除非是金融级别，或跟钱打交道的场景才会使用这种配置。

下面是关于 ack 和重试 (如果没有收到 ack，就开始重试) 的配置

```java
props.put(ProducerConfig.ACKS_CONFIG, "1");
//发送失败会重试，默认重试间隔100ms，重试能保证消息发送的可靠性，
//但是也可能造成消息重复发送，比如网络抖动，所以需要在接收者那边做好消息接收的幂等性处理
props.put(ProducerConfig.RETRIES_CONFIG, 3);
// 重试间隔设置
props.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, 300);
```

### 生产者中缓冲区的配置

![kafka发送端缓冲区](/images/kafka/kafka发送端缓冲区.png)

```java
// 设置发送消息的本地缓冲区，
//设置了该缓冲区，消息会先发送发哦本地缓冲区，可以提高消息发送性能，默认值是33554432(也就是32MB)
props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 33554432);

//kafka本地线程会从缓冲区去数据，批量发送到broker，
//设置批量发送消息的大小，默认值是16384，即16kb，就是说一个batch满了16kb就发送出去
props.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);

//默认值是0，意思就是消息必须立即被发送出去，但是这样会影响性能，
//一般设置10ms左右，就是说这个消息发送完后会进入本地的一个batch，
//如果10ms内，这个batch满了16kb就会随batch一起被发送出去，
//如果10ms内，batch没满，那么也必须把消息发送出去，不能让消息的发送延迟时间太长
props.put(ProducerConfig.LINGER_MS_CONFIG, 10);
```

## Java客户端实现消费者

### 基本实现

```java
public class TestConsumer {
    private final static String TOPIC_NAME = "donkey-topic";
    private final static String CONSUMER_GROUP_NAME = "donkeyGroup";

    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "121.4.107.132:9092");
        // 消费分组名
        props.put(ConsumerConfig.GROUP_ID_CONFIG, CONSUMER_GROUP_NAME);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
        // 消费者订阅主题列表
        consumer.subscribe(Arrays.asList(TOPIC_NAME));
        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
            for (ConsumerRecord<String, String> record : records) {
                System.out.printf("收到消息：partition = %d, offset = %d, key = %s, value = %s%n", record.partition(), record.offset(), record.key(), record.value());
            }
        }
    }
}
```

### 自动提交 offset

**提交的内容：**消费者无论是自动提交还是手动提交，都需要把**所属的消费组+消费的某个主题+消费的某个分区及消费的偏移量**，这样的信息提交到集群的 _consumer_offsets 主题里面。

设置自动提交参数 - 默认

```java
// 是否自动提交offset，默认就是 true
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");
// 自动提交offset的间隔时间
props.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "1000");
```

消费者 poll 到消息后默认情况下，会自动向 broker 的 _consumer_offset 主题提交当前主题-分区消费的偏移量。

自动提交会丢消息：因为如果消费者还没消费完 poll 下来的消息就自动提交了偏移量，那么此时消费者挂了，于是下一个消费者会从已提交的 offset 的下一个位置开始消费消息。之前未被消费的消息就丢失掉了。

### 手动提交 offset

- 设置手动提交参数

    ```java
    props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
    ```

- 在消费完消息后手动提交

    - 手动同步提交

        ```java
        if (records.count > 0) {
          // 手动同步提交 offset，当前线程会阻塞直到 offset 提交成功
          // 一般使用同步提交，因为提交之后一般也没有什么逻辑代码了
          consumer.commitSync();
        }
        ```

    - 手动异步提交

        ```java
        if (records.count() > 0) {
          // 手动异步提交 offset，当前线程提交 offset 不会阻塞，可以继续处理后面的程序逻辑
          consumer.commitAsync(new OffsetCommitCallback() {
            @Override
            public void onComplete(Map<TopicPartition, OffsetAndMetadata> offsets, Exception e) {
              if (e != null) {
                System.err.println("Commit failed for " + offsets);
                System.err.println("Commit failed exception: " + e.getStackTrace());
              }
            } 
          });
        }
        ```


### 消费者 poll 消息的过程

- 消费者建立了与 broker 之间的长连接，开始 poll 消息。

- 默认一次 poll 500 条消息。

    ```java
    props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 500);
    ```
    
    可以根据消费速度的快慢来设置，因为如果两次 poll 的时间如果超出了 30s 的时间间隔，kafka 会认为其消费能力过弱，将其踢出消费组。将分区分配给其他消费者。可以通过这个值进行设置：
    
    ```java
    props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 30 * 1000);
    ```

- 如果每隔 1s 内没有 poll 到任何消息，则继续去 poll 消息，循环往复，直到 poll 到消息。如果超出了 1s，则此次长轮询结果。

    ```java
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
    ```

- 消费者发送心跳的时间间隔

    ```java
    props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 1000);
    ```

- kafka 如果超过 10s 没有收到消费者的心跳，则会把消费者提出消费组，进行 rebalance，把分区分配给其他消费者。

    ```java
    props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 10 * 1000);
    ```


### 指定分区消费

```java
consumer.assign(Arrays.asList(new TopicPartition(TOPIC_NAME, 0)));
```

### 消息回溯消费

```java
consumer.assign(Arrays.asList(new TopicPartition(TOPIC_NAME, 0)));
consumer.seekToBeginning(Arrays.asList(new TopicPartition(TOPIC_NAME, 0)));
```

### 指定 offset 消费

```java
consumer.assign(Arrays.asList(new TopicPartition(TOPIC_NAME, 0)));
consumer.seek(new TopicPartition(TOPIC_NAME, 0), 10);
```

### 从指定时间点消费

```java
List<PartitionInfo> topicPartitions = consumer.partitionsFor(TOPIC_NAME);
// 从一小时前开始消费
long fetchDataTime = new Date().getTime() - 1000 * 60 * 60;
Map<TopicPartition, Long> map = new HashMap<>();
for (PartitionInfo par : topicPartitions) {
  map.put(new TopicPartition(TOPIC_NAME, par.partition()), fetchDataTime);
}
Map<TopicPartition, OffsetAndTimestamp> parMap = consumer.offsetsForTimes(map);
for (Map.Entry<TopicPartition, OffsetAndTimestamp> entry : parMap.entrySet()) {
  TopicPartition key = entry.getKey();
  OffsetAndTimestamp value = entry.getValue();
  if (key == null || value == null) continue;
  Long offset = value.offset();
  System.out.println("partition-" + key.partition() + "|offset-" + offset);
  System.out.println();
  // 根据消费里的 timestamp 确定 offset
  if (value != null) {
    consumer.assign(Arrays.asList(key));
    consumer.seek(key, offset);
  }
}
```

### 新消费组的消费偏移量

当消费主题的是一个新的消费组，或者指定 offset 的消费方式，offset 不存在，那么应该如何消费？

- latest (默认)：只消费自己启动之后发送到主题的消息

- earliest：第一次从头开始消费，以后按照消费 offset 记录继续消费，这个需要区别于 consumer.seekToBeginning(每次都从头开始消费)

    ```java
    props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
    ```

## SpringBoot 中使用 Kafka

### 导入 Maven 依赖

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

### 配置

```yml
spring:
  kafka:
    # kafka服务器地址
    bootstrap-servers: 121.4.107.132:9092
    # 生产者
    producer:
      # 设置大于0的值，则客户端会将发送失败的记录重新发送
      retries: 3
      batch-size: 16384
      buffer-memory: 33554432
      acks: 1
      # 指定消息key和消息体的编解码方式
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
    # 消费者
    consumer:
      group-id: donkey-group
      enable-auto-commit: false
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringSerializer
      value-deserializer: org.apache.kafka.common.serialization.StringSerializer
      max-poll-records: 500
    listener:
      ack-mode: manual_immediate
      # 每当一条记录被消费者监听器(ListenerConsumer)处理之后提交
      # RECORD
      # 每当一批poll()的数据被消费者监听器(ListenerConsumer)处理之后提交
      # BATCH
      # 当每一批poll()的数据被消费者监听器(ListenerConsumer)处理之后，距离上次提交时间大于TIME时提交
      # TIME
      # 当每一批poll()的数据被消费者监听器(ListenerConsumer)处理之后，被处理record数量大于等于COUNT时提交
      # COUNT
      # TIME ｜ COUNT 有一条件满足时提交
      # COUNT_TIME
      # 当每一批poll()的数据被消费者监听器(ListenerConsumer)处理之后，手动调用Acknowledgment.acknowledge()后提交
      # MANUAL
      # 手动调用Acknowledgment.acknowledge()后立即提交，一般使用这种情况
      # MANUAL_IMMEDIATE
```

### 发送消息

```java
@RestController
@RequestMapping("/msg")
public class KafkaController {

  private final static String TOPIC_NAME = "";
  
  @Autowire
  private KafkaTemplate<String, String> kafkaTemplate;
  
  @RequestMapping("/send")
  public String sendMessage() {
    kafkaTemplate.send(TOPIC_NAME, 0, "key", "this is a message!");
    
    return "send success!"
  }
}
```

### 接收消息

```java
@KafkaListener(topics = {""}, groupId = "")
    public void consumerMessage2(ConsumerRecords<String, String> records, Acknowledgment ack) {
        // 批量处理
      	ack.acknowledge();
    }

@KafkaListener(groupId = "", topicPartitions = {
          @TopicPartition(topic = "", partitions = "{"", ""}"),
          @TopicPartition(topic = "", partitions = "", partitionOffsets = @PartitionOffset(partition = "", initialOffset = ""))
  }, concurrency = "")
  public void consumerMessage3(ConsumerRecord<String, String> record, Acknowledgment ack) {
      String value = record.value();
      logger.info(value);
      logger.info(String.valueOf(record));
      ack.acknowledge();
  }
```

## Kafka 集群 Controller、Rebalance 和 HW

### Controller

Kafka 集群中的 broker 在 zk 中创建临时序号节点，序号最小的节点 (最先创建的节点) 将作为集群的 controller，负责管理整个集群中的所有分区和副本的状态：

- 当某个分区的 leader 副本出现故障时，由控制器负责为该分区选举新的 leader 副本。
- 当检测到某个分区的 ISR 集合发生变化时，由控制器负责通知所有 broker 更新其元数据信息。
- 当使用 kafka-topics.sh 脚本为某个 topic 增加分区数量时，同样还是由控制器负责让新分区被其他节点感知到。

### Rebalance

前提是：消费者没有指明分区消费。当消费组里消费者和分区的关系发生变化，那么就会触发 rebalance 机制。

这个机制会重新调整消费者消费哪个分区。

在触发 rebalance 机制之前，消费者消费哪个分区有三种策略：

- range：通过公示来计算某个消费者消费哪个分区，`分区数量 / 消费者数量 + 1`
- 轮询：大家轮着消费
- sticky：在触发了 rebalance 后，在消费者消费的原分区不变的基础上进行调整。

### HW 和 LEO

HW 俗称高水位，HighWatermark 的缩写，取一个 partition 对应的 ISR 中最小的 LEO (log-end-offset) 作为 HW，consumer 最多只能消费到 HW 所在的位置。另外每个 replica 都有 HW，leader 和 follower 各自负责更新自己的 HW 的状态。对于 leader 新写入的消息，consumer 不能立刻消费，leader 会等待该消息被所有 ISR 中的 replicas 同步更新 HW，此时消息才能被 consumer 消费。这样就保证了如果 leader 所在的 broker 失效，该消息仍然可以从新选举的 leader 中获取。

![hw和leo](/images/kafka/hw和leo.png)

## Kafka 线上问题优化

### 如何防止消息丢失

- 发送方：ack 是 1 或者 -1/all 可以防止消息丢失，如果要做到 99.999%，ack 设成 all，把 min.insync.replicas 配置成分区备份数
- 消费方：把自动提交改为手动提交。

### 如何防止消息的重复消费

一条消息被消费者消费多次。如果为了消息的不重复消费，而把生产端的重试机制关闭、消费端的手动提交改成自动提交，这样反而会出现消息丢失，那么可以直接在防止消息丢失的手段上再加上消费消息时的幂等性保证，就能解决消息的重复消费问题 。

幂等性如何保证：

- mysql 插入业务 id 作为主键，主键是唯一的，所以一次只能插入一条
- 使用 redis 或 zk 的分布式锁 (主流的方案)

### 如何做到顺序消费

- 发送方：在发送时将 ack 不能设置 0，关闭重试，使用同步发送，等到发送成功在发送下一条。确保消息是顺序发送的。

- 接收方：消息是发送到一个分区中，只能有一个消费组的消费者来接收消息。

    因此，kafka 的顺序消费会牺牲掉性能。

### 解决消息积压问题

消息积压会导致很多问题，比如磁盘被打满、生产端发消息导致 kafka 性能过慢，就容易出现服务雪崩，就需要有相应的手段：

- 方案一：在一个消费者中启动多个线程，让多个线程同时消费。提升一个消费者的消费能力。
- 方案二：如果方案一还不够的话，这个时候可以启动多个消费者，多个消费者部署在不同的服务器上。其实多个消费者部署在同一服务器上也可以提高消费能力——充分利用服务器的 CPU 资源。
- 方案三：让一个消费者去把收到的消息往另一个 topic 上发，另一个 topic 设置多个分区和多个消费者，进行具体的业务消费。

### 延迟队列

延迟队列的应用场景：在订单创建成功后如果超过 30 分钟没有付款，则需要取消订单，此时可用延时队列来实现

- 创建多个 topic，每个 topic 表示延时的间隔
    - topic_5s：延时 5s 执行的队列
    - topic_1m：延时 1 分钟执行的队列
    - topic_30m：延时 30 分钟执行的队列
- 消息发送者发送消息到相应的 topic，并带上消息的发送时间
- 消费者订阅相应的 topic，消费时轮询消费整个 topic 中的消息
    - 如果消息的发送时间，和消费者的当前时间超过预设的值，比如 30 分钟
    - 如果消息的发送时间，和消费的当前时间没有超过预设的值，则不消费当前的 offset 及之后的 offset 的所有消息都消费
    - 下次继续消费该 offset 处的消息，判断时间是否已满足预设值。

## Kafka eagle

官网：https://www.kafka-eagle.org/

- 下载安装包、解压
- 安装 JDK 环境
- 配置 kafka-eagle 环境变量
- 修改配置文件：zk 服务器地址和 mysql 服务器地址
- 启动