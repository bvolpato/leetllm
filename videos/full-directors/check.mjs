import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createCanvas } from '@napi-rs/canvas';
import { BRAND_INTRO_SECONDS } from '../lib/brand.mjs';
import { prepareTakes } from '../lib/course-speech.mjs';
import { createPicture } from '../director-cuts/lesson-runtime/picture.mjs';
import {
  buildTimeline,
  estimateTakes,
  firstFrameAt,
  fps,
} from '../director-cuts/lesson-runtime/timeline.mjs';
import { loadFullFilm } from './film.mjs';

const { positionals, values } = parseArgs({
  options: {
    sheet: { type: 'string' },
    chapter: { type: 'string' },
    stills: { type: 'string' },
    measured: { type: 'boolean' },
    'lessons-dir': { type: 'string' },
  },
  allowPositionals: true,
});
if (
  positionals.length !== 1 ||
  (!values.sheet && !values.stills) ||
  (values.sheet && (!isAbsolute(values.sheet) || !/\.jpe?g$/iu.test(values.sheet))) ||
  (values.stills && !values.chapter)
)
  throw new Error(
    'Usage: node videos/full-directors/check.mjs <id> [--sheet <absolute.jpg>] [--chapter <id> --stills <dir>] [--measured] [--lessons-dir <dir>]',
  );
const [id] = positionals;
const film = await loadFullFilm(id, { lessonsDir: values['lessons-dir'] });
const selectedChapter =
  film.chapters.find((chapter) => chapter.id === values.chapter) ??
  (/^\d+$/u.test(values.chapter) ? film.chapters[Number(values.chapter) - 1] : undefined);
if (values.chapter !== undefined && !selectedChapter)
  throw new Error(`Unknown chapter ${JSON.stringify(values.chapter)} in ${id}.`);

async function previewTimeline() {
  if (!values.measured) return buildTimeline(film, estimateTakes(film));
  if (!process.env.LEETLLM_SPEECH_CACHE) throw new Error('--measured needs LEETLLM_SPEECH_CACHE.');
  const work = await mkdtemp(join(tmpdir(), 'full-director-takes-'));
  try {
    const { takes } = await prepareTakes(
      film.beats.map((b) => b.say),
      work,
      { retainedOnly: true },
    );
    return buildTimeline(film, takes);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

const timeline = await previewTimeline();
const { draw, canvas } = createPicture(film);
const regions = new Map();
for (const entry of timeline.schedule) {
  if (entry.beat.beatIndex === 0) regions.set(entry.beat.chapterId, []);
  regions.get(entry.beat.chapterId).push(entry);
}
const thumb = createCanvas(96, 54);
const thumbCtx = thumb.getContext('2d');
const tileWidth = 480,
  tileHeight = 270,
  rowHeight = 322,
  rowsPerPage = 4;
const phases = ['before', 'after', 'settled'];
const padded = (n) => String(n).padStart(2, '0');
const pagePaths = [];
const chapterRows = [];
const outputs = [];
const stagingDirs = [];

async function staging(directory) {
  await mkdir(directory, { recursive: true });
  const dir = await mkdtemp(join(directory, '.full-preview-'));
  stagingDirs.push(dir);
  return dir;
}

function paint(frame, onReveal) {
  const clock = timeline.clockAtFrame(frame, onReveal);
  try {
    draw(clock);
  } catch (cause) {
    throw new Error(
      `${id} / ${clock.beat.chapterId} / ${clock.beat.id} / frame ${frame}: ${cause.message}`,
      { cause },
    );
  }
}

function fingerprint(frame) {
  thumbCtx.clearRect(0, 0, thumb.width, thumb.height);
  thumbCtx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
  const pixels = thumbCtx.getImageData(0, 0, thumb.width, thumb.height).data;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] < 255) throw new Error(`${id} has a transparent preview at body frame ${frame}.`);
  }
  return pixels;
}

function difference(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 4) {
    sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  }
  return sum / ((a.length / 4) * 3);
}

// Probe a representative beat for spoken cues. A chapter sheet costs a bounded number of paints.
function sampleGroup(entries, consume) {
  const probes = new Map();
  const selected = [entries[0], entries[Math.floor(entries.length / 2)], entries.at(-1)];
  const seen = [];
  let previousFrame = -1;
  for (const [slot, entry] of selected.entries()) {
    const { startFrame, frames } = entry;
    const endFrame = startFrame + frames - 1;
    const fraction = (p) => startFrame + Math.round(p * (frames - 1));
    if (!probes.has(entry)) {
      const cues = [];
      paint(fraction(0.5), (start, span) =>
        cues.push({ start: firstFrameAt(start) + startFrame, span: span * fps }),
      );
      probes.set(
        entry,
        cues.find((cue) => cue.start > startFrame && cue.start + cue.span <= endFrame) ?? cues[0],
      );
    }
    const cue = probes.get(entry);
    const cueFrame =
      cue &&
      [
        cue.start - 1,
        cue.start + Math.max(1, Math.round(cue.span / 2)),
        cue.start + Math.ceil(cue.span),
      ][slot];
    const preferred = [
      [Math.min(cueFrame ?? startFrame, fraction(0.15)), startFrame],
      [cueFrame, fraction(0.55), fraction(0.8), fraction(0.33)],
      [endFrame, cueFrame, fraction(0.9), fraction(0.82)],
    ][slot];
    // Leave room for the other samples when several states share a very short beat.
    const remaining = selected.slice(slot + 1).filter((other) => other === entry).length;
    const high = Math.max(startFrame, endFrame - remaining);
    const low = Math.min(endFrame, Math.max(previousFrame + 1, startFrame));
    const candidates = new Set(
      preferred.filter(Number.isFinite).map((frame) => Math.max(low, Math.min(high, frame))),
    );
    let best;
    let painted;
    for (const frame of candidates) {
      paint(frame);
      painted = frame;
      const pixels = fingerprint(frame);
      const distance = seen.length
        ? Math.min(...seen.map((prior) => difference(prior, pixels)))
        : Infinity;
      if (!best || distance > best.distance) best = { frame, pixels, distance };
      if (distance >= 1) break;
    }
    if (best.frame !== painted) paint(best.frame);
    previousFrame = best.frame;
    seen.push(best.pixels);
    consume(
      {
        phase: phases[slot],
        beatId: entry.beat.id,
        beatIndex: entry.beat.beatIndex,
        bodyFrame: best.frame,
        seconds: BRAND_INTRO_SECONDS + best.frame / fps,
        minPixelDifference: Number.isFinite(best.distance)
          ? Number(best.distance.toFixed(3))
          : null,
      },
      slot,
    );
  }
}

