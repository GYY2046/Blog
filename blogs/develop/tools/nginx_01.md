---
title: Centos7 安装Nginx
date: 2021-09-01
sidebar: 'auto'
tags:
 - Nginx
categories:
 - 开发
---

## Centos7 安装 Nginx

1. 添加Nginx到Yum源

```bash
sudo rpm -Uvh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm
```

2. 通过yum安装Nginx

```bash
sudo yum install -y nginx
```

3. 启动Nginx服务

```bash
sudo systemctl start nginx
```

4. 重启Nginx服务

```bash
sudo systemctl restart nginx
```

5. 设置开机自启动

```bash
sudo systemctl enable nginx
```

6. 查看Nginx状态

```bash
sudo systemctl status nginx
```

Nginx配置文件目录介绍

1. 网站文件存放默认目录：/usr/share/nginx/html

2. 网站默认站点配置：/etc/nginx/conf.d/default.conf

3. 自定义Nginx站点配置文件存放目录：/etc/nginx/conf.d/

4. Nginx全局配置：/etc/nginx/nginx.conf

5. Nginx指定配置文件启动：nginx -c nginx.conf


