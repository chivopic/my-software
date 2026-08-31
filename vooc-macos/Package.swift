// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "VOOC",
    platforms: [.macOS(.v14)],
    products: [.executable(name: "VOOC", targets: ["VOOC"])],
    targets: [
        .executableTarget(
            name: "VOOC",
            resources: [.process("Resources")]
        ),
        .testTarget(name: "VOOCTests", dependencies: ["VOOC"]),
    ]
)
