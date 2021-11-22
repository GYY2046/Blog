---
title: Centos8 安装 Docker-CE
date: 2021-11-22
sidebar: 'auto'
tags:
 - CentOS Docker
categories:
 - CentOS
---

:::tip
安装Docker
:::

## Step:0 更新系统并重启

`dnf update -y : reboot`

## Step:1 添加Docker仓库

`dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo`

### Step:2 使用dnf安装Docker CE

#### Step:2.1 列出可用的安装包

`dnf list docker-ce`

#### Step:2.2 安装最新的包

`dnf install docker-ce --nobest -y`

如果出现冲突,"(尝试在命令行中添加 '--allowerasing' 来替换冲突的软件包 或 '--skip-broken' 来跳过无法安装的软件包)
" 则尝试替换冲突软件包 

`dnf install docker-ce --nobest -y --allowerasing`


#### Step:2.3 启动Docker

`systemctl start docker`

#### Step:2.4 添加到开机启动

`systemctl enable docker`

#### Setp:2.5 检查安装是否成功

`Docker --version`

### Setp:3 验证并测试Docker CE Engine

`docker run hello-world`
