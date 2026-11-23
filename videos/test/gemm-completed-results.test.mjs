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
import { draw } from '../animations/gemm.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();
const lesson = await readLesson(path.join(root, 'videos/lessons/gemm.lesson.yaml'), root),
  timeline = await loadMeasuredTimeline('gemm'),
  text = (a) => a.labels.map((l) => l.text).join('\n');
function probe(sceneId, beat, phrase, id) {
  const scene = lesson.scenes.find((s) => s.id === sceneId),
    index = lesson.scenes.findIndex((s) => s.id === sceneId),
    measured = timeline.scenes.find((s) => s.id === sceneId);
  assert(scene.beats[beat].visual_cues?.some((c) => c.id === id), `Missing authored cue ${sceneId}/${id}`);
  const timing = {
      ...measured,
      beats: scene.beats.map((b, i) => ({ ...measured.beats[i], ...b })),
      visualCues: resolveSceneCues(scene, measured),
      cueTiming: 'provider-words',
    },
    copy = structuredClone(scene);
  copy.beats.forEach((b) => delete b.visual_cues);
  copy.beats[beat].visual_cues = [{ id: 'boundary', phrase, targets: ['boundary'] }];
  const c = resolveSceneCues(copy, measured)[0],
    phase = (n) => sampleNarrationCues([c], n / 30).boundary.phase;
  let n = Math.floor(c.end * 30);
  while (phase(n) !== 'after') n++;
  while (phase(n - 1) === 'after') n--;
  const paint = (time) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      frameState(timing, time, index, lesson.scenes.length),
      draw,
    );
  return { before: paint((n - 1) / 30), after: paint(n / 30), paint, start: c.start, end: c.end };
}
for (const [beat, id, phrase, operands, ratio] of [
  [0, 'register-result', 'zero point four FLOP per byte', '8 FLOPs / 20 operand bytes', '0.4 FLOP/B'],
  [1, 'register-result-square', 'two FLOPs per byte', '128 FLOPs / 64 operand bytes', '2 FLOP/B'],
])
  test('register ratio ' + id + ' waits for its complete clause', () => {
    const p = probe('register-blocking', beat, phrase, id);
    assert(text(p.before).includes(operands));
    assert(!text(p.before).includes(ratio));
    assert(text(p.after).includes(`${operands} = ${ratio}`));
  });
test('rounded reference zero waits for its complete result', () => {
  const p = probe('precision-contract', 4, 'The rounded-input result is zero', 'rounded-zero');
  assert(text(p.before).includes('1 × 1 + 1 × (−1)'));
  assert(!p.before.labels.some((label) => label.text === '0'));
  assert(p.after.labels.some((label) => label.text === '0'));
  assert(text(p.after).includes('absolute error on rounded inputs = 0'));
});
test('original reference waits for its complete result', () => {
  const p = probe(
    'precision-contract',
    4,
    'original result is about one ten-thousandth',
    'dual-reference',
  );
  assert(!text(p.before).includes('0.00010002'));
  assert(p.after.labels.some((label) => label.text === '0.00010002'));
});
test('relative error has a distinct complete comparison permission', () => {
  const p = probe(
    'precision-contract',
    4,
    "That's one hundred percent relative error for this small output",
    'precision-error-result',
  );
  const fraction = 'Relative error on original inputs = |0 − 0.00010002| / 0.00010002';
  assert(p.before.labels.some((label) => label.text === '0.00010002'));
  assert(!text(p.before).toLowerCase().includes('relative error'));
  assert(!text(p.before).includes('100%'));
  assert(text(p.after).includes(`${fraction} = 100%`));
});
test('roofline input cannot authorize the completed bandwidth bound', () => {
  const p = probe(
    'roofline-check',
    2,
    'has an ideal bandwidth ceiling of ten teraFLOPs per second',
    'roofline-result',
  );
  assert(text(p.before).includes('Workload · 10 FLOP/B'));
  assert(!text(p.before).includes('10 TFLOP/s'));
  assert(text(p.after).includes('10 FLOP/B → ceiling of 10 TFLOP/s'));
});
test('fresh panel grouping remains neutral through the question and completed answer', () => {
  const p = probe(
      'transfer',
      1,
      'Two full panels and one single-coordinate remainder',
      'fresh-panels',
    ),
    spans = (a) =>
      a.connectors.filter((c) => Math.abs(c.from.y - 779) < 1e-8 && Math.abs(c.to.y - 779) < 1e-8);
  assert.equal(spans(p.paint(p.start - 0.05)).length, 0);
  assert.equal(spans(p.before).length, 0);
  assert.equal(spans(p.after).length, 3);
  assert(text(p.before).includes('2 positions per panel'));
  assert(text(p.before).includes('How many panels cover those five positions?'));
  assert(!text(p.after).includes('How many panels cover those five positions?'));
});
test('bank migration identifies the retained old map as a baseline', () => {
  const p = probe(
      'banks',
      1,
      'Add one word of row padding. Lane one now reads word thirty-six in bank four. Each lane lands in its own bank.',
      'padded-map',
    ),
    a = p.paint((p.start + p.end) / 2);
  assert(text(a).includes('Retained baseline'));
  assert(!text(a).includes('(33l+3)'));
  assert(text(p.before).includes('Lane 1 → word 36 → bank 4'));
  assert(!text(p.before).includes('(33l+3)'));
  assert(text(p.after).includes('(33l+3)'));
});
