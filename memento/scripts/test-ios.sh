#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != Darwin ]] || ! command -v xcodebuild >/dev/null; then
  echo 'iOS validation requires macOS with Xcode 16+ and an installed iPhone Simulator.' >&2
  exit 1
fi
python3 scripts/generate-project.py --check
simulator_id="${MEMENTO_SIMULATOR_ID:-}"
if [[ -z "$simulator_id" ]]; then
  simulator_id="$(xcrun simctl list devices available -j | python3 -c 'import json,sys; d=json.load(sys.stdin); devices=[x for runtime,items in d["devices"].items() if "iOS" in runtime for x in items if "iPhone" in x["name"] and x.get("isAvailable",False)]; print(devices[0]["udid"] if devices else "")')"
fi
if [[ -z "$simulator_id" ]]; then echo 'Install an iPhone Simulator runtime in Xcode Settings > Components.' >&2; exit 1; fi
result_path="test-results/iOS-$(date +%Y%m%d-%H%M%S).xcresult"
mkdir -p test-results
xcodebuild -project Memento.xcodeproj -scheme Memento -configuration Debug \
  -destination "platform=iOS Simulator,id=$simulator_id" -derivedDataPath DerivedData \
  -resultBundlePath "$result_path" CODE_SIGNING_ALLOWED=NO test
echo "Real simulator screenshots are retained as XCTest attachments in $result_path."
