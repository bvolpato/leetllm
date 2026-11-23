import assert from 'node:assert/strict';
import {
  attention,
  hidden,
  initialWeights,
  labels,
  referenceLabel,
  secondContext,
  tokens,
  values,
  vocabulary,
} from '../../../films/gpt-to-modern-llms/fixtures.mjs';
import {
  learningTrace,
  outputProjection,
  projectContext,
  rotaryPair,
  sharedQueryRead,
} from '../../../films/gpt-to-modern-llms/model.mjs';
import {
  checkReply,
  chooseRun,
  expertInputs,
  largerWorker,
  live,
  overnight,
  routeExperts,
  runs,
} from '../../../films/gpt-to-modern-llms/workload.mjs';
export {
  attention,
  hidden,
  initialWeights,
  labels,
  referenceLabel,
  secondContext,
  tokens,
  values,
  vocabulary,
  rotaryPair,
  checkReply,
  chooseRun,
  expertInputs,
  largerWorker,
  live,
  overnight,
  routeExperts,
  runs,
};

export const projections = [outputProjection(), projectContext(secondContext)];
export const predictions = projections.map((row) => row.selected);
export const learning = learningTrace();
export const queries = [
  [1, 0],
  [0, 1],
].map(sharedQueryRead);
export const canContinue = (prefix, token) =>
  labels.some((name) => name.startsWith(prefix + token));
export const budget = (parameters, exposures) => 6 * parameters * exposures;
export const rawCache = (positions, heads, width, requests = 1, layers = 1, bytes = 1) =>
  2 * positions * heads * width * requests * layers * bytes;
export const cacheGiB = (heads) => rawCache(8192, heads, 128, 8, 32, 2) / 2 ** 30;
export const features = [3, 4];
export const mean = (a) => a.reduce((acc, x) => acc + x, 0) / a.length;
export const rms = (a) => Math.sqrt(mean(a.map((x) => x * x)));
export const centered = features.map((x) => x - mean(features));
export function normalizationBars(method, centerProgress, scaleProgress) {
  const layer = method === 'LayerNorm';
  const offset = layer ? mean(features) : 0;
  const divisor = rms(layer ? centered : features);
  const divisorLabel = layer ? String(divisor) : '√' + mean(features.map((x) => x * x));
  const bars = features.map((x) =>
    (x - offset * centerProgress) / (1 + (divisor - 1) * scaleProgress),
  );
  if (scaleProgress === 1) {
    const formula = layer ? '(x − ' + offset + ') / ' + divisorLabel : 'x / ' + divisorLabel;
    return { bars, label: 'NORMALIZED OUTPUT', formula, settled: true };
  }
  if (scaleProgress > 0)
    return { bars, label: 'SCALING', formula: 'Divide by ' + divisorLabel, settled: false };
  if (centerProgress === 1)
    return { bars, label: 'CENTERED FEATURES', formula: 'x − ' + offset, settled: true };
  if (centerProgress > 0)
    return { bars, label: 'CENTERING', formula: 'Subtract ' + offset, settled: false };
  return { bars, label: 'INPUT FEATURES', formula: 'x', settled: true };
}

