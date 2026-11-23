import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { draw, sampleModel } from '../animations/training-backpropagation-gradient-descent.mjs';

registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(
  root + 'videos/lessons/training-backpropagation-gradient-descent.lesson.yaml',
  root,
);
function state(id, beat, values) {
  const scene = lesson.scenes.find((s) => s.id === id);
  const ids = scene.beats.flatMap((b) => (b.visual_cues ?? []).map((c) => c.id));
  return {
    beat,
    beatP: 0.5,
    opacity: 1,
    t: 20,
    duration: 80,
    cues: Object.fromEntries(
      ids.map((id) => {
        const progress = values[id] ?? -1;
        return [
          id,
          {
            phase: progress < 0 ? 'before' : progress >= 1 ? 'after' : 'during',
            progress: Math.max(0, progress),
            strength: 0,
            targets: [],
          },
        ];
      }),
    ),
  };
}
function paint(id, beat, values) {
  const scene = lesson.scenes.find((s) => s.id === id),
    current = state(id, beat, values);
  const audit = drawFrame(createCanvas(1920, 1080).getContext('2d'), lesson, scene, current, draw);
  assert.deepEqual(audit.issues, []);
  return audit.labels.map((l) => l.text);
}
for (const [id, beat, cue, result] of [
  ['forward', 1, 'forward-error', (text) => text.some((t) => t.includes('=-4\\text'))],
  [
    'sensitivity',
    1,
    'sensitivity-slope-result',
    (text) => text.some((t) => t.endsWith('|_{\\hat y=2}=-4')),
  ],
  ['sensitivity', 2, 'sensitivity-gradients', (text) => text.some((t) => t.startsWith('g_w=(-4)'))],
  ['one-update', 1, 'update-payoff', (text) => text.includes('\\hat y:2\\to4')],
  [
    'gradient-check',
    1,
    'check-match',
    (text) => text.filter((t) => t === '-8.000000').length === 2,
  ],
  ['next-loss', 0, 'classification-result', (text) => text.includes('gradient = -0.7')],
])
  test(`${id} keeps its fixed result pending through its operation`, () => {
    const extras =
      id === 'next-loss' ? { 'classification-gradient': 1, 'classification-probabilities': 1 } : {};
    assert.equal(result(paint(id, beat, { ...extras, [cue]: 0.999 })), false);
    assert.equal(result(paint(id, beat, { ...extras, [cue]: 1 })), true);
  });
test('the halving square labels its actual traveling area before declaring loss eight', () => {
  const halfway = paint('forward', 1, {
    'forward-error': 1,
    'forward-square': 1,
    'forward-half': 0.5,
  });
  assert(halfway.includes('Current area 12 ms²'));
  assert(!halfway.includes('L=8\\text{ ms}^2'));
  const finished = paint('forward', 1, {
    'forward-error': 1,
    'forward-square': 1,
    'forward-half': 1,
  });
  assert(finished.includes('L=8\\text{ ms}^2'));
});
test('the equal-nudge prediction carries neither a ratio nor parameter-gradient answers', () => {
  const prediction = paint('sensitivity', 1, { 'sensitivity-slope-result': 1 });
  assert(!prediction.includes('2\\epsilon'));
  assert(!prediction.some((t) => t.startsWith('g_w=(-4)')));
});
for (const [id, beat, cues] of [
  [
    'nonlinear-request',
    2,
    [
      'network-gradient-result',
      'network-parameters',
      'network-recompute',
      'network-update',
      'network-loss-result',
    ],
  ],
  [
    'network-transfer',
    1,
    [
      'transfer-gradients',
      'transfer-weights',
      'transfer-hidden',
      'transfer-result',
      'transfer-loss',
    ],
  ],
])
  test(`${id} preserves the saved forward state until each consequence completes`, () => {
    const [gradients, weights, hidden, output, loss] = cues;
    const pending = sampleModel(id, state(id, beat, { [weights]: 0.999, [gradients]: 0.999 }));
    assert.equal(pending.updated, false);
    assert.equal(pending.gradientsReady, false);
    const applied = sampleModel(
      id,
      state(id, beat, {
        [gradients]: 1,
        [weights]: 1,
        [hidden]: 0.999,
        [output]: 0.999,
        [loss]: 0.999,
      }),
    );
    assert.equal(applied.updated, true);
    assert.equal(applied.gradientsReady, true);
    assert.equal(applied.recomputed, false);
    assert.equal(applied.payoff, false);
    assert.equal(applied.lossReady, false);
    const done = sampleModel(id, state(id, beat, Object.fromEntries(cues.map((cue) => [cue, 1]))));
    assert.equal(done.recomputed, true);
    assert.equal(done.payoff, true);
    assert.equal(done.lossReady, true);
    assert.deepEqual(done.z, pending.z);
    assert.deepEqual(done.gradWeights, pending.gradWeights);
  });
