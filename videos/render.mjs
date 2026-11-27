#!/usr/bin/env node
import { registerLessonFonts } from './lib/fonts.mjs';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { constants, createReadStream, existsSync } from 'node:fs';
import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  rename,
  stat,
  copyFile,
  mkdtemp,
  rm,
} from 'node:fs/promises';
import { hostname, release } from 'node:os';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { basename, dirname, resolve, join, relative, sep } from 'node:path';
import { mixCourseBed } from './lib/course-bed.mjs';
import { courseNarrator, prepareTakes } from './lib/course-speech.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkFilm } from 'vizmatic/stage';
import {
  filmEncoderSettings,
  posterTime,
  renderFilmFrame,
  renderFilmVideo,
} from 'vizmatic/stage/export';
import { verifiedClockReceipt } from './lib/frame-clock.mjs';
import { assertDecoderSettings } from './lib/decoder-settings.mjs';
import { checkLessonCoverage } from './check-coverage.mjs';
import { Resvg } from '@resvg/resvg-js';
import { ImageData } from '@napi-rs/canvas';
import { drawFrame } from './lib/scene.mjs';
import { renderRgbaVideo } from 'vizmatic';
import {
  compileStageLesson,
  estimatedTimeline,
  sceneWindows,
  stageOpeningHasPicture,
} from './lib/stage-lesson.mjs';
import {
  readLesson,
  estimateCanvasScene,
  makeSceneTimeline,
  makeLessonTimeline,
  frameState,
  timestamp,
  srt,
  vtt,
} from './lib/lesson.mjs';
import { withStagedDelivery, hashDeliveryFiles } from './lib/delivery.mjs';
import { BRAND_INTRO_SECONDS, drawBrandIntro, lessonIntro } from './lib/brand.mjs';
import { FrameAudit, layoutIssues, LAYOUT_AUDIT_RULES } from './lib/frame-audit.mjs';
import { writeLayoutReview } from './lib/layout-review.mjs';
import { renderEngineBytes, renderEngineProvenance } from './lib/render-engine.mjs';
import { teachingCaptions, teachingPolicy } from './lib/teaching-captions.mjs';
import {
  lessonSourcePaths,
  canvasLessonImplementation,
  productionSourceManifest,
  verifyProductionSources,
} from './lib/lesson-production.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const args = process.argv.slice(2);
const value = (flag, fallback) => {
  const eq = args.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
};
const has = (flag) => args.includes(flag);
const fps = Number(value('--fps', 30));
const width = Number(value('--width', 1920));
const height = Math.round((width * 9) / 16 / 2) * 2;
const threads = Number(value('--threads', 4));
const outputRoot = resolve(root, value('--output', 'build/videos'));
const provider = value('--provider', courseNarrator.provider);
const ttsScript = resolve(root, value('--tts-script', courseNarrator.ttsScript));
const hash = (value) => createHash('sha256').update(value).digest('hex');
const exists = async (file) => {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
};
const requestedEncoder = value('--h264-encoder', 'libx264');
let encoderOptions = { h264Encoder: 'libx264', requireH264Encoder: true };

export async function selectCourseEncoder(requested, vizmatic, format) {
  if (requested !== 'libx264' && requested !== 'videotoolbox' && requested !== 'nvenc')
    throw new Error('--h264-encoder must be libx264, videotoolbox, or nvenc');
  const h264Encoder =
    (requested === 'videotoolbox' || requested === 'nvenc') && vizmatic.resolveH264Encoder
      ? await vizmatic.resolveH264Encoder(requested, undefined, format)
      : 'libx264';
  if (h264Encoder !== 'videotoolbox' && h264Encoder !== 'nvenc' && h264Encoder !== 'libx264')
    throw new Error(`Vizmatic returned an unknown H.264 encoder: ${h264Encoder}`);
  return { h264Encoder, requireH264Encoder: true };
}

function actualH264Encoder(output) {
  const actual = output.h264Encoder ?? 'libx264';
  if (actual !== encoderOptions.h264Encoder)
    throw new Error(
      `Expected ${encoderOptions.h264Encoder} for this film, but Vizmatic used ${actual}`,
    );
  return actual;
}

const VIDEO_PROFILE = Object.freeze({
  name: 'clean',
  burnedCaptions: false,
  progressIndicator: false,
  captionFiles: ['srt', 'vtt'],
});
const SAMPLE_PROGRESS = [0.02, 0.25, 0.5, 0.75, 0.98];

function run(command, argv, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, argv, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });
    let stdout = '',
      stderr = '';
    child.stdout?.on('data', (data) => {
      stdout += data;
    });
    child.stderr?.on('data', (data) => {
      stderr = (stderr + data).slice(-12000);
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolvePromise(stdout)
        : reject(new Error(`${command} exited ${code}: ${stderr}`)),
    );
  });
}

async function probe(file) {
  return JSON.parse(
    await run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file]),
  );
}

function registerFonts() {
  registerLessonFonts();
}

function narrationDetails({ model, engineVersion, langCode, sampleRate, speed }) {
  return { model, engineVersion, langCode, sampleRate, speed };
}

async function prepareAudio(lesson, out) {
  const voice = value('--voice', courseNarrator.voice);
  const rate = value('--rate', courseNarrator.rate);
  const profile = { provider, voice, rate, ttsScript };
  const jobs = lesson.scenes.flatMap((scene, sceneIndex) =>
    scene.beats.map((beat, beatIndex) => ({ sceneIndex, beatIndex, text: beat.say })),
  );
  const { takes, adapterHash } = await prepareTakes(
    jobs.map((job) => job.text),
    outputRoot,
    {
      profile,
      retainedOnly: has('--retained-audio-only'),
      onTake: (take, i) =>
        console.log(`[${lesson.id}] voice ${i + 1}/${jobs.length}: ${take.duration.toFixed(1)}s`),
    },
  );
  const ttsAdapter = { path: relative(root, ttsScript).split(sep).join('/'), sha256: adapterHash };
  const sounds = jobs.map(({ sceneIndex, beatIndex }, i) => ({
    sceneIndex,
    beatIndex,
    ...takes[i],
  }));
  const scenes = lesson.scenes.map((scene, i) => {
    const sceneSounds = sounds.filter((sound) => sound.sceneIndex === i);
    return {
      ...makeSceneTimeline(
        scene,
        sceneSounds.map((sound) => sound.duration),
        fps,
      ),
      sounds: sceneSounds,
    };
  });
  const intro = lessonIntro(lesson, fps);
  const timeline = {
    id: lesson.id,
    provider,
    ...(provider === courseNarrator.provider &&
    voice === courseNarrator.voice &&
    rate === courseNarrator.rate &&
    ttsScript === resolve(root, courseNarrator.ttsScript)
      ? narrationDetails(courseNarrator)
      : {}),
    voice,
    rate,
    ttsAdapter,
    fps,
    width,
    height,
    intro,
    ...makeLessonTimeline(scenes, intro.duration),
  };
  timeline.captionPolicy = teachingPolicy;
  timeline.captions = timeline.scenes.flatMap(teachingCaptions);
  await writeFile(join(out, 'timeline.json'), JSON.stringify(timeline, null, 2));
  await writeFile(join(out, `${lesson.id}.srt`), srt(timeline.captions));
  await writeFile(join(out, `${lesson.id}.vtt`), vtt(timeline.captions));
  await writeFile(
    join(out, `${lesson.id}.script.md`),
    `# ${lesson.title}\n\n${lesson.scenes.map((scene, i) => `## ${timestamp(timeline.scenes[i].start, '.')} ${scene.title}\n\n${scene.beats.map((beat) => beat.say).join('\n\n')}`).join('\n\n')}\n`,
  );
  await writeFile(
    join(out, `${lesson.id}.chapters.txt`),
    '00:00:00 LeetLLM\n' +
      timeline.scenes
        .map((scene, i) => `${timestamp(scene.start).slice(0, 8)} ${lesson.scenes[i].title}`)
        .join('\n') +
      '\n',
  );
  return timeline;
}

const sceneAudioEncoder = ['-c:a', 'flac', '-compression_level', '1', '-sample_fmt', 's16'];

