#!/usr/bin/env node
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { createHash } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { timestamp } from './lib/lesson.mjs';
import { withStagedDelivery, hashDeliveryFiles } from './lib/delivery.mjs';
import { discoverLessons } from './catalog.mjs';
import { frameSelection } from './lib/frame-selection.mjs';

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const phases = [
  ['early', 0.12],
  ['middle', 0.5],
  ['late', 0.88],
];
const sceneList = (timeline) => [...(timeline.intro ? [timeline.intro] : []), ...timeline.scenes];
const expectedFrames = (timeline) =>
  sceneList(timeline).reduce((count, scene) => count + scene.frames, 0);

export function inspectionTargets(timeline, peaks = [], stillRuns = []) {
  const frames = expectedFrames(timeline),
    samples = new Map();
  const add = (time, target) => {
    const frame = Math.max(0, Math.min(frames - 1, Math.round(time * timeline.fps)));
    let sample = samples.get(frame);
    if (!sample) {
      sample = { frame, time: frame / timeline.fps, targets: [] };
      samples.set(frame, sample);
    }
    sample.targets.push(target);
  };
  for (const scene of sceneList(timeline)) {
    add(scene.start, { scene: scene.id, phase: 'start' });
    add(scene.start + (scene.frames - 1) / timeline.fps, { scene: scene.id, phase: 'end' });
    if (scene === timeline.intro) {
      for (const [phase, progress] of phases)
        add(scene.start + scene.duration * progress, { scene: scene.id, phase });
    } else
      for (const [beat, timing] of scene.beats.entries()) {
        for (const [phase, progress] of phases)
          add(scene.start + timing.start + (timing.until - timing.start) * progress, {
            scene: scene.id,
            beat,
            phase,
          });
      }
  }
  for (const peak of peaks)
    add(peak.frame / timeline.fps, { scene: peak.scene, phase: 'change-peak' });
  for (const scene of timeline.scenes) {
    const longest = stillRuns
      .filter((run) => run.scene === scene.id)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 2);
    for (const run of longest)
      add((run.firstFrame + run.lastFrame) / 2 / timeline.fps, {
        scene: run.scene,
        phase: 'long-hold',
        duration: run.duration,
      });
  }
  return [...samples.values()].sort((a, b) => a.frame - b.frame);
}

export class DecodedFrameAudit {
  constructor(timeline, width = 320, height = 180) {
    this.timeline = timeline;
    this.width = width;
    this.height = height;
    this.metrics = [];
    this.previous = null;
  }

  context(frame) {
    const time = frame / this.timeline.fps;
    const scene =
      sceneList(this.timeline).find(
        (item) => time >= item.start && time < item.start + item.duration,
      ) ?? sceneList(this.timeline).at(-1);
    const local = time - scene.start,
      knownTransitions = [];
    if (local < 0.45 || scene.duration - local <= 0.35) knownTransitions.push('scene-fade');
    for (const [beat, timing] of (scene.beats ?? []).entries()) {
      if (Math.abs(local - timing.start) <= Math.max(0.12, 2 / this.timeline.fps))
        knownTransitions.push(`beat-${beat}-start`);
      if (Math.abs(local - timing.until) <= Math.max(0.12, 2 / this.timeline.fps))
        knownTransitions.push(`beat-${beat}-end`);
    }
    return { scene: scene.id, knownTransitions };
  }

  observe(pixels) {
    if (pixels.length !== this.width * this.height)
      throw new Error('Decoded grayscale frame is incomplete');
    let difference = 0,
      changed = 0,
      foreground = 0,
      contentPixels = 0;
    const top = Math.floor((this.height * 200) / 1080),
      bottom = Math.ceil((this.height * 985) / 1080);
    const left = Math.floor((this.width * 100) / 1920),
      right = Math.ceil((this.width * 1820) / 1920);
    for (let y = top; y < bottom; y++)
      for (let x = left; x < right; x++) {
        const i = y * this.width + x;
        const delta = this.previous ? Math.abs(pixels[i] - this.previous[i]) : 0;
        difference += delta;
        if (delta > 12) changed++;
        if (pixels[i] > 48) foreground++;
        contentPixels++;
      }
    this.metrics.push([
      this.metrics.length,
      Number((difference / contentPixels).toFixed(4)),
      Number((changed / contentPixels).toFixed(6)),
      Number((foreground / contentPixels).toFixed(6)),
    ]);
    this.previous = Buffer.from(pixels);
  }

