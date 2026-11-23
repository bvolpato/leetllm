import { l2 } from '../arithmetic.mjs';
import { geometryText, heading, line, vector } from '../defaults.mjs';
export function drawPqTransform(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z);
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Supplied codebook · q [1,0] · original unit A [1,0], B [0.8,0.6]');
      const q = cueProgress(),
        a = api.teaching.axes({
          x: 260,
          y: 400,
          width: 850,
          height: 490,
          xDomain: [-0.2, 1.3],
          yDomain: [-0.2, 1.3],
          xTicks: [],
          yTicks: [],
          equalUnits: true,
          xLabel: 'coordinate0',
          yLabel: 'coordinate1',
        }),
        av = [1 - 0.2 * q, 0],
        bv = [0.8, 0.6 + 0.2 * q];
      vector(ctx, api, a, av, themeColors.blue);
      vector(ctx, api, a, bv, themeColors.pink);
      vector(ctx, api, a, [1, 0], themeColors.cyan);
      geometryText(
        ctx,
        api,
        'Centroids Â[0.8,0], B̂[0.8,0.8]',
        1460,
        400,
        29,
        themeColors.muted,
        'center',
      );
      geometryText(
        ctx,
        api,
        'Norms: ' + Math.hypot(...av).toFixed(3) + ' / ' + Math.hypot(...bv).toFixed(3),
        1460,
        560,
        34,
        themeColors.yellow,
        'center',
      );
      geometryText(
        ctx,
        api,
        'IP: ' + av[0].toFixed(2) + ' / ' + bv[0].toFixed(2),
        1460,
        700,
        34,
        themeColors.ink,
        'center',
      );
      geometryText(
        ctx,
        api,
        'L2²: ' + (l2([1, 0], av) ** 2).toFixed(2) + ' / ' + (l2([1, 0], bv) ** 2).toFixed(2),
        1460,
        820,
        32,
        themeColors.ink,
        'center',
      );
      geometryText(
        ctx,
        api,
        q > 0.98
          ? 'Equal reconstructed IP scores hide unequal lengths and distances'
          : 'Quantization changes reconstructed lengths and distances',
        960,
        1030,
        30,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 1) {
      heading(ctx, api, 'Same orthonormal transform on query and document · before quantization');
      const theta = (cueProgress() * Math.PI) / 2,
        rotate = (v) => [
          v[0] * Math.cos(theta) - v[1] * Math.sin(theta),
          v[0] * Math.sin(theta) + v[1] * Math.cos(theta),
        ],
        a = api.teaching.axes({
          x: 230,
          y: 380,
          width: 1000,
          height: 540,
          xDomain: [-1.3, 1.3],
          yDomain: [-1.3, 1.3],
          xTicks: [],
          yTicks: [],
          equalUnits: true,
          xLabel: 'rotated coordinate0',
          yLabel: 'rotated coordinate1',
        });
      vector(ctx, api, a, rotate([1, 0]), themeColors.cyan);
      vector(ctx, api, a, rotate([0.6, 0.8]), themeColors.blue);
      geometryText(ctx, api, 'q·d = 0.60', 1490, 500, 42, themeColors.cyan, 'center');
      geometryText(ctx, api, '||q−d||² = 0.80', 1490, 680, 40, themeColors.blue, 'center');
      geometryText(
        ctx,
        api,
        'OPQ learns transform + codebooks; exact geometry is preserved before coding',
        960,
        1035,
        29,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 2) {
      heading(
        ctx,
        api,
        'Residual code origin · coarse c=[4,2], document x=[4.8,2.1], query q=[5,2]',
      );
      const a = api.teaching.axes({
          x: 250,
          y: 390,
          width: 1000,
          height: 500,
          xDomain: [-0.2, 5.6],
          yDomain: [-0.2, 3],
          xTicks: [0, 2, 4],
          yTicks: [],
          equalUnits: true,
          xLabel: 'coordinate0',
          yLabel: '',
        }),
        c = a.point(4, 2),
        x = a.point(4.8, 2.1),
        r = a.point(0.8, 0.1),
        qq = a.point(5, 2);
      api.circle(ctx, c.x, c.y, 12, themeColors.yellow);
      api.circle(ctx, x.x, x.y, 12, themeColors.blue);
      api.circle(ctx, r.x, r.y, 12, themeColors.pink);
      api.circle(ctx, qq.x, qq.y, 6, themeColors.cyan);
      line(ctx, api, c.x, c.y, x.x, x.y, themeColors.blue, 6);
      geometryText(ctx, api, 'c', c.x - 35, c.y + 45, 27, themeColors.yellow);
      geometryText(ctx, api, 'x', x.x - 30, x.y - 35, 27, themeColors.blue);
      geometryText(ctx, api, 'residual', r.x, r.y - 35, 27, themeColors.pink, 'center');
      geometryText(ctx, api, 'r = x − c = [0.8,0.1]', 1510, 430, 30, themeColors.blue, 'center');
      geometryText(ctx, api, '||q − (c+r)||² = 0.05', 1510, 610, 32, themeColors.green, 'center');
      geometryText(ctx, api, '||q − r||² = 21.25', 1510, 790, 32, themeColors.pink, 'center');
      geometryText(
        ctx,
        api,
        'A residual ID without its coarse centroid uses the wrong origin',
        960,
        1030,
        33,
        themeColors.yellow,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'pq-transform',
  draw: drawPqTransform,
  cues: [],
};
