import test from 'node:test';
import assert from 'node:assert/strict';
import {
  finiteUnit,
  comparisonRow,
  maskedMean,
  tokenMaxSim,
  nestedLoss,
  shortlistMetrics,
  miningCandidates,
  MINING_FIXTURE,
} from '../animations/contrastive-learning.mjs';

test('finite-logit centering preserves tied huge inputs and rejects prior division overflow', () => {
  assert.equal(comparisonRow([1e308, 1e308], 1).loss, Math.log(2));
  assert.throws(() => comparisonRow([1e308, 1e308], 0.01), /finite logits/);
  const tiny = finiteUnit([1e-300, 1e-300]);
  assert(Math.abs(tiny[0] - Math.SQRT1_2) < 1e-15);
  assert.throws(() => finiteUnit([0, 0]));
  assert.throws(() => finiteUnit([Infinity, 1]));
});

test('masking removes the verified alias from both the denominator and its score gradient', () => {
  const scores = [0.65, 0.65, 0.05],
    full = comparisonRow(scores, 0.15),
    masked = comparisonRow(scores, 0.15, 0, [true, false, true]);
  assert(full.gradients[1] > 3.3);
  assert.equal(masked.probs[1], 0);
  assert.equal(masked.gradients[1], 0);
  assert(masked.loss < full.loss);
  for (const allowed of [
    [true, true, true],
    [true, false, true],
  ])
    for (let i = 0; i < 3; i++) {
      const h = 1e-6,
        a = [...scores],
        b = [...scores];
      a[i] += h;
      b[i] -= h;
      const numeric =
        (comparisonRow(a, 0.15, 0, allowed).loss - comparisonRow(b, 0.15, 0, allowed).loss) /
        (2 * h);
      assert(Math.abs(numeric - comparisonRow(scores, 0.15, 0, allowed).gradients[i]) < 1e-8);
    }
});

test('masked pooling excludes padded coordinates and requires actual valid tokens', () => {
  assert.deepEqual(
    maskedMean(
      [
        [1, 0],
        [0, 1],
        [99, 99],
      ],
      [1, 1, 0],
    ),
    [0.5, 0.5],
  );
  assert.deepEqual(
    maskedMean(
      [
        [1, 0],
        [0, 1],
        [-1e6, 1e6],
      ],
      [1, 1, 0],
    ),
    [0.5, 0.5],
  );
  assert.throws(() => maskedMean([[1, 0]], [0]));
  assert.throws(() => maskedMean([[1, 0], [1]], [1, 1]));
});

test('MaxSim independently chooses each row maximum and permits reusing a document position', () => {
  const m = tokenMaxSim([
    [0.1, 0.9, 0.2],
    [0.3, 0.8, 0.1],
  ]);
  assert.deepEqual(m.winners, [1, 1]);
  assert(Math.abs(m.sum - 1.7) < 1e-14);
  assert.equal(
    tokenMaxSim([
      [0.12, 0.93, 0.08],
      [0.19, 0.07, 0.91],
    ]).sum,
    1.84,
  );
});

test('nested prefix losses and shortlist recall keep their separate contracts', () => {
  assert.deepEqual(
    [2, 4, 6].map((n) => nestedLoss(n).toFixed(4)),
    ['0.0088', '0.0147', '0.0225'],
  );
  const a = shortlistMetrics(['X', 'P1'], ['P1', 'P2'], 2),
    b = shortlistMetrics(['P1', 'X'], ['P1', 'P2'], 2);
  assert.equal(a.recall, b.recall);
  assert.equal(a.rr, 0.5);
  assert.equal(b.rr, 1);
  assert.equal(shortlistMetrics(['KMS'], ['API'], 1).recall, 0);
});

test('the fresh-case probability geometry waits for the complete spoken reveal', async () => {
  const { createCanvas } = await import('@napi-rs/canvas'),
    { drawFrame } = await import('../lib/scene.mjs'),
    { draw } = await import('../animations/contrastive-learning.mjs');
  const paint = (phase) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id: 'fresh-embedding', title: 'A fresh comparison' },
      {
        beat: 1,
        beatP: 0.5,
        t: 1,
        duration: 60,
        opacity: 1,
        cues: {
          'cl-fresh-embedding-share': { phase, progress: phase === 'after' ? 1 : 0.99 },
          'cl-fresh-embedding-gradient': { phase: 'before', progress: 0 },
        },
      },
      draw,
    );
  const fills = (frame) =>
    frame.shapes.filter(
      (s) => s.kind === 'rect' && s.width === 420 && s.y > 465 && s.y < 685 && s.height > 0,
    );
  assert.equal(fills(paint('during')).length, 0, 'probability bar heights are an answer too');
  assert.equal(fills(paint('after')).length, 3);
});

test('mining excludes verified positives and zero-overlap rows before sorting teacher scores', () => {
  const selected = miningCandidates('How do I rotate an API key?');
  assert.deepEqual(
    selected.map((r) => r.id),
    ['service account', 'KMS intent'],
  );
  assert.deepEqual(
    selected.map((r) => r.overlap),
    [5, 2],
  );
  const highIrrelevant = MINING_FIXTURE.map((r) =>
    r.id === 'GPU guide' ? { ...r, teacher: 100 } : r,
  );
  assert.deepEqual(
    miningCandidates('How do I rotate an API key?', highIrrelevant).map((r) => r.id),
    ['service account', 'KMS intent'],
  );
  assert.throws(() =>
    miningCandidates('API key', [{ text: 'API key', relevant: 'false', teacher: 1 }]),
  );
});
