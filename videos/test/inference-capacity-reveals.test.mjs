import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/inference-batch-capacity.mjs';

registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(root + 'videos/lessons/inference-batch-capacity.lesson.yaml', root);
function paint(id, beat, overrides = {}) {
  const scene = lesson.scenes.find((s) => s.id === id);
  const cues = Object.fromEntries(
    scene.beats
      .flatMap((b) => b.visual_cues ?? [])
      .map((c) => [
        c.id,
        {
          id: c.id,
          phase: 'after',
          progress: 1,
          reveal: 1,
          active: false,
          strength: 0,
          targets: [],
        },
      ]),
  );
  for (const [id, value] of Object.entries(overrides)) Object.assign(cues[id], value);
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 30, duration: 60, opacity: 1, beat, beatP: 0.99, cues, cueTiming: 'provider-words' },
    draw,
  );
}
test('the survivor remains on the same painted scheduling lane after refill', () => {
  const labels = paint('continuous-schedule', 2).labels.filter((l) => l.text === 'R3');
  assert.equal(labels.length, 10);
  assert.equal(new Set(labels.map((l) => l.y)).size, 1);
});
test('the smaller avoided delay waits for its complete spoken result', () => {
  const before = paint('phase-handoff', 2, {
    'ic-phase-handoff-loss': { phase: 'during', progress: 0.5 },
  });
  assert(!before.labels.some((l) => l.text.includes('add 5.5')));
  const after = paint('phase-handoff', 2);
  assert(after.labels.some((l) => l.text.includes('add 5.5')));
});
test('fresh admission and cost answers remain withheld through their prediction cues', () => {
  const pending = paint('fresh-resource', 0);
  assert(!pending.labels.some((l) => l.text.startsWith('Selected from this sweep:')));
  const beforeCost = paint('fresh-resource', 3, {
    'ic-fresh-resource-cost': { phase: 'before', progress: 0 },
    'ic-fresh-resource-trial': { phase: 'before', progress: 0 },
  });
  assert(!beforeCost.labels.some((l) => l.text.includes('$0.8333')));
  const afterCost = paint('fresh-resource', 3, {
    'ic-fresh-resource-trial': { phase: 'before', progress: 0 },
  });
  assert(afterCost.labels.some((l) => l.text.includes('$0.8333')));
  const trial = paint('fresh-resource', 3);
  assert(
    trial.labels.some(
      (l) => l.text.includes('7.5 GiB reserved') && l.text.includes('36 ms per step'),
    ),
  );
});
test('the comparison remains pending until its 70B geometry is introduced', () => {
  const pending = paint('architecture-residency', 0, {
    'ic-architecture-residency-geometry': { phase: 'before', progress: 0 },
  });
  assert(pending.labels.some((l) => l.text === 'Comparison geometry pending'));
  assert(!pending.labels.some((l) => l.text === '70B geometry'));
  const introduced = paint('architecture-residency', 0);
  assert(introduced.labels.some((l) => l.text === '70B geometry'));
  assert(introduced.labels.some((l) => l.text === '80 layers × 8 heads × 128 × 2 arrays × 2 B'));
  assert(introduced.labels.some((l) => l.text === '320 KiB / retained position'));
});
test('the 103-request occupancy paints all 51.5 GiB on the shared pool scale', () => {
  const frame = paint('architecture-residency', 1);
  const occupancy = frame.shapes.find(
    (s) => s.x === 620 && s.y === 405 && s.height === 50 && s.width < 1000,
  );
  assert(occupancy, 'the first capacity row has a quantitative occupancy bar');
  assert(Math.abs(occupancy.width - ((103 * 0.5) / 51.6046) * 1000) < 1e-9);
  const second = frame.shapes.find(
    (s) => s.x === 620 && s.y === 515 && s.height === 50 && s.width < 1000,
  );
  assert(
    occupancy.width > second.width,
    '103 half-GiB requests occupy more than 25 two-GiB requests',
  );
});
