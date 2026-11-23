import assert from 'node:assert/strict';
import {
  BASE,
  WORDS,
  BRANCHES,
  STATUS_ROW,
  STATUS_IDS,
} from '../../../films/decoding/fixtures.mjs';
import {
  decodeNormalize as normalize,
  decodeRepetition as repeat,
  decodeSoftmax as softmax,
  decodeSupport as keep,
  decodeLengthScore as lengthScore,
} from '../../../films/decoding/arithmetic.mjs';
import { DRAW_STREAM } from '../../../films/decoding/construction.mjs';
import { decodingFreshModel } from '../../../films/decoding/model.mjs';
export {
  BASE,
  WORDS,
  BRANCHES,
  STATUS_ROW,
  STATUS_IDS,
  normalize,
  repeat,
  softmax,
  keep,
  lengthScore,
  DRAW_STREAM,
};
export const fresh = decodingFreshModel();
export const freshNames = ['ready', 'waiting', 'paused', 'checking', 'unknown'];
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const temper = (row, t) => softmax(row.map(Math.log), t);
export const entropy = (row) => -sum(row.filter((p) => p > 0).map((p) => p * Math.log2(p)));
export const ranked = (xs) => xs.map((_, i) => i).sort((a, b) => xs[b] - xs[a] || a - b);
export const sample = (row, u) => {
  let end = 0;
  return row.findIndex((q) => (end += q) > u);
};
export const tiedScores = [2, 2, 2, 0];
export const exactTie = ranked(tiedScores).slice(0, 1);
export const thresholdTie = ranked(tiedScores).filter(
  (i) => tiedScores[i] >= tiedScores[exactTie[0]],
);
export const minFloor = (t, rho, max = 0) => max + t * Math.log(rho);
export const replayScores = [
  [1.0001, 1],
  [0.9999, 1],
];
export const raw = [2.4, 2.1, 1.2, 0.3],
  penalized = repeat(raw, [0], 1.2);
export const samplerRow = softmax(penalized),
  samplerKept = keep(samplerRow, 'p', 0.9),
  seedDraw = 0.8444218515250481;
export const ordered = [0.45, 0.3, 0.15, 0.1],
  legalExample = [0.6, 0.3, 0.1],
  onlyTwo = normalize([0, 0, legalExample[2]]);
export const peaked = [0.72, 0.2, 0.05, 0.02, 0.01],
  flat = [0.4, 0.2, 0.15, 0.115, 0.035, ...Array(10).fill(0.01)];
export const tests = [
  [1, 0, 1, 0],
  [0, 0, 0, 0],
  [0, 1, 0, 0],
];
export const counts = [3, 1, 0],
  frequency = 0.4,
  presence = 0.2;
export const charge = counts.map((n) => n * frequency + Number(n > 0) * presence);
export const scoreAfterCount = raw.slice(0, 3).map((v, i) => v - charge[i]);
export const statusContinuations = [
  [['period', 0.40], ['again', 0.35], ['today', 0.25]],
  [['recovery', 0.90], ['maintenance', 0.10]],
];
export const pathProb = statusContinuations.map((row, i) => STATUS_ROW[i] * row[0][1]),
  eos = [0.9, 0.5],
  complete = pathProb.map((v, i) => v * eos[i]);
export const childRows = [
  [0.5, 0.3, 0.2],
  [0.7, 0.2, 0.1],
];
export const products = childRows.map((row, i) => row.map((v) => v * STATUS_ROW[i]));
const promptCache = { text: 'The canary status is' };
const beamRows = ['degraded', 'in', 'on', 'paused', 'stable', 'healthy', 'unknown', 'pending'].map(
  (suffix) => ({ promptCache, suffix, scores: 50_000 }),
);
export function beamStep(wide) {
  const rows = wide ? beamRows : beamRows.slice(0, 1);
  return { rows, total: sum(rows.map((row) => row.scores)) };
}
export const smallLogs = [-1, -1.08],
  lengths = [2, 5];
