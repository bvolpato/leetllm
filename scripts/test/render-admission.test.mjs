import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { test } from "node:test";
import { spawn, execFile } from "node:child_process";
import { once } from "node:events";
import { promisify } from "node:util";
import { createInterface } from "node:readline";
import { setTimeout as delay } from "node:timers/promises";
import {
  withReservationLock,
  initializeAdmission,
  admissionStatus,
  reconcileLatestOnlyPrune,
  reserveStorage,
  settleStorage,
  enforceStorageLease,
} from "../lib/render-admission.mjs";
import { STORAGE_TARGETS, digest } from "../lib/render-storage.mjs";

async function fixture(t, available = 1024 * 1024) {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "storage-admission-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const stores = {
    root: path.join(root, "build"),
    external: path.join(root, "external"),
  };
  for (const file of Object.values(stores)) await fs.mkdir(file);
  const budget = path.join(root, "budget");
  await initializeAdmission(budget, {
    kind: "leetllm.measured-storage-budget",
    measuredAt: new Date().toISOString(),
    measurementSha256: "a".repeat(64),
    stores: Object.fromEntries(
      Object.entries(stores).map(([name, file]) => [
        name,
        {
          path: file,
          usageBytes: STORAGE_TARGETS[name] - available,
          legacyBytes: 0,
          protectedBytes: 0,
          safetyBytes: 0,
        },
      ]),
    ),
  });
  return { root, budget, stores };
}

const reconciliation = (overrides = {}) => ({
  kind: "leetllm.latest-only-prune-reconciliation",
  id: "latest-only-epoch-1",
  epochSha256: "b".repeat(64),
  externalExclusiveRemovedBytes: 32768,
  rootUsageBytes: 8192,
  rootMeasurementSha256: "c".repeat(64),
  pruneReceiptSha256: "d".repeat(64),
  ...overrides,
});

const reservationModule = new URL(
  "../lib/render-admission.mjs",
  import.meta.url,
).href;
const lockPath = (directory) => path.join(directory, "reservation.lock");

