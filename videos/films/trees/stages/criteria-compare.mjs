import { mean } from '../arithmetic.mjs';
import {
  drawConstructionDot,
  drawConstructionEquation,
  drawConstructionFocus,
  drawConstructionText,
} from '../defaults.mjs';
import { entropy } from 'vizmatic';
export function drawCriteriaCompare(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.1, z = 0.78) => api.phase(progress, a, z);
  {
    const partition = [
      [
        [0, 0, 0, 0],
        [...Array(8).fill(0), ...Array(12).fill(1)],
      ],
      [
        [...Array(3).fill(0), ...Array(9).fill(1)],
        [...Array(9).fill(0), ...Array(3).fill(1)],
      ],
    ];
    if (currentBeat < 2) {
      drawConstructionText(
        ctx,
        api,
        '24 training rows · 12 needed review · 12 were routine',
        960,
        300,
        33,
        themeColors.muted,
      );
      partition.forEach((groups, i) => {
        const x = 180 + i * 880;
        drawConstructionText(
          ctx,
          api,
          'Candidate ' + (i ? 'B' : 'A'),
          x + 350,
          400,
          40,
          themeColors.yellow,
        );
        groups.forEach((labels, j) => {
          labels.forEach((label, k) =>
            drawConstructionDot(
              ctx,
              api,
              x + 35 + (k % 10) * 65,
              510 + j * 180 + Math.floor(k / 10) * 55,
              label,
              19,
            ),
          );
          drawConstructionText(
            ctx,
            api,
            labels.filter((v) => v).length + '/' + labels.length + ' review',
            x + 350,
            650 + j * 180,
            31,
            themeColors.muted,
          );
        });
        const gain = (criterion) =>
            criterion([0.5, 0.5]) -
            groups.reduce((s, g) => {
              const p = mean(g);
              return s + (g.length / 24) * criterion([p, 1 - p]);
            }, 0),
          gg = gain((a) => 1 - a.reduce((s, v) => s + v * v, 0)),
          eg = gain(entropy);
        const giniKnown =
          currentBeat === 1 &&
          api.focus.progress('criterion-gini', api.phase(progress, 0.15, 0.35)) === 1;
        const entropyKnown =
          currentBeat === 1 &&
          api.focus.progress('criterion-entropy', api.phase(progress, 0.57, 0.76)) === 1;
        drawConstructionFocus(ctx, api, 'criterion-gains', () => {
          drawConstructionText(
            ctx,
            api,
            'Gini gain   ' + (giniKnown ? gg.toFixed(4) : '?'),
            x + 350,
            916,
            35,
            themeColors.cyan,
          );
          drawConstructionText(
            ctx,
            api,
            'Entropy gain   ' + (entropyKnown ? eg.toFixed(4) + ' bits' : '?'),
            x + 350,
            995,
            35,
            themeColors.pink,
          );
        });
      });
    } else {
      drawConstructionText(
        ctx,
        api,
        'Regression impurity is mean squared loss',
        960,
        310,
        35,
        themeColors.muted,
      );
      const target = [10, 20, 60],
        pred = [30, 30, 30].map((v, i) =>
          api.lerp(v, [15, 15, 60][i], api.focus.progress('regression-split', cueProgress())),
        ),
        q = teaching.axes({
          x: 250,
          y: 390,
          width: 1150,
          height: 425,
          xDomain: [0, 4],
          yDomain: [0, 70],
          xTicks: [1, 2, 3],
          yTicks: [0, 30, 60],
          xLabel: 'request',
          yLabel: 'handling minutes',
          fontSize: 26,
        });
      target.forEach((v, i) => {
        const a = q.point(i + 1, v),
          z = q.point(i + 1, pred[i]);
        api.line(ctx, a.x, a.y, z.x, z.y, themeColors.pink, 6);
        drawConstructionDot(ctx, api, a.x, a.y, 1, 12);
        drawConstructionDot(ctx, api, z.x, z.y, 0, 12);
      });
      const mse = mean(target.map((v, i) => (v - pred[i]) ** 2));
      drawConstructionFocus(ctx, api, 'regression-values', () =>
        drawConstructionEquation(
          ctx,
          api,
          `MSE=${mse.toFixed(2)}`,
          1580,
          580,
          49,
          themeColors.yellow,
        ),
      );
      drawConstructionEquation(
        ctx,
        api,
        `466.67-${mse.toFixed(2)}=${(1400 / 3 - mse).toFixed(2)}`,
        960,
        1000,
        46,
        themeColors.green,
      );
    }
    return;
  }
  return;
}
export default {
  id: 'criteria-compare',
  draw: drawCriteriaCompare,
  cues: ['criterion-gini', 'criterion-entropy', 'regression-split'],
};
