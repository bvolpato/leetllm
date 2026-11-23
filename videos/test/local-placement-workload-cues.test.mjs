import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, memory, validateModel } from '../animations/local-llm-placement.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = new URL('../../', import.meta.url).pathname;
registerLessonFonts();
const lesson = await readLesson(root + 'videos/lessons/local-llm-placement.lesson.yaml', root);
const scene = lesson.scenes.find((s) => s.id === 'intro');
function paint(attention, workspace, beatP = 0.5) {
  const cues = Object.fromEntries(
    scene.beats.flatMap((b) =>
      b.visual_cues.map((cue) => [
        cue.id,
        { ...cue, phase: 'before', progress: 0, strength: 0, reveal: 1 },
      ]),
    ),
  );
  for (const [id, progress] of [
    ['workload-state', attention],
    ['working-allocation', workspace],
  ])
    cues[id] = {
      ...cues[id],
      phase: progress === 1 ? 'after' : progress > 0 ? 'during' : 'before',
      progress,
      strength: 0,
      reveal: 1,
    };
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { beat: attention > 0 ? 2 : 1, beatP, t: 0, opacity: 1, cueTiming: 'provider-words', cues },
    draw,
  );
}
function allocations(audit) {
  return audit.labels
    .filter((l) => /^\d+\.\d{3} GB$/.test(l.text))
    .map((l) => Number(l.text.split(' ')[0]));
}
const budget = memory(16384, true);
test('attention and workspace grow from their own word cues with focus disabled', () => {
  assert.deepEqual(allocations(paint(0, 0)), [7.6, 0, 0, 0]);
  for (const progress of [0.25, 0.5, 1]) {
    assert.deepEqual(allocations(paint(progress, 0)), [
      7.6,
      0,
      Number((budget.sliding * progress).toFixed(3)),
      Number((budget.full * progress).toFixed(3)),
    ]);
    assert.deepEqual(allocations(paint(1, progress)), [
      7.6,
      Number((2 * progress).toFixed(3)),
      Number(budget.sliding.toFixed(3)),
      Number(budget.full.toFixed(3)),
    ]);
  }
});
test('completed allocations and their actual bars hold while the paragraph continues', () => {
  for (const beatP of [0.01, 0.5, 0.99]) {
    const audit = paint(1, 1, beatP);
    assert(audit.labels.some((l) => l.text.startsWith('Coexisting total 12.016 GB')));
    assert.deepEqual(allocations(audit), [
      7.6,
      2,
      Number(budget.sliding.toFixed(3)),
      Number(budget.full.toFixed(3)),
    ]);
  }
  const empty = paint(0, 0).shapes.length,
    grown = paint(1, 1).shapes.length;
  assert(grown >= empty + 3, 'Three actual allocation bars must be painted after growth.');
});
test('the existing cache, placement, transfer and quality models remain valid', () => {
  validateModel();
  assert(Math.abs(budget.total - 12.015919104) < 1e-10);
});
