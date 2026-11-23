import {
  FIT_ROWS,
  actual,
  baseline,
  candidate,
  forecastWeights,
  fridayFeatures,
  lossDomain,
  transferActuals,
  transferCapacities,
  transferForecasts,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createCueTrack } from 'vizmatic';
export const track = createCueTrack({
  initial: {
    id: 'issued',
    snapshot: 0,
  },
  cues: [
    {
      id: 'observed',
      beat: 1,
      at: 0,
      snapshot: 1,
    },
  ],
});
export const clip = (p) => Math.max(0, Math.min(1, p));
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export const capacity = actual.map((_, i) => (i % 7 === 2 ? 140 : 150));
export function metrics(n) {
  const errors = candidate.slice(0, n).map((v, i) => Math.abs(v - actual[i]));
  const baselineErrors = baseline.slice(0, n).map((v, i) => Math.abs(v - actual[i]));
  return {
    n,
    candidateSum: sum(errors),
    baselineSum: sum(baselineErrors),
    mae: n ? sum(errors) / n : null,
    baseline: n ? sum(baselineErrors) / n : null,
    inside: errors.filter((v) => v <= 6).length,
    tp: 0,
    fp: 0,
    fn: 0,
  };
}
export function peakDiagnostic(n = actual.length) {
  const rows = actual.slice(0, n).flatMap((observed, index) =>
    observed >= 150
      ? [
          {
            index,
            date: `Feb ${index + 2}`,
            actual: observed,
            candidate: candidate[index],
            baseline: baseline[index],
            candidateShortfall: Math.max(observed - candidate[index], 0),
            baselineShortfall: Math.max(observed - baseline[index], 0),
            candidateUnits: 3 * Math.max(observed - candidate[index], 0),
            baselineUnits: 3 * Math.max(observed - baseline[index], 0),
          },
        ]
      : [],
  );
  return {
    rows,
    candidateUnits: n ? sum(rows.map((row) => row.candidateUnits)) : null,
    baselineUnits: n ? sum(rows.map((row) => row.baselineUnits)) : null,
  };
}
export function signalCounts(n = candidate.length) {
  return candidate.slice(0, n).reduce(
    (a, v, i) => {
      const predicted = v > capacity[i],
        observed = actual[i] > capacity[i];
      a[predicted ? (observed ? 'tp' : 'fp') : observed ? 'fn' : 'tn']++;
      return a;
    },
    {
      tp: 0,
      fp: 0,
      fn: 0,
      tn: 0,
    },
  );
}
export function capacityLoss(a) {
  return sum(
    [100, 160, 240].map(
      (y, i) => [0.55, 0.25, 0.2][i] * (3 * Math.max(y - a, 0) + Math.max(a - y, 0)),
    ),
  );
}
export function capacityBreakdown(a) {
  return [100, 160, 240].map((demand, i) => {
    const shortage = Math.max(demand - a, 0),
      spare = Math.max(a - demand, 0),
      probability = [0.55, 0.25, 0.2][i];
    return {
      demand,
      shortage,
      spare,
      probability,
      contribution: probability * (3 * shortage + spare),
    };
  });
}
export function capacityCurve() {
  return Array.from(
    {
      length: 91,
    },
    (_, i) => ({
      x: 80 + 2 * i,
      y: capacityLoss(80 + 2 * i),
    }),
  );
}
export function sampleModel(id, state) {
  const b = track.sample(state).snapshot,
    p = clip(((state.beatP ?? 0) - 0.08) / 0.7),
    n = b ? 14 : Math.floor(14 * p);
  const inspected = id === 'signals' ? (b ? 14 : n) : 14;
  const advance = state.cues?.['origins-b1-2'];
  const originProgress = advance
    ? advance.phase === 'before'
      ? 0
      : advance.phase === 'after'
        ? 1
        : clip(advance.progress)
    : b
      ? 1
      : p;
  const originTrainingDays = originProgress === 0 ? 62 : originProgress === 1 ? 68 : null;
  return {
    b,
    p,
    n,
    originDay: 1 + 7 * originProgress,
    originProgress,
    originTrainingDays,
    baselineSearch: b ? p : 0,
    ...metrics(n),
    inspected,
    signals: signalCounts(inspected),
  };
}
export function validateModel() {
  validateForecastChapters();
  for (let n = 1; n <= 14; n++) {
    const m = metrics(n);
    assert.equal(m.candidateSum / n, m.mae);
    assert.equal(m.baselineSum / n, m.baseline);
  }
  const peak = peakDiagnostic();
  assert.deepEqual(
    peak.rows.map((row) => row.index),
    [4, 8, 11],
  );
  assert.equal(peak.baselineUnits, 201);
  assert(Math.abs(peak.candidateUnits - 142.7336988065635) < 1e-8);
  assert.equal(peak.rows[2].candidateUnits, 0);
  assert.equal(peak.rows[2].baselineUnits, 0);
  assert.equal(peakDiagnostic(0).candidateUnits, null);
  assert.equal(peakDiagnostic(4).candidateUnits, 0);
  assert.equal(metrics(0).mae, null);
  assert.deepEqual(signalCounts(0), {
    tp: 0,
    fp: 0,
    fn: 0,
    tn: 0,
  });
  assert.equal(sum(Object.values(signalCounts(5))), 5);
  assert.equal(sum(capacityBreakdown(160).map((v) => v.contribution)), capacityLoss(160));
  assert.equal(metrics(14).inside, 11);
  assert(Math.abs(metrics(14).mae - 6.253526690917234) < 1e-6);
  assert.deepEqual(signalCounts(), {
    tp: 2,
    fp: 1,
    fn: 1,
    tn: 10,
  });
  assert(capacityLoss(160) < capacityLoss(100));
  assert.equal(capacityCurve()[0].y, 189);
  assert(capacityCurve().every((point) => point.y >= lossDomain[0] && point.y < lossDomain[1]));
  assert(candidate[4] > 150 && actual[4] > candidate[4] + 6);
  assert.equal(
    sampleModel('origins', {
      beat: 0,
      beatP: 0.02,
    }).originDay,
    1,
  );
  assert(
    sampleModel('origins', {
      beat: 0,
      beatP: 0.5,
    }).originDay > 1,
  );
  assert.equal(
    sampleModel('origins', {
      beat: 1,
      beatP: 0,
    }).originDay,
    8,
  );
  assert.equal(
    sampleModel('origins', {
      beat: 0,
      beatP: 0.9,
      cues: {
        'origins-b1-2': {
          phase: 'before',
          progress: 0,
        },
      },
    }).originDay,
    1,
  );
  assert.equal(
    sampleModel('origins', {
      beat: 0,
      beatP: 0.9,
      cues: {
        'origins-b1-2': {
          phase: 'active',
          progress: 0.5,
        },
      },
    }).originTrainingDays,
    null,
  );
  assert.equal(
    sampleModel('origins', {
      beat: 1,
      beatP: 0,
      cues: {
        'origins-b1-2': {
          phase: 'after',
          progress: 1,
        },
      },
    }).originTrainingDays,
    68,
  );
  assert.equal(
    sampleModel('baseline', {
      beat: 0,
      beatP: 0.88,
    }).baselineSearch,
    0,
  );
  assert.equal(
    sampleModel('baseline', {
      beat: 1,
      beatP: 0.88,
    }).baselineSearch,
    1,
  );
  return true;
}
export const rowDigest = (value) =>
  createHash('sha256')
    .update(
      JSON.stringify({
        entity: 'FC-A',
        tier: 'standard',
        issuedAt: '2026-02-01T08:00:00+00:00',
        target: '2026-02-06',
        candidate: value,
      }),
    )
    .digest('hex');
