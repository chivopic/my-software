# Codex 执行规范

这份文件是给 AI 编码代理（Codex / Claude Code 等）看的。开工前必读，每个任务开始前重读一遍相关章节。

**唯一真源**
- 需求：`docs/01-v0-prd.md`
- 页面与交互：`docs/02-information-architecture.md`
- 数据结构：`docs/03-data-model.md`

三份文档与代码冲突时，**以文档为准**；确实需要改设计，先改文档、在同一个提交里说明理由，再改代码。

---

## 1. 铁律

1. **一次只做一个任务。** 从「V0 任务清单」里取最上面一个未完成项，做完、验证、提交，再取下一个。不要合并任务。
2. **不扩范围。** `docs/01-v0-prd.md` 的「明确不做」是硬边界。想到的新点子写进 `docs/backlog.md`，不要顺手实现。
3. **不引入清单外的依赖。** 见第 3 节。确需新依赖，先在提交信息里写明为什么现有方案不够。
4. **不改数据模型而不改文档。** 任何 `schema.prisma` 变更必须同步 `docs/03-data-model.md` 并生成 migration（禁止 `db push` 后不留 migration）。
5. **不留 TODO 占位实现。** 一个任务要么完整交付并可手工验收，要么不做。不要提交「先返回假数据，以后再接」。唯一例外是 PRD 里明确写为占位的 Daily Brief 卡片。
6. **不写没被要求的抽象。** 没有第二个调用方，就不要提取「通用」工具函数、不要加配置项、不要写插件机制。
7. **每次提交前必须通过第 5 节的 Definition of Done。** 不允许提交无法通过 `typecheck` / `lint` / `build` 的代码。

## 2. 目录结构

```text
.
├── app/
│   ├── layout.tsx              根布局 + 主题
│   ├── globals.css             Tailwind + CSS 变量
│   ├── page.tsx                Dashboard
│   ├── notes/
│   │   ├── page.tsx  actions.ts
│   │   └── [id]/page.tsx
│   ├── tasks/
│   │   ├── page.tsx  actions.ts
│   ├── planner/
│   │   ├── page.tsx  actions.ts
│   ├── settings/page.tsx
│   └── api/export/route.ts
├── components/                 结构见 docs/02，不要偏离
├── lib/
│   ├── db.ts                   PrismaClient 单例
│   ├── current-user.ts         V0 返回固定 local-user
│   ├── queries/                只读，函数清单见 docs/03 第 4 节
│   ├── mutations/              写操作
│   ├── validation/             zod schema
│   └── utils/                  date.ts / cn.ts / markdown.ts
├── prisma/
│   ├── schema.prisma  seed.ts  migrations/
├── docs/
└── AGENTS.md
```

## 3. 技术栈与依赖

**允许（V0 全部依赖，就这些）**

已锁定的版本见 `package.json`（next 16 / react 19 / tailwind 4 / eslint 10 / typescript 5.9）。
TypeScript 停在 5.9 而不是 7.x：生态里的 eslint 插件尚未跟上，等 V1 再评估。

```text
next  react  react-dom  typescript
tailwindcss  @tailwindcss/postcss     # v4 用 CSS-first 配置，不需要 tailwind.config 和 autoprefixer
prisma  @prisma/client
zod
date-fns
clsx  tailwind-merge
react-markdown  remark-gfm
eslint  eslint-config-next  prettier  prettier-plugin-tailwindcss
tsx                      # 跑 seed
vitest  @testing-library/react   # 见第 6 节
```

**Next 16 注意**：这一版与多数模型的训练数据差异较大（App Router 细节、`next lint` 已移除、
Tailwind v4 的 CSS-first 配置）。写代码前查 `node_modules/next/dist/docs/` 里的对应指南，
不要凭记忆写 API。

**明确禁止（V0）**：任何组件库（shadcn/MUI/Radix）、任何状态管理库（redux/zustand/jotai）、
任何数据请求库（swr/react-query）、任何拖拽库、任何 AI SDK、任何认证库、任何图表库、ORM 以外的查询构建器。
V0 的交互复杂度撑不起这些抽象，装了以后删不掉。

## 4. 编码规范

- **TypeScript strict**，禁止 `any`（第三方类型缺失时用 `unknown` + 收窄）。禁止 `@ts-ignore`。
- **默认 Server Component**，只有需要事件/状态/浏览器 API 才加 `"use client"`，并把 client 边界压到最小的叶子组件。
- **写操作一律用 Server Actions**，放在同目录的 `actions.ts`，成功后 `revalidatePath`。返回统一的 `ActionResult`（定义见 `docs/02` 第 5 节）。
- **输入校验用 zod**，在 action 入口处 `safeParse`，失败返回 `{ ok: false, error }`，不抛异常给 UI。
- **禁止在页面/组件里直接调 `prisma`**，一律经 `lib/queries` / `lib/mutations`。
- **日期**：一律用 `date-fns`，禁止手写日期运算。「今天」由 `lib/utils/date.ts` 的 `today(userTimezone)` 统一给出。
- **样式**：只用 Tailwind 原子类，不写 `.module.css`。类名合并用 `cn()`。颜色只用 `globals.css` 里的语义变量，不硬编码十六进制。
- **命名**：文件 kebab-case，组件 PascalCase，函数 camelCase，布尔量以 `is/has/should` 开头。
- **注释**：只在「为什么」不显然时写。不要给自解释的代码加注释，不要写变更日志式注释。
- **错误处理**：query 层不吞异常；action 层捕获并转成 `ActionResult`；页面级用 `error.tsx` 兜底。

## 5. Definition of Done

每个任务提交前，逐项跑：

