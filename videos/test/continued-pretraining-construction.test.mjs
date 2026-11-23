import test from 'node:test';
import assert from 'node:assert/strict';
import {
  controlledSgd,
  dependencyModel,
  packedCorpus,
  packingOwners,
  shuffleOwners,
  WINDOW_ORDER,
  freshReductionFrame,
  mixtureReduction,
  vocabularyMass,
  centroidCoordinates,
  CENTROID_INPUTS,
  exactLearningRate,
  chooseCheckpoint,
  FRESH_CHECKPOINTS,
  manifestAdmission,
  normalizedFingerprint,
  byteReport,
} from '../animations/continued-pretraining.mjs';
const near = (a, b, tol = 1e-9) => assert(Math.abs(a - b) <= tol, `${a} differs from ${b}`);
test('response loss sends the actual fixed-head derivative to both used inputs', () => {
  const h = [
      [1, 0],
      [0, 1],
    ],
    head = [
      [1, 0, -1],
      [0, 1, 1],
    ];
  const loss = (rows) => {
    const x = rows[0][0] + rows[1][0],
      y = rows[0][1] + rows[1][1],
      z = head[0].map((v, i) => x * v + y * head[1][i]);
    return Math.log(z.reduce((a, v) => a + Math.exp(v), 0)) - z[2];
  };
  const v = dependencyModel();
  near(loss(h), v.loss);
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 2; c++) {
      const a = structuredClone(h),
        b = structuredClone(h),
        eps = 1e-6;
      a[r][c] += eps;
      b[r][c] -= eps;
      near((loss(a) - loss(b)) / (2 * eps), v.inputGradients[r][c], 1e-8);
    }
  assert.deepEqual(v.inputGradients[2], [0, 0]);
});
test('packing returns every document ending with a unique source owner', () => {
  const p = packedCorpus();
  assert.deepEqual(
    p.blocks.map((a) => a.map((o) => o.token)),
    [
      [11, 12, 13, 0, 21, 22],
      [0, 31, 32, 33, 34, 0],
    ],
  );
  assert.deepEqual(
    p.remainder.map((o) => o.token),
    [41, 0],
  );
  assert.equal(new Set([...p.blocks.flat(), ...p.remainder].map((o) => o.id)).size, 14);
});
test('packing moves one owner around occupied cells rather than through them', () => {
  for (let i = 0; i <= 1400; i++) {
    const a = packingOwners(i / 1400);
    assert.equal(a.length, 14);
    for (let j = 0; j < a.length; j++)
      for (let k = j + 1; k < a.length; k++) {
        const x = a[j],
          y = a[k];
        assert(
          !(
            Math.min(x.x + 92, y.x + 92) - Math.max(x.x, y.x) > 1 &&
            Math.min(x.y + 64, y.y + 64) - Math.max(x.y, y.y) > 1
          ),
          `owners ${x.id}/${y.id} collide at${i}`,
        );
      }
  }
});
test('block and target reductions conserve total weight but change the scalar update', () => {
  const v = mixtureReduction();
  near(v.blockGradient, -0.25);
  near(v.pooledGradient, -0.4);
  const f = mixtureReduction(4, 2, 3, 1);
  near(f.pooledGradient, -5 / 14);
  near(f.blockGradient, -1 / 6);
});
test('fresh repair changes the actual per-target weights and gradient on the same fourteen owners', () => {
  const state = (wrong, repair) => ({
    beat: 1,
    cues: {
      'cpt-fresh-pooled': { phase: 'after' },
      'cpt-fresh-block': { phase: wrong ? 'after' : 'before' },
      'cpt-fresh-repair': { phase: repair ? 'after' : 'before' },
    },
  });
  const bad = freshReductionFrame(state(true, false)),
    fixed = freshReductionFrame(state(true, true));
  for (const f of [bad, fixed]) {
    near(
      f.weights.reduce((a, b) => a + b, 0),
      1,
    );
    near(
      f.weights.reduce((a, w, i) => a + w * (i < 12 ? -0.5 : 0.5), 0),
      f.gradient,
    );
  }
  near(bad.gradient, -1 / 6);
  near(fixed.gradient, -5 / 14);
  assert(fixed.weights.every((v) => Math.abs(v - 1 / 14) < 1e-12));
});
test('output expansion changes the normalizer even when every old logit remains zero', () => {
  const before = vocabularyMass(),
    after = vocabularyMass(true);
  near(before.probabilities[0], 0.5);
  near(after.probabilities[0], 1 / 3);
  near(after.loss - before.loss, Math.log(1.5));
  near(
    after.probabilities.reduce((a, b) => a + b, 0),
    1,
  );
});
test('centroid retains eight coordinate means of the three exact seeded source rows', () => {
  const c = centroidCoordinates();
  assert.equal(c.length, 8);
  for (let k = 0; k < 8; k++)
    near(
      c[k] * 3,
      CENTROID_INPUTS.reduce((s, r) => s + r[k], 0),
    );
  near(c[0], 0.9390323162078857, 1e-7);
});
test('authored schedule has the two shared peak endpoints and exact final floor', () => {
  near(exactLearningRate(0), 3.54e-6);
  near(exactLearningRate(49), 3e-5);
  near(exactLearningRate(50), 3e-5);
  near(exactLearningRate(999), 3e-6);
  assert.throws(() => exactLearningRate(1000), RangeError);
});
test('hard eligibility is inclusive and precedes task ranking or domain tie-breaking', () => {
  assert.equal(chooseCheckpoint(FRESH_CHECKPOINTS, 18, 1).label, 'C');
  assert.equal(
    chooseCheckpoint(
      [
        { label: 'boundary', general: 19, domain: 30, task: 90 },
        { label: 'outside', general: 19.01, domain: 1, task: 99 },
      ],
      18,
      1,
    ).label,
    'boundary',
  );
});
test('manifest types and normalization collisions keep their bounded contracts', () => {
  assert.equal(
    manifestAdmission({ rights: true, scrubbed: true, evalOnly: false, tokens: 800000 }).pass,
    true,
  );
  for (const r of [
    { rights: 'true', scrubbed: true, evalOnly: false, tokens: 1 },
    { rights: true, scrubbed: true, evalOnly: false, tokens: true },
    { rights: true, scrubbed: true, evalOnly: true, tokens: 1 },
  ])
    assert.equal(manifestAdmission(r).pass, false);
  assert.equal(normalizedFingerprint('ID\tX'), normalizedFingerprint(' id x '));
});
test('byte normalization can reverse the ordering from per-token perplexity', () => {
  const a = byteReport(15, 10, 30),
    b = byteReport(18, 20, 30);
  assert(b.ppl < a.ppl);
  assert(b.bitsPerByte > a.bitsPerByte);
  near(a.bitsPerByte, 0.7213475204444817);
});

