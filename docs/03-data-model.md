# 数据模型

> 状态：定稿（2026-08-28）· V0 建表 + V1–V6 演进策略
> 这份文档是 schema 的唯一真源。改结构先改这里，再改 `prisma/schema.prisma`，再生成 migration。

---

## 1. 通用约定

| 约定 | 说明 |
| --- | --- |
| 主键 | `String @id @default(cuid())` |
| 时间戳 | 每张业务表都有 `createdAt` / `updatedAt` |
| 软删除 | 用户可见的内容表有 `deletedAt DateTime?`，查询默认 `where: { deletedAt: null }` |
| 时刻 vs 日期 | 时刻用 `DateTime @db.Timestamptz(3)`（存 UTC）；日期语义字段用 `DateTime @db.Date`（不做时区换算）。Prisma 默认给 `DateTime` 生成的是 `timestamp(3)`（无时区），必须显式加 `@db.Timestamptz(3)` |
| 命名 | 模型 PascalCase 单数，字段 camelCase，枚举 SCREAMING_SNAKE |
| 排序 | 需要手工排序的表用 `order Float`，插入取相邻两值中点，避免整表重排 |
| 归属 | 所有业务表都带 `userId`，即使 V0 只有一个用户 |
| 连接方式 | Prisma 7：连接串写在 `prisma.config.ts`，不写在 `datasource` 里；客户端用 driver adapter（`@prisma/adapter-pg`）连接，见 `lib/db.ts` |

## 2. V0 Schema

```prisma
generator client {
  provider = "prisma-client"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ───────────── User ─────────────
// V0 单用户：seed 一行，id 固定为 "local-user"，通过 lib/current-user.ts 取。
// V1 接入认证时这张表已经就位，业务表无需迁移。
model User {
  id        String   @id @default(cuid())
  email     String?  @unique
  name      String?
  timezone  String   @default("Asia/Shanghai")
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @db.Timestamptz(3)

  notes    Note[]
  tasks    Task[]
  projects Project[]
  tags     Tag[]
}

// ───────────── Tag ─────────────
// Note 和 Task 共用一套标签，这样「AI Infra」这个概念在知识和行动两侧是同一个东西，
// 是后面做关联分析（学了什么 vs 做了什么）的前提。
model Tag {
  id        String   @id @default(cuid())
  userId    String
  name      String
  slug      String
  color     String?
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @db.Timestamptz(3)

  user  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  notes NoteTag[]
  tasks TaskTag[]

  @@unique([userId, slug])
  @@index([userId])
}

// ───────────── Note ─────────────
model Note {
  id         String    @id @default(cuid())
  userId     String
  title      String
  content    String    @default("") // Markdown 原文
  isFavorite Boolean   @default(false)
  isArchived Boolean   @default(false)
  createdAt  DateTime  @default(now()) @db.Timestamptz(3)
  updatedAt  DateTime  @updatedAt @db.Timestamptz(3)
  deletedAt  DateTime? @db.Timestamptz(3)

  user User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags NoteTag[]

  @@index([userId, updatedAt(sort: Desc)])
  @@index([userId, deletedAt])
}

model NoteTag {
  noteId String
  tagId  String

  note Note @relation(fields: [noteId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([noteId, tagId])
  @@index([tagId])
}

// ───────────── Task ─────────────
enum TaskStatus {
  INBOX
  TODO
  DOING
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model Task {
  id          String       @id @default(cuid())
  userId      String
  projectId   String?
  title       String
  description String?
  status      TaskStatus   @default(INBOX)
  priority    TaskPriority @default(MEDIUM)

  dueDate         DateTime? @db.Date // 什么时候之前要做完
  scheduledFor    DateTime? @db.Date // 打算哪天做（Planner 写入）
  scheduledStart  DateTime? @db.Timestamptz(3) // 时间段起（UTC 时刻）
  scheduledEnd    DateTime? @db.Timestamptz(3) // 时间段止
  estimateMinutes Int?

  completedAt DateTime? @db.Timestamptz(3)
  order       Float     @default(0) // 同一状态列内的手工排序
  createdAt   DateTime  @default(now()) @db.Timestamptz(3)
  updatedAt   DateTime  @updatedAt @db.Timestamptz(3)
  deletedAt   DateTime? @db.Timestamptz(3)

  user    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)
  tags    TaskTag[]

  @@index([userId, status, order])
  @@index([userId, dueDate])
  @@index([userId, scheduledFor])
  @@index([userId, deletedAt])
}

model TaskTag {
  taskId String
  tagId  String

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([taskId, tagId])
  @@index([tagId])
}

// ───────────── Project ─────────────
// V0 建表但不做管理界面：任务可以不属于任何 project。
// 先建是因为 Task.projectId 一旦后加就要写迁移，成本远高于现在多一张空表。
model Project {
  id          String    @id @default(cuid())
  userId      String
  name        String
  description String?
  color       String?
  archivedAt  DateTime? @db.Timestamptz(3)
  createdAt   DateTime  @default(now()) @db.Timestamptz(3)
  updatedAt   DateTime  @updatedAt @db.Timestamptz(3)
  deletedAt   DateTime? @db.Timestamptz(3)

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks Task[]

  @@index([userId, deletedAt])
}
```

## 3. 关键设计决定

