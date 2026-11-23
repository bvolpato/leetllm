import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createReadStream, createWriteStream } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";

const GiB = 1024 ** 3;
export const STORAGE_TARGETS = Object.freeze({
  root: 20 * GiB,
  external: 150 * GiB,
});
export const digest = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");

export function evaluateStorageBudget(stores, targets = STORAGE_TARGETS) {
  const results = {};
  for (const name of ["root", "external"]) {
    const { usageBytes, protectedBytes, reservationBytes } = stores[name];
    for (const value of [
      usageBytes,
      protectedBytes,
      reservationBytes,
      targets[name],
    ])
      assert(
        Number.isSafeInteger(value) && value >= 0,
        "Budget measurements must be nonnegative byte counts",
      );
    assert(protectedBytes <= usageBytes);
    results[name] = {
      targetBytes: targets[name],
      usageBytes,
      protectedBytes,
      reservationBytes,
      overTargetBytes: Math.max(0, usageBytes - targets[name]),
      protectedFloorExceedsTarget: protectedBytes > targets[name],
      canAdmit: usageBytes + reservationBytes <= targets[name],
    };
  }
  return {
    stores: results,
    canAdmit: Object.values(results).every((store) => store.canAdmit),
    deletionAuthorized: false,
  };
}

export async function bindFile(file) {
  const absolute = path.resolve(file),
    info = await fs.lstat(absolute, { bigint: true });
  assert(
    info.isFile() && !info.isSymbolicLink(),
    `Expected a regular file: ${absolute}`,
  );
  const h = createHash("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(absolute)) {
    h.update(chunk);
    bytes += chunk.length;
  }
  const after = await fs.lstat(absolute, { bigint: true });
  assert.equal(
    info.ctimeNs,
    after.ctimeNs,
    `File changed during hashing: ${absolute}`,
  );
  return {
    path: absolute,
    realPath: await fs.realpath(absolute),
    sha256: h.digest("hex"),
    bytes,
    dev: String(info.dev),
    ino: String(info.ino),
    mtimeNs: String(info.mtimeNs),
    ctimeNs: String(info.ctimeNs),
    mode: Number(info.mode),
    uid: Number(info.uid),
    gid: Number(info.gid),
    nlink: Number(info.nlink),
    allocatedBytes: Number(info.blocks * 512n),
  };
}

export async function readPcmWavContainer(file) {
  const handle = await fs.open(file, "r");
  try {
    const info = await handle.stat();
    const header = Buffer.alloc(Math.min(info.size, 65536));
    await handle.read(header, 0, header.length, 0);
    assert(
      header.toString("ascii", 0, 4) === "RIFF" &&
        header.toString("ascii", 8, 12) === "WAVE",
      "Only RIFF WAV caches are supported",
    );
    let offset = 12,
      format = null;
    while (offset + 8 <= header.length) {
      const kind = header.toString("ascii", offset, offset + 4),
        bytes = header.readUInt32LE(offset + 4);
      if (kind === "fmt ") {
        assert(bytes >= 16 && offset + 8 + bytes <= header.length);
        format = {
          codec: header.readUInt16LE(offset + 8),
          channels: header.readUInt16LE(offset + 10),
          rate: header.readUInt32LE(offset + 12),
          bits: header.readUInt16LE(offset + 22),
        };
      }
      if (kind === "data") {
        assert.deepEqual(
          format,
          { codec: 1, channels: 2, rate: 48000, bits: 16 },
          "Unsupported cached PCM format",
        );
        const start = offset + 8,
          end = start + bytes;
        assert(bytes > 0 && bytes % 4 === 0 && end <= info.size);
        assert(info.size - end <= 65536, "Unbounded trailing WAV metadata");
        const suffix = Buffer.alloc(info.size - end);
        await handle.read(suffix, 0, suffix.length, end);
        return {
          prefixBase64: header.subarray(0, start).toString("base64"),
          suffixBase64: suffix.toString("base64"),
          dataBytes: bytes,
        };
      }
      offset += 8 + bytes + (bytes % 2);
    }
    throw new Error(
      "WAV data header is absent or exceeds the bounded metadata window",
    );
  } finally {
    await handle.close();
  }
}

