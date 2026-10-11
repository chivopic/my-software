# Memento

本地优先的 iPhone / iPad 原生笔记工程。SwiftUI 管导航与组织，UIKit `UITextView` / TextKit 2 管文本输入，纯 Foundation 核心管文件、搜索与保存状态机。没有服务端或第三方 Swift 依赖。

Phase 0–4 的已选功能代码均在此目录；这不等于已经通过 iPhone 验收。当前云机器是 Linux，不能运行 Xcode、iOS SDK、Instruments 或模拟器。实际结果和未执行项见 [validation.md](docs/validation.md)。

## 已实现

- Notes 首页、搜索高亮与最近搜索、稳定 UUID 列表、侧滑和系统上下文菜单。
- 标题与 Markdown 正文、450 ms 自动保存、后台/返回时 flush、失败重试与冲突恢复副本。
- H1/H2/H3、粗体/斜体、列表/编号、清单、引用、代码、链接、表格工具；系统撤销/重做和键盘附件栏。
- 结构化 Markdown 预览：可操作清单、标题折叠、表格、图片；不自定义 `UITextInput`。
- 嵌套文件夹、标签、置顶、归档、最近删除、恢复、经确认的永久删除。
- `.md` 导入/导出与包含所有有效笔记、文件夹、附件的 `.memento` 完整备份；导入是增量复制，不覆盖现有笔记。
- Wiki links / backlinks、图片与文件附件、原生分享扩展、WidgetKit、App Intents、设备认证锁、iPad 多栏。
- 系统/浅/深主题、动态字体与字号倍率、语义色、原生控件与无障碍标签。

Phase 4 按原始需求的“根据优先级选择”选择上述离线功能。iCloud、Pencil 手写识别和 AI 未实现，也没有假开关；详细理由见 [architecture.md](docs/architecture.md)。

## 在 Mac 上运行

要求 macOS、Xcode 16+、Swift 6 工具链、iOS 17+ 模拟器。工程 App 适配层使用 Swift 5 语言模式兼容 UIKit delegate；核心包使用 Swift 6 的严格并发检查。

```bash
cd memento
open Memento.xcodeproj
```

选择 `Memento` scheme 和 iPhone 模拟器，按 `⌘R`。真机/扩展签名需要在三个产品 target 的 Signing & Capabilities 中选择你的 Team。默认 bundle IDs 为 `com.chivopic.memento`、`.share`、`.widget`，App Group 为 `group.com.chivopic.memento`。若这些 IDs 未属于你的开发者账号，统一更改：

1. `scripts/generate-project.py` 的三个 bundle IDs；
2. `Resources/Memento.entitlements` 的 App Group；
3. `Core/Storage/Capture.swift` 的 `SharedContainer.groupID`；
4. `Resources/App-Info.plist` 和 `ExportDocuments.swift` 的 backup UTI（若改产品命名）。

重新生成工程：`python3 scripts/generate-project.py`。不需要 XcodeGen 或 CocoaPods。App Group 不可用时明确报错，不降级到扩展无法读取的另一套数据库。

## 验证命令

```bash
bash scripts/test-core.sh
python3 scripts/generate-project.py --check
bash scripts/test-ios.sh
```

`test-core.sh` 可在 Linux/macOS 执行；Swift 不在 PATH 时可设 `MEMENTO_SWIFT_BIN=/path/to/swift`。此云机器默认发现 `/workspace/toolchains/swift-6.2.1-RELEASE-ubuntu22.04/usr/bin/swift`。
`test-ios.sh` 自动选可用 iPhone 模拟器，也支持 `MEMENTO_SIMULATOR_ID` 指定设备；`.xcresult` 包含真实运行截图。脚本在 Linux 会明确失败，不能把 parse 通过当作 iOS 编译通过。

CI 配置为仓库根目录 `.github/workflows/memento.yml`，只有本工程的变更触发 macOS 测试。本次没有推送或触发远端 CI。

## 数据与恢复

App Group 中 `vault/notes/<UUID>.md` 是真源，正文为 Markdown，front matter 是合法 YAML 内的 JSON 元数据。`folders.json` 保存文件夹，附件在 `vault/attachments/`。
扩展和快捷指令只发布 `inbox/<UUID>/capture.json`，App 摄取后用同一 UUID 防重；Widget 只读受隐私标记控制的快照。

保存以 revision 乐观锁避免旧请求覆盖新内容；原子写失败会显示“未保存”，草稿仍可重试或复制。退出/进入后台会立即 flush；强制杀进程之前尚未确认保存的最后几百毫秒不保证落盘，不会显示成“已保存”。
失败草稿跨页面保留在内存，重新打开同一笔记可继续重试；进程被终止时仍未写入成功的内容不具备持久化保证。不会把一次磁盘写入失败标为已保存。
损坏的原文件保留并列出警告；存在无法读取的文件时阻止“完整备份”，以免把遗漏数据的备份称作完整。单独导入 `.md` 无法自动取得同目录的附件；含附件的迁移请使用完整备份。备份恢复预先校验全部输入；磁盘写入中断可能留下部分已导入副本，UI 会提示检查后重试，不覆盖原笔记。

设备认证锁是前台隐私屏障，配合 iOS 文件数据保护；不是额外加密整个 vault 的实现。开启时 Widget 不展示笔记，分享和快捷指令拒绝捕获。Markdown/备份为明文，导出由已解锁的 App 发起。

设计、研究、架构、各阶段验收和发布门槛位于 [docs](docs/implementation-plan.md)。
