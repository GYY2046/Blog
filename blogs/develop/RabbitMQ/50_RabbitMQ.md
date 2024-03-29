---
title: RabbitMQ 消费者确认和发布者确认模式
date: 2022-01-10
sidebar: 'auto'
tags:
 - RabbitMQ
categories:
 - RabbitMQ
---

:::tip
RabbitMQ  消费者确认和发布者确认模式
:::
# RabbitMQ  消费者确认和发布者确认模式

##  消费者确认和发布者确认模式

### 概述

本指南涵盖了与数据安全相关的两个特性，消费者确认和发布者确认



* 确认消息存在的原因
* 手动和自动确认模式
* 确认API，包括multi-acks 和 requeueing
* 自动requeueing 当链接丢失或者channel关闭
* Channel prefetch 和 它对吞吐量的影响
* 常见的客户端错误
* Publisher confirms 和相关的发布者数据安全主题

等等， 在使用消息传递的应用程序中，消费者和发布者双方的确认对于数据安全都很重要。



更多相关主题将在Publisher和Consumer指南中介绍。



#### 基本概念

使用消息代理(如RabbitMQ)的系统被定义为分布式的。因为发送的协议方法(消息)不能保证到达对等体或被对等体成功处理，因此发布者和消费者都需要一种传递和处理确认的机制。RabbitMQ支持的一些消息传递协议都提供了这样的特性。本指南涵盖了AMQP 0-9-1中的特性，但其思想在其他受支持的协议中大体相同。



从consumers到RabbitMQ的传递处理确认（Delivery Acknowledgements )在消息传递协议中被称为确认（acknowledgements）。代理向publishers 确认是一种协议扩展，称为publisher confirms。这两个特性都基于相同的理念，并受到TCP的启发。



无论是从publishers到RabbitMQ节点，还是从RabbitMQ节点到consumers的可靠交付，它们都是必不可少的。换句话说，换句话说，它们对数据安全至关重要，应用程序和RabbitMQ节点一样需要对数据安全负责。

## 消费者：投递确认

当RabbitMQ向消费者传递消息时，它需要知道什么时候该消息被成功发。什么样的逻辑是最优的取决于系统。因此，它主要是一个应用程序的决策。在AMQP 0-9-1中，它是consumer 在注册时`basic.consume`  方法或按需获取消息的`basic.get`方法