  finish() {
    const expected = expectedFrames(this.timeline);
    if (this.metrics.length !== expected)
      throw new Error(`Decoded ${this.metrics.length}/${expected} video frames`);
    const blankRuns = [],
      stillCandidates = [],
      peaks = [],
      perScene = new Map();
    let blank, still;
    for (const [frame, difference, changedFraction, foregroundFraction] of this.metrics) {
      const context = this.context(frame),
        known = context.knownTransitions.length > 0;
      if (foregroundFraction < 0.001) {
        if (!blank || blank.scene !== context.scene || blank.knownTransition !== known) {
          blank = {
            firstFrame: frame,
            lastFrame: frame,
            scene: context.scene,
            knownTransition: known,
          };
          blankRuns.push(blank);
        } else blank.lastFrame = frame;
      } else blank = null;
      if (
        !known &&
        context.scene !== this.timeline.intro?.id &&
        foregroundFraction >= 0.001 &&
        difference <= 0.01 &&
        changedFraction < 0.00002
      ) {
        if (!still || still.scene !== context.scene) {
          still = { firstFrame: frame, lastFrame: frame, scene: context.scene };
          stillCandidates.push(still);
        } else still.lastFrame = frame;
      } else still = null;
      if (difference >= 1 || changedFraction >= 0.01) {
        const candidates = perScene.get(context.scene) ?? [];
        candidates.push({
          frame,
          time: frame / this.timeline.fps,
          difference,
          changedFraction,
          ...context,
        });
        perScene.set(context.scene, candidates);
      }
    }
    for (const candidates of perScene.values()) {
      candidates.sort((a, b) => b.difference - a.difference);
      const chosen = [];
      for (const candidate of candidates) {
        if (
          chosen.every((peak) => Math.abs(peak.frame - candidate.frame) >= this.timeline.fps * 0.35)
        )
          chosen.push(candidate);
        if (chosen.length === 3) break;
      }
      peaks.push(...chosen);
    }
    const unexplainedBlankRuns = blankRuns.filter((run) => !run.knownTransition);
    const stillRuns = stillCandidates
      .map((run) => ({
        ...run,
        duration: (run.lastFrame - run.firstFrame + 1) / this.timeline.fps,
      }))
      .filter((run) => run.duration >= 6);
    return {
      passed: unexplainedBlankRuns.length === 0,
      decodePassed: true,
      frames: this.metrics.length,
      expectedFrames: expected,
      width: this.width,
      height: this.height,
      metrics: 'decoded-frame-metrics.json',
      metricColumns: ['frame', 'meanAbsoluteDifference', 'changedFraction', 'foregroundFraction'],
      contentRegion: { x: 100, y: 200, width: 1720, height: 785 },
      thresholds: {
        changedPixelDifference: 12,
        foregroundGray: 48,
        blankForegroundFraction: 0.001,
        stillMeanDifference: 0.01,
        stillChangedFraction: 0.00002,
        stillMinimumSeconds: 6,
      },
      blankRuns,
      unexplainedBlankRuns,
      stillRuns,
      peakChanges: peaks.sort((a, b) => a.frame - b.frame),
      interpretation:
        'Complete decode coverage and blank-content detection. Unexplained blank frames fail. Temporal peaks and long holds are review candidates; reading and prediction pauses can be intentional. Layout, teaching quality and aesthetics require the registered geometry audit and visual review.',
    };
  }
}

