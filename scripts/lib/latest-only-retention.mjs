import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const KIND = "leetllm.latest-only-retention-plan";
const inside = (parent, child) =>
  child === parent || child.startsWith(parent + path.sep);

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fileType(stat) {
  if (stat.isDirectory()) return "directory";
  if (stat.isFile()) return "file";
  if (stat.isSymbolicLink()) return "symlink";
  return "special";
}

async function identity(file) {
  const stat = await fs.lstat(file, { bigint: true });
  return {
    dev: String(stat.dev),
    ino: String(stat.ino),
    type: fileType(stat),
    ctimeNs: String(stat.ctimeNs),
  };
}

function sameIdentity(actual, expected, checkTime = true) {
  return ["dev", "ino", "type", ...(checkTime ? ["ctimeNs"] : [])].every(
    (key) => actual[key] === expected[key],
  );
}

async function canonicalDirectory(directory) {
  assert(path.isAbsolute(directory), "Directory must be absolute");
  const normalized = path.resolve(directory);
  assert.equal(
    await fs.realpath(normalized),
    normalized,
    `Symlinked directory ancestor is forbidden: ${directory}`,
  );
  assert.equal((await identity(normalized)).type, "directory");
  return normalized;
}

async function allowedRoot({
  root,
  projectRoot = process.cwd(),
  externalProjectRoot,
}) {
  const project = await canonicalDirectory(projectRoot);
  const canonical = await canonicalDirectory(root);
  assert(
    ![path.parse(canonical).root, os.homedir(), project].includes(canonical),
    "Refusing filesystem root, home directory, or whole repository",
  );
  const build = path.join(project, "build");
  const external = externalProjectRoot
    ? await canonicalDirectory(externalProjectRoot)
    : null;
  assert(
    canonical === build ||
      (canonical === external && !inside(canonical, project)),
    "Root must be this project's build directory or an explicitly allowed external project root",
  );
  return canonical;
}

export function parseMountInfo(text) {
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const fields = line.split(" ");
      assert(fields.length >= 10 && fields.includes("-"), "Invalid mountinfo");
      return fields[4].replace(/\\([0-7]{3})/g, (_, octal) =>
        String.fromCharCode(Number.parseInt(octal, 8)),
      );
    });
}

export function assertNoNestedMounts(root, mountPoints) {
  const nested = mountPoints.filter(
    (point) => point !== root && inside(root, point),
  );
  assert.equal(
    nested.length,
    0,
    `Nested mount beneath retention root: ${nested.join(", ")}`,
  );
}

async function checkMounts(root) {
  assert.equal(
    process.platform,
    "linux",
    "Guarded removal requires Linux mountinfo",
  );
  assertNoNestedMounts(
    root,
    parseMountInfo(await fs.readFile("/proc/self/mountinfo", "utf8")),
  );
}

function validatePlanShape(plan) {
  assert.equal(plan.kind, KIND, "Unsupported retention plan");
  assert.equal(plan.version, 1, "Unsupported retention plan version");
  assert(
    Array.isArray(plan.keep) && plan.keep.length,
    "At least one keep path is required",
  );
  assert(Array.isArray(plan.candidates) && Array.isArray(plan.ancestors));
  const seen = new Set();
  for (const item of [...plan.keep, ...plan.ancestors, ...plan.candidates]) {
    assert(
      path.isAbsolute(item.path) && item.path === path.resolve(item.path),
      "Plan path must be canonical and absolute",
    );
    assert(inside(plan.root, item.path), "Plan path escapes retention root");
    assert(
      item.identity &&
        ["dev", "ino", "ctimeNs", "type"].every(
          (key) => typeof item.identity[key] === "string",
        ),
      "Missing plan identity",
    );
  }
  for (const item of plan.candidates) {
    assert(item.path !== plan.root, "Candidate cannot be retention root");
    assert(!seen.has(item.path), "Duplicate retention candidate");
    seen.add(item.path);
    assert(
      !plan.keep.some(
        (keep) => inside(item.path, keep.path) || inside(keep.path, item.path),
      ),
      "Candidate overlaps a keep path",
    );
    assert(
      !plan.candidates.some(
        (other) => other !== item && inside(item.path, other.path),
      ),
      "Overlapping retention candidates",
    );
  }
}

