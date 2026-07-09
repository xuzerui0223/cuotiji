# 部署到 Cloudflare Pages（国内可访问 · 免费）

> 目标：让朋友用手机/电脑浏览器打开你的专属链接，体验登录后就能建小组、搜编号、加组。
> 整个流程**不需要在本机下载任何二进制**（避开 GitHub 被墙的问题）。

## 第 1 步：注册 Cloudflare
1. 打开 https://dash.cloudflare.com/sign-up （用邮箱注册，免费）。
2. 登录后进入控制台首页。

## 第 2 步：建 D1 数据库
1. 控制台左侧菜单点 **Workers & Pages** → 顶部切到 **D1 SQL**。
2. 点 **Create** → 数据库名填 `cuotiji-db` → **Create**。
3. 记下这个数据库的 **Database ID**（之后用，也可以不填，因为我们用控制台绑定）。

> 表结构会在网站第一次有人访问时自动创建，你不用手动建表。

## 第 3 步：连 GitHub 部署 Pages
1. 控制台左侧点 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 授权 GitHub，选中你的仓库 `cuotiji`。
3. 配置（保持简单）：
   - **Framework preset**：选 **None**（无框架）。
   - **Build command**：留空。
   - **Build output directory**：填 `.`（点号，表示仓库根目录）。
   - **Node.js version**：Default 即可。
4. 点 **Save and Deploy**，等 1–2 分钟，状态变 **Success**。

## 第 4 步：绑定 D1 数据库（关键）
1. 进入刚建好的 Pages 项目 → **Settings** → **Functions** → **D1 数据库绑定**（或 **Bindings**）。
2. 点 **Add binding** / **Add D1 database**：
   - **Variable name**（变量名）：必须填 `DB`
   - **Database**：选刚才建的 `cuotiji-db`
3. 保存。然后回到 **Deployments** 标签，**重新部署一次（Redeploy）** 让绑定生效。

## 第 5 步：拿到公网链接
1. 项目页顶部会显示一个地址，形如：
   ```
   https://cuotiji.pages.dev
   ```
2. 发给朋友即可。朋友点开 → 体验登录填昵称 → 建组/加组。

## 之后改了代码怎么更新线上
在项目目录的终端里：
```
git add -A
git commit -m "说明改了啥"
git push
```
Cloudflare 检测到 GitHub 有新提交会自动重新部署，朋友刷新即是新版。

## 常见问题
- **打不开 / 502**：先确认第 4 步 D1 绑定做了且**重新部署过**；再访问一次触发建表。
- **提示 D1_NOT_BOUND**：说明 D1 绑定没生效，回去检查变量名是否 exactly 是 `DB`。
- **想换成真微信登录**：在 Pages 项目 **Settings → Environment variables** 加 `WECHAT_APPID` / `WECHAT_SECRET` / `PUBLIC_BASE`（值为你的 https://xxx.pages.dev），并需已备案域名，否则用体验登录即可。
