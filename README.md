# 卡号激活服务新联系方式站

这个项目复用旧站的页面逻辑和接口，只替换底部联系方式模块。

## 联系方式

- 售后QQ群：1072653807
- 售后QQ群链接：https://qm.qq.com/q/GmN6NYIh6c
- 代理QQ：191176548
- 代理QQ链接：https://qm.qq.com/q/3fzTa4zK6k

## 本地运行

```bash
npm start
```

或者直接：

```bash
node server.js
```

默认端口是 `3000`，可通过环境变量 `PORT` 修改。

## 部署说明

部署到新服务器后，把域名反向代理到这个 Node 服务即可。页面会保留以下入口：

- `/activate`
- `/activate-plus`
- `/activate-team`

这些页面里的提交、查询和处理接口会继续代理到旧站 `https://activate.amazo.indevs.in`。

健康检查：

- `/healthz`

## Docker 部署

```bash
docker build -t activate-contact-site .
docker run -d --name activate-contact-site --restart unless-stopped -p 3000:3000 activate-contact-site
```

## Vercel 部署

这个项目已经包含 Vercel 配置：

- `api/index.js`
- `vercel.json`

部署步骤：

1. 把整个 `activate-contact-site` 目录推到 GitHub。
2. 在 Vercel 新建项目，导入这个 GitHub 仓库。
3. Framework Preset 选择 `Other`。
4. Build Command 留空。
5. Output Directory 留空。
6. 部署完成后访问：

- `https://你的域名/activate`
- `https://你的域名/activate-plus`
- `https://你的域名/activate-team`

Vercel 会把这些路径重写到 Serverless Function，再由函数代理旧站接口和静态资源。

## systemd 部署

1. 把项目放到 `/opt/activate-contact-site`
2. 安装 Node.js 18 或更高版本
3. 复制 `activate-contact-site.service.example` 到 `/etc/systemd/system/activate-contact-site.service`
4. 执行：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now activate-contact-site
```

## Nginx 反向代理

参考 `nginx.activate.example.conf`，把 `server_name` 改成你的新域名，然后 reload Nginx。
