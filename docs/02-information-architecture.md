# 页面结构与交互规范

> 状态：定稿（2026-08-28）· 对应 V0

---

## 1. 信息架构

```text
Personal Workbench
│
├── Dashboard              /
│   ├── Today's Focus
│   ├── Today's Schedule
│   ├── Recent Notes
│   └── Daily Brief        (V0 占位 → V3)
│
├── Notes                  /notes
│   ├── All Notes          /notes
│   ├── By Tag             /notes?tag=ai
│   ├── Favorites          /notes?filter=favorite
│   ├── Search             /notes?q=sliding+window
│   └── Detail / Edit      /notes/[id]
│
├── Tasks                  /tasks
│   ├── Board (default)    /tasks?view=board
│   ├── List               /tasks?view=list
│   ├── Inbox              /tasks?view=inbox
│   ├── Today              /tasks?view=today
│   ├── Upcoming           /tasks?view=upcoming
│   └── Completed          /tasks?view=completed
│
├── Planner                /planner
│   └── Day                /planner?date=2026-08-28
│       (Weekly / Goals → V1)
│
├── Insights               (V2，V0 侧边栏不显示)
│
└── Settings               /settings
```

## 2. 路由表

| 路由 | 渲染方式 | 说明 |
| --- | --- | --- |
| `/` | Server Component | Dashboard，并行取 4 组数据 |
| `/notes` | Server Component | 支持 `q` / `tag` / `filter` / `page` 查询参数 |
| ~~`/notes/new`~~ | — | **不做这个路由**：新建是写操作，做成 GET 页面会被 `Link` 预取误触发。改为「新建笔记」按钮提交 form 调 Server Action，创建后 `redirect` 到 `/notes/[id]` |
| `/notes/[id]` | Server + Client 编辑器 | 自动保存 |
| `/tasks` | Server Component | 支持 `view` / `tag` / `project` 查询参数 |
| `/planner` | Server Component | 支持 `date`（缺省为今天，格式 `YYYY-MM-DD`） |
| `/settings` | Server Component | 统计 + 导出 |
| `/api/export` | Route Handler | 返回全量 JSON 附件 |

**状态放在 URL 里**：视图、筛选、搜索、日期都用查询参数，不用客户端全局状态。
这样刷新、前进后退、收藏链接都能工作，也省掉 V0 引入状态管理库。

## 3. 布局

```text
┌──────────────┬────────────────────────────────────────────┐
│              │  Topbar: 面包屑 / 页面操作      [+ Capture] │
│   Sidebar    ├────────────────────────────────────────────┤
│              │                                            │
│  Dashboard   │                                            │
│  Notes       │              Page Content                  │
│  Tasks       │                                            │
│  Planner     │                                            │
│              │                                            │
│  ─────────   │                                            │
│  Settings    │                                            │
└──────────────┴────────────────────────────────────────────┘
```

- Sidebar 固定宽 240px，`≥1280px` 常驻；`768–1279px` 收成 64px 图标栏；`<768px` 抽屉。
- Topbar 高 56px，右侧常驻主题切换和 `+ Capture`（提示 `⌘K`）。
- 内容区最大宽度 1200px 居中，左右留白 24px。

## 4. 组件清单（V0）

按目录组织，Codex 实现时不要偏离这个结构：

