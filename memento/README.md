# Memento

Memento is an offline-first iPhone and iPad notes app that keeps notes as portable Markdown files and makes everyday capture, editing, and organization available through native iOS workflows.

## What you can do

- Capture and edit notes in Markdown, with formatting tools, preview, and system undo and redo.
- Find notes by text, then organize them with folders, tags, pins, and archive.
- Save links, text, and files from other apps with the share extension; use Shortcuts to capture text, and widgets to reopen or create a note.
- Export a note as `.md`, or move a library with a `.memento` backup that includes attachments.

For example, send a link from Safari to Memento and file it with a project folder, or use a widget to return to a recent note. Search saved notes when you need to find an earlier thought, and export a library backup when moving your notes. These workflows are implemented in the project; simulator and device acceptance is still pending.

## Quickstart

Requirements: macOS, Xcode 16 or later, and an iOS 17 or later simulator.

```bash
cd memento
open Memento.xcodeproj
```

In Xcode, select the `Memento` scheme and an iPhone simulator, then run the app. No package manager or third-party Swift dependency is required. Running on a device or signing the extensions requires an Apple development team and a matching App Group.

## Development checks

Run these from the `memento/` directory:

```bash
# Portable core tests (Swift 6+)
bash scripts/test-core.sh

# Check that the checked-in Xcode project matches its generator
python3 scripts/generate-project.py --check

# Build and run UI tests on an iPhone simulator (macOS and Xcode required)
bash scripts/test-ios.sh
```

`test-ios.sh` selects an available iPhone simulator automatically. Set `MEMENTO_SIMULATOR_ID` to choose a specific simulator. Results and real XCTest screenshots are saved under `test-results/`. The iOS test command cannot run on Linux; Swift syntax parsing is not an iOS build.

## Requirements and limitations

- The app targets iOS and iPadOS 17 or later. Its Foundation-based core tests can run on Linux with Swift 6 or later; building the app and extensions requires Apple's SDKs.
- Code for the selected offline features is present, but this project has not yet passed Xcode builds, simulator UI tests, or hands-on device checks. See [validation status and acceptance checklist](docs/validation.md).
- iCloud sync, Apple Pencil handwriting recognition, and AI features are out of scope and are not implemented.
- Notes and backups are readable Markdown/package files. The app's authentication lock is a foreground privacy screen, not encryption for the vault or exported backups.
- A failed save remains an unsaved draft in memory and is not durable across app termination. Use a successful “Saved on device” state before closing the app if the latest edits matter.
- No `LICENSE` file is present, so reuse and distribution terms are not documented.

## Documentation

- [Development and signing setup](docs/development.md)
- [Architecture, storage, and privacy](docs/architecture.md)
- [Validation record and Apple-platform acceptance checklist](docs/validation.md)
- [Competitive analysis](docs/competitive-analysis.md)
- [Telegram iOS source study](docs/telegram-ios-study.md)
- [Implementation plan](docs/implementation-plan.md)
