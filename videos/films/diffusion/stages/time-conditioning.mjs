import { completed, opProgress } from '../construction.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionEquation,
  drawConstructionFocus,
  drawConstructionFooter,
  drawConstructionGrid,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawTimeConditioning(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'time-conditioning'),
    done = (name) => completed(state, name),
    result = (fn) => drawConstructionFocus(ctx, api, 'df-time-conditioning-result', fn);
  {
    drawConstructionTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'Timestep features modulate shared network weights'
        : 'Apply the same feature operation with two supplied controls',
    );
    if (currentBeat === 0) {
      drawConstructionBox(
        ctx,
        api,
        'Timestep embedding',
        170,
        400,
        700,
        themeColors.yellow,
        110,
        33,
      );
      drawConstructionBox(
        ctx,
        api,
        'Scale + shift + gate',
        1050,
        400,
        700,
        themeColors.pink,
        110,
        33,
      );
      drawConstructionArrow(ctx, api, 900, 455, 1020, 455);
      drawConstructionEquation(ctx, api, String.raw`h'=(1+s)h+b`, 960, 790, 70);
      drawConstructionFooter(
        ctx,
        api,
        'Adaptive normalization and residual gates vary by architecture',
      );
    } else
      result(() => {
        drawConstructionGrid(
          ctx,
          api,
          [
            ['Feature h', '0.2', '−0.1', '0.5'],
            [
              's = 0.5 / b = −0.05',
              ...(done('mod-first') ? ['0.25', '−0.20', '0.70'] : ['?', '?', '?']),
            ],
            [
              's = 0.05 / b = 0.02',
              ...(done('mod-second') ? ['0.23', '−0.085', '0.545'] : ['?', '?', '?']),
            ],
          ],
          170,
          430,
          1580,
          300,
          themeColors.cyan,
          28,
        );
        drawConstructionFooter(
          ctx,
          api,
          'First feature:  0.20 × (1 + scale) + shift',
        );
      });
    return;
  }
}
export default {
  id: 'time-conditioning',
  draw: drawTimeConditioning,
  cues: ['df-time-conditioning-0', 'df-time-conditioning-1', 'df-mod-first', 'df-mod-second'],
};