```text
components/
├── layout/
│   ├── app-shell.tsx          Sidebar + Topbar + 内容槽（抽屉状态在这里）
│   ├── nav.tsx                导航项与图标，Sidebar 和 Topbar 共用
│   ├── sidebar.tsx
│   ├── theme-toggle.tsx
│   └── topbar.tsx
├── capture/
│   ├── capture-dialog.tsx     ⌘K 弹窗（Client）
│   └── capture-trigger.tsx
├── tasks/
│   ├── task-board.tsx         四列看板
│   ├── task-column.tsx
│   ├── task-card.tsx
│   ├── task-list.tsx
│   ├── task-form.tsx          新建/编辑表单
│   └── task-status-select.tsx
├── notes/
│   ├── note-list.tsx
│   ├── note-card.tsx
│   ├── new-note-button.tsx    form + Server Action
│   ├── delete-note-button.tsx 软删除 + toast 撤销
│   ├── note-editor.tsx        Client，自动保存
│   └── markdown.tsx           渲染
├── planner/
│   ├── day-timeline.tsx
│   ├── timeline-block.tsx
│   └── unscheduled-drawer.tsx
├── dashboard/
│   ├── greeting.tsx
│   ├── stat-row.tsx
│   ├── today-focus.tsx
│   ├── today-schedule.tsx
│   ├── recent-notes.tsx
│   └── daily-brief-placeholder.tsx
└── ui/
    ├── button.tsx  input.tsx  textarea.tsx  select.tsx
    ├── dialog.tsx  badge.tsx  card.tsx  toast.tsx
    ├── empty-state.tsx
    └── tag-input.tsx
```

`ui/` 自己写，不装组件库。V0 需要的交互足够简单，装 shadcn/Radix 会带来一堆现在用不上的抽象；
真正需要复杂弹层（V1 的拖拽、下拉菜单）时再引入。

## 5. 数据访问约定

- 读：Server Component 里直接调 `lib/queries/*`。
- 写：**Server Actions**（`app/**/actions.ts`），写完调用 `revalidatePath`。
- 不写 REST API（`/api/export` 除外）。V3 需要给后台任务提供接口时再补。
- 所有 Prisma 调用集中在 `lib/queries/` 和 `lib/mutations/`，页面和组件里不出现 `prisma.`。

Server Action 签名统一（定义在 `lib/action-result.ts`，配套 `ok()` / `fail()` 两个构造函数）：

```ts
type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

输入一律用 `zod` 校验，schema 放 `lib/validation/`，与 Prisma 类型分离。

## 6. 交互规范

### 键盘
| 快捷键 | 行为 |
| --- | --- |
| `⌘K` / `Ctrl+K` | 打开 Quick Capture |
| `Esc` | 关闭弹窗 / 取消编辑 |
| `⌘Enter` | 提交当前表单 |
| `Tab` | Quick Capture 内切换 Task / Note |

### 反馈
- 所有写操作使用乐观更新 + 失败回滚 + toast 提示。
- 自动保存节流 800ms，页面卸载前若有未保存内容用 `beforeunload` 拦截。
- 破坏性操作（删除）不弹二次确认——因为是软删除——但 toast 里给「撤销」按钮，5 秒内可恢复。

### 空状态
每个列表都必须有空状态，包含一句话 + 一个按钮：

| 位置 | 文案 | 按钮 |
| --- | --- | --- |
| Today's Focus | 今天没有安排。要不要先看看 Inbox？ | 打开 Inbox |
| Today's Schedule | 今天还没有排期。 | 去 Planner |
| Notes | 还没有笔记。 | 新建笔记 |
| Tasks 某列 | （灰色虚线框，无文案） | — |
| 搜索无结果 | 没有匹配「xxx」的笔记。 | 清除搜索 |

## 7. 视觉

- 字体：`Inter` + 系统中文字体栈；正文 14px / 行高 1.6；标题 20/16px。
- 间距：4 的倍数（Tailwind 默认 scale）。
- 圆角：卡片 `rounded-lg`，输入 `rounded-md`。
- 颜色：Tailwind `zinc` 作中性色；强调色 `indigo-500`。
- 优先级色：`LOW=zinc-400` `MEDIUM=blue-500` `HIGH=amber-500` `URGENT=red-500`。
- 状态色：`INBOX=zinc` `TODO=blue` `DOING=amber` `DONE=emerald`。
- 深色模式用 `class` 策略，颜色全部走 CSS 变量，定义在 `app/globals.css`。
