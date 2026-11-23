#!/usr/bin/env node
import { registerLessonFonts } from './lib/fonts.mjs';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readLesson, frameState } from './lib/lesson.mjs';
import { C } from './lib/scene.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const input = resolve(root, option('--input', 'build/video-complete-curriculum'));
const output = resolve(root, option('--output', 'build/video-youtube-curation-20261021/themes'));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const palettes = [
  { id: 'navy', title: 'Current navy', colors: C, glow: '#101b2e' },
  {
    id: 'charcoal',
    title: 'Neutral charcoal',
    colors: { ...C, bg: '#14161a', panel: '#20242a', ink: '#f0f0ed', muted: '#a5adb8' },
    glow: '#20242a',
  },
  {
    id: 'paper',
    title: 'Warm paper',
    colors: {
      bg: '#f7f4ed',
      panel: '#fffdf8',
      ink: '#202a35',
      muted: '#596574',
      cyan: '#006f80',
      blue: '#245bc0',
      yellow: '#8a5900',
      pink: '#a33172',
      green: '#187448',
      red: '#b3372b',
    },
    glow: '#fffdf8',
  },
];
const samples = [
  { id: 'attention', scene: 'value-mixture', beat: 1, progress: 0.6 },
  { id: 'clustering-pca', scene: 'pca', beat: 1, progress: 0.65 },
  { id: 'quantization', scene: 'grid', beat: 1, progress: 0.6 },
];

function luminance(hex) {
  const [r, g, b] = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) =>
  (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

// Import an isolated copy of the renderer. Production source and fingerprints stay intact.
async function renderer(palette) {
  const file = resolve(root, 'videos/lib/scene.mjs');
  let source = await readFile(file, 'utf8');
  source = source.replace(
    /from '([^']+)'/g,
    (_, specifier) => `from '${import.meta.resolve(specifier)}'`,
  );
  const mapping = Object.fromEntries(Object.keys(C).map((key) => [C[key], palette.colors[key]]));
  mapping['#101b2e'] = palette.glow;
  source = source.replace(/#[0-9a-f]{6}/gi, (value) => mapping[value.toLowerCase()] ?? value);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

registerLessonFonts();
await mkdir(output, { recursive: true });
const report = {
  version: 1,
  scope:
    'Palette prototypes rendered from the actual lesson models and measured narration timeline. These are still-frame studies, not re-mastered movies or a complete theme accessibility audit.',
  palettes: [],
  samples: [],
};
for (const palette of palettes) {
  const { drawFrame } = await renderer(palette);
  report.palettes.push({
    ...palette,
    contrast: Object.fromEntries(
      ['ink', 'muted', 'cyan', 'blue', 'yellow', 'pink', 'green', 'red'].map((key) => [
        key,
        {
          onBackground: contrast(palette.colors[key], palette.colors.bg),
          onPanel: contrast(palette.colors[key], palette.colors.panel),
        },
      ]),
    ),
  });
  for (const sample of samples) {
    const lesson = await readLesson(resolve(root, `videos/lessons/${sample.id}.lesson.yaml`), root);
    const timeline = JSON.parse(await readFile(join(input, sample.id, 'timeline.json'), 'utf8'));
    const index = lesson.scenes.findIndex((scene) => scene.id === sample.scene);
    if (index < 0) throw new Error(`Missing scene ${sample.id}/${sample.scene}`);
    const timing = timeline.scenes[index],
      beat = timing.beats[sample.beat];
    if (!beat) throw new Error(`Missing beat ${sample.id}/${sample.scene}/${sample.beat}`);
    const time = beat.start + (beat.until - beat.start) * sample.progress;
    const state = frameState(timing, time, index, lesson.scenes.length);
    const { draw } = await import(
      pathToFileURL(resolve(root, `videos/animations/${sample.id}.mjs`))
    );
    const canvas = createCanvas(1920, 1080);
    drawFrame(canvas.getContext('2d'), lesson, lesson.scenes[index], state, draw);
    const bytes = await canvas.encode('png'),
      file = `${sample.id}-${palette.id}.png`;
    await writeFile(join(output, file), bytes);
    report.samples.push({ ...sample, palette: palette.id, time, file, sha256: hash(bytes) });
  }
}
await writeFile(join(output, 'study.json'), JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify({
    output,
    images: report.samples.length,
    palettes: report.palettes.map((p) => ({
      id: p.id,
      textContrast: p.contrast.ink.onPanel,
      mutedContrast: p.contrast.muted.onPanel,
    })),
  }),
);
