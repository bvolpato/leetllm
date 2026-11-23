import { FACTORS } from '../fixtures.mjs';
import { matmul } from '../arithmetic.mjs';
import { num } from '../geometry.mjs';
import { text, math, fade, matrix } from '../defaults.mjs';
export function drawFactorization(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    const result = matmul(FACTORS.B, FACTORS.A);
    const first = api.focus.progress('factorization-b2-1', stage(1, 0.12, 0.72));
    const repeat = api.focus.progress('factorization-b3-1', stage(2, 0.04, 0.55));
    const fill = (first + 8 * repeat) / 9;
    const index = beat < 2 ? 0 : Math.min(8, 1 + Math.floor(repeat * 8));
    const row = Math.floor(index / 3),
      col = index % 3;
    const step = beat < 2 ? first : repeat * 8 - (index - 1);
    text(ctx, api, 'B: OUTPUT DIRECTIONS', 330, 280, 29, themeColors.blue, 'center');
    text(ctx, api, 'A: INPUT MEASUREMENTS', 825, 280, 29, themeColors.cyan, 'center');
    text(ctx, api, 'FULL UPDATE', 1425, 280, 29, themeColors.yellow, 'center');
    api.focus.target('b-factor', () =>
      matrix(ctx, api, FACTORS.B, 235, 365, 95, themeColors.blue, {
        highlight: [row, step < 0.5 ? 0 : 1],
      }),
    );
    text(ctx, api, '×', 575, 500, 65, themeColors.ink, 'center');
    api.focus.target('a-factor', () =>
      matrix(ctx, api, FACTORS.A, 685, 415, 95, themeColors.cyan, {
        highlight: [step < 0.5 ? 0 : 1, col],
      }),
    );
    text(ctx, api, '=', 1110, 500, 65, themeColors.ink, 'center');
    api.focus.target('factor-product', () =>
      matrix(ctx, api, result, 1285, 365, 95, themeColors.yellow, {
        reveal: fill,
        highlight: [row, col],
      }),
    );
    text(ctx, api, '3 × 2', 330, 755, 34, themeColors.blue, 'center', 'mono');
    text(ctx, api, '2 × 3', 825, 755, 34, themeColors.cyan, 'center', 'mono');
    text(ctx, api, '3 × 3', 1425, 755, 34, themeColors.yellow, 'center', 'mono');
    const terms = [0, 1].map((k) => FACTORS.B[row][k] * FACTORS.A[k][col]);
    fade(ctx, api, stage(1, 0.04, 0.12), () => {
      text(
        ctx,
        api,
        'entry (' + (row + 1) + ', ' + (col + 1) + ')',
        430,
        870,
        32,
        themeColors.muted,
        'center',
      );
      const displayed =
        step < 0.5 && fill < 1
          ? num(terms[0]) + ' + …'
          : num(terms[0]) + ' + ' + num(terms[1]) + ' = ' + num(result[row][col]);
      api.focus.target('entry-calculation', () =>
        text(ctx, api, displayed, 1050, 870, 42, themeColors.yellow, 'center', 'mono'),
      );
    });
    fade(ctx, api, stage(2, 0.55, 0.82), () =>
      math(ctx, api, 'BA=b_1a_1^T+b_2a_2^T', 960, 973, 45, themeColors.ink, 'center'),
    );
  }
  ctx.restore();
}
export default {
  id: 'factorization',
  draw: drawFactorization,
  cues: ['factorization-b1-1', 'factorization-b1-2', 'factorization-b2-1', 'factorization-b3-1'],
};
