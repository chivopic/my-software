#if canImport(AppKit)
import AppKit

let application = NSApplication.shared
let delegate = AppDelegate()
application.delegate = delegate
application.setActivationPolicy(.regular)
application.run()
#else
import Foundation

print("VOOC is a macOS application. Open this package on macOS 14 or later.")
#endif