test('seeded shuffle retains every owner and routes through free row corridors', () => {
  assert.deepEqual(WINDOW_ORDER.slice(0, 5), [17, 15, 11, 18, 7]);
  for (let i = 0; i <= 2000; i++) {
    const a = shuffleOwners(i / 2000);
    assert.equal(new Set(a.map((o) => o.id)).size, 20);
    for (let j = 0; j < a.length; j++)
      for (let k = j + 1; k < a.length; k++) {
        const x = a[j],
          y = a[k];
        assert(
          !(
            Math.min(x.x + 90, y.x + 90) - Math.max(x.x, y.x) > 1 &&
            Math.min(x.y + 50, y.y + 50) - Math.max(x.y, y.y) > 1
          ),
          `shuffle owners ${x.id}/${y.id} collide at${i}`,
        );
      }
  }
  const final = shuffleOwners(1).sort((a, b) => a.destination - b.destination);
  assert.deepEqual(
    final.map((o) => o.id),
    WINDOW_ORDER,
  );
});
test('the painted causal-shift connector lands on its actual successor target owner', async () => {
  const { draw } = await import('../animations/continued-pretraining.mjs');
  const texts = [],
    lines = [],
    C = Object.fromEntries(
      ['ink', 'panel', 'muted', 'blue', 'cyan', 'yellow', 'green', 'pink', 'bg'].map((k) => [k, k]),
    );
  draw(
    {},
    { id: 'scored-objective', beats: [] },
    { beat: 0, beatP: 1 },
    {
      C,
      teaching: {},
      focus: { target: (_id, fn) => fn() },
      text: (_c, text, x, y, size, color, align) =>
        texts.push({ text: String(text), x, y, size, color, align }),
      math: () => {},
      rect: () => {},
      line: (_c, x1, y1, x2, y2) => lines.push({ x1, y1, x2, y2 }),
    },
  );
  const targets = texts.filter((t) => t.text.startsWith('target x')),
    pairs = lines.filter((l) => l.y1 === 520 && l.y2 === 650);
  assert.equal(pairs.length, 6);
  for (let i = 0; i < 6; i++) {
    const nearest = [...targets].sort(
      (a, b) => Math.abs(a.x - pairs[i].x2) - Math.abs(b.x - pairs[i].x2),
    )[0];
    assert.equal(nearest.text, 'target x' + (i + 1));
  }
});

test('one controlled rate changes displacement and both opposed losses consistently', () => {
  const a = controlledSgd(0.3, -0.5),
    b = controlledSgd(3, -0.5);
  near(b.delta, 10 * a.delta);
  for (const r of [a, b])
    near(
      r.probabilities.reduce((s, v) => s + v, 0),
      1,
    );
  assert(b.domainLoss < a.domainLoss);
  assert(b.broadLoss > a.broadLoss);
  near(controlledSgd(1, -0.25).theta, 0.25);
});
