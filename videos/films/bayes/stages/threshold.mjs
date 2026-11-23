import { betaDensity, betaTailProbability, betaVariance } from '../arithmetic.mjs';
import { done, event } from '../construction.mjs';
import { countFrame, credibleRangeFrame } from '../model.mjs';
import { areaFill, caption, chart, curve, equation, target, text } from '../defaults.mjs';
import { massRuler, percent } from '../release-scale.mjs';

function outcomeRow(ctx, api, x, y, failure) {
  for (let i = 0; i < 5; i++) {
    const pass = i !== failure;
    const color = pass ? api.C.green : api.C.red;
    api.rect(ctx, x + i * 63, y, 50, 47, api.C.panel, color, 2, 4);
    text(ctx, api, pass ? 'P' : 'F', x + i * 63 + 25, y + 34, 28, color, 'center');
  }
}

export function drawThreshold(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat < 2) {
      const q = chart(ctx, api, {
          max: 4,
          height: 400,
        }),
        tail = betaTailProbability(10, 4),
        reveal = event(state, 0, 'threshold-area'),
        interval = credibleRangeFrame(state),
        { low, high } = interval;
      curve(ctx, api, q, 10, 4, themeColors.ink);
      if (currentBeat === 0)
        target(ctx, api, 'threshold-density', () =>
          areaFill(
            ctx,
            api,
            q,
            (x) => betaDensity(10, 4, x),
            0.7,
            0.7 + 0.3 * reveal,
            themeColors.blue,
            '55',
          ),
        );
      const a = q.point(0.7, 0),
        z = q.point(0.7, 3.8);
      api.line(ctx, a.x, a.y, z.x, z.y, themeColors.yellow, 3);
      text(ctx, api, '70% rate cutoff', a.x + 25, 340, 28, themeColors.yellow);
      if (currentBeat === 0)
        target(ctx, api, 'threshold-probability', () => {
          equation(ctx, api, 'P(p>0.7\\mid D)', 1560, 420, 40, themeColors.blue);
          text(
            ctx,
            api,
            done(reveal) ? (100 * tail).toFixed(1) + '%' : '?',
            1560,
            540,
            68,
            themeColors.blue,
            'center',
          );
          text(
            ctx,
            api,
            event(state, 0, 'tail-decision', 0.84, 0.98) >= 1
              ? 'Keep traffic here'
              : 'area above the rate cutoff',
            1560,
            650,
            29,
            themeColors.yellow,
            'center',
          );
        });
      if (currentBeat === 1) {
        target(ctx, api, 'credible-range', () => {
          areaFill(ctx, api, q, (x) => betaDensity(10, 4, x), low, high, themeColors.blue);
          const first = q.point(low, 0),
            last = q.point(high, 0);
          api.line(ctx, first.x, 910, last.x, 910, themeColors.blue, 5);
          for (const x of new Set([first.x, last.x]))
            api.line(ctx, x, 895, x, 925, themeColors.blue, 3);
          if (interval.complete) {
            text(ctx, api, low.toFixed(3), first.x, 970, 27, themeColors.blue, 'center');
            text(ctx, api, high.toFixed(3), last.x, 970, 27, themeColors.blue, 'center');
          }
          text(
            ctx,
            api,
            (100 * interval.area).toFixed(0) + '% posterior interval',
            1560,
            420,
            30,
            themeColors.blue,
            'center',
          );
          text(
            ctx,
            api,
            (100 * interval.tail).toFixed(1) + '% in each outside tail',
            1560,
            500,
            27,
            themeColors.muted,
            'center',
          );
        });
        if (event(state, 1, 'beta-variance') > 0)
          target(ctx, api, 'variance-summary', () => {
            equation(
              ctx,
              api,
              '\\operatorname{Var}(p)=\\frac{ab}{(a+b)^2(a+b+1)}',
              1560,
              670,
              36,
              themeColors.yellow,
            );
            equation(
              ctx,
              api,
              `\\frac{${10 * 4}}{${(10 + 4) ** 2 * (10 + 4 + 1)}}\\approx${betaVariance(10, 4).toFixed(4)}`,
              1560,
              800,
              42,
              themeColors.yellow,
            );
            text(
              ctx,
              api,
              'Use quantiles for the interval',
              1560,
              915,
              28,
              themeColors.muted,
              'center',
            );
          });
      } else {
        const swept = reveal > 0 ? tail - betaTailProbability(10, 4, 0.7 + 0.3 * reveal) : null;
        massRuler(ctx, api, { x: 1310, y: 790, width: 500, mass: swept });
        if (done(reveal))
          equation(ctx, api, tail.toFixed(3) + '<0.95', 1560, 930, 37, themeColors.yellow);
      }
      caption(
        ctx,
        api,
        currentBeat === 0
          ? 'The policy compares posterior area with 95% · the 0.70 line marks a candidate rate'
          : interval.complete
            ? 'The interval contains 90% of this posterior area · its endpoints describe the unknown rate'
            : 'Move both quantile endpoints outward · the two outside tails keep equal probability',
      );
    } else {
      const v = countFrame(state);
      const q = target(ctx, api, 'predictive-counts', () =>
        api.teaching.axes({
          x: 145,
          y: 345,
          width: 910,
          height: 465,
          xDomain: [-0.5, 5.5],
          yDomain: [0, 0.4],
          xTicks: [0, 1, 2, 3, 4, 5],
          yTicks: [0, 0.2, 0.4],
          xLabel: 'passes in five future tasks',
          yLabel: 'probability',
          fontSize: 29,
        }),
      );
      const orders = v.orders;
      const drawBar = (k, bottom, top, color) => {
        const left = q.point(k - 0.31, top),
          right = q.point(k + 0.31, bottom);
        api.rect(ctx, left.x, left.y, right.x - left.x, right.y - left.y, color, undefined, 0, 0);
      };
      target(ctx, api, 'predictive-counts', () => {
        for (const row of v.rows.slice(0, v.visible)) {
          drawBar(row.passes, 0, row.probability, themeColors.blue);
        }
        const piece = v.rows[4].probability / 5;
        for (let i = 0; i < orders; i++) {
          drawBar(
            4,
            i * piece,
            (i + 1) * piece,
            currentBeat === 4
              ? themeColors.blue
              : i === orders - 1
                ? themeColors.yellow
                : themeColors.yellow + '9c',
          );
          if (i && currentBeat < 4) {
            const a = q.point(3.69, i * piece),
              b = q.point(4.31, i * piece);
            api.line(ctx, a.x, a.y, b.x, b.y, themeColors.bg, 3);
          }
        }
        if (done(v.five))
          drawBar(
            5,
            0,
            v.rows[5].probability,
            currentBeat < 4 ? themeColors.green : themeColors.blue,
          );
        if (currentBeat === 4 && v.comparison > 0) {
          for (const row of v.frozen) {
            const a = q.point(row.passes - 0.18, row.probability);
            const b = q.point(row.passes + 0.18, 0);
            api.rect(ctx, a.x, a.y, b.x - a.x, b.y - a.y, '#00000000', themeColors.pink, 3, 0);
          }
        }
      });
      if (currentBeat < 4) {
        target(ctx, api, 'predictive-count-outcomes', () => {
          text(ctx, api, 'Four passes, one failure', 1190, 310, 39, themeColors.ink);
          for (let col = 0; col < 5; col++)
            text(ctx, api, String(col + 1), 1220 + 63 * col, 385, 25, themeColors.muted, 'center');
          for (let i = 0; i < Math.max(orders, 1); i++) {
            const y = 415 + i * 63;
            outcomeRow(ctx, api, 1195, y, i);
            if (i === orders - 1)
              api.rect(ctx, 1185, y - 6, 323, 59, '#00000000', themeColors.yellow, 6);
          }
          if (orders) {
            text(
              ctx,
              api,
              orders === 1 ? '1 order' : orders + ' orders',
              1545,
              460,
              29,
              themeColors.ink,
            );
            text(
              ctx,
              api,
              percent((orders * v.rows[4].probability) / 5),
              1545,
              540,
              48,
              themeColors.yellow,
            );
            text(ctx, api, 'in the four-pass bar', 1545, 589, 24, themeColors.muted);
          }
          if (v.five > 0) {
            text(ctx, api, 'Five passes', 1195, 805, 31, themeColors.ink);
            outcomeRow(ctx, api, 1195, 841, -1);
            if (done(v.five))
              text(ctx, api, percent(v.rows[5].probability), 1545, 880, 40, themeColors.green);
          }
        });
        caption(
          ctx,
          api,
          orders === 0
            ? 'Each column is one future task. P = pass. F = fail.'
            : 'Each row contributes one equal piece to the four-pass bar.',
        );
      } else {
        text(ctx, api, 'Filled bars', 1185, 410, 30, themeColors.blue);
        text(ctx, api, 'Shared uncertain rate', 1185, 467, 38, themeColors.ink);
        if (v.comparison > 0) {
          text(ctx, api, 'Pink outlines', 1185, 573, 30, themeColors.pink);
          text(ctx, api, 'Rate fixed at its mean', 1185, 630, 38, themeColors.ink);
        }
        const mean = (5 * 10) / 14;
        text(ctx, api, 'Expected passes   ' + mean.toFixed(2), 1185, 746, 34, themeColors.ink);
        if (done(v.comparison)) {
          const variance = (rows) =>
            rows.reduce((sum, r) => sum + (r.passes - mean) ** 2 * r.probability, 0);
          text(
            ctx,
            api,
            'Variance   ' + variance(v.rows).toFixed(2) + '  vs  ' + variance(v.frozen).toFixed(2),
            1185,
            836,
            33,
            themeColors.ink,
          );
        }
        caption(
          ctx,
          api,
          'Both forecasts average over possible task outcomes. The filled bars also average over possible rates.',
        );
      }
    }
  }
}
export default {
  id: 'threshold',
  draw: drawThreshold,
  cues: [
    'threshold-area',
    'tail-decision',
    'credible-range',
    'beta-variance',
    'count-build',
    'four-pass-count',
    'second-position',
    'third-position',
    'fourth-position',
    'fifth-position',
    'five-pass-count',
    'retain-rate-uncertainty',
  ],
};