function pcmArgs(scene) {
  assert(
    Array.isArray(scene.sounds) &&
      scene.sounds.length > 0 &&
      scene.sounds.length === scene.beats.length,
  );
  assert(Number.isFinite(scene.duration) && scene.duration > 0);
  const inputs = scene.sounds.flatMap((sound) => ["-i", sound.audio]);
  const filters = scene.sounds.map((sound, index) => {
    const hold = scene.beats[index].until - scene.beats[index].end;
    assert(
      Number.isFinite(sound.duration) &&
        sound.duration > 0 &&
        Number.isFinite(hold) &&
        hold >= 0,
    );
    return `[${index}:a]aformat=sample_rates=48000:channel_layouts=stereo,apad,atrim=duration=${(sound.duration + hold).toFixed(6)}[a${index}]`;
  });
  filters.push(
    `${scene.sounds.map((_, index) => `[a${index}]`).join("")}concat=n=${scene.sounds.length}:v=0:a=1,adelay=400|400,apad,atrim=duration=${scene.duration}[out]`,
  );
  return [
    "-hide_banner",
    "-loglevel",
    "error",
    "-threads",
    "1",
    "-filter_complex_threads",
    "1",
    ...inputs,
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[out]",
    "-c:a",
    "pcm_s16le",
    "-ar",
    "48000",
    "-f",
    "s16le",
    "pipe:1",
  ];
}

async function verifyInputs(recipe) {
  assert.equal(recipe.kind, "leetllm.scene-wav-rebuild");
  assert.equal(recipe.version, 1);
  if (recipe.proof) {
    const { proof, ...inputs } = recipe;
    assert.equal(
      proof.recipeInputsSha256,
      digest(JSON.stringify(inputs)),
      "Recipe changed after its observed replay",
    );
    assert.equal(proof.sha256, recipe.original.sha256);
    assert.equal(proof.bytes, recipe.original.bytes);
  }
  assert(recipe.provenance.some((entry) => entry.role === "timeline"));
  assert(recipe.provenance.some((entry) => entry.role === "renderer"));
  for (const expected of [
    recipe.ffmpeg,
    ...recipe.inputs,
    ...recipe.provenance,
  ]) {
    const current = await bindFile(expected.path);
    assert(
      current.dev !== recipe.original.dev ||
        current.ino !== recipe.original.ino,
      `Circular rebuild input aliases the WAV being evicted: ${expected.path}`,
    );
    assert.equal(
      current.sha256,
      expected.sha256,
      `Rebuild input changed: ${expected.path}`,
    );
    assert.equal(current.bytes, expected.bytes);
  }
  assert(Buffer.from(recipe.container.prefixBase64, "base64").length <= 65536);
  assert(Buffer.from(recipe.container.suffixBase64, "base64").length <= 65536);
}

async function streamRebuild(recipe, output) {
  const prefix = Buffer.from(recipe.container.prefixBase64, "base64");
  const suffix = Buffer.from(recipe.container.suffixBase64, "base64");
  const h = createHash("sha256").update(prefix);
  const write = async (bytes) => {
    if (!output) return;
    if (output.destroyed || output.errored)
      throw output.errored ?? new Error("Hydration output closed");
    await new Promise((resolve, reject) =>
      output.write(bytes, (error) => (error ? reject(error) : resolve())),
    );
  };
  await write(prefix);
  if (output?.destroyed || output?.errored)
    throw output.errored ?? new Error("Hydration output closed");
  const child = spawn(recipe.ffmpeg.path, pcmArgs(recipe.scene), {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "",
    dataBytes = 0;
  child.stderr.on("data", (chunk) => {
    if (stderr.length < 16384) stderr += chunk.toString();
  });
  const completion = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`PCM rebuild failed (${signal ?? code}): ${stderr}`),
          ),
    );
  });
  // Attach immediately so a spawn failure cannot become an unhandled rejection.
  completion.catch(() => {});
  const outputError = () => child.kill("SIGTERM");
  output?.on("error", outputError);
  try {
    for await (const chunk of child.stdout) {
      dataBytes += chunk.length;
      assert(
        dataBytes <= recipe.container.dataBytes,
        "PCM rebuild exceeds its recorded bound",
      );
      h.update(chunk);
      await write(chunk);
    }
    await completion;
    assert.equal(
      dataBytes,
      recipe.container.dataBytes,
      "PCM rebuild length differs",
    );
    h.update(suffix);
    await write(suffix);
    const sha256 = h.digest("hex");
    assert.equal(
      sha256,
      recipe.original.sha256,
      "Rebuilt WAV differs from the recorded cache bytes",
    );
    return {
      sha256,
      bytes: prefix.length + dataBytes + suffix.length,
      pcmBytes: dataBytes,
    };
  } catch (error) {
    child.kill("SIGTERM");
    await completion.catch(() => {});
    throw error;
  } finally {
    output?.removeListener("error", outputError);
  }
}

