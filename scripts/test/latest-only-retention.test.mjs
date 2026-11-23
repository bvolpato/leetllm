import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  applyLatestOnlyRetention,
  assertNoNestedMounts,
  parseMountInfo,
  planLatestOnlyRetention,
  sha256,
} from "../lib/latest-only-retention.mjs";

async function fixture(t) {
  const projectRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "latest-only-retention-"),
  );
  t.after(() => fs.rm(projectRoot, { recursive: true, force: true }));
  const root = path.join(projectRoot, "build");
  await fs.mkdir(path.join(root, "nested", "current"), { recursive: true });
  await fs.mkdir(path.join(root, "nested", "old"));
  await fs.writeFile(
    path.join(root, "nested", "current", "movie.mp4"),
    "current media",
  );
  await fs.writeFile(path.join(root, "nested", "old", "old.mp4"), "old media");
  await fs.writeFile(
    path.join(root, "nested", "latest.json"),
    "current metadata",
  );
  await fs.writeFile(path.join(root, "historical.json"), "old metadata");
  const keepManifest = {
    version: 1,
    roots: [
      {
        path: path.join(root, "nested", "current"),
        mode: "tree",
        reason: "Current movie",
      },
      {
        path: path.join(root, "nested", "latest.json"),
        mode: "file",
        reason: "Current metadata",
      },
    ],
  };
  const planPath = path.join(projectRoot, "plan.json"),
    guardPath = path.join(projectRoot, "guard.mjs");
  const guardBytes = Buffer.from(
    'export async function guard() { return { inactive: true, mountsClear: true, provenance: { source: "test observation" } }; }',
  );
  await fs.writeFile(guardPath, guardBytes);
  async function prepare() {
    const plan = await planLatestOnlyRetention({
      root,
      projectRoot,
      keepManifest,
    });
    const bytes = Buffer.from(JSON.stringify(plan));
    await fs.writeFile(planPath, bytes);
    return {
      plan,
      options: {
        projectRoot,
        planPath,
        expectedPlanSha256: sha256(bytes),
        guardPath,
        expectedGuardSha256: sha256(guardBytes),
      },
    };
  }
  return { root, projectRoot, keepManifest, prepare, guardPath };
}

test("sparse planning keeps a nested leaf and whole current subtree while removing history", async (t) => {
  const f = await fixture(t),
    { plan, options } = await f.prepare();
  assert.deepEqual(
    plan.candidates.map((item) => path.relative(f.root, item.path)),
    ["historical.json", "nested/old"],
  );
  const result = await applyLatestOnlyRetention(options);
  assert.equal(result.state, "removed");
  assert.equal(
    await fs.readFile(path.join(f.root, "nested/current/movie.mp4"), "utf8"),
    "current media",
  );
  assert.equal(
    await fs.readFile(path.join(f.root, "nested/latest.json"), "utf8"),
    "current metadata",
  );
  await assert.rejects(fs.lstat(path.join(f.root, "nested/old")), {
    code: "ENOENT",
  });
  await assert.rejects(fs.lstat(path.join(f.root, "historical.json")), {
    code: "ENOENT",
  });
});

test("removal unlinks historical symlinks and preserves kept symlinks without touching targets", async (t) => {
  const f = await fixture(t),
    target = path.join(f.projectRoot, "outside.txt");
  await fs.writeFile(target, "outside retained");
  await fs.symlink(target, path.join(f.root, "old-link"));
  await fs.symlink(target, path.join(f.root, "current-link"));
  f.keepManifest.roots.push({
    path: path.join(f.root, "current-link"),
    mode: "symlink",
    reason: "Current reference",
  });
  await applyLatestOnlyRetention((await f.prepare()).options);
  assert.equal(await fs.readFile(target, "utf8"), "outside retained");
  assert.equal(await fs.readlink(path.join(f.root, "current-link")), target);
  await assert.rejects(fs.lstat(path.join(f.root, "old-link")), {
    code: "ENOENT",
  });
});

test("queued hardlink aliases survive own ctime changes across claims and parent groups", async (t) => {
  const f = await fixture(t);
  const first = path.join(f.root, "a-old"),
    second = path.join(f.root, "b-old"),
    third = path.join(f.root, "nested", "d-old");
  await fs.writeFile(first, "shared historical file");
  await fs.link(first, second);
  await fs.link(first, third);
  const { options } = await f.prepare();
  const result = await applyLatestOnlyRetention({ ...options, batchSize: 2 });
  assert.equal(result.state, "removed");
  for (const file of [first, second, third]) {
    assert(result.removed.includes(file));
    await assert.rejects(fs.lstat(file), { code: "ENOENT" });
  }
  assert.equal(
    await fs.readFile(path.join(f.root, "nested/current/movie.mp4"), "utf8"),
    "current media",
  );
});

test("exact plan and guard hashes are required before any removal", async (t) => {
  const f = await fixture(t),
    { options } = await f.prepare();
  await assert.rejects(
    applyLatestOnlyRetention({
      ...options,
      expectedPlanSha256: "0".repeat(64),
    }),
    /plan SHA-256 mismatch/,
  );
  await fs.appendFile(f.guardPath, "\n");
  await assert.rejects(
    applyLatestOnlyRetention(options),
    /guard SHA-256 mismatch/,
  );
  assert.equal(
    await fs.readFile(path.join(f.root, "historical.json"), "utf8"),
    "old metadata",
  );
});

