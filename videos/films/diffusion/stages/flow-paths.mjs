import { completed, opProgress } from '../construction.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionEquation,
  drawConstructionFocus,
  drawConstructionFooter,
  drawConstructionRows,
  drawConstructionText,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawFlowPaths(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'flow-paths'),
    done = (name) => completed(state, name),
    result = (fn) => drawConstructionFocus(ctx, api, 'df-flow-paths-result', fn);
  {
    drawConstructionTitle(ctx, api, 'Declared direction: tau 0 = data · tau 1 = noise');
    drawConstructionEquation(
      ctx,
      api,
      String.raw`x_\tau=(1-\tau)x_{data}+\tau x_{noise}`,
      960,
      420,
      49,
    );
    if (currentBeat === 0) {
      drawConstructionBox(ctx, api, 'Data +1', 180, 650, 650, themeColors.blue, 110, 39);
      drawConstructionBox(ctx, api, 'Noise −1', 1090, 650, 650, themeColors.pink, 110, 39);
      drawConstructionArrow(ctx, api, 865, 705, 1050, 705, themeColors.yellow);
      drawConstructionFooter(
        ctx,
        api,
        'Training pair target = noise − data · different from rotational diffusion v',
      );
    } else if (currentBeat === 1)
      result(() => {
        drawConstructionRows(
          ctx,
          api,
          [
            ['Pair velocity', done('flow-velocity') ? '−1 − 1 = −2' : '?'],
            ['Sampling delta tau', '−0.25'],
            ['Euler state', done('flow-step') ? '−1 + (−0.25)(−2) = −0.5' : '?'],
          ],
          550,
          140,
        );
      });
    else {
      const pts = Array.from(
        {
          length: 80,
        },
        (_, i) => ({
          x: 240 + i * 18,
          y: 650 + 130 * Math.sin((i / 79) * Math.PI),
        }),
      );
      api.trace(ctx, pts, progress, themeColors.cyan, 6);
      drawConstructionText(
        ctx,
        api,
        'Illustrative curve · no trained-field trajectory measured',
        960,
        920,
        28,
        themeColors.yellow,
        'center',
      );
      drawConstructionFooter(
        ctx,
        api,
        'A conditional average over intersecting training pairs can generate curved paths',
      );
    }
    return;
  }
}
export default {
  id: 'flow-paths',
  draw: drawFlowPaths,
  cues: [
    'df-flow-paths-0',
    'df-flow-paths-1',
    'df-flow-velocity',
    'df-flow-step',
    'df-flow-paths-2',
  ],
};
