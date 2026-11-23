import { pairedIntervalStudies } from '../fixtures.mjs';
import { cueProgress, resultOrOperation } from '../model.mjs';
import { card, mark, text } from '../defaults.mjs';

function coverage(ctx, state, api) {
  const C = api.C;
  const count = Math.floor(
    pairedIntervalStudies.length * cueProgress(state, 'hyp-interval-studies', 0),
  );
  const shown = pairedIntervalStudies.slice(0, count);
  const x = (lift) => 1040 + lift * 3210;
  text(ctx, api, 'New sample of 40 pairs on each line', 190, 300, 36, C.ink);
  text(ctx, api, 'True lift  0', x(0), 300, 35, C.yellow, 'center');
  api.line(ctx, x(0), 324, x(0), 894, C.yellow, 3);
  for (const [i, study] of shown.entries()) {
    const y = 350 + i * 27;
    const color = study.covers ? C.blue : C.pink;
    api.line(ctx, x(study.interval[0]), y, x(study.interval[1]), y, color, 7);
    api.circle(ctx, x(study.mean), y, 6, color);
    if (!study.covers) {
      const left = study.interval[1] < 0;
      const outside = left ? x(study.interval[0]) - 22 : x(study.interval[1]) + 22;
      text(ctx, api, 'miss', outside, y + 9, 26, color, left ? 'right' : 'left');
    }
  }
  if (count)
    text(
      ctx,
      api,
      `${shown.filter((s) => s.covers).length} of ${count} intervals cover the true lift`,
      960,
      989,
      41,
      C.ink,
      'center',
    );
}

function singleRate(ctx, state, api) {
  const C = api.C;
  const changed = resultOrOperation(state, 'wald-flip', 1);
  const outcomes = [1, 1, 1, changed ? 0 : 1];
  const p = outcomes.reduce((sum, outcome) => sum + outcome, 0) / outcomes.length;
  const se = Math.sqrt((p * (1 - p)) / outcomes.length);
  const extent = cueProgress(state, 'hyp-interval-boundary', 1);
  const x = (rate) => 275 + 1070 * rate;
  const y = 666;
  const high = p + 1.96 * se;
  text(ctx, api, 'One assistant   ·   Four attempts on four tasks', 220, 310, 37, C.ink);
  for (const [i, pass] of outcomes.entries())
    card(ctx, api, pass ? 'pass' : 'fail', 260 + i * 235, 372, 190, 90, pass ? C.blue : C.pink, 36);
  text(ctx, api, `${outcomes.filter(Boolean).length} / 4`, 1430, 432, 53, C.ink, 'center');

  text(ctx, api, 'Possible pass rates', x(0), 561, 31, C.ink);
  api.line(ctx, x(0), 715, x(1), 715, C.muted, 4);
  for (const tick of [0, 0.5, 1]) {
    api.line(ctx, x(tick), 706, x(tick), 728, C.ink, 3);
    text(ctx, api, `${tick * 100}%`, x(tick), 777, 33, C.ink, 'center');
  }
  api.line(ctx, x(1), 570, x(1), 705, C.yellow, 4);
  const lo = p - 1.96 * se * extent;
  const hi = p + 1.96 * se * extent;
  if (hi > lo) {
    api.line(ctx, x(lo), y, x(Math.min(1, hi)), y, C.blue, 10);
    for (const tip of [lo, hi])
      api.line(ctx, x(tip), y - 17, x(tip), y + 17, tip > 1 ? C.pink : C.blue, 4);
    if (hi > 1) api.line(ctx, x(1), y, x(hi), y, C.pink, 10);
  }
  api.circle(ctx, x(p), y, 13, C.cyan);
  if (extent === 1 && changed)
    text(ctx, api, `${(high * 100).toFixed(1)}%`, x(high), 604, 38, C.pink, 'center');
  text(
    ctx,
    api,
    `Wald interval   ·   Estimate ${(p * 100).toFixed(0)}%   ±   1.96 × ${(100 * se).toFixed(1)} points`,
    960,
    935,
    39,
    C.ink,
    'center',
  );
}

function sixTies(ctx, state, api) {
  const C = api.C;
  const draws = [3, 0, 3, 5, 1, 3];
  const count = Math.floor(draws.length * cueProgress(state, 'hyp-interval-ties', 2));
  const x = (i) => 277 + i * 235;
  text(ctx, api, 'Six observed pairs   ·   B minus A', 225, 320, 37, C.ink);
  text(ctx, api, 'One resample, with replacement', 225, 650, 37, C.ink);
  for (let i = 0; i < 6; i++) {
    card(
      ctx,
      api,
      `T${i + 1}   0`,
      x(i),
      386,
      190,
      94,
      count && draws[count - 1] === i ? C.yellow : C.blue,
      33,
    );
    if (i < count) card(ctx, api, `T${draws[i] + 1}   0`, x(i), 716, 190, 94, C.cyan, 33);
  }
  if (count === draws.length)
    text(
      ctx,
      api,
      'Mean of every resample  0     ·     Percentile interval  [0, 0]',
      960,
      958,
      39,
      C.ink,
      'center',
    );
}

export function drawIntervalContract(ctx, scene, state, api) {
  mark(api, 'interval-contract-construction', () =>
    [coverage, singleRate, sixTies][state.beat ?? 0](ctx, state, api),
  );
}
export default {
  id: 'interval-contract',
  draw: drawIntervalContract,
  cues: [
    'interval-contract-0',
    'hyp-interval-studies',
    'interval-contract-1',
    'wald-flip',
    'hyp-interval-boundary',
    'interval-contract-2',
    'hyp-interval-ties',
  ],
};