async function lockFixture(t) {
  const directory = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "reservation-test-")),
  );
  const cleanups = [];
  t.after(async () => {
    try {
      await together(cleanups.map((cleanup) => cleanup()));
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
  return { directory, cleanups };
}

async function inode(file) {
  const { dev, ino } = await fs.lstat(file, { bigint: true });
  return [dev, ino];
}

async function psField(pid, field) {
  const { stdout } = await promisify(execFile)("ps", [
    "-p",
    String(pid),
    "-o",
    field + "=",
  ]);
  const value = stdout.trim();
  if (field === "lstart")
    assert.match(value, /^\S+\s+\S+\s+\d+\s+\d+:\d+:\d+\s+\d{4}$/);
  return value;
}

function lockFailure(lock, pattern) {
  return (error) => {
    assert.match(error.message, pattern);
    assert.ok(error.message.includes(lock), error.message);
    return true;
  };
}

async function together(tasks) {
  const results = await Promise.allSettled(tasks);
  return results.map((result) => {
    if (result.status === "rejected") throw result.reason;
    return result.value;
  });
}

// The child publishes one JSON line. EOF on its private stdin releases it.
async function fixtureProcess(fixture, command, args) {
  const child = spawn(command, args, { stdio: ["pipe", "pipe", "inherit"] });
  const closed = once(child, "close");
  const lines = createInterface({ input: child.stdout });
  async function release() {
    if (!child.stdin.writableEnded) child.stdin.end();
    assert.deepEqual(await closed, [0, null]);
  }
  fixture.cleanups.push(release);
  const ready = await Promise.race([
    once(lines, "line").then(([line]) => JSON.parse(line)),
    closed.then(() => {
      throw new Error("Fixture exited before reporting readiness");
    }),
  ]);
  return { pid: child.pid, ready, release };
}

function holdReservation(fixture) {
  const program = `
    import fs from "node:fs/promises";
    import path from "node:path";
    const [moduleURL, directory] = process.argv.slice(1);
    const { withReservationLock } = await import(moduleURL);
    await withReservationLock(directory, async () => {
      const release = new Promise(resolve => process.stdin.once("end", resolve));
      process.stdin.resume();
      process.stdout.write("true\\n");
      await release;
      await fs.writeFile(path.join(directory, "count"), "1");
    });
  `;
  return fixtureProcess(fixture, process.execPath, [
    "--input-type=module",
    "-e",
    program,
    reservationModule,
    fixture.directory,
  ]);
}

test(
  "reservation lock waiters serialize after a child holds it for over five seconds",
  { timeout: 20000 },
  async (t) => {
    const fixture = await lockFixture(t);
    const { directory } = fixture;
    const owner = await holdReservation(fixture);
    const header = JSON.parse(await fs.readFile(lockPath(directory), "utf8"));
    assert.equal(header.pid, owner.pid);
    assert.equal(header.processStart, await psField(owner.pid, "lstart"));

    const count = path.join(directory, "count");
    async function increment() {
      const value = Number(await fs.readFile(count, "utf8")) + 1;
      await delay(30);
      await fs.writeFile(count, String(value));
      return value;
    }
    let bothWaiting;
    const contended = new Promise((resolve) => {
      bothWaiting = resolve;
    });
    const seen = new Set();
    const wait = (id) =>
      withReservationLock(directory, increment, {
        onContention() {
          seen.add(id);
          if (seen.size === 2) bothWaiting();
        },
      });
    const [a, b] = await together([
      wait(1),
      wait(2),
      contended.then(() => delay(5500)).then(owner.release),
    ]);
    assert.deepEqual([a, b].sort(), [2, 3]);
    assert.equal(await fs.readFile(count, "utf8"), "3");
    await assert.rejects(fs.lstat(lockPath(directory)), { code: "ENOENT" });
  },
);

test(
  "reservation lock contention callbacks can claim the released pathname and cancel a waiter",
  { timeout: 18000 },
  async (t) => {
    const fixture = await lockFixture(t);
    const { directory } = fixture;
    const lock = lockPath(directory);
    const owner = await holdReservation(fixture);
    const cancelled = new Error("cancel this waiter");
    let entered = false;
    await assert.rejects(
      withReservationLock(
        directory,
        () => {
          entered = true;
        },
        {
          async onContention() {
            await owner.release();
            await fs.writeFile(lock, "callback", { flag: "wx" });
            await fs.unlink(lock);
            throw cancelled;
          },
        },
      ),
      (error) => error === cancelled,
    );
    assert.equal(entered, false);
    assert.equal(
      await withReservationLock(directory, () => "available"),
      "available",
    );
  },
);

test(
  "reservation lock replacements get a new grace period for in-place legacy publication",
  { timeout: 25000 },
  async (t) => {
    const fixture = await lockFixture(t);
    const { directory } = fixture;
    const lock = lockPath(directory);
    const owner = await holdReservation(await lockFixture(t));
    const legacy = {
      pid: owner.pid,
      processStart: await psField(owner.pid, "lstart"),
      started: new Date().toISOString(),
    };
    await fs.writeFile(lock, "{", { flag: "wx" });
    const first = await inode(lock);
    const staged = path.join(directory, "next");
    const publisher = await fs.open(staged, "wx");
    fixture.cleanups.push(() => publisher.close());
    const second = await inode(staged);
    assert.notDeepEqual(first, second);
    let releasing = false;
    async function publishAndRelease() {
      await delay(3000);
      assert.deepEqual(await inode(lock), first);
      await fs.rename(staged, lock);
      await delay(3000);
      await publisher.writeFile(JSON.stringify(legacy));
      await delay(3500);
      assert.deepEqual(await inode(lock), second);
      releasing = true;
      await fs.unlink(lock);
    }
    const [result] = await together([
      withReservationLock(directory, () => {
        assert.ok(releasing);
        return "acquired";
      }),
      publishAndRelease(),
    ]);
    assert.equal(result, "acquired");
  },
);

test(
  "reservation lock reconciliation preserves each unverified owner's bytes and inode",
  { timeout: 25000 },
  async (t) => {
    const fixture = await lockFixture(t);
    const { directory: root } = fixture;
    const former = await holdReservation(fixture);
    const dead = {
      pid: former.pid,
      processStart: await psField(former.pid, "lstart"),
    };
    await former.release();
    await delay(1100); // ps lstart has one-second resolution.
    const hasPython = await promisify(execFile)("python3", ["-V"]).then(
      () => true,
      (error) => {
        if (error.code === "ENOENT") return false;
        throw error;
      },
    );
    const reaper = hasPython
      ? await fixtureProcess(fixture, "python3", [
          "-I",
          "-B",
          "-c",
          `
import os, select
pid = os.fork()
if pid == 0:
    os._exit(0)
try:
    print(pid, flush=True)
    select.select([0], [], [], 30)
finally:
    os.waitpid(pid, 0)
`,
        ])
      : await holdReservation(await lockFixture(t));
    let zombie;
    if (hasPython) {
      const zombiePid = reaper.ready;
      const until = performance.now() + 5000;
      while (!(await psField(zombiePid, "stat")).startsWith("Z")) {
        assert.ok(
          performance.now() < until,
          "Fixture child did not become a zombie",
        );
        await delay(20);
      }
      zombie = {
        pid: zombiePid,
        processStart: await psField(zombiePid, "lstart"),
      };
    } else {
      t.diagnostic("Python 3 is unavailable for the unreaped child fixture.");
    }
    assert.notEqual(dead.processStart, await psField(reaper.pid, "lstart"));
    const records = {
      dead: JSON.stringify(dead),
      ...(zombie && { zombie: JSON.stringify(zombie) }),
      reused: JSON.stringify({
        pid: reaper.pid,
        processStart: dead.processStart,
      }),
      pidOnly: JSON.stringify({
        pid: reaper.pid,
        at: new Date().toISOString(),
      }),
      empty: "",
      malformed: "{",
      unknown: "{}",
    };
    await together(
      Object.entries(records).map(async ([name, bytes]) => {
        const directory = path.join(root, name);
        await fs.mkdir(directory);
        const lock = lockPath(directory);
        const handle = await fs.open(lock, "wx");
        try {
          await handle.writeFile(bytes);
          const original = await inode(lock);
          const started = performance.now();
          let entered = false;
          await assert.rejects(
            withReservationLock(directory, () => {
              entered = true;
            }),
            lockFailure(lock, /explicit reconciliation/),
          );
          assert.equal(entered, false, name);
          const elapsed = performance.now() - started;
          assert.ok(elapsed >= 4950, name + " waited " + elapsed + " ms");
          assert.deepEqual(await inode(lock), original);
          assert.equal(await fs.readFile(lock, "utf8"), bytes);
        } finally {
          await handle.close();
        }
      }),
    );
  },
);

test("reservation lock release detects a different inode with identical owner bytes", async (t) => {
  const { directory } = await lockFixture(t);
  const lock = lockPath(directory);
  let bytes, replacement;
  await assert.rejects(
    withReservationLock(directory, async () => {
      bytes = await fs.readFile(lock);
      const staged = path.join(directory, "twin");
      await fs.writeFile(staged, bytes, { flag: "wx" });
      replacement = await inode(staged);
      assert.notDeepEqual(replacement, await inode(lock));
      await fs.rename(staged, lock);
    }),
    lockFailure(lock, /identity changed/),
  );
  assert.deepEqual(await inode(lock), replacement);
  assert.deepEqual(await fs.readFile(lock), bytes);
});

test("inventory counts surviving files when a directory disappears before readdir", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "live-inventory-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const claim = path.join(root, "claim");
  const kept = path.join(root, "payload");
  await fs.mkdir(claim);
  await fs.writeFile(kept, Buffer.alloc(8192, 1));
  await fs.link(kept, path.join(root, "payload-alias"));
  const expected = (await fs.stat(kept)).blocks * 512;
  assert(expected > 0);

  // Expire the claim after the scanner recognizes a directory. Let the kernel report ENOENT.
  const expireClaim = `
    import fs from "node:fs/promises";
    const readdir = fs.readdir;
    fs.readdir = async (file, ...args) => {
      if (file === ${JSON.stringify(claim)}) await fs.rmdir(file);
      return (await readdir(file, ...args)).sort();
    };
  `;
  const { stdout } = await promisify(execFile)(process.execPath, [
    "--import",
    "data:text/javascript," + encodeURIComponent(expireClaim),
    new URL("../render-storage.mjs", import.meta.url).pathname,
    "inventory",
    root,
  ]);
  assert.deepEqual(JSON.parse(stdout).roots, [{ path: root, allocatedBytes: expected }]);
  await assert.rejects(fs.lstat(claim), { code: "ENOENT" });
});

test("verified prune credit preserves live external leases and their eventual growth settlement", async (t) => {
  const GiB = 1024 ** 3;
  const f = await fixture(t, 65536);
  const file = path.join(f.budget, "budget.json");
  // An existing ledger from before the no-legacy initialization policy.
  const historical = JSON.parse(await fs.readFile(file, "utf8"));
  Object.assign(historical.measurement.stores.root, {
    usageBytes: 106 * GiB,
    legacyBytes: 105 * GiB,
    protectedBytes: GiB,
  });
  historical.occupied.root = GiB;
  await fs.writeFile(file, JSON.stringify(historical, null, 2) + "\n");
  const originalStatus = await admissionStatus(f.budget);
  assert.equal(originalStatus.stores.root.legacyMeasuredBytes, 105 * GiB);
  assert.equal(originalStatus.stores.root.chargedWorkingBytes, GiB);
  assert.equal(originalStatus.stores.root.legacyTargetAchieved, false);
  const output = path.join(f.stores.external, "active-film");
  await fs.mkdir(output);
  const payload = path.join(output, "payload");
  await fs.writeFile(payload, Buffer.alloc(4096));
  const lease = await reserveStorage(f.budget, {
    store: "external",
    bytes: 16384,
    outputs: [output],
    owner: "live-film",
  });
  assert(lease);
  await fs.appendFile(payload, Buffer.alloc(4096));
  const before = JSON.parse(await fs.readFile(file, "utf8"));
  const originalLeaseBytes = JSON.stringify(before.leases);
  const receipt = reconciliation();
  const event = await reconcileLatestOnlyPrune(f.budget, receipt);
  const after = JSON.parse(await fs.readFile(file, "utf8"));
  assert.equal(JSON.stringify(after.leases), originalLeaseBytes);
  assert.deepEqual(after.targets, STORAGE_TARGETS);
  assert.equal(after.occupied.external, before.occupied.external - 32768);
  assert.equal(after.occupied.root, 8192);
  assert.deepEqual(after.initialMeasurement, before.measurement);
  assert.equal(after.measurement.kind, "leetllm.reconciled-storage-accounting");
  assert.equal(after.measurement.fullAtomicMeasurement, false);
  assert.equal(after.measurement.initialMeasurementSha256, "a".repeat(64));
  assert.equal(
    after.measurement.initialMeasuredAt,
    before.measurement.measuredAt,
  );
  assert.equal(
    after.measurement.stores.root.measurementSha256,
    receipt.rootMeasurementSha256,
  );
  assert.equal(after.measurement.stores.root.usageBytes, 8192);
  assert.equal(after.measurement.stores.root.legacyBytes, 0);
  assert.equal(after.measurement.stores.root.protectedBytes, 8192);
  assert.equal(event.activeExternalLeasesSha256, digest(originalLeaseBytes));
  assert.equal(
    (await admissionStatus(f.budget)).stores.root.legacyTargetAchieved,
    true,
  );
  await fs.appendFile(payload, Buffer.alloc(4096));
  const settled = await settleStorage(f.budget, lease);
  assert.equal(settled.growthBytes, 8192);
  const final = JSON.parse(await fs.readFile(file, "utf8"));
  assert.equal(final.leases.length, 0);
  assert.equal(
    final.occupied.external,
    before.occupied.external - 32768 + 8192,
  );
});

test("reconciliation rejects replay by ID, epoch or prune receipt without another credit", async (t) => {
  const f = await fixture(t);
  const receipt = reconciliation();
  const results = await Promise.allSettled([
    reconcileLatestOnlyPrune(f.budget, receipt),
    reconcileLatestOnlyPrune(f.budget, receipt),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal(
    results.filter((result) => result.status === "rejected").length,
    1,
  );
  const file = path.join(f.budget, "budget.json");
  const before = await fs.readFile(file);
  for (const duplicate of [
    receipt,
    {
      ...receipt,
      epochSha256: "e".repeat(64),
      pruneReceiptSha256: "f".repeat(64),
    },
    {
      ...receipt,
      id: "different-id",
      pruneReceiptSha256: "f".repeat(64),
    },
    { ...receipt, id: "different-id", epochSha256: "e".repeat(64) },
  ]) {
    await assert.rejects(
      reconcileLatestOnlyPrune(f.budget, duplicate),
      /already credited/,
    );
    assert((await fs.readFile(file)).equals(before));
  }
});

test("active root leases, excessive credit and an over-target root rebase refuse atomically", async (t) => {
  const f = await fixture(t);
  const file = path.join(f.budget, "budget.json");
  let before = await fs.readFile(file);
  await assert.rejects(
    reconcileLatestOnlyPrune(
      f.budget,
      reconciliation({
        externalExclusiveRemovedBytes: STORAGE_TARGETS.external + 1,
      }),
    ),
    /credit exceeds/,
  );
  await assert.rejects(
    reconcileLatestOnlyPrune(
      f.budget,
      reconciliation({ rootUsageBytes: STORAGE_TARGETS.root + 1 }),
    ),
    /20 GiB target/,
  );
  assert((await fs.readFile(file)).equals(before));
  const lease = await reserveStorage(f.budget, {
    store: "root",
    bytes: 8192,
    outputs: [path.join(f.stores.root, "root-writer")],
  });
  assert(lease);
  before = await fs.readFile(file);
  await assert.rejects(
    reconcileLatestOnlyPrune(f.budget, reconciliation()),
    /active root leases/,
  );
  assert((await fs.readFile(file)).equals(before));
});

test("reconciliation validates receipt kind, hashes and bounded nonnegative byte inputs", async (t) => {
  const f = await fixture(t);
  const file = path.join(f.budget, "budget.json");
  const before = await fs.readFile(file);
  const invalid = [
    { kind: "another-kind" },
    { id: "" },
    { epochSha256: "invalid" },
    { rootMeasurementSha256: "invalid" },
    { pruneReceiptSha256: "invalid" },
  ];
  for (const field of ["externalExclusiveRemovedBytes", "rootUsageBytes"])
    for (const value of [
      -1,
      0.5,
      Infinity,
      "4096",
      Number.MAX_SAFE_INTEGER + 1,
    ])
      invalid.push({ [field]: value });
  for (const override of invalid)
    await assert.rejects(
      reconcileLatestOnlyPrune(f.budget, reconciliation(override)),
    );
  assert((await fs.readFile(file)).equals(before));
  await reconcileLatestOnlyPrune(
    f.budget,
    reconciliation({ externalExclusiveRemovedBytes: 0, rootUsageBytes: 0 }),
  );
});

test("reconcile-prune CLI requires the exact receipt SHA and keeps a live external lease", async (t) => {
  const f = await fixture(t);
  const lease = await reserveStorage(f.budget, {
    store: "external",
    bytes: 8192,
    outputs: [path.join(f.stores.external, "live-cli")],
  });
  const receiptFile = path.join(f.root, "reconciliation.json");
  const bytes = Buffer.from(JSON.stringify(reconciliation()));
  await fs.writeFile(receiptFile, bytes);
  const file = path.join(f.budget, "budget.json");
  const before = await fs.readFile(file);
  const run = promisify(execFile);
  const args = [
    new URL("../render-storage.mjs", import.meta.url).pathname,
    "reconcile-prune",
    "--budget",
    f.budget,
    "--receipt",
    receiptFile,
    "--sha256",
  ];
  await assert.rejects(
    run(process.execPath, [...args, "0".repeat(64)]),
    /Exact input JSON SHA-256/,
  );
  assert((await fs.readFile(file)).equals(before));
  const result = await run(process.execPath, [...args, digest(bytes)]);
  assert.equal(JSON.parse(result.stdout).id, "latest-only-epoch-1");
  assert.equal(
    JSON.stringify((await admissionStatus(f.budget)).leases),
    JSON.stringify([lease]),
  );
});

test("shared reservations refuse overbudget, overlapping and missing-budget admissions; settlement charges actual growth", async (t) => {
  const f = await fixture(t, 16384),
    output = path.join(f.stores.external, "film");
  await assert.rejects(
    reserveStorage(undefined, {
      store: "external",
      bytes: 1,
      outputs: [output],
    }),
    /required/,
  );
  const lease = await reserveStorage(f.budget, {
    store: "external",
    bytes: 8192,
    outputs: [output],
    owner: "first",
  });
  assert(lease);
  assert.equal(
    await reserveStorage(f.budget, {
      store: "external",
      bytes: 12288,
      outputs: [path.join(f.stores.external, "other")],
    }),
    null,
  );
  await assert.rejects(
    reserveStorage(f.budget, {
      store: "external",
      bytes: 1,
      outputs: [output],
    }),
    /already has/,
  );
  await fs.mkdir(output);
  await fs.writeFile(path.join(output, "actual"), Buffer.alloc(4096));
  const event = await settleStorage(f.budget, lease);
  assert.equal(event.growthBytes, 4096);
  assert.equal(
    (await admissionStatus(f.budget)).stores.external.availableAdmissionBytes,
    12288,
  );
  await assert.rejects(settleStorage(f.budget, lease), /Unknown or changed/);
});

test("one lease refuses overlapping roots and canonical-path aliases", async (t) => {
  const f = await fixture(t);
  const output = path.join(f.stores.external, "film");
  await fs.mkdir(output);
  const alias = path.join(f.stores.external, "alias");
  await fs.symlink(output, alias);
  for (const outputs of [
    [output, output],
    [output, path.join(output, "nested")],
    [alias],
    [path.join(alias, "new-output")],
  ]) {
    await assert.rejects(
      reserveStorage(f.budget, {
        store: "external",
        bytes: 8192,
        outputs,
      }),
      /disjoint|canonical/,
    );
    assert.equal((await admissionStatus(f.budget)).leases.length, 0);
  }
});

test("new admission ledgers cannot exclude root or external legacy usage", async (t) => {
  const f = await fixture(t);
  const measurement = JSON.parse(
    await fs.readFile(path.join(f.budget, "budget.json"), "utf8"),
  ).measurement;
  for (const name of ["root", "external"]) {
    const invalid = structuredClone(measurement);
    invalid.stores[name].usageBytes = 500 * 1024 ** 3;
    invalid.stores[name].legacyBytes = 499 * 1024 ** 3;
    const directory = path.join(f.root, `legacy-${name}`);
    await assert.rejects(
      initializeAdmission(directory, invalid),
      name === "root"
        ? /Root target covers the entire build/
        : /External archives/,
    );
    await assert.rejects(fs.stat(directory), { code: "ENOENT" });
  }
});

test("CLI init refuses a SHA-bound measurement that hides root legacy usage", async (t) => {
  const f = await fixture(t);
  const measurement = JSON.parse(
    await fs.readFile(path.join(f.budget, "budget.json"), "utf8"),
  ).measurement;
  measurement.stores.root.usageBytes = 500 * 1024 ** 3;
  measurement.stores.root.legacyBytes = 499 * 1024 ** 3;
  const bytes = Buffer.from(JSON.stringify(measurement));
  const input = path.join(f.root, "legacy-measurement.json");
  const output = path.join(f.root, "refused-cli-budget");
  await fs.writeFile(input, bytes);
  await assert.rejects(
    promisify(execFile)(process.execPath, [
      new URL("../render-storage.mjs", import.meta.url).pathname,
      "init",
      "--budget",
      output,
      "--measurement",
      input,
      "--sha256",
      digest(bytes),
    ]),
    /Root target covers the entire build/,
  );
  await assert.rejects(fs.stat(output), { code: "ENOENT" });
});

test(
  "actual child exceeding output reservation is stopped and charged",
  { timeout: 10000 },
  async (t) => {
    const f = await fixture(t),
      output = path.join(f.stores.external, "growing");
    await fs.mkdir(output);
    const lease = await reserveStorage(f.budget, {
      store: "external",
      bytes: 8192,
      outputs: [output],
    });
    const child = spawn(
      process.execPath,
      [
        "-e",
        `const fs=require('node:fs');setInterval(()=>fs.appendFileSync(process.argv[1],Buffer.alloc(4096)),10)`,
        path.join(output, "bytes"),
      ],
      { detached: true, stdio: "ignore" },
    );
    const done = once(child, "close");
    const watcher = enforceStorageLease(lease, child.pid, { intervalMs: 25 });
    const [code, signal] = await done;
    assert.equal(code, null);
    assert.equal(signal, "SIGTERM");
    await assert.rejects(watcher.stop(), /reservation exceeded/);
    const settled = await settleStorage(f.budget, lease);
    assert(settled.exceededReservation);
  },
);

test(
  "measurement errors stop an owned writer; already-exited child has no unhandled rejection",
  { timeout: 10000 },
  async (t) => {
    const f = await fixture(t),
      output = path.join(f.stores.external, "unmeasurable");
    await fs.mkdir(output);
    const lease = await reserveStorage(f.budget, {
      store: "external",
      bytes: 8192,
      outputs: [output],
    });
    await promisify(execFile)("mkfifo", [path.join(output, "unsupported")]);
    const child = spawn(process.execPath, ["-e", "setInterval(()=>{},1000)"], {
      detached: true,
      stdio: "ignore",
    });
    const done = once(child, "close"),
      watcher = enforceStorageLease(lease, child.pid, { intervalMs: 25 });
    assert.equal((await done)[1], "SIGTERM");
    await assert.rejects(watcher.stop(), /Unsupported output/);
    const short = spawn(process.execPath, ["-e", ""], { stdio: "ignore" });
    await once(short, "close");
    const observed = enforceStorageLease(
      { outputs: [], baseline: [], bytes: 1 },
      short.pid,
      { intervalMs: 10 },
    );
    await new Promise((resolve) => setTimeout(resolve, 30));
    await observed.stop();
  },
);

test("CLI runs a reserved command, settles its output and refuses an overbudget child", async (t) => {
  const f = await fixture(t, 16384);
  const cli = new URL("../render-storage.mjs", import.meta.url).pathname;
  const output = path.join(f.stores.external, "cli");
  const run = promisify(execFile);
  await run(process.execPath, [
    cli,
    "admit",
    "--budget",
    f.budget,
    "--store",
    "external",
    "--bytes",
    "8192",
    "--output",
    output,
    "--",
    process.execPath,
    "-e",
    'const fs=require("node:fs");fs.mkdirSync(process.argv[1]);fs.writeFileSync(process.argv[1]+"/result",Buffer.alloc(4096))',
    output,
  ]);
  const state = await admissionStatus(f.budget);
  assert.equal(state.leases.length, 0);
  assert.equal(state.stores.external.availableAdmissionBytes, 12288);
  const forbidden = path.join(f.stores.external, "not-started");
  await assert.rejects(
    run(process.execPath, [
      cli,
      "admit",
      "--budget",
      f.budget,
      "--store",
      "external",
      "--bytes",
      "16384",
      "--output",
      forbidden,
      "--",
      process.execPath,
      "-e",
      'require("node:fs").mkdirSync(process.argv[1])',
      forbidden,
    ]),
    /budget exhausted/,
  );
  await assert.rejects(fs.stat(forbidden), { code: "ENOENT" });
});

test("reservation remeasures an output after another writer acquires and settles it", async (t) => {
  const f = await fixture(t);
  const output = path.join(f.stores.external, "shared");
  await fs.writeFile(output, "");
  const lock = path.join(f.budget, "reservation.lock");
  const originalLink = fs.link;
  let intervened = false;
  t.mock.method(fs, "link", async (from, to) => {
    if (to === lock && !intervened) {
      intervened = true;
      const writer = `
        import fs from "node:fs/promises";
        const [module, budget, output] = process.argv.slice(1);
        const {reserveStorage, settleStorage} = await import(module);
        const lease = await reserveStorage(budget, { store: "external", bytes: 65536, outputs: [output] });
        await fs.writeFile(output, Buffer.alloc(8192, 23));
        await settleStorage(budget, lease);
      `;
      await promisify(execFile)(process.execPath, [
        "--input-type=module",
        "-e",
        writer,
        new URL("../lib/render-admission.mjs", import.meta.url).href,
        f.budget,
        output,
      ]);
    }
    return originalLink(from, to);
  });
  const lease = await reserveStorage(f.budget, {
    store: "external",
    bytes: 65536,
    outputs: [output],
  });
  const actual = (await fs.stat(output)).blocks * 512;
  assert(actual > 0);
  assert.deepEqual(lease.baseline, [actual]);
  assert.equal((await settleStorage(f.budget, lease)).growthBytes, 0);
});

test("reservation refuses an alias created below its measured ancestor while it waits", async (t) => {
  const f = await fixture(t);
  const branch = path.join(f.stores.external, "new");
  const output = path.join(branch, "several", "missing", "levels");
  const originalLink = fs.link;
  let intervened = false;
  t.mock.method(fs, "link", async (from, to) => {
    if (to === path.join(f.budget, "reservation.lock") && !intervened) {
      intervened = true;
      await fs.symlink(path.join(f.root, "uncreated-target"), branch);
    }
    return originalLink(from, to);
  });
  await assert.rejects(
    reserveStorage(f.budget, {
      store: "external",
      bytes: 8192,
      outputs: [output],
    }),
    /canonical/,
  );
  assert.deepEqual((await admissionStatus(f.budget)).leases, []);
});