如果你更喜欢以例子为导向的循序渐进的内容，consumer acknowledgements也包括在 [RabbitMQ tutorial #2](https://www.rabbitmq.com/getstarted.html).



#### 投递标识符: Delivery Tags

在我们继续讨论其他主题之前，重要的是要解释如何确定交付(以及确认表明它们各自的交付)。当一个consumer(订阅)注册后，RabbitMQ会使用`basic.deliver`方法发送(推送)消息。方法带有一个*delivery tag*，它唯一地标识通道上的传递。因此，每个通道都限定了delivery tag的作用域。

*delivery tag*是逐步增长的正整数，这种方式由客户端库实现。确认交付的客户端库方法接受一个交付标记作为参数。因为*deliver tag*的作用域是每个通道，所以投递必须在接收它们的同一通道上被确认。在不同的通道上确认将导致“未知交付标签”协议异常并关闭通道。



####  消费者确认模式和数据安全

当节点将消息传递给消费者时，它必须决定是否应该认为该消息已被消费者处理(或至少接收)。由于很多事情(客户端连接、消费者应用程序等)可能会失败，因此这个决定涉及到数据安全问题。消息传递协议通常提供一种确认机制，允许使用者确认向其连接的节点的传递。是否使用该机制是在消费者订阅时决定的。



取决于所使用的确认模式，RabbitMQ可以认为一个消息在发送出去(写入TCP套接字)后，或者在收到客户端显式(“手动”)的确认后，就已经成功发送了。手动发送的确认可以是主动的，也可以是被动的，使用以下协议方式之一：

* `basic.ack` 是一种主动确认
* `basic.nack` 是一种被动确认
* `basic.reject`是用于否定确认，但有局限相比与`basic.nack`

下面将讨论如何在客户端库api中公开这些方法。

主动确认只是指示RabbitMQ记录消息的发送和丢弃。被动确认使用`basic.reject`有同样的作用。区别主要体现在语义上，主动确认认为消息被成功处理而它们的反面则表明投递没有被处理，但仍然应该被删除。

在自动确认模式下，消息在发送后立即被认为已成功发送。这种模式以更高的吞吐量(只要消费者能够跟上)换取传输和消费者处理的安全性降低。这种模式通常被称为“fire-and-forget”。与手动确认模式不同，如果消费者的TCP连接或通道在成功传递之前被关闭，则服务器发送的消息将丢失。因此，自动消息确认应该被认为是不安全的，并不适合所有的工作负载。

使用自动确认模式时需要考虑的另一件重要事情是用户过载。手动确认模式通常与通道预读取界限一起使用，它限制了通道上未完成(“正在进行”)传输的数量。然而自动确认没有这种限制。因此，消费者可能会过载，可能会在内存中积累积压，耗尽堆，或者被操作系统终止进程。一些客户端库将应用 TCP back pressure(停止从套接字读取，直到未处理交付的积压超过一定的限制)。因此，自动确认模式只推荐给那些能够高效和稳定处理递送的消费者。



####  主动确认投递

用于传递确认的API方法通常作为客户端库中通道上的操作公开Java客户端用户将使用Channel#basicAck和Channel#basicNack分别来执行一个`basic.ack`和`basic.nack`.下面是一个java客户端例子：

```java
// this example assumes an existing channel instance

boolean autoAck = false;
channel.basicConsume(queueName, autoAck, "a-consumer-tag",
     new DefaultConsumer(channel) {
         @Override
         public void handleDelivery(String consumerTag,
                                    Envelope envelope,
                                    AMQP.BasicProperties properties,
                                    byte[] body)
             throws IOException
         {
             long deliveryTag = envelope.getDeliveryTag();
             // positively acknowledge a single delivery, the message will
             // be discarded
             channel.basicAck(deliveryTag, false);
         }
     });
```

.NET客户端中，方法分别是`IModel# BasicAck`和`IModel# BasicNack`。下面是一个.NET例子：

```c#
// this example assumes an existing channel (IModel) instance

var consumer = new EventingBasicConsumer(channel);
consumer.Received += (ch, ea) =>
                {
                    var body = ea.Body.ToArray();
                    // positively acknowledge a single delivery, the message will
                    // be discarded
                    channel.BasicAck(ea.DeliveryTag, false);
                };
String consumerTag = channel.BasicConsume(queueName, false, consumer);
```



#### 批量确认

手动确认可以分批处理，以减少网络流量。通过设置确认方法（上面的例子)的 `multiple`字段为`true`来实现。注意`basic.reject`没有这个字段，因为历史的原因。所以`basic.nack`被RabbitMQ作为协议扩展引入。



当`multiple`被设置为`true`时，RabbitMQ将确认所有未交付的标签，包括确认信息中指定的标签。与其他所有与确认相关的内容一样，它的作用域是每个通道。例如，有三个投递标签5，6，7和8 在通道Ch上未确认，当一个确认帧到达通道，它的`delivery_tag`未8并且`multiple=true`,所有从5-8的标签都会被确认。如果`multiple=false` ,投递标签5，6和7将是未被确认状态。

java客户端通过设置`Channel#basicAck`的`multiple=true`来设置批量确认模式：

```java
// this example assumes an existing channel instance

boolean autoAck = false;
channel.basicConsume(queueName, autoAck, "a-consumer-tag",
     new DefaultConsumer(channel) {
         @Override
         public void handleDelivery(String consumerTag,
                                    Envelope envelope,
                                    AMQP.BasicProperties properties,
                                    byte[] body)
             throws IOException
         {
             long deliveryTag = envelope.getDeliveryTag();
             // positively acknowledge all deliveries up to
             // this delivery tag
             channel.basicAck(deliveryTag, true);
         }
     });

```

.NET 客户端如下

```c#
// this example assumes an existing channel (IModel) instance

var consumer = new EventingBasicConsumer(channel);
consumer.Received += (ch, ea) =>
                {
                    var body = ea.Body.ToArray();
                    // positively acknowledge all deliveries up to
                    // this delivery tag
                    channel.BasicAck(ea.DeliveryTag, true);
                };
String consumerTag = channel.BasicConsume(queueName, false, consumer);
```