export const expiryExample = { host: 12 * 60 + 5, expiry: 12 * 60, trusted: 11 * 60 + 55 };
export function compareClocks(host, trusted, expiry) {
  return {
    offset: host - trusted,
    remaining: expiry - trusted,
    early: host >= expiry && trusted < expiry,
  };
}
export const silu = (z) => z / (1 + Math.exp(-z));
export const ordinaryWeights = (d, h) => 2 * d * h;
export const matchedWidth = (d, h) => ordinaryWeights(d, h) / (3 * d);
export const mixtral = { total: 47, active: 13, bytes: 2, capacity: 32 };
export const sweep = [
  { slot: 1, hits: 15 },
  { slot: 10, hits: 7 },
  { slot: 20, hits: 14 },
];
export const cases = 20;
export const effortTrials = [
  { setting: 'Low', supported: 15, ms: 820, cost: 0.2 },
  { setting: 'High', supported: 16, ms: 1460, cost: 0.38 },
];
export const effortDeadline = 1000;
export const shards = 4;
export const fits = (run, limits) => run.gb <= limits.gb && run.p95 <= limits.p95;
export function steps(read) {
  return read.values.map((v, i) => v.map((x) => x * read.shares[i]));
}
export function sumSteps(parts) {
  return parts.reduce(([x, y], [dx, dy]) => [x + dx, y + dy], [0, 0]);
}
export function check() {
  const fixed = (array, d = 3) => array.map((x) => +x.toFixed(d));
  assert.deepEqual(predictions, ['Docs', '.']);
  assert.equal(canContinue('', predictions[0]), true);
  assert.equal(canContinue('Docs', '.'), false);
  assert.deepEqual(checkReply(predictions.join('')), { allowed: false, correct: false });
  assert.deepEqual(checkReply('Bug'), { allowed: true, correct: false });
  assert.equal(checkReply(referenceLabel).correct, true);
  assert.deepEqual(
    fixed(sumSteps(values.map((v, i) => v.map((x) => x * attention[i])))),
    fixed(hidden),
  );
  assert.deepEqual(fixed(projections[0].logits), [0.9, 0.52, 0.06, -0.36]);
  assert.deepEqual(fixed(projections[1].logits), [0.6, 0.88, -0.36, 0.06]);
  assert.equal(learning.length, 13);
  for (let i = 1; i < learning.length; i++)
    assert(learning[i].probabilities[0] > learning[i - 1].probabilities[0]);
  for (const [p, t] of [
    [4, 16],
    [8, 8],
    [16, 4],
  ])
    assert.equal(budget(p, t), 384);
  assert.equal(budget(16, 16), 4 * budget(8, 8));
  assert.deepEqual(
    [8, 2].map((h) => rawCache(4, h, 2)),
    [128, 32],
  );
  assert.deepEqual([32, 8, 1].map(cacheGiB), [32, 8, 1]);
  assert.deepEqual(queries[0].keys, queries[1].keys);
  assert.deepEqual(queries[0].values, queries[1].values);
  queries.forEach((read) => assert.deepEqual(fixed(sumSteps(steps(read))), fixed(read.output)));
  assert.deepEqual(
    queries.map((q) => fixed(q.output)),
    [
      [1.462, 0.538],
      [0.538, 1.462],
    ],
  );
  assert.deepEqual(fixed(features.map((x) => x / rms(features))), [0.849, 1.131]);
  assert.deepEqual(
    centered.map((x) => x / rms(centered)),
    [-1, 1],
  );
  for (const method of ['RMSNorm', 'LayerNorm']) {
    const input = normalizationBars(method, 0, 0);
    assert.equal(input.formula, 'x');
    assert.deepEqual(input.bars, [3, 4]);
  }
  const centeredBars = normalizationBars('LayerNorm', 1, 0);
  assert.equal(centeredBars.formula, 'x − 3.5');
  assert.deepEqual(centeredBars.bars, [-0.5, 0.5]);
  const scaling = normalizationBars('LayerNorm', 1, 0.5);
  assert.equal(scaling.settled, false);
  assert.deepEqual(fixed(scaling.bars), [-0.667, 0.667]);
  assert.deepEqual(normalizationBars('LayerNorm', 1, 1).bars, [-1, 1]);
  assert.deepEqual(fixed(normalizationBars('RMSNorm', 0, 1).bars), [0.849, 1.131]);
  const { host, trusted, expiry } = expiryExample;
  assert.deepEqual(compareClocks(host, host, expiry), { offset: 0, remaining: -5, early: false });
  assert.deepEqual(compareClocks(host, trusted, expiry), { offset: 10, remaining: 5, early: true });
  assert.equal(compareClocks(host, expiry, expiry).early, false);
  assert.deepEqual(fixed([0, 1, -1].map((z) => 4 * silu(z))), [0, 2.924, -1.076]);
  assert.equal(matchedWidth(12, 48), 32);
  assert.equal(ordinaryWeights(12, 48), 1152);
  assert.deepEqual(
    fixed(
      [
        [9, 3],
        [19, 13],
        [19, 16],
      ].map(([q, k]) => rotaryPair(q, k).score),
    ),
    [0.565, 0.565, 0.296],
  );
  assert.deepEqual(
    expertInputs.map((e) => routeExperts(e.logits).map((v) => v.id)),
    [
      [0, 2],
      [1, 2],
    ],
  );
  assert.equal(mixtral.total * mixtral.bytes, 94);
  assert.equal(mixtral.active * mixtral.bytes, 26);
  assert.equal((mixtral.total * mixtral.bytes) / shards, 23.5);
  assert.equal(sweep[0].hits - sweep[1].hits, 8);
  assert.equal(effortTrials[1].supported - effortTrials[0].supported, 1);
  assert.deepEqual(
    effortTrials.map((t) => t.ms <= effortDeadline),
    [true, false],
  );
  assert.deepEqual(
    [live, overnight, largerWorker].map((l) => runs.map((r) => fits(r, l))),
    [
      [true, false],
      [true, false],
      [true, true],
    ],
  );
  assert.deepEqual(
    [live, overnight, largerWorker].map((l) => chooseRun(l).id),
    ['A', 'A', 'B'],
  );
  assert.equal(runs[1].verified - runs[0].verified, 4);
  return true;
}
