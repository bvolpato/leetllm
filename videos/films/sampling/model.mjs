import { average, normalCdf, normalQuantile } from './arithmetic.mjs';
import { parameters } from './fixtures.mjs';
import { cohort } from './cohort.mjs';
import { begun, cueStep, directed, smooth } from './construction.mjs';
import { seededRandom } from 'vizmatic';
export const durationFromRank = (u, sigma = parameters.sigma) =>
  6 * Math.exp(sigma * normalQuantile(u));
export const durationCdf = (t, sigma = parameters.sigma) =>
  t <= 0 ? 0 : normalCdf(Math.log(t / 6) / sigma);
export const durationDensity = (t, sigma = parameters.sigma) =>
  t <= 0
    ? 0
    : Math.exp(-0.5 * (Math.log(t / 6) / sigma) ** 2) / (t * sigma * Math.sqrt(2 * Math.PI));
export const lateProbability = 1 - durationCdf(parameters.deadline);
export const makeStream = (seed) => {
  const random = seededRandom(seed);
  return Array.from(
    {
      length: 10000,
    },
    () => {
      let u = random();
      while (u === 0) u = random();
      return u;
    },
  );
};
export const streams = Array.from(
  {
    length: 32,
  },
  (_, i) => makeStream(parameters.seed + 7919 * i),
);
export const latePrefixes = streams.map((stream) => {
  const counts = [0];
  stream.forEach((u) => counts.push(counts.at(-1) + Number(u > durationCdf(10))));
  return counts;
});
export const requests = streams[0].slice(0, 20).map((u, i, prefix) => {
  const seconds = durationFromRank(u),
    bin = Math.min(14, Math.floor(seconds / 2));
  return {
    id: i + 1,
    u,
    seconds,
    late: seconds > 10,
    bin,
    stack: prefix
      .slice(0, i)
      .filter((previous) => Math.min(14, Math.floor(durationFromRank(previous) / 2)) === bin)
      .length,
  };
});
export function inverseFrame(state) {
  const beat = state.beat ?? 0;
  const rankVisible = beat > 0 || begun(state, 'rank-quarter', 0.65);
  const tail = beat === 2 && begun(state, 'rank-tail', 0.05);
  const rank = tail ? 0.95 : 0.25;
  const progress =
    beat === 0
      ? 0
      : beat === 1
        ? directed(state, 'inverse-quarter', 0.08, 0.45)
        : tail
          ? directed(state, 'inverse-tail', 0.3, 0.55)
          : 1;
  return {
    rank,
    rankVisible,
    progress,
    seconds: durationFromRank(rank),
    resultKnown: progress === 1,
    recipe: beat > 1 || (beat === 1 && begun(state, 'inverse-recipe', 0.65)),
  };
}
export function sampleFrame(state) {
  const beat = state.beat ?? 0;
  const amount =
    beat === 0
      ? 5 * directed(state, 'sample-five', 0.55, 0.85)
      : beat === 1
        ? 5 + 15 * directed(state, 'sample-twenty', 0.05, 0.28)
        : 20;
  const n = Math.min(20, Math.floor(amount + 1e-9)),
    fraction = amount - n;
  const landed = requests.slice(0, n),
    moving =
      n < 20 && fraction > 0
        ? {
            ...requests[n],
            progress: smooth(fraction),
          }
        : null;
  const late = landed.filter((row) => row.late).length;
  return {
    n,
    landed,
    moving,
    late,
    rate: n ? late / n : null,
  };
}
export function batchFrame(state) {
  const beat = state.beat ?? 0;
  const count =
    beat === 0
      ? 100
      : beat === 1
        ? Math.round(100 * 100 ** directed(state, 'batch-extend', 0.05, 0.55))
        : 10000;
  const visible =
    beat > 0 ? 32 : Math.min(32, Math.floor(32 * directed(state, 'batch-hundred', 0.2, 0.6)));
  const rows = latePrefixes.map((prefix, i) => ({
    id: i + 1,
    seed: parameters.seed + 7919 * i,
    count,
    late: prefix[count],
    rate: prefix[count] / count,
  }));
  return {
    count,
    visible,
    rows,
    standardError: Math.sqrt((lateProbability * (1 - lateProbability)) / count),
    empiricalSpread: Math.sqrt(
      average(rows.map((row) => (row.rate - average(rows.map((other) => other.rate))) ** 2)),
    ),
  };
}
export function tailFrame(state) {
  const amount = (state.beat ?? 0) === 0 ? directed(state, 'tail-spread', 0.1, 0.45) : 1;
  const sigma = 0.25 + 0.55 * amount;
  return {
    sigma,
    median: 6,
    rank: 0.95,
    p95: durationFromRank(0.95, sigma),
    late: 1 - durationCdf(10, sigma),
  };
}
export function auditFrame(state) {
  const timely = Math.floor(cohort.byTen * cueStep(state, 'audit-timely', 0, 0.18, 0.38));
  const later = Math.floor(
    (cohort.byFifteen - cohort.byTen) * cueStep(state, 'audit-later', 0, 0.42, 0.6),
  );
  const unfinished = Math.floor(
    (cohort.size - cohort.byFifteen) * cueStep(state, 'audit-unfinished', 0, 0.66, 0.88),
  );
  const completedProgress = cueStep(state, 'audit-completed-only', 1, 0.1, 0.47);
  const completedOnly = completedProgress > 0;
  const repair = cueStep(state, 'audit-denominator', 2, 0.05, 0.45);
  const moving = repair > 0 && repair < 1;
  const denominator = repair === 1 ? cohort.size : cohort.byFifteen;
  return {
    timely,
    later,
    unfinished,
    completedOnly,
    completedProgress,
    repair,
    moving,
    denominator,
    fractionKnown: completedProgress === 1 && !moving,
    fraction: cohort.byTen / denominator,
    compare: cueStep(state, 'audit-compare', 3, 0.15, 0.45) > 0,
  };
}
export function transferFrame(state) {
  const progress = cueStep(state, 'transfer-deadline', 1, 0.05, 0.5);
  return {
    progress,
    deadline: 10 + 5 * progress,
    timely: progress === 1 ? cohort.byFifteen : cohort.byTen,
    known: progress === 0 || progress === 1,
    denominator: cohort.size,
    unfinished: cohort.size - cohort.byFifteen,
    p95Known: cueStep(state, 'transfer-p95', 2, 0.12, 0.42) > 0,
  };
}
