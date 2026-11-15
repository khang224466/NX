// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "STARK_Cam_iOS",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .executable(
            name: "STARK_Cam_iOS",
            targets: ["STARK_Cam_iOS"]
        )
    ],
    targets: [
        .executableTarget(
            name: "STARK_Cam_iOS",
            path: "Sources",
            resources: [
                .process("../Resources")
            ]
        )
    ]
)
