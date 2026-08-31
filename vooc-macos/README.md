# VOOC

VOOC 是一款使用 Swift 与 AppKit 构建的本地优先 macOS Markdown 笔记软件。

## 当前功能

- 打开本地文件夹作为 Vault
- 递归发现 `.md` 文件并按修改时间排序
- 按标题、路径与正文搜索
- 创建、选择、编辑与自动保存 Markdown 笔记
- 原生三栏 AppKit 界面、菜单和键盘快捷键
- 暖米色视觉主题

## 在 Mac 上运行

要求 macOS 14+ 与 Xcode 16+。

```bash
cd vooc-macos
open Package.swift
```

在 Xcode 中选择 `VOOC` scheme，然后按 `⌘R`。也可以直接运行：

```bash
swift run VOOC
```

首次启动后，使用欢迎页或 `File → Open Vault…` 选择包含 Markdown 文件的文件夹。`⌘N` 新建笔记，`⌘F` 聚焦搜索。

> Swift Package 用于保持工程文件简洁并可版本管理；Xcode 打开 `Package.swift` 后会生成原生 macOS 可执行 scheme。
