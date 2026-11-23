import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { execFile } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { STORAGE_TARGETS, digest } from "./render-storage.mjs";

export const DEFAULT_RENDER_RESERVATION = 2 * 1024 ** 3;
export const DEFAULT_AUDIO_RESERVATION = 512 * 1024 ** 2;
const inside = (root, file) =>
  file === root || file.startsWith(`${root}${path.sep}`);
const read = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
async function atomic(file, value) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  const handle = await fs.open(temporary, "wx");
  try {
    await handle.writeFile(JSON.stringify(value, null, 2) + "\n");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(temporary, file);
  const parent = await fs.open(path.dirname(file), "r");
  try {
    await parent.sync();
  } finally {
    await parent.close();
  }
}
const run = promisify(execFile);
const publicationGraceMs = 5000;
const ownerProbeIntervalMs = 1000;

async function processStart(pid) {
  try {
    const { stdout } = await run("ps", [
      "-p",
      String(pid),
      "-o",
      "pid=,lstart=,stat=",
    ]);
    const row = stdout
      .trim()
      .match(/^(\d+)\s+(\S+\s+\S+\s+\d+\s+\d+:\d+:\d+\s+\d+)\s+(\S+)$/);
    if (row && Number(row[1]) === pid && !/^[ZX]/i.test(row[3])) return row[2];
  } catch (error) {
    if (error.code !== 1) throw error;
  }
  return null;
}

async function hasLiveOwner(handle) {
  // A legacy writer can publish its record in place. Bound the read and start at byte zero.
  const buffer = Buffer.alloc(4097);
  const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
  if (bytesRead === buffer.length) return false;
  let owner;
  try {
    owner = JSON.parse(buffer.toString("utf8", 0, bytesRead));
  } catch (error) {
    if (error instanceof SyntaxError) return false;
    throw error;
  }
  if (
    !Number.isSafeInteger(owner?.pid) ||
    owner.pid <= 0 ||
    typeof owner.processStart !== "string" ||
    !owner.processStart
  )
    return false;
  return (await processStart(owner.pid)) === owner.processStart;
}

