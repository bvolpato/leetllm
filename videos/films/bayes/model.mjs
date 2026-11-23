import {
  area,
  betaDensity,
  betaQuantile,
  betaTailProbability,
  integrate,
  logFact,
  rootOnBranch,
} from './arithmetic.mjs';
import { lastEvaluation, releasePolicy, validationOutcomes } from './fixtures.mjs';
import { clauseEnded, done, event, phase } from './construction.mjs';
export function updateSnapshot(beat, p, cues) {
  const progress = (id) =>
    cues?.[id]
      ? cues[id].phase === 'before'
        ? 0
        : cues[id].phase === 'after'
          ? 1
          : cues[id].progress
      : null;
  const passProgress =
    beat > 1 ? 1 : beat < 1 ? 0 : (progress('posterior-pass-arrivals') ?? phase(p, 0.08, 0.62));
  const failureProgress =
    beat > 1 ? 1 : beat < 1 ? 0 : (progress('posterior-failure-arrivals') ?? phase(p, 0.67, 0.9));
  const passes = Math.floor(8 * passProgress + 1e-9),
    fails = passes === 8 ? Math.floor(2 * failureProgress + 1e-9) : 0;
  return {
    passes,
    fails,
    processed: passes + fails,
    a: 2 + passes,
    b: 2 + fails,
    complete: passes + fails === 10,
    passProgress,
    failureProgress,
  };
}
export function priorIntervalSnapshot(beat, progress) {
  const q = Math.max(0, Math.min(1, progress));
  const low = beat < 2 ? 0.45 : 0.6 - 0.15 * (1 - q),
    high = beat < 2 ? 0.45 + 0.3 * q : 0.6 + 0.15 * (1 - q);
  return {
    low,
    high,
    width: high - low,
    probability: area(2, 2, low, high),
    point: 0.6,
    density: betaDensity(2, 2, 0.6),
  };
}
export function predictiveCountDistribution(n = 5, a = 10, b = 4) {
  const logBeta = (x, y) => logFact(x - 1) + logFact(y - 1) - logFact(x + y - 1);
  return Array.from(
    {
      length: n + 1,
    },
    (_, passes) => ({
      passes,
      probability: Math.exp(
        logFact(n) -
          logFact(passes) -
          logFact(n - passes) +
          logBeta(a + passes, b + n - passes) -
          logBeta(a, b),
      ),
    }),
  );
}
export function alternativeSample(p) {
  const total = 10 + 5 * Math.round(18 * phase(p, 0.08, 0.86)),
    passes = total * 0.8;
  return {
    total,
    passes,
    failures: total - passes,
    a: 2 + passes,
    b: 2 + total - passes,
  };
}
export function evidenceSnapshot(beat, progress) {
  const q = Math.max(0, Math.min(1, progress)),
    included = beat === 0 ? q / 2 : beat === 1 ? 0.5 + q / 2 : 1;
  const total = 10 + 5 * Math.round(18 * included),
    passes = total * 0.8,
    a = 2 + passes,
    b = 2 + total - passes;
  return {
    total,
    passes,
    failures: total - passes,
    a,
    b,
    threshold: 0.7,
    referenceTail: betaTailProbability(10, 4),
    tail: betaTailProbability(a, b),
    complete: total === 100,
  };
}
export function predictiveSnapshot(beat, p) {
  const progress = phase(p, 0.04, 0.24),
    assimilated = beat === 1 && progress === 1,
    a = assimilated ? 11 : 10,
    b = 4;
  return {
    progress,
    assimilated,
    a,
    b,
    forecast: a / (a + b),
    originalForecast: 10 / 14,
    bothPass: (10 * 11) / (14 * 15),
    frozenMeanSquared: (10 / 14) ** 2,
    variance: 40 / (14 ** 2 * 15),
  };
}
export function productSnapshot(progress) {
  const candidate = 0.7,
    prior = betaDensity(2, 2, candidate),
    likelihood = candidate ** 8 * (1 - candidate) ** 2;
  const evidence = 6 / 2860,
    raw = prior * likelihood;
  return {
    candidate,
    prior,
    likelihood,
    raw,
    evidence,
    posterior: raw / evidence,
    normalized: progress >= 0.64,
  };
}
export function frozenCountDistribution(n = 5, p = 10 / 14) {
  return Array.from(
    {
      length: n + 1,
    },
    (_, passes) => ({
      passes,
      probability:
        Math.exp(logFact(n) - logFact(passes) - logFact(n - passes)) *
        p ** passes *
        (1 - p) ** (n - passes),
    }),
  );
}
export function likelihoodFrame(state) {
  const passProgress = event(state, 0, 'likelihood-pass-arrivals'),
    failureProgress = event(state, 1, 'likelihood-failure-arrivals');
  const passes = Math.floor(8 * passProgress + 1e-9),
    fails = passes === 8 ? Math.floor(2 * failureProgress + 1e-9) : 0;
  return {
    passes,
    fails,
    processed: passes + fails,
    passProgress,
    failureProgress,
    countFactor: event(state, 2, 'count-arrangements'),
    cancel: event(state, 2, 'cancel-common-factor'),
  };
}
export function productFrame(state) {
  const candidate = 0.2 + 0.6 * event(state, 0, 'same-rate-probe'),
    normalization = event(state, 0, 'normalize-product'),
    evidence = 6 / 2860,
    scale = 1 + (1 / evidence - 1) * normalization;
  const prior = betaDensity(2, 2, candidate),
    likelihood = candidate ** 8 * (1 - candidate) ** 2,
    raw = prior * likelihood;
  return {
    candidate,
    normalization,
    evidence,
    scale,
    area: evidence * scale,
    prior,
    likelihood,
    raw,
    current: raw * scale,
  };
}
export function predictiveFrame(state) {
  const sweep = event(state, 0, 'weighted-contribution'),
    arrival = event(state, 1, 'new-pass-arrival'),
    recorded = done(arrival),
    a = (state.beat ?? 0) === 1 && recorded ? 11 : 10;
  return {
    sweep,
    arrival,
    recorded,
    a,
    b: 4,
    forecast: a / (a + 4),
    integral: integrate((x) => x * betaDensity(10, 4, x), 0, sweep),
    joint: [10 * 11, 10 * 4, 4 * 10, 4 * 5].map((v) => v / (14 * 15)),
    frozen: (10 / 14) ** 2,
    jointReveal: event(state, 2, 'two-pass-path'),
  };
}
export function countFrame(state) {
  const orders = [
    'four-pass-count',
    'second-position',
    'third-position',
    'fourth-position',
    'fifth-position',
  ].filter((id, index) => clauseEnded(state, 3, id, [0.08, 0.18, 0.24, 0.27, 0.3][index])).length;
  const build = event(state, 2, 'count-build', 0.12, 0.55),
    five = event(state, 3, 'five-pass-count', 0.73, 0.9);
  return {
    orders,
    five,
    visible: Math.min(4, Math.floor(4 * build + 1e-9)),
    rows: predictiveCountDistribution(),
    frozen: frozenCountDistribution(),
    comparison: event(state, 4, 'retain-rate-uncertainty'),
  };
}
export function credibleRangeFrame(state) {
  const progress = event(state, 1, 'credible-range'),
    tail = (1 - 0.9 * progress) / 2;
  return {
    progress,
    tail,
    low: betaQuantile(10, 4, tail),
    high: betaQuantile(10, 4, 1 - tail),
    area: 0.9 * progress,
    complete: done(progress),
  };
}
export function sensitivityFrame(state) {
  const p = event(state, 1, 'same-data-three-priors'),
    processed = Math.min(10, Math.floor(10 * p + 1e-9)),
    passes = Math.min(8, processed),
    fails = Math.max(0, processed - 8);
  return {
    processed,
    passes,
    fails,
    cases: [
      [1, 1],
      [2, 2],
      [20, 20],
    ].map(([a, b]) => ({
      prior: [a, b],
      a: a + passes,
      b: b + fails,
      mean: (a + passes) / (a + b + processed),
      tail: betaTailProbability(a + passes, b + fails),
    })),
  };
}
export const familyTailCache = new Map();
export const familyPdfCache = new Map();
export function familyTail(weight = 0.2, threshold = 0.7) {
  const key = weight + ':' + threshold;
  if (familyTailCache.has(key)) return familyTailCache.get(key);
  const tail =
    weight === 0
      ? betaTailProbability(10, 14, threshold)
      : weight === 1
        ? betaTailProbability(74, 10, threshold)
        : integrate(
            (x) =>
              betaDensity(74, 10, x) *
              betaTailProbability(10, 14, (threshold - weight * x) / (1 - weight)),
          );
  familyTailCache.set(key, tail);
  return tail;
}
export function familyDensity(rate, weight = 0.2) {
  const key = rate + ':' + weight;
  if (familyPdfCache.has(key)) return familyPdfCache.get(key);
  const value =
    weight === 0
      ? betaDensity(10, 14, rate)
      : weight === 1
        ? betaDensity(74, 10, rate)
        : integrate(
            (x) =>
              (betaDensity(74, 10, x) * betaDensity(10, 14, (rate - weight * x) / (1 - weight))) /
              (1 - weight),
          );
  familyPdfCache.set(key, value);
  return value;
}
export function jointContours() {
  const e = 73 / 82,
    h = 9 / 22,
    peakE = betaDensity(74, 10, e),
    peakH = betaDensity(10, 14, h);
  return [0.04, 0.12, 0.3, 0.6, 0.9].map((fraction) => {
    const level = peakE * peakH * fraction,
      minE = rootOnBranch((x) => betaDensity(74, 10, x), level / peakH, 0, e, true),
      maxE = rootOnBranch((x) => betaDensity(74, 10, x), level / peakH, e, 1, false);
    const lower = [],
      upper = [];
    for (let i = 0; i <= 90; i++) {
      const x = minE + ((maxE - minE) * i) / 90,
        target = level / betaDensity(74, 10, x);
      lower.push({
        x,
        y: rootOnBranch((y) => betaDensity(10, 14, y), target, 0, h, true),
      });
      upper.push({
        x,
        y: rootOnBranch((y) => betaDensity(10, 14, y), target, h, 1, false),
      });
    }
    return {
      fraction,
      level,
      points: [...lower, ...upper.reverse(), lower[0]],
    };
  });
}
export function passingRegion(weight, threshold = 0.7) {
  const polygon = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    result = [];
  for (let i = 0; i < 4; i++) {
    const a = polygon[i],
      b = polygon[(i + 1) % 4],
      da = weight * a[0] + (1 - weight) * a[1] - threshold,
      db = weight * b[0] + (1 - weight) * b[1] - threshold;
    if (da >= 0)
      result.push({
        x: a[0],
        y: a[1],
      });
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db);
      result.push({
        x: a[0] + t * (b[0] - a[0]),
        y: a[1] + t * (b[1] - a[1]),
      });
    }
  }
  return result;
}
export function populationFrame(state) {
  const progress = event(state, 1, 'change-traffic-mix'),
    weight = 0.8 - 0.6 * progress;
  return {
    progress,
    weight,
    mean: (weight * 74) / 84 + ((1 - weight) * 10) / 24,
    tail: familyTail(weight),
    complete: done(progress),
  };
}
export function calibrationFrame(state) {
  const progress = event(state, 0, 'reveal-validation-outcomes', 0.42, 0.7),
    processed = Math.min(100, Math.floor(100 * progress + 1e-9)),
    prefix = validationOutcomes.slice(0, processed);
  let passes = 0;
  const points = prefix.map((row, i) => {
    passes += Number(row.pass);
    return {
      x: i + 1,
      y: passes / (i + 1),
    };
  });
  return {
    progress,
    processed,
    passes,
    points,
    forecast: 10 / 14,
  };
}
export function releaseCases() {
  return [
    {
      id: 'ten',
      title: '10 comparable tasks',
      observed: '8 / 10',
      model: 'Beta(10,4)',
      tail: betaTailProbability(10, 4),
    },
    {
      id: 'hundred',
      title: '100 comparable tasks',
      observed: '80 / 100',
      model: 'Beta(82,22)',
      tail: betaTailProbability(82, 22),
    },
    {
      id: 'changed-mix',
      title: 'Deployment is mostly hard',
      observed: 'Same family evidence',
      model: 'Two-family weighted posterior',
      tail: familyTail(0.2),
    },
  ].map((row) => ({
    ...row,
    meetsRule: row.tail >= 0.95,
  }));
}
export const contourData = jointContours();

function lastTaskPosterior(extraPasses, extraFailures) {
  const { passes, failures, priorA, priorB } = lastEvaluation;
  const a = priorA + passes + extraPasses;
  const b = priorB + failures + extraFailures;
  return { a, b, tail: betaTailProbability(a, b, releasePolicy.rateCutoff) };
}

export const lastTaskCases = {
  sealed: lastTaskPosterior(0, 0),
  pass: lastTaskPosterior(1, 0),
  fail: lastTaskPosterior(0, 1),
};
