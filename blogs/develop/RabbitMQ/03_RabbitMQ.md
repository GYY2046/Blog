---
title: RabbitMQ 整合高可用
date: 2022-01-10
sidebar: 'auto'
tags:
 - RabbitMQ
categories:
 - RabbitMQ
---

:::tip
RabbitMQ 整合高可用
:::
# RabbitMQ 整合高可用

## 概述

KeepAlived软件主要是通过VRRP协议实现高可用功能的。VRRP是Virtual Router RedundancyProtocol（虚拟路由器冗余协议）的缩写，VRRP出现的目的就是为了解决静态路由单点故障问题，VRRP是通过一种竞选机制来将路由的任务交给某台VRRP路由器的。它能够保证当个别节点宕机时，整个网络可以不间断地运行，所以Keepalived一方面具有配置管理LVS的功能，同时还具有对LVS下面节点进行健康检查的功能，另一方面也可实现系统网络服务的高可用功能。

KeepAlived服务的三个重要功能：

1. 管理LVS负载均衡软件
2. 实现LVS集群节点的健康检查
3. 作为系统网络服务的高可用性（failover）

Keepalived高可用服务对节点之间的故障切换转移，是通过VRRP来实现的。在Keepalived服务正常工作时，主Master节点会不断地向备节点发送（多播的方式）心跳消息，用以告诉备Backup节点自己还活看，当主Master节点发生故障时，就无法发送心跳消息，备节点也就因此无法继续检测到来自主Master节点的心跳了，于是调用自身的接管程序，接管主Master节点的IP资源及服务。而当主Master节点恢复时备Backup节点又会释放主节点故障时自身接管的IP资源及服务，恢复到原来的备用角色



## 安装KeepAlived

我们需在`10.171.48.28`和`10.171.48.29`这两台机器上，分别安装KeepAlived。两台机器的安装步骤都是一样的，这里以`rabbitmq1`为例。

### 安装依赖

```bash
yum install -y openssl openssl-devel psmisc
```

### 下载KeepAlived安装包

