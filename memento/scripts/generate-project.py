#!/usr/bin/env python3
"""Generate the checked-in Xcode project using only Python's standard library.

Deterministic IDs, explicit file membership, local Swift package, app, two extensions,
UI tests and shared scheme. No XcodeGen, CocoaPods or external project generator.
"""
from pathlib import Path
import hashlib
import json
import plistlib
import sys
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
objects = {}


def ident(key):
    return hashlib.sha256(key.encode()).hexdigest()[:24].upper()


def obj(key, isa, **fields):
    uid = ident(key)
    if uid in objects:
        raise ValueError(f"Duplicate project object: {key}")
    objects[uid] = dict(isa=isa, **fields)
    return uid


def quote(value):
    return json.dumps(str(value), ensure_ascii=False)


def serialize(value, depth=0):
    if isinstance(value, dict):
        return "{\n" + "".join("\t" * (depth + 1) + quote(k) + " = " + serialize(v, depth + 1) + ";\n" for k, v in value.items()) + "\t" * depth + "}"
    if isinstance(value, list):
        return "(\n" + "".join("\t" * (depth + 1) + serialize(v, depth + 1) + ",\n" for v in value) + "\t" * depth + ")"
    if isinstance(value, int):
        return str(value)
    return quote(value)


TARGETS = {
    "Memento": {"sources": sorted([*ROOT.glob("App/*.swift"), *ROOT.glob("Features/*/*.swift"), *ROOT.glob("DesignSystem/*.swift")]),
                "product": "Memento.app", "type": "com.apple.product-type.application", "plist": "Resources/App-Info.plist", "bundle": "com.chivopic.memento", "entitlements": "Resources/Memento.entitlements"},
    "MementoShare": {"sources": sorted(ROOT.glob("Extensions/Share/*.swift")), "product": "MementoShare.appex", "type": "com.apple.product-type.app-extension", "plist": "Extensions/Share/Info.plist", "bundle": "com.chivopic.memento.share", "entitlements": "Resources/Memento.entitlements"},
    "MementoWidget": {"sources": sorted(ROOT.glob("Extensions/Widget/*.swift")), "product": "MementoWidget.appex", "type": "com.apple.product-type.app-extension", "plist": "Extensions/Widget/Info.plist", "bundle": "com.chivopic.memento.widget", "entitlements": "Resources/Memento.entitlements"},
    "MementoUITests": {"sources": sorted(ROOT.glob("Tests/UITests/*.swift")), "product": "MementoUITests.xctest", "type": "com.apple.product-type.bundle.ui-testing", "bundle": "com.chivopic.memento.uitests"},
}

file_refs = {}
all_files = {p for t in TARGETS.values() for p in t["sources"]}
all_files.update(ROOT / p for p in ["Resources/Assets.xcassets", "Resources/PrivacyInfo.xcprivacy", "Resources/App-Info.plist", "Resources/Memento.entitlements", "Extensions/Share/Info.plist", "Extensions/Widget/Info.plist"])
for path in sorted(all_files):
    if not path.exists():
        raise SystemExit(f"Missing project input: {path}")
    relative = path.relative_to(ROOT).as_posix()
    file_type = "sourcecode.swift" if path.suffix == ".swift" else "folder.assetcatalog" if path.suffix == ".xcassets" else "text.plist.entitlements" if path.suffix == ".entitlements" else "text.plist.xml"
    file_refs[relative] = obj("file:" + relative, "PBXFileReference", lastKnownFileType=file_type, path=relative, sourceTree="<group>")

products = {}
for name, target in TARGETS.items():
    kind = "wrapper.application" if name == "Memento" else "wrapper.cfbundle" if name == "MementoUITests" else "wrapper.app-extension"
    products[name] = obj("product:" + name, "PBXFileReference", explicitFileType=kind, path=target["product"], sourceTree="BUILT_PRODUCTS_DIR")

sources_group = obj("sources", "PBXGroup", children=list(file_refs.values()), name="Sources & Resources", sourceTree="<group>")
products_group = obj("products", "PBXGroup", children=list(products.values()), name="Products", sourceTree="<group>")
main_group = obj("main", "PBXGroup", children=[sources_group, products_group], sourceTree="<group>")
package = obj("core-package", "XCLocalSwiftPackageReference", relativePath=".")


