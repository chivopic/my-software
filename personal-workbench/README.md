# Personal Workbench

A single-user workspace for capturing notes and tasks, organizing work, and planning the day from one dashboard.

## What it does

- **Dashboard:** today's focus, scheduled tasks, recent notes, and quick capture.
- **Notes:** Markdown editing and preview, tags, search, favorites, and reversible deletion.
- **Tasks:** Inbox, Todo, Doing, and Done board, plus list, today, upcoming, inbox, and completed views.
- **Planner:** a single-day timeline for assigning tasks to time slots.
- **Quick Capture:** press `⌘K` (or `Ctrl+K`) to save a line as a task or a note.
- **Export:** download the workspace data as JSON.

This is the implemented V0. The Daily Brief is a placeholder; AI, external feeds, multi-user accounts, and the later roadmap features are not implemented. See the [backlog](docs/backlog.md) for ideas that have not shipped.

## Quickstart

Requirements: Node.js 20.9 or later, pnpm 10.33.0, and Docker with the Compose plugin. Local development uses PostgreSQL 16 through the included Compose file.

From the repository root:

```bash
cd personal-workbench
corepack enable
cp .env.example .env
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open <http://localhost:3000>. The seed command creates the local user and starter tags. To stop the local database, run `pnpm db:down` from `personal-workbench/`.

## Development checks

Run from `personal-workbench/`:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Other project scripts are listed in [`package.json`](package.json). Avoid `pnpm db:reset` unless you intend to erase and recreate the local database.

## Deployment and access

See the [Vercel deployment guide](docs/04-deployment.md). Set the Vercel Root Directory to `personal-workbench` and configure `DATABASE_URL` and `APP_PASSWORD`.

V0 has no user accounts or per-user authorization. `APP_PASSWORD` adds a shared HTTP Basic password gate; it is not a multi-user authentication system. Set it before exposing a deployment to the public internet.

## Project documentation

- [V0 product requirements](docs/01-v0-prd.md)
- [Information architecture](docs/02-information-architecture.md)
- [Data model](docs/03-data-model.md)
- [Deployment guide](docs/04-deployment.md)
- [Backlog](docs/backlog.md)
- [Changelog](CHANGELOG.md)
