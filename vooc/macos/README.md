# VOOC for macOS

VOOC is a native macOS notebook for working directly with a folder of Markdown files you choose.

## What you can do

- Open a folder as a vault; VOOC finds Markdown files recursively and lists the most recently edited first.
- Search note titles, file paths, and previews.
- Create and edit plain Markdown notes with automatic saving.
- Use the native three-column AppKit interface and standard macOS menus.

## Run

Requirements: macOS 14 or later and Swift 6 or later. Xcode 16 or later is needed to open the package in Xcode.

```bash
cd vooc/macos
swift run VOOC
```

On first launch, choose **Open Vault…** and select a folder containing `.md` files. Use `⌘N` to create a note and `⌘F` to focus search.

To open the package in Xcode, run `open -a Xcode Package.swift` from `vooc/macos/`, then select the `VOOC` scheme and run it.

## Tests

```bash
swift test
```

VOOC is a graphical app; it does not currently expose command-line options. It reads and writes Markdown files in the selected folder.

See the [design workspace](../design/README.md) for concept previews and the [design specification](../design/design-spec.md) for product and interface notes.
