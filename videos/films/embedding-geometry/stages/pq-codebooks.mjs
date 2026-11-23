import { PQ_PAIRS } from '../fixtures.mjs';
import { cell, geometryText, heading } from '../defaults.mjs';
export function drawPqCodebooks(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z);
  {
    heading(ctx, api, 'Supplied 8D toy · four 2D codebooks · each has centroids 0 and 1');
    const q = cueProgress(),
      colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow];
    if (currentBeat < 2) {
      PQ_PAIRS.forEach((pair, i) => {
        const x = 210 + i * 410,
          col = colors[i];
        geometryText(ctx, api, 'Subspace ' + i, x + 165, 345, 30, col, 'center');
        const a = api.teaching.axes({
          x,
          y: 430,
          width: 330,
          height: 360,
          xDomain: [-0.5, 6],
          yDomain: [-0.5, 6],
          xTicks: [],
          yTicks: [],
          equalUnits: true,
          xLabel: 'coordinate ' + i * 2,
          yLabel: '',
        });
        const zero = a.point(0, 0),
          one = a.point(...pair);
        if (currentBeat === 0) {
          [
            [-0.16, 0],
            [0.16, 0],
            [0, -0.16],
            [0, 0.16],
          ].forEach(([dx, dy]) => {
            const z = a.point(pair[0] + dx * (1 - q), pair[1] + dy * (1 - q));
            api.circle(ctx, z.x, z.y, 5, col);
          });
          api.circle(ctx, zero.x, zero.y, 8, themeColors.muted);
          api.circle(ctx, one.x, one.y, 8, col);
          geometryText(
            ctx,
            api,
            'separate k-means slices',
            x + 165,
            900,
            24,
            themeColors.muted,
            'center',
          );
        } else {
          api.circle(ctx, zero.x, zero.y, 9, themeColors.muted);
          api.circle(ctx, one.x, one.y, 13, col);
          geometryText(ctx, api, '[' + pair.join(', ') + ']', x + 165, 900, 28, col, 'center');
          if (q > (i + 1) / 5) cell(ctx, api, 'ID 1', x + 65, 970, 200, 65, col);
        }
      });
      if (currentBeat === 0)
        geometryText(
          ctx,
          api,
          'Schematic centroid update · nearest-codeword reconstruction objective',
          960,
          1020,
          29,
          themeColors.yellow,
          'center',
        );
    } else {
      geometryText(
        ctx,
        api,
        'Toy byte storage: four bytes, each holding centroid ID 1',
        960,
        350,
        34,
        themeColors.ink,
        'center',
      );
      for (let i = 0; i < 4; i++) {
        const x = 240 + i * 410;
        for (let j = 0; j < 8; j++) {
          api.rect(
            ctx,
            x + j * 40,
            470,
            34,
            65,
            j === 7 ? colors[i] : themeColors.panel,
            themeColors.muted,
            2,
          );
          geometryText(
            ctx,
            api,
            j === 7 ? '1' : '0',
            x + j * 40 + 17,
            514,
            24,
            j === 7 ? themeColors.bg : themeColors.muted,
            'center',
          );
        }
        geometryText(ctx, api, 'subspace ' + i, x + 155, 640, 28, colors[i], 'center');
      }
      geometryText(
        ctx,
        api,
        'Two centroids need one logical bit per subspace: 1111',
        960,
        805,
        38,
        themeColors.yellow,
        'center',
      );
      geometryText(
        ctx,
        api,
        'Separate sizing contract: 96 subspaces × 8-bit IDs = 96 B / row',
        960,
        990,
        33,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'pq-codebooks',
  draw: drawPqCodebooks,
  cues: [],
};
