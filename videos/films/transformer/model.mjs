import { HEAD_WORKSHEET, WK, WOUT, WQ } from './fixtures.mjs';
import {
  clamp,
  cue,
  done,
  event,
  lerpRow,
  mergeHeads,
  norm,
  normStats,
  positionIds,
  project,
  smooth,
  splitHeads,
  sum,
} from './arithmetic.mjs';
import assert from 'node:assert/strict';
import { dotProduct, stableSoftmax } from 'vizmatic';
export const INPUT = positionIds([0, 1, 2]);
function weightedRead(values, weights) {
  return values[0].map((_, j) => sum(values.map((row, i) => row[j] * weights[i])));
}

export function compute(input = INPUT) {
  return decode(input, input.map(norm));
}

function decode(input, N) {
  const Q = N.map((row) => project(row, WQ)),
    K = N.map((row) => project(row, WK)),
    V = N.map((row) => [...row]);
  const raw = Q.map((q) => K.map((k) => dotProduct(q, k))),
    scores = raw.map((row) => row.map((v) => v / Math.sqrt(2)));
  const weights = scores.map((row, i) => [
    ...stableSoftmax(row.slice(0, i + 1)),
    ...Array(input.length - i - 1).fill(0),
  ]);
  const A = weights.map((w) => weightedRead(V, w));
  return { N, Q, K, V, raw, scores, weights, A, ...finishBlock(input, A) };
}

function finishBlock(input, A) {
  const update = A.map((row) => row.map((v) => 0.35 * v)),
    Y = input.map((row, i) => row.map((v, j) => v + update[i][j]));
  const ffnInput = Y.map(norm),
    pre = ffnInput.map((n) => [...n, n[0] - n[1], n[2] - n[3]]),
    H = pre.map((row) => row.map((v) => Math.max(0, v)));
  const F = H.map((h) => h.slice(0, 4).map((v, j) => 0.2 * v + 0.05 * h[4 + (j % 2)]));
  const Z = Y.map((row, i) => row.map((v, j) => v + F[i][j])),
    final = Z.map(norm);
  const logits = WOUT.map((w) => dotProduct(w, final.at(-1))),
    exps = logits.map((v) => Math.exp(v - Math.max(...logits))),
    denominator = sum(exps),
    probs = exps.map((v) => v / denominator);
  return {
    update,
    Y,
    ffnInput,
    pre,
    H,
    F,
    Z,
    final,
    logits,
    exps,
    denominator,
    probs,
    choice: logits.indexOf(Math.max(...logits)),
  };
}
export const MODEL = compute();
export const FEEDBACK_IDS = [0, 1, 2, MODEL.choice];
export const FEEDBACK_INPUT = positionIds(FEEDBACK_IDS);
export const FEEDBACK = compute(FEEDBACK_INPUT);

export function normalizationAxisCase(change, acrossPositions) {
  const input = INPUT.map((row) => [...row]);
  input[2][0] += change;
  const columns = input[0].map((_, j) => input.map((row) => row[j]));
  const columnNorms = columns.map(norm);
  const normalized = acrossPositions
    ? input.map((row, i) => row.map((_, j) => columnNorms[j][i]))
    : input.map(norm);
  const group = acrossPositions ? columns[0] : input[0];
  return { input, mean: sum(group) / group.length, model: decode(input, normalized) };
}
export const AXIS_BASELINES = [false, true].map((across) => normalizationAxisCase(0, across));

// Decode a single query against keys and values retained from these positions.
function cachedStep(input, full, queryMaskPosition) {
  const last = input.at(-1);
  const query = project(norm(last), WQ);
  const allowedKeys = full.K.slice(0, queryMaskPosition + 1);
  const scores = allowedKeys.map((key) => dotProduct(query, key) / Math.sqrt(query.length));
  const weights = [...stableSoftmax(scores), ...Array(full.K.length - allowedKeys.length).fill(0)];
  const read = weightedRead(full.V, weights);
  const { logits, choice } = finishBlock([last], [read]);
  const maxLogitDifference = Math.max(...logits.map((v, i) => Math.abs(v - full.logits[i])));
  return { weights, read, logits, choice, maxLogitDifference };
}

