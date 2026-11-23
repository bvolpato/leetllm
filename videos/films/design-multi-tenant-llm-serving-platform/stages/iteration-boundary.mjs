import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionText,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawIterationBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('iteration-boundary', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'iteration-boundary', () => {
    if (currentBeat === 0) {
      const columns = [340, 750, 1160, 1570];
      columns.forEach((x, i) => {
        drawConstructionCenter(ctx, api, 'Iteration ' + i, x, 355, 29, themeColors.muted);
        if (i <= modelState.iteration) {
          drawConstructionBox(
            ctx,
            api,
            'A continues',
            x - 150,
            440,
            300,
            100,
            themeColors.blue,
            29,
          );
          if (i === 0)
            drawConstructionBox(
              ctx,
              api,
              'X completes',
              x - 150,
              635,
              300,
              100,
              themeColors.yellow,
              28,
            );
          else
            drawConstructionBox(
              ctx,
              api,
              'B admitted',
              x - 150,
              635,
              300,
              100,
              themeColors.pink,
              29,
            );
        }
      });
      if (modelState.membershipVisible)
        drawConstructionCenter(
          ctx,
          api,
          'Membership changes between steps; A keeps its history',
          960,
          890,
          33,
          themeColors.green,
        );
    } else if (currentBeat === 1) {
      drawConstructionText(ctx, api, 'One long prompt', 160, 340, 31, themeColors.yellow);
      const filled = Math.floor(modelState.chunkProgress * 6);
      for (let i = 0; i < 6; i++) {
        const x = 160 + i * 285;
        drawConstructionBox(
          ctx,
          api,
          'P' + (i + 1),
          x,
          410,
          240,
          100,
          i < filled ? themeColors.muted : themeColors.yellow,
          32,
        );
        drawConstructionBox(ctx, api, 'Decode step', x, 675, 240, 100, themeColors.cyan, 28);
        if (i < filled) {
          drawConstructionArrow(ctx, api, x + 120, 535, x + 120, 640, themeColors.yellow);
          drawConstructionCenter(ctx, api, 'bounded chunk', x + 120, 860, 25, themeColors.muted);
        }
      }
      drawConstructionCenter(
        ctx,
        api,
        'Prefill chunks interleave with existing decode',
        960,
        955,
        33,
        themeColors.green,
      );
    } else {
      drawConstructionBox(
        ctx,
        api,
        'Pending decode work',
        160,
        355,
        680,
        120,
        themeColors.cyan,
        33,
      );
      drawConstructionBox(
        ctx,
        api,
        'Queued prompt work',
        1090,
        355,
        680,
        120,
        themeColors.yellow,
        33,
      );
      drawConstructionText(ctx, api, 'Iteration token budget', 160, 620, 31, themeColors.ink);
      for (let i = 0; i < 8; i++) {
        const decode = i < modelState.decodeSlots;
        const prefill = i >= 3 && i < 3 + modelState.promptSlots;
        drawConstructionBox(
          ctx,
          api,
          decode ? 'D' : prefill ? 'P' : '',
          180 + i * 200,
          700,
          150,
          100,
          decode ? themeColors.cyan : prefill ? themeColors.yellow : themeColors.muted,
          34,
        );
      }
    }
    drawConstructionFoot(
      ctx,
      api,
      currentBeat === 2
        ? 'vLLM chunked prefill policy · November 2026'
        : 'New work joins between model steps',
    );
  });
}
export default {
  id: 'iteration-boundary',
  draw: drawIterationBoundary,
  cues: [
    'mt-iteration-boundary-b0',
    'mt-iteration-boundary-s0-1',
    'mt-iteration-boundary-b1',
    'mt-iteration-boundary-s1-1',
    'mt-iteration-boundary-b2',
    'mt-iteration-boundary-s2-0',
    'mt-iteration-boundary-s2-1',
  ],
};