function beatSounds(timeline, holdSounds) {
  return timeline.beats.map((beat) => {
    if (beat.hold_sound === undefined) return null;
    const id = beat.hold_sound;
    const sound = holdSounds && Object.hasOwn(holdSounds, id) && holdSounds[id];
    if (!sound) throw new Error(`Unknown hold_sound "${id}" in ${timeline.id}`);
    return sound;
  });
}

function holdSoundKey(timing, holdSounds) {
  const clips = beatSounds(timing, holdSounds);
  return clips.some(Boolean)
    ? { holdSounds: clips.map((clip) => clip && [clip.sampleRate, hash(clip.samples)]) }
    : {};
}

export async function sceneAudio(timeline, file, holdSounds) {
  const clips = beatSounds(timeline, holdSounds);
  const directory = clips.some(Boolean)
    ? await mkdtemp(join(dirname(file), '.hold-sounds-'))
    : null;
  try {
    await encodeSceneAudio(timeline, file, clips, directory);
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true });
  }
}

async function encodeSceneAudio(timeline, file, clips, directory) {
  const inputs = [];
  const filters = [];
  const { renderNarrationHold } = directory ? await import('vizmatic/stage/export') : {};
  let input = 0;
  for (const [i, sound] of timeline.sounds.entries()) {
    const beat = timeline.beats[i];
    const speechInput = input++;
    const clip = clips[i];
    if (clip) {
      const speechFrames = Math.round((beat.end - beat.start) * 48000);
      const holdFrames = Math.round((beat.until - beat.start) * 48000) - speechFrames;
      if (renderNarrationHold) {
        const output = join(directory, `beat-${i}.flac`);
        await renderNarrationHold({
          narration: sound.audio,
          speechFrames,
          holdFrames,
          sound: clip,
          output,
        });
        inputs.push('-i', output);
        filters.push(`[${speechInput}:a]anull[a${i}]`);
      } else {
        // Vizmatic 0.8.1 takes the PCM as another input to this scene's existing FFmpeg pass.
        const { samples, sampleRate } = clip;
        if (
          !(samples instanceof Float32Array) ||
          !samples.length ||
          !Number.isSafeInteger(sampleRate) ||
          sampleRate <= 0
        )
          throw new Error('Expected mono PCM with a positive sample rate');
        if (samples.length * 48000 > holdFrames * sampleRate)
          throw new Error('Sound exceeds the narration hold');
        const raw = join(directory, `beat-${i}.f32le`);
        const bytes = Buffer.allocUnsafe(samples.length * 4);
        for (const [frame, sample] of samples.entries()) {
          if (!Number.isFinite(sample) || Math.abs(sample) > 1)
            throw new Error('Invalid PCM amplitude');
          bytes.writeFloatLE(sample, frame * 4);
        }
        await writeFile(raw, bytes);
        inputs.push(
          '-i',
          sound.audio,
          '-f',
          'f32le',
          '-ar',
          String(sampleRate),
          '-ac',
          '1',
          '-i',
          raw,
        );
        filters.push(
          `[${speechInput}:a]aformat=sample_rates=48000:channel_layouts=stereo,apad,atrim=end_sample=${speechFrames}[speech${i}]`,
          `[${input++}:a]aformat=sample_rates=48000,pan=stereo|c0=c0|c1=c0,apad,atrim=end_sample=${holdFrames}[hold${i}]`,
          `[speech${i}][hold${i}]concat=n=2:v=0:a=1[a${i}]`,
        );
      }
    } else {
      inputs.push('-i', sound.audio);
      const duration = sound.duration + (beat.until - beat.end);
      filters.push(
        `[${speechInput}:a]aformat=sample_rates=48000:channel_layouts=stereo,apad,atrim=duration=${duration.toFixed(6)}[a${i}]`,
      );
    }
  }
  filters.push(
    `${timeline.sounds.map((_, i) => `[a${i}]`).join('')}concat=n=${timeline.sounds.length}:v=0:a=1,adelay=400|400,apad,atrim=duration=${timeline.duration}[out]`,
  );
  await run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    ...inputs,
    '-filter_complex',
    filters.join(';'),
    '-map',
    '[out]',
    ...sceneAudioEncoder,
    '-ar',
    '48000',
    file,
  ]);
}

/**
 * The intro joins the lesson without another encode, so it must use the lesson's encoder settings.
 * Pass them for a stage film. Canvas lessons use the defaults, as the intro does.
 */
