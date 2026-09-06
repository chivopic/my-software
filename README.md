# my-software

个人软件项目的孵化与存放处。这里主要保留仍处于同一集合仓库中开发的项目；成熟并进入长期维护阶段的项目可以迁移为独立仓库。

## 项目

| 项目 | 是什么 | 技术栈 | 状态 |
| --- | --- | --- | --- |
| [`personal-workbench/`](./personal-workbench) | 笔记 / 任务 / 计划的个人工作台网页应用 | Next.js + TypeScript + Prisma/PostgreSQL | 使用中（V0，部署在 Vercel） |
| [`vooc/`](./vooc) | 本地优先的 macOS 原生 Markdown 笔记应用 | Swift + AppKit（`vooc/macos`），另有独立概念设计（`vooc/design`） | 原型阶段 |
| [`Today Workspace`](https://github.com/chivopic/today-workspace) | 手机端优先、本地优先的快速记录 / 任务工作台 | Vite + JavaScript + IndexedDB + Supabase + Capacitor | 已独立维护 |

## 已独立项目

### Today Workspace

`today-workspace/` 已于 2026-09-06 从本仓库迁移到独立仓库：

<https://github.com/chivopic/today-workspace>

新功能、Issue、PR、Release 和 Android CI/CD 都在独立仓库继续维护。本仓库的 Git 历史仍保留迁移前的 Today Workspace 开发记录，但 `main` 不再保存第二份源码，避免两个仓库产生版本分叉。

## 加新项目时怎么做

1. **新建一个顶层目录**，目录名用项目名（kebab-case），比如 `some-new-app/`。目录内部结构完全由项目自己决定，不需要跟其他项目保持一致（不同项目的技术栈、语言都可能不一样）。
2. **目录里必须有自己的 `README.md`**，至少说清楚：这是什么、本地怎么跑、怎么部署/发布。项目自己的依赖锁文件、`.gitignore`、CI 配置也都放在项目目录内部，不要往仓库根目录堆。
3. **回到这份根 README，在上面的表格里加一行**。
4. **分支命名带上项目名前缀**，例如 `personal-workbench/xxx`、`vooc/xxx`，不要在别的项目的分支上顺手开发新项目。功能做完合并回 `main` 后，记得删掉这个分支。
5. 如果项目要接 CI（GitHub Actions），workflow 里用 `paths:` 过滤器把触发范围限制在自己的目录，避免一个项目的改动跑另一个项目的构建。
6. 当项目已经拥有独立产品定位、部署、版本、CI/Release 流程并准备长期维护时，可以像 Today Workspace 一样迁移为独立仓库。

## 分支约定

- `main` 是唯一的主干，各项目的改动都合并回这里，不设常驻的项目专属长期分支。
- 短期开发分支用完即删；已经合并或废弃的分支不要长期留着。

## 部署

仓库内项目各自部署、互不影响。例如 `personal-workbench/` 部署到 Vercel 时，Vercel 项目的 **Root Directory** 设为 `personal-workbench`。已经迁出的独立项目以各自仓库的部署文档为准。