export const CHAPTERS = new Set([
  'forecast-contract',
  'cost-quantile',
  'fit-construction',
  'ledger-contract',
  'evaluation-contract',
  'receipt-contract',
  'monitoring-contract',
  'failure-construction',
  'earned-forecast-transfer',
]);
export function featureProducts(x = fridayFeatures, w = forecastWeights) {
  assert.equal(x.length, w.length);
  const terms = x.map((v, i) => v * w[i]);
  return {
    terms,
    raw: sum(terms),
    forecast: Math.max(0, sum(terms)),
  };
}
export function quantileCost(
  a,
  under = 3,
  over = 1,
  scenarios = [
    [100, 0.55],
    [160, 0.25],
    [240, 0.2],
  ],
) {
  return scenarios.map(([demand, probability]) => ({
    demand,
    probability,
    short: Math.max(demand - a, 0),
    spare: Math.max(a - demand, 0),
    term: probability * (under * Math.max(demand - a, 0) + over * Math.max(a - demand, 0)),
  }));
}
export function lateLabelMetrics(indices) {
  const errors = indices.map((i) => Math.abs(transferActuals[i] - transferForecasts[i])),
    confusion = {
      tp: 0,
      fp: 0,
      fn: 0,
      tn: 0,
    };
  for (const i of indices) {
    const p = transferForecasts[i] > transferCapacities[i],
      y = transferActuals[i] > transferCapacities[i];
    confusion[p ? (y ? 'tp' : 'fp') : y ? 'fn' : 'tn']++;
  }
  return {
    n: indices.length,
    pending: 3 - indices.length,
    mae: indices.length ? sum(errors) / indices.length : null,
    inside: errors.filter((e) => e <= 6).length,
    confusion,
    precision: confusion.tp + confusion.fp ? confusion.tp / (confusion.tp + confusion.fp) : null,
    recall: confusion.tp + confusion.fn ? confusion.tp / (confusion.tp + confusion.fn) : null,
    peak: indices.length
      ? sum(
          indices.map((i) =>
            transferActuals[i] >= 150
              ? 3 * Math.max(transferActuals[i] - transferForecasts[i], 0)
              : 0,
          ),
        )
      : null,
  };
}
export function forecastChapterState(state = {}) {
  const b = state.beat ?? 0,
    p = clip(state.beatP ?? 0),
    progress = (id) => state.cues?.[id]?.progress ?? (state.cues ? 0 : p),
    started = (id) =>
      state.cues?.[id] ? state.cues[id].phase !== 'before' : !state.cues && p > 0.25,
    completed = (id) =>
      state.cues?.[id] ? state.cues[id].phase === 'after' : !state.cues && p >= 0.95;
  return {
    b,
    p,
    progress,
    started,
    completed,
    freshPartial: b > 1 || (b === 1 && completed('forecast-fresh-partial')),
    freshArrived: b > 2 || (b === 2 && completed('forecast-fresh-arrive')),
    freshMean: b > 2 || (b === 2 && completed('forecast-fresh-mean')),
    freshRecall: b > 2 || (b === 2 && completed('forecast-fresh-recall')),
  };
}
export function forecastComparison(
  fraction = 11 / 14,
  mae = metrics(14).mae,
  peak = peakDiagnostic().candidateUnits,
) {
  const perfect = mae === 0 && peak === 0 && fraction === 1,
    forecasts = perfect ? actual : candidate,
    counts = forecasts.reduce(
      (c, v, i) => {
        const signal = v > capacity[i],
          overload = actual[i] > capacity[i];
        c[signal ? (overload ? 'tp' : 'fp') : overload ? 'fn' : 'tn']++;
        return c;
      },
      {
        tp: 0,
        fp: 0,
        fn: 0,
        tn: 0,
      },
    ),
    precision = counts.tp / (counts.tp + counts.fp),
    recall = counts.tp / (counts.tp + counts.fn);
  const gates = {
    complete: true,
    mae: mae < metrics(14).baseline,
    peak: peak < peakDiagnostic().baselineUnits,
    tolerance: fraction >= 0.85,
    precision: precision >= 0.6,
    recall: recall >= 0.6,
    previous: true,
  };
  return {
    gates,
    counts,
    precision,
    recall,
    comparisonPass: Object.values(gates).every(Boolean),
    decision: 'hold',
    reason: 'synthetic_fixture_only',
    liveReady: false,
  };
}
export function validateForecastChapters() {
  assert.equal(FIT_ROWS.length, 62);
  const result = featureProducts();
  assert(Math.abs(result.forecast - candidate[4]) < 1e-10);
  for (let j = 0; j < 9; j++) {
    const derivative = FIT_ROWS.reduce(
      (sum, r) => sum + r.x[j] * (sumProducts(r.x, forecastWeights) - r.y),
      0,
    );
    assert(Math.abs(derivative) < 1e-7);
  }
  assert.equal(sum(quantileCost(160).map((v) => v.term)), 81);
  assert.equal(lateLabelMetrics([0, 2]).mae, 0.5);
  assert.equal(lateLabelMetrics([0, 1, 2]).recall, 0.5);
  assert.equal(lateLabelMetrics([0, 1, 2]).mae, 8 / 3);
  assert.equal(forecastComparison().comparisonPass, false);
  assert.equal(forecastComparison(1, 0, 0).comparisonPass, true);
  assert.equal(forecastComparison(1, 0, 0).liveReady, false);
  assert.notEqual(rowDigest(176), rowDigest(result.forecast));
}
export const sumProducts = (x, w) => sum(x.map((v, i) => v * w[i]));
