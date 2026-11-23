import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const inside = (parent, child) =>
  child === parent || child.startsWith(parent + path.sep);

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function candidatePaths(plan) {
  assert(
    path.isAbsolute(plan.root) && path.resolve(plan.root) === plan.root,
    "Plan root must be absolute and canonical",
  );
  assert.equal(
    await fs.realpath(plan.root),
    plan.root,
    "Plan root crosses a symlink",
  );
  assert(Array.isArray(plan.candidates), "Plan candidates are required");
  const paths = plan.candidates.map((item) => item.path).sort();
  for (let index = 0; index < paths.length; index++) {
    const file = paths[index];
    assert(
      path.isAbsolute(file) && path.resolve(file) === file,
      "Candidate must be absolute and canonical",
    );
    assert(
      file !== plan.root && inside(plan.root, file),
      "Candidate escapes retention root",
    );
    assert.equal(
      await fs.realpath(path.dirname(file)),
      path.dirname(file),
      "Candidate ancestor crosses a symlink",
    );
    assert(
      !paths.some(
        (other, otherIndex) => otherIndex !== index && inside(other, file),
      ),
      "Overlapping retention candidates",
    );
    for (const keep of plan.keep ?? [])
      assert(
        !inside(file, keep.path) && !inside(keep.path, file),
        "Candidate overlaps a keep path",
      );
  }
  return paths;
}

function observeLine(line, inodes) {
  const fields = line.split("\t");
  assert(
    fields.length === 4 && fields.every((field) => /^\d+$/.test(field)),
    "Invalid GNU find allocation metadata",
  );
  const [device, inode, linksText, blocksText] = fields;
  const links = BigInt(linksText),
    blocks = BigInt(blocksText);
  assert(links > 0n && BigInt(inode) > 0n, "Invalid inode link metadata");
  const key = `${device}:${inode}`;
  const previous = inodes.get(key);
  if (previous) {
    assert(
      previous.links === links && previous.blocks === blocks,
      "Inconsistent inode link or allocation metadata",
    );
    previous.names += 1n;
    assert(
      previous.names <= links,
      "Observed inode names exceed its recorded link count",
    );
  } else inodes.set(key, { links, blocks, names: 1n });
}

async function scan(paths, inodes) {
  if (!paths.length) return;
  const child = spawn(
    "/usr/bin/find",
    ["-P", ...paths, "-xdev", "-type", "f", "-printf", "%D\t%i\t%n\t%b\n"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let stderr = "",
    parseError;
  child.stderr.on("data", (bytes) => {
    stderr = (stderr + bytes.toString()).slice(-65536);
  });
  const finished = new Promise((resolve) => {
    child.once("error", (error) => resolve({ error }));
    child.once("close", (code, signal) => resolve({ code, signal }));
  });
  for await (const line of createInterface({
    input: child.stdout,
    crlfDelay: Infinity,
  })) {
    if (parseError) continue;
    try {
      observeLine(line, inodes);
    } catch (error) {
      parseError = error;
    }
  }
  const result = await finished;
  if (result.error) throw result.error;
  assert(
    result.code === 0 && !result.signal,
    `GNU find allocation scan failed (${result.code ?? result.signal}): ${stderr.trim()}`,
  );
  if (parseError) throw parseError;
}

function exactNumber(value) {
  assert(
    value <= BigInt(Number.MAX_SAFE_INTEGER),
    "Allocation total exceeds exact JSON number range",
  );
  return Number(value);
}

export async function accountRetentionPlan(plan, { planSha256 } = {}) {
  assert(
    /^[a-f0-9]{64}$/.test(planSha256 ?? ""),
    "Exact plan SHA-256 is required",
  );
  const paths = await candidatePaths(plan);
  const inodes = new Map();
  // Keep each child argv bounded while sharing inode groups across every batch.
  for (let offset = 0; offset < paths.length; offset += 128)
    await scan(paths.slice(offset, offset + 128), inodes);
  let regularExclusiveBytes = 0n,
    uncreditedOutsideAliasBytes = 0n,
    regularFileNames = 0n;
  for (const record of inodes.values()) {
    regularFileNames += record.names;
    const bytes = record.blocks * 512n;
    if (record.names === record.links) regularExclusiveBytes += bytes;
    else uncreditedOutsideAliasBytes += bytes;
  }
  return {
    kind: "leetllm.retention-allocation",
    version: 1,
    observedAt: new Date().toISOString(),
    planSha256,
    root: plan.root,
    candidatePathDigest: digest(JSON.stringify(paths)),
    candidateCount: paths.length,
    regularFileNames: exactNumber(regularFileNames),
    regularInodeCount: inodes.size,
    regularExclusiveBytes: exactNumber(regularExclusiveBytes),
    uncreditedOutsideAliasBytes: exactNumber(uncreditedOutsideAliasBytes),
    scope:
      "Regular-file allocated blocks whose full recorded hardlink name count occurs within all candidate roots. Metadata observation only; no claim of net filesystem reclamation. Bind this receipt to successful removal of every candidate before using its credit.",
  };
}