test("candidate replacement or content identity drift aborts before removal", async (t) => {
  const f = await fixture(t),
    { options } = await f.prepare();
  await fs.rename(
    path.join(f.root, "historical.json"),
    path.join(f.root, "saved.json"),
  );
  await fs.writeFile(path.join(f.root, "historical.json"), "replacement");
  await assert.rejects(
    applyLatestOnlyRetention(options),
    /Candidate identity drift/,
  );
  assert.equal(
    await fs.readFile(path.join(f.root, "historical.json"), "utf8"),
    "replacement",
  );
});

test("an in-place candidate write changes ctime and invalidates the plan", async (t) => {
  const f = await fixture(t),
    { options } = await f.prepare();
  const candidate = path.join(f.root, "historical.json");
  const before = await fs.lstat(candidate, { bigint: true });
  await fs.appendFile(candidate, " changed");
  const after = await fs.lstat(candidate, { bigint: true });
  assert.equal(after.ino, before.ino);
  assert.notEqual(after.ctimeNs, before.ctimeNs);
  await assert.rejects(
    applyLatestOnlyRetention(options),
    /Candidate identity drift/,
  );
  assert.equal(await fs.readFile(candidate, "utf8"), "old metadata changed");
});

test("a replacement during atomic claim is retained and never removed", async (t) => {
  const f = await fixture(t),
    { options } = await f.prepare();
  const rename = fs.rename;
  let replaced = false;
  fs.rename = async (from, to) => {
    if (!replaced && path.basename(from) === "historical.json") {
      replaced = true;
      await rename(from, path.join(f.projectRoot, "saved-original.json"));
      await fs.writeFile(from, "unexpected replacement");
    }
    return rename(from, to);
  };
  try {
    await assert.rejects(
      applyLatestOnlyRetention(options),
      /Claimed identity drift/,
    );
  } finally {
    fs.rename = rename;
  }
  const claim = (await fs.readdir(f.root)).find((name) =>
    name.startsWith(".latest-only-claim-"),
  );
  assert(claim);
  assert.equal(
    await fs.readFile(path.join(f.root, claim), "utf8"),
    "unexpected replacement",
  );
  assert.equal(
    await fs.readFile(path.join(f.projectRoot, "saved-original.json"), "utf8"),
    "old metadata",
  );
  assert.equal(
    await fs.readFile(path.join(f.root, "nested/current/movie.mp4"), "utf8"),
    "current media",
  );
});

test("an independent guard refusal and verify-only mode preserve candidates", async (t) => {
  const f = await fixture(t),
    { options } = await f.prepare();
  assert.equal(
    (await applyLatestOnlyRetention({ ...options, verifyOnly: true })).state,
    "verified",
  );
  const bytes = Buffer.from(
    'export async function guard() { return { inactive: false, mountsClear: true, provenance: "active writer" }; }',
  );
  await fs.writeFile(f.guardPath, bytes);
  await assert.rejects(
    applyLatestOnlyRetention({
      ...options,
      expectedGuardSha256: sha256(bytes),
    }),
    /inactivity/,
  );
  assert.equal(
    await fs.readFile(path.join(f.root, "historical.json"), "utf8"),
    "old metadata",
  );
});

test("keep paths cannot cross a symlink ancestor or authorize the whole repository", async (t) => {
  const f = await fixture(t);
  await fs.symlink(path.join(f.root, "nested"), path.join(f.root, "alias"));
  await assert.rejects(
    planLatestOnlyRetention({
      root: f.root,
      projectRoot: f.projectRoot,
      keepManifest: {
        version: 1,
        roots: [
          {
            path: path.join(f.root, "alias/latest.json"),
            mode: "file",
            reason: "alias",
          },
        ],
      },
    }),
    /Symlinked directory ancestor/,
  );
  await assert.rejects(
    planLatestOnlyRetention({
      root: f.projectRoot,
      projectRoot: f.projectRoot,
      externalProjectRoot: f.projectRoot,
      keepManifest: f.keepManifest,
    }),
    /whole repository/,
  );
  await assert.rejects(
    planLatestOnlyRetention({
      root: f.root,
      projectRoot: f.projectRoot,
      keepManifest: {
        version: 1,
        roots: [
          {
            path: path.join(f.root, "missing"),
            mode: "file",
            reason: "missing",
          },
        ],
      },
    }),
    { code: "ENOENT" },
  );
});

test("mountinfo detects nested same-filesystem bind mounts, including escaped paths", () => {
  const mountPoints = parseMountInfo(
    "1 0 8:1 / / rw - ext4 /dev/root rw\n2 1 8:1 /somewhere /project/build/old\\040tree rw - ext4 /dev/root rw\n",
  );
  assert.deepEqual(mountPoints, ["/", "/project/build/old tree"]);
  assert.throws(
    () => assertNoNestedMounts("/project/build", mountPoints),
    /Nested mount/,
  );
  assert.doesNotThrow(() => assertNoNestedMounts("/other/build", mountPoints));
});
