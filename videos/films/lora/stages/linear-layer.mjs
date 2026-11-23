import { sum, scale, point } from '../geometry.mjs';
import { text, math, arrow, fade, matrix, axes2 } from '../defaults.mjs';
export function drawLinearLayer(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    const map = axes2(ctx, api, point(490, 720), 100);
    const c1 = [1, 1.5],
      c2 = [1.5, -0.5],
      x = [1.5, 1];
    const u = scale(c1, api.lerp(1, x[0], stage(1, 0.04, 0.35))),
      v = scale(c2, stage(1, 0.35, 0.7));
    const o = map([0, 0]),
      tip = map(u),
      end = map(sum(u, v));
    api.focus.target('first-column', () => arrow(ctx, api, o, tip, themeColors.blue, 7));
    fade(ctx, api, stage(0), () => arrow(ctx, api, o, map(c2), themeColors.cyan, 4));
    if (stage(1, 0.35, 0.7) > 0)
      api.focus.target('second-column', () => arrow(ctx, api, tip, end, themeColors.cyan, 6));
    if (stage(1, 0.65, 0.88) > 0)
      api.focus.target('column-sum', () => arrow(ctx, api, o, end, themeColors.yellow, 5));
    text(ctx, api, 'COLUMN VECTORS', 170, 285, 30, themeColors.muted);
    math(ctx, api, 'h=x_1w_1+x_2w_2', 1390, 335, 46, themeColors.ink, 'center');
    api.focus.target('weight-matrix', () =>
      matrix(
        ctx,
        api,
        [
          [1, 1.5],
          [1.5, -0.5],
        ],
        1210,
        440,
        100,
        themeColors.blue,
      ),
    );
    text(ctx, api, 'weight matrix W', 1310, 720, 30, themeColors.blue, 'center');
    text(ctx, api, 'input coordinates', 1640, 420, 28, themeColors.muted, 'center');
    matrix(ctx, api, [[1.5], [1]], 1590, 470, 100, themeColors.cyan);
    fade(ctx, api, stage(1, 0.7, 0.9), () => {
      math(
        ctx,
        api,
        String.raw`h=\begin{bmatrix}3 \\ 1.75\end{bmatrix}`,
        1380,
        865,
        48,
        themeColors.yellow,
        'center',
      );
    });
    fade(ctx, api, stage(2), () => undefined);
  }
  ctx.restore();
}
export default {
  id: 'linear-layer',
  draw: drawLinearLayer,
  cues: [
    'linear-layer-b1-1',
    'linear-layer-b2-1',
    'linear-layer-b2-2',
    'linear-layer-b2-3',
    'linear-layer-b3-1',
  ],
};
