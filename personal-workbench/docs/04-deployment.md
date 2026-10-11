# 部署到 Vercel

> 目标：拿到一个自己的网址，手机和电脑都能打开。
> 全程约 30 分钟，其中大部分时间在等构建。

---

## 0. 需要准备什么

| 东西 | 说明 |
| --- | --- |
| GitHub 账号 | 仓库已经在 `chivopic/my-software` |
| Vercel 账号 | 用 GitHub 登录即可，免费额度足够个人使用 |
| 一个托管 PostgreSQL | Neon 或 Supabase，免费额度都够。**不要用 `docker-compose.yml` 里那个本地库** |

## 1. 建数据库

以 [Neon](https://neon.tech) 为例（Supabase 同理）：

1. 新建一个 project，区域选离你近的（国内用户选 Singapore 或 Tokyo）
2. 复制它给的连接串，形如：

```text
postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**注意**：Neon 会给两个连接串，pooled 和 direct。Prisma 迁移要用 **direct**（不带 `-pooler`），
应用运行用哪个都行。第 2 步用 direct，第 4 步填 pooled 更省连接数。

## 2. 建表并灌入初始数据

这一步在**你自己电脑上**跑，不在 Vercel 上跑。原因见本文末尾「为什么不在构建时迁移」。

```bash
# 用刚才的 direct 连接串
export DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"

pnpm db:deploy   # 建表（prisma migrate deploy）
pnpm db:seed     # 建 local-user 和三个初始标签
```

`db:seed` 在 `NODE_ENV=production` 下只建用户和标签，不会灌示例笔记和任务。
如果想连示例数据一起要，去掉 `NODE_ENV` 再跑。

**这一步不能跳过**：应用要求数据库里存在 `local-user` 这一行，缺了它每个页面都会报错。

## 3. 想一个访问密码

V0 没有用户账户或按用户授权。部署到公网后，任何拿到网址的人都可能读写你的全部笔记和任务，
`/api/export` 也会返回全部数据。`middleware.ts` 用 HTTP Basic 密码门保护页面和 API：

- 设了环境变量 `APP_PASSWORD` → 打开网页要求输密码（用户名随便填）
- 本地开发未设置 `APP_PASSWORD` → 允许访问
- 生产环境未设置 `APP_PASSWORD` → 拒绝访问

在 Vercel 的 Preview 和 Production 环境都配置 `APP_PASSWORD`（如果使用 `vercel dev`，也配置 Development）。这不是用户认证、加密或按用户隔离；
它是所有访问者共用的一道 HTTP Basic 密码门。

## 4. 在 Vercel 上导入

1. 打开 https://vercel.com/new，选 `chivopic/my-software`
2. **Root Directory 一定要设成 `personal-workbench`**（仓库现在是多软件 monorepo，本项目不在仓库根目录了；已有的 Vercel 项目也要去 Settings → General → Root Directory 补设一次，否则构建会在仓库根找不到 `package.json`）
3. Framework Preset 会自动识别成 Next.js，**不要改任何构建命令**
4. 展开 Environment Variables，加两个：

| Name | Value | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | Neon 的连接串（推荐 pooled） | 三个环境都勾上 |
| `APP_PASSWORD` | 你想的密码 | 三个环境都勾上 |

5. 点 Deploy，等 1–2 分钟

## 5. 验收

打开 Vercel 给的网址：

- [ ] 弹出密码框，输错进不去，输对能进
- [ ] Dashboard 显示「早上好」和四格统计（数字应该是 0，因为是新库）
- [ ] `⌘K` 记一条任务，去 Tasks 的 Inbox 里能看到
- [ ] 刷新页面数据还在（说明真的写进 Neon 了）
- [ ] 手机上打开同一个网址，能看到刚才那条任务

## 6. 之后的更新

`main` 分支一有新提交，Vercel 会自动构建部署，不用手动操作。

**但如果这次改动带了新的数据库迁移**，要先在本地对生产库跑一次：

```bash
DATABASE_URL="<生产连接串>" pnpm db:deploy
```

顺序是：**先迁移，再合并到 main**。反过来会让新代码撞上旧表结构。

---

## 为什么不在构建时迁移

常见做法是把 `build` 写成 `prisma migrate deploy && next build`，这样部署时自动迁移。
本项目没有这么做，有两个原因：

1. **构建会因此依赖数据库**。数据库一抖，构建就失败，而这时候连回滚都不好回。
   现在的状态是：数据库完全没起，`pnpm build` 也能通过（这条被当作验收项测过）。
2. **迁移是有风险的操作，值得你自己看着它跑完**。单人项目一年也改不了几次表结构，
   省下的那点手动成本，不值得拿"某次自动迁移悄悄改坏了生产数据"来换。

## 备份

`/settings` 页有「导出 JSON」，包含全部笔记、任务、标签和行为日志（含已软删除的）。
这是目前唯一的备份手段，建议每隔一段时间导一份存到本地。

Neon 免费额度有自己的时间点恢复，但别只依赖它。

## 常见问题

**页面报「找不到 local-user」** → 第 2 步的 `pnpm db:seed` 没跑，或者跑在了别的库上。

**构建成功但页面 500** → 多半是 `DATABASE_URL` 没配到对应环境（Preview 和 Production 是分开的），
或者用了 Neon 的 direct 连接串又超了连接数，换 pooled 的试试。

**密码框反复弹** → 浏览器缓存了错误的凭据，换无痕窗口，或者确认 `APP_PASSWORD` 三个环境都设了。

**改了 `APP_PASSWORD` 但还是旧密码** → 环境变量改完要重新部署一次才生效。