export async function proveSceneWav({ wav, scene, ffmpeg, provenance }) {
  const original = await bindFile(wav);
  assert(
    path.extname(original.path) === ".wav" &&
      original.path.split(path.sep).includes(".scene-cache"),
  );
  assert.equal(
    original.nlink,
    1,
    "Shared WAV aliases need a separate explicit retention plan",
  );
  const normalized = {
      duration: scene.duration,
      beats: scene.beats.map(({ end, until }) => ({ end, until })),
      sounds: scene.sounds.map(
        ({ audio, audioHash, boundaries, boundariesHash, duration }) => ({
          audio,
          audioHash,
          boundaries,
          boundariesHash,
          duration,
        }),
      ),
    },
    inputs = [];
  for (const sound of normalized.sounds) {
    const record = await bindFile(sound.audio);
    assert.equal(
      record.sha256,
      sound.audioHash,
      "Retained MP3 does not match the measured timeline",
    );
    sound.audio = record.path;
    inputs.push(record);
    if (sound.boundaries) {
      const words = await bindFile(sound.boundaries);
      assert.equal(words.sha256, sound.boundariesHash);
      inputs.push(words);
    }
  }
  const records = [];
  for (const expected of provenance) {
    const actual = await bindFile(expected.path);
    if (expected.sha256) assert.equal(actual.sha256, expected.sha256);
    records.push({ ...actual, role: expected.role });
  }
  const recipe = {
    kind: "leetllm.scene-wav-rebuild",
    version: 1,
    original,
    container: await readPcmWavContainer(wav),
    scene: normalized,
    ffmpeg: await bindFile(ffmpeg),
    inputs,
    provenance: records,
    reproducibility:
      "Per-file observed byte identity on the recorded native toolchain; hydration must verify the full WAV hash again.",
  };
  await verifyInputs(recipe);
  const replay = await streamRebuild(recipe);
  assert.equal(replay.bytes, original.bytes);
  const after = await bindFile(wav);
  assert.equal(after.sha256, original.sha256);
  assert.equal(after.ctimeNs, original.ctimeNs);
  return {
    ...recipe,
    proof: {
      at: new Date().toISOString(),
      ...replay,
      recipeInputsSha256: digest(JSON.stringify(recipe)),
      temporaryPcmFilesCreated: 0,
    },
  };
}