def configs(key, settings):
    result = []
    for mode in ["Debug", "Release"]:
        merged = {**settings, "SWIFT_OPTIMIZATION_LEVEL": "-Onone" if mode == "Debug" else "-O", "DEBUG_INFORMATION_FORMAT": "dwarf" if mode == "Debug" else "dwarf-with-dsym"}
        if mode == "Debug":
            merged["SWIFT_ACTIVE_COMPILATION_CONDITIONS"] = ["$(inherited)", "DEBUG"]
            merged["ENABLE_TESTABILITY"] = "YES"
        result.append(obj(key + ":" + mode, "XCBuildConfiguration", name=mode, buildSettings=merged))
    return obj(key + ":list", "XCConfigurationList", buildConfigurations=result, defaultConfigurationIsVisible=0, defaultConfigurationName="Release")


project_settings = {
    "IPHONEOS_DEPLOYMENT_TARGET": "17.0", "SDKROOT": "iphoneos", "SWIFT_VERSION": "5.0",
    "CLANG_ENABLE_MODULES": "YES", "CLANG_ENABLE_OBJC_ARC": "YES", "ENABLE_USER_SCRIPT_SANDBOXING": "YES",
    "GCC_C_LANGUAGE_STANDARD": "gnu17", "ALWAYS_SEARCH_USER_PATHS": "NO", "COPY_PHASE_STRIP": "NO",
}
project_configs = configs("project-configs", project_settings)
native_targets = []
for name, target in TARGETS.items():
    build_sources = []
    for path in target["sources"]:
        relative = path.relative_to(ROOT).as_posix()
        build_sources.append(obj("build:" + name + ":" + relative, "PBXBuildFile", fileRef=file_refs[relative]))
    sources = obj("sources-phase:" + name, "PBXSourcesBuildPhase", buildActionMask=2147483647, files=build_sources, runOnlyForDeploymentPostprocessing=0)
    package_products = []
    framework_files = []
    if name != "MementoUITests":
        product_dep = obj("package-product:" + name, "XCSwiftPackageProductDependency", package=package, productName="MementoCore")
        package_products.append(product_dep)
        framework_files.append(obj("core-link:" + name, "PBXBuildFile", productRef=product_dep))
    frameworks = obj("frameworks-phase:" + name, "PBXFrameworksBuildPhase", buildActionMask=2147483647, files=framework_files, runOnlyForDeploymentPostprocessing=0)
    resource_files = []
    if name != "MementoUITests":
        resources = ["Resources/PrivacyInfo.xcprivacy"] + (["Resources/Assets.xcassets"] if name == "Memento" else [])
        resource_files = [obj("resource:" + name + ":" + p, "PBXBuildFile", fileRef=file_refs[p]) for p in resources]
    resources_phase = obj("resources-phase:" + name, "PBXResourcesBuildPhase", buildActionMask=2147483647, files=resource_files, runOnlyForDeploymentPostprocessing=0)
    phases = [sources, frameworks, resources_phase]
    dependencies = []
    dependent_names = ["MementoShare", "MementoWidget"] if name == "Memento" else ["Memento"] if name == "MementoUITests" else []
    for dependency in dependent_names:
        proxy = obj("proxy:" + name + ":" + dependency, "PBXContainerItemProxy", containerPortal=ident("project"), proxyType=1, remoteGlobalIDString=ident("target:" + dependency), remoteInfo=dependency)
        dependencies.append(obj("dependency:" + name + ":" + dependency, "PBXTargetDependency", target=ident("target:" + dependency), targetProxy=proxy))
    if name == "Memento":
        embedded = [obj("embed:" + dependency, "PBXBuildFile", fileRef=products[dependency], settings={"ATTRIBUTES": ["RemoveHeadersOnCopy"]}) for dependency in dependent_names]
        phases.append(obj("embed-phase", "PBXCopyFilesBuildPhase", buildActionMask=2147483647, dstPath="", dstSubfolderSpec=13, files=embedded, name="Embed App Extensions", runOnlyForDeploymentPostprocessing=0))
    settings = {
        "PRODUCT_NAME": "$(TARGET_NAME)", "PRODUCT_BUNDLE_IDENTIFIER": target["bundle"], "CODE_SIGN_STYLE": "Automatic",
        "TARGETED_DEVICE_FAMILY": "1,2", "SUPPORTED_PLATFORMS": "iphoneos iphonesimulator", "SUPPORTS_MACCATALYST": "NO",
        "MARKETING_VERSION": "1.0", "CURRENT_PROJECT_VERSION": "1", "LD_RUNPATH_SEARCH_PATHS": ["$(inherited)", "@executable_path/Frameworks"],
        "GENERATE_INFOPLIST_FILE": "NO" if "plist" in target else "YES",
    }
    if "plist" in target:
        settings["INFOPLIST_FILE"] = target["plist"]
        settings["CODE_SIGN_ENTITLEMENTS"] = target["entitlements"]
    if name == "Memento":
        settings["ASSETCATALOG_COMPILER_APPICON_NAME"] = "AppIcon"
        settings["ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME"] = "AccentColor"
    if name in ["MementoShare", "MementoWidget"]:
        settings["APPLICATION_EXTENSION_API_ONLY"] = "YES"
        settings["SKIP_INSTALL"] = "YES"
        settings["LD_RUNPATH_SEARCH_PATHS"].append("@executable_path/../../Frameworks")
    if name == "MementoUITests":
        settings["TEST_TARGET_NAME"] = "Memento"
        settings["TEST_TARGET_IDENTIFIER"] = ident("target:Memento")
    config = configs("config:" + name, settings)
    native_targets.append(obj("target:" + name, "PBXNativeTarget", buildConfigurationList=config, buildPhases=phases, buildRules=[], dependencies=dependencies, name=name, packageProductDependencies=package_products, productName=name, productReference=products[name], productType=target["type"]))

