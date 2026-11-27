#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { accessSync, constants, existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { productionSourceManifest } from "../videos/lib/lesson-production.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

function parseArgs(argv) {
  // Always default to libx264 + standard quality + dither: Vizmatic's Float32+IGN dark-mode bloom
  // requires libx264's grain-preserving x264Params (aq-strength=1.0:subme=6:trellis=0); hardware
  // encoders (nvenc) ignore those flags and smear dither grain into unstable halos.
  const options = {
    render: false,
    publish: false,
    pruneR2: false,
    lessons: null,
    output: null,
    jobs: Math.min(8, Math.max(2, Math.floor(cpus().length / 4))),
    workers: 4,
    threads: 2,
    quality: "standard",
    dither: true,
    h264Encoder: "libx264",
    motionBlur: 1,
    backend: "cpu",
    envFile: "web/.env.local",
    concurrency: 4,
    pruneSceneCache: true,
    keepSceneCache: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--render") options.render = true;
    else if (arg === "--publish") options.publish = true;
    else if (arg === "--prune-r2") options.pruneR2 = true;
    else if (arg === "--keep-scene-cache") {
      options.pruneSceneCache = false;
      options.keepSceneCache = true;
    } else if (arg.startsWith("--lessons=")) {
      options.lessons = arg
        .slice("--lessons=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg.startsWith("--output="))
      options.output = arg.slice("--output=".length);
    else if (arg.startsWith("--jobs="))
      options.jobs = Number(arg.slice("--jobs=".length));
    else if (arg.startsWith("--workers="))
      options.workers = Number(arg.slice("--workers=".length));
    else if (arg.startsWith("--threads="))
      options.threads = Number(arg.slice("--threads=".length));
    else if (arg.startsWith("--quality="))
      options.quality = arg.slice("--quality=".length);
    else if (arg.startsWith("--h264-encoder="))
      options.h264Encoder = arg.slice("--h264-encoder=".length);
    else if (arg.startsWith("--motion-blur="))
      options.motionBlur = Number(arg.slice("--motion-blur=".length));
    else if (arg.startsWith("--backend="))
      options.backend = arg.slice("--backend=".length);
    else if (arg.startsWith("--env-file="))
      options.envFile = arg.slice("--env-file=".length);
    else if (arg.startsWith("--concurrency="))
      options.concurrency = Number(arg.slice("--concurrency=".length));
    else if (arg === "-h" || arg === "--help") {
      console.log(`Usage: node scripts/render-publish-videos.mjs [--render] [--publish] [--prune-r2] [options]

Options:
  --render              Render missing or stale stage lesson MP4s, captions, and bloom posters.
  --publish             Upload verified MP4s, captions, and posters to Cloudflare R2 and update
                        web/src/generated/lesson-videos.json (clearing replaced withheld entries).
  --prune-r2            Delete orphaned lessons/* objects in Cloudflare R2 not referenced by
                        web/src/generated/lesson-videos.json (verifies all active objects exist first).
  --lessons=id1,id2     Limit to specific lesson IDs (uses --merge-existing-manifest on publish).
  --output=DIR          Render output directory (default: /mnt/bbackup/leetllm-stage-cinema if writable,
                        else build/video-cinema).
  --jobs=N              Concurrent lesson render processes (default: ${options.jobs}).
  --workers=N           Resvg raster workers per lesson process (default: 4).
  --threads=N           FFmpeg encoder threads per lesson process (default: ${options.threads}).
  --quality=LEVEL       Vizmatic quality preset: draft|standard|high|master (default: ${options.quality}).
  --h264-encoder=ENC    H.264 encoder: libx264|nvenc|videotoolbox (default: ${options.h264Encoder}).
  --motion-blur=N       Shutter sub-frames per frame (default: 1).
  --backend=MODE        Vizmatic raster backend: cpu|auto|gpu (default: cpu).
  --env-file=PATH       Env file with CLOUDFLARE_API_TOKEN or CLOUDFLARE_CACHE_PURGER (default: web/.env.local).
  --concurrency=N       Cloudflare R2 upload workers, 1-8 (default: 4).
  --keep-scene-cache    Keep per-lesson .scene-cache after a verified MP4 is produced.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!options.render && !options.publish && !options.pruneR2) {
    throw new Error(
      "Specify at least one of --render, --publish, or --prune-r2 (see --help)",
    );
  }
  return options;
}

function defaultOutputDir() {
  const external = "/mnt/bbackup";
  try {
    accessSync(external, constants.W_OK);
    return path.join(external, "leetllm-stage-cinema");
  } catch {
    return path.join(root, "build", "video-cinema");
  }
}

function sha256FileSyncBuffer(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function isLessonUpToDate(entry, outputDir, options) {
  const lessonDir = path.join(outputDir, entry.id);
  const receiptPath = path.join(lessonDir, "verification.json");
  if (!existsSync(receiptPath))
    return { fresh: false, reason: "missing verification.json" };
  try {
    const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
    if (
      receipt.id !== entry.id ||
      receipt.fullDecode !== "passed" ||
      !receipt.frameAudit?.passed
    ) {
      return { fresh: false, reason: "receipt failed or incomplete" };
    }
    if (
      options?.h264Encoder &&
      receipt.h264Encoder &&
      receipt.h264Encoder !== options.h264Encoder
    ) {
      return {
        fresh: false,
        reason: `encoder changed (${receipt.h264Encoder} -> ${options.h264Encoder})`,
      };
    }
    const mp4 = path.join(lessonDir, `${entry.id}.mp4`);
    const vtt = path.join(lessonDir, `${entry.id}.vtt`);
    const poster = path.join(lessonDir, "poster.png");
    if (!existsSync(mp4) || !existsSync(vtt) || !existsSync(poster)) {
      return { fresh: false, reason: "missing mp4/vtt/poster" };
    }
    const articlePath = path.join(root, "web/src/content", entry.source);
    const articleSha = sha256FileSyncBuffer(await readFile(articlePath));
    if (receipt.sourceSha256 !== articleSha) {
      return { fresh: false, reason: "article source changed" };
    }
    const manifest = await productionSourceManifest({
      root,
      id: entry.id,
      mode: "stage",
    });
    if (receipt.fingerprint !== manifest.fingerprint) {
      return { fresh: false, reason: "film source fingerprint changed" };
    }
    return { fresh: true, receipt };
  } catch (err) {
    return { fresh: false, reason: err.message };
  }
}

function runSubprocess(
  command,
  args,
  { env = process.env, stream = false } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: stream ? "inherit" : ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    if (!stream) {
      child.stdout.on("data", (chunk) => {
        stdout = (stdout + chunk.toString()).slice(-16000);
      });
      child.stderr.on("data", (chunk) => {
        stderr = (stderr + chunk.toString()).slice(-16000);
      });
    }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else
        reject(
          new Error(
            `${command} ${args.join(" ")} exited ${code}\n${stderr || stdout}`,
          ),
        );
    });
  });
}

async function renderOneLesson(entry, outputDir, options, speechCacheDir) {
  const started = performance.now();
  const env = {
    ...process.env,
    LEETLLM_SPEECH_CACHE: speechCacheDir,
    LEETLLM_KOKORO_WARM: "1",
    LEETLLM_KOKORO_DEVICE: process.env.LEETLLM_KOKORO_DEVICE || "auto",
    LEETLLM_KOKORO_SLOTS: String(Math.min(16, Math.max(4, options.jobs))),
  };
  const args = [
    "videos/render.mjs",
    "--stage",
    "--lesson",
    entry.id,
    "--editor-submission",
    "--output",
    outputDir,
    "--quality",
    options.quality,
    ...(options.dither ? ["--dither"] : []),
    "--h264-encoder",
    options.h264Encoder,
    "--backend",
    options.backend,
    "--motion-blur",
    String(options.motionBlur),
    "--poster-only",
    "--workers",
    String(options.workers),
    "--threads",
    String(options.threads),
    "--no-manifest",
  ];
  await runSubprocess(process.execPath, args, { env });
  const receiptPath = path.join(outputDir, entry.id, "verification.json");
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  if (options.pruneSceneCache) {
    await rm(path.join(outputDir, ".scene-cache", entry.id), {
      recursive: true,
      force: true,
    });
  }
  return {
    id: entry.id,
    sec: (performance.now() - started) / 1000,
    duration: receipt.duration,
    bytes: receipt.bytes,
    sha256: receipt.sha256,
  };
}

async function pruneSupersededWithheld(manifestPath) {
  const withheldPath = path.join(
    root,
    "web/src/lib/withheld-lesson-videos.json",
  );
  if (!existsSync(withheldPath)) return 0;
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const withheld = JSON.parse(await readFile(withheldPath, "utf8"));
  const kept = {};
  let removed = 0;
  for (const [slug, record] of Object.entries(withheld)) {
    const published = manifest.videos?.[slug];
    if (published && published.sha256 !== record.sha256) {
      removed++;
      continue;
    }
    kept[slug] = record;
  }
  if (removed > 0) {
    await writeFile(withheldPath, JSON.stringify(kept, null, 2) + "\n");
  }
  return removed;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const collectionPath = path.join(
    root,
    "videos/collections/complete-curriculum.json",
  );
  const collection = JSON.parse(await readFile(collectionPath, "utf8"));
  const allLessons = collection.lessons;
  const byId = new Map(allLessons.map((row) => [row.id, row]));
  const selected = options.lessons
    ? options.lessons.map((id) => {
        const entry = byId.get(id);
        if (!entry) throw new Error(`Unknown lesson id in --lessons: ${id}`);
        return entry;
      })
    : allLessons;

  const outputDir = path.resolve(root, options.output || defaultOutputDir());
  const speechCacheDir = path.join(outputDir, ".speech-cache");
  await mkdir(outputDir, { recursive: true });
  await mkdir(speechCacheDir, { recursive: true });

  console.log(
    `[videos] target=${selected.length}/${allLessons.length} lessons | output=${outputDir} | jobs=${options.jobs} workers=${options.workers} threads=${options.threads} quality=${options.quality} encoder=${options.h264Encoder} motionBlur=${options.motionBlur} backend=${options.backend}`,
  );

  if (options.render) {
    const pending = [];
    let skipped = 0;
    for (const entry of selected) {
      const status = await isLessonUpToDate(entry, outputDir, options);
      if (status.fresh) skipped++;
      else pending.push(entry);
    }
    console.log(
      `[videos] render plan: ${pending.length} to render, ${skipped} already up-to-date`,
    );

    if (pending.length > 0) {
      const tRenderStart = performance.now();
      let completed = 0;
      const failures = [];

      // Render the first pending lesson alone so shared brand intro and uv env warm without races.
      const first = pending.shift();
      console.log(
        `[videos] warming shared brand intro + Kokoro CUDA with ${first.id}...`,
      );
      try {
        const r = await renderOneLesson(
          first,
          outputDir,
          options,
          speechCacheDir,
        );
        completed++;
        console.log(
          `[videos] (${completed}/${pending.length + 1}) ${r.id} READY in ${r.sec.toFixed(1)}s (${r.duration.toFixed(0)}s film, ${(r.bytes / 1048576).toFixed(1)} MiB)`,
        );
      } catch (err) {
        failures.push({ id: first.id, error: err.message });
        console.error(`[videos] FAILED ${first.id}: ${err.message}`);
      }

      if (pending.length > 0 && failures.length === 0) {
        let nextIndex = 0;
        const workerCount = Math.min(options.jobs, pending.length);
        const total = pending.length + 1;
        await Promise.all(
          Array.from({ length: workerCount }, async () => {
            while (nextIndex < pending.length) {
              const entry = pending[nextIndex++];
              try {
                const r = await renderOneLesson(
                  entry,
                  outputDir,
                  options,
                  speechCacheDir,
                );
                completed++;
                const elapsed = (performance.now() - tRenderStart) / 1000;
                const avg = elapsed / completed;
                const etaMin = ((total - completed) * avg) / 60;
                console.log(
                  `[videos] (${completed}/${total}) ${r.id} READY in ${r.sec.toFixed(1)}s (${r.duration.toFixed(0)}s film, ${(r.bytes / 1048576).toFixed(1)} MiB) | elapsed ${(elapsed / 60).toFixed(1)}m, ETA ~${etaMin.toFixed(1)}m`,
                );
              } catch (err) {
                failures.push({ id: entry.id, error: err.message });
                console.error(`[videos] FAILED ${entry.id}: ${err.message}`);
              }
            }
          }),
        );
      }
      if (failures.length > 0) {
        throw new Error(
          `${failures.length} lesson render(s) failed: ${failures.map((f) => f.id).join(", ")}`,
        );
      }
      console.log(
        `[videos] all ${selected.length} rendered lessons ready in ${((performance.now() - tRenderStart) / 60000).toFixed(1)} min`,
      );
    }
  }

  if (options.publish) {
    const lessonsSelection = [];
    for (const entry of selected) {
      const lessonDir = path.join(outputDir, entry.id);
      const receipt = JSON.parse(
        await readFile(path.join(lessonDir, "verification.json"), "utf8"),
      );
      const posterFile = existsSync(path.join(lessonDir, "poster.png"))
        ? path.join(lessonDir, "poster.png")
        : existsSync(path.join(lessonDir, "overview.png"))
          ? path.join(lessonDir, "overview.png")
          : undefined;
      lessonsSelection.push({
        id: entry.id,
        title: receipt.title,
        sourceDirectory: lessonDir,
        sourceFingerprint: receipt.fingerprint,
        movieSha256: receipt.sha256,
        articleSha256: receipt.sourceSha256,
        ...(posterFile ? { posterPath: posterFile } : {}),
      });
    }
    const selectionFile = path.join(outputDir, "r2-selection.json");
    await writeFile(
      selectionFile,
      JSON.stringify(
        {
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          lessons: lessonsSelection,
        },
        null,
        2,
      ) + "\n",
    );
    const publishOut = path.join(outputDir, "r2-publication");
    const webManifest = "web/src/generated/lesson-videos.json";
    const isSubset = Boolean(
      options.lessons && selected.length < allLessons.length,
    );
    const publishArgs = [
      "videos/publish-r2.mjs",
      "publish",
      "--selection",
      selectionFile,
      "--output",
      publishOut,
      "--env-file",
      options.envFile,
      "--concurrency",
      String(options.concurrency),
      "--web-manifest",
      webManifest,
      ...(isSubset ? ["--merge-existing-manifest", webManifest] : []),
    ];
    console.log(
      `[videos] publishing ${lessonsSelection.length} lessons to Cloudflare R2...`,
    );
    await runSubprocess(process.execPath, publishArgs, { stream: true });
    const pruned = await pruneSupersededWithheld(path.join(root, webManifest));
    console.log(
      `[videos] R2 publication complete (${lessonsSelection.length} videos); pruned ${pruned} superseded withheld-lesson-videos.json entries.`,
    );
  }

  if (options.pruneR2) {
    await pruneOrphanedR2Objects(options);
  }
}

async function readEnvToken(envFilePath) {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  if (process.env.CLOUDFLARE_CACHE_PURGER)
    return process.env.CLOUDFLARE_CACHE_PURGER;
  const fullPath = path.resolve(root, envFilePath);
  const text = await readFile(fullPath, "utf8");
  const vars = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match) vars[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  const token = vars.CLOUDFLARE_API_TOKEN || vars.CLOUDFLARE_CACHE_PURGER;
  if (!token) {
    throw new Error(
      `No CLOUDFLARE_API_TOKEN or CLOUDFLARE_CACHE_PURGER found in ${envFilePath}`,
    );
  }
  return token;
}

async function pruneOrphanedR2Objects(options) {
  const cfg = JSON.parse(
    await readFile(path.join(root, "videos/r2.config.json"), "utf8"),
  );
  const manifest = JSON.parse(
    await readFile(
      path.join(root, "web/src/generated/lesson-videos.json"),
      "utf8",
    ),
  );
  const activeKeys = new Set();
  for (const record of Object.values(manifest.videos ?? {})) {
    for (const field of ["url", "captions", "poster"]) {
      if (record[field]) {
        activeKeys.add(new URL(record[field]).pathname.replace(/^\//, ""));
      }
    }
  }
  if (activeKeys.size === 0) {
    throw new Error(
      "Refusing to prune R2: web/src/generated/lesson-videos.json has 0 active keys",
    );
  }
  const token = await readEnvToken(options.envFile);
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${cfg.accountId}/r2/buckets/${cfg.bucket}/objects`;
  const headers = { Authorization: `Bearer ${token}` };

  const allObjects = [];
  let cursor;
  do {
    const url = new URL(baseUrl);
    url.searchParams.set("per_page", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`R2 list failed: ${JSON.stringify(data)}`);
    }
    allObjects.push(...(data.result ?? []));
    cursor = data.result_info?.is_truncated
      ? data.result_info.cursor
      : undefined;
  } while (cursor);

  const presentKeys = new Set(allObjects.map((o) => o.key));
  const missingActive = [...activeKeys].filter((k) => !presentKeys.has(k));
  if (missingActive.length > 0) {
    throw new Error(
      `Refusing to prune R2: ${missingActive.length} active manifest object(s) missing from bucket (first: ${missingActive[0]})`,
    );
  }

  const orphans = allObjects.filter(
    (o) => o.key.startsWith("lessons/") && !activeKeys.has(o.key),
  );
  const orphanBytes = orphans.reduce((s, o) => s + Number(o.size || 0), 0);
  console.log(
    `[videos] R2 bucket ${cfg.bucket}: ${activeKeys.size} active objects verified, ${orphans.length} orphaned lessons/* objects (${(orphanBytes / 1073741824).toFixed(2)} GiB) to delete`,
  );
  if (orphans.length === 0) return;

  let index = 0;
  let deleted = 0;
  const workerCount = Math.min(8, Math.max(1, options.concurrency || 4));
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (index < orphans.length) {
        const obj = orphans[index++];
        const encodedKey = obj.key
          .split("/")
          .map((seg) => encodeURIComponent(seg))
          .join("/");
        let lastErr;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await fetch(`${baseUrl}/${encodedKey}`, {
              method: "DELETE",
              headers,
            });
            if (res.ok || res.status === 404) {
              deleted++;
              if (deleted % 100 === 0 || deleted === orphans.length) {
                console.log(
                  `[videos] pruned ${deleted}/${orphans.length} orphaned R2 objects`,
                );
              }
              lastErr = null;
              break;
            }
            lastErr = new Error(
              `DELETE ${obj.key} -> HTTP ${res.status}: ${await res.text()}`,
            );
          } catch (err) {
            lastErr = err;
          }
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }
        if (lastErr) throw lastErr;
      }
    }),
  );
  console.log(
    `[videos] R2 prune complete: deleted ${deleted} orphaned objects (${(orphanBytes / 1073741824).toFixed(2)} GiB reclaimed); ${activeKeys.size} active objects retained.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