async function lstatIfPresent(file) {
  try {
    return await fs.lstat(file, { bigint: true });
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function sameInode(left, right) {
  return left && right && left.dev === right.dev && left.ino === right.ino;
}

let ownProcessStart;

export async function withReservationLock(
  directory,
  action,
  { onContention } = {},
) {
  const lock = path.resolve(directory, "reservation.lock");
  const reconciliationError = `Budget ledger is locked; unknown/stale locks require explicit reconciliation: ${lock}`;
  const staged = `${lock}.${randomUUID()}.tmp`;
  ownProcessStart ??= await processStart(process.pid);
  assert(ownProcessStart, `Cannot verify this reservation lock owner: ${lock}`);
  const handle = await fs.open(staged, "wx", 0o600);
  let acquired = false;
  let reader, observed, nextOwnerProbe;
  try {
    await handle.writeFile(
      JSON.stringify({
        pid: process.pid,
        processStart: ownProcessStart,
        at: new Date().toISOString(),
      }),
    );
    await handle.sync();
    for (;;) {
      try {
        await fs.link(staged, lock);
        acquired = true;
        break;
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
      await onContention?.();
      const current = await lstatIfPresent(lock);
      if (!current) continue;
      if (!sameInode(current, observed)) {
        await reader?.close();
        reader = observed = undefined;
        if (!current.isFile()) {
          if (!sameInode(current, await lstatIfPresent(lock))) continue;
          throw new Error(reconciliationError);
        }
        try {
          reader = await fs.open(
            lock,
            constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
          );
        } catch (error) {
          if (!sameInode(current, await lstatIfPresent(lock))) continue;
          throw new Error(reconciliationError, { cause: error });
        }
        // Keep the inode open so a successor cannot inherit its grace deadline through inode reuse.
        observed = await reader.stat({ bigint: true });
        nextOwnerProbe = performance.now() + publicationGraceMs;
        if (!sameInode(current, observed)) {
          observed = undefined;
          continue;
        }
      }
      if (performance.now() >= nextOwnerProbe) {
        let live, cause;
        try {
          live = await hasLiveOwner(reader);
        } catch (error) {
          cause = error;
        }
        if (!sameInode(observed, await lstatIfPresent(lock))) continue;
        if (!live) throw new Error(reconciliationError, { cause });
        nextOwnerProbe = performance.now() + ownerProbeIntervalMs;
      }
      await delay(50 + Math.floor(Math.random() * 100));
    }
    return await action();
  } finally {
    try {
      if (acquired) {
        const owned = await handle.stat({ bigint: true });
        assert(
          sameInode(owned, await lstatIfPresent(lock)),
          `Reservation lock identity changed; explicit reconciliation required: ${lock}`,
        );
        await fs.unlink(lock);
      }
    } finally {
      await Promise.all([fs.unlink(staged), handle.close(), reader?.close()]);
    }
  }
}

export async function allocatedBytes(directory) {
  const seen = new Set();
  let bytes = 0;
  async function visit(file) {
    let info;
    try {
      info = await fs.lstat(file, { bigint: true });
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    if (info.isSymbolicLink()) return;
    if (info.isDirectory()) {
      let names;
      try {
        names = await fs.readdir(file);
      } catch (error) {
        if (error.code === "ENOENT") return;
        throw error;
      }
      for (const name of names) await visit(path.join(file, name));
      return;
    }
    assert(info.isFile(), `Unsupported output entry: ${file}`);
    const key = `${info.dev}:${info.ino}`;
    if (!seen.has(key)) {
      seen.add(key);
      bytes += Number(info.blocks * 512n);
    }
  }
  await visit(directory);
  return bytes;
}

export async function initializeAdmission(directory, configuration) {
  assert.equal(configuration.kind, "leetllm.measured-storage-budget");
  assert.match(configuration.measurementSha256 ?? "", /^[a-f0-9]{64}$/);
  assert(
    configuration.measuredAt &&
      Number.isFinite(Date.parse(configuration.measuredAt)),
  );
  for (const name of ["root", "external"]) {
    const store = configuration.stores[name];
    for (const field of [
      "usageBytes",
      "legacyBytes",
      "protectedBytes",
      "safetyBytes",
    ])
      assert(
        Number.isSafeInteger(store[field]) && store[field] >= 0,
        `Missing measured budget field: ${name}.${field}`,
      );
    assert(
      store.legacyBytes <= store.usageBytes &&
        store.protectedBytes <= store.usageBytes,
    );
    assert.equal(
      store.legacyBytes,
      0,
      name === "external"
        ? "External archives count against the external working budget"
        : "Root target covers the entire build; legacy bytes cannot be excluded",
    );
    assert.equal(await fs.realpath(store.path), path.resolve(store.path));
  }
  await fs.mkdir(directory);
  await atomic(path.join(directory, "budget.json"), {
    kind: "leetllm.storage-admission-ledger",
    version: 1,
    initializedAt: new Date().toISOString(),
    measurement: configuration,
    targets: STORAGE_TARGETS,
    occupied: Object.fromEntries(
      ["root", "external"].map((name) => [
        name,
        configuration.stores[name].usageBytes -
          configuration.stores[name].legacyBytes,
      ]),
    ),
    leases: [],
    events: [],
  });
}

export async function admissionStatus(directory) {
  const state = await read(path.join(directory, "budget.json"));
  assert.equal(state.kind, "leetllm.storage-admission-ledger");
  const stores = {};
  for (const name of ["root", "external"]) {
    const measured = state.measurement.stores[name];
    const reservedBytes = state.leases
      .filter((lease) => lease.store === name)
      .reduce((sum, lease) => sum + lease.bytes, 0);
    stores[name] = {
      path: measured.path,
      targetBytes: state.targets[name],
      chargedWorkingBytes: state.occupied[name],
      reservedBytes,
      safetyBytes: measured.safetyBytes,
      protectedMeasuredBytes: measured.protectedBytes,
      legacyMeasuredBytes: measured.legacyBytes,
      legacyTargetAchieved:
        measured.legacyBytes === 0 &&
        state.occupied[name] <= state.targets[name],
      availableAdmissionBytes:
        state.targets[name] -
        state.occupied[name] -
        reservedBytes -
        measured.safetyBytes,
    };
  }
  return {
    stores,
    leases: state.leases,
    unknownBudgetRefusesAdmission: true,
    scope:
      "Cooperating writers in declared roots; not an operating-system filesystem quota",
  };
}

export async function reconcileLatestOnlyPrune(directory, receipt) {
  receipt = structuredClone(receipt);
  assert.equal(receipt?.kind, "leetllm.latest-only-prune-reconciliation");
  assert(
    typeof receipt.id === "string" &&
      receipt.id.trim() === receipt.id &&
      receipt.id.length > 0 &&
      receipt.id.length <= 200,
    "A bounded reconciliation ID is required",
  );
  for (const field of [
    "epochSha256",
    "rootMeasurementSha256",
    "pruneReceiptSha256",
  ])
    assert.match(receipt[field] ?? "", /^[a-f0-9]{64}$/, `Invalid ${field}`);
  for (const field of ["externalExclusiveRemovedBytes", "rootUsageBytes"])
    assert(
      Number.isSafeInteger(receipt[field]) && receipt[field] >= 0,
      `Invalid nonnegative byte count: ${field}`,
    );
  return withReservationLock(directory, async () => {
    const file = path.join(directory, "budget.json");
    const state = await read(file);
    assert.equal(state.kind, "leetllm.storage-admission-ledger");
    assert.deepEqual(state.targets, STORAGE_TARGETS, "Storage targets changed");
    assert(
      !state.events.some(
        (event) =>
          event.kind === receipt.kind &&
          (event.id === receipt.id ||
            event.epochSha256 === receipt.epochSha256 ||
            event.pruneReceiptSha256 === receipt.pruneReceiptSha256),
      ),
      "Prune reconciliation ID, epoch or receipt was already credited",
    );
    assert(
      !state.leases.some((lease) => lease.store === "root"),
      "Cannot rebase root usage with active root leases",
    );
    assert(
      Number.isSafeInteger(state.occupied.external) &&
        state.occupied.external >= receipt.externalExclusiveRemovedBytes,
      "Prune credit exceeds charged external occupancy",
    );
    assert(
      receipt.rootUsageBytes <= state.targets.root,
      "Reconciled root usage exceeds the 20 GiB target",
    );
    const at = new Date().toISOString();
    const before = { ...state.occupied };
    state.initialMeasurement ??= structuredClone(state.measurement);
    state.occupied.external -= receipt.externalExclusiveRemovedBytes;
    state.occupied.root = receipt.rootUsageBytes;
    state.measurement = {
      kind: "leetllm.reconciled-storage-accounting",
      initialMeasurementSha256: state.initialMeasurement.measurementSha256,
      initialMeasuredAt: state.initialMeasurement.measuredAt,
      reconciledAt: at,
      fullAtomicMeasurement: false,
      stores: {
        ...state.measurement.stores,
        root: {
          ...state.measurement.stores.root,
          usageBytes: receipt.rootUsageBytes,
          legacyBytes: 0,
          protectedBytes: receipt.rootUsageBytes,
          measurementSha256: receipt.rootMeasurementSha256,
        },
      },
      scope:
        "Composite accounting: receipt-bound root-only measurement; external charged occupancy minus verified exclusive prune credit. Original external measurement fields remain historical; active external lease growth settles normally.",
    };
    const event = {
      kind: receipt.kind,
      id: receipt.id,
      epochSha256: receipt.epochSha256,
      pruneReceiptSha256: receipt.pruneReceiptSha256,
      rootMeasurementSha256: receipt.rootMeasurementSha256,
      receiptCanonicalSha256: digest(JSON.stringify(receipt)),
      externalExclusiveRemovedBytes: receipt.externalExclusiveRemovedBytes,
      at,
      occupiedBefore: before,
      occupiedAfter: { ...state.occupied },
      initialMeasurementSha256: state.initialMeasurement.measurementSha256,
      activeExternalLeasesSha256: digest(JSON.stringify(state.leases)),
      receipt,
    };
    state.events.push(event);
    await atomic(file, state);
    return event;
  });
}

async function outputAnchor(root, output) {
  assert(
    output !== root && inside(root, output),
    "Output is outside its declared managed store",
  );
  let ancestor = output,
    firstMissing;
  for (;;) {
    const identity = await lstatIfPresent(ancestor);
    if (identity) {
      assert(!identity.isSymbolicLink(), "Output parent must be canonical");
      try {
        assert.equal(
          await fs.realpath(ancestor),
          ancestor,
          "Output parent must be canonical",
        );
      } catch (error) {
        if (error.code === "ENOENT") continue;
        throw error;
      }
      return { ancestor, identity, firstMissing };
    }
    assert(ancestor !== root, "Output parent escapes its store");
    firstMissing = ancestor;
    ancestor = path.dirname(ancestor);
  }
}

async function anchorsStillCurrent(anchors) {
  for (const { ancestor, identity, firstMissing } of anchors) {
    if (!sameInode(identity, await lstatIfPresent(ancestor))) return false;
    try {
      assert.equal(
        await fs.realpath(ancestor),
        ancestor,
        "Output parent must be canonical",
      );
    } catch (error) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
    if (firstMissing && (await lstatIfPresent(firstMissing))) return false;
  }
  return true;
}

export async function reserveStorage(
  directory,
  { store, bytes, outputs, owner },
) {
  assert(
    directory,
    "A measured storage-budget ledger is required; admission refused",
  );
  assert(["root", "external"].includes(store));
  assert(
    Number.isSafeInteger(bytes) &&
      bytes > 0 &&
      Array.isArray(outputs) &&
      outputs.length > 0,
  );
  const absoluteOutputs = outputs.map((output) => path.resolve(output));
  for (let i = 0; i < absoluteOutputs.length; i++)
    assert(
      !absoluteOutputs
        .slice(i + 1)
        .some(
          (other) =>
            inside(absoluteOutputs[i], other) ||
            inside(other, absoluteOutputs[i]),
        ),
      "Lease outputs must be disjoint",
    );
  const file = path.join(directory, "budget.json");
  const retry = Symbol("repeat the output measurement");
  const overlaps = (lease) =>
    lease.outputs.some((left) =>
      absoluteOutputs.some(
        (right) => inside(left, right) || inside(right, left),
      ),
    );
  for (;;) {
    const snapshot = await read(file);
    assert.equal(snapshot.kind, "leetllm.storage-admission-ledger");
    const root = snapshot.measurement.stores[store].path;
    const anchors = await Promise.all(
      absoluteOutputs.map((output) => outputAnchor(root, output)),
    );
    const baseline = await Promise.all(absoluteOutputs.map(allocatedBytes));
    const result = await withReservationLock(directory, async () => {
      const state = await read(file);
      assert.equal(state.kind, "leetllm.storage-admission-ledger");
      const measured = state.measurement.stores[store];
      if (
        state.initializedAt !== snapshot.initializedAt ||
        measured.path !== root
      )
        return retry;
      const reserved = state.leases
        .filter((lease) => lease.store === store)
        .reduce((sum, lease) => sum + lease.bytes, 0);
      const available =
        state.targets[store] -
        state.occupied[store] -
        reserved -
        measured.safetyBytes;
      if (bytes > available) return null;
      assert(!state.leases.some(overlaps), "Output already has a budget lease");
      // A writer can reserve, change and settle the same output during the scan or lock wait.
      // Settlement events omit output paths, so a new event can invalidate the measurement.
      if (
        state.events.length !== snapshot.events.length ||
        snapshot.leases.some(overlaps)
      )
        return retry;
      if (!(await anchorsStillCurrent(anchors))) return retry;
      const lease = {
        id: randomUUID(),
        store,
        bytes,
        outputs: absoluteOutputs,
        baseline,
        owner,
        ownerPid: process.pid,
        at: new Date().toISOString(),
      };
      state.leases.push(lease);
      await atomic(file, state);
      return lease;
    });
    if (result !== retry) return result;
  }
}

export async function settleStorage(
  directory,
  lease,
  { reason = "finished" } = {},
) {
  const current = await Promise.all(lease.outputs.map(allocatedBytes));
  const growth = current.reduce(
    (sum, bytes, index) => sum + Math.max(0, bytes - lease.baseline[index]),
    0,
  );
  return withReservationLock(directory, async () => {
    const state = await read(path.join(directory, "budget.json"));
    const found = state.leases.find((row) => row.id === lease.id);
    assert(
      found && digest(JSON.stringify(found)) === digest(JSON.stringify(lease)),
      "Unknown or changed lease",
    );
    state.occupied[lease.store] += growth;
    state.leases = state.leases.filter((row) => row.id !== lease.id);
    state.events.push({
      leaseId: lease.id,
      at: new Date().toISOString(),
      growthBytes: growth,
      reservedBytes: lease.bytes,
      reason,
      exceededReservation: growth > lease.bytes,
    });
    await atomic(path.join(directory, "budget.json"), state);
    return state.events.at(-1);
  });
}

/** A bounded write watcher terminates only its own over-reservation process group. */
export function enforceStorageLease(
  lease,
  pid,
  { processGroup = true, intervalMs = 1000, stopOwned } = {},
) {
  let stopped = false,
    timer,
    violation,
    running = false;
  const identity = (text) =>
    text.slice(text.lastIndexOf(")") + 2).split(" ")[19];
  // Observe short-lived children immediately; no rejected promise waits for a timer.
  const start = fs.readFile(`/proc/${pid}/stat`, "utf8").then(
    (text) => ({ ticks: identity(text) }),
    (error) => ({ error }),
  );
  async function terminate(error) {
    violation ??= error;
    try {
      const original = await start;
      if (original.error) {
        if (original.error.code === "ENOENT") return;
        throw original.error;
      }
      const text = await fs.readFile(`/proc/${pid}/stat`, "utf8");
      assert.equal(
        identity(text),
        original.ticks,
        "PID was reused; refusing a foreign process",
      );
      if (stopOwned) stopOwned(error);
      else process.kill(processGroup ? -pid : pid, "SIGTERM");
    } catch (failure) {
      if (!["ENOENT", "ESRCH"].includes(failure.code))
        violation = new AggregateError(
          [error, failure],
          "Cannot enforce the owned storage lease",
        );
    }
  }
  async function sample() {
    if (stopped || running) return;
    running = true;
    try {
      const current = await Promise.all(lease.outputs.map(allocatedBytes));
      const growth = current.reduce(
        (sum, bytes, index) => sum + Math.max(0, bytes - lease.baseline[index]),
        0,
      );
      if (growth > lease.bytes) {
        await terminate(
          new Error(`Storage reservation exceeded: ${growth} > ${lease.bytes}`),
        );
      }
    } catch (error) {
      await terminate(error);
    } finally {
      running = false;
    }
  }
  timer = setInterval(sample, intervalMs);
  timer.unref();
  return {
    async stop() {
      stopped = true;
      clearInterval(timer);
      while (running) await new Promise((resolve) => setTimeout(resolve, 10));
      if (violation) throw violation;
    },
  };
}