export const center = (z) => z.map((v) => v - Math.max(...z));
export const rawSeen = [2, 10, 0];
export const signRaw = [2.4, -0.5, 0.7],
  signSeen = [0, 0, 1];
export const stopReasons = [
  ['End-of-turn ID', 'current message ended'],
  ['Conversation-end ID', 'conversation ended'],
  ['Output limit', 'length-limited prefix'],
  ['Client cancelled the request', 'client_cancelled'],
  ['Generation failed', 'error'],
];
export const limits = { target: 'stop', pieces: ['st', 'opera'] };
export function bufferState(joined) {
  const { pieces, target } = limits;
  const buffer = joined ? pieces.join('') : pieces[0];
  const hit = buffer.indexOf(target);
  return {
    buffer,
    match: hit < 0 ? '' : buffer.slice(hit, hit + target.length),
    remainder: hit < 0 ? '' : buffer.slice(hit + target.length),
  };
}
export function dogPaths(split = 1, sound = 0.9) {
  const p = BRANCHES.map((b) => b.p);
  return [
    [
      ['home', 0.7 - 0.35 * split],
      ['outside', 0.35 * split],
      ['quickly', 0.3],
    ],
    [
      ['soundly', sound],
      ['outside', 1 - sound],
    ],
  ].flatMap((row, i) =>
    row.map(([word, q]) => ({ prefix: BRANCHES[i].word, word, p: p[i], q, joint: p[i] * q })),
  );
}
export function leaders(paths, width) {
  const parents = [...new Set(paths.map((x) => x.prefix))].slice(0, width);
  return paths
    .filter((x) => parents.includes(x.prefix) && x.q > 0)
    .sort((a, b) => b.joint - a.joint)
    .slice(0, width);
}
export function checkModel() {
  const near = (a, b, tol = 1e-8) => assert(Math.abs(a - b) < tol, a + ' vs ' + b);
  for (const r of [BASE, STATUS_ROW, peaked, flat, ordered, legalExample, fresh.row])
    near(sum(r), 1);
  for (const s of [0, 0.5, 1]) {
    const paths = dogPaths(s);
    near(sum(paths.map((x) => x.joint)), 1);
    near(paths[3].joint, 0.36);
    near(paths[0].joint, 0.42 - 0.21 * s);
  }
  const paths = dogPaths();
  assert.equal(leaders(paths, 1)[0].word, 'home');
  assert.deepEqual(
    leaders(paths, 2).map((v) => v.word),
    ['soundly', 'home'],
  );
  assert.equal(leaders(dogPaths(1, 0.5), 2)[0].word, 'home');
  near(products[0][0], 0.225);
  near(products[1][0], 0.21);
  const narrow = beamStep(false);
  const wide = beamStep(true);
  assert.equal(narrow.total, 50_000);
  assert.equal(wide.total, 400_000);
  assert.equal(narrow.rows[0], wide.rows[0]);
  assert.equal(wide.rows.length, 8);
  assert(wide.rows.every((row) => row.scores === narrow.total && row.promptCache === promptCache));
  assert.equal(new Set(wide.rows.map((row) => row.suffix)).size, wide.rows.length);
  assert.equal(STATUS_IDS[ranked(STATUS_ROW)[0]], 'degraded');
  for (const [i, row] of statusContinuations.entries()) {
    const shares = row.map(([, p]) => p);
    near(sum(shares), 1);
    assert.equal(row[ranked(shares)[0]][0], ['period', 'recovery'][i]);
  }
  near(pathProb[0], 0.18);
  near(pathProb[1], 0.27);
  assert.deepEqual(ranked(pathProb), [1, 0]);
  assert.deepEqual(ranked(complete), [0, 1]);
  near(complete[0], 0.162);
  near(complete[1], 0.135);
  near(lengthScore(-1, 2, 0.6), -0.91166, 0.0001);
  assert(lengthScore(-1.08, 5, 0.6) > lengthScore(-1, 2, 0.6));
  assert(lengthScore(-1 + Math.log(0.99), 2, 0.6) > -1);
  assert.equal(sample(BASE, 0.4), 0);
  assert.equal(sample(temper(BASE, 2), 0.4), 1);
  near(sum(temper(STATUS_ROW, 1.5).slice(4)), 0.212, 0.002);
  assert(entropy(temper(STATUS_ROW, 0.3)) < entropy(STATUS_ROW));
  assert.deepEqual(softmax([0, 0, -Infinity], 0), [1, 0, 0]);
  for (const t of [0, 1]) assert.throws(() => softmax([-Infinity, -Infinity], t));
  assert.throws(() => softmax([0, NaN]));
  assert.throws(() => softmax([Infinity, 0]));
  assert.deepEqual(keep(BASE, 'p', 0.8).ids, [0, 1, 2]);
  assert.deepEqual(keep(BASE, 'p', 0.7).ids, [0, 1]);
  assert.deepEqual(keep(temper(BASE, 2), 'p', 0.8).ids, [0, 1, 2, 3]);
  assert.deepEqual(exactTie, [0]);
  assert.deepEqual(thresholdTie, [0, 1, 2]);
  assert.deepEqual(
    replayScores.map((row) => ranked(row)[0]),
    [0, 1],
  );
  const z = [0, -2, -4];
  for (const t of [1, 1.5, 2])
    assert.deepEqual(
      z.map((v, i) => (v >= minFloor(t, 0.1) ? i : -1)).filter((i) => i >= 0),
      keep(softmax(z, t), 'min', 0.1).ids,
    );
  assert.deepEqual(
    [1, 1.5].map((t) => keep(temper(STATUS_ROW, t), 'p', 0.9).ids.length),
    [3, 9],
  );
  for (const id of [-1, raw.length]) assert.throws(() => repeat(raw, [id], 1.2));
  assert.throws(() => keep(BASE, 'p', Infinity));
  assert.throws(() => softmax(raw, Infinity));
  for (const [r, pc, mc] of [
    [peaked, 2, 2],
    [flat, 5, 4],
  ]) {
    assert.equal(keep(r, 'p', 0.9).ids.length, pc);
    assert.equal(keep(r, 'min', 0.1).ids.length, mc);
  }
  assert.deepEqual(repeat(signRaw, signSeen, 1.2), [2, -0.6, 0.7]);
  assert.deepEqual(ranked(penalized), [1, 0, 2, 3]);
  assert.equal(ranked(repeat(center(raw), [0], 1.2))[0], 0);
  scoreAfterCount.forEach((v, i) => near(v, [1, 1.5, 1.2][i]));
  assert.deepEqual(keep(keep(ordered, 'k', 3).values, 'p', 0.8).ids, [0, 1]);
  assert.deepEqual(keep(keep(ordered, 'p', 0.8).values, 'k', 3).ids, [0, 1, 2]);
  assert.deepEqual(keep(onlyTwo, 'p', 0.8).ids, [2]);
  assert.deepEqual(samplerKept.ids, [1, 0, 2]);
  assert.equal(
    samplerKept.ids[
      sample(
        samplerKept.ids.map((i) => samplerKept.values[i]),
        seedDraw,
      )
    ],
    2,
  );
  for (const draw of DRAW_STREAM)
    assert.equal(sample(keep(BASE, 'p', 0.8).values, draw.uniform), draw.bin);
  const reasons = new Map(stopReasons);
  assert.equal(reasons.get('Client cancelled the request'), 'client_cancelled');
  assert.equal(reasons.get('Generation failed'), 'error');
  assert.equal(new Set(reasons.values()).size, stopReasons.length);
  assert.deepEqual(bufferState(true), { buffer: 'stopera', match: 'stop', remainder: 'era' });
  assert.equal(bufferState(false).match, '');
  assert.equal(sum(tests.flat()), 3);
  assert.equal(tests.filter((r) => r.some(Boolean)).length, 2);
  assert.deepEqual(fresh.maskedP.ids, [1, 2, 3]);
  assert.deepEqual(fresh.p.ids, [0, 1, 2]);
}
