import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues, sampleNarrationCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import { draw, studentTrace } from '../animations/distillation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();
const lesson = await readLesson(path.join(root, 'videos/lessons/distillation.lesson.yaml'), root);
const timeline = await loadMeasuredTimeline('distillation');
async function probe(sceneId, beat, phrase, id = 'independent-result') {
  const scene = structuredClone(lesson.scenes.find((s) => s.id === sceneId)),
    index = lesson.scenes.findIndex((s) => s.id === sceneId),
    measured = timeline.scenes.find((s) => s.id === sceneId);
  if (!scene.beats[beat].visual_cues?.some((c) => c.id === id)) {
    scene.beats[beat].visual_cues ??= [];
    scene.beats[beat].visual_cues.push({
      id,
      phrase,
      targets: [sceneId === 'learning' ? 'divergence-trajectory' : sceneId + '-mechanism'],
    });
  }
  const timing = {
      ...measured,
      beats: scene.beats.map((b, i) => ({ ...measured.beats[i], ...b })),
      visualCues: resolveSceneCues(scene, measured),
      cueTiming: 'provider-words',
    },
    cue = timing.visualCues.find((c) => c.id === id);
  const boundaryProbe = structuredClone(scene);
  boundaryProbe.beats.forEach((b) => delete b.visual_cues);
  boundaryProbe.beats[beat].visual_cues = [{ id: 'boundary', phrase, targets: ['boundary'] }];
  const boundary = resolveSceneCues(boundaryProbe, measured)[0],
    phase = (n) => sampleNarrationCues([boundary], n / 30).boundary.phase;
  let after = Math.floor(boundary.end * 30);
  while (phase(after) !== 'after') after++;
  while (phase(after - 1) === 'after') after--;
  const paint = (time) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      frameState(timing, time, index, lesson.scenes.length),
      draw,
    );
  return {
    before: paint((after - 1) / 30),
    after: paint(after / 30),
    paint,
    end: boundary.end,
    cue,
    timing,
  };
}
const text = (a) => a.labels.map((l) => l.text).join('\n');

test('the highlighted cat keeps its neutral prediction through the complete gradient clause', async () => {
  const p = await probe('learning', 2, 'its gradient is positive', 'distill-cat-positive');
  assert(!text(p.before).includes('cat gradient +'));
  assert(text(p.after).includes('cat gradient +'));
});
test('the next cat update cannot disclose its destination before the complete descent clause', async () => {
  const p = await probe('learning', 2, 'so descent lowers the logit', 'distill-cat-lower'),
    next = studentTrace()[13].logits[2].toFixed(3);
  assert(!text(p.before).includes(' → ' + next));
  assert(text(p.before).includes('At update 12: cat gradient +'));
  assert(text(p.paint(p.end + 1.1)).includes(' → ' + next));
});
test('the scaled T4 result waits for the whole scaled comparison', async () => {
  const p = await probe(
    'temperature-gradient',
    1,
    'Multiplying by T squared gives about minus point seven six two and minus point nine eight zero',
    'gradient-scaled-result',
  );
  assert(!text(p.before).includes('scaled -0.9797'));
  assert(text(p.after).includes('scaled -0.9797'));
});
test('the T40 result waits for the complete asymptotic example', async () => {
  const p = await probe(
    'temperature-gradient',
    1,
    'At T forty the scaled gradient approaches minus one',
    'gradient-forty-result',
  );
  assert(!text(p.before).includes('scaled -0.9998'));
  assert(text(p.after).includes('scaled -0.9998'));
});
test('the global versus unweighted mean comparison waits for both means', async () => {
  const p = await probe(
    'alignment-mask',
    2,
    'global token mean point six five, not their unweighted mean point five',
  );
  assert(!text(p.before).includes('=.65'));
  assert(text(p.after).includes('=.65'));
});
test('updated projection rows and the new output have distinct complete result permissions', async () => {
  const rows = await probe(
    'feature-projection',
    1,
    'A learning rate point one changes the last two rows to point two, one point four and point eight, point six',
  );
  assert(!rows.before.labels.some((l) => l.text === '1.40' && l.x < 700));
  assert(rows.paint(rows.end + 0.9).labels.some((l) => l.text === '1.40' && l.x < 700));
  const out = await probe('feature-projection', 1, 'The new output is one, three, two');
  const bars = (a) =>
    a.shapes
      .filter((s) => s.kind === 'rect' && s.width === 95 && s.x >= 930 && s.x < 1400)
      .map((s) => s.height);
  assert.deepEqual(bars(out.before).map(Math.round), [140, 280, 420]);
  assert.deepEqual(bars(out.after).map(Math.round), [140, 420, 280]);
});
test('a mismatched teacher is rejected only after the full filter clause', async () => {
  const p = await probe('dataset-gates', 0, 'reject the invalid admin answer');
  assert(!text(p.before).includes('reject teacher error'));
  assert(text(p.after).includes('reject teacher error'));
});
test('fresh probability geometry retains the initial uniform student through both answer clauses', async () => {
  const logits = await probe(
    'fresh-distillation',
    0,
    'the new logits are minus point zero eight, point one zero and minus point zero two',
  );
  const probabilities = await probe(
    'fresh-distillation',
    0,
    'Softmax gives about point three zero seven, point three six seven and point three two six',
  );
  const bars = (a) =>
    a.shapes
      .filter((s) => s.kind === 'rect' && s.width === 200 && [300, 850, 1400].includes(s.x))
      .map((s) => s.height);
  for (const a of [logits.before, logits.after, probabilities.before])
    for (const h of bars(a)) assert(Math.abs(h - 500 / 3) < 1e-9);
  const heights = bars(probabilities.after);
  assert(heights[1] > heights[2] && heights[2] > heights[0]);
  assert(Math.abs(heights.reduce((a, b) => a + b, 0) - 500) < 1e-9);
});
