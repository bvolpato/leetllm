import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";
import {
  scanProcesses,
  mountConflicts,
  processIdentity,
  candidatePathIndex,
} from "../lib/retention-process-scan.mjs";

test("large candidate index preserves exact descendant and directory ancestor matching", async (t) => {
  const f = await fixture(t);
  const candidates = Array.from({ length: 5000 }, (_, i) => ({
    path: path.join(f.root, `candidate-${String(i).padStart(5, "0")}`),
  }));
  candidates.push({ path: f.obsolete });
  const index = candidatePathIndex(f.root, candidates);
  const inside = (root, file) =>
    file === root || file.startsWith(root + path.sep);
  for (const [value, directory] of [
    [f.root, true],
    [f.root, false],
    [f.obsolete, true],
    [path.join(f.obsolete, "held"), false],
    [f.obsolete + "-sibling", true],
    [path.dirname(f.root), true],
    [candidates[2345].path, false],
  ]) {
    const expected = candidates
      .filter(
        (c) =>
          inside(c.path, value) ||
          (directory && inside(f.root, value) && inside(value, c.path)),
      )
      .map((c) => c.path)
      .sort();
    assert.deepEqual(index.matches(value, directory).sort(), expected);
  }
  const file = path.join(f.obsolete, "held.txt");
  await fs.writeFile(file, "held");
  const child = await holder(t, file);
  const scan = await scanProcesses(
    { root: f.root, candidates },
    { onlyPids: [child.pid] },
  );
  assert.equal(scan.errors.length, 0);
  assert(
    scan.matches.some(
      (m) => m.kind === "fd" && m.path === file && m.candidate === f.obsolete,
    ),
  );
});

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "retention-process-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const obsolete = path.join(root, "obsolete");
  await fs.mkdir(obsolete);
  return { root, obsolete };
}

async function holder(t, file) {
  const child = spawn(
    process.execPath,
    [
      "-e",
      `const fs=require('node:fs');const fd=fs.openSync(process.argv[1],'r');process.stdout.write('ready');process.stdin.resume();process.stdin.on('end',()=>{fs.closeSync(fd);process.exit(0)});`,
      file,
    ],
    { stdio: ["pipe", "pipe", "inherit"] },
  );
  const closed = once(child, "close");
  await once(child.stdout, "data");
  t.after(async () => {
    child.stdin.end();
    await closed;
  });
  return child;
}

test("actual open candidate FD remains detected after its filename is deleted", async (t) => {
  const f = await fixture(t),
    file = path.join(f.obsolete, "held.txt");
  await fs.writeFile(file, "held");
  const child = await holder(t, file);
  await fs.unlink(file);
  const scan = await scanProcesses(
    { root: f.root, candidates: [{ path: f.obsolete }] },
    { onlyPids: [child.pid] },
  );
  assert.equal(scan.errors.length, 0);
  assert(
    scan.matches.some(
      (m) => m.pid === child.pid && m.kind === "fd" && m.path === file,
    ),
  );
});

test("outside target of a candidate symlink and noncandidate sibling do not block", async (t) => {
  const f = await fixture(t),
    outside = path.join(f.root, "kept.txt"),
    alias = path.join(f.obsolete, "alias");
  await fs.writeFile(outside, "kept");
  await fs.symlink(outside, alias);
  const child = await holder(t, outside);
  const scan = await scanProcesses(
    { root: f.root, candidates: [{ path: alias, type: "symlink" }] },
    { onlyPids: [child.pid] },
  );
  assert.equal(scan.errors.length, 0);
  assert.deepEqual(scan.matches, []);
});

test("a conventional future-read path argument blocks without an open candidate FD", async (t) => {
  const f = await fixture(t);
  const child = spawn(
    process.execPath,
    [
      "-e",
      "process.stdout.write('ready');process.stdin.resume();",
      "--",
      `--root=${f.obsolete}`,
    ],
    { stdio: ["pipe", "pipe", "inherit"] },
  );
  const closed = once(child, "close");
  await once(child.stdout, "data");
  t.after(async () => {
    child.stdin.end();
    await closed;
  });
  const scan = await scanProcesses(
    { root: f.root, candidates: [{ path: f.obsolete }] },
    { onlyPids: [child.pid] },
  );
  assert.equal(scan.errors.length, 0);
  assert(
    scan.matches.some((m) => m.kind === "argv-path" && m.path === f.obsolete),
  );
});

test("code, URL and prose arguments mentioning a candidate are not filesystem references", async (t) => {
  const f = await fixture(t);
  const code = `const label=${JSON.stringify(f.obsolete)};process.stdout.write('ready');process.stdin.resume();`;
  const child = spawn(
    process.execPath,
    [
      "-e",
      code,
      "--",
      `https://example.invalid${f.obsolete}`,
      `--label=see ${f.obsolete}`,
    ],
    { stdio: ["pipe", "pipe", "inherit"] },
  );
  const closed = once(child, "close");
  await once(child.stdout, "data");
  t.after(async () => {
    child.stdin.end();
    await closed;
  });
  const scan = await scanProcesses(
    { root: f.root, candidates: [{ path: f.obsolete }] },
    { onlyPids: [child.pid] },
  );
  assert.equal(scan.errors.length, 0);
  assert.deepEqual(scan.matches, []);
});

test("an actual directory FD reading the plan root blocks its descendant candidate", async (t) => {
  const f = await fixture(t);
  const child = await holder(t, f.root);
  const scan = await scanProcesses(
    { root: f.root, candidates: [{ path: f.obsolete }] },
    { onlyPids: [child.pid] },
  );
  assert.equal(scan.errors.length, 0);
  assert(
    scan.matches.some(
      (m) => m.kind === "fd" && m.path === f.root && m.candidate === f.obsolete,
    ),
  );
});

test("nested mounts and an ancestor mount inside the plan root block candidates", () => {
  const root = "/tmp/retention",
    candidates = [{ path: `${root}/old/data` }];
  const text = `1 0 0:1 / / rw - ext4 /dev/root rw\n2 1 0:2 / /tmp/retention/old rw - tmpfs tmpfs rw\n3 1 0:3 / /elsewhere rw - tmpfs tmpfs rw\n`;
  assert.deepEqual(mountConflicts(root, candidates, text), [
    { candidate: candidates[0].path, mount: `${root}/old` },
  ]);
  assert.throws(() => mountConflicts(root, candidates, "broken"), /Malformed/);
});

test("a live unreadable process view fails closed and reader identity is exact", async (t) => {
  const f = await fixture(t),
    fake = path.join(f.root, "proc");
  await fs.mkdir(path.join(fake, String(process.pid)), { recursive: true });
  const stat = await fs.readFile("/proc/self/stat", "utf8");
  await fs.writeFile(path.join(fake, String(process.pid), "stat"), stat);
  const pid = 987654;
  await fs.mkdir(path.join(fake, String(pid)));
  await fs.writeFile(
    path.join(fake, String(pid), "stat"),
    stat.replace(/^\d+/, String(pid)),
  );
  const scan = await scanProcesses(
    { root: f.root, candidates: [{ path: f.obsolete }] },
    { procRoot: fake, onlyPids: [pid] },
  );
  assert(scan.errors.some((e) => e.pid === pid && e.kind === "maps"));
  const own = processIdentity(stat);
  await assert.rejects(
    scanProcesses(
      {
        root: f.root,
        candidates: [{ path: f.obsolete }],
        reader: { pid: process.pid, startTime: `${own.startTime}9` },
      },
      { procRoot: fake, onlyPids: [] },
    ),
    /exact live scanner ancestor/,
  );
});
