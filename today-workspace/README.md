# Today Workspace

一个克制、本地优先、手机端优先的个人工作台。当前同时面向 Web/PWA 与 Android 原生壳：同一套前端通过 Vite 构建，Web 部署到 Vercel，Android 使用 Capacitor 打包。

线上地址：<https://today-workspace.vercel.app>

## 当前功能

- `今天 / 记录 / 任务` 三入口底部导航
- 快速记录：普通文本保存为记录，`/task ...` 保存为任务
- 记录搜索、编辑和删除
- 任务创建、完成、删除和筛选
- IndexedDB 本地持久化
- JSON 数据导出 / 导入；导入按 `updatedAt` 安全合并，不先清空现有数据
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
app.js            当前业务逻辑和 IndexedDB 数据层
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

仓库的 `Today Workspace Android` GitHub Actions 工作流会在相关 PR 和 `main` 更新时构建 debug APK，并上传 `today-workspace-debug-apk` artifact。正式发布版后续会加入稳定的原生工程、签名密钥管理和 AAB 构建。

## 部署

Vercel 项目 Root Directory：

```text
today-workspace
```

Vite 默认输出 `dist/`，Vercel 会自动识别并部署。

## 数据策略

当前仍然是 local-first：记录和任务首先保存在当前设备的 IndexedDB 中。数据库仍沿用旧 key `test1-workspace`，这是有意保留的兼容策略，避免现有用户升级后看不到原来的本地数据。

设置里的“导出 JSON”可以生成完整本地备份；“导入 JSON”按 `id + updatedAt` 合并，不会先清空当前数据库。

下一阶段会在不破坏本地优先体验的前提下增加账号和同步层：本地写入即时完成，联网后再把变更同步到云端。删除也会从物理删除升级为可同步的软删除语义。

## 下一阶段

1. 固化 Android 原生工程并完成真机 debug APK 验证
2. 升级 Notes / Tasks 数据模型，为同步加入 `userId / deviceId / version / deletedAt`
3. 接入账号系统和云端数据库
4. 实现 local-first push / pull 同步与冲突策略
5. 增加任务日期、通知、分享入口等原生能力
6. 配置正式 Android 签名并输出 release APK / AAB
