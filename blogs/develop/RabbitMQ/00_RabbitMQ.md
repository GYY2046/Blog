---
title: RabbitMQ 安装
date: 2022-01-10
sidebar: 'auto'
tags:
 - RabbitMQ
categories:
 - RabbitMQ
---

:::tip
RabbitMQ 安装
:::
# RabbitMQ 安装

## 概述

RabbitMQ是什么：

- RabbitMQ是一个开源的消息代理和队列服务器，用来通过普通协议在完全不同的应用之间共享数据，RabbitMQ是使用Erlang语言来编写的，并且RabbitMQ是基于AMQP协议的。

为什么使用RabbitMQ：

- 开源、性能优秀，稳定性保障
- 提供可靠性消息投递模式（confirm） 、返回模式（return）
- 与SpringAMQP完美的整合、API丰富
- 集群模式丰富，表达式配置，HA模式，镜像队列模型
- 保证数据不丢失的前提做到高可靠性、可用性

## RabbitMQ安装

官方下载地址：

 https://www.rabbitmq.com/download.html
我们知道RabbitMQ是基于Erlang编写的，所以在安装RabbitMQ之前需要确保安装了Erlang环境。RabbitMQ与Erlang是有版本对应关系的，可以参考官方列举的版本对应关系：

 https://www.rabbitmq.com/which-erlang.html

### 下载包：

```bash
cd /usr/local/src
wget https://github.com/rabbitmq/erlang-rpm/releases/download/v23.1.3/erlang-23.1.3-1.el7.x86_64.rpm
wget https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.8.9/rabbitmq-server-3.8.9-1.el7.noarch.rpm

```

### 安装：

```bash
yum install -y erlang-23.1.3-1.el7.x86_64.rpm
yum install -y rabbitmq-server-3.8.9-1.el7.noarch.rpm
```

### 修改默认配置

RabbitMQ新版本没有提供配置文件的示例，需要自己去Github上下载：

 https://github.com/rabbitmq/rabbitmq-server/blob/master/deps/rabbit/docs/rabbitmq.conf.example
 https://github.com/rabbitmq/rabbitmq-server/blob/master/deps/rabbit/docs/advanced.config.example

将下载好的配置文件放到/etc/rabbitmq目录下：

```bash
mv rabbitmq.conf.example /etc/rabbitmq/rabbitmq.conf
```

修改配置文件

```bash
 vim /etc/rabbitmq/rabbitmq.conf
 
 # 允许默认用户被外部网络访问
loopback_users.guest = false
```

### 启动

完成配置后，启动RabbitMQ Server：

```bash
rabbitmq-server start &
```

检查端口是否正常监听，5672是默认的RabbitMQ端口号：

```bash
netstat -lntp |grep 5672
```

### 开启Web插件

启用RabbitMQ的Web管控台插件，我们可以在管控台中查看RabbitMQ的基础监控信息，以及对RabbitMQ进行管理：

```bash
rabbitmq-plugins enable rabbitmq_management
```

### 开机启动

```bash
systemctl enable rabbitmq-server.service
```



## 开放防火墙策略

注意防火墙开启对应端口策略：

```bash
#开放端口
firewall-cmd --add-port=5672/tcp --permanent
firewall-cmd --add-port=15672/tcp --permanent
#重启防火墙
firewall-cmd --reload
#查看防火墙规则
firewall-cmd --list-all
```

## 新增用户

### 创建用户

```
rabbitmqctl add_user admin abc123456
# 帐号：admin
# 密码：abc123456
```

### 设置管理员

```
rabbitmqctl set_user_tags admin administrator
```

### 设置权限

```
rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
```

### 列出用户

```
rabbitmqctl list_users
```

### 修改密码

```
#修改guest用户密码为abc123456
rabbitmqctl change_password guest abc123456
```