export const CACHE_RUNS = [INPUT, FEEDBACK_INPUT].map((input, i) => {
  const full = [MODEL, FEEDBACK][i];
  return {
    full,
    upperLeft: cachedStep(input, full, 0),
    aligned: cachedStep(input, full, input.length - 1),
  };
});
export function embeddingFrame(state) {
  const lookup = event(state, 0, 'embedding-lookup'),
    added = event(state, 1, 'position-add');
  return {
    lookup,
    added,
    coordinates: Math.min(4, Math.floor(added * 4 + 1e-9)),
    values: INPUT[2],
  };
}
export function normalizationFrame(state) {
  const stats = normStats(INPUT[2]),
    center = event(state, 0, 'center-row'),
    scale = event(state, 1, 'rescale-row');
  return {
    ...stats,
    center,
    rescale: scale,
    points: lerpRow(lerpRow(INPUT[2], stats.centered, center), stats.normalized, scale),
  };
}
export function attentionMixFrame(beat, progress, cues) {
  const state = {
      beat,
      beatP: progress,
      cues,
    },
    id = ['mix-function', 'mix-returns', 'mix-the'][beat] ?? 'mix-the';
  const p = cue(state, id),
    selected = Math.min(2, beat),
    products = MODEL.V.map((row, i) => row.map((v) => v * MODEL.weights[2][i]));
  const count = selected + (done(p) ? 1 : 0),
    previous = Array.from(
      {
        length: 4,
      },
      (_, j) => sum(products.slice(0, selected).map((row) => row[j])),
    );
  const scaled = smooth(p / 0.4),
    moved = smooth((p - 0.4) / 0.6),
    factor = 1 + (MODEL.weights[2][selected] - 1) * scaled;
  const from = [previous[0] * moved, previous[3] * moved],
    vector = [MODEL.V[selected][0] * factor, MODEL.V[selected][3] * factor];
  return {
    selected,
    p,
    products,
    count,
    sum: Array.from(
      {
        length: 4,
      },
      (_, j) => sum(products.slice(0, count).map((row) => row[j])),
    ),
    from,
    to: from.map((v, j) => v + vector[j]),
    factor,
    scaled,
    moved,
  };
}
export function residualSpatialFrame(state) {
  const projection = event(state, 0, 'output-project'),
    added = event(state, 1, 'residual-add'),
    factor = 1 - 0.65 * projection;
  return {
    factor,
    added,
    update: MODEL.A[2].map((v) => v * factor),
    current: INPUT[2].map((v, j) => v + MODEL.update[2][j] * added),
  };
}
export function ffnSpatialFrame(state) {
  const projected = cue(state, 'ffn-project', 0.05, 0.45),
    added = cue(state, 'ffn-add', 0.5, 0.85);
  return {
    projected,
    added,
    current: MODEL.Y[2].map((v, j) => v + MODEL.F[2][j] * added),
  };
}
export function decisionSpatialFrame(state) {
  const known = done(event(state, 3, 'feedback-point', 0.2, 0.5));
  return {
    known,
    point: known ? [FEEDBACK.final[3][2], FEEDBACK.final[3][3]] : null,
    row: known ? FEEDBACK.final[3] : MODEL.final[2],
    scores: known ? FEEDBACK.logits : MODEL.logits,
    choice: known && done(event(state, 3, 'feedback-choice', 0.6, 0.85)) ? FEEDBACK.choice : null,
  };
}
export function probabilityProgress(beat, progress, cues) {
  if (beat < 1) return 0;
  if (beat > 1) return 1;
  const c = cues?.['next-token-probabilities-b2-1'];
  return c ? c.progress : clamp((progress - 0.1) / 0.65);
}
export function choiceFrame(state) {
  const normalized = event(state, 0, 'final-normalization', 0.05, 0.25),
    product = event(state, 0, 'result-product', 0.3, 0.55);
  const scores = event(state, 0, 'vocabulary-products', 0.6, 0.85),
    mass = event(state, 1, 'next-token-probabilities-b2-1', 0.2, 0.5);
  const shares = event(state, 1, 'probability-shares', 0.55, 0.85),
    choice = event(state, 3, 'greedy-choice');
  const productCount = done(normalized) ? Math.min(4, Math.floor(product * 4 + 1e-9)) : 0;
  return {
    normalized,
    productCount,
    resultKnown: productCount === 4,
    scoreCount: Math.min(6, Math.floor(scores * 6 + 1e-9)),
    expCount: Math.min(6, Math.floor(mass * 6 + 1e-9)),
    mass,
    shareCount: done(mass) ? Math.min(6, Math.floor(shares * 6 + 1e-9)) : 0,
    choice: done(choice) ? MODEL.choice : null,
  };
}
export function feedbackFrame(state) {
  const output = event(state, 1, 'feedback-state', 0.5, 0.85),
    stage = Math.min(3, Math.floor(output * 3 + 1e-9));
  return {
    appended: done(event(state, 0, 'append-token')),
    embedded: event(state, 0, 'feedback-embedding', 0.45, 0.8),
    mixture: event(state, 1, 'feedback-read'),
    output,
    stage,
    choice: decisionSpatialFrame(state).choice,
  };
}
export function validateModel() {
  for (const model of [MODEL, FEEDBACK]) {
    assert(model.weights.every((row) => Math.abs(sum(row) - 1) < 1e-12));
    model.weights.forEach((row, i) =>
      row.forEach((v, j) => {
        if (j > i) assert.equal(v, 0);
      }),
    );
    assert(model.Z.every((row) => row.length === 4 && row.every(Number.isFinite)));
    assert(model.H.every((row) => row.length === 6 && row.every((v) => v >= 0)));
    assert(Math.abs(sum(model.probs) - 1) < 1e-12);
  }
  assert.deepEqual(mergeHeads(splitHeads(HEAD_WORKSHEET)), HEAD_WORKSHEET);
  assert(Math.abs(sum(FRESH.weights) - 1) < 1e-12);
  assert(Math.abs(FRESH.read[0] - 3.57183279386) < 1e-9);
  assert(Math.abs(FRESH.read[1] - 0.21408360307) < 1e-9);
  assert.equal(MODEL.choice, 3);
  assert.equal(FEEDBACK.choice, 5);
  for (const { full, upperLeft, aligned } of CACHE_RUNS) {
    assert.deepEqual(upperLeft.read, full.V[0]);
    assert.notDeepEqual(upperLeft.logits, full.logits);
    assert.deepEqual(aligned.read, full.A.at(-1));
    assert.deepEqual(aligned.logits, full.logits);
  }
  assert.equal(CACHE_RUNS[0].upperLeft.choice, 4);
  assert.equal(CACHE_RUNS[1].upperLeft.choice, FEEDBACK.choice);
  assert.deepEqual(FEEDBACK.Z.slice(0, 3), MODEL.Z);
  for (const [i, before] of AXIS_BASELINES.entries()) {
    const after = normalizationAxisCase(4, Boolean(i));
    for (const run of [before, after])
      run.model.weights.forEach((row, t) => assert(row.slice(t + 1).every((w) => w === 0)));
    if (i === 0) assert.deepEqual(after.model.Z.slice(0, 2), before.model.Z.slice(0, 2));
    else assert.notDeepEqual(after.model.Z[0], before.model.Z[0]);
  }
  const future = INPUT.map((row) => [...row]);
  future[2][0] += 4;
  assert.deepEqual(compute(future).Z.slice(0, 2), MODEL.Z.slice(0, 2));
  assert.notDeepEqual(compute(future).Z[2], MODEL.Z[2]);
  const past = INPUT.map((row) => [...row]);
  past[0][0] += 4;
  assert(compute(past).Z.every((row, i) => row.some((v, j) => Math.abs(v - MODEL.Z[i][j]) > 1e-8)));
  return true;
}
export const FRESH = (() => {
  const q = [2, -1],
    keys = [
      [1, 0],
      [0, 1],
    ],
    values = [
      [4, 0],
      [0, 2],
    ],
    scores = keys.map((k) => dotProduct(q, k) / Math.sqrt(2)),
    weights = stableSoftmax(scores),
    read = weightedRead(values, weights);
  return {
    q,
    keys,
    values,
    scores,
    weights,
    read,
    wrong: weightedRead(values, [1, 0]),
  };
})();
export function extendedFrame(scene, state) {
  const b = state.beat ?? 0,
    p = cue(state, `tr-${scene}-voice-${b}`, 0, 1);
  const at = (key, beat) => done(event(state, beat, `tr-${scene}-${key}`));
  const frame = {
    beat: b,
    progress: p,
    at,
  };
  if (scene === 'fresh-decoder')
    return {
      ...frame,
      scoresKnown: at('scores', 1),
      sharesKnown: at('shares', 1),
      readKnown: at('read', 1),
      wrongKnown: at('wrong', 2),
      repaired: at('repair', 2),
    };
  return frame;
}
