---
title: GitHub Actions 实现博客自动化部署
date: 2021-08-12
sidebar: 'auto'
tags:
 - GitHub
 - CI
 - 自动部署
categories:
 - 开发
---

::: tip 
之前将开发好的静态网站打包压缩后，通过FTP上传到服务器，然后再解压缩，替换文件，整个过程很繁琐，现在使用自动化部署简单了很多。
:::

## 介绍

实现代码提交的自动化工作流，要依靠持续集成（或者加上持续交付）服务。现在主流的公用免费的持续集成服务有：
* Travis CI
* Jenkins
* Circle CI
* Azure Pipeline
* GitHub Actions

其中 GitHub Actions 是 GitHub 自家的持续集成及自动化工作流服务，简单易用，也是本文推荐使用的服务。它使用起来非常简单，只要在你的仓库根目录建立.github/workflows文件夹，将你的工作流配置(YAML 文件)放到这个目录下，就能启用 GitHub Actions 服务。

## 第一步：设置SSH密钥对

要把文件部署到远程服务器，首先要解决登录校验的问题。要么用密码登录、要么用 SSH 密钥登录。这里推荐用第二种方式，因为密码可能要定期更换，而用 SSH 密钥可以一劳永逸。

### 1. 在开发的机器上生成SSH，或者找到之前已经存在的SSH，我是用的是gitbash 生成命令如下：

```bash
  ssh-key-gen -t rsa -f mysite
```

一路回车就行，执行完成后，会在~/.ssh下生成两个文件：mysite（私钥）和mysite.pub（公钥）。其中私钥是你的个人登录凭证，*不可以分享给他人*，如果别人得到了你的私钥，就能登录到你的服务器。公钥则需要放到登录的目标服务器上。

### 2. 将你的公钥上传到你的服务器
将公钥mysite.pub的内容贴到目标服务器的~/.ssh/authorized_keys中，在gitBash中执行 

```bash
 ssh-copy-id  -i .ssh/将公钥mysite.pub 用户名@你服务器的IP -p SSH端口
```

等待执行完毕后可使用
```bash
 ssh -p 'SSH端口' '用户名@你服务器的IP'
```
测试SSH连接是否正常，如果不正常需要查找原因。

确保你的服务器~/.ssh文件夹的权限低于 711，可使用600（仅本用户可读写）：
```bash
 chmod 600 -R ~/.ssh
```

### 3. 查看私钥内容
查看私钥文件mysite，将内容复制下来以备后续使用，私钥的文件内容大致如下：
```bash
-----BEGIN RSA PRIVATE KEY-----
不要给别人看哦！！！
-----END RSA PRIVATE KEY-----
```


## 第二步：自动化配置写到 GitHub 仓库


打开你的GitHub仓库，找到Settings->Scerets->New repository secret
添加如下几项：
| name        |                value |
| ----------- | -------------------: |
| SERVER      | mysite里面的所有内容 |
| SERVER_IP   |         你服务器的IP |
| SERVER_NAME | 登陆你服务器的用户名 |
| SERVER_PORT |      你服务器SSH端口 |

添加在这里的配置，将只对你可见，不用担心会泄露给他人。


## 第三步: 编写工作流文件


在仓库根目录中创建.github/workflows文件夹，再创建一个 YAML 文件，文件名自定，我这里起名叫deploy.yml，所以文件的完整路径应该为.github/workflows/deploy.yml，我将配置的意义写在注释中，文件内容如下：
```bash
name: Deploy site files

on:
  push:
    branches:
      - master # 只在master上push触发部署
    paths-ignore: # 下列文件的变更不触发部署，可以自行添加
      - README.md
      - LICENSE

jobs:
  deploy:
    runs-on: ubuntu-latest # 使用ubuntu系统镜像运行自动化脚本

    steps: # 自动化步骤
      - uses: actions/checkout@v2 # 第一步，下载代码仓库

      - name: Deploy to Server # 第二步，rsync推文件
        uses: AEnterprise/rsync-deploy@v1.0 # 使用别人包装好的步骤镜像
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }} # 引用配置，SSH私钥
          ARGS: -avz --delete --exclude='*.pyc' # rsync参数，排除.pyc文件
          SERVER_PORT: "22" # SSH端口
          FOLDER: ./ # 要推送的文件夹，路径相对于代码仓库的根目录
          SERVER_IP: ${{ secrets.SSH_HOST }} # 引用配置，服务器的host名（IP或者域名domain.com）
          USERNAME: ${{ secrets.SSH_USERNAME }} # 引用配置，服务器登录名
          SERVER_DESTINATION: /home/fming/mysite/ # 部署到目标文件夹
      - name: Restart server # 第三步，重启服务
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }} # 下面三个配置与上一步类似
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.DEPLOY_KEY }}
          # 重启的脚本，根据自身情况做相应改动，一般要做的是migrate数据库以及重启服务器
          script: |
            cd /home/fming/mysite/
            python manage.py migrate
            supervisorctl restart web
```

可以发现 GitHub Actions 的最大特点就是有很多第三方提供的镜像，已经把一些常用的步骤封装好了，你只需要填下配置即可。而这些镜像也很容易提供，发布在自己的 GitHub 仓库即可，所以扩展性很强。

把文件写好，提交到仓库，就可以发现 GitHub Actions 已经启动了！可以在提交历史后面的状态，或者 Actions 标签中看到运行的状态。

## 总结
有 GitHub Actions 这个利器，除了自动部署，还可以做自动备份，自动 XXX……只要你想，你甚至能提交代码自动触发房间开灯。这些奇技淫巧，就留给读者自己去探索了。当然，这些都必须围绕一个 GitHub 代码仓库来做。推荐大家把自己用到的代码都放到 Git 上管理，一是可以备份方便重建，二是可以利用这些周边的生态，来让你的生活更简单。