**为什么 `dueDate` 和 `scheduledFor` 是两个字段。**
这是 Todo 和 Planner 的根本区别：`dueDate` 是「什么时候之前必须做完」（外部约束），
`scheduledFor` 是「我打算哪天做」（自己的安排）。合成一个字段，Planner 就没有存在意义了。
Dashboard 的 Today's Focus 取两者的并集，Today's Schedule 只取 `scheduledStart` 非空的。

**为什么排期信息放在 Task 上而不是单独的 `PlanBlock` 表。**
V0 里一个任务只排一次，放在 Task 上查询最简单（Planner 一次查询就够）。
等到 V1 需要「一个任务分多次做」「番茄钟记录实际用时」时，再抽出 `PlanBlock`，
届时把 Task 的三个 scheduled 字段迁移过去即可，是一次性的、可脚本化的迁移。这个取舍是有意的。

**为什么 Note 和 Task 共用 Tag。**
V2 的 Daily Review 要回答「这周我在 AI Infra 上花了多少时间、产出了几条笔记」，
前提是两侧用同一个标签实体。分开建表以后合并的代价远大于现在共用。

**为什么标签不用字符串数组。**
`String[]` 写起来快，但改名、统计、加颜色都要全表扫描更新。多两张 join 表换来的是标签变成一等公民。

## 3.5 配置与连接（Prisma 7）

三个文件构成完整链路，改任何一个前先看清楚职责：

| 文件 | 职责 |
| --- | --- |
| `prisma.config.ts` | 给 CLI 用：schema 位置、`DATABASE_URL`、migrations 目录、seed 命令。Prisma 7 不再自动读 `.env`，这里用 Node 内建的 `loadEnvFile` 读，不引 dotenv |
| `lib/db.ts` | 给应用用：`PrismaClient` + `PrismaPg` adapter，开发环境挂 `globalThis` 防热更新连接泄漏 |
| `lib/current-user.ts` | V0 返回固定的 `local-user`；V1 接认证只改这一个文件 |

本地数据库用 `docker-compose.yml` 起（`pnpm db:up`），账号密码库名都是 `workbench`。

## 4. 查询清单（V0）

Codex 实现 `lib/queries/` 时按这个清单来，不要临时发明查询：

| 函数 | 用途 |
| --- | --- |
| `getTodayFocus(userId, today)` | 未完成，且 `dueDate <= today` 或 `scheduledFor = today`，按优先级+截止日期排序，取 5 条 |
| `getTodaySchedule(userId, today)` | `scheduledFor = today` 且 `scheduledStart` 非空，按开始时间升序 |
| `getRecentNotes(userId, limit)` | 按 `updatedAt` 倒序 |
| `getDashboardStats(userId, today)` | 今日到期数、已排期数、本周新建笔记数 |
| `listTasks(userId, { view, tag, projectId, page })` | 看板/列表的统一入口，`view` 决定 where |
| `listNotes(userId, { q, tag, filter, page })` | `q` 走 `title ILIKE` OR `content ILIKE` |
| `getUnscheduledTasks(userId)` | `status ∈ {TODO, DOING}` 且 `scheduledFor` 为空 |
| `getPlannerDay(userId, date)` | 某天全部已排期任务 |
| `listTags(userId)` | 带 note/task 计数 |
| `exportAll(userId)` | `/settings` 导出用的全量 JSON |

## 5. 演进策略（V1–V6 预留）

下面是**未来**的表，V0 不要建，但设计 V0 时已经保证不会与之冲突：

```text
V1  Project UI 上线；PlanBlock（task 拆多段执行）；Goal（季度/月度目标）
V2  DailyReview  { date, focusMinutes, tasksCompleted, notesCreated, reflection }
    ActivityLog  { entityType, entityId, action, at }  ← 统计的原始数据来源
V3  Source          { type: RSS|API|HN|ARXIV, url, enabled, lastFetchedAt }
    InformationItem { sourceId, title, url, publishedAt, rawContent, summary, score, dedupHash }
    DailyBrief      { date, sections Json, signal String }
V4  Task.aiBreakdown Json?、Note.aiSummary String?、Note.aiTags String[]
    AIRun { kind, input, output, model, tokens, costUsd, at }  ← 所有 LLM 调用留痕
V5  NoteChunk { noteId, content, embedding vector(1536) }  ← 需要 pgvector 扩展
    NoteLink  { fromNoteId, toNoteId }                     ← 双向链接
V6  AssistantThread / AssistantMessage
```

**为了不返工，V0 现在就要做到的三件事：**

1. 所有业务表带 `userId`（V1 加认证不迁移）。
2. `Task.projectId` 现在就存在（V1 上 Project UI 不迁移）。
3. Postgres 而不是 SQLite（V5 的 pgvector、V3 的 JSON 字段都依赖它）。

**ActivityLog 的注意点**：V2 的统计需要历史行为，而历史一旦没记就补不回来。
如果 V0 收尾时还有余力，优先加的**不是**新功能，而是这张日志表——它现在几乎零成本，将来无法补录。

## 6. Seed 数据

`prisma/seed.ts` 必须创建：
- 一个 `User`，`id = "local-user"`，`timezone = "Asia/Shanghai"`。
- 三个 Tag：`AI Infra`、`Algorithms`、`Project`。
- 若干示例 Task 和 Note（仅在 `NODE_ENV !== "production"`）。

示例数据用固定 id（`seed-task-*` / `seed-note-*`）配合 `upsert`，重复跑 seed 不会堆出重复数据。
