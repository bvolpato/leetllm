import { data } from '../fixtures.mjs';
import { directed, finished } from '../construction.mjs';
import { eigenStep, mse, predict } from '../model.mjs';
import { optimum } from '../arithmetic.mjs';
import { equation, target, text } from '../defaults.mjs';
export function drawSolverScale(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      const blocks = 1 + Math.floor(9 * directed(state, 'grow-gram', 0.08, 0.72)),
        D = blocks * 1000,
        cell = 57;
      text(
        ctx,
        api,
        'Float64 Gram matrix · 1 tile represents 1,000 × 1,000 entries',
        960,
        280,
        30,
        themeColors.muted,
        'center',
      );
      for (let i = 0; i < blocks; i++)
        for (let j = 0; j < blocks; j++)
          api.rect(
            ctx,
            250 + j * cell,
            365 + i * cell,
            cell - 4,
            cell - 4,
            i === j ? themeColors.cyan : themeColors.blue,
          );
      target(ctx, api, 'gram-size', () =>
        text(
          ctx,
          api,
          `D = ${D.toLocaleString('en-US')}`,
          1400,
          420,
          48,
          themeColors.cyan,
          'center',
        ),
      );
      text(
        ctx,
        api,
        `${(D * D).toLocaleString('en-US')} entries`,
        1400,
        540,
        37,
        themeColors.blue,
        'center',
      );
      text(
        ctx,
        api,
        `${((D * D * 8) / 1e6).toFixed(0)} MB`,
        1400,
        670,
        70,
        themeColors.yellow,
        'center',
      );
      equation(ctx, api, 'O(ND^2)+O(D^3)', 1400, 830, 49, themeColors.ink, 'center');
      text(
        ctx,
        api,
        'Inputs and solver workspace are additional',
        960,
        1040,
        31,
        themeColors.muted,
        'center',
      );
    } else {
      const duplicate = finished(state, 'duplicate-design', 0.53);
      const { intercept, slope } = optimum;
      const weights = duplicate ? [intercept, slope / 5, (2 * slope) / 5] : [intercept, slope];
      const directions = eigenStep(0);
      const gramCondition = directions[0].value / directions[1].value;
      text(
        ctx,
        api,
        'w, _, rank, s = np.linalg.lstsq(X, y, rcond=None)',
        960,
        265,
        42,
        themeColors.ink,
        'center',
      );
      text(ctx, api, 'Design columns', 515, 365, 33, themeColors.muted, 'center');
      const columns = duplicate ? ['1', 'x', '2x'] : ['1', 'x'];
      columns.forEach((column, j) => {
        const x = 315 + 210 * j;
        text(ctx, api, column, x, 440, 40, themeColors.cyan, 'center');
        data.forEach((row, i) => {
          const value = [1, row.x, 2 * row.x][j];
          text(ctx, api, String(value), x, 520 + 79 * i, 36, themeColors.ink, 'center');
        });
      });
      target(ctx, api, 'solver-result', () => {
        text(
          ctx,
          api,
          'Rank 2 / ' + weights.length + ' columns',
          1350,
          412,
          44,
          themeColors.yellow,
          'center',
        );
        text(
          ctx,
          api,
          'Weights   [' + weights.join(', ') + ']',
          1350,
          555,
          43,
          themeColors.ink,
          'center',
        );
      });
      text(ctx, api, 'Fitted latency (ms)', 1350, 682, 32, themeColors.muted, 'center');
      text(
        ctx,
        api,
        data.map((row) => predict(row.x)).join('     '),
        1350,
        767,
        39,
        themeColors.green,
        'center',
      );
      text(
        ctx,
        api,
        'MSE  ' + mse(intercept, slope) + ' ms²',
        1350,
        859,
        32,
        themeColors.green,
        'center',
      );
      const note = duplicate
        ? 'x and 2x span one direction'
        : 'Condition number     X: ' +
          Math.sqrt(gramCondition).toFixed(2) +
          '       XᵀX: ' +
          gramCondition.toFixed(2);
      text(ctx, api, note, 960, 1008, 36, themeColors.muted, 'center');
    }
    return;
  }
}
export default {
  id: 'solver-scale',
  draw: drawSolverScale,
  cues: ['grow-gram', 'duplicate-design'],
};
