# Personal Workbench

一个把**笔记、任务、计划、信息流和 AI 分析**集中到一起的个人工作台。

目标不是「功能多」，而是形成一个闭环：

```text
信息进入 → 记录/收集 → 整理 → 变成任务或计划 → 执行 → 每日复盘 → AI 分析 → 新的行动建议
```

## 核心原则

1. **每天打开第一屏就知道今天该干什么。** Dashboard 是产品，不是导航页。
2. **AI 是能力层，不是一个页面。** 不做右下角的「Ask AI」气泡，AI 以动作的形式嵌进 Notes / Tasks / Planner / Insights。
3. **一次只长一层。** 每个版本只加一个模块，永远保持可用、可发布。
4. **数据模型先于界面。** 表结构一旦定下来，后面的 AI 能力才有东西可分析。

## 模块

| 模块 | 作用 |
| --- | --- |
| Dashboard | 今天的工作台：Today / Daily Brief / Quick Capture |
| Notes | 个人知识库（Markdown + Tag + 搜索） |
| Tasks | 带状态和优先级的任务系统（Inbox / Todo / Doing / Done） |
| Planner | 「什么时候做」：把任务排到具体日期与时间段 |
| Insights | Daily Review / Weekly Review / AI Analysis |
| Settings | 偏好、信息源、AI 配置 |

## 版本路线

| 版本 | 目标 | 状态 |
| --- | --- | --- |
| **V0** | Dashboard + Notes + Tasks + 最小 Planner + Quick Capture | ✅ 完成 |
| V1 | Projects、完整 Planner（周视图、Goals） | 未开始 |
| V2 | Daily Review + 统计 | 未开始（行为日志已在 V0 开始记录） |
| V3 | Daily Brief（信息采集 pipeline） | 未开始 |
| V4 | AI Notes / AI Tasks（摘要、拆解、自动分类） | 未开始 |
| V5 | 语义搜索 / Ask My Notes | 未开始 |
| V6 | Personal AI Assistant（「今天我该做什么」「帮我规划明天」） | 未开始 |

## 技术选型（V0 定稿）

```text
Next.js 15 (App Router) + TypeScript + Tailwind CSS
Prisma + PostgreSQL
本地 Docker Postgres 开发，部署 Vercel + 托管 Postgres
```

V0 **不引入**：认证、AI 调用、RSS 抓取、后台任务、状态管理库、组件库。
理由见 [`docs/01-v0-prd.md`](docs/01-v0-prd.md) 的「明确不做」一节。

## V0 能做什么

- **Dashboard**：问候语、四格统计、Today's Focus（可直接勾完成）、今日时间表、最近笔记
- **Notes**：Markdown 编辑 + 预览，800ms 自动保存，标签、全文搜索、收藏、软删除可撤销
- **Tasks**：Inbox / Todo / Doing / Done 四列看板，优先级、截止日期、标签，
  六个视图（看板 / 全部 / Inbox / 今天 / 近 7 天 / 已完成）
- **Planner**：单日时间轴 06:00–24:00，把任务排到具体时段，未排期抽屉
- **Quick Capture**：任意页面 `⌘K`，一行输入存成任务或笔记
- **Settings**：数据统计 + 全量 JSON 导出（V0 唯一的备份手段）

后台还会默默记录行为日志（创建、完成、排期、删除…），V0 不做界面，
是给 V2 的统计与复盘攒原始数据用的——这类历史一旦没记就补不回来。

深浅色主题跟随系统，也可手动切换。全站键盘可达。

## 本地开发

```bash
pnpm install
cp .env.example .env
pnpm db:up        # 起本地 Postgres（Docker）
pnpm db:migrate   # 建表
pnpm db:seed      # 造 local-user、标签和示例数据
pnpm dev          # http://localhost:3000
```

其他脚本：

| 命令 | 作用 |
| --- | --- |
| `pnpm build` | 生产构建 |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint（Next 16 已移除 `next lint`） |
| `pnpm format` | Prettier 写入（Markdown 不参与格式化） |
| `pnpm test` | Vitest |
| `pnpm db:up` / `db:down` | 起停本地 Postgres |
| `pnpm db:migrate` | `prisma migrate dev`，生成并应用迁移 |
| `pnpm db:seed` | 灌 seed 数据（幂等，可重复跑） |
| `pnpm db:reset` | 清库重来（会二次确认，数据全丢） |
| `pnpm db:studio` | Prisma Studio |

数据库是 PostgreSQL 16，本地用 `docker-compose.yml` 起，账号/密码/库名都是 `workbench`。
Prisma 7 的连接串配在 `prisma.config.ts`（读 `.env` 的 `DATABASE_URL`），不在 schema 里。

## 变更记录

见 [CHANGELOG.md](CHANGELOG.md)。

## 文档

| 文档 | 内容 |
| --- | --- |
| [docs/01-v0-prd.md](docs/01-v0-prd.md) | V0 PRD：范围、用户故事、验收标准 |
| [docs/02-information-architecture.md](docs/02-information-architecture.md) | 页面结构、路由、布局、交互规范 |
| [docs/03-data-model.md](docs/03-data-model.md) | 数据模型、Prisma schema、演进策略 |
| [AGENTS.md](AGENTS.md) | Codex 执行规范与 V0 任务清单 |
