import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("native Mac Catalyst screenshot capture wiring stays consistent and avoids composite mockups", async () => {
  const [
    pbxproj,
    scheme,
    appSwift,
    captureTests,
    displaySwift,
    exportSwift,
    iosCaptureScript,
    macCaptureScript,
    workflow,
  ] = await Promise.all([
    fs.readFile(path.join(repoRoot, "mobile/ios/LeetLLM/LeetLLM.xcodeproj/project.pbxproj"), "utf8"),
    fs.readFile(
      path.join(
        repoRoot,
        "mobile/ios/LeetLLM/LeetLLM.xcodeproj/xcshareddata/xcschemes/LeetLLMMacScreenshots.xcscheme",
      ),
      "utf8",
    ),
    fs.readFile(path.join(repoRoot, "mobile/ios/LeetLLM/LeetLLM/LeetLLMApp.swift"), "utf8"),
    fs.readFile(
      path.join(repoRoot, "mobile/ios/LeetLLM/LeetLLMMacCaptureTests/LeetLLMMacCaptureTests.swift"),
      "utf8",
    ),
    fs.readFile(path.join(repoRoot, "scripts/macos-capture-display.swift"), "utf8"),
    fs.readFile(path.join(repoRoot, "scripts/macos-capture-export.swift"), "utf8"),
    fs.readFile(path.join(repoRoot, "mobile/ios/LeetLLM/capture-screenshots.sh"), "utf8"),
    fs.readFile(path.join(repoRoot, "mobile/ios/LeetLLM/capture-mac-screenshots.sh"), "utf8"),
    fs.readFile(path.join(repoRoot, ".github/workflows/mac-screenshots.yml"), "utf8"),
  ]);

  assert.match(pbxproj, /MACCAPTURETARGET001 = \{isa = PBXNativeTarget;.*name = LeetLLMMacCaptureTests;/);
  assert.match(pbxproj, /PRODUCT_BUNDLE_IDENTIFIER = com\.leetllm\.ios\.maccapturetests;/);
  assert.match(pbxproj, /SUPPORTS_MACCATALYST = YES;/);
  assert.match(scheme, /BlueprintIdentifier="APPTARGET001"/);
  assert.match(scheme, /BlueprintIdentifier="MACCAPTURETARGET001"/);

  assert.match(appSwift, /#if DEBUG && targetEnvironment\(macCatalyst\)/);
  assert.match(appSwift, /--native-mac-capture-window/);
  assert.match(appSwift, /width:\s*1280,\s*height:\s*800/);

  for (const name of ["01_learn", "02_practice", "03_tracks", "04_glossary"]) {
    assert.match(captureTests, new RegExp(`"${name}"`));
    assert.match(exportSwift, new RegExp(`"${name}"`));
  }
  assert.match(displaySwift, /1440/);
  assert.match(exportSwift, /\(1280,\s*800\),\s*\(2560,\s*1600\)/);

  assert.doesNotMatch(iosCaptureScript, /generate-mac-screenshots\.py/);
  assert.match(macCaptureScript, /-scheme LeetLLMMacScreenshots/);
  assert.match(workflow, /^on:\n  workflow_dispatch:/m);
  assert.doesNotMatch(workflow, /^\s+push:/m);

  await exec("bash", ["-n", path.join(repoRoot, "mobile/ios/LeetLLM/capture-screenshots.sh")]);
  await exec("bash", ["-n", path.join(repoRoot, "mobile/ios/LeetLLM/capture-mac-screenshots.sh")]);
});
