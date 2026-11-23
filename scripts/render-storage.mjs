#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { spawnCohortProcess } from "../videos/lib/cohort-process.mjs";
import {
  bindFile,
  digest,
  proveSceneWav,
  hydrateSceneWav,
  pruneProvedSceneWav,
} from "./lib/render-storage.mjs";
import {
  allocatedBytes,
  initializeAdmission,
  admissionStatus,
  reconcileLatestOnlyPrune,
  reserveStorage,
  settleStorage,
  enforceStorageLease,
} from "./lib/render-admission.mjs";

const [command, ...argv] = process.argv.slice(2);
const separator = argv.indexOf("--");
const childArgs = separator < 0 ? [] : argv.slice(separator + 1);
const { values, positionals } = parseArgs({
  args: separator < 0 ? argv : argv.slice(0, separator),
  allowPositionals: true,
  options: Object.fromEntries(
    [
      "budget",
      "measurement",
      "receipt",
      "sha256",
      "recipe",
      "output",
      "timeline",
      "scene",
      "wav",
      "renderer",
      "ffmpeg",
      "ledger",
      "guard",
      "guard-sha256",
      "store",
      "bytes",
    ].map((key) => [
      key,
      { type: "string", ...(key === "output" ? { multiple: true } : {}) },
    ]),
  ),
});
const required = (key) => {
  assert(values[key], `--${key} is required`);
  return values[key];
};
async function checkedJson(key) {
  const file = required(key),
    bytes = await fs.readFile(file);
  assert.equal(
    digest(bytes),
    required("sha256"),
    "Exact input JSON SHA-256 is required",
  );
  return JSON.parse(bytes);
}
async function writeNew(file, value) {
  const handle = await fs.open(file, "wx");
  try {
    await handle.writeFile(JSON.stringify(value, null, 2) + "\n");
    await handle.sync();
  } finally {
    await handle.close();
  }
}
async function main() {
  if (!command || ["help", "--help"].includes(command)) {
    console.log(
      "inventory PATH... | init --budget NEW_DIR --measurement JSON --sha256 SHA | status --budget DIR",
    );
    console.log("reconcile-prune --budget DIR --receipt JSON --sha256 SHA");
    console.log(
      "prove --wav CACHE.wav --timeline JSON --scene ID --renderer FILE --ffmpeg FILE --output NEW_RECIPE",
    );
    console.log("hydrate --recipe JSON --sha256 SHA --output NEW_WAV");
    console.log(
      "prune --recipe JSON --sha256 SHA --ledger DIR --guard MODULE --guard-sha256 SHA",
    );
    console.log(
      "admit --budget DIR --store root|external --bytes N --output PATH [--output PATH] -- COMMAND ARGS...",
    );
    return;
  }
  if (command === "inventory") {
    assert(positionals.length, "Supply at least one managed root");
    const roots = [];
    for (const file of positionals)
      roots.push({
        path: await fs.realpath(file),
        allocatedBytes: await allocatedBytes(file),
      });
    console.log(
      JSON.stringify(
        {
          measuredAt: new Date().toISOString(),
          roots,
          scope:
            "Nonatomic scan, no symlink traversal, unique regular-file inodes per root. Classify retained data and safety allowances before initialization.",
        },
        null,
        2,
      ),
    );
  } else if (command === "init") {
    const measurement = await checkedJson("measurement");
    await initializeAdmission(required("budget"), {
      ...measurement,
      measurementSha256: required("sha256"),
    });
    console.log(JSON.stringify(await admissionStatus(values.budget), null, 2));
  } else if (command === "reconcile-prune")
    console.log(
      JSON.stringify(
        await reconcileLatestOnlyPrune(
          required("budget"),
          await checkedJson("receipt"),
        ),
        null,
        2,
      ),
    );
  else if (command === "status")
    console.log(
      JSON.stringify(await admissionStatus(required("budget")), null, 2),
    );
  else if (command === "prove") {
    const timelineFile = required("timeline");
    const timeline = JSON.parse(await fs.readFile(timelineFile, "utf8"));
    const scene = timeline.scenes.find((row) => row.id === required("scene"));
    assert(scene, "Unknown timeline scene");
    const recipe = await proveSceneWav({
      wav: required("wav"),
      scene,
      ffmpeg: required("ffmpeg"),
      provenance: [
        { path: timelineFile, role: "timeline" },
        { path: required("renderer"), role: "renderer" },
      ],
    });
    assert.equal(values.output?.length, 1, "One --output is required");
    await writeNew(values.output[0], recipe);
    console.log(JSON.stringify(await bindFile(values.output[0])));
  } else if (command === "hydrate") {
    assert.equal(values.output?.length, 1, "One --output is required");
    console.log(
      JSON.stringify(
        await hydrateSceneWav(await checkedJson("recipe"), values.output[0]),
      ),
    );
  } else if (command === "prune") {
    const module = await bindFile(required("guard"));
    assert.equal(
      module.sha256,
      required("guard-sha256"),
      "Exact guard module SHA-256 is required",
    );
    const { guard } = await import(pathToFileURL(module.realPath).href);
    console.log(
      JSON.stringify(
        await pruneProvedSceneWav(await checkedJson("recipe"), {
          ledgerDirectory: required("ledger"),
          guard,
        }),
      ),
    );
  } else if (command === "admit") {
    assert(childArgs.length, "A child command after -- is required");
    const budget = required("budget");
    const lease = await reserveStorage(budget, {
      store: required("store"),
      bytes: Number(required("bytes")),
      outputs: required("output"),
      owner: childArgs[0],
    });
    assert(lease, "Storage budget exhausted; no child started");
    let watcher, result;
    try {
      const owned = spawnCohortProcess(childArgs[0], childArgs.slice(1), {
        stdio: "inherit",
      });
      const { child } = owned;
      if (child.pid)
        watcher = enforceStorageLease(lease, child.pid, {
          stopOwned: owned.stop,
        });
      const stop = () =>
        owned.stop(new Error("Storage-wrapped command interrupted"));
      process.once("SIGTERM", stop);
      process.once("SIGINT", stop);
      try {
        result = await owned.completion;
        if (result.error) throw result.error;
        await watcher?.stop();
      } finally {
        process.removeListener("SIGTERM", stop);
        process.removeListener("SIGINT", stop);
      }
    } finally {
      try {
        await watcher?.stop();
      } finally {
        console.log(
          JSON.stringify({
            storageSettlement: await settleStorage(budget, lease, {
              reason: result?.code === 0 ? "success" : "failed",
            }),
          }),
        );
      }
    }
    process.exitCode = result.code ?? 1;
  } else throw new Error(`Unknown command: ${command}`);
}
main().catch((error) => {
  console.error(error.stack ?? error);
  process.exitCode = 1;
});
