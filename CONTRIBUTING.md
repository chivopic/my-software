# Contributing

Each project is developed and tested independently. Before changing a project, read its README and keep changes within its existing scope. For a bug report or proposal, use the matching GitHub issue form; do not post security vulnerabilities publicly (see [SECURITY.md](SECURITY.md)).

## Run checks

Run checks from the listed directory. These commands do not require production services or credentials.

**Personal Workbench** (`personal-workbench/`): Node.js 20.9 or later and pnpm 10.33.0.

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

These checks do not need a running database. To exercise local database changes, use the PostgreSQL 16 setup in the project's README.

**Memento** (`memento/`): Swift 6 or later for core tests; macOS and Xcode 16 or later for simulator tests.

```bash
python3 scripts/generate-project.py --check
bash scripts/test-core.sh
bash scripts/test-ios.sh  # macOS with Xcode and an iPhone Simulator
```

**VOOC** (`vooc/macos/`): macOS 14 or later and Swift 6 or later.

```bash
swift test
```

Include the affected project, a concise description, and the checks you ran in a pull request. Mark platform-specific checks that you could not run; do not report them as passing.
