#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
  link,
  unlink,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { frameSelection } from './lib/frame-selection.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolPath = fileURLToPath(import.meta.url);
export const CUE_FRAME_POLICY = 'provider-cue-early-middle-late-v1';
export const CUE_HOLD_FRAME_POLICY = 'provider-cue-early-middle-late-after-v1';
const samplePhases = ['early', 'middle', 'late'];

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

function rational(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || !value) return NaN;
  const [numerator, denominator = '1'] = value.split('/');
  const n = Number(numerator),
    d = Number(denominator);
  return d === 0 ? NaN : n / d;
}

function frameCount(timeline) {
  const parts = [...(timeline.intro ? [timeline.intro] : []), ...(timeline.scenes ?? [])];
  if (!parts.length || !Array.isArray(timeline.scenes)) throw new Error('Timeline has no scenes');
  return parts.reduce((count, scene) => {
    if (!Number.isInteger(scene.frames) || scene.frames < 1)
      throw new Error(`Timeline scene ${scene.id ?? '(unknown)'} has invalid frame count`);
    return count + scene.frames;
  }, 0);
}

function sampleRecord(scene, sceneIndex, cue, phase, localTimeSeconds, fps, totalFrames) {
  const requestedGlobalSeconds = scene.start + localTimeSeconds;
  const requestedFrame = Math.round(requestedGlobalSeconds * fps);
  const frame = Math.max(0, Math.min(totalFrames - 1, requestedFrame));
  return {
    scene: scene.id,
    sceneIndex,
    sceneStartSeconds: scene.start,
    beat: cue.beat ?? null,
    cueId: cue.id,
    phrase: cue.phrase,
    targets: [...cue.targets],
    phase,
    sceneLocalSeconds: localTimeSeconds,
    requestedGlobalSeconds,
    frame,
    timeSeconds: frame / fps,
    clampedToFrameRange: frame !== requestedFrame,
  };
}

export function deriveCueSelection(timeline, { afterCues = false } = {}) {
  const fps = rational(timeline.fps);
  if (!Number.isFinite(fps) || fps <= 0) throw new Error('Timeline has an invalid frame rate');
  const totalFrames = frameCount(timeline);
  const scenes = [
    ...(timeline.intro ? [{ scene: timeline.intro, sceneIndex: null }] : []),
    ...timeline.scenes.map((scene, sceneIndex) => ({ scene, sceneIndex })),
  ];
  const samples = [];
  let cueCount = 0;

  for (const { scene, sceneIndex } of scenes) {
    const cues = scene.visualCues ?? [];
    if (!Array.isArray(cues))
      throw new Error(`Timeline scene ${scene.id ?? '(unknown)'} has invalid visualCues`);
    if (cues.length && (!scene.id || !Number.isFinite(scene.start))) {
      throw new Error(
        `Timeline scene ${scene.id ?? '(unknown)'} needs an absolute start time for cue extraction`,
      );
    }
    for (const cue of cues) {
      cueCount++;
      if (
        !cue.id ||
        typeof cue.phrase !== 'string' ||
        !Array.isArray(cue.targets) ||
        cue.targets.length === 0
      ) {
        throw new Error(`Timeline scene ${scene.id} has an incomplete visual cue`);
      }
      if (!Number.isFinite(cue.start) || !Number.isFinite(cue.end) || cue.end < cue.start) {
        throw new Error(`Timeline cue ${scene.id}/${cue.id} has an invalid interval`);
      }
      const duration = cue.end - cue.start;
      const times = [
        Math.min(cue.start + 0.08, (cue.start + cue.end) / 2),
        (cue.start + cue.end) / 2,
        cue.end - Math.min(0.04, duration / 4),
      ];
      for (const [index, time] of times.entries()) {
        samples.push(
          sampleRecord(scene, sceneIndex, cue, samplePhases[index], time, fps, totalFrames),
        );
      }
      if (afterCues) {
        if (cue.linger !== undefined && (!Number.isFinite(cue.linger) || cue.linger < 0)) {
          throw new Error(`Timeline cue ${scene.id}/${cue.id} has an invalid linger duration`);
        }
        // Observe the result after the words and again after emphasis clears.
        // Scene-exit fades already have registered production-review samples.
        const latestVisible = (scene.frames - 1) / fps - 0.35;
        for (const [phase, time] of [
          ['after-phrase', cue.end + 2 / fps],
          ['after-highlight', cue.end + (cue.linger ?? 0.5) + 0.2],
        ])
          if (time <= latestVisible) {
            samples.push(sampleRecord(scene, sceneIndex, cue, phase, time, fps, totalFrames));
          }
      }
    }
  }

  const byFrame = new Map();
  for (const [sampleIndex, sample] of samples.entries()) {
    let group = byFrame.get(sample.frame);
    if (!group) {
      group = { frame: sample.frame, timeSeconds: sample.timeSeconds, sampleIndices: [] };
      byFrame.set(sample.frame, group);
    }
    group.sampleIndices.push(sampleIndex);
  }
  const frames = [...byFrame.values()].sort((a, b) => a.frame - b.frame);
  return {
    fps,
    totalFrames,
    policy: afterCues ? CUE_HOLD_FRAME_POLICY : CUE_FRAME_POLICY,
    cueCount,
    samples,
    frames,
    selectionSha256: sha256(Buffer.from(JSON.stringify(samples))),
  };
}