```bash
pnpm typecheck     # tsc --noEmit
pnpm lint          # eslint .（Next 16 已移除 next lint）
pnpm test          # vitest run（存在测试时）
pnpm build         # next build
```

外加：
- [ ] 手工走通该任务的验收标准（在提交信息里列出你实际点了什么）
- [ ] 涉及的空状态、加载态、错误态都实现了
- [ ] 浅色和深色模式都看过
- [ ] 没有 console 报错、没有 hydration warning
- [ ] 如果改了 schema：有 migration 文件，`docs/03-data-model.md` 已同步

## 6. 测试策略

V0 不追求覆盖率，只测三类**回归代价高**的东西：

1. `lib/utils/date.ts` 的日期边界（今天/过期/本周，跨时区）。
2. `lib/queries` 的 `view` 过滤逻辑（today / upcoming / inbox / completed 各自选出什么）。
3. zod schema 的边界（空标题、超长标题、非法日期）。

UI 组件不写单测。E2E 留到 V1。

## 7. 提交与分支

- 分支：`claude/<主题>-<随机后缀>`（由任务下发方指定）。
- 提交信息用 Conventional Commits，主题行 ≤ 72 字符：

```text
feat(tasks): 四列看板与状态切换

- 实现 TaskBoard / TaskColumn / TaskCard
- 状态切为 DONE 时写入 completedAt
- view 查询参数支持 board|list|today|upcoming|inbox|completed

验收：新建任务→拖到 Doing→标记完成→在 completed 视图可见
```

- 一个任务一个提交（拆分重构可以多个，但每个都要能独立通过 DoD）。
- 不要在提交信息、代码注释或任何入库文件里写模型名称或 AI 工具名。
- 不主动创建 PR，除非被明确要求。

## 8. V0 任务清单

按顺序执行。每项标注依赖和验收要点，详细验收标准回查 `docs/01-v0-prd.md` 对应用户故事。

| # | 任务 | 依赖 | 完成即验收 |
| --- | --- | --- | --- |
| V0-01 | 初始化项目：Next.js + TS + Tailwind + ESLint/Prettier，配好 `pnpm` 脚本（dev/build/typecheck/lint/test） | — | `pnpm dev` 起得来，首页显示占位 |
| V0-02 | 接 Prisma + Postgres：`docker-compose.yml`（本地 pg）、`schema.prisma`（照抄 docs/03 第 2 节）、首个 migration、`lib/db.ts`、`prisma/seed.ts`、`lib/current-user.ts` | 01 | `pnpm prisma migrate dev` + `pnpm db:seed` 成功，Prisma Studio 里能看到 local-user |
| V0-03 | 布局骨架：`AppShell` / Sidebar / Topbar、主题变量、深浅色切换、`ui/` 基础组件（button/input/textarea/select/card/badge/dialog/toast/empty-state） | 01 | 四个路由都能通过侧边栏跳转，深浅色正常 |
| V0-04 | Notes 列表 + CRUD：`/notes`、`/notes/new`、软删除、`lib/queries/notes.ts`、`lib/mutations/notes.ts` | 02,03 | 能新建、能在列表看到、能删除且列表不再显示 |
| V0-05 | Notes 编辑器：`/notes/[id]`，Markdown 编辑/预览切换，800ms 自动保存与保存状态提示 | 04 | 输入后不点保存，刷新页面内容还在 |
| V0-06 | 标签系统：`Tag` CRUD、`TagInput` 组件、`/notes?tag=` 筛选 | 04 | 给两条笔记打同一个标签，按标签能筛出这两条 |
| V0-07 | Notes 搜索与收藏：`/notes?q=`、`?filter=favorite` | 04 | 搜正文里的词能命中；收藏后能筛出 |
| V0-08 | Tasks CRUD + 看板：四列、优先级、截止日期、状态切换写 `completedAt`、软删除 | 02,03,06 | 新建→改状态→完成，各列数量正确 |
| V0-09 | Tasks 视图：`?view=list|today|upcoming|inbox|completed` 与对应查询 + 单元测试（第 6 节第 2 类） | 08 | 造一批不同日期的任务，四个视图各自选对 |
| V0-10 | Quick Capture：`⌘K` 弹窗、Task/Note 二选一、toast + 跳转、当前页刷新 | 04,08 | 在 `/planner` 按 ⌘K 存一条 Task，去 `/tasks?view=inbox` 能看到 |
| V0-11 | Planner 单日视图：时间轴、未排期抽屉、排期与取消排期 | 08 | 把一个任务排到今天 14:00，刷新后仍在；取消后回到未排期 |
| V0-12 | Dashboard：问候语、统计行、Today's Focus（可勾选完成）、Today's Schedule、Recent Notes、Daily Brief 占位 | 05,09,11 | 有数据/无数据两种情况都不出现空白区域 |
| V0-13 | Settings + 导出：数据统计、`/api/export` 返回全量 JSON 附件 | 04,08 | 下载的 JSON 能覆盖所有笔记和任务 |
| V0-14 | 收尾：`README` 的本地启动步骤、`.env.example`、`error.tsx` / `not-found.tsx`、全站键盘可达性检查 | 全部 | 按 README 在干净环境从零跑起来 |

**做完 V0-14 就停下。** 不要自动开始 V1。等真实使用一周后再规划。

## 9. 遇到不确定时

- 文档里写了 → 照做。
- 文档没写但是纯风格问题（变量名、组件拆分粒度）→ 自己定，保持与既有代码一致。
- 文档没写且会影响数据结构或用户流程 → **停下来问**，不要猜。在任务输出里明确写「需要决策：A 还是 B，我倾向 A 因为……」。
