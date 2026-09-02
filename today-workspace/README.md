# Today Workspace

一个克制、本地优先、手机端优先的个人工作台。当前同时面向 Web/PWA 与 Android 原生壳：同一套前端通过 Vite 构建，Web 部署到 Vercel，Android 使用 Capacitor 打包。

线上地址：<https://today-workspace.vercel.app>

## 当前功能

- `今天 / 记录 / 任务` 三入口底部导航
- 快速记录：普通文本保存为记录，`/task ...` 保存为任务
- 记录搜索、编辑和删除
- 任务创建、完成、删除和筛选
- IndexedDB 本地持久化
- Notes / Tasks 同步就绪数据模型：`userId / deviceId / version / deletedAt / syncStatus`
- 本地 `outbox` 变更队列，为后续 push / pull 云同步准备
- 删除采用 tombstone 软删除，UI 立即隐藏但保留跨设备删除语义
- JSON 数据导出 / 导入；备份 v2 保留同步元数据，并兼容旧 v1 备份
- Vite PWA 构建与 Workbox 离线缓存
- 深色模式
- 192×192 / 512×512 PNG 安装图标
- Lucide 通用图标子集已内置，不依赖第三方运行时 CDN
- Capacitor Android 配置，应用 ID 为 `io.chivopic.today`
- GitHub Actions 自动构建 Android debug APK

## 工程结构

```text
index.html        页面结构
main.js           Vite 入口
app.js            当前业务逻辑、IndexedDB 数据层和本地同步队列
icons.js          本地图标运行时
styles.css        样式
public/           PWA / Android 共用静态图标
vite.config.js    Web/PWA 构建配置
capacitor.config.json
```

## 本地开发

Capacitor 8 要求 Node.js 22 或更高版本。

```bash
cd today-workspace
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

构建产物位于 `dist/`，Vercel 和 Capacitor 都使用这份 Web bundle。

## Android

首次在本地创建 Android 工程：

```bash
npm install
npm run build
npm run android:add
```

后续同步 Web 代码：

```bash
npm run android:sync
```

使用 Android Studio 打开：

```bash
npm run android:open
```

仓库的 `Today Workspace Android` GitHub Actions 工作流会在相关 PR 和 `main` 更新时构建 debug APK，并上传 `today-workspace-debug-apk` artifact。CI 当前使用 Node 22、JDK 21 和 Android SDK 36。正式发布版后续会加入稳定的原生工程、签名密钥管理和 AAB 构建。

## 部署

Vercel 项目 Root Directory：

```text
today-workspace
```

Vite 默认输出 `dist/`，Vercel 会自动识别并部署。

## 数据策略

Today Workspace 保持 local-first：记录和任务首先写入当前设备的 IndexedDB，不等待网络。数据库继续沿用旧 key `test1-workspace`，避免升级后看不到已有本地数据。

IndexedDB schema 当前为 v2，包含三个 object store：

```text
notes
  id / text / createdAt / updatedAt
  userId / deviceId / version / deletedAt / syncStatus

tasks
  id / text / done / createdAt / updatedAt
  userId / deviceId / version / deletedAt / syncStatus

outbox
  id / store / entityId / operation / record / deviceId / queuedAt
```

每次新建、编辑、完成任务或删除时，实体更新和 outbox 入队在同一个 IndexedDB transaction 中完成。这样即使应用在操作中途退出，也不会出现“本地内容已经变了，但同步队列没有记录”的状态。

删除不再直接物理移除，而是写入 `deletedAt`。普通 UI 会过滤 tombstone；未来同步层则可以把删除传播到其他设备。

从 schema v1 升级时，已有 Notes / Tasks 会原地补齐同步字段，并进入 outbox，不更换数据库 key。设置里的 JSON 备份已经升级到 v2，同时仍可导入旧 v1 备份；导入会按 `updatedAt`，时间相同时再按 `version` 合并，不先清空当前数据库。

当前 outbox 只负责可靠记录本地变更，还没有把数据发送到服务器，因此产品仍然可以完全离线使用。

## 下一阶段

1. 定义云端 Notes / Tasks schema、账号身份和 RLS 权限边界
2. 实现 outbox push：把本地 pending 变更可靠上传并确认
3. 实现增量 pull：按 cursor 拉取其他设备的变更和删除 tombstone
4. 加入冲突策略、同步状态和失败重试
5. 再增加任务日期、通知、系统分享入口等原生能力
6. 配置正式 Android 签名并输出 release APK / AAB
