# 实施与验收计划

先研究 → Foundation 模型与存储 → 数据可靠性测试 → 文本选区工具 → 原生 UI → 扩展 → 完整验收。
每个模块有独立职责，不复用仓库内 Web 或 macOS 产品；工程位于 `memento/`。

1. Phase 0 固定 Telegram 源码、列出无法访问的竞品来源，建立架构与验收矩阵。
2. Phase 1 实现 Note/Folder、Markdown 编解码、原子存储、revision 校验、损坏文件报告、软删除恢复；先测重启与并发，再接 Observation UI。
3. Phase 2 格式操作使用 UTF-16；组合输入不做改写；保留 UIKit 撤销系统；预览来自结构化 Markdown 模型。
4. Phase 3 添加嵌套组织、搜索排名/高亮/历史、导入导出、完整附件备份；测试包含汉字、emoji、恶意路径、重复 ID、循环与陈旧 revision。
5. Phase 4 实现独立 inbox、锁定快照、系统 share/widget/intent、链接与附件。扩展不绕开 app 单 writer 和隐私边界。
6. 在本机运行 Swift 核心测试与基准、Swift parse、项目结构验证。Mac 用真实 xcodebuild/simulator，手工截图/VoiceOver/IME 验收；不能把 Linux 通过当作 iOS 通过。

完成条件：所有已选阶段的功能代码与工程存在、可执行自动验证有真实结果、未能执行的 Apple SDK 检查明确记录。商业发布门槛还包括真机保存、前后台中断、系统数据保护、签名 provisioning、扩展与 UI 性能测量；不以功能代码提交代替发布验收。
