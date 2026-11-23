import { sparseFrame } from '../model.mjs';
import { caption, equation, target, text } from '../defaults.mjs';
export function drawPcaSparse(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const c = sparseFrame(state);
    text(ctx, api, 'sparse word counts', 530, 300, 36, themeColors.blue, 'center');
    text(ctx, api, 'centered signs: + and −', 1410, 300, 34, themeColors.pink, 'center');
    const cells = (x, values, active) =>
      values.forEach((row, i) =>
        row.forEach((v, j) => {
          const left = x + j * 73,
            top = 360 + i * 73;
          api.rect(
            ctx,
            left,
            top,
            61,
            61,
            Math.abs(v) > 1e-12 ? (active ? '#f49ac244' : '#6fa9ff44') : themeColors.panel,
            Math.abs(v) > 1e-12 ? (active ? themeColors.pink : themeColors.blue) : '#8d9cb944',
            1,
            0,
          );
          text(
            ctx,
            api,
            Math.abs(v) < 1e-12 ? '0' : active ? (v < 0 ? '−' : '+') : '1',
            left + 30,
            top + 42,
            29,
            Math.abs(v) > 1e-12
              ? active
                ? themeColors.pink
                : themeColors.blue
              : themeColors.muted,
            'center',
          );
        }),
      );
    cells(
      310,
      sparseFrame({
        cues: {
          'sparse-center': {
            phase: 'before',
            progress: 0,
          },
        },
      }).values,
      false,
    );
    target(ctx, api, 'sparse-center', () => cells(1190, c.values, true));
    api.arrow(ctx, 840, 575, 1075, 575, themeColors.yellow, 6);
    equation(ctx, api, '-\\mu', 960, 505, 43, themeColors.yellow);
    text(ctx, api, '6 stored nonzeros', 530, 875, 34, themeColors.blue, 'center');
    text(ctx, api, c.nonzeros + ' nonzeros', 1410, 875, 34, themeColors.pink, 'center');
    caption(
      ctx,
      api,
      'Sparse-aware PCA centers implicitly · uncentered SVD measures energy from the original origin',
    );
  }
}
export default {
  id: 'pca-sparse',
  draw: drawPcaSparse,
  cues: ['sparse-center'],
};
