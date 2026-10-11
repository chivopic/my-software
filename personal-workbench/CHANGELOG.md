# Changelog

版本与发布流程见 [发布说明](../docs/releasing.md)。日期为该项目的发布日。

## [0.1.0] — 2026-08-30

V0：把「记录 → 任务 → 计划 → 完成」的闭环跑通。可以每天真实使用了。

### 新增

- **Dashboard**：问候语、四格统计、Today's Focus（可直接勾完成）、今日时间表、
  最近笔记，以及 Daily Brief 的占位版面
- **Notes**：Markdown 编辑与预览、800ms 防抖自动保存、标签、全文搜索、收藏、
  软删除可撤销
- **Tasks**：Inbox / Todo / Doing / Done 四列看板，外加全部、Inbox、今天、
  近 7 天、已完成五个列表视图；优先级、截止日期、标签、逾期标记
- **Planner**：单日时间轴 06:00–24:00，把任务排到具体时段，未排期抽屉
- **Quick Capture**：任意页面 `⌘K`，一行输入存成任务或笔记
- **Settings**：数据统计与全量 JSON 导出（当前唯一的备份手段）
- **ActivityLog**：后台记录创建、完成、排期、删除等八类事件，只写不读，
  为 V2 的统计与复盘攒原始数据
- 深浅色主题（跟随系统 / 浅色 / 深色），首屏无闪白
- 全站键盘可达，弹窗焦点受限，Esc 关闭

### 技术

- Next.js 16（App Router）+ React 19 + TypeScript 5.9 + Tailwind CSS 4
- Prisma 7 + PostgreSQL 16，driver adapter 连接
- 数据访问分层：`lib/queries`（读）/ `lib/mutations`（写）/ `lib/validation`（zod），
  页面与组件中不出现 `prisma.`
- 筛选、视图、日期、搜索词全部放在 URL 里，因此不需要状态管理库
- 12 个运行时依赖，没有组件库、数据请求库或拖拽库
- 46 条单元测试覆盖时区换算、夏令时、跨年跨月边界、任务视图的 where 构造

### 已知问题

- 撤销删除会让条目跳到列表顶部：软删除与恢复都会更新 `updatedAt`，而列表按它倒序
- 看板不支持拖拽，改状态走卡片上的下拉（V0 明确不做拖拽）
- 开发模式下访问 404 页面时 React 会警告 `Encountered a script tag`，
  来自主题脚本，生产构建无此警告

### 尚未包含

Projects 管理界面、周视图与 Goals、Daily Review 与统计、Daily Brief 信息流、
AI 能力和语义搜索尚未实现。未发布的想法见 [backlog](docs/backlog.md)。
