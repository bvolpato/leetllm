import { confusion, f1, lookupAccuracy, mean } from './arithmetic.mjs';
import {
  LEAK_ROWS,
  SELECTOR,
  allFeatures,
  foldScores,
  shiftEnd,
  shiftStart,
  test,
  trainingFeatures,
  users,
  validation,
  openingRecord,
  snapshots,
  retentionDays,
  defaultDays,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
export function readableAt(snapshot) {
  return openingRecord.map((field) => Date.parse(field.observed) <= Date.parse(snapshot));
}
export function openingRule(row) {
  const margin = row.ambiguity - 0.9 * row.policy;
  return { margin, prediction: Number(margin > 0) };
}
export function foldFrame(state) {
  const beat = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0));
  const progress = beat > 0 ? 1 : Math.max(0, Math.min(1, (p - 0.08) / 0.8));
  const completed = Math.min(5, Math.floor(progress * 5 + 1e-9));
  return {
    completed,
    active: Math.min(4, completed),
    fitProgress: completed === 5 ? 1 : progress * 5 - completed,
    scores: foldScores.slice(0, completed),
    mean: completed === 5 ? mean(foldScores) : null,
  };
}
export function pipelineFrame(state) {
  const beat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0));
  const phase =
    beat < 2
      ? 0
      : beat > 2
        ? 1
        : Math.max(0, Math.min(1, (progress - shiftStart) / (shiftEnd - shiftStart)));
  const mix = phase * phase * (3 - 2 * phase);
  const trainingMean = mean(trainingFeatures),
    allMean = mean(allFeatures);
  const origin = trainingMean + (allMean - trainingMean) * mix;
  return {
    trainingMean,
    allMean,
    origin,
    mix,
    transitioning: phase > 0 && phase < 1,
    rows: allFeatures.map((raw, index) => ({
      raw,
      centered: raw - origin,
      heldOut: index === 3,
    })),
  };
}
export function selectorState(global = false) {
  return fitSelector(global ? 8 : 4);
}
export function fitSelector(rowCount) {
  const ids = Array.from({ length: rowCount }, (_, i) => i),
    average = (col, y, rows) =>
      mean(rows.filter((i) => SELECTOR.y[i] === y).map((i) => SELECTOR[col][i])),
    classMeans = Object.fromEntries(
      ['T', 'L'].map((col) => [col, [average(col, 0, ids), average(col, 1, ids)]]),
    ),
    gaps = Object.fromEntries(
      Object.entries(classMeans).map(([col, [zero, one]]) => [col, Math.abs(one - zero)]),
    ),
    selected = gaps.T >= gaps.L ? 'T' : 'L',
    mu = [average(selected, 0, [0, 1, 2, 3]), average(selected, 1, [0, 1, 2, 3])],
    predictions = [4, 5, 6, 7].map((i) =>
      Math.abs(SELECTOR[selected][i] - mu[1]) < Math.abs(SELECTOR[selected][i] - mu[0]) ? 1 : 0,
    );
  return {
    classMeans,
    gaps,
    selected,
    mu,
    predictions,
    correct: predictions.filter((v, i) => v === SELECTOR.y[i + 4]).length,
  };
}
export function oneFoldModel() {
  const training = [
      {
        x: 2,
        y: 0,
      },
      {
        x: 4,
        y: 0,
      },
      {
        x: 8,
        y: 1,
      },
      {
        x: 10,
        y: 1,
      },
    ],
    held = [
      {
        x: 3,
        y: 0,
      },
      {
        x: 7,
        y: 1,
      },
      {
        x: 9,
        y: 0,
      },
      {
        x: 5,
        y: 1,
      },
    ],
    center = mean(training.map((r) => r.x)),
    means = [0, 1].map((y) => mean(training.filter((r) => r.y === y).map((r) => r.x - center)));
  const predictions = held.map((r) =>
      Math.abs(r.x - center - means[1]) < Math.abs(r.x - center - means[0]) ? 1 : 0,
    ),
    counts = held.reduce(
      (a, r, i) => {
        a[predictions[i] ? (r.y ? 'tp' : 'fp') : r.y ? 'fn' : 'tn']++;
        return a;
      },
      {
        tp: 0,
        fp: 0,
        fn: 0,
        tn: 0,
      },
    );
  return {
    training,
    held,
    center,
    means,
    predictions,
    counts,
    f1: f1(counts),
  };
}
export function availableHistory() {
  const decision = Date.parse('2026-07-01T00:05:00Z'),
    start = decision - 7 * 86400000,
    events = [
      ['2026-06-29T10:00:00Z', '2026-06-29T10:00:01Z'],
      ['2026-06-30T10:00:00Z', '2026-06-30T10:00:01Z'],
      ['2026-06-30T18:00:00Z', '2026-07-01T12:00:00Z'],
    ].map(([event, observed], i) => ({
      id: 'e' + i,
      event: Date.parse(event),
      observed: Date.parse(observed),
    }));
  return {
    decision,
    events,
    naive: events.filter((e) => start <= e.event && e.event < decision).length,
    ready: events.filter((e) => start <= e.event && e.event < decision && e.observed <= decision)
      .length,
  };
}
export function sourceLookup(tuned = false, source = 'C') {
  const memory = tuned ? new Map([['C', retentionDays.C]]) : new Map();
  const prediction = memory.get(source) ?? defaultDays;
  const truth = retentionDays[source];
  return {
    source,
    truth,
    prediction,
    correct: prediction === truth,
    seen: memory.has(source),
  };
}
export function validateModel() {
  assert.deepEqual(readableAt(snapshots[0]), [true, true, false, false]);
  assert.deepEqual(readableAt(snapshots[2]), [true, true, true, true]);
  assert.deepEqual(
    LEAK_ROWS.filter((row) => openingRule(row).prediction !== row.y).map((row) => row.id),
    ['r6', 'r7'],
  );
  assert.equal(mean([2, 4, 6]), 4);
  assert.equal(mean([2, 4, 6, 20]), 8);
  assert.equal(f1(confusion(validation, 0.5)), 1);
  assert.equal(f1(confusion(test, 0.5)), 2 / 3);
  assert.equal(lookupAccuracy(users, users), 1);
  assert.equal(lookupAccuracy(users.slice(0, 4), users.slice(4)), 0.5);
  assert.ok(Math.abs(mean(foldScores) - 0.708) < 1e-12);
  assert.deepEqual(
    [0, 1, 2, 3, 4].map(
      (i) =>
        foldFrame({
          beat: 0,
          beatP: 0.08 + (i + 0.5) * 0.16,
        }).active,
    ),
    [0, 1, 2, 3, 4],
  );
  for (let i = 0; i < 5; i++) {
    const frame = foldFrame({
      beat: 0,
      beatP: 0.08 + (i + 0.5) * 0.16,
    });
    assert.equal(frame.completed, i);
    assert.equal(frame.mean, null);
  }
  assert.equal(
    foldFrame({
      beat: 0,
      beatP: 0.9,
    }).completed,
    5,
  );
  assert.equal(
    foldFrame({
      beat: 1,
      beatP: 0,
    }).mean,
    0.708,
  );
  for (const beat of [0, 1])
    for (const beatP of [0, 0.25, 0.5, 0.98]) {
      const frame = pipelineFrame({
        beat,
        beatP,
      });
      assert.equal(frame.origin, 4);
      assert.equal(frame.transitioning, false);
      assert.deepEqual(
        frame.rows.map((row) => row.centered),
        [-2, 0, 2, 16],
      );
    }
  assert.equal(
    pipelineFrame({
      beat: 2,
      beatP: shiftStart,
    }).origin,
    4,
  );
  const moving = pipelineFrame({
    beat: 2,
    beatP: (shiftStart + shiftEnd) / 2,
  });
  assert.equal(moving.transitioning, true);
  assert(Math.abs(moving.origin - 6) < 1e-12);
  for (const beatP of [shiftEnd, 0.75, 0.98]) {
    const frame = pipelineFrame({
      beat: 2,
      beatP,
    });
    assert.equal(frame.origin, 8);
    assert.equal(frame.transitioning, false);
    assert.deepEqual(
      frame.rows.map((row) => row.centered),
      [-6, -4, -2, 12],
    );
  }
  for (const beatP of [0, 0.25, 0.4, 0.45, 0.6, 0.98]) {
    const frame = pipelineFrame({
      beat: 2,
      beatP,
    });
    assert.equal(frame.trainingMean, 4);
    assert.equal(frame.allMean, 8);
    for (const row of frame.rows) assert(Math.abs(row.centered + frame.origin - row.raw) < 1e-12);
  }
  assert.equal(selectorState().correct, 2);
  assert.equal(selectorState(true).correct, 4);
  assert.deepEqual(selectorState().gaps, { T: 1, L: 0.5 });
  assert.deepEqual(selectorState(true).gaps, { T: 0.5, L: 0.75 });
  assert.equal(oneFoldModel().f1, 0.5);
  assert.equal(availableHistory().naive, 3);
  assert.equal(availableHistory().ready, 2);
  assert.equal(sourceLookup().prediction, 30);
  assert.equal(sourceLookup(true).prediction, 7);
  assert.equal(sourceLookup(true, 'D').seen, false);
  assert.equal(sourceLookup(true, 'D').correct, true);
  return true;
}
