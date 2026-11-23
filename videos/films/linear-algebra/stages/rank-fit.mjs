import { complete } from '../arithmetic.mjs';
import { duplicateFitFrame } from '../model.mjs';
import { caption, curve, equation, plane, ring, target, text } from '../defaults.mjs';
export function drawRankFit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const f = (v, n = 2) => (Math.abs(v) < 0.5 * 10 ** -n ? 0 : v).toFixed(n);
  {
    const c = duplicateFitFrame(state),
      q = plane(ctx, api, [-0.4, 4.8, -0.5, 2.8], 190, 330, 1540, 515);
    curve(
      ctx,
      api,
      q,
      [
        [0, 0],
        [4.7, 0],
      ],
      '#6fa9ffbb',
      5,
    );
    equation(ctx, api, 'Bw=[s,0,s]^T,\\quad s=w_1+w_2', 960, 265, 41, themeColors.blue);
    const y = q.point(...c.targetCoordinates),
      p = q.point(...c.outputCoordinates),
      origin = q.point(0, 0);
    ring(ctx, api, y, themeColors.yellow, 13);
    text(ctx, api, 'same target y = (1, 2, 2)', y.x + 35, y.y - 28, 33, themeColors.yellow);
    target(ctx, api, 'duplicate-fit', () => {
      api.arrow(ctx, origin.x, origin.y, p.x, p.y, themeColors.green, 7);
      api.line(ctx, p.x, p.y, y.x, y.y, themeColors.pink, 5);
      text(ctx, api, 's = ' + f(c.sum), p.x, p.y + 62, 37, themeColors.green, 'center');
      if (complete(c.progress)) {
        api.path(
          ctx,
          [
            {
              x: p.x,
              y: p.y - 28,
            },
            {
              x: p.x + 28,
              y: p.y - 28,
            },
            {
              x: p.x + 28,
              y: p.y,
            },
          ],
          {
            color: themeColors.pink,
            width: 3,
          },
        );
        equation(ctx, api, 'c_1^Tr=0', 1420, 520, 43, themeColors.pink);
      }
    });
    equation(
      ctx,
      api,
      complete(c.progress) ? 's_*=\\frac{1+2}{2}=1.5' : '\\min_s\\; (s-1)^2+2^2+(s-2)^2',
      960,
      935,
      45,
      themeColors.green,
    );
    caption(
      ctx,
      api,
      'Orthogonal cross-section of three-output space · the middle prediction stays zero',
    );
  }
}
export default {
  id: 'rank-fit',
  draw: drawRankFit,
  cues: ['duplicate-fit'],
};
