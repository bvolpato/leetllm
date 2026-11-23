#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const DENSITY_LIMITS = Object.freeze({
  visibleAlpha: 0.25,
  foregroundAlpha: 0.6,
  proseWords: 65,
  allWords: 110,
  labelArea: 0.32,
  longLabelWords: 8,
});
const tokens = (text) => String(text ?? '').match(/[\p{L}\p{N}]+(?:[.'’_-][\p{L}\p{N}]+)*/gu) ?? [];
export function rectangleUnionArea(rectangles) {
  const xs = [...new Set(rectangles.flatMap((r) => [r.x, r.x + r.width]))].sort((a, b) => a - b);
  let area = 0;
  for (let i = 1; i < xs.length; i++) {
    const left = xs[i - 1],
      right = xs[i],
      intervals = rectangles
        .filter((r) => r.x < right && r.x + r.width > left)
        .map((r) => [r.y, r.y + r.height])
        .sort((a, b) => a[0] - b[0]);
    let height = 0,
      start = null,
      end = null;
    for (const [a, b] of intervals) {
      if (start === null) {
        start = a;
        end = b;
      } else if (a > end) {
        height += end - start;
        start = a;
        end = b;
      } else end = Math.max(end, b);
    }
    if (start !== null) height += end - start;
    area += (right - left) * height;
  }
  return area;
}
export function textDensity(labels) {
  const roi = { x: 100, y: 200, right: 1820, bottom: 985 },
    visible = (labels ?? []).filter(
      (l) => (l.alpha ?? 1) >= DENSITY_LIMITS.visibleAlpha && typeof l.text === 'string',
    );
  let words = 0,
    foregroundWords = 0,
    proseWords = 0,
    mathObjects = 0,
    numericTokens = 0;
  const longLabels = [],
    rectangles = [];
  for (const l of visible) {
    if (l.y + l.height <= roi.y || l.y >= roi.bottom || l.x + l.width <= roi.x || l.x >= roi.right)
      continue;
    const left = Math.max(roi.x, l.x),
      top = Math.max(roi.y, l.y),
      right = Math.min(roi.right, l.x + l.width),
      bottom = Math.min(roi.bottom, l.y + l.height);
    rectangles.push({ x: left, y: top, width: right - left, height: bottom - top });
    if (l.kind === 'math') {
      mathObjects++;
      continue;
    }
    const ts = tokens(l.text),
      numbers = ts.filter((t) => /^[-+]?\d+(?:[.]\d+)?$/.test(t)).length;
    words += ts.length;
    numericTokens += numbers;
    proseWords += ts.length - numbers;
    if ((l.alpha ?? 1) >= DENSITY_LIMITS.foregroundAlpha) foregroundWords += ts.length;
    if (ts.length >= DENSITY_LIMITS.longLabelWords)
      longLabels.push({
        text: l.text,
        words: ts.length,
        fontSize: l.fontSize,
        alpha: l.alpha ?? 1,
      });
  }
  const labelAreaFraction =
    rectangleUnionArea(rectangles) / ((roi.right - roi.x) * (roi.bottom - roi.y));
  const flags = [];
  if (proseWords > DENSITY_LIMITS.proseWords) flags.push('many-prose-labels');
  if (words > DENSITY_LIMITS.allWords) flags.push('many-visible-words');
  if (labelAreaFraction > DENSITY_LIMITS.labelArea) flags.push('large-label-footprint');
  return {
    visibleWords: words,
    foregroundWords,
    proseWords,
    numericTokens,
    mathObjects,
    labelAreaFraction,
    longLabels,
    flags,
  };
}
export function parseAuditOptions(args) {
  if (args.length === 1 && args[0] === '--help') return { help: true };
  const options = { lessonIds: [] },
    seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (!['--assignment', '--output', '--lesson'].includes(flag))
      throw Error(`Unknown option: ${flag}`);
    const value = args[index + 1];
    if (typeof value !== 'string' || !value.trim() || value.startsWith('--'))
      throw Error(`Missing value for ${flag}`);
    if (flag === '--lesson') options.lessonIds.push(value);
    else {
      if (seen.has(flag)) throw Error(`Option may be specified only once: ${flag}`);
      seen.add(flag);
      options[flag.slice(2)] = value;
    }
    index++;
  }
  if (!options.assignment || !options.output) throw Error('--assignment and --output required');
  if (new Set(options.lessonIds).size !== options.lessonIds.length)
    throw Error('Lesson IDs must be unique');
  return options;
}

export function selectDensityLessons(assignment, requestedIds = []) {
  if (!Array.isArray(assignment?.lessons) || !assignment.lessons.length)
    throw Error('Assignment must contain at least one lesson');
  if (!Array.isArray(requestedIds)) throw Error('Lesson selection must be an array');
  const available = new Set(assignment.lessons.map((lesson) => lesson.id));
  const unknown = requestedIds.filter((id) => !available.has(id));
  if (unknown.length)
    throw Error(`Unknown lesson ID${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}`);
  const selected = requestedIds.length
    ? assignment.lessons.filter((lesson) => requestedIds.includes(lesson.id))
    : assignment.lessons;
  if (!selected.length) throw Error('Lesson selection is empty');
  return selected;
}

async function main(args) {
  const options = parseAuditOptions(args);
  if (options.help) {
    console.log(
      'node videos/audit-text-density.mjs --assignment FILE --output FILE [--lesson ID ...]',
    );
    return;
  }
  const assignment = JSON.parse(await fs.readFile(path.resolve(root, options.assignment)));
  const entries = selectDensityLessons(assignment, options.lessonIds),
    rows = [];
  for (const entry of entries) {
    const directory = path.resolve(root, entry.sourceDirectory),
      receipt = JSON.parse(await fs.readFile(path.join(directory, 'verification.json'))),
      bytes = await fs.readFile(path.join(directory, 'frame-gallery.json'));
    if (
      receipt.sha256 !== entry.movieSha256 ||
      receipt.fingerprint !== entry.sourceFingerprint ||
      digest(bytes) !== receipt.artifactSha256['frame-gallery.json']
    )
      throw Error('Stale source-gallery bindings ' + entry.id);
    const gallery = JSON.parse(bytes),
      samples = gallery.samples.map((sample) => ({
        scene: sample.scene.id,
        beat: sample.beat.index,
        time: sample.timestamp,
        image: path.relative(root, path.join(directory, sample.image)),
        ...textDensity(sample.labels),
      })),
      scenes = [];
    for (const id of [...new Set(samples.map((sample) => sample.scene))]) {
      const group = samples.filter((sample) => sample.scene === id),
        ordered = [...group].sort(
          (a, b) => b.proseWords - a.proseWords || b.labelAreaFraction - a.labelAreaFraction,
        ),
        flagged = group.filter((sample) => sample.flags.length);
      scenes.push({
        id,
        samples: group.length,
        flagged: flagged.length,
        maxWords: Math.max(...group.map((sample) => sample.visibleWords)),
        maxProseWords: Math.max(...group.map((sample) => sample.proseWords)),
        maxLabelArea: Math.max(...group.map((sample) => sample.labelAreaFraction)),
        peaks: ordered.slice(0, 2),
      });
    }
    rows.push({
      id: entry.id,
      movieSha256: entry.movieSha256,
      sourceFingerprint: entry.sourceFingerprint,
      gallerySha256: digest(bytes),
      samples: samples.length,
      flagged: samples.filter((sample) => sample.flags.length).length,
      scenes,
    });
    console.log(
      JSON.stringify({ id: entry.id, samples: samples.length, flagged: rows.at(-1).flagged }),
    );
  }
  const result = {
    generatedAt: new Date().toISOString(),
    toolSha256: digest(await fs.readFile(fileURLToPath(import.meta.url))),
    scope:
      'Density diagnostic from checksum-bound native source frame-gallery samples for the selected exact movies. Counts visible text and label footprint; math objects are separate. This is sampled source evidence, not OCR of every encoded frame, a publication decision or a measure of visual teaching quality.',
    limits: DENSITY_LIMITS,
    lessons: rows,
  };
  const output = path.resolve(root, options.output);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(result, null, 2) + '\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main(process.argv.slice(2)).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
