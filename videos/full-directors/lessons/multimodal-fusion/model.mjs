import assert from 'node:assert/strict';
import {
  DASHBOARD,
  TEXT_STATE,
  VISUAL_KEYS,
  VISUAL_VALUES,
  FRESH_CLOCK,
} from '../../../films/multimodal-fusion/fixtures.mjs';

export const chart = DASHBOARD;
export const projectionWidths = [4, 6];
export const retrievalQuery = [1, 0];
export const candidates = [
  { name: 'Response time', vector: [0.8, 0.6] },
  { name: 'Traffic volume', vector: [0.6, 0.8] },
];
export const similarity = (v) => v.reduce((s, val, i) => s + val * retrievalQuery[i], 0);
export const names = ['Search', 'Checkout', 'Login'];
export const swapped = [names[1], names[0], names[2]];
export const riseIndex = chart.series.findIndex(({ values }) =>
  values
    .slice(chart.hours.indexOf(chart.afterHour) + 1)
    .every((n, j) => n > values[chart.hours.indexOf(chart.afterHour) + j]),
);
export const readings = [
  chart.series[riseIndex].values[chart.hours.indexOf(chart.afterHour)],
  chart.series[riseIndex].values.at(-1),
];
export const badge = { x: 815, y: 18, w: 154, h: 46 };
export const boxCorners = ({ x, y, w, h }) => [x, y, x + w, y + h];
export const side = (px) => px / 14;
export const patchCount = (px) => side(px) ** 2;
export const gridClip = { frames: 10, views: 3, queries: 32 };
export const frameStates = gridClip.views * gridClip.queries;
export const clipStates = frameStates * gridClip.frames;
export const vision = patchCount(336);
export const text = { transcript: 2000, template: 100, question: 100 };
export const textCount = Object.values(text).reduce((a, b) => a + b, 0);
export const windowSize = 4096;
export const reserve = 300;
export const queries = 32;
export const bridgeSlots = Array.from({ length: queries }, (_, index) => index + 1);
export const alignment = [false, true, false],
  instruction = [false, true, true],
  jointTraining = [true, true, true];
export const checkpointTasks = [
  { task: 'Read the chart label', before: 13, after: 17, cases: 20 },
  { task: 'Answer from text alone', before: 18, after: 15, cases: 20 },
];
export const views = 5;
export function plan(n, count = views, t = textCount, r = reserve) {
  const visual = n * count,
    prefix = visual + t,
    total = prefix + r;
  return {
    n,
    count,
    t,
    r,
    visual,
    prefix,
    total,
    free: windowSize - total,
    slots: Math.floor((windowSize - r - t) / n),
  };
}
export const direct = plan(vision),
  reduced = plan(queries);
export const freshDirect = plan(patchCount(448), 4, 1800, 256),
  freshSmall = plan(queries, 4, 1800, 256);
export const textSquare = textCount ** 2,
  extraScores = textCount * reduced.visual,
  mixedSquare = (textCount + reduced.visual) ** 2;
export const audio = { seconds: 40, rate: 100, group: 10 };
export const audioSteps = audio.seconds * audio.rate,
  audioStates = Math.ceil(audioSteps / audio.group);
export const localCrops = [
  { name: 'Time axis', score: 0.9 },
  { name: 'Legend', score: 0.8 },
  { name: 'Paging badge', score: 0.7 },
];
export const selected = [
  'Thumbnail',
  ...localCrops
    .toSorted((a, b) => b.score - a.score)
    .slice(0, 1)
    .map((c) => c.name),
];
export const cacheStages = ['Encode', 'Project', 'Shared prefill', 'Question prefill', 'Decode'];
export function cacheRun(hit) {
  const skip = { none: 0, features: 1, projected: 2, kv: 3 }[hit];
  return cacheStages.map((label, i) => ({ label, run: i >= skip }));
}
export const shared = text.template + text.transcript + reduced.visual;
export const kv = { layers: 32, heads: 8, width: 128, bytes: 2 };
export const tokenBytes = 2 * kv.layers * kv.heads * kv.width * kv.bytes;
export const logicalMiB = (n) => (n * tokenBytes) / 2 ** 20;
export const query = TEXT_STATE,
  keys = VISUAL_KEYS,
  vals = VISUAL_VALUES;
const sum = (ns) => ns.reduce((a, b) => a + b, 0);
export const dots = keys.map((key) => sum(key.map((x, j) => x * query[j])));
export const scores = dots.map((x) => x / Math.sqrt(query.length));
export function softmax(logits) {
  const m = Math.max(...logits),
    exps = logits.map((x) => Math.exp(x - m));
  return exps.map((x) => x / sum(exps));
}
export const weights = softmax(scores),
  parts = weights.map((w, i) => w * vals[i][0]);
