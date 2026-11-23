import {
  featureNames,
  featureWeights,
  freshFeatureEvents,
  targetRows,
  waitTimes,
} from './fixtures.mjs';
import { encode, heartbeatAge, scoreForCap } from './arithmetic.mjs';
import {
  eligible,
  mean,
  robustFortyTwo,
  robustOutlier,
  scaleRows,
  smoothed,
  standardFortyTwo,
  std,
} from './construction.mjs';
import assert from 'node:assert/strict';
import { weightedVectorState } from 'vizmatic';
export function scalingSnapshot(beat, progress, robustCue) {
  const clip = (value) => Math.max(0, Math.min(1, value));
  return scaleRows.map((row, index) => ({
    ...row,
    standardProgress: beat > 0 ? 1 : clip((progress - (0.08 + index * 0.055)) / 0.16),
    robustProgress:
      beat < 1
        ? 0
        : beat > 1
          ? 1
          : robustCue === undefined
            ? clip((progress - 7.1 / 14.018) / ((10.1625 - 7.1) / 14.018))
            : clip(robustCue),
  }));
}
export function targetEncodingFrame(beat, smoothingProgress, heldOutProgress) {
  const progress = Math.max(0, Math.min(1, smoothingProgress)),
    fitting = targetRows
      .map((row, index) => ({
        ...row,
        id: 'T' + (index + 1),
        index,
      }))
      .filter((row) => ![1, 3, 5, 7].includes(row.index));
  const prior = fitting.reduce((sum, row) => sum + row.missed, 0) / fitting.length;
  const strength = beat < 2 ? 0 : 5 * progress;
  return {
    simple: (1 + strength * 0.625) / (1 + strength),
    strength,
    smoothed,
    heldOut: encode(targetRows, [1, 3, 5, 7], 7),
    showHeldOut: beat > 2 || (beat === 2 && heldOutProgress > 0),
    fitting,
    prior,
    heldOutID: 'T8',
  };
}
export function preprocessingState(beat, progress, capCue) {
  const edit =
    beat === 0
      ? Math.max(0, Math.min(1, capCue === undefined ? (progress - 0.545) / 0.28 : capCue))
      : 1;
  const cap = 180 + 180 * edit;
  return {
    cap,
    age: Math.min(200, cap),
    score: scoreForCap(cap),
  };
}
export function validateModel() {
  validateFeatureConstruction();
  assert.equal(eligible.at(-1).event, '08:30');
  assert.equal((9 * 60 - (8 * 60 + 30)) / 60, 0.5);
  for (const minutes of [510, 515, 525, 540])
    assert.equal(heartbeatAge(540, minutes) * 60, 540 - minutes);
  assert.ok(Math.abs(mean - 1523.25) < 1e-10);
  assert.ok(Math.abs(std - 3959.9) < 0.1);
  assert.ok(Math.abs(standardFortyTwo - -0.374) < 0.001);
  assert.ok(Math.abs(robustFortyTwo - 0.522) < 0.001);
  assert.ok(Math.abs(robustOutlier - 416.452) < 0.001);
  assert.equal(new Set(scaleRows.map((row) => row.id)).size, 8);
  assert.deepEqual(
    scaleRows.map((row) => row.wait),
    waitTimes,
  );
  assert(
    scalingSnapshot(0, 0.8).every((row) => row.standardProgress === 1 && row.robustProgress === 0),
  );
  assert(scalingSnapshot(1, 10.3 / 14.018).every((row) => row.robustProgress === 1));
  assert.ok(Math.abs(smoothed - 0.6875) < 1e-12);
  assert.ok(Math.abs(encode(targetRows, [1, 3, 5, 7], 7) - 0.75) < 1e-12);
  assert.equal(targetEncodingFrame(1, 1, 0).simple, 1);
  assert.equal(targetEncodingFrame(2, 1, 0).simple, smoothed);
  assert.equal(targetEncodingFrame(2, 1, 1).heldOut, 0.75);
  assert.deepEqual(
    targetEncodingFrame(2, 1, 1).fitting.map((row) => row.id),
    ['T1', 'T3', 'T5', 'T7'],
  );
  assert.ok(Math.abs(scoreForCap(180) - 0.445) < 0.001);
  assert.ok(Math.abs(scoreForCap(360) - 0.545) < 0.001);
  assert.equal(scoreForCap(180) < 0.5, true);
  assert.equal(scoreForCap(360) >= 0.5, true);
  for (const progress of [0, 0.12, 0.5, 0.54, 0.545]) {
    assert.equal(preprocessingState(0, progress).age, 180);
    assert.equal(preprocessingState(0, progress).score, scoreForCap(180));
  }
  assert.equal(preprocessingState(0, 0.825).age, 200);
  assert.equal(preprocessingState(1, 0).score, scoreForCap(360));
  return true;
}
export function welfordTrace(values) {
  let n = 0,
    mean = 0,
    m2 = 0;
  return values.map((value) => {
    if (typeof value !== 'number' || !Number.isFinite(value))
      throw Error('Finite numeric telemetry required');
    const oldMean = mean,
      delta = value - mean;
    n++;
    mean += delta / n;
    const second = value - mean,
      increment = delta * second;
    m2 += increment;
    return {
      value,
      n,
      oldMean,
      delta,
      mean,
      second,
      increment,
      m2,
      population: m2 / n,
      sample: n > 1 ? m2 / (n - 1) : null,
    };
  });
}
export function eligibleFeatureEvent(records, cutoff, job = 'J-204') {
  return (
    records
      .filter((r) => r.job === job && r.event <= cutoff && r.available <= cutoff)
      .sort(
        (a, b) => b.event - a.event || b.available - a.available || b.revision - a.revision,
      )[0] ?? null
  );
}
export function featureVector(row) {
  const { pool, queued, heartbeat, backlog, priority } = row;
  if (
    typeof pool !== 'string' ||
    !pool.trim() ||
    typeof priority !== 'boolean' ||
    typeof queued !== 'number' ||
    !Number.isFinite(queued) ||
    queued < 0 ||
    typeof heartbeat !== 'number' ||
    !Number.isFinite(heartbeat) ||
    heartbeat < 0 ||
    (backlog !== null && (typeof backlog !== 'number' || !Number.isFinite(backlog) || backlog < 0))
  )
    throw Error('Invalid normalized feature row');
  const category = pool.trim().toLowerCase(),
    index = category === 'a100-pool' ? 0 : category === 'h100-pool' ? 1 : 2;
  return [
    ...Array.from(
      {
        length: 3,
      },
      (_, i) => Number(i === index),
    ),
    queued,
    Math.min(heartbeat, 180),
    backlog ?? 0,
    Number(backlog === null),
    Number(priority),
  ];
}
export function featureSum(values, weights = featureWeights, progress = 1) {
  return weightedVectorState({
    terms: values.map((x, i) => ({
      id: 'feature-coordinate-' + i,
      label: featureNames[i],
      weight: weights[i],
      values: [x],
    })),
    initial: [0],
    progress,
  });
}
export const lagRoute = (lag) =>
  typeof lag !== 'number' || !Number.isFinite(lag) || lag < 0
    ? 'abstain'
    : lag <= 15
      ? 'normal'
      : lag <= 45
        ? 'fallback'
        : 'abstain';
