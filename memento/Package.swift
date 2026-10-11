// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MementoCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "MementoCore", targets: ["MementoCore"])],
    targets: [
        .target(name: "MementoCore", path: "Core"),
        .testTarget(name: "MementoCoreTests", dependencies: ["MementoCore"], path: "Tests/CoreTests")
    ]
)