async function renderIntro(encoder = {}) {
  const cache = join(outputRoot, '.scene-cache', 'brand');
  await mkdir(cache, { recursive: true });
  const effectiveEncoder =
    encoderOptions.h264Encoder === 'libx264'
      ? encoder
      : Object.fromEntries(Object.entries(encoder).filter(([k]) => k !== 'tune'));
  const family =
    encoderOptions.h264Encoder === 'libx264'
      ? 'leetllm-intro'
      : `leetllm-intro-${encoderOptions.h264Encoder}`;
  const name = effectiveEncoder.preset
    ? `${family}-${effectiveEncoder.preset}-crf${effectiveEncoder.crf}${effectiveEncoder.tune ? `-${effectiveEncoder.tune}` : ''}`
    : family;
  const file = join(cache, `00-${name}.mp4`);
  const audioFile = file.replace(/\.mp4$/, '.flac');
  const standalone = join(cache, `${name}.mp4`);
  const marker = join(cache, `00-${name}.render.json`);
  const logoSha256 = hash(await readFile(join(here, 'assets/leetllm-mark.svg')));
  const sources = await Promise.all(
    ['lib/brand.mjs', 'lib/frame-audit.mjs', 'assets/leetllm-mark.svg', 'render.mjs'].map((name) =>
      readFile(join(here, name)),
    ),
  );
  const key = hash(
    Buffer.concat([
      ...sources,
      Buffer.from(
        JSON.stringify({
          width,
          height,
          fps,
          encoder: effectiveEncoder,
          h264Encoder: encoderOptions.h264Encoder,
        }),
      ),
    ]),
  );
  const frames = Math.round(BRAND_INTRO_SECONDS * fps);
  if (
    (await exists(file)) &&
    (await exists(audioFile)) &&
    (await exists(standalone)) &&
    (await exists(marker))
  ) {
    const previous = JSON.parse(await readFile(marker, 'utf8'));
    if (
      previous.key === key &&
      previous.h264Encoder === encoderOptions.h264Encoder &&
      previous.audit?.frames === frames &&
      previous.audit.passed
    ) {
      return { file, audioFile, standalone, marker, audit: previous.audit, logoSha256 };
    }
  }
  const canvas = createCanvas(width, height);
  const audit = new FrameAudit('leetllm-intro', fps);
  let frameIndex = 0;
  const output = await renderRgbaVideo(
    (frame) => {
      const result = drawBrandIntro(canvas.getContext('2d'), frame.time / 1000);
      audit.observe(frameIndex++, result);
      return canvas.data();
    },
    {
      width,
      height,
      fps,
      duration: BRAND_INTRO_SECONDS * 1000,
      outputPath: file,
      threads,
      ...effectiveEncoder,
      ...encoderOptions,
    },
  );
  const summary = audit.finish(frames);
  const inputs = [523.25, 783.99, 1046.5].flatMap((frequency) => [
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=${frequency}:sample_rate=48000:duration=${BRAND_INTRO_SECONDS}`,
  ]);
  const notes = [650, 790, 930].map(
    (delay, index) =>
      `[${index}:a]afade=t=out:st=0:d=1.7,volume=0.26,adelay=${delay}|${delay},apad,atrim=duration=${BRAND_INTRO_SECONDS}[n${index}]`,
  );
  notes.push(
    '[n0][n1][n2]amix=inputs=3:normalize=0,aformat=sample_rates=48000:channel_layouts=stereo[out]',
  );
  await run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    ...inputs,
    '-filter_complex',
    notes.join(';'),
    '-map',
    '[out]',
    ...sceneAudioEncoder,
    audioFile,
  ]);
  await run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    file,
    '-i',
    audioFile,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    standalone,
  ]);
  await writeFile(
    marker,
    JSON.stringify({ key, h264Encoder: actualH264Encoder(output), audit: summary }, null, 2),
  );
  return { file, audioFile, standalone, marker, audit: summary, logoSha256 };
}

async function introPreview(intro, out) {
  await mkdir(out, { recursive: true });
  await copyFile(intro.standalone, join(out, 'leetllm-intro.mp4'));
  const canvas = createCanvas(width, height);
  const times = [0.25, 0.7, 1.1, 1.5, 1.9, 2.4, 3.0, 3.6];
  const sheet = createCanvas(1920, 600),
    ctx = sheet.getContext('2d');
  ctx.fillStyle = '#0a1020';
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  for (const [index, time] of times.entries()) {
    drawBrandIntro(canvas.getContext('2d'), time);
    const name = `intro-${String(index + 1).padStart(2, '0')}.png`;
    await writeFile(join(out, name), await canvas.encode('png'));
    const x = (index % 4) * 480,
      y = Math.floor(index / 4) * 300;
    ctx.drawImage(canvas, x, y, 480, 270);
    ctx.fillStyle = '#a8b5d1';
    ctx.font = '20px "Lesson Sans"';
    ctx.fillText(`${time.toFixed(2)}s`, x + 16, y + 292);
  }
  await writeFile(join(out, 'contact-sheet.png'), await sheet.encode('png'));
}

function renderAt(canvas, lesson, scene, timeline, time, index, draw) {
  const state = frameState(timeline, time, index, lesson.scenes.length);
  const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
  return {
    state,
    labels: Array.isArray(audit?.labels) ? audit.labels : [],
    shapes: Array.isArray(audit?.shapes) ? audit.shapes : [],
    connectors: Array.isArray(audit?.connectors) ? audit.connectors : [],
    paths: Array.isArray(audit?.paths) ? audit.paths : [],
    groups: Array.isArray(audit?.groups) ? audit.groups : [],
    issues: layoutIssues(audit ?? {}),
  };
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );
}

function sampleCaption(captions, seconds) {
  return captions.find((item) => seconds >= item.start && seconds < item.end) ?? null;
}

export function galleryPngEncoder(canvas) {
  let previousPixels, previousPng;
  return async () => {
    const pixels = canvas.data();
    if (previousPixels?.equals(pixels)) return previousPng;
    const png = await canvas.encode('png');
    previousPixels = pixels;
    previousPng = png;
    return png;
  };
}

async function previews(lesson, timeline, draw, out, paint) {
  const canvas = createCanvas(width, height);
  const encodeFrame = galleryPngEncoder(canvas);
  const paintSample =
    paint ?? ((scene, timing, time, i) => renderAt(canvas, lesson, scene, timing, time, i, draw));
  const frameDirectory = join(out, 'previews', 'frames');
  const sceneSheetDirectory = join(out, 'previews', 'scenes');
  await mkdir(frameDirectory, { recursive: true });
  await mkdir(sceneSheetDirectory, { recursive: true });
  const thumbWidth = 320,
    thumbHeight = 180,
    columns = 3;
  const sampleCount = lesson.scenes.reduce(
    (count, scene) => count + scene.beats.length * SAMPLE_PROGRESS.length,
    0,
  );
  const sheet = createCanvas(thumbWidth * columns, thumbHeight * Math.ceil(sampleCount / columns));
  const sheetContext = sheet.getContext('2d');
  const overview = createCanvas(1280, 360 * Math.ceil(lesson.scenes.length / 2));
  const overviewContext = overview.getContext('2d');
  overviewContext.fillStyle = '#0a1020';
  overviewContext.fillRect(0, 0, overview.width, overview.height);
  const samples = [];
  let sheetIndex = 0;

  for (const [i, scene] of lesson.scenes.entries()) {
    const timing = timeline?.scenes[i] ?? estimateCanvasScene(scene, fps);
    const sceneSampleCount = timing.beats.length * SAMPLE_PROGRESS.length;
    const sceneSheet = createCanvas(
      thumbWidth * columns,
      thumbHeight * Math.ceil(sceneSampleCount / columns),
    );
    const sceneSheetContext = sceneSheet.getContext('2d');
    let sceneSheetIndex = 0;

    for (const [beatIndex, beat] of timing.beats.entries()) {
      for (const progress of SAMPLE_PROGRESS) {
        const time = beat.start + (beat.until - beat.start) * progress;
        const audit = paintSample(scene, timing, time, i, canvas);
        const absoluteTime = (timing.start ?? 0) + time;
        const caption = sampleCaption(timeline?.captions ?? [], absoluteTime);
        const percentage = Math.round(progress * 100);
        const imageName = `${String(i + 1).padStart(2, '0')}-${scene.id}-beat-${String(beatIndex + 1).padStart(2, '0')}-p${String(percentage).padStart(2, '0')}.png`;
        const imagePath = join(frameDirectory, imageName);
        const png = await encodeFrame();
        await writeFile(imagePath, png);
        if (beatIndex === timing.beats.length - 1 && progress === 0.5) {
          await writeFile(join(out, `${String(i + 1).padStart(2, '0')}-${scene.id}.png`), png);
          overviewContext.drawImage(canvas, (i % 2) * 640, Math.floor(i / 2) * 360, 640, 360);
        }
        const sceneX = (sceneSheetIndex % columns) * thumbWidth;
        const sceneY = Math.floor(sceneSheetIndex / columns) * thumbHeight;
        sceneSheetContext.drawImage(canvas, sceneX, sceneY, thumbWidth, thumbHeight);
        const contactX = (sheetIndex % columns) * thumbWidth;
        const contactY = Math.floor(sheetIndex / columns) * thumbHeight;
        sheetContext.drawImage(canvas, contactX, contactY, thumbWidth, thumbHeight);

        samples.push({
          image: `previews/frames/${imageName}`,
          scene: { id: scene.id, title: scene.title, index: i + 1 },
          beat: { index: beatIndex + 1, text: beat.say },
          progress,
          localTime: time,
          timestamp: timestamp(absoluteTime, '.'),
          caption: caption ? { text: caption.text, start: caption.start, end: caption.end } : null,
          labels: audit.labels,
          issues: audit.issues,
        });
        sceneSheetIndex++;
        sheetIndex++;
      }
    }

    await writeFile(join(sceneSheetDirectory, `${scene.id}.png`), await sceneSheet.encode('png'));
  }

  await writeFile(join(out, 'contact-sheet.png'), await sheet.encode('png'));
  await writeFile(join(out, 'overview.png'), await overview.encode('png'));
  const gallery = [
    '<!doctype html>',
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${escapeHtml(lesson.title)} frame gallery</title>`,
    '<style>body{font:16px/1.5 system-ui,sans-serif;background:#0a1020;color:#e9efff;margin:2rem}a{color:#63deec}img{max-width:100%;height:auto;border-radius:8px;background:#111d34}.contact{max-width:960px}.scene{margin:3rem 0}.scene-sheet{max-width:960px}.frames{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:1rem}figure{margin:0;padding:1rem;background:#111d34;border-radius:12px}figcaption{margin-top:.75rem;overflow-wrap:anywhere}.meta{color:#8d9cb9}.issues{color:#ff988d}</style>',
    '</head><body>',
    `<h1>${escapeHtml(lesson.title)} frame gallery</h1>`,
    '<p>Clean animation frames. Captions remain in the companion SRT and VTT files.</p>',
    '<h2>Scene overview</h2>',
    '<a href="./overview.png"><img class="contact" src="./overview.png" alt="One representative frame for each scene"></a>',
    '<h2>All sampled frames</h2>',
    '<a href="./contact-sheet.png"><img class="contact" src="./contact-sheet.png" alt="Contact sheet of every sampled animation frame"></a>',
  ];
  for (const [sceneIndex, scene] of lesson.scenes.entries()) {
    const sceneSamples = samples.filter((sample) => sample.scene.index === sceneIndex + 1);
    gallery.push(
      `<section class="scene"><h2>${String(sceneIndex + 1).padStart(2, '0')} · ${escapeHtml(scene.title)}</h2>`,
    );
    gallery.push(
      `<a href="./previews/scenes/${escapeHtml(scene.id)}.png"><img class="scene-sheet" src="./previews/scenes/${escapeHtml(scene.id)}.png" alt="${escapeHtml(scene.title)} contact sheet"></a>`,
    );
    gallery.push('<div class="frames">');
    for (const sample of sceneSamples) {
      const issueText = sample.issues.length
        ? `<p class="issues">Audit issues: ${escapeHtml(sample.issues.map((issue) => (typeof issue === 'string' ? issue : JSON.stringify(issue))).join('; '))}</p>`
        : '';
      const captionText = sample.caption
        ? `<p><strong>Caption cue:</strong> ${escapeHtml(sample.caption.text)}</p>`
        : '<p class="meta">No caption cue at this sample.</p>';
      gallery.push(
        `<figure><a href="./${escapeHtml(sample.image)}"><img loading="lazy" src="./${escapeHtml(sample.image)}" alt="${escapeHtml(scene.title)}, beat ${sample.beat.index} at ${Math.round(sample.progress * 100)} percent"></a><figcaption><strong>${escapeHtml(sample.timestamp)}</strong><span class="meta"> · Beat ${sample.beat.index} · ${Math.round(sample.progress * 100)}%</span><p>${escapeHtml(sample.beat.text)}</p>${captionText}${issueText}<p class="meta">Labels audited: ${sample.labels.length}; issues: ${sample.issues.length}</p></figcaption></figure>`,
      );
    }
    gallery.push('</div></section>');
  }
  gallery.push('</body></html>');
  await writeFile(join(out, 'frame-gallery.html'), `${gallery.join('\n')}\n`);
  await writeFile(
    join(out, 'frame-gallery.json'),
    JSON.stringify(
      {
        lesson: lesson.id,
        title: lesson.title,
        profile: VIDEO_PROFILE,
        timing: timeline ? 'measured-speech' : 'estimated-review-only',
        sampledProgress: SAMPLE_PROGRESS,
        sampleCount: samples.length,
        samples,
      },
      null,
      2,
    ),
  );
  const failures = samples.filter((sample) => sample.issues.length);
  if (failures.length)
    throw new Error(
      `${lesson.id}: ${failures.length} sampled frames have label issues; inspect ${join(out, 'frame-gallery.json')}`,
    );
}

async function sha256(path) {
  const hash = createHash('sha256');
  for await (const data of createReadStream(path)) hash.update(data);
  return hash.digest('hex');
}

export function checkpointScope(fingerprint, timeline, settings) {
  // Audio paths belong to an attempt. Their hashes and measured word times identify the recording.
  const scenes = timeline.scenes.map((scene) => ({
    ...scene,
    sounds: scene.sounds.map(({ audio, boundaries, ...sound }) => sound),
  }));
  return createHash('sha256')
    .update(JSON.stringify([fingerprint, { ...timeline, scenes }, settings]))
    .digest('hex');
}

const checkpointFiles = ['picture.mp4', 'narration.flac', 'audit.json'];

function checkpointIoError(error) {
  if (
    !error.code ||
    !['ENOENT', 'EACCES', 'EPERM', 'EIO', 'ENOSPC', 'EDQUOT', 'EROFS', 'ENOTDIR'].includes(
      error.code,
    )
  )
    throw error;
  console.warn(`Scene checkpoint unavailable: ${error.message}`);
  return false;
}

export function sceneCheckpoint(directory, key, files, encoder, frames) {
  const pointer = join(directory, basename(files[0]) + '.' + key + '.json');
  return {
    async save() {
      await mkdir(directory, { recursive: true });
      const entry = await mkdtemp(join(directory, 'take-'));
      try {
        const hashes = [];
        for (const [i, file] of files.entries()) {
          const saved = join(entry, checkpointFiles[i]);
          await copyFile(file, saved, constants.COPYFILE_FICLONE);
          hashes.push(await sha256(saved));
        }
        const receipt = join(entry, 'receipt.tmp');
        await writeFile(receipt, JSON.stringify({ entry: basename(entry), hashes }));
        await rename(receipt, pointer);
      } catch (error) {
        await rm(entry, { recursive: true, force: true });
        throw error;
      }
    },

    async restore() {
      let receipt;
      try {
        receipt = JSON.parse(await readFile(pointer, 'utf8'));
      } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) return false;
        throw error;
      }
      if (
        !/^take-[a-zA-Z0-9]+$/.test(receipt?.entry) ||
        !Array.isArray(receipt.hashes) ||
        receipt.hashes.length !== files.length
      )
        return false;
      const temp = await mkdtemp(join(dirname(files[0]), '.restore-'));
      try {
        for (const [i, name] of checkpointFiles.entries()) {
          const copy = join(temp, name);
          await copyFile(join(directory, receipt.entry, name), copy, constants.COPYFILE_FICLONE);
          if (receipt.hashes[i] !== (await sha256(copy))) return false;
        }
        const audit = JSON.parse(await readFile(join(temp, 'audit.json'), 'utf8'));
        if (
          audit?.key !== key ||
          audit.audioFormat !== 'flac' ||
          audit.h264Encoder !== encoder ||
          audit.frames !== frames ||
          audit.audit?.passed !== true ||
          audit.audit.frames !== frames
        )
          return false;
        await rm(files[2], { force: true });
        for (const [i, file] of files.entries()) await rename(join(temp, checkpointFiles[i]), file);
        return true;
      } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) return false;
        throw error;
      } finally {
        await rm(temp, { recursive: true, force: true });
      }
    },
  };
}

