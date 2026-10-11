#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
swift_bin="${MEMENTO_SWIFT_BIN:-}"
if [[ -z "$swift_bin" ]]; then
  if command -v swift >/dev/null 2>&1; then swift_bin="$(command -v swift)"
  elif [[ -x /workspace/toolchains/swift-6.2.1-RELEASE-ubuntu22.04/usr/bin/swift ]]; then
    swift_bin=/workspace/toolchains/swift-6.2.1-RELEASE-ubuntu22.04/usr/bin/swift
  elif [[ -x /workspace/toolchains/swift-6.2-RELEASE-ubuntu22.04/usr/bin/swift ]]; then
    swift_bin=/workspace/toolchains/swift-6.2-RELEASE-ubuntu22.04/usr/bin/swift
  else echo 'Swift 6+ is required. Set MEMENTO_SWIFT_BIN to its executable.' >&2; exit 1; fi
fi
task_cache="${MEMENTO_SWIFT_CACHE:-/tmp/memento-swift-cache}"
mkdir -p "$task_cache/module"
export CLANG_MODULE_CACHE_PATH="$task_cache/module"
export SWIFTPM_MODULECACHE_OVERRIDE="$task_cache/module"
exec "$swift_bin" test --jobs "${MEMENTO_TEST_JOBS:-4}" --cache-path "$task_cache/cache" \
  --config-path "$task_cache/config" --security-path "$task_cache/security" "$@"
