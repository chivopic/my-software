# V0 PRD — Personal Workbench

> 状态：定稿（2026-08-28）
> 目标：把产品骨架跑起来，形成「收集 → 任务 → 计划 → 完成」的最小闭环。

---

## 1. V0 要解决的问题

一句话：**我每天打开它，能记东西、能管任务、能安排今天，并且第二天还愿意打开。**

V0 成功的判断标准不是功能数量，而是：

- 连续使用 7 天后，Tasks 里有真实数据而不是测试数据；
- 想记一条东西时，第一反应是按 `⌘K` 而不是打开备忘录。

## 2. 用户

单人使用（就是我自己）。V0 **不做**多用户、不做登录。
数据库里仍然保留 `User` 表并预置一行，避免 V1 加认证时做痛苦的迁移（见数据模型文档）。

## 3. 范围

### 3.1 做（In Scope）

| # | 模块 | V0 内容 |
| --- | --- | --- |
| 1 | Dashboard `/` | 今日任务、进行中任务、最近笔记、今日时间表、Quick Capture 入口 |
| 2 | Notes `/notes` | Markdown 笔记的增删改查、标签、搜索、收藏、最近编辑 |
| 3 | Tasks `/tasks` | 任务 CRUD、四状态看板、优先级、截止日期、标签、快速完成 |
| 4 | Planner `/planner` | 单日时间轴：把任务排到某天的某个时间段 |
| 5 | Quick Capture | 全局 `⌘K`：一行输入，选择存成 Task 或 Note |
| 6 | Settings `/settings` | 占位页：显示版本、数据统计、导出 JSON |

### 3.2 明确不做（Out of Scope，V0）

写清楚是为了防止实现时范围膨胀：

- ❌ 登录 / 注册 / 多用户 / 权限
- ❌ 任何 LLM 调用（摘要、分类、拆解、建议）
- ❌ Daily Brief、RSS、爬虫、行情、任何外部数据源
- ❌ Daily Review、统计图表
- ❌ 双向链接 `[[...]]`、语义搜索、embedding
- ❌ 周视图、Goals、Projects 管理界面（`Project` 表建好，UI 留到 V1）
- ❌ 拖拽排期、拖拽看板（V0 用下拉/表单改状态和时间，V1 再加拖拽）
- ❌ 富文本编辑器 / block 编辑器（V0 就是一个 `textarea` + 预览）
- ❌ 移动端 App、离线同步、协作

### 3.3 关于 Planner 的取舍说明

原始规划里 Planner 属于 V1，但页面清单里又出现在 V0。这里做出决定：

**V0 包含一个最小 Planner**，只有单日视图，只做「任务 ↔ 时间段」的绑定，
因为没有它，「计划」这一环缺失，闭环不成立，Dashboard 的「今日时间表」也无内容可显示。
周视图、Goals、跨天拖拽全部留到 V1。

如果 V0 工期紧张，可裁掉的顺序是：`/settings` 导出 → Planner 时间轴（退化为「今天要做的任务列表」）→ 笔记收藏。
**不可裁掉**：Quick Capture、Tasks 看板、Notes CRUD、Dashboard。

## 4. 用户故事与验收标准

### US-1 Quick Capture：随手记

> 作为使用者，我在任何页面按 `⌘K`，输入一句话，就能把它存下来，不打断当前的事。

验收：
- 任意页面按 `⌘K`（Windows `Ctrl+K`）弹出输入框，`Esc` 关闭，焦点自动落在输入框。
- 输入内容后可选择 `Task` 或 `Note`（默认 `Task`，`Tab` 切换，`⌘Enter` 提交）。
- 存为 Task：`status = INBOX`，`title` = 输入内容，其余留空。
- 存为 Note：`title` = 输入内容的前 60 字符，`content` = 完整输入。
- 提交后弹窗关闭，右下角出现 toast「已保存 · 查看」，点击跳到该条目。
- 当前页面数据若受影响（如在 `/tasks`），列表立即刷新。

### US-2 Tasks：管理任务

> 作为使用者，我能看到所有任务分成 Inbox / Todo / Doing / Done 四列，并推动它们前进。

验收：
- `/tasks` 默认四列看板，每列显示数量；`Done` 列默认只显示最近 7 天完成的。
- 新建任务：标题必填；可选 description、priority、dueDate、tags。
- 卡片显示：标题、优先级色条、截止日期（过期显示红色）、标签。
- 卡片上可直接切换状态（下拉或按钮），状态变为 `DONE` 时自动写入 `completedAt`。
- 支持视图切换：`?view=board`（默认）、`list`、`today`、`upcoming`、`inbox`、`completed`。
  - `today`：`dueDate` 是今天或更早，且未完成。
  - `upcoming`：`dueDate` 在未来 7 天内。
