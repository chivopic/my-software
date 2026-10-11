# 架构、优先级与信息架构

## 决策

- 最低 iOS 17 / iPadOS 17；Xcode 16+、Swift 6。使用 Observation、SwiftUI、UITextView TextKit 2。较新 OS 的导航材质由原生系统控件提供；无需调用新 SDK 专属 Liquid Glass API。
- 无服务端、无外部 Swift 依赖。核心是可在 Linux 测试的 Foundation Swift Package；iOS app、share extension、widget 引用同一包。
- 一个带 UUID 与 JSON-as-YAML front matter 的 `.md` 文件是一条笔记的唯一真源。正文保持 Markdown；标准编辑器能打开。front matter 保存 revision、标签、folderID、归档/删除时间与附件元数据。索引可从文件重建，不依赖数据库恢复正文。
- Vault actor 串行化写入，原子 replace + expectedRevision 防止过期写入。UI 只显示确认写入后的“已保存”；失败保留草稿，提供重试和冲突副本。
- 分离附件，路径只由 UUID 和受控后缀生成。删除为软删除；永久清理必须确认；恢复保留 ID。
- 多级文件夹保存为可验证的 catalog，禁止循环。文件夹删除把相关笔记移至上层；标签是值集合。
- share extension / App Intents 只写独立 inbox capture 文件，app 单一 writer 摄取并用 capture UUID 去重。widget 只读取 app 写出的脱敏受控快照。启用锁定时不发布正文给 widget，锁定 app 不摄取 inbox，share extension 拒绝在锁定开启时捕获。
- 编辑器稳定持有 UITextView，主题/字号变化不替换 text；组合输入期间不重写、不过滤；格式按钮调用系统 replace 保留 undo；选择和偏移用 UTF-16。
- Document Model 为可测试的 Markdown 块解析（段落、标题、清单、代码、引用、表格、媒体）。它驱动预览，不成为第二真源。没有测量证明 UITextView 不足，故不升级自定义 UITextInput。

## 信息架构与视觉

NavigationSplitView：组织侧栏 → Notes 列表 → 编辑详情。iPhone 自然折叠为系统导航；iPad 保持多栏。
侧栏有 All Notes、Pinned、Recently Edited、Archive、Recently Deleted、嵌套文件夹、标签、Settings。
首页 List + 大标题 + 搜索 + 底部新建；行最多两行摘要，时间、置顶与可选附件缩略图；长按和侧滑执行真实操作。
编辑页标题、正文、原生更多菜单、键盘工具栏、可切换预览和链接/附件详情；搜索有命中高亮、最近搜索和清空。
设置有系统/浅/深、字体倍率、拼写偏好、存储统计、完整 vault 备份/导入、隐私与关于、设备认证锁。
语义系统色、动态字体、8/16/24 间距；正文不采用玻璃卡片。动画只用于交互反馈，遵循 Reduce Motion；UIKit 背景为系统色，尊重 Increase Contrast / Reduce Transparency。

## 各 phase

| 阶段 | 交付内容 | 验证 |
| --- | --- | --- |
| 0 | 本目录竞品分析、源码研究、架构、计划 | 明确来源与假设、固定源码 SHA |
| 1 | iOS 工程、原子 vault、列表/编辑/自动保存/恢复/搜索/主题 | Swift 核心重启测试；Mac app/模拟器验收 |
| 2 | Markdown 工具、清单、撤销重做、键盘附件栏、解析预览、稳定输入 | UTF-16 与格式测试；IME/键盘 UI 验收 |
| 3 | 嵌套文件夹、标签、置顶归档、导入/完整导出、搜索历史 | 循环/过滤/迁移/备份完整性测试 |
| 4 | [[链接]]/backlinks、附件、share extension、widget、App Intents、设备认证锁、iPad 多栏 | 核心链接/附件/inbox 测试；Apple 平台扩展集成验收 |

Phase 4 原文要求“根据优先级选择”。本轮选择上述离线能力。iCloud（跨设备冲突/entitlements）、Apple Pencil 手写识别、AI（供应商/隐私/成本）明确排除，不显示假开关、不宣称已接入；未来独立 ADR 后实施。

设备认证锁是前台隐私屏障，**不是独立端到端加密产品**。文件采用 iOS 数据保护；备份是明文可迁移格式，导出由已解锁 app 发起。多窗口编辑 revision 冲突会显示恢复操作，不静默覆盖。