export function frameFileName(frame) {
  return `frame-${String(frame).padStart(6, '0')}.png`;
}

export function pngDimensions(bytes) {
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('Extracted frame is not a valid PNG');
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export async function validateReusableReview(directory, expectedBindings, expectedSelection) {
  const reviewPath = path.join(directory, 'review.json');
  let review;
  try {
    review = JSON.parse(await readFile(reviewPath, 'utf8'));
  } catch (error) {
    throw new Error(`Existing cue review is incomplete or unreadable: ${error.message}`);
  }
  if (review.schemaVersion !== 1 || review.status !== 'extracted')
    throw new Error('Existing cue review has an unsupported schema or status');
  for (const [key, value] of Object.entries(expectedBindings)) {
    if (!sameValue(review.bindings?.[key], value))
      throw new Error(`Existing cue review binding differs: ${key}`);
  }
  if (
    !sameValue(review.selection?.policy, expectedSelection.policy ?? CUE_FRAME_POLICY) ||
    review.selection?.selectionSha256 !== expectedSelection.selectionSha256 ||
    review.samples?.length !== expectedSelection.samples.length ||
    review.frames?.length !== expectedSelection.frames.length
  ) {
    throw new Error('Existing cue review selection differs');
  }

  const frameByNumber = new Map();
  for (const [index, expected] of expectedSelection.frames.entries()) {
    const stored = review.frames[index];
    const image = frameFileName(expected.frame);
    if (
      stored?.frame !== expected.frame ||
      stored.image !== image ||
      stored.timeSeconds !== expected.timeSeconds
    ) {
      throw new Error(`Existing cue review frame mapping differs at frame ${expected.frame}`);
    }
    const bytes = await readFile(path.join(directory, image));
    const actualHash = sha256(bytes),
      dimensions = pngDimensions(bytes);
    if (
      actualHash !== stored.sha256 ||
      dimensions.width !== expectedBindings.width ||
      dimensions.height !== expectedBindings.height ||
      stored.width !== dimensions.width ||
      stored.height !== dimensions.height
    ) {
      throw new Error(`Existing cue review image binding differs: ${image}`);
    }
    frameByNumber.set(expected.frame, stored);
  }

  const selectionKeys = [
    'scene',
    'sceneIndex',
    'sceneStartSeconds',
    'beat',
    'cueId',
    'phrase',
    'targets',
    'phase',
    'sceneLocalSeconds',
    'requestedGlobalSeconds',
    'frame',
    'timeSeconds',
    'clampedToFrameRange',
  ];
  for (const [index, expected] of expectedSelection.samples.entries()) {
    const stored = review.samples[index];
    for (const key of selectionKeys) {
      if (!sameValue(stored?.[key], expected[key]))
        throw new Error(
          `Existing cue review sample mapping differs: ${expected.cueId}/${expected.phase}/${key}`,
        );
    }
    const frame = frameByNumber.get(expected.frame);
    if (
      stored.image !== frame.image ||
      stored.imageSha256 !== frame.sha256 ||
      stored.imageWidth !== frame.width ||
      stored.imageHeight !== frame.height
    ) {
      throw new Error(
        `Existing cue review sample image differs: ${expected.cueId}/${expected.phase}`,
      );
    }
  }

  const allowed = new Set([
    'review.json',
    ...expectedSelection.frames.map((item) => frameFileName(item.frame)),
  ]);
  const actualFiles = await readdir(directory);
  if (actualFiles.length !== allowed.size || actualFiles.some((file) => !allowed.has(file))) {
    throw new Error('Existing cue review folder contains missing or unexpected files');
  }
  return review;
}

async function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout = [],
      stderr = [];
    let stdoutBytes = 0,
      stderrText = '';
    child.stdout.on('data', (chunk) => {
      if (stdoutBytes < 1024 * 1024) {
        stdout.push(chunk);
        stdoutBytes += chunk.length;
      }
    });
    child.stderr.on('data', (chunk) => {
      stderrText = (stderrText + chunk.toString()).slice(-12000);
    });
    child.once('error', rejectRun);
    child.once('close', (code, signal) => {
      if (code !== 0)
        rejectRun(new Error(`${command} exited ${code ?? signal}: ${stderrText.trim()}`));
      else resolveRun({ stdout: Buffer.concat(stdout).toString('utf8'), stderr: stderrText });
    });
  });
}