export function allowedTargetMean(records, cutoff) {
  const labels = records
    .filter((r) => r.scored < cutoff && r.available <= cutoff)
    .map((r) => r.label);
  return labels.length ? labels.reduce((a, b) => a + b, 0) / labels.length : null;
}
export function featureTransfer(backlog = 7, cutoff = 600) {
  const event = eligibleFeatureEvent(freshFeatureEvents, cutoff, 'J-new'),
    vector = featureVector({
      pool: 'unseen-pool',
      queued: 20,
      heartbeat: (cutoff - event.event) / 60,
      backlog,
      priority: false,
    });
  return {
    event,
    vector,
    score: featureSum(vector).total[0],
  };
}
export function featureFrame(state) {
  const b = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0));
  return {
    b,
    p,
    progress(id, beat) {
      if (b < beat) return 0;
      if (b > beat) return 1;
      const c = state.cues?.[id];
      return c
        ? Math.max(0, Math.min(1, c.progress ?? (c.phase === 'after' ? 1 : 0)))
        : Math.max(0, Math.min(1, (p - 0.08) / 0.78));
    },
    started(id, beat) {
      if (b < beat) return false;
      if (b > beat) return true;
      const c = state.cues?.[id];
      return c ? c.phase !== 'before' : p > 0.08;
    },
    completed(id, beat) {
      if (b < beat) return false;
      if (b > beat) return true;
      if (state.cues) return state.cues[id]?.progress === 1;
      return p >= 0.94;
    },
  };
}
export function validateFeatureConstruction() {
  const trace = welfordTrace([2, 4, 6]);
  assert.deepEqual(
    trace.map((s) => s.mean),
    [2, 3, 4],
  );
  assert.deepEqual(
    trace.map((s) => s.m2),
    [0, 2, 8],
  );
  assert.equal(trace[0].sample, null);
  assert.equal(trace[2].population, 8 / 3);
  const v = featureVector({
    pool: 'a100-pool',
    queued: 42,
    heartbeat: 0.5,
    backlog: 18,
    priority: false,
  });
  assert.deepEqual(v, [1, 0, 0, 42, 0.5, 18, 0, 0]);
  assert.equal(featureSum(v).total[0], 0.61);
  const swapped = [...v];
  [swapped[3], swapped[4]] = [swapped[4], swapped[3]];
  assert(Math.abs(featureSum(swapped).total[0] - 1.025) < 1e-12);
  assert.equal(lagRoute(false), 'abstain');
  assert.equal(lagRoute(45), 'fallback');
  assert.equal(lagRoute(45.1), 'abstain');
  assert(Math.abs(featureTransfer(0).score - 13 / 60) < 1e-12);
  assert(Math.abs(featureTransfer(7).score - 43 / 150) < 1e-12);
  return true;
}
