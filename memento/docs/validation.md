# 验证记录与 Apple 平台验收

本记录区分已执行、未执行和工程目标。当前环境：Debian 13 / x86_64，官方 Swift Linux 工具链；没有 Xcode、iOS SDK、模拟器或 Instruments。

## 真实执行

2026-10-11 最终执行 `bash scripts/test-core.sh --scratch-path .build/verified-final`：
Swift 6.2.1、27 项 XCTest、0 失败、无跳过、无编译警告，总测试时间约 0.523 秒。
覆盖 4 项保存状态机、13 项 Markdown/Unicode/搜索、10 项 vault/恢复/并发/附件/分享/隐私检查。
完整命令输出留在本机被忽略的 `test-results/core-tests.txt`。
日志末尾 Swift Testing 的“0 tests”是另一个未使用的 runner；有效结果来自上方 XCTest 的明确 27 项计数，不把零测试计作通过。
新增保存状态机测试后发现官方 Ubuntu Swift 6.2、6.2.1、6.1.2 的 `libswiftObservation.so` 引用了未导出的 `swift::threading::fatal`，在此机器链接失败。
未添加空实现、关闭链接检查或跳过断言。Observation 已限制在 iOS `EditorSession` 适配层；核心 `NoteDraft` 保持纯 Foundation，相同状态机由测试与 UI 共用。

- 工程生成器可重复运行，95 个 Xcode 对象、21 个输入文件、4 个 target 与本地包引用结构有效。
- 独立 OpenStep parser 2.0.3 实际解析了生成的 `project.pbxproj`。
- scheme XML、资源 JSON、Info.plist、App Group entitlement、PrivacyInfo 清单解析通过；脚本语法和 `git diff --check` 通过。
- Swift frontend parse 通过 App、Features、DesignSystem、Share、Widget 和 UI test 源文件。**仅语法解析，不是 iOS 类型检查或编译成功。**

## Phase 验收矩阵

| 阶段 | 代码状态 | 本机可验证能力 | Apple 平台待验证 |
| --- | --- | --- | --- |
| 0 | 研究/架构/计划已写入 | Telegram 实际 SHA/文件、明确竞品访问受限 | 真实竞品界面复核 |
| 1 | 工程与 MVP 路径已实现 | 原子存储、重启、版本冲突、恢复、搜索 | App 构建、首次启动、返回/后台/杀进程、主题、所有按钮 |
| 2 | UITextView、格式/undo/工具栏/预览已实现 | UTF-16、格式切换、结构化块、保存状态机 | 中文拼音/日文组合输入、undo/redo、选择拖拽、硬件键盘、TextKit 2 光标/滚动 |
| 3 | 文件夹/标签/置顶归档/导入导出已实现 | 文件夹循环、备份、附件、路径约束、筛选 | 文件选择器、跨应用 Markdown 导出、完整 vault 包的 Files/iCloud Drive 传输 |
| 4 | 已选离线能力代码已实现 | 链接、分享 inbox、防重、隐私快照 | App Group 签名、真实分享、Widget、Shortcuts、Face ID、iPad 导航 |

## Mac / 模拟器清单

先运行 `bash scripts/test-ios.sh`，保留 `.xcresult`。UI tests 覆盖新建、正文、等待真实保存、预览、终止重启、删除撤销、组织和设置；截图是执行时产生的 XCTest attachments，此处没有伪造截图。

手工覆盖：

1. 首页/搜索/编辑/组织/设置：浅深两种模式、Small/Large iPhone、iPad 横竖屏、最大 Dynamic Type、VoiceOver。
2. 中文拼音连续输入及候选词选择：组合态不能因格式/主题/保存而截断；emoji、混合中英文、文本选择、系统粘贴、系统 undo/redo。
3. 打开/关闭键盘、交互式收起、旋转、安全区、硬件键盘工具；长文（100 KB / 1 MB）不丢光标、滚动位置或正文。
4. 创建 → 等待“Saved on device” → 退出/重启；后台立即 flush；设备存储不足时保留草稿并重试；冲突副本保留附件。
5. 三层文件夹移动/删除、标签、置顶、归档、删除撤销、永久删除确认；各状态空页与搜索结果一致。
6. 导出 `.md` 用独立 Markdown 编辑器打开；带图片的完整 backup 导出到 Files，导入到干净 app，再检查附件字节/链接/文件夹和 trash。损坏 backup 先拒绝，原数据完整。
7. Safari URL、中文文字、Photos 图片、Files PDF → Share extension；重新打开 App 仅摄取一次；捕获失败留错误，不能假显示成功。
8. Widget 打开指定 note/new note；锁定时绝不暴露标题；Face ID 成功/取消/不可用/passcode；后台快照；快捷指令锁定时明确失败。
9. iPad Sidebar/List/Editor 三栏和 iPhone 紧凑列返回路径；从 Widget/Shortcuts 进入时等待认证和库加载。

## 性能测量

启动 <1 秒、打开 <200 ms、无明显输入掉帧是目标，未测就不称达成。
需要在 Release 真机上用 Instruments 的 App Launch、Time Profiler、Animation Hitches、Allocations、Leaks 测 cold/warm launch、10k notes 滚动、100 KB/1 MB 输入、搜索、反复进入退出编辑器、前后台保存；注明设备/OS/构建/样本数。
Linux 搜索基准仅说明本机 CPU/测试数据的表现，不能推断 iPhone FPS 或耗电。
本次 Debug 构建的 10k 短笔记搜索，10 次测量平均约 0.036 秒；测试包含命中条数断言。未测量 cold/warm launch、FPS、输入延迟、真机内存或耗电。

## 发布前门槛

Apple SDK 编译与上述 UI/扩展验收仍未执行，因此不能称所有 phase 已验收或可上架。
需要在 Mac 上选择 Team / App Group、执行脚本、检查实际截图和性能。CI 已准备但本次未推送，未运行远端 action，未生成已签名 IPA 或 App Store 上传。