export const read = vals[0].map((_, j) => sum(vals.map((v, i) => v[j] * weights[i])));
export const fuse = (gate) => query.map((v, j) => v + Math.tanh(gate) * read[j]);
export const gated = fuse(0);
export const jointScores = [0, 0],
  jointValues = [2, 0],
  [textOnlyWeight] = softmax(jointScores.slice(0, 1)),
  textOnlyRead = textOnlyWeight * jointValues[0],
  jointWeights = softmax(jointScores),
  joint = sum(jointWeights.map((w, i) => w * jointValues[i]));
export const wide = { deploy: [105, 135], rise: [90, 270] },
  tight = { ...wide, rise: [170, 190] };
export const freshA = { deploy: FRESH_CLOCK.deploy, rise: FRESH_CLOCK.firstRise },
  freshB = { ...freshA, rise: FRESH_CLOCK.revisedRise };
export function order({ deploy, rise }) {
  return deploy[1] < rise[0] ? 'after' : rise[1] < deploy[0] ? 'before' : 'unresolved';
}
export const requirements = [
  ['Helpfulness', 0.85],
  ['Label exact match', 0.9],
  ['Region IoU', 0.65],
];
export const runA = [0.91, 0.9, NaN],
  runB = [0.91, 0.89, 0.68];
export const passes = (v, limit) => Number.isFinite(v) && v >= limit && v <= 1;
export const format = (n) => n.toLocaleString('en-US');
export function check() {
  assert(candidates.every(({ vector }) => Math.abs(Math.hypot(...vector) - 1) < 1e-12));
  assert.deepEqual(
    candidates.map((row) => similarity(row.vector)),
    [0.8, 0.6],
  );
  assert.equal(riseIndex, 1);
  assert.deepEqual(readings, [5.2, 9]);
  assert.deepEqual([names[riseIndex], swapped[riseIndex]], ['Checkout', 'Search']);
  assert.deepEqual(boxCorners(badge), [815, 18, 969, 64]);
  assert.deepEqual([224, 336, 448].map(patchCount), [256, 576, 1024]);
  assert.equal(bridgeSlots.length, gridClip.queries);
  assert.deepEqual([bridgeSlots[0], bridgeSlots.at(-1)], [1, 32]);
  assert.deepEqual(
    [alignment, instruction, jointTraining].map((stage) => stage.filter(Boolean).length),
    [1, 2, 3],
  );
  assert.deepEqual(
    checkpointTasks.map((row) => row.after - row.before),
    [4, -3],
  );
  assert.deepEqual([frameStates, clipStates], [96, 960]);
  assert.deepEqual(
    [direct.slots, direct.prefix, direct.total, direct.free],
    [2, 5080, 5380, -1284],
  );
  assert.deepEqual([reduced.visual, reduced.total, reduced.free], [160, 2660, 1436]);
  assert.deepEqual([freshDirect.total, freshSmall.total], [6152, 2184]);
  assert.deepEqual([textSquare, extraScores, mixedSquare], [4840000, 352000, 5569600]);
  assert.deepEqual(selected, ['Thumbnail', 'Time axis']);
  assert.deepEqual([audioSteps, audioStates], [4000, 400]);
  assert.deepEqual(
    cacheRun('projected').map((r) => r.run),
    [false, false, true, true, true],
  );
  assert.deepEqual(
    cacheRun('kv').map((r) => r.run),
    [false, false, false, true, true],
  );
  assert.deepEqual([shared, tokenBytes, logicalMiB(reduced.total)], [2260, 131072, 332.5]);
  assert(Math.abs(dots[0] - 0.57) < 1e-10);
  assert(Math.abs(sum(weights) - 1) < 1e-10);
  assert.deepEqual(
    weights.map((w) => +w.toFixed(3)),
    [0.384, 0.317, 0.299],
  );
  assert.equal(parts.indexOf(Math.max(...parts)), 1);
  assert.deepEqual(
    read.map((n) => +n.toFixed(3)),
    [0.322, 0.271, 0.407],
  );
  assert.deepEqual(gated, query);
  assert.equal(+fuse(0.35)[0].toFixed(3), 0.308);
  assert.deepEqual([textOnlyWeight, textOnlyRead], [1, 2]);
  assert.deepEqual(jointWeights, [0.5, 0.5]);
  assert.equal(sum(jointWeights), textOnlyWeight);
  assert.equal(joint, 1);
  assert.deepEqual([wide, tight, freshA, freshB].map(order), [
    'unresolved',
    'after',
    'after',
    'unresolved',
  ]);
  assert.deepEqual(
    runA.map((v, i) => passes(v, requirements[i][1])),
    [true, true, false],
  );
  assert.deepEqual(
    runB.map((v, i) => passes(v, requirements[i][1])),
    [true, false, true],
  );
  assert([undefined, NaN, Infinity, -0.01, 1.01].every((v) => !passes(v, 0.9)));
}