#### 被动确认和重新排队投递

有时使用者不能立即处理交付，但其他的实例可以。在这种情况下，它可能需要重新排队，并让另一个消费者接收和处理它。`basic.reject`和`basic.nack`是这种实现的两个方法。

这些方法通常用于被动确认。例如投递被代理丢弃或者重新排队。这种行为由`requeue`字段控制。当字段被设置为`true`时，代理根据投递标签将投递重新排队（或者多次交付，稍后将对此进行解释）。

这两个方法通常在客户端库中作为通道上的操作公开。java客户端使用`Channel#basicReject`和`Channel#basicNack`去执行`basic.reject`和`basic.nack`

```java
boolean autoAck = false;
channel.basicConsume(queueName, autoAck, "a-consumer-tag",
     new DefaultConsumer(channel) {
         @Override
         public void handleDelivery(String consumerTag,
                                    Envelope envelope,
                                    AMQP.BasicProperties properties,
                                    byte[] body)
             throws IOException
         {
             long deliveryTag = envelope.getDeliveryTag();
             // negatively acknowledge, the message will
             // be discarded
             channel.basicReject(deliveryTag, false);
         }
     });
```

```java
// this example assumes an existing channel instance

boolean autoAck = false;
channel.basicConsume(queueName, autoAck, "a-consumer-tag",
     new DefaultConsumer(channel) {
         @Override
         public void handleDelivery(String consumerTag,
                                    Envelope envelope,
                                    AMQP.BasicProperties properties,
                                    byte[] body)
             throws IOException
         {
             long deliveryTag = envelope.getDeliveryTag();
             // requeue the delivery
             channel.basicReject(deliveryTag, true);
         }
     });
```

.NET 客户端使用`IModel#BasicReject`和`IModel#BasicNack`

```C#
// this example assumes an existing channel (IModel) instance

var consumer = new EventingBasicConsumer(channel);
consumer.Received += (ch, ea) =>
                {
                    var body = ea.Body.ToArray();
                    // negatively acknowledge, the message will
                    // be discarded
                    channel.BasicReject(ea.DeliveryTag, false);
                };
String consumerTag = channel.BasicConsume(queueName, false, consumer);
```

```C#
// this example assumes an existing channel (IModel) instance

var consumer = new EventingBasicConsumer(channel);
consumer.Received += (ch, ea) =>
                {
                    var body = ea.Body.ToArray();
                    // requeue the delivery
                    channel.BasicReject(ea.DeliveryTag, true);
                };
String consumerTag = channel.BasicConsume(queueName, false, consumer);
```

当消息被重新排队时,如果可能的话,它将被放置到队列中的原始位置.否则（由于多个消费者共享队列时来自其他消费者的并发交付和确认）消息将被重新排队到一个更靠近队列头的位置。

重新排队的消息可以被立即准备等待重新投递，这取决于他们在队列中的位置和当前通道的消费者设置的预取值。这意味着，如果所有消费者因为临时情况而无法处理交付而进行requeue，那么它们将创建一个requeue/redelivery循环。这样的循环在网络带宽和CPU资源方面代价很高。使用者实现可以跟踪重新发送和拒绝消息的数量(丢弃它们)，或者在延迟后进行重新排队。

通过使用`basic.nack`方法是可以实现批量拒绝或重新排队消息。这就是它与`basic.reject`的不同。它接收一个额外的参数`multiple`。Java客户端样例如下：

```java
// this example assumes an existing channel instance

boolean autoAck = false;
channel.basicConsume(queueName, autoAck, "a-consumer-tag",
     new DefaultConsumer(channel) {
         @Override
         public void handleDelivery(String consumerTag,
                                    Envelope envelope,
                                    AMQP.BasicProperties properties,
                                    byte[] body)
             throws IOException
         {
             long deliveryTag = envelope.getDeliveryTag();
             // requeue all unacknowledged deliveries up to
             // this delivery tag
             channel.basicNack(deliveryTag, true, true);
         }
     });
```

