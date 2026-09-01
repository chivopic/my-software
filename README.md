# my-software

个人软件项目的存放处。一个仓库，多个互相独立的项目，每个项目一个顶层目录。

## 项目

| 目录 | 是什么 | 技术栈 | 状态 |
| --- | --- | --- | --- |
| [`personal-workbench/`](./personal-workbench) | 笔记 / 任务 / 计划的个人工作台网页应用 | Next.js + TypeScript + Prisma/PostgreSQL | 使用中（V0，部署在 Vercel） |
| [`vooc/`](./vooc) | 本地优先的 macOS 原生 Markdown 笔记应用 | Swift + AppKit（`vooc/macos`），另有独立概念设计（`vooc/design`） | 原型阶段 |
| [`today-workspace/`](./today-workspace) | 手机端优先、本地优先的快速记录 / 任务 PWA | HTML + CSS + JavaScript + IndexedDB | MVP 开发中 |

每个目录内部有自己的 `README.md`，写清楚这个项目是什么、怎么跑起来、怎么部署——具体内容以那份 README 为准，这份根 README 只做索引。

## 加新项目时怎么做

1. **新建一个顶层目录**，目录名用项目名（kebab-case），比如 `some-new-app/`。目录内部结构完全由项目自己决定，不需要跟其他项目保持一致（不同项目的技术栈、语言都可能不一样）。
2. **目录里必须有自己的 `README.md`**，至少说清楚：这是什么、本地怎么跑、怎么部署/发布。项目自己的依赖锁文件、`.gitignore`、CI 配置也都放在项目目录内部，不要往仓库根目录堆。
3. **回到这份根 README，在上面的表格里加一行**。
4. **分支命名带上项目名前缀**，例如 `personal-workbench/xxx`、`vooc/xxx`，不要在别的项目的分支上顺手开发新项目（VOOC 最早就是这么和 Workbench 的开发分支缠在一起的）。功能做完合并回 `main` 后，记得删掉这个分支。
5. 如果项目要接 CI（GitHub Actions），workflow 里用 `paths:` 过滤器把触发范围限制在自己的目录，避免一个项目的改动跑另一个项目的构建。

## 分支约定

- `main` 是唯一的主干，各项目的改动都合并回这里，不设常驻的项目专属长期分支。
- 短期开发分支用完即删；已经合并或废弃的分支不要长期留着，免得像之前那样看不清哪些内容真正进了 `main`。

## 部署

各项目各自部署、互不影响。以 `personal-workbench/` 部署到 Vercel 为例：Vercel 项目的 **Root Directory** 要设成对应的子目录（比如 `personal-workbench`），因为仓库根目录不再是任何单个项目的根了。具体步骤见各项目自己的部署文档。
