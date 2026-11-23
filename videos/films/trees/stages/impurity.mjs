import { rows } from '../fixtures.mjs';
import {
  drawConstructionEquation,
  drawConstructionFocus,
  drawConstructionText,
} from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawImpurity(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.1, z = 0.78) => api.phase(progress, a, z);
  {
    drawConstructionText(
      ctx,
      api,
      'Draw two labels independently from the same leaf',
      960,
      300,
      32,
      themeColors.muted,
    );
    for (let i = 0; i < 8; i++) {
      const color = rows[i][2] ? themeColors.pink : themeColors.blue;
      drawConstructionText(ctx, api, 'R' + (i + 1), 200, 425 + i * 62, 27, color);
      drawConstructionText(ctx, api, 'R' + (i + 1), 280 + i * 62, 365, 27, color);
      for (let j = 0; j < 8; j++) {
        const active = currentBeat > 0 || i * 8 + j < Math.floor(cueProgress() * 64),
          diff = rows[i][2] !== rows[j][2];
        drawConstructionFocus(ctx, api, 'impurity-probe', () =>
          api.rect(
            ctx,
            253 + j * 62,
            390 + i * 62,
            54,
            54,
            active ? (diff ? themeColors.yellow : themeColors.panel) : themeColors.panel,
            active ? themeColors.muted : themeColors.panel,
            1,
          ),
        );
      }
    }
    const q = teaching.axes({
      x: 1040,
      y: 420,
      width: 650,
      height: 355,
      xDomain: [0, 1],
      yDomain: [0, currentBeat === 2 ? 1.05 : 0.55],
      xTicks: [0, 0.5, 1],
      yTicks: currentBeat === 2 ? [0, 0.5, 1] : [0, 0.25, 0.5],
      xLabel: 'fraction needing review',
      yLabel: 'impurity',
      fontSize: 26,
    });
    drawConstructionFocus(ctx, api, 'gini-rule', () =>
      teaching.curve({
        plot: q,
        points: sampleFunction((x) => 2 * x * (1 - x), 0, 1, 100),
        color: themeColors.cyan,
        width: 5,
        progress: currentBeat === 0 ? 0 : 1,
      }),
    );
    if (currentBeat === 2)
      drawConstructionFocus(ctx, api, 'entropy-example', () => {
        drawConstructionText(ctx, api, 'Entropy', 1370, 350, 32, themeColors.pink);
        teaching.curve({
          plot: q,
          points: sampleFunction(
            (x) => (x === 0 || x === 1 ? 0 : -x * Math.log2(x) - (1 - x) * Math.log2(1 - x)),
            0,
            1,
            100,
          ),
          color: themeColors.pink,
          width: 5,
          progress: cueProgress(),
        });
      });
    const counted = currentBeat === 0 ? Math.min(64, Math.floor(cueProgress() * 64)) : 64,
      disagree = rows.reduce(
        (sum, a, i) => sum + rows.filter((z, j) => i * 8 + j < counted && a[2] !== z[2]).length,
        0,
      );
    drawConstructionEquation(
      ctx,
      api,
      counted < 64 ? 'D_{seen}=' + disagree : 'G=32/64=0.50',
      1370,
      900,
      48,
      themeColors.yellow,
    );
    drawConstructionText(
      ctx,
      api,
      currentBeat === 2
        ? 'Gini in cyan · entropy in pink'
        : counted < 64
          ? 'Pairs checked: ' + counted + '/64'
          : '32 disagreeing pairs out of 64',
      1370,
      1000,
      30,
      themeColors.muted,
    );
    return;
  }
  return;
}
export default {
  id: 'impurity',
  draw: drawImpurity,
  cues: ['impurity-probe-b1-1', 'gini-rule-b2-1', 'entropy-example-b3-1'],
};
