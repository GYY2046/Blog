---
title: RabbitMQ 配置负载均衡
date: 2022-01-10
sidebar: 'auto'
tags:
 - RabbitMQ
categories:
 - RabbitMQ
---


:::tip
RabbitMQ 配置负载均衡
:::

# RabbitMQ 配置负载均衡

## 概述

在上一小节中，我们搭建了RabbitMQ的镜像队列集群，虽然集群节点之间能够同步数据保证高可靠的存储了，但有个问题就是客户端通常只能连接集群中的其中一个节点。这样就会造成集群中只有一个节点在负载所有的读写操作，导致该节点负载过高，而其他节点则无所事事。

因此，我们就需要对RabbitMQ集群做负载均衡，负载均衡的方案通常有服务端负载均衡和客户端负载均衡两种。客户端负载均衡需要我们自己在客户端实现负载均衡算法，或使用第三方的库。服务端负载均衡则是通过一些中间件来实现，例如HAProxy、Nginx、LVS等。

由于本文主要是演示环境的搭建不涉及编码，所以采用的是服务端负载均衡方案，使用HAProxy组件来做RabbitMQ集群的负载均衡组件。

##  HAProxy介绍 

HAProxy是一款提供高可用性、负载均衡以及基于TCP（第四层）和HTTP（第七层）应用的代理软件，支持虚拟主机，它是免费、快速并且可靠的一种解决方案。 HAProxy特别适用于那些负载特大的web站点。这些站点通常又需要会话保持或七层处理。HAProxy运行在时下的硬件上，完全可以支持数以万计的并发连接。并且它的运行模式使得它可以很简单安全的整合进你当前的架构中，同时可以保护你的web服务器不被暴露到网络上。

HAProxy借助于OS上几种常见的技术来实现性能的最大化：

* 单进程、事件驱动模型显著降低了上下文切换的开销及内存占用
* 在任何可用的情况下，单缓冲（single buffering）机制能以不复制任何数据的方式完成读写操作，这会节约大量的CPU时钟周期及内存带宽
* 借助于Linux 2.6（>= 2.6.27.19）上的splice()系统调用，HAProxy可以实现零复制转发（Zero-copy forwarding），在Linux 3.5及以上的OS中还可以实现零复制启动（zero-starting）
* 内存分配器在固定大小的内存池中可实现即时内存分配，这能够显著减少创建一个会话的时长
* 树型存储：侧重于使用作者多年前开发的弹性二叉树， 实现了以**O(log(N))**的低开销来保持计时器命令、保持运行队列命令及管理轮询及最少连接队列



## HAProxy 安装

### 安装wget

接下来我们在`10.171.48.28`和`10.171.48.29`这两台机器上，分别搭建HAProxy节点。两台机器的搭建步骤都是一样的，这里以`rabbitmq1`为例。首先，安装一些工具：

```bash
 yum install -y gcc wget
```

### 下载安装包

然后到[ 官网](http://www.haproxy.org/)上复制源码包的下载链接，使用`wget`命令进行下载(安装时不成功，得手动下载安装包上传到服务器上)：

```bash
 cd /usr/local/src
 wget http://www.haproxy.org/download/2.3/src/haproxy-2.3.1.tar.gz
```

### 解压

```bash
tar -zxvf haproxy-2.3.1.tar.gz
cd haproxy-2.3.1
```



### 编译安装

```bash
make TARGET=linux31 PREFIX=/usr/local/haproxy
make install PREFIX=/usr/local/haproxy
mkdir /etc/haproxy  # 创建配置文件存储目录
```

### 创建HAProxy的用户组和用户

```bash
groupadd -r -g 149 haproxy
groupadd -r -g 149 haproxy
```

### 创建HAProxy配置文件

```bash

vim /etc/haproxy/haproxy.cfg
#一下为配置文件内容
#logging options
global
    log 127.0.0.1 local0 info
    maxconn 5120
    chroot /usr/local/haproxy
    uid 99
    gid 99
    daemon
    quiet
    nbproc 20
    pidfile /var/run/haproxy.pid

defaults
    log global
    #使用4层代理模式，”mode http”为7层代理模式
    mode tcp
    #if you set mode to tcp,then you nust change tcplog into httplog
    option tcplog
    option dontlognull
    retries 3
    option redispatch
    maxconn 2000
    timeout connect 5s
    #客户端空闲超时时间为 60秒 则HA 发起重连机制
    timeout client 60s
    #服务器端链接超时时间为 15秒 则HA 发起重连机制
    timeout server 15s	
    #front-end IP for consumers and producters

listen rabbitmq_cluster
	#通过本机8080端口去进行负载均衡，注意防火墙策略
    bind 0.0.0.0:8080
    #配置TCP模式
    mode tcp
    #balance url_param userid
    #balance url_param session_id check_post 64
    #balance hdr(User-Agent)
    #balance hdr(host)
    #balance hdr(Host) use_domain_only
    #balance rdp-cookie
    #balance leastconn
    #balance source //ip
    #简单的轮询
    balance roundrobin
    #rabbitmq集群节点配置 #inter 每隔五秒对mq集群做健康检查，2次正确证明服务器可用，2次失败证明服务器不可用，并且配置主备机制
    server rabbitmq1 10.171.48.28:5672 check inter 5000 rise 2 fall 2
    server rabbitmq2 10.171.48.29:5672 check inter 5000 rise 2 fall 2
#配置haproxy web监控，查看统计信息
listen stats
	#注意防火墙策略
    bind 10.171.48.28:8100
    mode http
    option httplog
    stats enable
    #设置haproxy监控地址为http://localhost:8100/rabbitmq-stats
    stats uri /rabbitmq-stats
    stats refresh 5s
```

### 启动

```bash
/usr/local/haproxy/sbin/haproxy -f /etc/haproxy/haproxy.cfg
```

### 验证

```bash
netstat -lntp |grep 8100
netstat -lntp |grep 8080
```



## 总结

使用HAProxy实现了RabbitMQ集群的负载均衡后，应用端就可以通过HAProxy来访问RabbitMQ集群，但是HAProxy自身还是存在单点问题，HAProxy挂掉就无法访问其后端的RabbitMQ集群了。因此，我们需要结合KeepAlived组件实现两个HAProxy节点的主备切换，达到高可用的目的。
