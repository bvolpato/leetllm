import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { accountRetentionPlan } from "../lib/retention-allocation.mjs";

const planSha256 = "a".repeat(64);
async function fixture(t) {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "retention-allocation-"),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const first = path.join(root, "first"),
    second = path.join(root, "second");
  await fs.mkdir(first);
  await fs.mkdir(second);
  return {
    root,
    first,
    second,
    plan: { root, candidates: [{ path: first }, { path: second }] },
  };
}
async function allocated(file) {
  return (await fs.stat(file)).blocks * 512;
}

test("unique files and hardlinks wholly inside all candidates count allocated bytes once", async (t) => {
  const f = await fixture(t),
    unique = path.join(f.first, "unique"),
    original = path.join(f.first, "linked");
  await fs.writeFile(unique, Buffer.alloc(8192, 1));
  await fs.writeFile(original, Buffer.alloc(12288, 2));
  await fs.link(original, path.join(f.second, "other-name"));
  const result = await accountRetentionPlan(f.plan, { planSha256 });
  assert.equal(
    result.regularExclusiveBytes,
    (await allocated(unique)) + (await allocated(original)),
  );
  assert.equal(result.uncreditedOutsideAliasBytes, 0);
  assert.equal(result.regularFileNames, 3);
  assert.equal(result.regularInodeCount, 2);
  assert.equal(result.planSha256, planSha256);
});

test("an outside hardlink receives zero credit without inspecting the outside name", async (t) => {
  const f = await fixture(t),
    original = path.join(f.first, "linked"),
    outside = path.join(f.root, "outside");
  await fs.writeFile(original, Buffer.alloc(16384, 3));
  await fs.link(original, outside);
  const result = await accountRetentionPlan(f.plan, { planSha256 });
  assert.equal(result.regularExclusiveBytes, 0);
  assert.equal(result.uncreditedOutsideAliasBytes, await allocated(original));
  assert.equal(await fs.readFile(outside).then((bytes) => bytes.length), 16384);
});

test("symlink targets are never counted, overlapping candidates and find errors reject", async (t) => {
  const f = await fixture(t),
    target = path.join(f.root, "outside-target");
  await fs.writeFile(target, Buffer.alloc(32768, 4));
  await fs.symlink(target, path.join(f.first, "reference"));
  const result = await accountRetentionPlan(f.plan, { planSha256 });
  assert.equal(result.regularExclusiveBytes, 0);
  assert.equal(result.regularFileNames, 0);
  await assert.rejects(
    accountRetentionPlan(
      {
        root: f.root,
        candidates: [
          { path: f.first },
          { path: path.join(f.first, "reference") },
        ],
      },
      { planSha256 },
    ),
    /Overlapping/,
  );
  await assert.rejects(
    accountRetentionPlan(
      { root: f.root, candidates: [{ path: path.join(f.root, "missing") }] },
      { planSha256 },
    ),
    /GNU find allocation scan failed/,
  );
  assert.equal((await fs.readFile(target)).length, 32768);
});
