import { allocationOptimum, loss } from '../arithmetic.mjs';
import { spoken } from '../cue.mjs';
import { curve, line, point, rectangle, text } from '../defaults.mjs';

const product = 900,
  a = 3,
  b = 6,
  capD = 40,
  capN = 20;
const winner = allocationOptimum(product, a, b, 0.5, 0.5);
const minN = product / capD;
const plans = [7.5, 15, 30].map((n, i) => ({ id: 'ABC'[i], n, d: product / n }));
const digits = (x) => String(Number(x.toFixed(1)));

export function drawFreshAllocation(ctx, scene, state, api) {
  const { C } = api;
  const seen = (id) => spoken(scene, state, id).phase !== 'before';
  const after = (id) => spoken(scene, state, id).phase === 'after';
  const ratioKnown = after('fresh-ratio'),
    identified = after('fresh-choice');
  const scored = identified && after('fresh-loss'),
    capped = scored && seen('fresh-cap');
  const move = spoken(scene, state, 'fresh-slide');
  const sizeKnown = capped && move.phase === 'after' && after('fresh-quotient');
  const capLoss = sizeKnown && after('fresh-cap-loss'),
    modelLimit = seen('fresh-size-limit');
  const maxArea = after('fresh-area'),
    showShortfall = after('fresh-shortfall');
  const n = winner.n + (minN - winner.n) * api.ease(move.progress);
  const d = product / n;
  const left = 225,
    bottom = 826,
    sx = 19,
    sy = 3.55;
  const X = (v) => left + v * sx,
    Y = (v) => bottom - v * sy;
  api.focus.target('feasible-map', () => {
    if (modelLimit) {
      rectangle(ctx, api, left, Y(capD), sx * capN, capD * sy, C.blue + '48', C.blue);
      if (showShortfall) {
        const requiredD = product / capN;
        rectangle(
          ctx,
          api,
          left,
          Y(requiredD),
          sx * capN,
          (requiredD - capD) * sy,
          C.pink + '64',
          C.pink,
        );
      }
    } else if (identified) {
      rectangle(ctx, api, left, Y(d), n * sx, d * sy, C.yellow + '20', C.yellow);
    }
    const axes = api.teaching.axes({
      x: left,
      y: Y(135),
      width: sx * 36,
      height: sy * 135,
      xDomain: [0, 36],
      yDomain: [0, 135],
      xTicks: [10, 20, 30],
      yTicks: [40, 80, 120],
      xLabel: 'Parameter units',
      yLabel: 'Token units',
      color: C.muted,
    });
    curve(ctx, api, axes, (x) => product / x, product / 135, 36, C.cyan);
    for (const row of plans) {
      point(ctx, api, axes, row.n, row.d, C.muted, 8);
      text(
        ctx,
        api,
        row.id,
        X(row.n) + 15,
        Y(row.d) + (capped && row.id === 'C' ? 35 : -18),
        32,
        C.ink,
      );
    }
    if (capped) {
      line(ctx, api, left, Y(capD), X(36), Y(capD), C.pink, 4);
      text(ctx, api, 'D ≤ 40', X(35), Y(capD) - 24, 30, C.pink, 'right');
    }
    if (modelLimit) {
      line(ctx, api, X(capN), Y(135), X(capN), bottom, C.blue, 4);
      text(ctx, api, 'N ≤ 20', X(capN) + 20, Y(124), 30, C.blue);
    }
    if (identified) point(ctx, api, axes, n, d, modelLimit ? C.muted : C.yellow, 11);
    if (modelLimit) point(ctx, api, axes, capN, capD, C.blue, 10);
  });
  api.focus.target('allocation-ledger', () => {
    text(ctx, api, 'Full budget   N × D = 900', 1400, 263, 48, C.cyan, 'center');
    if (!modelLimit) {
      const [lossLabel, lossN, lossD] = sizeKnown
        ? ['Capped loss', minN, capD]
        : identified && !capped
          ? ['Plan B loss', winner.n, winner.d]
          : ['L', 'N', 'D'];
      text(
        ctx,
        api,
        `${lossLabel} = 1 + ${a}/√${lossN} + ${b}/√${lossD}`,
        1400,
        353,
        48,
        C.ink,
        'center',
      );
      const cols = [1040, 1205, 1395, 1645];
      for (const [i, heading] of ['Plan', 'N', 'D', 'Fitted loss'].entries())
        text(ctx, api, heading, cols[i], 458, 33, C.muted, 'center');
      for (const [i, row] of plans.entries()) {
        const color = identified && row.n === winner.n && !capped ? C.yellow : C.ink;
        const rowY = 544 + i * 81;
        [row.id, row.n, row.d, scored ? loss(row.n, row.d, a, b).toFixed(3) : '?'].forEach(
          (value, j) => text(ctx, api, value, cols[j], rowY, 42, color, 'center'),
        );
      }
      line(ctx, api, 990, 747, 1760, 747, C.muted, 2);
      const work = capped
        ? capLoss
          ? `${minN} × ${capD}   ·   fitted loss ${loss(minN, capD, a, b).toFixed(3)}`
          : move.phase === 'before'
            ? 'Inventory allows 40 token units'
            : `${product} ÷ ${capD} = ${sizeKnown ? digits(minN) : '?'}`
        : ratioKnown
          ? 'Target D/N = (6/3)² = 4'
          : 'Which plan balances the two penalties?';
      text(ctx, api, work, 1380, 844, 35, capped ? C.pink : C.ink, 'center');
    } else {
      text(ctx, api, 'Largest allowed rectangle', 1390, 444, 41, C.ink, 'center');
      text(ctx, api, '20 × 40 = ' + (maxArea ? capN * capD : '?'), 1390, 580, 68, C.blue, 'center');
      if (maxArea)
        text(ctx, api, product - capN * capD + ' units unspent', 1390, 713, 46, C.yellow, 'center');
      if (showShortfall)
        text(
          ctx,
          api,
          'Needed: ' + product / capN + ' rows   ·   available: ' + capD,
          1390,
          830,
          37,
          C.pink,
          'center',
        );
    }
  });
  const caption = modelLimit
    ? maxArea
      ? 'Plan a smaller run, or secure more usable data.'
      : 'How much of the budget fits inside both limits?'
    : capped
      ? capLoss
        ? 'Lowest fitted loss using the full budget under the data cap'
        : 'Uncapped fitted loss ' +
          loss(winner.n, winner.d, a, b).toFixed(3) +
          '   ·   40 token units available'
      : scored
        ? 'Plan B  ·  fitted loss ' + loss(winner.n, winner.d, a, b).toFixed(3)
        : 'Normalized counts for a new training proposal';
  text(ctx, api, caption, 960, 982, 38, modelLimit && maxArea ? C.yellow : C.ink, 'center');
}

export default {
  id: 'fresh-allocation',
  draw: drawFreshAllocation,
  cues: [
    'fresh-plans',
    'fresh-ratio',
    'fresh-choice',
    'fresh-loss',
    'fresh-cap',
    'fresh-slide',
    'fresh-quotient',
    'fresh-cap-loss',
    'fresh-size-limit',
    'fresh-area',
    'fresh-shortfall',
  ],
};
