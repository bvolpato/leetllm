import { doraRow } from '../model.mjs';
import { num, point } from '../geometry.mjs';
import { text, math, rect, arrow, matrix } from '../defaults.mjs';
export function drawDoraForward(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const earned = (id, index, start = 0.1, end = 0.8) =>
    beat > index ||
    (beat === index && api.focus.progress(id, api.phase(progress, start, end)) >= 0.999);
  ctx.save();
  {
    api.focus.target('dora-forward-mechanism', () => {
      if (beat < 2) {
        const directionP = api.focus.progress('dora-direction-change', stage(1, 0.5, 0.7));
        const magnitudeP = api.focus.progress('dora-magnitude-change', stage(1, 0.7, 0.9));
        const v = [3 + 0.5 * directionP, 4],
          magnitude = 5 + magnitudeP;
        const row = doraRow(v, magnitude, [1, 0]);
        const plot = api.teaching.axes({
          x: 190,
          y: 350,
          width: 710,
          height: 590,
          xDomain: [-1, 6],
          yDomain: [-1, 6],
          xTicks: [0, 2, 4, 6],
          yTicks: [0, 2, 4, 6],
          equalUnits: true,
          fontSize: 25,
        });
        const origin = plot.point(0, 0);
        const circlePoints = Array.from(
          {
            length: 101,
          },
          (_, i) => {
            const theta = (i / 100) * Math.PI * 2;
            return plot.point(5 * Math.cos(theta), 5 * Math.sin(theta));
          },
        );
        // Only the visible first-quadrant arc is needed; its radius is an actual row norm.
        api.path(ctx, circlePoints.slice(0, 26), {
          color: '#7fa8ff66',
          width: 2,
        });
        arrow(ctx, api, origin, plot.point(3, 4), themeColors.blue, 3);
        api.focus.target('dora-direction', () =>
          arrow(ctx, api, origin, plot.point(...v), themeColors.yellow, 6),
        );
        api.focus.target('dora-normalized-row', () =>
          arrow(ctx, api, origin, plot.point(...row.weight), themeColors.green, 4),
        );
        const unit = v.map((value) => value / row.norm);
        arrow(ctx, api, origin, plot.point(...unit), themeColors.cyan, 7);
        text(ctx, api, 'SUPPLIED ROW · W₀ = [3, 4]', 190, 285, 31, themeColors.blue);
        text(ctx, api, 'directional update: A = [1, 0], s = 1', 1030, 300, 27, themeColors.muted);
        api.focus.target('dora-direction', () => {
          text(
            ctx,
            api,
            `B = ${num(0.5 * directionP)}`,
            1030,
            380,
            35,
            themeColors.yellow,
            'left',
            'mono',
          );
          text(
            ctx,
            api,
            `V = [${v.map(num).join(', ')}]`,
            1030,
            435,
            35,
            themeColors.yellow,
            'left',
            'mono',
          );
        });
        text(
          ctx,
          api,
          `||V|| = ${Number(row.norm.toFixed(4))}`,
          1030,
          525,
          35,
          themeColors.cyan,
          'left',
          'mono',
        );
        text(ctx, api, `m = ${num(magnitude)}`, 1030, 615, 40, themeColors.green, 'left', 'mono');
        text(
          ctx,
          api,
          `||W|| = ${num(Math.hypot(...row.weight))}`,
          1030,
          680,
          35,
          themeColors.green,
          'left',
          'mono',
        );
        math(
          ctx,
          api,
          'W=m\\,\\frac{V}{\\lVert V\\rVert}',
          1390,
          805,
          57,
          themeColors.ink,
          'center',
        );
        if (earned('dora-initial-identity', 1, 0.1, 0.4)) {
          text(
            ctx,
            api,
            directionP === 0 && magnitudeP === 0
              ? 'B = 0 and m = 5 preserve W₀'
              : 'Direction and magnitude are separate controls',
            1030,
            920,
            29,
            themeColors.muted,
          );
        }
      } else {
        const weights = [
          [1, 0, 0, 0, 0, 0],
          [0, 2, 0, 0, 0, 0],
          [0, 0, 3, 0, 0, 0],
          [0, 0, 0, 4, 1, 1],
        ];
        const norms = weights.map((row) => Math.hypot(...row));
        const magnitudesReady = earned('dora-four-magnitudes', 2, 0.15, 0.35);
        const percentReady = earned('dora-twenty-percent', 2, 0.35, 0.5);
        const squareReady = earned('dora-square-count', 2, 0.5, 0.8);
        text(
          ctx,
          api,
          'RECTANGULAR WEIGHT · four output rows × six input columns',
          190,
          285,
          29,
          themeColors.ink,
        );
        matrix(ctx, api, weights, 200, 395, 75, themeColors.blue);
        for (let i = 0; i < 4; i++) {
          text(ctx, api, `row ${i + 1}`, 715, 443 + i * 75, 26, themeColors.muted);
          if (magnitudesReady) {
            arrow(
              ctx,
              api,
              point(820, 429 + i * 75),
              point(940, 429 + i * 75),
              themeColors.green,
              3,
            );
            text(
              ctx,
              api,
              Number(norms[i].toFixed(3)).toString(),
              1000,
              443 + i * 75,
              33,
              themeColors.green,
              'left',
              'mono',
            );
          }
        }
        api.focus.target('dora-row-count', () =>
          text(
            ctx,
            api,
            magnitudesReady ? 'm has four values' : 'One norm per output row',
            1220,
            380,
            34,
            themeColors.green,
          ),
        );
        text(ctx, api, 'rank 2', 1220, 455, 34, themeColors.yellow);
        text(ctx, api, 'A: 2 × 6 = 12', 1220, 515, 31, themeColors.yellow, 'left', 'mono');
        text(ctx, api, 'B: 4 × 2 = 8', 1220, 570, 31, themeColors.cyan, 'left', 'mono');
        if (magnitudesReady)
          text(ctx, api, 'm: 4', 1220, 625, 31, themeColors.green, 'left', 'mono');
        if (percentReady) {
          const x = 200,
            y = 815,
            unit = 40;
          rect(ctx, api, x, y, 12 * unit, 45, themeColors.yellow);
          rect(ctx, api, x + 12 * unit, y, 8 * unit, 45, themeColors.cyan);
          rect(ctx, api, x + 20 * unit, y, 4 * unit, 45, themeColors.green);
          text(
            ctx,
            api,
            '20 factors + 4 magnitudes = 24 trainable values',
            200,
            775,
            31,
            themeColors.ink,
          );
          text(ctx, api, '4 / 20 = 20% extra', 1250, 850, 32, themeColors.green, 'left', 'mono');
        }
        if (squareReady)
          text(
            ctx,
            api,
            'Separate square case · 4096 / 131072 = 3.125% extra',
            200,
            950,
            32,
            themeColors.muted,
          );
      }
    });
  }
  ctx.restore();
}
export default {
  id: 'dora-forward',
  draw: drawDoraForward,
  cues: [
    'dora-forward-1',
    'dora-forward-2',
    'dora-initial-identity',
    'dora-direction-change',
    'dora-magnitude-change',
    'dora-forward-3',
    'dora-four-magnitudes',
    'dora-twenty-percent',
    'dora-square-count',
  ],
};
