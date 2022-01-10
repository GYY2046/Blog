---
title: Centos8 防火墙命令
date: 2021-11-22
sidebar: 'auto'
tags:
 - CentOS firewalld
categories:
 - CentOS
---

:::tip
防火墙命令
:::

## 查看防火墙状态
```bash
systemctl status firewalld.service
```
## 开启防火墙

```bash
systemctl start firewalld.service
```

## 关闭防火墙

```bash
systemctl stop firewalld.service
```

## 禁用防火墙

```bash
systemctl disable firewalld.service
```

## 防火墙是否启用

防火墙是否开启怎么查看防火墙是不是开启运行的，centos6用 service iptables status查看

centos7系统iptables是叫firewalld， 使用systemctl status firewalld查看是否启动

查看iptables规则如果要查看iptables目前运行的规则，使用iptables -L可以列出

查看防火墙允许的端口号输入命令 firewall-cmd --zone=public --list-ports 可以查看对外网电脑防火墙列外的端口号，可以针对性的删除。如果要取消删除iptables规则，可以直接停止或禁用firewalld服务即可

## 命令

```bash

#进程与状态相关
systemctl start firewalld.service            #启动防火墙
systemctl stop firewalld.service             #停止防火墙
systemctl status firewalld                   #查看防火墙状态
systemctl enable firewalld             #设置防火墙随系统启动
systemctl disable firewalld                #禁止防火墙随系统启动
firewall-cmd --state                         #查看防火墙状态
firewall-cmd --reload                        #更新防火墙规则
firewall-cmd --list-ports                    #查看所有打开的端口
firewall-cmd --list-services                 #查看所有允许的服务
firewall-cmd --get-services                  #获取所有支持的服务

#区域相关
firewall-cmd --list-all-zones                    #查看所有区域信息
firewall-cmd --get-active-zones                  #查看活动区域信息
firewall-cmd --set-default-zone=public           #设置public为默认区域
firewall-cmd --get-default-zone                  #查看默认区域信息


#接口相关
firewall-cmd --zone=public --add-interface=eth0  #将接口eth0加入区域public
firewall-cmd --zone=public --remove-interface=eth0       #从区域public中删除接口eth0
firewall-cmd --zone=default --change-interface=eth0      #修改接口eth0所属区域为default
firewall-cmd --get-zone-of-interface=eth0                #查看接口eth0所属区域

#端口控制
firewall-cmd --query-port=8080/tcp             # 查询端口是否开放
firewall-cmd --add-port=8080/tcp --permanent               #永久添加8080端口例外(全局)
firewall-cmd --remove-port=8800/tcp --permanent            #永久删除8080端口例外(全局)
firewall-cmd --add-port=65001-65010/tcp --permanent      #永久增加65001-65010例外(全局)
firewall-cmd  --zone=public --add-port=8080/tcp --permanent            #永久添加8080端口例外(区域public)
firewall-cmd  --zone=public --remove-port=8080/tcp --permanent         #永久删除8080端口例外(区域public)
firewall-cmd  --zone=public --add-port=65001-65010/tcp --permanent   #永久增加65001-65010例外(区域public)
```
