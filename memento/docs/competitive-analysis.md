# 竞品研究 · Phase 0

研究日期：2026-10-11。当前机器不能运行这些 iOS 产品；官方页面访问均返回代理 403。
下面是产品交互模型的研究假设与设计评估，**不是本次实机观察或已抓取官方资料的结论**。
没有提供或捏造真实产品截图。待 Mac 验收时用当前产品版本复核。

| 产品 / 官方参考 | 核心模型（待界面复核） | 借鉴的三个细节 | 避免的两个问题 | Memento 的独立取舍 |
| --- | --- | --- | --- | --- |
| [Apple Notes](https://support.apple.com/guide/iphone/create-and-format-notes-iph1d2c1b1f/ios) | 文件夹 → 笔记 → 原生编辑 | 单步新建；系统菜单；搜索与大标题 | 把高级操作塞进首页；平台格式绑定 | List + NavigationSplitView；新建直接聚焦；Markdown 文件 |
| [Bear](https://bear.app/faq/) | 写作优先、Markdown 与标签组织 | 舒适行距；键盘旁格式工具；主题适应 | 符号干扰中文写作；过多主题设置 | 正文动态字体；选择区格式操作；系统/浅/深三种主题 |
| [Craft](https://www.craft.do/) | 结构化文档与内容块 | 清晰层级；媒体预览；上下文操作 | 每段都有操作把手；移动端多层菜单 | 标准 Markdown 块的只读解析模型；原生编辑；详情页预览 |
| [Obsidian](https://help.obsidian.md/Files+and+folders/How+Obsidian+stores+data) | 本地 Markdown vault、链接网络 | 可迁移文本；双向链接；附件分离 | 插件成为基础功能前提；移动端配置复杂 | 无第三方依赖；可重建索引；内建 [[链接]] 与反向链接 |
| [Notion](https://www.notion.com/help/writing-and-editing-basics) | 页面与块、命令和模板 | 清晰分组；内容复用；关联导航 | 首次启动要求账号；桌面信息密度 | 本地离线即用；原生分享捕获；高级功能在更多菜单 |

来源状态：2026-10-11 实际请求了上述五个链接，全部不可达。不能据此宣称当前版本具体手势或动画已验证。
以上取舍的验收对象是 Memento 自身；以实际模拟器、VoiceOver、中文输入和导出结果评价。