async function ffmpegVersion() {
  const { stdout } = await run('ffmpeg', ['-version']);
  return stdout.split(/\r?\n/, 1)[0];
}

async function probeMovie(file) {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height,avg_frame_rate,r_frame_rate,nb_frames,duration',
    '-of',
    'json',
    file,
  ]);
  const streams = JSON.parse(stdout).streams ?? [];
  const stream = streams[0];
  if (!stream) throw new Error('FFprobe found no video stream');
  return {
    width: Number(stream.width),
    height: Number(stream.height),
    fps: rational(stream.avg_frame_rate),
    avgFrameRate: stream.avg_frame_rate,
    nominalFrameRate: stream.r_frame_rate,
    frameCount: Number(stream.nb_frames),
    durationSeconds: Number(stream.duration),
  };
}

function closeEnough(a, b, tolerance = 1e-6) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
}

async function readVerifiedRender(inputRoot, lessonId, manifestRow) {
  const folder = path.join(inputRoot, lessonId);
  const videoPath = path.join(folder, `${lessonId}.mp4`);
  const timelinePath = path.join(folder, 'timeline.json');
  const receiptPath = path.join(folder, 'verification.json');
  const [receiptBytes, timelineBytes, videoHash] = await Promise.all([
    readFile(receiptPath),
    readFile(timelinePath),
    hashFile(videoPath),
  ]);
  const receipt = JSON.parse(receiptBytes.toString('utf8'));
  const timeline = JSON.parse(timelineBytes.toString('utf8'));
  const timelineHash = sha256(timelineBytes),
    receiptHash = sha256(receiptBytes);
  if (receipt.id !== lessonId)
    throw new Error(`${lessonId}: verification receipt has ID ${receipt.id}`);
  if (path.basename(receipt.file ?? `${lessonId}.mp4`) !== `${lessonId}.mp4`)
    throw new Error(`${lessonId}: receipt names a different movie`);
  if (!/^[a-f0-9]{64}$/.test(receipt.fingerprint ?? ''))
    throw new Error(`${lessonId}: verification receipt has no valid source fingerprint`);
  if (videoHash !== receipt.sha256 || videoHash !== receipt.artifactSha256?.[`${lessonId}.mp4`]) {
    throw new Error(`${lessonId}: movie SHA-256 does not match verification receipt`);
  }
  if (timelineHash !== receipt.artifactSha256?.['timeline.json'])
    throw new Error(`${lessonId}: timeline SHA-256 does not match verification receipt`);
  if (manifestRow && manifestRow.fingerprint !== receipt.fingerprint)
    throw new Error(
      `${lessonId}: collection manifest source fingerprint differs from verification receipt`,
    );
  if (receipt.fullDecode !== 'passed' || receipt.frameAudit?.passed !== true)
    throw new Error(`${lessonId}: final verification receipt lacks a passing full decode`);
  const totalFrames = frameCount(timeline);
  if (receipt.frameAudit.frames !== totalFrames)
    throw new Error(`${lessonId}: receipt frame count differs from the timeline`);
  if (manifestRow && manifestRow.sha256 !== videoHash)
    throw new Error(
      `${lessonId}: collection manifest movie hash differs from verification receipt`,
    );
  if (
    manifestRow?.artifactSha256?.['timeline.json'] &&
    manifestRow.artifactSha256['timeline.json'] !== timelineHash
  ) {
    throw new Error(`${lessonId}: collection manifest timeline hash differs from final timeline`);
  }

  const timelineFps = rational(timeline.fps),
    receiptFps = rational(receipt.fps);
  const timelineWidth = Number(timeline.width),
    timelineHeight = Number(timeline.height);
  if (
    !Number.isInteger(timelineWidth) ||
    !Number.isInteger(timelineHeight) ||
    !closeEnough(timelineFps, receiptFps)
  )
    throw new Error(`${lessonId}: receipt dimensions or frame rate differ from timeline`);
  const probe = await probeMovie(videoPath);
  if (
    probe.width !== timelineWidth ||
    probe.height !== timelineHeight ||
    !closeEnough(probe.fps, timelineFps) ||
    probe.frameCount !== totalFrames ||
    !closeEnough(probe.durationSeconds, totalFrames / timelineFps, 1 / timelineFps + 1e-6)
  ) {
    throw new Error(
      `${lessonId}: current MP4 dimensions, frame rate, duration, or frame count differ from the final timeline`,
    );
  }

  return {
    folder,
    videoPath,
    timelinePath,
    receiptPath,
    receipt,
    timeline,
    probe,
    totalFrames,
    movieSha256: videoHash,
    timelineSha256: timelineHash,
    verificationSha256: receiptHash,
  };
}