从[官网](https://www.keepalived.org/download.html)下载安装包拷贝到服务端，也可以使用wget进行下载

```bash
cd /usr/local/src
wget https://www.keepalived.org/software/keepalived-2.1.5.tar.gz
```

### 解压并安装

```bash
tar -zxvf keepalived-2.1.5.tar.gz 
cd keepalived-2.1.5
./configure --prefix=/usr/local/keepalived
make && make install
```

### 创建配置文件

```bash
mkdir /etc/keepalived
vim /etc/keepalived/keepalived.conf

#一下为配置文件内容
! Configuration File for keepalived

global_defs {
   router_id rabbitmq1  ##标识节点的字符串，通常为hostname
   script_user root
   enable_script_security
}

vrrp_script chk_haproxy {
    script "/etc/keepalived/haproxy_check.sh"  ##执行脚本位置
    interval 2  ##检测时间间隔
    weight -20  ##如果条件成立则权重减20
}

vrrp_instance VI_1 {
    state MASTER  ## 主节点为MASTER，备份节点为BACKUP
    interface eno1 ## 绑定虚拟IP的网络接口（网卡），与本机IP地址所在的网络接口相同（我这里是eno1）
    virtual_router_id 167  ## 虚拟路由ID号（主备节点一定要相同）
    mcast_src_ip 10.171.48.28 ## 本机ip地址
    priority 100  ##优先级配置（0-254的值）
    nopreempt
    advert_int 1  ## 组播信息发送间隔，俩个节点必须配置一致，默认1s
    authentication {  ## 认证匹配
        auth_type PASS
        auth_pass 123456
    }

    track_script {
        chk_haproxy
    }

    virtual_ipaddress {
        10.171.48.30  ## 虚拟ip，可以指定多个
    }
}
```

备节点的配置如下：

```bash
! Configuration File for keepalived

global_defs {
   router_id rabbitmq2  ##标识节点的字符串，通常为hostname
   script_user root
   enable_script_security
}

vrrp_script chk_haproxy {
    script "/etc/keepalived/haproxy_check.sh"  ##执行脚本位置
    interval 2  ##检测时间间隔
    weight -20  ##如果条件成立则权重减20
}

vrrp_instance VI_1 {
    state BACKUP  ## 主节点为MASTER，备份节点为BACKUP
    interface eno1 ## 绑定虚拟IP的网络接口（网卡），与本机IP地址所在的网络接口相同（我这里是eno1）
    virtual_router_id 167  ## 虚拟路由ID号（主备节点一定要相同）
    mcast_src_ip 10.171.48.29 ## 本机ip地址
    priority 100  ##优先级配置（0-254的值）
    nopreempt
    advert_int 1  ## 组播信息发送间隔，俩个节点必须配置一致，默认1s
    authentication {  ## 认证匹配
        auth_type PASS
        auth_pass 123456
    }

    track_script {
        chk_haproxy
    }

    virtual_ipaddress {
        10.171.48.30  ## 虚拟ip，可以指定多个
    }
}
```

### HAProxy检查

编写haproxy的健康检查脚本（两个节点该文件内容一致即可）：

```bash
vim /etc/keepalived/haproxy_check.sh
#一下为配置文件内容
#!/bin/bash
COUNT=`ps -C haproxy --no-header |wc -l`
if [ $COUNT -eq 0 ];then
    /usr/local/haproxy/sbin/haproxy -f /etc/haproxy/haproxy.cfg
    sleep 2
    if [ `ps -C haproxy --no-header |wc -l` -eq 0 ];then
        killall keepalived
    fi
fi
```

为检查脚本赋予可执行权限：

```bash
chmod a+x /etc/keepalived/haproxy_check.sh
```



### 启动

经过以上步骤在两个节点上均安装好keepalived后，就可以分别在两个节点上使用如下命令启动keepalived了：

```bash
systemctl start keepalived
```



### 开机启动

```bash
systemctl enable keepalived.service
```



### 其他命令

```bash 
systemctl start keepalived.service
systemctl status keepalived.service
```



## 高可用测试

安装好Keepalived之后，此时可以看到VIP在rabbitmq1这个节点上：

```bash
ip a |grep 10.171.48.30
#结果如下
inet 10.171.48.30/32 scope global eno1
```


我们来模拟下节点宕机，看看VIP能否正常漂移到rabbitmq2节点上。将Keepalived服务给停掉：

```bash 
systemctl stop keepalived
killall keepalived
```



此时rabbitmq1节点上已经没有绑定VIP了：

``` bash 
ip a |grep 192.168.243.100
#输出为空
```

正常情况下VIP会漂移到rabbitmq2节点上，使得该节点的haproxy可以继续对外提供服务，实现双机热备的高可用模式



##  RabbitMQ集群恢复与故障转移的5种解决方案
本小节简单介绍下常见的RabbitMQ镜像队列集群故障恢复的解决方案和应用场景，假设我们现在有两个节点A和B组成的一个镜像队列集群，其中B是Master，A是Slave。

**场景1：**A先停，B后停
**方案1：**该场景下B是Master，只要先启动B，再启动A即可。或者先启动A，在30秒之内启动B即可恢复镜像队列

**场景2：**A、B同时停机
**方案2：**该场景可能是由于机房掉电等原因造成的，只需在30秒之内连续启动A和B即可恢复镜像

**场景3：**A先停，B后停，且A无法恢复
**方案3：**该场景是1场景的加强版，因为B是Master，所以等B起来以后，在B节点上调用控制台命令：rabbitmqctl forget_cluster_node A解除与A的Cluster关系，再将新的Slave节点加入B即可重新恢复镜像队列

**场景4：**A先停，B后停，且B无法恢复
**方案4：**该场景是场景3的加强版，比较难处理，原因是因为Master节点无法恢复。在3.1.x时代之前没有什么好的解决方案，因为B是主节点，所以直接启动A是不行的。当A无法启动的时候，也就没办法在A节点上调用之前的rabbitmqctl forget_cluster_node B命令了。但是现在已经有解决方案了，在3.4.2以后的版本中，forget_cluster_node支持--offline参数。这就意味着允许rabbitmqctl在理想节点上执行该命令，迫使RabbitMQ在未启动Slave节点中选择一个节点作为Master。当在A节点执行rabbitmqctl forget_cluster_node --offline B时，RabbitMQ会mock一个节点代表A，执行forget_cluster_node命令将B踢出Cluster，然后A就可以正常启动了，最后将新的Slave节点加入集群即可重新恢复镜像队列

**场景5：**A先停、B后停， 且A、B均无法恢复，但是能得到A或B的磁盘文件

**方案5：**这种场景更加难处理，只能通过恢复数据的方式去尝试恢复，将A或B的数据库文件（默认在$RABBIT_HOME/var/lib/目录中）拷贝到新节点对应的目录下，再将新节点的hostname改成A或B的hostname，如果是A节点（Slave）的磁盘文件，则按照场景4处理即可，如果是B节点（Master）的磁盘文件，则按照场景3处理，最后将新的Slave加入到新节点后完成恢复
