# Today Workspace

一个克制、本地优先、手机端优先的个人工作台 PWA。第一版只解决三件事：快速记录、查看今天、完成任务。

线上地址：<https://today-workspace.vercel.app>

## 当前功能

- `今天 / 记录 / 任务` 三入口底部导航
- 快速记录：普通文本保存为记录，`/task ...` 保存为任务
- 记录搜索、编辑和删除
- 任务创建、完成、删除和筛选
- IndexedDB 本地持久化
- JSON 数据导出 / 导入；导入按 `updatedAt` 安全合并，不先清空现有数据
- Service Worker 应用壳离线缓存
- 深色模式
- PWA manifest，可作为独立应用打开
- 192×192 / 512×512 PNG 安装图标，并保留 SVG 图标
- Lucide 通用图标子集已内置到仓库，运行时不依赖第三方 CDN

## 设计原则

- 移动端优先，但不主动放大控件和留白
- 辅助入口、设置、删除、筛选等不抢视觉中心
- 主要依靠位置、分组、细边框、字体层级和轻状态变化表达层级
- 不使用营销页式 Hero、装饰渐变、强阴影、厚边框或大面积重色块
- 先保证高频动作路径短，再增加低频能力

## 本地运行

这是零构建依赖的静态项目。Service Worker 不能正确工作在 `file://` 协议下，所以请用任意静态服务器启动：

```bash
cd today-workspace
python -m http.server 4173
```

然后打开：

```text
http://localhost:4173
```

## 部署

当前生产环境部署在 Vercel：<https://today-workspace.vercel.app>

也可以部署到 Netlify、Cloudflare Pages、GitHub Pages 或任意静态托管。

如果使用 Vercel，项目 Root Directory 设置为：

```text
today-workspace
```

## 数据策略

V0 不要求账号，也不引入云同步。记录和任务保存在当前浏览器的 IndexedDB 中。

设置里的“导出 JSON”可以生成完整本地备份；“导入 JSON”不会先清空当前数据库。同 ID 数据只在备份版本 `updatedAt` 更新时覆盖，不同 ID 直接合并，因此把较旧备份导回手机时不会覆盖更新的本地内容。

这是刻意的产品取舍：竞品真实问题集中在跨端同步、离线、移动端键盘与复杂状态一致性。第一版先把本地体验做稳，再定义同步冲突语义。

## 下一阶段

1. 为任务增加可选日期，而不是直接引入复杂项目管理
2. 增加轻量 Inbox / 归档能力
3. 做真实移动端安装、输入法、长文本和离线恢复测试
4. 再评估 Android 原生壳 / APK
5. 最后再设计账号和跨端同步
