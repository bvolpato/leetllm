import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const SCANNER_SHA256 =
  "9c19eca5c448e95b5c2afc377f17a7d461dc690b0787936ca56468409f15382c";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const inside = (root, file) =>
  file === root ||
  file.startsWith(root.endsWith(path.sep) ? root : `${root}${path.sep}`);
const overlap = (left, right) => inside(left, right) || inside(right, left);

function refused(message, details) {
  const error = new Error(message);
  error.code = "RETENTION_ACTIVITY_GUARD";
  error.details = details;
  throw error;
}

function startTime(stat) {
  return stat
    .slice(stat.lastIndexOf(")") + 2)
    .trim()
    .split(/\s+/)[19];
}

async function privilegedScan(source, request) {
  const child = spawn(
    "sudo",
    [
      "-n",
      "--",
      process.execPath,
      "--input-type=module",
      "--eval",
      `${source}\nawait runFromStdin();`,
    ],
    { stdio: ["pipe", "pipe", "pipe"], timeout: 10000 },
  );
  let stdout = "";
  let stderr = "";
  let exceeded = false;
  const limit = 16 * 1024 * 1024;
  child.stdout.on("data", (chunk) => {
    if (stdout.length + chunk.length > limit) exceeded = true;
    else stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    if (stderr.length < 16384) stderr += chunk;
  });
  child.stdin.on("error", () => {});
  const completion = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code, signal }));
  });
  child.stdin.end(JSON.stringify(request));
  const result = await completion;
  if (result.code !== 0 || exceeded)
    refused("Privileged retention process scan failed", {
      ...result,
      stderr,
      exceeded,
    });
  const parsed = JSON.parse(stdout);
  assert.equal(
    parsed.processes.effectiveUid,
    0,
    "Process scanner did not acquire root privileges",
  );
  return parsed;
}

/** Refuses active or unreadable deletion scopes. It never signals processes. */
export async function guard(plan, context = {}) {
  assert.equal(process.platform, "linux", "Retention guard requires Linux");
  assert(path.isAbsolute(plan.root), "Plan root must be absolute");
  const root = path.normalize(plan.root);
  assert.notEqual(
    root,
    path.parse(root).root,
    "Filesystem root is not a retention scope",
  );
  assert.equal(await fs.realpath(root), root, "Plan root must be canonical");
  const planned = plan.candidates ?? plan.entries;
  assert(Array.isArray(planned), "Plan deletion candidates must be an array");
  const approved = new Set(
    planned.map((entry) => (typeof entry === "string" ? entry : entry.path)),
  );
  const removed = new Set(context.removed ?? []);
  for (const file of [...removed, ...(context.candidates ?? [])])
    assert(approved.has(file), "Guard context names an unplanned candidate");
  const candidates = [];
  for (const file of approved) {
    assert(
      path.isAbsolute(file) &&
        path.normalize(file) === file &&
        file !== root &&
        inside(root, file),
      "Candidate escapes plan root",
    );
    if (removed.has(file)) continue;
    assert.equal(
      await fs.realpath(path.dirname(file)),
      path.dirname(file),
      "Candidate parent traverses a symlink",
    );
    const info = await fs.lstat(file);
    assert(
      info.isDirectory() || info.isFile() || info.isSymbolicLink(),
      "Unsupported candidate filesystem type",
    );
    candidates.push({
      path: file,
      type: info.isSymbolicLink()
        ? "symlink"
        : info.isDirectory()
          ? "directory"
          : "file",
    });
  }
  if (candidates.length === 0)
    return {
      inactive: true,
      mountsClear: true,
      provenance: {
        completedAt: new Date().toISOString(),
        root,
        candidateCount: 0,
        noDeletionScope: true,
      },
    };
  assert(
    path.isAbsolute(context.guardModulePath ?? ""),
    "Guard module path is required",
  );
  const scannerPath = path.join(
    path.dirname(context.guardModulePath),
    "retention-process-scan.mjs",
  );
  const scanner = await fs.readFile(scannerPath, "utf8");
  assert.equal(
    digest(scanner),
    SCANNER_SHA256,
    "Retention scanner bytes changed",
  );
  const reader = {
    pid: process.pid,
    startTime: startTime(await fs.readFile("/proc/self/stat", "utf8")),
  };
  const startedAt = new Date().toISOString();
  const started = process.hrtime.bigint();
  const scan = await privilegedScan(scanner, { root, candidates, reader });

  // Inspect only mount records, never Docker configuration or environment values.
  const ids = (
    await exec("docker", ["ps", "--quiet"], { timeout: 15000 })
  ).stdout
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const mounts = [];
  for (const id of ids) {
    const result = await exec(
      "docker",
      ["inspect", "--format", "{{json .Mounts}}", id],
      { timeout: 15000, maxBuffer: 4 * 1024 * 1024 },
    );
    for (const mount of JSON.parse(result.stdout)) {
      if (mount.Type !== "bind") continue;
      for (const candidate of candidates)
        if (overlap(path.normalize(mount.Source), candidate.path))
          mounts.push({
            containerId: id,
            source: mount.Source,
            candidate: candidate.path,
          });
    }
  }
  assert.equal(
    digest(await fs.readFile(scannerPath)),
    SCANNER_SHA256,
    "Retention scanner changed during scan",
  );
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  const details = {
    processes: scan.processes,
    nestedMounts: scan.mounts,
    dockerBindMounts: mounts,
  };
  if (
    scan.processes.errors.length ||
    scan.processes.matches.length ||
    scan.mounts.length ||
    mounts.length
  )
    refused(
      "Retention candidates have active users, mounts, or unreadable processes",
      details,
    );
  if (elapsedMs > 10000)
    refused("Retention activity observation is older than ten seconds", {
      ...details,
      elapsedMs,
    });
  return {
    inactive: true,
    mountsClear: true,
    provenance: {
      startedAt,
      completedAt: new Date().toISOString(),
      elapsedMs,
      root,
      candidateCount: candidates.length,
      reader,
      scanner: { path: scannerPath, sha256: SCANNER_SHA256 },
      node: { path: process.execPath, version: process.version },
      dockerContainersInspected: ids.length,
      ...details,
    },
  };
}

export default guard;
