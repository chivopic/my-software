# Telegram-iOS 源码研究 · Phase 0

已通过平台 Git HTTPS 读取官方仓库，固定研究提交
`f1dd7a2dbd02cbbf513e75d5695d8d36d1cf5838`。
本项目不包含或链接 Telegram 源码、资源、MTProto、Postbox 或其框架。
源码阅读与机制借鉴不意味着复用其实现或许可证。

仓库：[TelegramMessenger/Telegram-iOS](https://github.com/TelegramMessenger/Telegram-iOS/tree/f1dd7a2dbd02cbbf513e75d5695d8d36d1cf5838)。

| 已阅读路径 | 机制与数据流 | 流畅性与复用价值 | 独立实现成本 / 不采用的内容 |
| --- | --- | --- | --- |
| `submodules/AsyncDisplayKit/Source/ASEditableTextNode.mm` | 节点封装系统文本视图，维护编辑与布局边界 | 文本输入生命周期独立于外部 UI 更新 | 中；不引入 AS 节点树，用 UIViewRepresentable 稳定承载 UITextView |
| `submodules/ComponentFlow/Source/Base/Component.swift`、`Source/Host/ComponentHostView.swift` | 值组件、环境、状态与宿主更新 | 对比输入状态，减少无效 update/layout | 低；SwiftUI Observation + 内容相等检查；不重写布局框架 |
| `submodules/ContextUI/Sources/ContextController.swift` | 内容来源、动作、转场、取消和 dismiss 回调拆分 | 交互完成/取消均有状态出口 | 低；系统 contextMenu、swipeActions、系统动画；不做自定义 overlay |
| `submodules/Postbox/Sources/Postbox.swift` | transaction 与 queue 强制串行，UI 订阅独立数据视图 | 稳定事务边界与增量视图更新 | 中；Swift actor + revision 乐观锁，失败明确反馈；不引入消息数据库 |
| `submodules/TelegramUI/Components/RichTextEditor/Sources/RichTextEditorCore/Model/Document.swift` | schemaVersion、块值模型、与 UIKit 分离 | 表示与渲染分离；可做纯 Foundation 测试 | 中；Markdown 保持真源，解析为只读块；不照搬容错丢弃未知块策略 |
| `…/RichTextEditorUIKit/Canvas/DocumentCanvasView+MarkedText.swift` | markedTextRange、composition commit、selection 与 undo 事务 | CJK 组合输入期间不破坏文本和光标；提交时合并 undo | 高；保留系统 UITextView 输入实现，markedTextRange 非空时不格式化或替换 |
| `docs/richtext-composer.md` | rich editor 被 `debugRichText` 控制；native 实验路径与 legacy UITextView 生产回退明确区分；UTF-16 平面位置与结构位置转换 | 避免把实验功能当作生产可靠性；选区与内容的一致性是核心约束 | 高；不用自定义 UITextInput；格式工具采用 UTF-16 NSRange，独立测试 Unicode |
| `docs/chat/corelist-chat-history-backend.md` | CoreList 条目 stableId + stableVersion；删除/插入/更新事务；preserveVisibleContent 锚点；旋转聊天路径与 killswitch | 列表复用、可见锚点、布局与数据分离 | 低；List 使用 UUID identity，元数据更新保留 identity；不采用倒置聊天列表 |

六个指定目录及两份文档都在该提交实际存在。`ComponentFlow/Sources/Component.swift` 不存在，实际路径为 `Source/Base/Component.swift`；没有按猜测路径声称读过代码。

Memento 数据流：系统文本输入 → 本地草稿 → 单一串行保存循环 → Vault actor → 原子 Markdown 写入 → 相应 Note revision 更新 → 列表/搜索快照。
撤销在 UITextView 内部；编辑器不因为列表排序或搜索变化重建。旧保存请求不能覆盖新 revision。
上下文操作遵守系统动效、Reduce Motion 和取消路径。性能收益必须在 Instruments 中量测，不从 Telegram 的机制推断本项目已达目标。
