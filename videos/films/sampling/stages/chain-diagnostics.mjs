import { samplingFilmData } from '../fixtures.mjs';
import { cueStep, samplingExtensionModel } from '../construction.mjs';
import {
  drawSamplingExtensionD,
  drawSamplingExtensionFooter,
  drawSamplingExtensionL,
  drawSamplingExtensionNum,
  drawSamplingExtensionPlot,
} from '../defaults.mjs';
export function drawChainDiagnostics(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = samplingExtensionModel(state, 'chain-diagnostics'),
    currentBeat = f.beat,
    progress = f.progress,
    col = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  api.focus.target('sp-chain-diagnostics-visual', () => {
    if (currentBeat === 0) {
      const q = drawSamplingExtensionPlot(
        ctx,
        api,
        [0, 240],
        [0, 1],
        240,
        365,
        1070,
        455,
        'iteration, split into halves',
        'chain state',
      );
      samplingFilmData.chains.forEach((c, i) =>
        api.teaching.curve({
          plot: q,
          points: c.first240.map((y, x) => ({
            x: x + 1,
            y,
          })),
          color: col[i],
          width: 2,
        }),
      );
      if (progress > 0)
        drawSamplingExtensionL(
          ctx,
          api,
          [q.point(120.5, 0), q.point(120.5, progress)],
          themeColors.yellow,
          4,
        );
      drawSamplingExtensionNum(ctx, api, 'Across / within chains', 'rank split R-hat', 420);
      drawSamplingExtensionNum(
        ctx,
        api,
        'Across serial lags',
        'bulk / tail ESS',
        650,
        themeColors.yellow,
      );
    } else {
      const q = drawSamplingExtensionPlot(
        ctx,
        api,
        [-3, 3],
        [-3, 3],
        300,
        365,
        1020,
        455,
        'x',
        'y',
      );
      for (const radius of [0.6, 1.2, 1.8, 2.4]) {
        const points = Array.from(
          {
            length: 101,
          },
          (_, i) => {
            const a = (i / 100) * 2 * Math.PI,
              u = radius * Math.cos(a),
              v = radius * 0.6 * Math.sin(a);
            return q.point(u, 0.8 * u + v);
          },
        );
        drawSamplingExtensionL(ctx, api, points, themeColors.blue + '90', 2);
      }
      const moveX = cueStep(state, 'sp-chain-diagnostics-2', 2, 0.18, 0.46);
      const moveY = cueStep(state, 'sp-gibbs-y', 2, 0.52, 0.79);
      const x = 2 - 3.6 * moveX,
        y = -2 + 0.72 * moveY;
      const start = q.point(2, -2),
        end = q.point(x, y);
      drawSamplingExtensionL(ctx, api, [start, q.point(x, -2), end], themeColors.yellow, 5);
      drawSamplingExtensionD(ctx, api, start.x, start.y, themeColors.muted, 10);
      drawSamplingExtensionD(ctx, api, end.x, end.y, themeColors.yellow, 15);
      drawSamplingExtensionNum(ctx, api, 'Conditional mean', '.8 × other', 400);
      drawSamplingExtensionNum(ctx, api, 'Conditional spread', '.6', 590);
      drawSamplingExtensionNum(
        ctx,
        api,
        'Current (x, y)',
        '(' + x.toFixed(2) + ', ' + y.toFixed(2) + ')',
        800,
        themeColors.yellow,
      );
    }
    drawSamplingExtensionFooter(
      ctx,
      api,
      currentBeat === 0
        ? 'Four chains after warmup'
        : currentBeat === 1
          ? 'Draw x given y, then draw y given the new x'
          : 'Following the conditional median on each move',
    );
  });
}
export default {
  id: 'chain-diagnostics',
  draw: drawChainDiagnostics,
  cues: [
    'sp-chain-diagnostics-0',
    'sp-chain-diagnostics-1',
    'sp-chain-diagnostics-2',
    'sp-gibbs-y',
  ],
};