.NET 客户端样例如下：

```c#
// this example assumes an existing channel (IModel) instance

var consumer = new EventingBasicConsumer(channel);
consumer.Received += (ch, ea) =>
                {
                    var body = ea.Body.ToArray();
                    // requeue all unacknowledged deliveries up to
                    // this delivery tag
                    channel.BasicNack(ea.DeliveryTag, true, true);
                };
String consumerTag = channel.BasicConsume(queueName, false, consumer);
```

#### 通道预取值设置 (QoS)

因为消息是异步发送(推送)到客户端的,在任何给定的时刻，一个通道上通常都有不止一条“正在飞行中”的消息。此外，客户端手动确认在本质上也是异步的。因此，有一个未确认的投递标签滑动窗口。开发人员通常倾向于限制这个窗口的大小，以避免在消费者端出现无限制的缓冲区问题。这可以通过使用`basic.qos`方法来设置**prefetch count** 的值来实现。 该值定义通道上允许的未确认投递的最大数量。一旦达到设置的数量，RabbitMQ将停止在通道上传递更多的消息，除非至少有一个未完成的消息被确认（值0被视为无限，允许任意数量的未确认消息）。

例如，在通道Ch上有未确认的投递标签为5，6，7和8并且通道Ch的预取数量设置为4，RabbitMQ在通道Ch将不会推送任何投递，除非至少有一个未确认的投递被却惹。当确认帧到达本通道且`delivery_tag`是5（或6，7，8），RabbitMQ会注意到并再发送一条消息。一次确认多个消息将使多个消息可用来传递。



值得重申的是，交付流程和手工客户确认完全是异步的。因此，如果预取值在已经有传递的情况下发生了改变，就会出现一种自然竞争状态，并且通道上可能会有超过预取计数的未确认消息。

**Per-channel, Per-consumer and Global Prefetch**

QoS设置可以为特定的通道或特定的消费者进行配置。具体参考[Consumer Prefetch](https://www.rabbitmq.com/consumer-prefetch.html) 指南

**Prefetch and Polling Consumers**

Qos的prefetch设置对用使用`basic.get`的方式没有效果，即使在手动确认模式。



#### 消费者确认模式：预取值和吞吐量

确认模式和Qos预取值的设置对消费者的吞吐量有显著的影响。一般来说，增加预取值将会改善消息投递到消费者的速度。自动确认模式可提供最佳的投递率。然而，在这两种情况下，已交付但尚未处理的消息的数量也会增加。因此会增加消费者的内存占用。

使用不限制预取的自动确认模式或手动确认模式时应谨慎。消费者在不知情的情况下消耗大量消息，将导致其所连接节点的内存消耗增长。找到合适的预取值需要反复试验，并且会因工作负载的不同而有所不同。在100到300之间的值通常提供最佳的吞吐量，并且不会运行大量用户的风险。

预取值为1是最保守的。它将显著降低吞吐量，特别是在消费者连接延迟很高的环境中。对于许多应用程序，较高的值是合适的和最优的。



#### 消费则失败或者断开连接：自动排队

当使用手动确认时，当发生传递的通道(或连接)关闭时，任何未被打包的传递(消息)将被自动重新排队。这包括客户机的TCP连接丢失、使用者应用程序(进程)失败和通道级协议异常(下面将介绍)。

注意，检测不可用客户端需要一段时间。

由于这种行为，消费者必须准备好处理重新交付，否则在实现时要考虑到幂等性。重新投递有一个特殊的布尔属性，`redeliver`RabbitMQ默认设置为`true`。对于第一次投递他将被设置为`false`。请注意，消费者可以接收之前交付给另一个消费者的消息。

#### 客户端错误：双重确认和未知标签

如果客户端不止一次确认同一个投递标签，RabbitMQ将会产生一个通道错误`PRECONDITION_FAILED - unknown delivery tag 100` 如果使用了未知的传递标记，则会抛出相同的通道异常。

代理将抛出“未知投递标签”的另一种情况是，在一个不同于接收投递的通道上尝试发送确认(无论是主动还是被动确认)。

投递必须在同一通道上确认。



## 生产者：确认模式

