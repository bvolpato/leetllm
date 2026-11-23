import { erfcPositive, sum } from './arithmetic.mjs';
import { ONLINE_RUBRIC, ids, observedUserRows } from './fixtures.mjs';
import { createCueTrack } from 'vizmatic';
import { createHash } from 'node:crypto';
export const track = (ids) =>
  Object.fromEntries(
    ids.map((id) => [
      id,
      createCueTrack({
        initial: {
          id: id + '-initial',
          snapshot: {
            step: 0,
          },
        },
        cues: [0, 1, 2].map((step) => ({
          id: id + '-' + step,
          beat: step,
          at: 0,
          snapshot: {
            step,
          },
        })),
      }),
    ]),
  );
export const tracks = track(ids);
export function sampleSize(delta) {
  const a = 0.6,
    b = a + delta,
    p = (a + b) / 2,
    n =
      ((1.959963984540054 * Math.sqrt(2 * p * (1 - p)) +
        0.8416212335729143 * Math.sqrt(a * (1 - a) + b * (1 - b))) /
        delta) **
      2;
  return 2 * Math.ceil(n);
}
export function interval(multiplier = 1) {
  const a = 1181 / 1943,
    b = 1325 / 2057,
    d = b - a,
    se = Math.sqrt((a * (1 - a)) / (1943 * multiplier) + (b * (1 - b)) / (2057 * multiplier));
  return {
    a,
    b,
    d,
    se,
    low: d - 1.959963984540054 * se,
    high: d + 1.959963984540054 * se,
  };
}
export function rates(rows) {
  return ['C', 'T'].map((arm) => {
    const selected = rows.filter((r) => r.assigned === arm);
    return {
      arm,
      n: selected.length,
      success: sum(selected.map((r) => r.y)),
      rate: sum(selected.map((r) => r.y)) / selected.length,
    };
  });
}
export function repeatTelemetry(copies) {
  if (!Number.isInteger(copies) || copies < 1)
    throw new RangeError('Telemetry copies must be a positive integer');
  return observedUserRows.flatMap((row) =>
    Array.from(
      {
        length: copies,
      },
      () => ({
        ...row,
      }),
    ),
  );
}
export function userReadout(rows, independent = true) {
  const unique = new Map();
  for (const row of rows) {
    if (!['C', 'T'].includes(row.arm) || ![0, 1].includes(row.y) || typeof row.id !== 'string')
      throw new TypeError('Malformed outcome row');
    const previous = unique.get(row.id);
    if (previous && (previous.arm !== row.arm || previous.y !== row.y))
      throw new Error('Conflicting telemetry for one assigned user');
    unique.set(row.id, row);
  }
  const analysis = independent ? [...unique.values()] : rows,
    arms = ['C', 'T'].map((arm) => {
      const selected = analysis.filter((row) => row.arm === arm);
      if (!selected.length) throw new RangeError('Both arms need observed outcomes');
      return {
        n: selected.length,
        success: sum(selected.map((row) => row.y)),
      };
    });
  const a = arms[0].success / arms[0].n,
    b = arms[1].success / arms[1].n,
    d = b - a,
    se = Math.sqrt((a * (1 - a)) / arms[0].n + (b * (1 - b)) / arms[1].n);
  return {
    a,
    b,
    d,
    se,
    low: d - 1.959963984540054 * se,
    high: d + 1.959963984540054 * se,
    arms,
    uniqueUsers: unique.size,
    rows: rows.length,
  };
}
export const telemetryReadouts = [1, 2, 3].map((copies) => {
  const rows = repeatTelemetry(copies);
  return {
    copies,
    correct: userReadout(rows),
    naive: userReadout(rows, false),
  };
});
export function rubricReadout(count = 5) {
  if (!Number.isInteger(count) || count < 1 || count > 5)
    throw new RangeError('Rubric count must be one through five');
  const rows = ONLINE_RUBRIC.slice(0, count),
    averages = (arm) => [0, 1, 2].map((axis) => sum(rows.map((r) => r[arm][axis])) / rows.length);
  return {
    rows,
    a: averages('a'),
    b: averages('b'),
    count,
  };
}
export function pointEstimate(a = 0.6, b = 0.632) {
  return {
    a,
    b,
    difference: b - a,
    percentagePoints: 100 * (b - a),
    relativePercent: (100 * (b - a)) / a,
  };
}
export function binaryPowerTerms(a = 0.6, delta = 0.05) {
  if (
    typeof a !== 'number' ||
    typeof delta !== 'number' ||
    !Number.isFinite(a) ||
    !Number.isFinite(delta) ||
    a <= 0 ||
    a >= 1 ||
    delta <= 0 ||
    a + delta >= 1 ||
    a + delta === a
  )
    throw new RangeError(
      'Independent binary planning needs a finite distinguishable positive effect inside the unit interval',
    );
  const b = a + delta,
    p = (a + b) / 2,
    nullFactor = Math.sqrt(2 * p * (1 - p)),
    alternativeFactor = Math.sqrt(a * (1 - a) + b * (1 - b)),
    nullTerm = 1.959963984540054 * nullFactor,
    alternativeTerm = 0.8416212335729143 * alternativeFactor,
    numerator = nullTerm + alternativeTerm,
    ratio = numerator / delta,
    raw = ratio ** 2,
    perArm = Math.ceil(raw);
  return {
    a,
    b,
    p,
    delta,
    nullFactor,
    alternativeFactor,
    nullTerm,
    alternativeTerm,
    numerator,
    ratio,
    raw,
    perArm,
    total: 2 * perArm,
    alpha: 0.05,
    power: 0.8,
  };
}
export function adjustedFamily(values) {
  if (
    !Array.isArray(values) ||
    !values.length ||
    values.some((p) => typeof p !== 'number' || !Number.isFinite(p) || p < 0 || p > 1)
  )
    throw new RangeError('Metric family needs valid p-values');
  const n = values.length,
    sorted = values
      .map((p, id) => ({
        id,
        p,
      }))
      .sort((a, b) => a.p - b.p),
    bh = Array(n),
    rankScaled = sorted.map((r, i) => (r.p * n) / (i + 1));
  let running = 1;
  for (let i = n - 1; i >= 0; i--) {
    running = Math.min(running, rankScaled[i]);
    bh[sorted[i].id] = running;
  }
  return {
    raw: [...values],
    sorted: sorted.map((r, i) => ({
      ...r,
      rank: i + 1,
      rankScaled: rankScaled[i],
      adjusted: bh[r.id],
    })),
    bonferroni: values.map((p) => Math.min(1, p * n)),
    bh,
  };
}
export function plannedLooks(values, alpha = 0.05) {
  if (!values.length) throw new RangeError('Look plan must be nonempty');
  const threshold = alpha / values.length,
    index = values.findIndex((v) => v <= threshold);
  return {
    values: [...values],
    threshold,
    first: index < 0 ? null : index + 1,
  };
}
export function assignmentResidual(control, treatment, fraction = 0.5) {
  if (
    !Number.isInteger(control) ||
    !Number.isInteger(treatment) ||
    control < 0 ||
    treatment < 0 ||
    !(fraction > 0 && fraction < 1)
  )
    throw new RangeError('Assignment counts and fraction are invalid');
  const total = control + treatment,
    expected = [total * fraction, total * (1 - fraction)];
  if (Math.min(...expected) < 5) throw new RangeError('Small expected counts require another test');
  const observed = [control, treatment],
    residuals = observed.map((n, i) => n - expected[i]),
    contributions = residuals.map((r, i) => (r * r) / expected[i]),
    chi = sum(contributions);
  return {
    observed,
    expected,
    residuals,
    contributions,
    chi,
    pApprox: chi === 0 ? 1 : erfcPositive(Math.sqrt(chi / 2)),
    diagnostic: chi > 10.827566170662733,
  };
}
export function zeroFailureUpper(n, alpha = 0.05) {
  if (!Number.isInteger(n) || n < 1 || !(alpha > 0 && alpha < 1))
    throw new RangeError('Zero-event bound needs a positive sample count and a valid tail');
  return 1 - alpha ** (1 / n);
}
export class PersistedExperiment {
  constructor() {
    this.assignments = new Map();
  }
  assign(experiment, conversation, fraction) {
    if (
      !experiment ||
      !conversation ||
      typeof fraction !== 'number' ||
      !Number.isFinite(fraction) ||
      fraction < 0 ||
      fraction > 1
    )
      throw new RangeError('Assignment identifiers and enrollment fraction are required');
    const key = JSON.stringify([experiment, conversation]).replace(
        /[\u007f-\uffff]/g,
        (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'),
      ),
      digest = createHash('sha256').update(key).digest(),
      bucket = digest.readBigUInt64BE(0),
      value = Number(bucket) / 2 ** 64;
    if (!this.assignments.has(key))
      this.assignments.set(key, bucket < fraction * 2 ** 64 ? 'T' : 'C');
    return {
      key,
      bucket: bucket.toString(),
      fraction: value,
      assigned: this.assignments.get(key),
      stored: this.assignments.size,
    };
  }
}
export function draftConstruction(a, b, k = 5, ties = ['B', 'A', 'B']) {
  if (!Number.isInteger(k) || k < 0 || [...a, ...b].some((x) => typeof x !== 'string' || !x))
    throw new RangeError('Draft inputs require nonempty IDs and a nonnegative budget');
  const seen = new Set(),
    rows = [],
    owned = {
      A: [],
      B: [],
    };
  let ia = 0,
    ib = 0,
    tie = 0;
  while (ia < a.length && ib < b.length && rows.length < k && a[ia] === b[ib]) {
    const id = a[ia++];
    ib++;
    if (!seen.has(id)) {
      rows.push({
        id,
        owner: null,
        reason: 'shared prefix',
      });
      seen.add(id);
    }
  }
  const take = (team) => {
    const input = team === 'A' ? a : b;
    let index = team === 'A' ? ia : ib;
    while (index < input.length && seen.has(input[index])) index++;
    const id = input[index] ?? null;
    if (team === 'A') ia = id === null ? index : index + 1;
    else ib = id === null ? index : index + 1;
    return id;
  };
  while (rows.length < k) {
    let team =
      owned.A.length < owned.B.length
        ? 'A'
        : owned.B.length < owned.A.length
          ? 'B'
          : ties[tie++ % ties.length];
    let id = take(team);
    if (id === null) {
      team = team === 'A' ? 'B' : 'A';
      id = take(team);
    }
    if (id === null) break;
    seen.add(id);
    owned[team].push(id);
    rows.push({
      id,
      owner: team,
      reason: 'next unseen result',
    });
  }
  return {
    rows,
    owned,
    neutral: rows.filter((r) => r.owner === null).map((r) => r.id),
    indices: {
      A: ia,
      B: ib,
    },
  };
}
export function draftClicks(draft, clicks) {
  return {
    A: clicks.filter((id) => draft.owned.A.includes(id)).length,
    B: clicks.filter((id) => draft.owned.B.includes(id)).length,
    neutral: clicks.filter((id) => draft.neutral.includes(id)).length,
  };
}
export function tokenClocks(arrivals = [300, 340, 380, 500], closure = 560) {
  if (
    !arrivals.length ||
    arrivals.some((v, i) => !Number.isFinite(v) || v < 0 || (i && v < arrivals[i - 1])) ||
    closure < arrivals.at(-1)
  )
    throw new RangeError('Token arrivals must be ordered before closure');
  const gaps = arrivals.slice(1).map((v, i) => v - arrivals[i]);
  return {
    arrivals: [...arrivals],
    ttft: arrivals[0],
    gaps,
    firstToLast: arrivals.at(-1) - arrivals[0],
    tpot: gaps.length ? sum(gaps) / gaps.length : null,
    closure,
    largestGap: gaps.length ? Math.max(...gaps) : null,
  };
}
export function guardrailSequence(
  values,
  { direction = 'max', limit = 3, windows = 2, action = 'pause' } = {},
) {
  let streak = 0;
  return values.map((value, index) => {
    const unavailable = typeof value !== 'number' || !Number.isFinite(value),
      breach = !unavailable && (direction === 'max' ? value > limit : value < limit);
    if (unavailable) streak = 0;
    else streak = breach ? streak + 1 : 0;
    return {
      index,
      value,
      unavailable,
      breach,
      streak,
      recommendation: unavailable
        ? 'pause: telemetry unavailable'
        : streak === windows
          ? action
          : null,
    };
  });
}
export function mixtureReadout(
  weightsA = [200, 800],
  weightsB = [800, 200],
  ratesA = [0.85, 0.7],
  ratesB = [0.8, 0.65],
) {
  const weighted = (weights, rates) => sum(weights.map((w, i) => w * rates[i])) / sum(weights);
  return {
    weightsA: [...weightsA],
    weightsB: [...weightsB],
    ratesA: [...ratesA],
    ratesB: [...ratesB],
    successesA: sum(weightsA.map((w, i) => w * ratesA[i])),
    successesB: sum(weightsB.map((w, i) => w * ratesB[i])),
    a: weighted(weightsA, ratesA),
    b: weighted(weightsB, ratesB),
    standardA: sum(ratesA) / ratesA.length,
    standardB: sum(ratesB) / ratesB.length,
  };
}
export function posteriorCounts(events) {
  const arms = [
    {
      alpha: 1,
      beta: 1,
      pulls: 0,
    },
    {
      alpha: 1,
      beta: 1,
      pulls: 0,
    },
  ];
  for (const { arm, reward } of events) {
    if (
      !Number.isInteger(arm) ||
      arm < 0 ||
      arm > 1 ||
      !Number.isInteger(reward) ||
      ![0, 1].includes(reward)
    )
      throw new RangeError('Observed arm reward is malformed');
    const a = arms[arm];
    a.alpha += reward;
    a.beta += 1 - reward;
    a.pulls++;
  }
  return arms.map((a) => ({
    ...a,
    mean: a.alpha / (a.alpha + a.beta),
    observedSuccesses: a.alpha - 1,
    observedFailures: a.beta - 1,
  }));
}
export function agreementReadout(
  human = ['A', 'B', 'A', 'TIE', 'B', 'A', 'B', 'B'],
  judge = ['A', 'B', 'B', 'TIE', 'B', 'A', 'A', 'B'],
  minimum = 0.8,
) {
  if (!human.length || human.length !== judge.length)
    throw new RangeError('Agreement needs corresponding nonempty labels');
  const matches = human.map((v, i) => v === judge[i]),
    count = matches.filter(Boolean).length;
  return {
    human: [...human],
    judge: [...judge],
    matches,
    count,
    n: human.length,
    agreement: count / human.length,
    minimum,
    pass: count / human.length >= minimum,
  };
}
export function experimentRequirements({
  aSuccess = 600,
  aN = 1000,
  bSuccess = 650,
  bN = 1000,
  safetyLow = -0.03,
  safetyMargin = -0.05,
  times = [3.2, 3.2],
  timeLimit = 3,
  complete = true,
} = {}) {
  const a = aSuccess / aN,
    b = bSuccess / bN,
    d = b - a,
    se = Math.sqrt((a * (1 - a)) / aN + (b * (1 - b)) / bN),
    low = d - 1.959963984540054 * se,
    high = d + 1.959963984540054 * se,
    primary = low > 0,
    safety = safetyLow > safetyMargin,
    absolute = times.every((t) => t <= timeLimit);
  return {
    aSuccess,
    aN,
    bSuccess,
    bN,
    a,
    b,
    d,
    se,
    low,
    high,
    safetyLow,
    safetyMargin,
    times: [...times],
    timeLimit,
    primary,
    safety,
    absolute,
    complete,
    eligible: complete && primary && safety && absolute,
  };
}