project = obj("project", "PBXProject", attributes={"BuildIndependentTargetsInParallel": "YES", "LastUpgradeCheck": "1600", "TargetAttributes": {ident("target:" + name): {"CreatedOnToolsVersion": "16.0"} for name in TARGETS}},
              buildConfigurationList=project_configs, compatibilityVersion="Xcode 14.0", developmentRegion="en", hasScannedForEncodings=0, knownRegions=["en", "Base"], mainGroup=main_group,
              packageReferences=[package], productRefGroup=products_group, projectDirPath="", projectRoot="", targets=native_targets)
reference_keys = {"buildConfigurationList", "buildConfigurations", "children", "fileRef", "productRef", "package", "buildPhases", "dependencies", "productReference", "packageProductDependencies", "files", "containerPortal", "remoteGlobalIDString", "target", "targetProxy", "mainGroup", "packageReferences", "productRefGroup", "targets"}
for uid, record in objects.items():
    for key, value in record.items():
        if key in reference_keys:
            for reference in value if isinstance(value, list) else [value]:
                if reference not in objects:
                    raise SystemExit(f"Dangling Xcode reference {uid}.{key}: {reference}")
pbx = "// !$*UTF8*$!\n" + serialize({"archiveVersion": 1, "classes": {}, "objectVersion": 60, "objects": objects, "rootObject": project}) + "\n"


def build_ref(name):
    return f'<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{ident("target:" + name)}" BuildableName="{TARGETS[name]["product"]}" BlueprintName="{name}" ReferencedContainer="container:Memento.xcodeproj"/>'


scheme = f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="1600" version="1.3">
  <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries>
    <BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">{build_ref("Memento")}</BuildActionEntry>
    <BuildActionEntry buildForTesting="YES" buildForRunning="NO" buildForProfiling="NO" buildForArchiving="NO" buildForAnalyzing="YES">{build_ref("MementoUITests")}</BuildActionEntry>
  </BuildActionEntries></BuildAction>
  <TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES">
    <Testables><TestableReference skipped="NO">{build_ref("MementoUITests")}</TestableReference></Testables>
  </TestAction>
  <LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" debugServiceExtension="internal" allowLocationSimulation="YES"><BuildableProductRunnable runnableDebuggingMode="0">{build_ref("Memento")}</BuildableProductRunnable></LaunchAction>
  <ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"><BuildableProductRunnable runnableDebuggingMode="0">{build_ref("Memento")}</BuildableProductRunnable></ProfileAction>
  <AnalyzeAction buildConfiguration="Debug"/>
  <ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>
'''
outputs = {
    ROOT / "Memento.xcodeproj/project.pbxproj": pbx,
    ROOT / "Memento.xcodeproj/xcshareddata/xcschemes/Memento.xcscheme": scheme,
    ROOT / "Memento.xcodeproj/project.xcworkspace/contents.xcworkspacedata": '<?xml version="1.0" encoding="UTF-8"?>\n<Workspace version="1.0"><FileRef location="self:"/></Workspace>\n',
}
for path, content in outputs.items():
    if "--check" in sys.argv:
        if not path.exists() or path.read_text() != content:
            raise SystemExit(f"Stale project file: {path}. Run python3 scripts/generate-project.py.")
    else:
        path.parent.mkdir(parents=True, exist_ok=True); path.write_text(content)
for plist in ROOT.rglob("*.plist"):
    if ".build" not in plist.parts and "DerivedData" not in plist.parts:
        plistlib.loads(plist.read_bytes())
assert all(TARGETS[name]["sources"] for name in TARGETS)
print(f'Validated {len(objects)} Xcode objects, {len(file_refs)} inputs, 4 targets, local package and shared scheme.')
