#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  applyLatestOnlyRetention,
  planLatestOnlyRetention,
  sha256,
} from "./lib/latest-only-retention.mjs";

const [command, ...args] = process.argv.slice(2);
const { values } = parseArgs({
  args,
  options: {
    root: { type: "string" },
    keep: { type: "string" },
    output: { type: "string" },
    plan: { type: "string" },
    sha256: { type: "string" },
    guard: { type: "string" },
    "guard-sha256": { type: "string" },
    "project-root": { type: "string" },
    "external-project-root": { type: "string" },
    "batch-size": { type: "string" },
    "verify-only": { type: "boolean", default: false },
  },
});
function required(key) {
  assert(values[key], `--${key} is required`);
  return values[key];
}

async function main() {
  if (!command || ["help", "--help"].includes(command)) {
    console.log(
      "plan --root ABS --keep MANIFEST.json --output NEW_PLAN.json [--project-root ABS] [--external-project-root ABS]",
    );
    console.log(
      "apply --plan PLAN.json --sha256 SHA --guard GUARD.mjs --guard-sha256 SHA [--verify-only] [--batch-size 32] [--project-root ABS] [--external-project-root ABS]",
    );
    return;
  }
  const scope = {
    projectRoot: values["project-root"] ?? process.cwd(),
    externalProjectRoot: values["external-project-root"],
  };
  if (command === "plan") {
    const output = path.resolve(required("output"));
    const root = path.resolve(required("root"));
    assert(
      output !== root && !output.startsWith(root + path.sep),
      "Write the review plan outside the managed root",
    );
    const plan = await planLatestOnlyRetention({
      ...scope,
      root,
      keepManifest: JSON.parse(await fs.readFile(required("keep"), "utf8")),
    });
    const bytes = Buffer.from(JSON.stringify(plan, null, 2) + "\n");
    const handle = await fs.open(output, "wx");
    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
    console.log(
      JSON.stringify({
        path: output,
        sha256: sha256(bytes),
        candidates: plan.candidates.length,
        keep: plan.keep.length,
      }),
    );
  } else if (command === "apply") {
    console.log(
      JSON.stringify(
        await applyLatestOnlyRetention({
          ...scope,
          planPath: required("plan"),
          expectedPlanSha256: required("sha256"),
          guardPath: required("guard"),
          expectedGuardSha256: required("guard-sha256"),
          verifyOnly: values["verify-only"],
          ...(values["batch-size"]
            ? { batchSize: Number(values["batch-size"]) }
            : {}),
        }),
        null,
        2,
      ),
    );
  } else throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(error.message);
  if (error.details) console.error(JSON.stringify(error.details, null, 2));
  process.exitCode = 1;
});
