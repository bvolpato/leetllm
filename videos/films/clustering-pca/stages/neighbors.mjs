import { labels, xy } from '../fixtures.mjs';
import { distance, unit } from '../arithmetic.mjs';
import { directed } from '../model.mjs';
import {
  originalEquation,
  originalFocus,
  originalFooter,
  originalLine,
  originalPlot,
  originalPoint,
  originalText,
} from '../defaults.mjs';
export function drawNeighbors(ctx, scene, state, api) {
  return api.focus.target('neighbors-construction', () => {
    {
      const { C: themeColors, teaching: teaching } = api,
        currentBeat = state.beat ?? 0;
      const phase = (id, beat) => directed(state, id, beat);
      const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
        ids = ['A', 'B', 'C', 'D', 'E', 'F'];
      const labelOffsets = [
        [-28, 30],
        [-28, -22],
        [-25, -25],
        [28, 35],
        [-28, 35],
        [28, -24],
      ];
      let labelExclusions = [];
      {
        if (currentBeat === 0) {
          const q = teaching.axes({
            x: 260,
            y: 330,
            width: 760,
            height: 540,
            xDomain: [0.8, 1.65],
            yDomain: [0.8, 2],
            xTicks: [1, 1.2, 1.4],
            yTicks: [1, 1.4, 1.8],
            xLabel: 'coordinate 1',
            yLabel: 'coordinate 2',
            fontSize: 27,
            equalUnits: true,
          });
          const horizontal = [xy[1][0], xy[0][1]],
            a = q.point(...xy[0]),
            z = q.point(...xy[1]),
            corner = q.point(...horizontal);
          originalFocus(ctx, api, 'distance-triangle', () => {
            originalLine(
              ctx,
              api,
              labelExclusions,
              q,
              xy[0],
              horizontal,
              phase('distance-x', 0),
              themeColors.cyan,
              6,
            );
            originalLine(
              ctx,
              api,
              labelExclusions,
              q,
              horizontal,
              xy[1],
              phase('distance-y', 0),
              themeColors.pink,
              6,
            );
            if (phase('distance-x', 0) === 1)
              originalText(
                ctx,
                api,
                '0.2',
                0.5 * (a.x + corner.x),
                a.y + 48,
                30,
                themeColors.cyan,
                'center',
              );
            if (phase('distance-y', 0) === 1)
              originalText(
                ctx,
                api,
                '0.8',
                corner.x + 60,
                0.5 * (corner.y + z.y),
                30,
                themeColors.pink,
                'center',
              );
          });
          originalLine(
            ctx,
            api,
            labelExclusions,
            q,
            xy[0],
            xy[1],
            phase('distance-root', 0),
            themeColors.yellow,
            5,
          );
          originalPoint(ctx, api, ids, labelOffsets, q, 0, xy[0], themeColors.blue);
          originalPoint(ctx, api, ids, labelOffsets, q, 1, xy[1], themeColors.blue);
          originalFocus(ctx, api, 'distance-calculation', () =>
            originalEquation(
              ctx,
              api,
              phase('distance-square', 0) === 1
                ? String.raw`0.2^2+0.8^2=0.68`
                : String.raw`\Delta x^2+\Delta y^2=?`,
              465,
              themeColors.ink,
              40,
            ),
          );
          originalFocus(ctx, api, 'distance-result', () =>
            originalEquation(
              ctx,
              api,
              phase('distance-root', 0) === 1
                ? String.raw`d(A,B)=\sqrt{0.68}\approx0.82`
                : String.raw`d(A,B)=?`,
              635,
              themeColors.yellow,
              40,
            ),
          );
          const squares = phase('distance-square', 0),
            parts = [
              {
                x: 1290,
                side: 44,
                area: 0.04,
                color: themeColors.cyan,
                p: unit(2 * squares),
              },
              {
                x: 1500,
                side: 176,
                area: 0.64,
                color: themeColors.pink,
                p: unit(2 * squares - 1),
              },
            ];
          if (squares > 0) {
            originalText(
              ctx,
              api,
              'Squared contributions · same area scale',
              1515,
              725,
              27,
              themeColors.muted,
              'center',
            );
            parts.forEach((part) => {
              const side = part.side * Math.sqrt(part.p);
              if (side > 0)
                api.rect(ctx, part.x, 920 - side, side, side, part.color, undefined, 0, 0);
              if (part.p === 1)
                originalText(
                  ctx,
                  api,
                  part.area.toFixed(2),
                  part.x + part.side / 2,
                  970,
                  29,
                  part.color,
                  'center',
                );
            });
          }
          originalText(
            ctx,
            api,
            'Same two observations · magnified view',
            650,
            995,
            29,
            themeColors.muted,
            'center',
          );
        } else {
          const q = originalPlot(ctx, api),
            other = phase('distance-compete', 1),
            pairs = phase('neighbors-all', 1);
          originalFocus(ctx, api, 'neighbor-comparison', () => {
            originalLine(ctx, api, labelExclusions, q, xy[0], xy[2], other, themeColors.pink, 4);
            originalLine(ctx, api, labelExclusions, q, xy[0], xy[1], 1, themeColors.blue, 6);
          });
          originalFocus(ctx, api, 'neighbor-pairs', () =>
            [1, 2].forEach((k) =>
              originalLine(
                ctx,
                api,
                labelExclusions,
                q,
                xy[2 * k],
                xy[2 * k + 1],
                unit(2 * pairs - (k - 1)),
                colors[k],
                5,
              ),
            ),
          );
          xy.forEach((p, i) =>
            originalPoint(ctx, api, ids, labelOffsets, q, i, p, colors[labels[i]]),
          );
          originalText(ctx, api, 'From message A', 1515, 400, 34, themeColors.ink, 'center');
          originalEquation(ctx, api, 'd(A,B)\\approx0.82', 510, themeColors.blue, 42);
          if (other === 1)
            originalEquation(
              ctx,
              api,
              'd(A,C)\\approx' + distance(xy[0], xy[2]).toFixed(2),
              640,
              themeColors.pink,
              42,
            );
          if (pairs === 1)
            originalText(
              ctx,
              api,
              'All three reviewed pairs are nearest neighbors.',
              1515,
              800,
              26,
              themeColors.green,
              'center',
            );
          originalFooter(ctx, api, 'Euclidean distance is the rule for this constructed map.');
        }
      }
    }
    {
      const { C } = api;
      [
        'A · charged twice',
        'B · duplicate payment',
        'C · reset link',
        'D · two-factor code',
        'E · release runbook',
        'F · release approval',
      ].forEach((v, i) => api.text(ctx, v, 130 + i * 282, 196, 22, C.muted, 'left'));
    }
  });
}
export default {
  id: 'neighbors',
  draw: drawNeighbors,
  cues: [
    'distance-x',
    'distance-y',
    'distance-square',
    'distance-root',
    'cp-neighbors-0-0',
    'cp-neighbors-0-1',
    'cp-neighbors-0-2',
    'cp-neighbors-0-3',
    'cp-neighbors-0-4',
    'distance-compete',
    'neighbors-all',
    'cp-neighbors-1-0',
    'cp-neighbors-1-1',
    'cp-neighbors-1-2',
    'cp-neighbors-1-3',
  ],
};