export async function planLatestOnlyRetention(options) {
  const root = await allowedRoot(options);
  const input = options.keepManifest;
  assert.equal(input.version, 1, "Keep manifest version must be 1");
  const requested = input.roots ?? input.keep;
  assert(
    Array.isArray(requested) && requested.length,
    "At least one keep path is required",
  );
  const keep = [];
  for (const item of requested) {
    assert(path.isAbsolute(item.path), "Keep path must be absolute");
    const file = path.resolve(item.path);
    assert(inside(root, file), "Keep path escapes retention root");
    assert(
      ["tree", "file", "symlink"].includes(item.mode),
      "Unknown keep mode",
    );
    assert(
      typeof item.reason === "string" && item.reason.trim(),
      "Keep reason is required",
    );
    await canonicalDirectory(path.dirname(file));
    const record = await identity(file);
    assert.equal(
      record.type,
      item.mode === "tree" ? "directory" : item.mode,
      `Keep mode does not match ${file}`,
    );
    assert(!keep.some((other) => other.path === file), "Duplicate keep path");
    keep.push({
      path: file,
      mode: item.mode,
      reason: item.reason,
      identity: record,
    });
  }
  await checkMounts(root);
  const ancestors = [],
    candidates = [];
  async function visit(directory) {
    if (keep.some((item) => item.path === directory && item.mode === "tree"))
      return;
    ancestors.push({ path: directory, identity: await identity(directory) });
    for (const name of (await fs.readdir(directory)).sort()) {
      const file = path.join(directory, name);
      if (keep.some((item) => item.path === file)) continue;
      if (keep.some((item) => inside(file, item.path))) {
        assert.equal(
          (await identity(file)).type,
          "directory",
          "Keep ancestor must be a real directory",
        );
        await visit(file);
      } else candidates.push({ path: file, identity: await identity(file) });
    }
  }
  await visit(root);
  const plan = {
    kind: KIND,
    version: 1,
    createdAt: new Date().toISOString(),
    root,
    rootIdentity: await identity(root),
    keep,
    ancestors,
    candidates,
    accounting:
      "No storage credit is claimed. Remeasure after removal; hardlink aliases are not scanned.",
  };
  validatePlanShape(plan);
  await assertPlanCurrent(plan, candidates);
  return plan;
}

async function assertPlanCurrent(
  plan,
  candidates,
  expectedIdentities = new Map(),
) {
  assert(
    sameIdentity(await identity(plan.root), plan.rootIdentity, false),
    "Retention root identity drift",
  );
  await canonicalDirectory(plan.root);
  for (const item of [...plan.keep, ...plan.ancestors]) {
    await canonicalDirectory(path.dirname(item.path));
    assert(
      sameIdentity(await identity(item.path), item.identity, false),
      `Keep or ancestor identity drift: ${item.path}`,
    );
  }
  for (const item of candidates) {
    await canonicalDirectory(path.dirname(item.path));
    assert(
      sameIdentity(
        await identity(item.path),
        expectedIdentities.get(item.path) ?? item.identity,
      ),
      `Candidate identity drift: ${item.path}`,
    );
  }
}

async function readHashed(file, expected, label) {
  assert(
    /^[a-f0-9]{64}$/.test(expected ?? ""),
    `Exact ${label} SHA-256 is required`,
  );
  const bytes = await fs.readFile(file);
  assert.equal(sha256(bytes), expected, `${label} SHA-256 mismatch`);
  return bytes;
}

