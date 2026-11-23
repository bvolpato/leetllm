#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { parseArgs } from "node:util";
import { accountRetentionPlan } from "./lib/retention-allocation.mjs";

const { values } = parseArgs({
  options: {
    plan: { type: "string" },
    sha256: { type: "string" },
    output: { type: "string" },
  },
});
async function main() {
  for (const key of ["plan", "sha256", "output"])
    assert(values[key], `--${key} is required`);
  const bytes = await fs.readFile(values.plan);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    values.sha256,
    "Plan SHA-256 mismatch",
  );
  const receipt = await accountRetentionPlan(JSON.parse(bytes), {
    planSha256: values.sha256,
  });
  const handle = await fs.open(values.output, "wx");
  try {
    await handle.writeFile(JSON.stringify(receipt, null, 2) + "\n");
    await handle.sync();
  } finally {
    await handle.close();
  }
  console.log(JSON.stringify(receipt, null, 2));
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
