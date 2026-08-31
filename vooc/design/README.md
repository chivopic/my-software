# VOOC 设计预览工作区

这是 VOOC macOS 笔记软件的独立概念设计工作区。可运行的 Swift + AppKit 实现位于 [`../macos`](../macos/)。

## 内容

- [`design-spec.md`](./design-spec.md)：产品定位、信息架构、交互、视觉系统与 AppKit 落地建议。
- [`previews/01-main-window.svg`](./previews/01-main-window.svg)：三栏主窗口与 Markdown 编辑场景。
- [`previews/02-quick-open.svg`](./previews/02-quick-open.svg)：快速打开与全局检索场景。
- [`previews/03-brand-board.svg`](./previews/03-brand-board.svg)：图标、Logo 与品牌色板。

## 预览顺序

1. 先看品牌板确认整体气质与图标方向。
2. 再看主窗口确认信息密度、三栏布局与暖米色主题。
3. 最后看快速打开，确认键盘优先的交互语言。

设计方向已经进入实现阶段；在 Mac 上用 Xcode 打开 `vooc/macos/Package.swift` 即可运行原生应用。
