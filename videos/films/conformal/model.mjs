import {
  DISPLAY_ORDER,
  RESIDUALS,
  ROUTER,
  SCALES,
  TEST_OUTCOMES,
  TEST_PREDICTIONS,
  TEST_SCALES,
} from './fixtures.mjs';
import { clamp, cueDone, cueProgress, cueStarted, phase } from './construction.mjs';
import assert from 'node:assert/strict';
import { pointAlongPath } from 'vizmatic';
export function correctedThreshold(scores, coverage) {
  assert(scores.length > 0 && scores.every(Number.isFinite));
  assert(coverage > 0 && coverage < 1);
  const rank = Math.ceil((scores.length + 1) * coverage),
    sorted = [...scores].sort((a, b) => a - b);
  return {
    rank,
    threshold: rank > scores.length ? Infinity : sorted[rank - 1],
    index: rank - 1,
  };
}
export function calibrationScoresState(beat, progress) {
  return {
    visibleCount: beat > 0 ? 9 : Math.min(9, Math.floor(9 * phase(progress, 0.02, 0.88))),
    activeIndex: beat > 0 ? null : Math.min(8, Math.floor(9 * phase(progress, 0.02, 0.88))),
  };
}
export function quantileSortState(progress) {
  const order = RESIDUALS.map((value, index) => ({
    value,
    index,
  })).sort((a, b) => a.value - b.value || a.index - b.index);
  return RESIDUALS.map((value, index) => {
    const rank = order.findIndex((x) => x.index === index),
      slot = DISPLAY_ORDER.indexOf(index),
      amount = clamp(clamp(progress) * 9 - rank),
      sourceX = 150 + slot * 180,
      targetX = 150 + rank * 180;
    return {
      index,
      id: `C${index + 1}`,
      value,
      rank: rank + 1,
      amount,
      ...pointAlongPath(
        [
          {
            x: sourceX,
            y: 395,
          },
          {
            x: sourceX,
            y: 560,
          },
          {
            x: targetX,
            y: 560,
          },
          {
            x: targetX,
            y: 735,
          },
        ],
        amount,
      ),
    };
  });
}
export function intervalState(beat, progress, cues) {
  const construction =
    beat > 0 ? 1 : cueProgress(cues, 'interval-endpoints', phase(progress, 0.02, 0.28));
  const future =
    beat === 0
      ? cueStarted(cues, 'interval-miss', progress > 0.84)
        ? 53
        : cueStarted(cues, 'interval-hit', progress > 0.58)
          ? 44
          : null
      : beat === 1
        ? 48
        : null;
  const radius = beat === 2 ? Infinity : 8 * construction;
  return {
    center: 40,
    radius,
    lower: 40 - radius,
    upper: 40 + radius,
    future,
    covered: future === null ? null : Math.abs(future - 40) <= radius,
    complete: construction >= 0.999,
  };
}
export function exchangeabilityState(beat, progress, cues) {
  const n =
    beat < 1
      ? 0
      : beat === 1
        ? Math.min(
            8,
            Math.floor(8 * cueProgress(cues, 'rank-enumerate', phase(progress, 0.01, 0.9))),
          )
        : 8 +
          Math.min(
            2,
            Math.floor(2 * cueProgress(cues, 'rank-last-two', phase(progress, 0.01, 0.67))),
          );
  const cases = Array.from(
    {
      length: 10,
    },
    (_, i) => {
      const future = i + 1,
        calibration = Array.from(
          {
            length: 10,
          },
          (_, j) => j + 1,
        ).filter((v) => v !== future),
        q = correctedThreshold(calibration, 0.8).threshold;
      return {
        future,
        calibration,
        threshold: q,
        covered: future <= q,
        visible: i < n,
      };
    },
  );
  return {
    cases,
    visibleCount: n,
    covered: cases.filter((x) => x.visible && x.covered).length,
    answerVisible: beat === 2 && cueDone(cues, 'rank-count-answer', progress > 0.75),
  };
}
export function classificationSet(probabilities, kind, q) {
  const order = probabilities
    .map((p, label) => ({
      p,
      label,
    }))
    .sort((a, b) => b.p - a.p || a.label - b.label);
  let sum = 0;
  const scores = order.map((item) => ({
    ...item,
    score: (sum += item.p),
  }));
  if (kind === 'softmax') return probabilities.flatMap((p, i) => (1 - p <= q + 1e-12 ? [i] : []));
  if (kind === 'direct') return scores.filter((x) => x.score <= q + 1e-12).map((x) => x.label);
  assert.equal(kind, 'crossing');
  const crossing = scores.findIndex((x) => x.score > q + 1e-12);
  return scores.slice(0, crossing < 0 ? scores.length : crossing + 1).map((x) => x.label);
}
export function routerState(lambda) {
  const accepted = ROUTER.filter((x) => x.score > lambda),
    mistakes = accepted.filter((x) => x.wrong).length;
  return {
    lambda,
    accepted: accepted.map((x) => x.id),
    mistakes,
    joint: mistakes / 9,
    selective: accepted.length ? mistakes / accepted.length : null,
    corrected: (mistakes + 1) / 10,
    passes: (mistakes + 1) / 10 <= 0.25,
  };
}
export function freshDeadlineState(beat, progress, cues) {
  const changed = beat === 2 && cueDone(cues, 'fresh-change-score', progress > 0.3),
    q = changed ? 8 : 7;
  const rankVisible = (beat > 0 && cueDone(cues, 'cf-fresh-rank', progress > 0.12)) || beat > 1,
    intervalVisible = (beat > 0 && cueDone(cues, 'fresh-interval', progress > 0.45)) || beat > 1;
  const outcomeVisible = (beat > 0 && cueDone(cues, 'fresh-outcome', progress > 0.7)) || beat > 1;
  return {
    rank: 18,
    rankVisible,
    threshold: q,
    lower: 52 - q,
    upper: 52 + q,
    width: 2 * q,
    intervalVisible,
    outcomeVisible,
    deadlineVisible:
      beat > 1 || (beat === 1 && cueDone(cues, 'cf-fresh-deadline', progress > 0.86)),
    outcome: 59,
    deadline: 55,
    covered: 59 <= 52 + q,
    meetsDeadline: false,
    changed,
  };
}
export function cumulativeScoreConstruction(probabilities, progress) {
  const ordered = probabilities
    .map((probability, label) => ({
      probability,
      label,
    }))
    .sort((a, b) => b.probability - a.probability || a.label - b.label);
  let prefix = 0;
  return ordered.map((item, rank) => {
    const amount = clamp(progress * ordered.length - rank);
    const score = prefix + item.probability;
    const row = {
      ...item,
      rank,
      prefix,
      score,
      amount,
      current: prefix + item.probability * amount,
      complete: amount === 1,
      visible: amount > 0 || rank === 0,
    };
    prefix = score;
    return row;
  });
}
export function normalizedCalibrationConstruction(progress) {
  return RESIDUALS.map((residual, index) => ({
    id: 'C' + (index + 1),
    index,
    residual,
    scale: SCALES[index],
    score: residual / SCALES[index],
    amount: clamp(progress * RESIDUALS.length - index),
  }));
}
export function normalizedIntervalConstruction(index, progress) {
  const center = TEST_PREDICTIONS[index],
    scale = TEST_SCALES[index];
  const threshold = correctedThreshold(
    RESIDUALS.map((v, i) => v / SCALES[i]),
    0.8,
  ).threshold;
  const radius = threshold * scale * clamp(progress);
  return {
    center,
    scale,
    threshold,
    radius,
    lower: center - radius,
    upper: center + radius,
    outcome: TEST_OUTCOMES[index],
    complete: progress >= 1,
    covered: Math.abs(TEST_OUTCOMES[index] - center) <= radius,
  };
}
export function validateModel() {
  assert.deepEqual(RESIDUALS, [2, 3, 3, 4, 5, 6, 7, 8, 12]);
  assert.deepEqual(correctedThreshold(RESIDUALS, 0.8), {
    rank: 8,
    threshold: 8,
    index: 7,
  });
  assert.equal(correctedThreshold(RESIDUALS, 0.95).threshold, Infinity);
  assert.equal(correctedThreshold(RESIDUALS, 0.9).threshold, 12);
  assert.equal(correctedThreshold(Array(19).fill(1), 0.95).threshold, 1);
  const cases = exchangeabilityState(2, 1);
  assert.equal(cases.covered, 8);
  assert.equal(cases.visibleCount, 10);
  assert.equal(cases.cases[8].threshold, 8);
  for (let p = 0; p <= 1; p += 0.013) {
    const cards = quantileSortState(p);
    assert.equal(new Set(cards.map((x) => x.id)).size, 9);
    assert.deepEqual(
      cards.map((x) => x.value),
      RESIDUALS,
    );
  }
  assert.deepEqual(classificationSet([0.98, 0.01, 0.005, 0.005], 'softmax', 0.4), [0]);
  assert.deepEqual(classificationSet([0.98, 0.01, 0.005, 0.005], 'direct', 0.9), []);
  assert.deepEqual(classificationSet([0.25, 0.25, 0.25, 0.25], 'direct', 0.9), [0, 1, 2]);
  assert.deepEqual(classificationSet([0.25, 0.25, 0.25, 0.25], 'crossing', 0.9), [0, 1, 2, 3]);
  assert.equal(
    correctedThreshold(
      RESIDUALS.map((v, i) => v / SCALES[i]),
      0.8,
    ).threshold,
    2,
  );
  assert.equal(routerState(0.1).mistakes, 2);
  assert.equal(routerState(0.1).passes, false);
  assert.equal(routerState(0.6).mistakes, 1);
  assert.equal(routerState(0.6).accepted.length, 3);
  assert.equal(routerState(0.6).passes, true);
  assert.equal(routerState(1).accepted.length, 0);
  assert.equal(freshDeadlineState(0, 1).intervalVisible, false);
  assert.deepEqual([freshDeadlineState(1, 1).lower, freshDeadlineState(1, 1).upper], [45, 59]);
  assert.deepEqual([freshDeadlineState(2, 1).lower, freshDeadlineState(2, 1).upper], [44, 60]);
  return true;
}