async function decodeEveryFrame(video, timeline) {
  const audit = new DecodedFrameAudit(timeline),
    frameBytes = audit.width * audit.height;
  const child = spawn(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-threads',
      '4',
      '-i',
      video,
      '-map',
      '0:v:0',
      '-vf',
      `scale=${audit.width}:${audit.height}:flags=area,format=gray`,
      '-fps_mode',
      'passthrough',
      '-pix_fmt',
      'gray',
      '-f',
      'rawvideo',
      'pipe:1',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let stderr = '',
    pending = Buffer.alloc(0);
  child.stderr.on('data', (bytes) => {
    stderr = (stderr + bytes).slice(-12000);
  });
  const exited = new Promise((resolveExit) => {
    child.once('error', (error) => resolveExit({ error }));
    child.once('close', (code, signal) => resolveExit({ code, signal }));
  });
  try {
    for await (const chunk of child.stdout) {
      pending = pending.length ? Buffer.concat([pending, chunk]) : chunk;
      let offset = 0;
      while (pending.length - offset >= frameBytes) {
        audit.observe(pending.subarray(offset, offset + frameBytes));
        offset += frameBytes;
      }
      pending = pending.subarray(offset);
    }
    const exit = await exited;
    if (exit.error) throw exit.error;
    if (exit.code !== 0)
      throw new Error(`FFmpeg decode failed (${exit.code ?? exit.signal}): ${stderr}`);
    if (pending.length)
      throw new Error(`FFmpeg returned ${pending.length} bytes of an incomplete video frame`);
    return { audit, summary: audit.finish() };
  } catch (error) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      const timer = setTimeout(() => child.kill('SIGKILL'), 1000);
      await exited;
      clearTimeout(timer);
    }
    throw error;
  }
}

async function sheet(out, name, samples, width = 480) {
  const columns = 3,
    height = Math.round((width * 9) / 16),
    rowHeight = height + 38;
  const canvas = createCanvas(width * columns, rowHeight * Math.ceil(samples.length / columns)),
    ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a1020';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const [index, sample] of samples.entries()) {
    const x = (index % columns) * width,
      y = Math.floor(index / columns) * rowHeight;
    const image = await loadImage(join(out, sample.image));
    ctx.drawImage(image, x, y, width, height);
    ctx.fillStyle = '#e9efff';
    ctx.font = '16px sans-serif';
    const target = sample.targets[0];
    ctx.fillText(
      `${timestamp(sample.time, '.')} · ${target.scene} ${target.beat === undefined ? '' : `b${target.beat + 1} `}${target.phase}`,
      x + 8,
      y + height + 25,
      width - 16,
    );
  }
  await writeFile(join(out, name), await canvas.encode('png'));
}

