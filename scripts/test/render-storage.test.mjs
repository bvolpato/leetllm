import assert from "node:assert/strict";
import fs from "node:fs/promises";
import nativeFs from "node:fs";
import os from "node:os";
import path from "node:path";
import { syncBuiltinESMExports } from "node:module";
import { Writable } from "node:stream";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";
import {
  bindFile,
  proveSceneWav,
  hydrateSceneWav,
  pruneProvedSceneWav,
} from "../lib/render-storage.mjs";

const exec = promisify(execFile);
const renderer = new URL("../../videos/render.mjs", import.meta.url);

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "render-retention-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const cache = path.join(root, ".scene-cache", "lesson");
  await fs.mkdir(cache, { recursive: true });
  const mp3 = path.join(root, "speech.mp3");
  await exec("/usr/bin/ffmpeg", [
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:duration=0.2",
    "-c:a",
    "libmp3lame",
    mp3,
  ]);
  const scene = {
    duration: 0.8,
    beats: [{ end: 0.6, until: 0.8 }],
    sounds: [
      { audio: mp3, audioHash: (await bindFile(mp3)).sha256, duration: 0.2 },
    ],
  };
  // Execute the actual producer function, rather than a second test implementation.
  const source = await fs.readFile(renderer, "utf8");
  const body = source.slice(
    source.indexOf("async function sceneAudio("),
    source.indexOf("\n/**", source.indexOf("async function sceneAudio(")),
  );
  const produce = new Function("run", `${body}; return sceneAudio;`)(
    (command, args) => exec(command, args),
  );
  const wav = path.join(cache, "01-scene.wav");
  await produce(scene, wav);
  const timeline = path.join(root, "timeline.json");
  await fs.writeFile(timeline, JSON.stringify(scene));
  const recipe = await proveSceneWav({
    wav,
    scene,
    ffmpeg: "/usr/bin/ffmpeg",
    provenance: [
      { path: timeline, role: "timeline" },
      { path: renderer.pathname, role: "renderer" },
    ],
  });
  return {
    root,
    cache,
    wav,
    recipe,
    guard: async () => ({
      inactive: true,
      protectedInputsRetained: true,
      canonicalPath: wav,
    }),
  };
}

test("actual Canvas WAV can be durably pruned and hydrated with exact bytes", async (t) => {
  const f = await fixture(t);
  const result = await pruneProvedSceneWav(f.recipe, {
    ledgerDirectory: path.join(f.root, "ledger"),
    guard: f.guard,
  });
  const record = JSON.parse(await fs.readFile(result.path, "utf8"));
  assert.equal(record.state, "pruned-reproducible-cache");
  await assert.rejects(fs.stat(f.wav), { code: "ENOENT" });
  await hydrateSceneWav(f.recipe, f.wav);
  assert.equal((await bindFile(f.wav)).sha256, f.recipe.original.sha256);
  await assert.rejects(hydrateSceneWav(f.recipe, f.wav), /already exists/);
  const changed = structuredClone(f.recipe);
  changed.scene.beats[0].until += 0.01;
  await assert.rejects(
    hydrateSceneWav(changed, path.join(f.root, "changed.wav")),
    /Recipe changed/,
  );
});

test("inactive guard and canonical ledger confinement preserve the original", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    pruneProvedSceneWav(f.recipe, {
      ledgerDirectory: path.join(f.root, "ledger"),
      guard: async () => ({ inactive: false }),
    }),
    /inactivity/,
  );
  await assert.rejects(
    pruneProvedSceneWav(f.recipe, { ledgerDirectory: f.cache, guard: f.guard }),
    /outside/,
  );
  const alias = path.join(f.root, "ledger-alias");
  await fs.symlink(f.cache, alias);
  await assert.rejects(
    pruneProvedSceneWav(f.recipe, {
      ledgerDirectory: path.join(alias, "records"),
      guard: f.guard,
    }),
    /outside/,
  );
  assert.equal((await bindFile(f.wav)).sha256, f.recipe.original.sha256);
});

test("replacement between lstat and atomic claim is retained", async (t) => {
  const f = await fixture(t),
    rename = fs.rename;
  const saved = path.join(f.root, "original.wav");
  fs.rename = async (from, to) => {
    if (from === f.wav) {
      await rename(from, saved);
      await fs.writeFile(from, "unexpected replacement");
    }
    return rename(from, to);
  };
  try {
    await assert.rejects(
      pruneProvedSceneWav(f.recipe, {
        ledgerDirectory: path.join(f.root, "ledger"),
        guard: f.guard,
      }),
      /identity changed/,
    );
  } finally {
    fs.rename = rename;
  }
  assert.equal(await fs.readFile(f.wav, "utf8"), "unexpected replacement");
  assert.equal((await bindFile(saved)).sha256, f.recipe.original.sha256);
});

test(
  "async output failure after accepted prefix rejects without hanging",
  { timeout: 5000 },
  async (t) => {
    const f = await fixture(t),
      original = nativeFs.createWriteStream;
    nativeFs.createWriteStream = () =>
      new Writable({
        write(_chunk, _encoding, callback) {
          callback();
          queueMicrotask(() =>
            this.destroy(
              Object.assign(new Error("simulated ENOSPC"), { code: "ENOSPC" }),
            ),
          );
        },
      });
    syncBuiltinESMExports();
    try {
      await assert.rejects(
        hydrateSceneWav(f.recipe, path.join(f.root, "full.wav")),
        /ENOSPC/,
      );
    } finally {
      nativeFs.createWriteStream = original;
      syncBuiltinESMExports();
    }
  },
);

test("a hardlink created during claim cannot produce an exclusive-byte receipt", async (t) => {
  const f = await fixture(t),
    rename = fs.rename;
  const alias = path.join(f.root, "late-alias.wav");
  fs.rename = async (from, to) => {
    if (from === f.wav) await fs.link(from, alias);
    return rename(from, to);
  };
  try {
    await assert.rejects(
      pruneProvedSceneWav(f.recipe, {
        ledgerDirectory: path.join(f.root, "ledger"),
        guard: f.guard,
      }),
      /identity changed/,
    );
  } finally {
    fs.rename = rename;
  }
  assert.equal((await bindFile(alias)).sha256, f.recipe.original.sha256);
  assert.equal((await bindFile(f.wav)).sha256, f.recipe.original.sha256);
});

test("silent self-input and its parent-symlink alias are refused", async (t) => {
  const f = await fixture(t);
  const silence = path.join(f.cache, "silent.wav");
  await exec("/usr/bin/ffmpeg", [
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=48000:cl=stereo",
    "-t",
    "0.8",
    "-c:a",
    "pcm_s16le",
    silence,
  ]);
  await fs.symlink(f.cache, path.join(f.root, "cache-alias"));
  const alias = path.join(f.root, "cache-alias", "silent.wav");
  const scene = {
    duration: 0.8,
    beats: [{ end: 0.6, until: 0.8 }],
    sounds: [
      {
        audio: alias,
        audioHash: (await bindFile(alias)).sha256,
        duration: 0.2,
      },
    ],
  };
  await assert.rejects(
    proveSceneWav({
      wav: silence,
      scene,
      ffmpeg: "/usr/bin/ffmpeg",
      provenance: f.recipe.provenance,
    }),
    /Circular rebuild input/,
  );
  assert.equal((await fs.stat(silence)).isFile(), true);
});