async function writePreview() {
  const sheet = values.sheet && resolve(values.sheet);
  const sheetStage = sheet && (await staging(dirname(sheet)));
  const stills = values.stills && resolve(values.stills);
  const stillStage = stills && (await staging(stills));
  const selected = selectedChapter ? [selectedChapter] : film.chapters;
  const sheetBase = sheet && sheet.slice(0, -extname(sheet).length);
  const pagePath = (index) => (index === 0 ? sheet : `${sheetBase}.p${padded(index + 1)}.jpg`);
  const hashes = [];
  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
  let previous;
  if (sheet) {
    try {
      previous = JSON.parse(await readFile(sheetBase + '.json', 'utf8'));
      if (previous?.kind !== 'leetllm.director-preview' || !Array.isArray(previous.pageSha256))
        throw new Error(`The companion file ${sheetBase}.json belongs to another document.`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  for (let offset = 0; offset < selected.length; offset += rowsPerPage) {
    const chapters = selected.slice(offset, offset + rowsPerPage);
    const page = sheet && createCanvas(tileWidth * 3, chapters.length * rowHeight);
    const ctx = page && page.getContext('2d');
    const path = sheet && pagePath(offset / rowsPerPage);
    if (page) {
      ctx.fillStyle = '#202126';
      ctx.fillRect(0, 0, page.width, page.height);
      pagePaths.push(path);
    }
    for (const [row, chapter] of chapters.entries()) {
      const entries = regions.get(chapter.id);
      const { chapterIndex } = entries[0].beat;
      const result = {
        id: chapter.id,
        title: chapter.title,
        sourceChapters: chapter.sourceChapters,
        chapterIndex,
        samples: [],
      };
      chapterRows.push(result);
      if (page) {
        const y = row * rowHeight;
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 18px "Lesson Sans"';
        ctx.fillText(`${chapterIndex + 1}. ${chapter.title}`, 6, y + 20, page.width - 12);
        sampleGroup(entries, (state, col) => {
          const x = col * tileWidth;
          ctx.drawImage(canvas, x, y + 27, tileWidth, tileHeight);
          ctx.font = '15px "Lesson Sans"';
          ctx.fillText(
            `${state.phase}   ${state.beatId}   ${state.seconds.toFixed(2)} s`,
            x + 6,
            y + rowHeight - 6,
            tileWidth - 12,
          );
          result.samples.push({
            ...state,
            path,
            rect: { x, y: y + 27, width: tileWidth, height: tileHeight },
          });
        });
      }
      if (stills) {
        result.stills = [];
        for (const entry of entries) {
          sampleGroup([entry], (state) => {
            const name = `${id}-c${padded(chapterIndex + 1)}-b${padded(state.beatIndex + 1)}-${state.phase}.jpg`;
            const target = join(stills, name);
            // Encode this frame before the next paint reuses the canvas.
            const bytes = canvas.toBuffer('image/jpeg', 88);
            outputs.push({ staged: join(stillStage, name), path: target });
            result.stills.push({
              ...state,
              path: target,
              rect: { x: 0, y: 0, width: canvas.width, height: canvas.height },
            });
            writeFileSync(join(stillStage, name), bytes);
          });
        }
      }
    }
    if (page) {
      const staged = join(sheetStage, basename(path));
      const bytes = await page.encode('jpeg', 85);
      hashes.push(hash(bytes));
      await writeFile(staged, bytes);
      outputs.push({ staged, path });
    }
  }
  const report = {
    kind: 'leetllm.director-preview',
    id,
    title: film.title,
    timing: values.measured ? 'measured words' : 'estimated words',
    fps,
    bodyFrames: timeline.frames,
    beats: film.beats.length,
    pages: pagePaths,
    pageSha256: hashes,
    chapters: chapterRows,
  };
  if (sheet) {
    const path = sheetBase + '.json';
    const staged = join(sheetStage, basename(path));
    await writeFile(staged, JSON.stringify(report) + '\n');
    outputs.push({ staged, path });
  }
  for (const output of outputs) await rename(output.staged, output.path);
  // Retire only superseded companion JPEGs whose contents still match the previous inspection.
  for (let i = pagePaths.length; i < (previous?.pageSha256.length ?? 0); i++) {
    const path = pagePath(i);
    const bytes = await readFile(path).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
    if (bytes && hash(bytes) === previous.pageSha256[i]) await rm(path, { force: true });
  }
  console.log(JSON.stringify(report));
}

try {
  await writePreview();
} finally {
  for (const dir of stagingDirs) await rm(dir, { recursive: true, force: true });
}
