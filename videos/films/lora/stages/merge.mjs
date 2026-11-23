import { EXAMPLE } from '../fixtures.mjs';
import { forward } from '../model.mjs';
import { text, math, rect, fade, matrix } from '../defaults.mjs';
export function drawMerge(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    const result = forward(2),
      reveal = stage(0, 0.08, 0.4);
    text(ctx, api, 'BASE', 330, 285, 30, themeColors.blue, 'center');
    text(ctx, api, 'SCALED UPDATE', 830, 285, 30, themeColors.yellow, 'center');
    text(ctx, api, 'MERGED', 1430, 285, 30, themeColors.green, 'center');
    api.focus.target('base-matrix', () =>
      matrix(ctx, api, EXAMPLE.W, 230, 365, 100, themeColors.blue),
    );
    api.focus.target('update-matrix', () =>
      matrix(ctx, api, result.update, 730, 365, 100, themeColors.yellow),
    );
    math(ctx, api, '+', 575, 500, 65, themeColors.ink, 'center');
    text(ctx, api, '=', 1120, 500, 65, themeColors.ink, 'center');
    api.focus.target('merged-matrix', () =>
      matrix(ctx, api, result.merged, 1330, 365, 100, themeColors.green, {
        reveal,
      }),
    );
    api.focus.target('merge-identity', () =>
      math(ctx, api, '(W_0+sBA)x=W_0x+sB(Ax)', 960, 715, 52, themeColors.ink, 'center'),
    );
    fade(ctx, api, stage(1), () => {
      text(ctx, api, 'x = [2, 1]', 430, 835, 37, themeColors.cyan, 'center', 'mono');
      text(ctx, api, 'both outputs = [5, 12]', 1150, 835, 42, themeColors.green, 'center', 'mono');
    });
    fade(ctx, api, stage(2), () => {
      const names = ['adapter A', 'adapter B', 'adapter C'];
      names.forEach((name, i) => {
        const x = 420 + i * 410;
        const tab = rect(
          ctx,
          api,
          x,
          915,
          330,
          80,
          themeColors.panel,
          i === 1 ? themeColors.yellow : themeColors.muted,
          14,
        );
        api.container(
          ctx,
          tab,
          () => {
            text(
              ctx,
              api,
              name,
              x + 165,
              967,
              31,
              i === 1 ? themeColors.yellow : themeColors.muted,
              'center',
            );
          },
          {
            padding: 8,
          },
        );
      });
    });
  }
  ctx.restore();
}
export default {
  id: 'merge',
  draw: drawMerge,
  cues: ['merge-b1-1', 'merge-b1-2', 'merge-b2-1', 'merge-b3-1'],
};