async function openDirectoryWithoutSymlinks(directory) {
  let handle = await fs.open("/", constants.O_RDONLY | constants.O_DIRECTORY);
  try {
    for (const segment of directory.split(path.sep).filter(Boolean)) {
      const next = await fs.open(
        `/proc/self/fd/${handle.fd}/${segment}`,
        constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
      );
      await handle.close();
      handle = next;
    }
    return handle;
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function checkedGuard(guard, plan, context) {
  const result = await guard(structuredClone(plan), context);
  assert(
    result?.inactive === true,
    "Independent guard did not establish inactivity",
  );
  assert(
    result.mountsClear === true,
    "Independent guard did not establish clear mounts",
  );
  assert(
    result.provenance &&
      (typeof result.provenance === "string" ||
        typeof result.provenance === "object"),
    "Independent guard provenance is required",
  );
  return result;
}

export async function applyLatestOnlyRetention(options) {
  const plan = JSON.parse(
    await readHashed(options.planPath, options.expectedPlanSha256, "plan"),
  );
  validatePlanShape(plan);
  assert.equal(await allowedRoot({ ...options, root: plan.root }), plan.root);
  const guardBytes = await readHashed(
    options.guardPath,
    options.expectedGuardSha256,
    "guard",
  );
  // The reviewed module is loaded from the exact bytes that were hashed.
  const { guard } = await import(
    `data:text/javascript;base64,${guardBytes.toString("base64")}`
  );
  assert.equal(
    typeof guard,
    "function",
    "Guard module must export guard(plan)",
  );
  const guardModulePath = await fs.realpath(options.guardPath);
  const observe = (context) =>
    checkedGuard(guard, plan, { guardModulePath, ...context });
  const batchSize = options.batchSize ?? 32;
  assert(
    Number.isSafeInteger(batchSize) && batchSize > 0 && batchSize <= 1024,
    "Batch size must be between 1 and 1024",
  );
  await assertPlanCurrent(plan, plan.candidates);
  await checkMounts(plan.root);
  const guardResults = [await observe({ phase: "preflight" })];
  await assertPlanCurrent(plan, plan.candidates);
  await checkMounts(plan.root);
  if (options.verifyOnly)
    return {
      state: "verified",
      planSha256: options.expectedPlanSha256,
      candidates: plan.candidates.length,
      guardResults,
    };
  const { stdout } = await exec("/usr/bin/rm", ["--version"]);
  assert(stdout.startsWith("rm (GNU coreutils)"), "GNU rm is required");
  const groups = new Map();
  const sharedFiles = new Map();
  const inodeKey = (item) => `${item.identity.dev}:${item.identity.ino}`;
  for (const item of plan.candidates) {
    const parent = path.dirname(item.path);
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(item);
    if (item.identity.type === "file") {
      const key = inodeKey(item);
      if (!sharedFiles.has(key)) sharedFiles.set(key, []);
      sharedFiles.get(key).push(item);
    }
  }
  for (const [key, items] of sharedFiles)
    if (items.length < 2) sharedFiles.delete(key);
  const expectedIdentities = new Map();
  function updateSharedCtime(item, current) {
    for (const alias of sharedFiles.get(inodeKey(item)) ?? [])
      expectedIdentities.set(alias.path, {
        ...alias.identity,
        ctimeNs: current.ctimeNs,
      });
  }
  const removed = [];
  const removedPaths = new Set();
  for (const [parent, items] of groups) {
    for (let offset = 0; offset < items.length; offset += batchSize) {
      const batch = items.slice(offset, offset + batchSize);
      guardResults.push(
        await observe({
          phase: "before-batch",
          candidates: batch.map((item) => item.path),
          removed: [...removed],
        }),
      );
      await assertPlanCurrent(plan, batch, expectedIdentities);
      await checkMounts(plan.root);
      const directory = await openDirectoryWithoutSymlinks(parent);
      const claims = [];
      try {
        const parentRecord =
          parent === plan.root
            ? plan.rootIdentity
            : plan.ancestors.find((item) => item.path === parent)?.identity;
        assert(parentRecord, "Missing candidate parent identity");
        const stat = await directory.stat({ bigint: true });
        assert(
          String(stat.dev) === parentRecord.dev &&
            String(stat.ino) === parentRecord.ino,
          "Candidate parent identity drift",
        );
        const anchored = `/proc/self/fd/${directory.fd}`;
        for (const item of batch) {
          const original = path.join(anchored, path.basename(item.path));
          assert(
            sameIdentity(
              await identity(original),
              expectedIdentities.get(item.path) ?? item.identity,
            ),
            `Candidate identity drift: ${item.path}`,
          );
          const name = `.latest-only-claim-${randomUUID()}`;
          const claimed = path.join(anchored, name);
          await fs.rename(original, claimed);
          claims.push({ original: item.path, name, claimed, item });
          const claimedIdentity = await identity(claimed);
          assert(
            sameIdentity(claimedIdentity, item.identity, false),
            `Claimed identity drift; retained ${parent}/${name}`,
          );
          updateSharedCtime(item, claimedIdentity);
        }
        await checkMounts(plan.root);
        await exec(
          "/usr/bin/rm",
          [
            "--recursive",
            "--force",
            "--one-file-system",
            "--preserve-root=all",
            "--",
            ...claims.map((claim) => `./${claim.name}`),
          ],
          { cwd: `/proc/${process.pid}/fd/${directory.fd}` },
        );
        for (const claim of claims) {
          await assert.rejects(fs.lstat(claim.claimed), { code: "ENOENT" });
          removed.push(claim.original);
          removedPaths.add(claim.original);
        }
        // Unlinking one hardlink changes ctime for its remaining candidate aliases.
        for (const key of new Set(
          claims.map((claim) => inodeKey(claim.item)),
        )) {
          const remaining = sharedFiles
            .get(key)
            ?.find((item) => !removedPaths.has(item.path));
          if (!remaining) continue;
          const current = await identity(remaining.path);
          assert(
            sameIdentity(current, remaining.identity, false),
            `Candidate identity drift: ${remaining.path}`,
          );
          updateSharedCtime(remaining, current);
        }
      } catch (error) {
        error.message += `; any claimed entries are retained for reconciliation: ${claims.map((claim) => path.join(parent, claim.name)).join(", ")}`;
        throw error;
      } finally {
        await directory.close();
      }
    }
  }
  return {
    state: "removed",
    planSha256: options.expectedPlanSha256,
    removed,
    guardResults,
    accounting: plan.accounting,
  };
}