async function checkpointDirectory(fingerprint, timeline, mode) {
  const directory = process.env.LEETLLM_SCENE_CHECKPOINTS;
  if (!directory) return null;
  const scope = checkpointScope(fingerprint, timeline, {
    mode,
    width,
    height,
    fps,
    threads,
    stageQuality,
    stageWorkers,
    profile: VIDEO_PROFILE,
    sceneAudioEncoder,
    encoderOptions,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    host: hostname(),
    release: release(),
    ffmpeg: await run('ffmpeg', ['-version']),
  });
  return join(directory, scope);
}

async function renderScene(
  lesson,
  scene,
  timing,
  i,
  draw,
  out,
  fingerprint,
  checkpoints,
  holdSounds,
) {
  const name = `${String(i + 1).padStart(2, '0')}-${scene.id}`;
  const file = join(out, `${name}.mp4`),
    marker = join(out, `${name}.render.json`),
    audioFile = join(out, `${name}.flac`);
  const key = hash(
    JSON.stringify({
      fingerprint,
      h264Encoder: encoderOptions.h264Encoder,
      profile: VIDEO_PROFILE,
      width,
      height,
      fps,
      frames: timing.frames,
      duration: timing.duration,
      ...holdSoundKey(timing, holdSounds),
      audio: timing.sounds.map((s) => [s.key, s.audioHash, s.boundariesHash]),
    }),
  );
  const checkpoint =
    checkpoints &&
    sceneCheckpoint(
      checkpoints,
      key,
      [file, audioFile, marker],
      encoderOptions.h264Encoder,
      timing.frames,
    );
  if (await checkpoint?.restore().catch(checkpointIoError)) {
    console.log(`[${lesson.id}] restored scene ${i + 1}/${lesson.scenes.length}`);
    return file;
  }
  if ((await exists(file)) && (await exists(marker)) && (await exists(audioFile))) {
    let previous;
    try {
      previous = JSON.parse(await readFile(marker, 'utf8'));
    } catch {
      /* An interrupted marker write is a cache miss. */
    }
    if (
      previous?.key === key &&
      previous.audioFormat === 'flac' &&
      previous.h264Encoder === encoderOptions.h264Encoder &&
      previous.audit?.passed &&
      previous.audit.frames === timing.frames
    ) {
      console.log(`[${lesson.id}] cached scene ${i + 1}/${lesson.scenes.length}`);
      return file;
    }
  }
  await sceneAudio(timing, audioFile, holdSounds);
  const canvas = createCanvas(width, height);
  const frameAudit = new FrameAudit(scene.id, fps);
  let frameIndex = 0;
  console.log(
    `[${lesson.id}] rendering ${i + 1}/${lesson.scenes.length}: ${scene.title} (${timing.duration.toFixed(1)}s)`,
  );
  const output = await renderRgbaVideo(
    (frame) => {
      const audit = renderAt(canvas, lesson, scene, timing, frame.time / 1000, i, draw);
      frameAudit.observe(frameIndex++, audit);
      if (audit.issues.length)
        throw new Error(
          `${lesson.id}/${scene.id} at ${frame.time}ms: ${JSON.stringify(audit.issues)}`,
        );
      return canvas.data();
    },
    {
      width,
      height,
      fps,
      duration: timing.duration * 1000,
      outputPath: file,
      threads,
      ...encoderOptions,
    },
  );
  await writeFile(
    marker,
    JSON.stringify(
      {
        key,
        audioFormat: 'flac',
        h264Encoder: actualH264Encoder(output),
        duration: timing.duration,
        frames: timing.frames,
        audit: frameAudit.finish(timing.frames),
      },
      null,
      2,
    ),
  );
  await checkpoint?.save().catch(checkpointIoError);
  return file;
}

