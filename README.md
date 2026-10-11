# my-software

A small collection of personal software projects, from local-first note apps to a web workspace for turning notes into plans.

![Hand-drawn illustrations of the projects in this repository](./assets/project-illustrations.png)

## Projects

| Project | What it does | Status |
| --- | --- | --- |
| [Personal Workbench](./personal-workbench/README.md) | A single-user web workspace for notes, tasks, and day planning. | V0 implemented; deployment guide included. |
| [VOOC for macOS](./vooc/macos/README.md) | A native notebook that edits Markdown files in a folder you choose. | Prototype. |
| [VOOC design previews](./vooc/design/README.md) | Concept designs for the VOOC app, including its three-column window and quick-open flow. | Design workspace; previews are concepts, not app screenshots. |
| [Memento](./memento/README.md) | An offline-first iPhone and iPad notes app with portable Markdown and native sharing. | Implementation in progress; Apple-platform validation remains. |
| [Today Workspace](https://github.com/chivopic/today-workspace) | A mobile-first workspace for quick capture and tasks. | Maintained in its own repository. |

Start with a project's README for requirements, setup, and development commands. The illustration above is decorative and does not depict the actual app interfaces.

## Repository conventions

- Keep each project's source, dependencies, README, and CI configuration in its own directory.
- Use short-lived branches prefixed with the project name, such as `memento/editor-improvements`.
- Scope CI workflows to the files for the project they build.
- Deploy projects independently. For Personal Workbench on Vercel, use `personal-workbench` as the Root Directory.
- Move a project to its own repository when it has an independent product and maintenance lifecycle.

Today Workspace moved to [its own repository](https://github.com/chivopic/today-workspace) on 2026-09-06. Its issues, pull requests, releases, and ongoing development live there; this repository retains its earlier history.
