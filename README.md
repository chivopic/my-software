# my-software

A home for early-stage personal software projects, with each project in its own directory and documented independently.

## Projects

| Project | Description | Status |
| --- | --- | --- |
| [`personal-workbench/`](./personal-workbench) | A web app for personal notes, tasks, and planning. | In use; deployed on Vercel. |
| [`vooc/`](./vooc) | A local-first Markdown notes app for macOS. | Prototype. |
| [`memento/`](./memento) | A local-first native notes app for iPhone and iPad, with Markdown, attachments, and system integrations. | Implementation in progress; Apple-platform validation remains. |
| [Today Workspace](https://github.com/chivopic/today-workspace) | A mobile-first workspace for quick capture and tasks. | Maintained in its own repository. |

Each project has its own README with setup and development instructions. Start with [`memento/README.md`](./memento/README.md) for Memento.

## Repository conventions

- Keep each project's source, dependencies, README, and CI configuration in its top-level directory.
- Use a short-lived branch with the project prefix, such as `memento/editor-improvements` or `vooc/search`.
- Keep CI scoped to the files for the project it builds, using workflow `paths` filters where appropriate.
- Deploy projects independently. For example, set the Vercel Root Directory to `personal-workbench` for that app.
- Move a project to its own repository when it has an independent product, release, and maintenance lifecycle.

## Migrated project

Today Workspace moved to [its own repository](https://github.com/chivopic/today-workspace) on 2026-09-06. Issues, pull requests, releases, and ongoing development belong there; this repository retains its earlier history.