async function assemble(
  lesson,
  timeline,
  files,
  out,
  fingerprint,
  finalOut,
  cache,
  intro,
  engine = {},
  sourceManifest,
) {
  const concat = join(cache, 'scenes.ffconcat');
  const audioConcat = join(cache, 'audio.ffconcat');
  const escape = (s) => s.replaceAll("'", "'\\''");
  await writeFile(
    concat,
    'ffconcat version 1.0\n' + files.map((file) => `file '${escape(file)}'`).join('\n') + '\n',
  );
  await writeFile(
    audioConcat,
    'ffconcat version 1.0\n' +
      files.map((file) => `file '${escape(file.replace(/\.mp4$/, '.flac'))}'`).join('\n') +
      '\n',
  );
  const metadata = join(cache, 'chapters.ffmetadata');
  const esc = (s) => s.replace(/[=;#\\\n]/g, (c) => `\\${c}`);
  await writeFile(
    metadata,
    `;FFMETADATA1\ntitle=${esc(lesson.title)}\nartist=LeetLLM\ncomment=${esc(`Adapted from the LeetLLM lesson ${lesson.source.split('/').at(-2)}`)}\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=0\nEND=${Math.round(timeline.intro.duration * 1000)}\ntitle=LeetLLM\n` +
      timeline.scenes
        .map(
          (s, i) =>
            `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(s.start * 1000)}\nEND=${Math.round((s.start + s.duration) * 1000)}\ntitle=${esc(lesson.scenes[i].title)}\n`,
        )
        .join(''),
  );
  const partial = join(out, `${lesson.id}.partial.mp4`),
    final = join(out, `${lesson.id}.mp4`);
  const mixScratch = await mkdtemp(join(cache, '.score-'));
  let audioBed;
  try {
    const voiceWav = join(mixScratch, 'final-voice.wav');
    const mixWav = join(mixScratch, 'final-mix.flac');
    const timing = join(cache, 'soundbed-timing.json');
    await writeFile(
      timing,
      JSON.stringify({
        scenes: timeline.scenes.map((scene) => scene.start),
        beats: timeline.scenes.flatMap((scene) =>
          scene.beats.map((beat) => scene.start + beat.start),
        ),
      }),
    );
    await run('ffmpeg', [
      '-nostdin',
      '-y',
      '-loglevel',
      'error',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      audioConcat,
      '-ar',
      '48000',
      '-ac',
      '2',
      '-c:a',
      'pcm_s16le',
      voiceWav,
    ]);
    audioBed = await mixCourseBed({
      lesson: lesson.id,
      source: lesson.source,
      voice: voiceWav,
      introSeconds: timeline.intro.duration,
      out: mixWav,
      timing,
    });
    await run('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concat,
      '-i',
      mixWav,
      '-i',
      metadata,
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-map_metadata',
      '2',
      '-map_chapters',
      '2',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-ar',
      '48000',
      '-movflags',
      '+faststart',
      partial,
    ]);
  } finally {
    await rm(mixScratch, { recursive: true, force: true });
  }
  const [audioHash, media, , , audits] = await Promise.all([
    run('ffmpeg', [
      '-v',
      'error',
      '-i',
      partial,
      '-map',
      '0:a:0',
      '-c',
      'copy',
      '-f',
      'hash',
      '-hash',
      'sha256',
      '-',
    ]),
    probe(partial),
    run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', partial, '-f', 'null', '-']),
    assertDecoderSettings(partial),
    Promise.all(
      files.map(
        async (file) =>
          JSON.parse(await readFile(file.replace(/\.mp4$/, '.render.json'), 'utf8')).audit,
      ),
    ),
  ]);
  const encodedAudio = /^SHA256=([0-9a-f]{64})$/m.exec(audioHash);
  if (!encodedAudio) throw new Error('Cannot verify the encoded score');
  audioBed.encodedAudioSha256 = encodedAudio[1];
  const video = media.streams.find((s) => s.codec_type === 'video'),
    audio = media.streams.find((s) => s.codec_type === 'audio');
  if (
    video?.codec_name !== 'h264' ||
    audio?.codec_name !== 'aac' ||
    video.width !== width ||
    video.height !== height ||
    Math.abs(Number(media.format.duration) - timeline.duration) > 0.15 ||
    Math.abs(Number(video.duration) - Number(audio.duration)) > 0.15
  )
    throw new Error(`Final media contract failed: ${final}`);
  const expectedFrames =
    timeline.intro.frames + timeline.scenes.reduce((sum, scene) => sum + scene.frames, 0);
  const auditedFrames = audits.reduce((sum, audit) => sum + audit.frames, 0);
  if (auditedFrames !== expectedFrames || audits.some((audit) => !audit.passed))
    throw new Error(`Incomplete frame audit: ${lesson.id}`);
  const layoutReport = {
    passed: true,
    frames: auditedFrames,
    expectedFrames,
    issueFrames: 0,
    ruleCoverage: LAYOUT_AUDIT_RULES,
    scenes: audits,
  };
  await writeFile(join(out, 'frame-audit.json'), JSON.stringify(layoutReport, null, 2));
  await writeLayoutReview({
    out,
    lesson,
    timeline,
    report: layoutReport,
    renderFrame: () => {
      throw new Error('A passing layout audit has no issue frames');
    },
  });
  await copyFile(intro.standalone, join(out, 'leetllm-intro.mp4'));
  const receipt = {
    id: lesson.id,
    title: lesson.title,
    file: join(finalOut, `${lesson.id}.mp4`),
    source: lesson.source,
    sourceSha256: hash(await readFile(join(root, 'web/src/content', lesson.source))),
    fingerprint,
    sourceManifest,
    sha256: hash(await readFile(partial)),
    bytes: Number(media.format.size),
    duration: Number(media.format.duration),
    width: video.width,
    height: video.height,
    fps: video.r_frame_rate,
    averageFps: video.avg_frame_rate,
    videoCodec: video.codec_name,
    requestedH264Encoder: requestedEncoder,
    h264Encoder: encoderOptions.h264Encoder,
    audioCodec: audio.codec_name,
    audioBed,
    provider: timeline.provider,
    ...(timeline.model ? narrationDetails(timeline) : {}),
    voice: timeline.voice,
    rate: timeline.rate,
    ttsAdapter: timeline.ttsAdapter,
    scenes: lesson.scenes.length,
    videoEngine: engine.video ?? 'vizmatic.renderRgbaVideo',
    renderEngine: renderEngineProvenance(),
    motionEngine: engine.motion ?? 'vizmatic.motion',
    mathEngine: engine.math ?? 'vizmatic.renderMathSvg',
    labelAudit: engine.labelAudit ?? 'registered-geometry-every-frame',
    frameAudit: { frames: auditedFrames, passed: true },
    brandIntro: {
      duration: timeline.intro.duration,
      frames: timeline.intro.frames,
      logoSha256: intro.logoSha256,
    },
    sampledFrames: lesson.scenes.reduce(
      (n, scene) => n + scene.beats.length * SAMPLE_PROGRESS.length,
      0,
    ),
    videoProfile: VIDEO_PROFILE,
    spokenWords: lesson.scenes
      .flatMap((s) => s.beats)
      .reduce((n, b) => n + b.say.trim().split(/\s+/).length, 0),
    fullDecode: 'passed',
    generatedAt: new Date().toISOString(),
  };
  await rename(partial, final);
  await writeFile(
    join(out, 'source-manifest.json'),
    JSON.stringify(sourceManifest, null, 2) + '\n',
  );
  receipt.artifactSha256 = await hashDeliveryFiles(out);
  await verifiedClockReceipt(final, receipt, fps, { always: true, requireBrand: true });
  await writeFile(join(out, 'verification.json'), JSON.stringify(receipt, null, 2));
  return receipt;
}

const stageQuality = value('--quality', 'high');
const stageWorkers = Number(value('--workers', Math.max(2, threads)));
const stageBackend = value('--backend', 'cpu');
const stageMotionBlurRaw = value('--motion-blur', undefined);
const stageMotionBlur =
  stageMotionBlurRaw === undefined ? undefined : Number(stageMotionBlurRaw);
const stageDither = has('--dither') ? true : undefined;
const posterOnly = has('--poster-only');

// Paint a film frame on the review canvas. Bloom is a final-render effect, so previews omit it.
function stageFramePainter(compiled, timeline) {
  const windows = sceneWindows(timeline);
  return (_scene, _timing, time, sceneIndex, canvas) => {
    const pixels = new Resvg(compiled.svg(windows[sceneIndex].from + time), {
      fitTo: { mode: 'width', value: canvas.width },
      font: { loadSystemFonts: false },
    }).render();
    canvas
      .getContext('2d')
      .putImageData(
        new ImageData(new Uint8ClampedArray(pixels.pixels), pixels.width, pixels.height),
        0,
        0,
      );
    return { labels: [], shapes: [], connectors: [], paths: [], groups: [], issues: [] };
  };
}

// Check sampled moments across every beat. Errors stop the render, and warnings stay on record.
async function checkStageLesson(lesson, compiled, timeline, { strict = true } = {}) {
  // Check the picture the viewer rests on: each beat's end, and the moment before each next cue.
  // Tiles crossing each other in the middle of a morph are motion, not a layout problem.
  const windows = sceneWindows(timeline);
  const times = timeline.scenes.flatMap((scene, i) => {
    const cues = (scene.visualCues ?? []).map((cue) => cue.start).sort((a, b) => a - b);
    const rests = cues
      .slice(1)
      .map((start, k) => [cues[k], start])
      .filter(([from, to]) => to - from > 1.2)
      .map(([, to]) => to - 0.05);
    return [...scene.beats.map((beat) => beat.until - 0.04), ...rests].map(
      (time) => windows[i].from + time,
    );
  });
  const report = await checkFilm(compiled, { times });
  for (const finding of report.diagnostics) {
    console.log(
      `[${lesson.id}] ${finding.severity} ${finding.code} at ${finding.time.toFixed(2)}s: ${finding.message}`,
    );
  }
  if (strict && report.summary.errors)
    throw new Error(`${lesson.id}: the film check found ${report.summary.errors} error(s)`);
  return report;
}

async function renderStageScene(
  lesson,
  compiled,
  scene,
  timing,
  window,
  i,
  out,
  fingerprint,
  report,
  checkpoints,
  holdSounds,
) {
  const name = `${String(i + 1).padStart(2, '0')}-${scene.id}`;
  const file = join(out, `${name}.mp4`),
    marker = join(out, `${name}.render.json`),
    audioFile = join(out, `${name}.flac`);
  const key = hash(
    JSON.stringify({
      fingerprint,
      h264Encoder: encoderOptions.h264Encoder,
      profile: VIDEO_PROFILE,
      width,
      height,
      fps,
      stageQuality,
      ...(stageMotionBlur !== undefined ? { stageMotionBlur } : {}),
      ...(stageDither !== undefined ? { stageDither } : {}),
      encoder: filmEncoderSettings(stageQuality),
      frames: timing.frames,
      duration: timing.duration,
      ...holdSoundKey(timing, holdSounds),
      audio: timing.sounds.map((sound) => [sound.key, sound.audioHash, sound.boundariesHash]),
    }),
  );
  const checkpoint =
    checkpoints &&
    sceneCheckpoint(
      checkpoints,
      key,
      [file, audioFile, marker],
      encoderOptions.h264Encoder,
      timing.frames,
    );
  if (await checkpoint?.restore().catch(checkpointIoError)) {
    console.log(`[${lesson.id}] restored scene ${i + 1}/${lesson.scenes.length}`);
    return file;
  }
  if ((await exists(file)) && (await exists(marker)) && (await exists(audioFile))) {
    let previous;
    try {
      previous = JSON.parse(await readFile(marker, 'utf8'));
    } catch {
      /* An interrupted marker write is a cache miss. */
    }
    if (
      previous?.key === key &&
      previous.audioFormat === 'flac' &&
      previous.h264Encoder === encoderOptions.h264Encoder &&
      previous.audit?.passed &&
      previous.audit.frames === timing.frames
    ) {
      console.log(`[${lesson.id}] cached scene ${i + 1}/${lesson.scenes.length}`);
      return file;
    }
  }
  const started = performance.now();
  const [, output] = await Promise.all([
    sceneAudio(timing, audioFile, holdSounds),
    renderFilmVideo(compiled, file, {
      from: window.from,
      to: window.to,
      width,
      quality: stageQuality,
      backend: stageBackend,
      ...(stageMotionBlur !== undefined ? { motionBlur: stageMotionBlur } : {}),
      ...(stageDither !== undefined ? { dither: stageDither } : {}),
      workers: stageWorkers,
      threads,
      ...encoderOptions,
    }),
  ]);
  if (output.frameCount !== timing.frames)
    throw new Error(
      `${lesson.id}/${scene.id}: rendered ${output.frameCount} of ${timing.frames} frames`,
    );
  console.log(
    `[${lesson.id}] rendered ${i + 1}/${lesson.scenes.length} ${scene.id}: ${output.frameCount} frames at ${(output.frameCount / ((performance.now() - started) / 1000)).toFixed(1)} fps`,
  );
  const findings = report.diagnostics.filter(
    (finding) => finding.time >= window.from && finding.time < window.to,
  );
  await writeFile(
    marker,
    JSON.stringify(
      {
        key,
        audioFormat: 'flac',
        h264Encoder: actualH264Encoder(output),
        duration: timing.duration,
        frames: timing.frames,
        audit: {
          scene: scene.id,
          fps,
          frames: timing.frames,
          engine: 'vizmatic.stage',
          ruleCoverage: ['film.off_canvas', 'film.text_overlap', 'film.text_crossed'],
          labelInstances: 0,
          shapeInstances: 0,
          connectorInstances: 0,
          pathInstances: 0,
          issueFrames: 0,
          issues: findings,
          passed: true,
        },
      },
      null,
      2,
    ),
  );
  await checkpoint?.save().catch(checkpointIoError);
  return file;
}

async function runStageLessons() {
  const chosen = value('--lesson');
  const directory = join(here, 'stage-lessons');
  const entries = await readdir(directory, { withFileTypes: true });
  const ids = [
    ...new Set(
      entries.flatMap((entry) => {
        if (entry.isFile() && entry.name.endsWith('.lesson.yaml'))
          return [entry.name.replace(/\.lesson\.yaml$/, '')];
        if (entry.isDirectory() && existsSync(join(directory, entry.name, 'lesson.yaml')))
          return [entry.name];
        return [];
      }),
    ),
  ]
    .filter((id) => !chosen || id === chosen)
    .sort();
  if (!ids.length) throw new Error(`Stage lesson not found: ${chosen ?? '(any)'}`);
  const receipts = [];
  for (const id of ids) {
    const paths = lessonSourcePaths(id, { mode: 'stage', root });
    const lesson = await readLesson(join(root, paths.lessonFile), root);
    // Independently reviewed editions use the coverage ledger bound to their script.
    if (!has('--preview') && !has('--editor-submission')) {
      const { problems } = await checkLessonCoverage(lesson.id);
      if (problems.length)
        throw new Error(
          `${lesson.id}: the coverage ledger has problems. See videos/TEACHING_STANDARD.md.\n  ${problems.join('\n  ')}`,
        );
    }
    const filmFile = join(root, paths.moduleFile);
    const sourceManifest = await productionSourceManifest({
      root,
      id: lesson.id,
      mode: 'stage',
      ttsScript,
    });
    const { default: definition, holdSounds } = await import(pathToFileURL(filmFile).href);
    const spoken = lesson.scenes
      .flatMap((s) => s.beats)
      .reduce((n, b) => n + b.say.trim().split(/\s+/).length, 0);
    if (has('--validate') || has('--storyboard')) {
      const timeline = estimatedTimeline(lesson, fps);
      const { compiled } = await compileStageLesson(definition, lesson, timeline);
      const report = await checkStageLesson(lesson, compiled, timeline);
      console.log(
        `[${lesson.id}] stage film validated: ${lesson.scenes.length} scenes, ${spoken} spoken words, ${compiled.duration.toFixed(1)}s estimated, ${report.summary.warnings} warning(s)`,
      );
      if (has('--storyboard')) {
        const previewOut = join(outputRoot, 'previews', lesson.id);
        await mkdir(previewOut, { recursive: true });
        await previews(lesson, timeline, null, previewOut, stageFramePainter(compiled, timeline));
        console.log(`[${lesson.id}] storyboard ready: ${previewOut}`);
      }
      continue;
    }
    const engineBytes = renderEngineBytes();
    const cache = join(outputRoot, '.scene-cache', lesson.id);
    await mkdir(cache, { recursive: true });
    const out = join(outputRoot, lesson.id);
    if (has('--preview') || has('--audio-only')) {
      const previewOut = join(outputRoot, 'previews', lesson.id);
      await mkdir(previewOut, { recursive: true });
      const timeline = await prepareAudio(lesson, previewOut);
      if (has('--preview')) {
        const { compiled } = await compileStageLesson(definition, lesson, timeline);
        await checkStageLesson(lesson, compiled, timeline, { strict: false });
        await previews(lesson, timeline, null, previewOut, stageFramePainter(compiled, timeline));
      }
      console.log(`[${lesson.id}] preview ready: ${previewOut}`);
      continue;
    }
    let report;
    const receipt = await withStagedDelivery(
      out,
      async (stage) => {
        const timeline = await prepareAudio(lesson, stage);
        const adapterBytes = await readFile(ttsScript);
        if (hash(adapterBytes) !== timeline.ttsAdapter.sha256)
          throw new Error(`TTS adapter changed during audio preparation: ${ttsScript}`);
        const fingerprint = sourceManifest.fingerprint;
        const checkpoints = await checkpointDirectory(fingerprint, timeline, 'stage');
        const { compiled } = await compileStageLesson(definition, lesson, timeline);
        if (!stageOpeningHasPicture(compiled))
          throw new Error(`${lesson.id}: the first teaching frame after the brand animation is blank`);
        report = await checkStageLesson(lesson, compiled, timeline);
        if (posterOnly) {
          const posterAt = await posterTime(compiled);
          await renderFilmFrame(compiled, posterAt, join(stage, 'poster.png'), {
            width,
            dither: true,
            workers: stageWorkers,
          });
        } else {
          await previews(lesson, timeline, null, stage, stageFramePainter(compiled, timeline));
        }
        const intro = await renderIntro(filmEncoderSettings(stageQuality));
        const sceneFiles = [intro.file],
          windows = sceneWindows(timeline);
        const started = performance.now();
        for (const [i, scene] of lesson.scenes.entries()) {
          sceneFiles.push(
            await renderStageScene(
              lesson,
              compiled,
              scene,
              timeline.scenes[i],
              windows[i],
              i,
              cache,
              fingerprint,
              report,
              checkpoints,
              holdSounds,
            ),
          );
        }
        console.log(
          `[${lesson.id}] all scenes in ${((performance.now() - started) / 1000).toFixed(1)}s`,
        );
        if (!engineBytes.equals(renderEngineBytes()))
          throw new Error('Vizmatic engine changed during rendering');
        await verifyProductionSources(root, {
          id: lesson.id,
          sourceManifest,
          fingerprint,
          renderEngine: sourceManifest.renderEngine,
        });
        return assemble(
          lesson,
          timeline,
          sceneFiles,
          stage,
          fingerprint,
          out,
          cache,
          intro,
          {
            video: 'vizmatic.stage.renderFilmVideo',
            motion: 'vizmatic.stage',
            math: 'vizmatic.stage.tex',
            labelAudit: 'vizmatic.stage.checkFilm-sampled-beats',
          },
          sourceManifest,
        );
      },
      { preserveFailedStage: has('--preserve-failed-stage') },
    );
    // Stage films have no painter audit. This report takes the place of the aggregate occlusion audit.
    await writeFile(
      join(out, 'film-check.json'),
      JSON.stringify(
        {
          version: 1,
          id: lesson.id,
          rule: 'vizmatic.stage.checkFilm',
          sourceFingerprint: receipt.fingerprint,
          videoSha256: receipt.sha256,
          errors: report.summary.errors,
          warnings: report.summary.warnings,
          diagnostics: report.diagnostics,
          passed: report.summary.errors === 0,
        },
        null,
        2,
      ),
    );
    receipts.push(receipt);
    console.log(
      `[${lesson.id}] READY ${receipt.file} (${receipt.duration.toFixed(1)}s, ${(receipt.bytes / 1048576).toFixed(1)} MiB)`,
    );
  }
  if (receipts.length && !has('--no-manifest'))
    await writeFile(join(outputRoot, 'stage-manifest.json'), JSON.stringify(receipts, null, 2));
}

export function auditLessonFrames(lesson, timeline, draw, onScene = () => {}) {
  const canvas = createCanvas(width, height),
    audits = [];
  const introAudit = new FrameAudit(timeline.intro.id, timeline.fps);
  for (let frame = 0; frame < timeline.intro.frames; frame++) {
    introAudit.observe(frame, drawBrandIntro(canvas.getContext('2d'), frame / timeline.fps));
  }
  const introSummary = introAudit.finish(timeline.intro.frames);
  audits.push(introSummary);
  onScene(introSummary);
  for (const [i, scene] of lesson.scenes.entries()) {
    const timing = timeline.scenes[i],
      audit = new FrameAudit(scene.id, timeline.fps);
    for (let frame = 0; frame < timing.frames; frame++) {
      audit.observe(frame, renderAt(canvas, lesson, scene, timing, frame / timeline.fps, i, draw));
    }
    const summary = audit.finish(timing.frames);
    audits.push(summary);
    onScene(summary);
  }
  const frames = audits.reduce((sum, audit) => sum + audit.frames, 0);
  const expectedFrames =
    timeline.intro.frames + timeline.scenes.reduce((sum, scene) => sum + scene.frames, 0);
  return {
    passed: frames === expectedFrames && audits.every((audit) => audit.passed),
    frames,
    expectedFrames,
    ruleCoverage: LAYOUT_AUDIT_RULES,
    issueFrames: audits.reduce((sum, audit) => sum + audit.issueFrames, 0),
    scenes: audits,
  };
}

async function main() {
  if (has('--editor-submission') && (!value('--lesson') || has('--all') || has('--intro-only')))
    throw new Error('--editor-submission requires one --lesson ID');
  if (existsSync(join(root, '..', 'REVIEW_ONLY')) && !has('--help')) {
    throw new Error('Review-only phase is active. Use source checks without the renderer.');
  }
  if (
    has('--help') ||
    (!has('--all') && !value('--lesson') && !has('--intro-only') && !has('--stage'))
  ) {
    console.log(
      'node videos/render.mjs --all | --lesson ID | --intro-only [--validate | --audit | --storyboard | --preview | --audio-only] [--width 1920] [--fps 30] [--output build/videos] [--voice VOICE] [--rate=RATE] [--provider PROVIDER] [--tts-script FILE] [--threads 4] [--h264-encoder libx264|videotoolbox] [--no-manifest] [--preserve-failed-stage] [--retained-audio-only]',
    );
    console.log(
      'node videos/render.mjs --stage [--lesson ID] [--editor-submission] [--validate | --storyboard | --preview | --audio-only] [--quality draft|standard|high|master] [--backend auto|cpu|gpu] [--motion-blur N] [--poster-only] [--workers 4] [--fps 60]',
    );
    return;
  }
  if (!['auto', 'cpu', 'gpu'].includes(stageBackend))
    throw new Error('--backend must be auto, cpu, or gpu');
  if (
    stageMotionBlur !== undefined &&
    (!Number.isInteger(stageMotionBlur) || stageMotionBlur < 1 || stageMotionBlur > 16)
  )
    throw new Error('--motion-blur must be an integer between 1 and 16');
  const diagnostic = ['--audio-only', '--audit', '--storyboard', '--validate'].some(has);
  if (
    !diagnostic &&
    (value('--voice', courseNarrator.voice) !== courseNarrator.voice ||
      value('--rate', courseNarrator.rate) !== courseNarrator.rate ||
      provider !== courseNarrator.provider ||
      ttsScript !== resolve(root, courseNarrator.ttsScript))
  ) {
    throw new Error(
      `Course films use ${courseNarrator.voice} from ${courseNarrator.ttsScript}. Use --audio-only to inspect historical speech.`,
    );
  }
  if (
    !Number.isInteger(fps) ||
    fps < 1 ||
    fps > 60 ||
    !Number.isInteger(width) ||
    width < 640 ||
    width % 2 ||
    !Number.isInteger(threads) ||
    threads < 1
  )
    throw new Error('Invalid render dimensions, FPS, or threads');
  if (!diagnostic && !has('--preview')) {
    encoderOptions = await selectCourseEncoder(requestedEncoder, await import('vizmatic'), {
      width,
      height,
      fps,
    });
    if (requestedEncoder !== encoderOptions.h264Encoder)
      console.log(
        `H.264 encoder ${requestedEncoder} is unavailable. Using ${encoderOptions.h264Encoder} for the intro and all scenes.`,
      );
  }
  registerFonts();
  if (has('--stage')) return runStageLessons();
  if (has('--intro-only')) {
    const intro = await renderIntro();
    await introPreview(intro, join(outputRoot, 'brand'));
    console.log(`LeetLLM intro: ${join(outputRoot, 'brand', 'leetllm-intro.mp4')}`);
    return;
  }
  const chosen = value('--lesson');
  const files = (await readdir(join(here, 'lessons')))
    .filter(
      (file) => file.endsWith('.lesson.yaml') && (!chosen || file === `${chosen}.lesson.yaml`),
    )
    .sort();
  if (!files.length) throw new Error(`Lesson not found: ${chosen}`);
  const receipts = [],
    layoutFailures = [];
  for (const file of files) {
    const lessonFile = join(here, 'lessons', file),
      lesson = await readLesson(lessonFile, root);
    const moduleFile = join(here, 'animations', `${lesson.id}.mjs`);
    const sourceManifest = await productionSourceManifest({ root, id: lesson.id, ttsScript });
    const filmModule = await import(pathToFileURL(moduleFile).href);
    const { holdSounds } = filmModule;
    const { draw, validateModel } = canvasLessonImplementation(filmModule, lesson);
    if (typeof validateModel === 'function') validateModel();
    const out = join(outputRoot, lesson.id);
    const words = lesson.scenes
      .flatMap((s) => s.beats)
      .reduce((n, b) => n + b.say.trim().split(/\s+/).length, 0);
    console.log(`[${lesson.id}] validated ${lesson.scenes.length} scenes, ${words} spoken words`);
    // Exercise all visual branches and beat transitions even for a validation-only run.
    if (!has('--audit')) {
      const testCanvas = createCanvas(960, 540);
      for (const [i, scene] of lesson.scenes.entries()) {
        const timing = estimateCanvasScene(scene, fps);
        for (const [beatIndex, beat] of timing.beats.entries()) {
          for (const progress of SAMPLE_PROGRESS) {
            const time = beat.start + (beat.until - beat.start) * progress;
            const audit = renderAt(testCanvas, lesson, scene, timing, time, i, draw);
            if (audit.issues.length) {
              throw new Error(
                `${lesson.id}/${scene.id} beat ${beatIndex + 1} at ${Math.round(progress * 100)}%: ${JSON.stringify(audit.issues)}`,
              );
            }
          }
        }
      }
    }
    if (has('--validate')) continue;
    if (has('--audit')) {
      const auditOut = join(outputRoot, 'previews', lesson.id);
      await mkdir(auditOut, { recursive: true });
      const timeline = await prepareAudio(lesson, auditOut);
      const report = auditLessonFrames(lesson, timeline, draw, (summary) => {
        console.log(
          `[${lesson.id}] audited ${summary.scene}: ${summary.frames} frames, ${summary.issueFrames} issue frames`,
        );
      });
      await writeFile(join(auditOut, 'frame-audit.json'), JSON.stringify(report, null, 2));
      await writeLayoutReview({
        out: auditOut,
        lesson,
        timeline,
        report,
        renderFrame: (sceneIndex, localTime) => {
          const canvas = createCanvas(1920, 1080);
          const audit =
            sceneIndex < 0
              ? drawBrandIntro(canvas.getContext('2d'), localTime)
              : renderAt(
                  canvas,
                  lesson,
                  lesson.scenes[sceneIndex],
                  timeline.scenes[sceneIndex],
                  localTime,
                  sceneIndex,
                  draw,
                );
          return { canvas, audit };
        },
      });
      console.log(`[${lesson.id}] layout review: ${join(auditOut, 'layout-review.html')}`);
      if (!report.passed) layoutFailures.push(lesson.id);
      continue;
    }
    if (has('--storyboard') || has('--preview') || has('--audio-only')) {
      const previewOut = join(outputRoot, 'previews', lesson.id);
      await mkdir(previewOut, { recursive: true });
      const timeline = has('--storyboard') ? null : await prepareAudio(lesson, previewOut);
      if (!has('--audio-only')) await previews(lesson, timeline, draw, previewOut);
      console.log(`[${lesson.id}] preview ready: ${previewOut}`);
      continue;
    }
    const engineBytes = renderEngineBytes();
    const cache = join(outputRoot, '.scene-cache', lesson.id);
    await mkdir(cache, { recursive: true });
    const receipt = await withStagedDelivery(
      out,
      async (stage) => {
        const timeline = await prepareAudio(lesson, stage);
        const adapterBytes = await readFile(ttsScript);
        if (hash(adapterBytes) !== timeline.ttsAdapter.sha256)
          throw new Error(`TTS adapter changed during audio preparation: ${ttsScript}`);
        const fingerprint = sourceManifest.fingerprint;
        const checkpoints = await checkpointDirectory(fingerprint, timeline, 'canvas');
        await previews(lesson, timeline, draw, stage);
        const intro = await renderIntro();
        const sceneFiles = [intro.file];
        for (const [i, scene] of lesson.scenes.entries())
          sceneFiles.push(
            await renderScene(
              lesson,
              scene,
              timeline.scenes[i],
              i,
              draw,
              cache,
              fingerprint,
              checkpoints,
              holdSounds,
            ),
          );
        if (!engineBytes.equals(renderEngineBytes()))
          throw new Error('Vizmatic engine changed during rendering');
        await verifyProductionSources(root, {
          id: lesson.id,
          sourceManifest,
          fingerprint,
          renderEngine: sourceManifest.renderEngine,
        });
        return assemble(
          lesson,
          timeline,
          sceneFiles,
          stage,
          fingerprint,
          out,
          cache,
          intro,
          {},
          sourceManifest,
        );
      },
      { preserveFailedStage: has('--preserve-failed-stage') },
    );
    receipts.push(receipt);
    console.log(
      `[${lesson.id}] READY ${receipt.file} (${receipt.duration.toFixed(1)}s, ${(receipt.bytes / 1048576).toFixed(1)} MiB)`,
    );
  }
  if (receipts.length && !has('--no-manifest'))
    await writeFile(join(outputRoot, 'manifest.json'), JSON.stringify(receipts, null, 2));
  if (layoutFailures.length)
    throw new Error(
      `Layout issues in ${layoutFailures.join(', ')}; inspect the layout-review.html reports`,
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