async function inspect(id, directory) {
  const folder = join(directory, id);
  const receipt = JSON.parse(await readFile(join(folder, 'verification.json')));
  const timelineBytes = await readFile(join(folder, 'timeline.json'));
  if (hash(timelineBytes) !== receipt.artifactSha256?.['timeline.json'])
    throw new Error(`Timeline does not match verified MP4: ${id}`);
  const timeline = JSON.parse(timelineBytes),
    video = join(folder, `${id}.mp4`),
    sha256 = hash(await readFile(video));
  if (sha256 !== receipt.sha256 || receipt.fullDecode !== 'passed')
    throw new Error(`Unverified MP4: ${id}`);
  return withStagedDelivery(join(folder, 'encoded-review'), async (out) => {
    const { audit, summary } = await decodeEveryFrame(video, timeline);
    const samples = inspectionTargets(timeline, summary.peakChanges, summary.stillRuns);
    await mkdir(join(out, 'frames'), { recursive: true });
    await mkdir(join(out, 'scenes'), { recursive: true });
    const select = frameSelection(samples.map((sample) => sample.frame));
    await run('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-threads',
      '4',
      '-i',
      video,
      '-map',
      '0:v:0',
      '-vf',
      `select=${select}`,
      '-fps_mode',
      'passthrough',
      '-threads',
      '1',
      '-compression_level',
      '3',
      '-start_number',
      '0',
      join(out, 'frames/sample-%04d.png'),
    ]);
    for (const [index, sample] of samples.entries()) {
      sample.image = `frames/sample-${String(index).padStart(4, '0')}.png`;
      const image = await loadImage(join(out, sample.image));
      if (image.width !== receipt.width || image.height !== receipt.height)
        throw new Error(`Encoded frame dimensions changed: ${id}`);
    }
    const sceneSheets = [],
      overview = [];
    for (const scene of sceneList(timeline)) {
      const sceneSamples = samples.filter((sample) =>
        sample.targets.some((target) => target.scene === scene.id),
      );
      const image = `scenes/${scene.id}.png`;
      await sheet(out, image, sceneSamples);
      sceneSheets.push({ scene: scene.id, image });
      overview.push(
        sceneSamples.find((sample) =>
          sample.targets.some((target) => target.scene === scene.id && target.phase === 'middle'),
        ) ?? sceneSamples[0],
      );
    }
    await sheet(out, 'contact-sheet.png', overview, 640);
    await writeFile(join(out, summary.metrics), JSON.stringify(audit.metrics));
    await writeFile(join(out, 'decoded-frame-audit.json'), JSON.stringify(summary, null, 2));
    await writeFile(
      join(out, 'index.html'),
      '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>Encoded frame review</title><style>body{font:17px/1.5 system-ui;background:#0a1020;color:#e9efff;margin:2rem}a{color:#63deec}img{display:block;max-width:100%;height:auto}section{margin:3rem 0}</style>' +
        `<h1>Encoded frame review</h1><p>Decoded ${summary.frames} frames. Each sheet covers the scene boundaries and every spoken beat at early, middle, and late positions, plus peak-change frames and representative long holds.</p>` +
        `<p><a href="decoded-frame-audit.json">Temporal diagnostics</a>: ${summary.blankRuns.length} blank-content runs, ${summary.stillRuns.length} holds of at least six seconds, and ${summary.peakChanges.length} representative changes. Holds need narration and motion review; reading pauses can be intentional. Known fades and beat transitions are labeled in the report.</p>` +
        sceneSheets
          .map(
            (item) =>
              `<section><h2>${item.scene.replaceAll('-', ' ')}</h2><a href="${item.image}"><img src="${item.image}" loading="lazy" alt="${item.scene} encoded samples"></a></section>`,
          )
          .join('') +
        '</html>\n',
    );
    const artifactSha256 = await hashDeliveryFiles(out);
    await writeFile(
      join(out, 'verification.json'),
      JSON.stringify(
        {
          videoSha256: sha256,
          inspectorSha256: hash(await readFile(fileURLToPath(import.meta.url))),
          decodedFrameAudit: summary,
          samples,
          sceneSheets,
          artifactSha256,
        },
        null,
        2,
      ),
    );
    console.log(
      `${id}: decoded all ${summary.frames} frames; extracted ${samples.length} frames covering every beat, scene boundary, intro, and temporal peaks; unexplained blank ranges: ${summary.unexplainedBlankRuns.length}`,
    );
    return summary;
  });
}

async function main() {
  const args = process.argv.slice(2);
  const value = (flag) => {
    const index = args.indexOf(flag);
    if (index < 0) return undefined;
    if (!args[index + 1] || args[index + 1].startsWith('--'))
      throw new Error(`${flag} requires a value`);
    return args[index + 1];
  };
  const directory = resolve(root, value('--input') ?? 'build/videos'),
    chosen = value('--lesson');
  const ids = (
    await discoverLessons(undefined, undefined, { lessonId: chosen, withStage: true })
  ).map((lesson) => lesson.id);
  const failures = [];
  for (const id of ids) if (!(await inspect(id, directory)).passed) failures.push(id);
  if (failures.length)
    throw new Error(
      `Unexplained blank frames in ${failures.join(', ')}; inspect encoded-review/decoded-frame-audit.json`,
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