export async function hydrateSceneWav(recipe, outputFile) {
  await verifyInputs(recipe);
  const output = path.resolve(outputFile),
    temporary = `${output}.hydrate-${randomUUID()}`;
  try {
    await fs.lstat(output);
    throw new Error(`Hydration destination already exists: ${output}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const stream = createWriteStream(temporary, {
    flags: "wx",
    mode: recipe.original.mode & 0o777,
  });
  const closed = once(stream, "close");
  closed.catch(() => {});
  try {
    const result = await streamRebuild(recipe, stream);
    stream.end();
    await closed;
    const file = await fs.open(temporary, "r");
    try {
      await file.sync();
    } finally {
      await file.close();
    }
    // link is exclusive; a concurrent creator cannot be overwritten by rename.
    await fs.link(temporary, output);
    await fs.unlink(temporary);
    await syncDirectory(path.dirname(output));
    return { path: output, ...result, hydratedAt: new Date().toISOString() };
  } catch (error) {
    stream.destroy();
    await closed.catch(() => {});
    await fs.rm(temporary, { force: true });
    throw error;
  }
}

async function syncDirectory(directory) {
  const handle = await fs.open(directory, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function durableJson(file, value) {
  const bytes = JSON.stringify(value, null, 2) + "\n";
  const handle = await fs.open(file, "wx");
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const directory = await fs.open(path.dirname(file), "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
  return {
    path: path.resolve(file),
    sha256: digest(bytes),
    bytes: Buffer.byteLength(bytes),
  };
}

/** Caller supplies its freshly evaluated inactive-root and protected-input guard. */
export async function pruneProvedSceneWav(recipe, { ledgerDirectory, guard }) {
  assert.equal(
    typeof guard,
    "function",
    "A fresh inactivity/protection guard is required",
  );
  assert(recipe.proof, "A successful full-WAV replay proof is required");
  await verifyInputs(recipe);
  const current = await bindFile(recipe.original.path);
  for (const key of ["sha256", "bytes", "dev", "ino", "mtimeNs", "ctimeNs"])
    assert.equal(
      current[key],
      recipe.original[key],
      `WAV changed after replay: ${key}`,
    );
  assert.equal(current.nlink, 1);
  assert(
    current.path.split(path.sep).includes(".scene-cache") &&
      current.path.endsWith(".wav"),
  );
  const ledger = path.resolve(ledgerDirectory);
  const parts = current.realPath.split(path.sep);
  const cacheRoot = parts
    .slice(0, parts.lastIndexOf(".scene-cache") + 1)
    .join(path.sep);
  let existing = ledger;
  while (true) {
    try {
      const resolved = await fs.realpath(existing);
      assert(
        resolved !== cacheRoot &&
          !resolved.startsWith(`${cacheRoot}${path.sep}`),
        "Retention records must be outside the pruned cache tree",
      );
      break;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      existing = path.dirname(existing);
    }
  }
  await fs.mkdir(ledger, { recursive: true });
  const actualLedger = await fs.realpath(ledger);
  const cacheParent = path.dirname(current.realPath);
  assert(
    actualLedger !== cacheRoot &&
      !actualLedger.startsWith(`${cacheRoot}${path.sep}`),
    "Retention records must be outside the pruned cache tree",
  );
  const operation = randomUUID();
  const recipeRecord = await durableJson(
    path.join(ledger, `${operation}.recipe.json`),
    recipe,
  );
  const checkGuard = async () => {
    const result = await guard(recipe);
    assert(
      result?.inactive === true && result?.protectedInputsRetained === true,
      "Cache inactivity and retained-input protection must both pass",
    );
    assert.equal(
      result.canonicalPath,
      current.realPath,
      "Guard names a different cache file",
    );
    return result;
  };
  const firstGuard = await checkGuard();
  const claimDirectory = path.join(
    cacheParent,
    `.retention-claim-${operation}`,
  );
  const claimed = path.join(claimDirectory, "payload.wav");
  const tombstone = await durableJson(
    path.join(ledger, `${operation}.prepared.json`),
    {
      kind: "leetllm.scene-wav-retention",
      version: 1,
      state: "prepared-to-prune",
      at: new Date().toISOString(),
      original: current,
      claimDirectory,
      claimed,
      recipe: recipeRecord,
      retainedInputs: [recipe.ffmpeg, ...recipe.inputs, ...recipe.provenance],
      reconstructedBytesSha256: recipe.proof.sha256,
      guard: firstGuard,
      availabilityAfterUnlink: "absent-until-explicit-hash-checked-hydration",
    },
  );
  await checkGuard();
  const last = await fs.lstat(current.path, { bigint: true });
  assert.equal(String(last.dev), current.dev);
  assert.equal(String(last.ino), current.ino);
  assert.equal(String(last.ctimeNs), current.ctimeNs);
  assert.equal(Number(last.nlink), 1);
  await fs.mkdir(claimDirectory, { mode: 0o700 });
  await fs.rename(current.path, claimed);
  const claimedRecord = await bindFile(claimed);
  const claimedMatches =
    claimedRecord.nlink === 1 &&
    ["dev", "ino", "sha256", "bytes", "mtimeNs"].every(
      (key) => claimedRecord[key] === current[key],
    );
  if (!claimedMatches) {
    // Restore an unexpectedly replaced file without overwriting another creator.
    try {
      await fs.link(claimed, current.path);
      await fs.unlink(claimed);
      await fs.rmdir(claimDirectory);
    } catch {
      /* Keep the claimed data and prepared tombstone for reconciliation. */
    }
    await syncDirectory(cacheParent);
    throw new Error(
      "Cache identity changed during atomic claim; no claimed payload was deleted",
    );
  }
  await syncDirectory(cacheParent);
  await syncDirectory(claimDirectory);
  await fs.unlink(claimed);
  await syncDirectory(claimDirectory);
  await fs.rmdir(claimDirectory);
  await syncDirectory(cacheParent);
  return durableJson(path.join(ledger, `${operation}.pruned.json`), {
    kind: "leetllm.scene-wav-retention",
    version: 1,
    state: "pruned-reproducible-cache",
    at: new Date().toISOString(),
    original: current,
    recipe: recipeRecord,
    tombstone,
    logicalBytesUnlinked: current.bytes,
    exclusiveAllocatedBytesUnlinked: current.allocatedBytes,
    protectedInputsRemoved: false,
    noPlaceholderAtOriginalPath: true,
  });
}
