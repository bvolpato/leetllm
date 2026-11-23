import { boundedContext } from '../arithmetic.mjs';
import {
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteLine,
  drawCompleteRecord,
  drawCompleteRectangle,
  drawCompleteText,
  drawFieldCells,
} from '../defaults.mjs';
export function drawCacheCostScope(ctx, scene, state, api) {
  if (paintCacheCostScope(ctx, scene, state, api)) return;
}
function paintCacheCostScope(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  drawCompleteFocus(ctx, api, 'ce-cache-cost-scope-mechanism', () => {
    drawCompleteHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'Reuse computed prefix state; retain the logical input'
        : currentBeat === 1
          ? 'Account for each actual usage category'
          : 'Authorize content before assembling the request',
    );
    const lengths = [352, 12],
      scale = 1500 / 364;
    let start = 180;
    lengths.forEach((units, i) => {
      drawCompleteRectangle(
        ctx,
        api,
        start,
        420,
        units * scale,
        110,
        themeColors.panel,
        i ? themeColors.yellow : themeColors.blue,
        2,
      );
      if (!i)
        drawCompleteText(
          ctx,
          api,
          'reused prefix352 still occupies input',
          start + 25,
          485,
          30,
          themeColors.blue,
        );
      start += units * scale;
    });
    if (currentBeat === 0) {
      drawCompleteLine(ctx, api, 180, 590, 1680, 590, themeColors.cyan, 3);
      drawCompleteText(ctx, api, 'complete input capacity:364', 180, 665, 33, themeColors.cyan);
      drawCompleteRecord(
        ctx,
        api,
        'task support',
        'misleading claims remain misleading after a cache hit',
        180,
        800,
        1500,
        themeColors.pink,
        110,
      );
    } else if (currentBeat === 1) {
      drawFieldCells(
        ctx,
        api,
        ['cache write', 'cache read', 'new input', 'output'],
        180,
        700,
        355,
        115,
        themeColors.cyan,
      );
      drawCompleteText(
        ctx,
        api,
        'provider + model + request modifiers',
        180,
        935,
        34,
        themeColors.yellow,
      );
    } else {
      drawCompleteRecord(
        ctx,
        api,
        'trusted caller scope',
        'admit only this principal’s allowed evidence',
        180,
        690,
        740,
        themeColors.green,
        120,
      );
      drawCompleteRecord(
        ctx,
        api,
        'cache group key',
        'routing/accounting · not access permission',
        1030,
        690,
        710,
        themeColors.yellow,
        120,
      );
    }
    drawCompleteFooter(
      ctx,
      api,
      'Reuse, logical capacity, task quality and permission are different measured contracts.',
    );
  });
  return true;
}
export default {
  id: 'cache-cost-scope',
  draw: drawCacheCostScope,
  cues: ['ce-cache-cost-scope-1', 'ce-cache-cost-scope-2', 'ce-cache-cost-scope-3'],
};
