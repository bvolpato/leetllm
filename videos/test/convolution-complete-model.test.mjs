import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARTICLE_CROP,
  RIDGE,
  POOL_MAP,
  OVERLAP_MAP,
  POOL_INCOMING,
  convolutionShape,
  parameterCount,
  poolSnapshot,
  cropForward,
  residualSlice,
  fieldTrace,
  signalParticipation,
  paddedUniform,
  patchProjection,
  correlate,
} from '../animations/convolution.mjs';
const near = (a, b) => assert(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
test('the single-pixel intervention changes its owned response, saved maximum and logits', () => {
  const before = cropForward(),
    after = cropForward(0.01);
  near(after.raw[0][0] - before.raw[0][0], (0.01 - 0.05) * RIDGE[0][0]);
  for (const [r, c] of [
    [0, 1],
    [1, 0],
    [1, 1],
  ])
    near(after.raw[r][c], before.raw[r][c]);
  assert.deepEqual(before.pool.owners[0].input, [1, 1]);
  assert.deepEqual(after.pool.owners[0].input, [0, 0]);
  near(after.value, 0.876);
  near(after.logits[0], 1.0264);
  near(after.logits[1], -0.6884);
  const routed = poolSnapshot(after.activated, { incoming: [[-2]] });
  assert.deepEqual(routed.gradient, [
    [-2, 0],
    [0, 0],
  ]);
  assert.equal(ARTICLE_CROP[0][0], 0.05);
});
test('overlapping saved winners accumulate signed contributions rather than overwrite them', () => {
  const forward = poolSnapshot(OVERLAP_MAP, { stride: 1 });
  assert.deepEqual(
    forward.owners.map((o) => o.flat),
    [4, 4, 4, 4],
  );
  assert.deepEqual(forward.values, [
    [9, 9],
    [9, 9],
  ]);
  const add = poolSnapshot(OVERLAP_MAP, { stride: 1, incoming: POOL_INCOMING }),
    assign = poolSnapshot(OVERLAP_MAP, { stride: 1, incoming: POOL_INCOMING, overwrite: true });
  near(add.gradient[1][1], 4.5);
  near(assign.gradient[1][1], 3);
  assert.equal(add.gradient.flat().filter((v) => v !== 0).length, 1);
  const average = poolSnapshot(OVERLAP_MAP, {
    stride: 1,
    incoming: POOL_INCOMING,
    mode: 'average',
  });
  near(average.gradient[1][1], 4.5 / 4);
  near(
    average.gradient.flat().reduce((a, b) => a + b, 0),
    4.5,
  );
});
test('max-pool owner routes match finite differences and first-index tie convention', () => {
  const f = poolSnapshot(POOL_MAP, { incoming: POOL_INCOMING }),
    eps = 1e-6,
    objective = (a) =>
      poolSnapshot(a)
        .values.flat()
        .reduce((s, v, i) => s + v * POOL_INCOMING.flat()[i], 0);
  POOL_MAP.forEach((row, r) =>
    row.forEach((v, c) => {
      const a = POOL_MAP.map((row) => [...row]),
        z = POOL_MAP.map((row) => [...row]);
      a[r][c] += eps;
      z[r][c] -= eps;
      assert(Math.abs((objective(a) - objective(z)) / (2 * eps) - f.gradient[r][c]) < 1e-8);
    }),
  );
  assert.deepEqual(
    poolSnapshot([
      [0.9, 0.9],
      [0.2, 0.1],
    ]).owners[0].input,
    [0, 0],
  );
});
test('dilation changes footprint and valid starts while grouped parameters retain only connected channels', () => {
  assert.equal(convolutionShape(28, 3, { dilation: 2 }), 24);
  assert.equal(convolutionShape(17, 3, { stride: 2, padding: 1, dilation: 2 }), 8);
  assert.equal(parameterCount(6, 8, 3, 2), 224);
  assert.equal(parameterCount(4, 6, 3, 2), 114);
  assert.throws(() => parameterCount(4, 5, 3, 2), /divisible/);
  assert.throws(() => convolutionShape(3, 3, { dilation: 2 }), /effective kernel/);
  assert.deepEqual(
    fieldTrace().map(({ field, jump, size }) => [field, jump, size]),
    [
      [3, 1, 222],
      [5, 1, 220],
      [6, 2, 110],
      [10, 2, 108],
    ],
  );
});
test('boundary participation and padding artifacts preserve the declared image premises', () => {
  assert.equal(signalParticipation(5, 0, 0).count, 1);
  assert.equal(signalParticipation(5, 2, 2).count, 9);
  assert.equal(signalParticipation(5, 0, 0, 1).count, 4);
  assert.equal(signalParticipation(4, 1, 1).count, 4);
  near(paddedUniform('zero').maxAbs, 1.8);
  near(paddedUniform('reflect').maxAbs, 0);
  near(paddedUniform('zero', 0.4).maxAbs, 1.2);
});
test('patch coefficient reshaping preserves the exact token sums and ordering', () => {
  const f = patchProjection();
  for (let feature = 0; feature < 3; feature++) {
    const map = correlate(f.image, f.kernels[feature], 2);
    for (let i = 0; i < 4; i++)
      near(map[Math.floor(i / 2)][i % 2] + f.bias[feature], f.tokens[i][feature]);
  }
  assert.equal(f.weights.flat().length + f.bias.length, 15);
  assert.deepEqual(f.patches[1], [3 / 16, 4 / 16, 7 / 16, 8 / 16]);
});

import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

import { draw } from '../animations/convolution.mjs';
registerLessonFonts();
const lesson = await readRepositoryLesson('videos/lessons/convolution.lesson.yaml'),
  transferScene = lesson.scenes.find((s) => s.id === 'earned-cnn-transfer');
test('moving patch products stay readable beside their accumulator route', () => {
  const scene = lesson.scenes.find((s) => s.id === 'patch');
  for (const progress of [
    0.09773462783171517,
    ...Array.from({ length: 180 }, (_, i) => (i + 1) / 181),
  ]) {
    const cues = Object.fromEntries(
      scene.beats
        .flatMap((b) => b.visual_cues ?? [])
        .map((c) => [
          c.id,
          { progress: 0, reveal: 0, active: false, strength: 0, targets: c.targets },
        ]),
    );
    cues['patch-accumulate'] = {
      ...cues['patch-accumulate'],
      progress,
      reveal: 1,
      phase: 'during',
      active: true,
      strength: 1,
    };
    const canvas = createCanvas(1920, 1080),
      audit = drawFrame(
        canvas.getContext('2d'),
        lesson,
        scene,
        {
          beat: 0,
          beatP: 0.23723903705923485,
          t: 3.5666666666666664,
          duration: 37.333333333333336,
          opacity: 1,
          cueTiming: 'provider-words',
          cues,
        },
        draw,
      );
    assert.deepEqual([...audit.issues, ...layoutIssues(audit)], [], String(progress));
  }
});
function transferFrame(beat, shown = [], timing) {
  const canvas = createCanvas(1920, 1080),
    cues = Object.fromEntries(
      transferScene.beats
        .flatMap((b) => b.visual_cues)
        .map((c) => [
          c.id,
          {
            progress: shown.includes(c.id) ? 1 : 0,
            reveal: shown.includes(c.id) ? 1 : 0,
            active: false,
            strength: 0,
            targets: [],
          },
        ]),
    );
  if (timing)
    cues['fresh-gradient'] = {
      ...cues['fresh-gradient'],
      start: 90,
      end: 100,
      progress: Math.max(0, Math.min(1, (timing.time - 90) / 10)),
    };
  const audit = drawFrame(
    canvas.getContext('2d'),
    lesson,
    transferScene,
    { beat, beatP: 0.95, t: timing?.time, opacity: 1, cueTiming: 'provider-words', cues },
    draw,
  );
  assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
  return audit;
}
const newMapLabels = (a) =>
  a.labels.filter((l) => l.x >= 1280 && l.x < 1490 && l.y > 700 && l.y < 900).map((l) => l.text);
test('the fresh-pixel prediction withholds changed responses and independently earns each reveal', () => {
  const before = transferFrame(0, ['fresh-pixel']);
  assert.deepEqual(newMapLabels(before), ['?', '?', '?', '?']);
  const first = transferFrame(1, ['fresh-pixel', 'fresh-delta', 'fresh-map']);
  assert.deepEqual(newMapLabels(first), ['0.876', '?', '?', '?']);
  const after = transferFrame(1, [
    'fresh-pixel',
    'fresh-delta',
    'fresh-map',
    'fresh-other-values',
    'fresh-owner',
  ]);
  assert.deepEqual(newMapLabels(after), ['0.876', '0.789', '0.817', '0.874']);
});
test('new logits and the signed backward owner stay hidden until their separate spoken payoffs', () => {
  const ready = ['fresh-pixel', 'fresh-delta', 'fresh-map', 'fresh-other-values', 'fresh-owner'],
    before = transferFrame(2, ready);
  assert(!before.labels.some((l) => l.text.includes('1.0264')));
  assert.equal(
    before.labels.filter((l) => l.x >= 850 && l.x < 1030 && l.y >= 760 && l.y < 940).length,
    0,
  );
  const after = transferFrame(2, [...ready, 'fresh-logits', 'fresh-gradient']);
  assert(after.labels.some((l) => l.text === 'logits [1.0264, −0.6884]'));
  assert.deepEqual(
    after.labels
      .filter((l) => l.x >= 850 && l.x < 1030 && l.y >= 760 && l.y < 940)
      .map((l) => l.text),
    ['-2', '0', '0', '0'],
  );
});

test('a closed residual activation zeros both local routes while an active shortcut can cancel', () => {
  const ordinary = residualSlice(0.2, 3, 1);
  near(ordinary.total, 3.6);
  near(ordinary.branch, 0.6);
  near(ordinary.identity, 3);
  assert.equal(residualSlice(-1, 3, 1).total, 0);
  assert.deepEqual(residualSlice(0.2, 3, 0), { incoming: 0, branch: 0, identity: 0, total: 0 });
});

test('coefficient rows stay readable while they split into kernels and attention edges stop at token bounds', () => {
  const scene = lesson.scenes.find((s) => s.id === 'patch-projection');
  for (const beat of [1, 2])
    for (let step = 0; step <= 24; step++) {
      const q = step / 24,
        cues = Object.fromEntries(
          scene.beats
            .flatMap((b) => b.visual_cues)
            .map((c) => [
              c.id,
              { progress: 1, reveal: 1, active: false, strength: 0, targets: [] },
            ]),
        );
      for (const id of beat === 1 ? ['patch-reshape'] : ['patch-mix'])
        cues[id] = { ...cues[id], progress: q, reveal: q };
      const canvas = createCanvas(1920, 1080),
        audit = drawFrame(
          canvas.getContext('2d'),
          lesson,
          scene,
          {
            beat,
            beatP: q,
            opacity: beat === 2 && step === 24 ? 0.4 : 1,
            cueTiming: 'provider-words',
            cues,
          },
          draw,
        );
      assert.deepEqual([...audit.issues, ...layoutIssues(audit)], [], beat + '/' + q);
    }
});

test('each channel mean travels into its own row without crossing another channel label', () => {
  const scene = lesson.scenes.find((s) => s.id === 'global-average-head');
  for (let step = 1; step < 24; step++) {
    const q = step / 24,
      cues = Object.fromEntries(
        scene.beats
          .flatMap((b) => b.visual_cues)
          .map((c) => [c.id, { progress: 0, reveal: 0, active: false, strength: 0, targets: [] }]),
      );
    cues['mean-collapse'] = { ...cues['mean-collapse'], progress: q, reveal: q };
    const canvas = createCanvas(1920, 1080),
      a = drawFrame(
        canvas.getContext('2d'),
        lesson,
        scene,
        { beat: 0, beatP: q, opacity: 1, cues, cueTiming: 'provider-words' },
        draw,
      );
    assert.deepEqual([...a.issues, ...layoutIssues(a)], [], String(q));
  }
});

test('the saved-owner gradient starts its transfer after the spoken owner and arrives before its value is deposited', () => {
  const ready = [
      'fresh-pixel',
      'fresh-delta',
      'fresh-map',
      'fresh-other-values',
      'fresh-owner',
      'fresh-logits',
    ],
    gradientLabels = (a) =>
      a.labels.filter((l) => l.x >= 850 && l.x < 1030 && l.y >= 760 && l.y < 940);
  assert.equal(gradientLabels(transferFrame(2, ready, { time: 99 })).length, 0);
  assert(!gradientLabels(transferFrame(2, ready, { time: 100.6 })).some((l) => l.text === '-2'));
  assert.deepEqual(
    gradientLabels(transferFrame(2, ready, { time: 101.3 })).map((l) => l.text),
    ['-2', '0', '0', '0'],
  );
});