- 删除为软删除（`deletedAt`），列表默认过滤。

### US-3 Notes：记录与查找

> 作为使用者，我能用 Markdown 记笔记，用标签组织，用搜索找回。

验收：
- `/notes` 列表按 `updatedAt` 倒序，显示标题、标签、更新时间、内容前 120 字摘要。
- `/notes/[id]` 编辑页：标题输入 + Markdown 编辑区 + 预览切换（编辑 / 预览两个 tab）。
- 自动保存：停止输入 800ms 后保存，顶部显示「保存中… / 已保存 HH:mm」。
- 标签：输入框回车创建/关联，点击标签跳 `/notes?tag=xxx`。
- 搜索：`/notes?q=xxx`，对 `title` 和 `content` 做大小写不敏感的包含匹配（V0 用 `ILIKE`，V5 换语义搜索）。
- 收藏（`isFavorite`）：列表可筛选 `?filter=favorite`。
- 删除为软删除。

### US-4 Planner：安排今天

> 作为使用者，我能把任务放到今天的某个时间段，打开 Dashboard 就看到今天的时间表。

验收：
- `/planner` 默认显示今天，可用左右箭头切换日期，`Today` 按钮回到今天。
- 时间轴 06:00–24:00，按小时分格。
- 右侧「未排期」抽屉列出 `status ∈ {TODO, DOING}` 且 `scheduledFor` 为空的任务。
- 给任务排期：点击时间格 → 选择任务 → 写入 `scheduledFor`（日期）、`scheduledStart`、`scheduledEnd`（默认 1 小时）。
- 已排期任务在时间轴上显示为块，可取消排期。
- 同一时间段允许重叠（V0 不做冲突检测，仅并排显示）。

### US-5 Dashboard：今天

> 作为使用者，我打开首页 3 秒内知道今天要干什么。

验收，页面自上而下：
1. 问候语 + 日期（按本地时间，`Good morning / afternoon / evening`）。
2. 一行统计：`N Tasks Due` · `N Planned` · `N Notes this week`。
3. **Today's Focus**：今天到期或已排期的未完成任务，最多 5 条，可直接勾选完成。
4. **Today's Schedule**：今天已排期任务的时间列表（无数据时显示引导「去 Planner 安排」）。
5. **Recent Notes**：最近编辑的 5 条笔记。
6. **Daily Brief** 区域：V0 显示占位卡片「Coming in V3」，保留版面位置。
7. 右上角 `+ Capture` 按钮（与 `⌘K` 同一入口）。
- 每个区块为空时都要有明确的空状态文案和行动按钮，不允许出现空白区域。

### US-6 Settings：兜底

验收：`/settings` 显示应用版本、各表数据条数、`Export JSON` 按钮（下载全部数据的 JSON 备份）。

## 5. 非功能要求

- **性能**：本地开发下各页面首屏 < 1s；列表接口默认分页 50 条。
- **数据安全**：所有删除为软删除；`Export JSON` 是 V0 唯一的备份手段，必须能用。
- **时区**：数据库统一存 UTC（`timestamptz`）；`scheduledFor`、`dueDate` 这类「日期」语义字段用 `@db.Date` 存本地日期，不做时区换算。
- **可访问性**：所有交互元素可键盘操作；弹窗有 focus trap。
- **响应式**：桌面优先（≥1280px 为主要目标），≥768px 可用即可，手机端 V0 不保证。
- **主题**：支持浅色 / 深色，跟随系统。

## 6. 度量（怎么判断 V0 成功）

| 指标 | 目标 |
| --- | --- |
| 连续使用天数 | ≥ 7 天 |
| 通过 Quick Capture 创建的条目占比 | ≥ 50% |
| 任务完成率（DONE / 非 INBOX） | ≥ 60% |
| 需要打开数据库手工改数据的次数 | 0 |

这些指标 V0 不做埋点，靠 `/settings` 的数据统计人工看。

## 7. 风险

| 风险 | 应对 |
| --- | --- |
| 范围膨胀成 Notion | 严格执行「明确不做」清单；任何新想法写进 `docs/backlog.md`，不进 V0 |
| 数据模型返工 | 数据模型先定稿并预留 V1–V6 字段位（见 03 文档「演进策略」） |
| 做完不用 | 先用真实数据填一周，再做 V1 |
