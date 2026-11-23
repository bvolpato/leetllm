import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';

import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/convolution.mjs';

registerLessonFonts();
const lesson = await readRepositoryLesson('videos/lessons/convolution.lesson.yaml');
const before = { phase: 'before', progress: 0, reveal: 0, active: false, strength: 0 };
const during = { phase: 'during', progress: 0.99, reveal: 0.99, active: true, strength: 1 };
const after = { phase: 'after', progress: 1, reveal: 1, active: false, strength: 0 };
function paint(id, beat, overrides = {}) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b) => (b.visual_cues ?? []).map((c) => [c.id, { ...c, ...before }])),
    );
  for (const [id, state] of Object.entries(overrides))
    cues[id] = { targets: [], ...cues[id], ...state };
  const canvas = createCanvas(1920, 1080);
  return drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    { beat, beatP: 0.8, t: 10, opacity: 1, cueTiming: 'provider-words', cues },
    draw,
  );
}
test('backward overwrite and accumulation preserve all four earned forward values and saved owners', () => {
  const wanted = ['out 0 → flat 4', 'out 1 → flat 4', 'out 2 → flat 4', 'out 3 → flat 4'];
  for (const [beat, overrides] of [
    [1, {}],
    [1, { 'overwrite-gradient': after }],
    [1, { 'overwrite-gradient': after, 'accumulate-gradient': during }],
    [1, { 'overwrite-gradient': after, 'accumulate-gradient': after, 'correct-gradient': during }],
    [1, { 'correct-gradient': after }],
    [2, {}],
  ]) {
    const audit = paint('overlap-repair', beat, overrides);
    assert.deepEqual(
      audit.labels
        .filter((l) => l.x >= 1280 && l.x < 1610 && l.y >= 350 && l.y < 670)
        .map((l) => l.text),
      ['9', '9', '9', '9'],
    );
    assert.deepEqual(
      audit.labels.filter((l) => l.text.startsWith('out ')).map((l) => l.text),
      wanted,
    );
  }
});
test('retied ownership keeps its per-bank premise while the global count waits for the complete clause', () => {
  const operation = { 'private-banks': after, 'retie-banks': after };
  const pending = paint('sharing-budget', 1, { ...operation, 'retie-count': during }).labels.map(
    (l) => l.text,
  );
  assert(pending.includes('each bank: 448'));
  assert(pending.includes('ONE shared owner'));
  assert(!pending.includes('448 parameters'));
  assert(
    paint('sharing-budget', 1, { ...operation, 'retie-count': after }).labels.some(
      (l) => l.text === '448 parameters',
    ),
  );
});
test('dilation retains the running enumerated count and hides the completed formula answer until the clause ends', () => {
  const pending = paint('shape-dilation', 1, { 'dilated-starts': during }).labels.map(
    (l) => l.text,
  );
  assert(pending.includes('23 complete starts'));
  assert(!pending.some((l) => l.includes('=24')));
  const ready = paint('shape-dilation', 1, { 'dilated-starts': after }).labels.map((l) => l.text);
  assert(ready.includes('24 complete starts'));
  assert(ready.some((l) => l.endsWith('=24')));
});
