---
title: Centos8 Termail 更新系统
date: 2021-11-22
sidebar: 'auto'
tags:
 - CentOS
categories:
 - CentOS
---

::: tip 
CentOS 常用命令整理
:::

### Step1. 更新DNF 包仓库

`sudo dnf makecache`

###  Step2.  检查更新

`sudo dnf check-update`

### Step3.  更新所有包

`sudo dnf update`  or `sudo dnf upgrade`
