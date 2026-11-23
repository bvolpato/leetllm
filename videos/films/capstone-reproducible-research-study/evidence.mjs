import { seedRows } from './fixtures/seed-rows.mjs';
import { RS_REPORTED_UNITS } from './fixtures/reported-bootstrap.mjs';
import { quantile, rsClamp } from './arithmetic.mjs';

export const earlyEpisodes = 30;
export const ledger = seedRows.map(({ seed, early_sparse, early_shaped }) => {
  const sparse = Math.round(earlyEpisodes * early_sparse);
  const shaped = Math.round(earlyEpisodes * early_shaped);
  return { seed, sparse, shaped, gain: shaped - sparse };
});

export function summary(rows) {
  const gain = rows.reduce((total, row) => total + row.gain, 0);
  const episodesPerArm = rows.length * earlyEpisodes;
  return { gain, episodesPerArm, points: (100 * gain) / episodesPerArm };
}

export const reportedMeans = RS_REPORTED_UNITS.map(
  (value) => value / (ledger.length * earlyEpisodes),
);
export const reportedInterval = [0.05, 0.95].map((q) => quantile(reportedMeans, q));

// Intended actions and slip events from the article's run, seed 14, third training episode.
const slipSteps = new Set([2, 7, 8]);
function replay(actions) {
  const positions = [0];
  for (const [i, action] of actions.entries()) {
    const move = slipSteps.has(i + 1) ? -action : action;
    positions.push(Math.max(0, Math.min(6, positions.at(-1) + move)));
  }
  return positions;
}
export const openingRuns = [
  replay([-1, -1, 1, 1, -1, 1, 1, -1, -1, -1, 1, -1]),
  replay([1, -1, 1, 1, -1, 1, 1, 1, 1, 1, 1, 1]),
];

export function cueProgress(state, id, beat, start = 0, end = 1) {
  const cue = state.cues?.[id];
  if (cue)
    return cue.phase === 'after'
      ? 1
      : cue.phase === 'before'
        ? 0
        : Math.min(0.999999, cue.progress);
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  return rsClamp(((state.beatP ?? 0) - start) / (end - start));
}

export function signed(value, digits = 0) {
  return (value < 0 ? '−' : value > 0 ? '+' : '') + Math.abs(value).toFixed(digits);
}

export function controlStep(slip, creditTravel) {
  const intended = 1;
  const successor = slip ? 0 : 2;
  const nextBest = [0.4, 0, 0.4][successor];
  const entry = 0.35 * (0 + 0.95 * nextBest);
  const sparse = [0, entry];
  const zero = [0, 0];
  zero[creditTravel && slip ? 0 : intended] = entry;
  return { sparse, zero, successor, match: sparse.every((v, i) => v === zero[i]) };
}

export function decision(input) {
  const earlyPass = input.earlyMean >= 0.1 && input.earlyInterval[0] > 0;
  const finalPass =
    Math.abs(input.finalMean) <= 0.02 &&
    input.finalInterval[0] >= -0.02 &&
    input.finalInterval[1] <= 0.02;
  return {
    earlyPass,
    finalPass,
    strongerPass: input.earlyInterval[0] > 0.1,
    supported: earlyPass && finalPass,
  };
}

// The study and the closing worksheet use the same ruler for early percentage-point differences.
export function drawInterval(
  ctx,
  api,
  { x, y, width, domain, ticks, interval, point, band, guide, labelDigits = 1 },
) {
  const { C } = api;
  const at = (value) => x + (width * (value - domain[0])) / (domain[1] - domain[0]);
  if (band) api.rect(ctx, at(band[0]), y - 31, at(band[1]) - at(band[0]), 62, C.panel, C.muted, 0);
  api.line(ctx, x, y, x + width, y, C.muted, 2);
  for (const tick of ticks) {
    api.line(ctx, at(tick), y + 7, at(tick), y + 19, C.muted, 2);
    api.text(ctx, signed(tick), at(tick), y + 55, 27, C.muted, 'center');
  }
  if (guide !== undefined) api.line(ctx, at(guide), y - 50, at(guide), y + 6, C.yellow, 3);
  if (!interval) return;
  api.line(ctx, at(interval[0]), y, at(interval[1]), y, C.cyan, 9);
  for (const value of interval) {
    api.line(ctx, at(value), y - 15, at(value), y + 15, C.cyan, 4);
    api.text(ctx, signed(value, labelDigits), at(value), y - 35, 30, C.cyan, 'center');
  }
  api.circle(ctx, at(point), y, 12, C.yellow, C.bg, 2);
}