async function decodeAndExtract(videoPath, stage, groups) {
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-xerror',
    '-err_detect',
    'explode',
    '-threads',
    '4',
    '-i',
    videoPath,
    '-map',
    '0:v:0',
  ];
  if (groups.length) {
    const selection = frameSelection(groups.map(({ frame }) => frame));
    args.push(
      '-vf',
      `select=${selection}`,
      '-fps_mode',
      'passthrough',
      '-threads',
      '1',
      '-compression_level',
      '3',
      '-start_number',
      '0',
      path.join(stage, 'selected-%06d.png'),
    );
  } else {
    args.push('-f', 'null', '-');
  }
  await run('ffmpeg', args);
}

function sampleWithImage(sample, frame) {
  return {
    ...sample,
    image: frame.image,
    imageSha256: frame.sha256,
    imageWidth: frame.width,
    imageHeight: frame.height,
  };
}

async function atomicJson(target, value) {
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  try {
    await writeFile(temporary, bytes, { flag: 'wx' });
    await link(temporary, target);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

async function processLesson(inputRoot, outputRoot, lessonId, options) {
  const render = await readVerifiedRender(inputRoot, lessonId, options.manifestRow);
  const selection = deriveCueSelection(render.timeline, { afterCues: options.afterCues });
  const bindings = {
    lessonId,
    moviePath: `${lessonId}/${lessonId}.mp4`,
    sourceFingerprint: render.receipt.fingerprint,
    movieSha256: render.movieSha256,
    verificationSha256: render.verificationSha256,
    timelineSha256: render.timelineSha256,
    toolSha256: options.toolSha256,
    ffmpegVersion: options.ffmpegVersion,
    selectionSha256: selection.selectionSha256,
    fps: render.probe.fps,
    width: render.probe.width,
    height: render.probe.height,
    frameCount: render.totalFrames,
  };
  const finalDirectory = path.join(outputRoot, lessonId);
  try {
    await access(finalDirectory);
    const review = await validateReusableReview(finalDirectory, bindings, selection);
    await assertRenderUnchanged(render);
    return {
      id: lessonId,
      action: 'reused',
      reviewSha256: await hashFile(path.join(finalDirectory, 'review.json')),
      review,
    };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      if (error.message.startsWith('Existing cue review'))
        throw new Error(`${lessonId}: ${error.message}; choose a new --output path to refresh`);
      throw error;
    }
  }

  const stage = await mkdtemp(path.join(outputRoot, `.${lessonId}.stage-`));
  try {
    await decodeAndExtract(render.videoPath, stage, selection.frames);
    const generatedNames = (await readdir(stage)).filter((name) => name.endsWith('.png')).sort();
    if (generatedNames.length !== selection.frames.length) {
      throw new Error(
        `${lessonId}: FFmpeg extracted ${generatedNames.length}/${selection.frames.length} selected frames`,
      );
    }
    const frameRecords = [];
    for (const [index, group] of selection.frames.entries()) {
      const generated = path.join(stage, generatedNames[index]);
      const image = frameFileName(group.frame);
      const destination = path.join(stage, image);
      if (generated !== destination) await rename(generated, destination);
      const bytes = await readFile(destination),
        dimensions = pngDimensions(bytes);
      if (dimensions.width !== render.probe.width || dimensions.height !== render.probe.height) {
        throw new Error(`${lessonId}: extracted PNG dimensions differ from the verified movie`);
      }
      frameRecords.push({
        frame: group.frame,
        timeSeconds: group.timeSeconds,
        image,
        sha256: sha256(bytes),
        width: dimensions.width,
        height: dimensions.height,
      });
    }

    await assertRenderUnchanged(render);

    const frameByNumber = new Map(frameRecords.map((frame) => [frame.frame, frame]));
    const review = {
      schemaVersion: 1,
      status: 'extracted',
      lessonId,
      generatedAt: new Date().toISOString(),
      humanApproval: 'not-recorded',
      registeredEncodedReviewBundle: false,
      bindings,
      verification: {
        fullDecode: 'passed',
        decodeProcess:
          'ffmpeg reached end of file with -xerror and -err_detect explode; selected frame output was produced in the same decode pass.',
        decodedFrameCount: render.probe.frameCount,
        dimensions: { width: render.probe.width, height: render.probe.height },
        fps: render.probe.fps,
        averageFrameRate: render.probe.avgFrameRate,
        nominalFrameRate: render.probe.nominalFrameRate,
        durationSeconds: render.probe.durationSeconds,
        receiptFullDecode: render.receipt.fullDecode,
      },
      selection: {
        policy: selection.policy,
        formula:
          'early=min(start+0.08, midpoint); middle=midpoint; late=end-min(0.04, cueDuration/4). Each scene-local cue time is offset by timeline scene.start, rounded to nearest global frame, and clamped to the movie frame range.',
        ...(options.afterCues
          ? {
              holdFormula:
                'after-phrase=end+2/fps; after-highlight=end+(linger or 0.5)+0.2. Omit hold probes inside the final 0.35 seconds of a scene. These samples expose state resets for editorial review; an intentional subsequent change can be valid.',
            }
          : {}),
        cueCount: selection.cueCount,
        sampleCount: selection.samples.length,
        uniqueFrameCount: selection.frames.length,
        selectionSha256: selection.selectionSha256,
      },
      frames: frameRecords,
      samples: selection.samples.map((sample) =>
        sampleWithImage(sample, frameByNumber.get(sample.frame)),
      ),
    };
    await writeFile(path.join(stage, 'review.json'), `${JSON.stringify(review, null, 2)}\n`, {
      flag: 'wx',
    });
    await rename(stage, finalDirectory);
    return {
      id: lessonId,
      action: 'extracted',
      reviewSha256: await hashFile(path.join(finalDirectory, 'review.json')),
      review,
    };
  } catch (error) {
    await rm(stage, { recursive: true, force: true });
    throw error;
  }
}

async function assertRenderUnchanged(render) {
  const [movieAfter, timelineAfter, receiptAfter] = await Promise.all([
    hashFile(render.videoPath),
    hashFile(render.timelinePath),
    hashFile(render.receiptPath),
  ]);
  if (
    movieAfter !== render.movieSha256 ||
    timelineAfter !== render.timelineSha256 ||
    receiptAfter !== render.verificationSha256
  ) {
    throw new Error(
      `${render.receipt.id}: movie, timeline, or verification receipt changed during extraction or review reuse`,
    );
  }
}

async function collectionManifest(
  inputRoot,
  outputRoot,
  entries,
  inputManifestSha256,
  toolSha256,
  afterCues,
) {
  const lessons = [];
  for (const entry of entries) {
    const reviewPath = path.join(outputRoot, entry.id, 'review.json');
    const review = JSON.parse(await readFile(reviewPath, 'utf8'));
    lessons.push({
      id: entry.id,
      sourceFingerprint: review.bindings.sourceFingerprint,
      movieSha256: review.bindings.movieSha256,
      reviewPath: `${entry.id}/review.json`,
      reviewSha256: await hashFile(reviewPath),
      samples: review.selection.sampleCount,
      uniqueFrames: review.selection.uniqueFrameCount,
    });
  }
  return {
    schemaVersion: 1,
    status: 'complete',
    generatedAt: new Date().toISOString(),
    humanApproval: 'not-recorded',
    registeredEncodedReviewBundle: false,
    renderRoot: path.basename(inputRoot),
    renderManifest: { path: 'manifest.json', sha256: inputManifestSha256 },
    toolSha256,
    selectionPolicy: afterCues ? CUE_HOLD_FRAME_POLICY : CUE_FRAME_POLICY,
    lessons,
  };
}

async function writeOrReuseCollectionManifest(outputRoot, candidate) {
  const target = path.join(outputRoot, 'manifest.json');
  try {
    const existing = JSON.parse(await readFile(target, 'utf8'));
    const { generatedAt: _generatedAt, ...stableExisting } = existing;
    const { generatedAt: _candidateGeneratedAt, ...stableCandidate } = candidate;
    if (!sameValue(stableExisting, stableCandidate))
      throw new Error('Existing collection manifest differs; choose a new --output path');
    return { action: 'reused', sha256: await hashFile(target) };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await atomicJson(target, candidate);
  return { action: 'written', sha256: await hashFile(target) };
}

function parseArgs(args) {
  const parsed = { lessons: [], all: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--help') {
      parsed.help = true;
      continue;
    }
    if (arg === '--all') {
      parsed.all = true;
      continue;
    }
    if (arg === '--after-cues') {
      parsed.afterCues = true;
      continue;
    }
    if (arg === '--input' || arg === '--output' || arg === '--lesson') {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      if (arg === '--lesson') parsed.lessons.push(value);
      else parsed[arg.slice(2)] = value;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (parsed.help) return parsed;
  if (!parsed.input || !parsed.output) throw new Error('--input and --output are required');
  if (parsed.all === parsed.lessons.length > 0)
    throw new Error('Choose either --all or one or more --lesson IDs');
  if (new Set(parsed.lessons).size !== parsed.lessons.length)
    throw new Error('Repeated --lesson IDs must be unique');
  for (const id of parsed.lessons) if (!isLessonId(id)) throw new Error(`Invalid lesson ID: ${id}`);
  return parsed;
}

function isLessonId(id) {
  return typeof id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
}

function isInside(parent, candidate) {
  const rel = path.relative(parent, candidate);
  return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel));
}

async function canonicalCandidate(candidate) {
  let current = candidate;
  const suffix = [];
  for (;;) {
    try {
      return path.join(await realpath(current), ...suffix);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      suffix.unshift(path.basename(current));
      current = parent;
    }
  }
}

export async function main(args = process.argv.slice(2)) {
  const parsed = parseArgs(args);
  if (parsed.help) {
    console.log(
      'node videos/extract-narration-cue-frames.mjs --input RENDER_ROOT --output REVIEW_ROOT --lesson LESSON_ID [--lesson LESSON_ID ...]',
    );
    console.log(
      'node videos/extract-narration-cue-frames.mjs --input RENDER_ROOT --output REVIEW_ROOT --all [--after-cues]',
    );
    return;
  }
  const inputRoot = path.resolve(root, parsed.input),
    outputRoot = path.resolve(root, parsed.output);
  const realInputRoot = await realpath(inputRoot);
  if (isInside(realInputRoot, await canonicalCandidate(outputRoot)))
    throw new Error('REVIEW_ROOT must be outside RENDER_ROOT');
  await access(inputRoot);
  if (!(await stat(inputRoot)).isDirectory()) throw new Error('RENDER_ROOT must be a directory');
  await mkdir(outputRoot, { recursive: true });
  if (isInside(realInputRoot, await realpath(outputRoot)))
    throw new Error('REVIEW_ROOT must be outside RENDER_ROOT');
  const toolSha256 = await hashFile(toolPath),
    version = await ffmpegVersion();
  let entries,
    inputManifestSha256 = null;
  if (parsed.all) {
    const manifestPath = path.join(inputRoot, 'manifest.json');
    const bytes = await readFile(manifestPath);
    const rows = JSON.parse(bytes.toString('utf8'));
    if (!Array.isArray(rows) || rows.length === 0 || rows.some((row) => !row.id || !row.sha256)) {
      throw new Error('RENDER_ROOT/manifest.json is not a complete lesson receipt manifest');
    }
    if (
      rows.some(
        (row) =>
          !isLessonId(row.id) ||
          !/^[a-f0-9]{64}$/.test(row.sha256) ||
          !/^[a-f0-9]{64}$/.test(row.fingerprint ?? ''),
      )
    ) {
      throw new Error(
        'RENDER_ROOT/manifest.json has an invalid lesson ID, movie hash, or source fingerprint',
      );
    }
    if (new Set(rows.map((row) => row.id)).size !== rows.length)
      throw new Error('RENDER_ROOT/manifest.json contains duplicate lesson IDs');
    entries = rows;
    inputManifestSha256 = sha256(bytes);
  } else {
    entries = parsed.lessons.map((id) => ({ id }));
  }

  const results = [];
  for (const entry of entries) {
    const result = await processLesson(inputRoot, outputRoot, entry.id, {
      manifestRow: parsed.all ? entry : null,
      toolSha256,
      ffmpegVersion: version,
      afterCues: parsed.afterCues,
    });
    results.push(result);
    console.log(
      `${entry.id}: ${result.action}; ${result.review.selection.sampleCount} cue samples, ${result.review.selection.uniqueFrameCount} unique MP4 frames`,
    );
  }

  if (parsed.all) {
    if ((await hashFile(path.join(inputRoot, 'manifest.json'))) !== inputManifestSha256) {
      throw new Error('RENDER_ROOT/manifest.json changed during cue frame extraction');
    }
    const manifest = await collectionManifest(
      inputRoot,
      outputRoot,
      entries,
      inputManifestSha256,
      toolSha256,
      parsed.afterCues,
    );
    const result = await writeOrReuseCollectionManifest(outputRoot, manifest);
    console.log(
      `collection manifest ${result.action}: ${path.join(outputRoot, 'manifest.json')} (${result.sha256})`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
