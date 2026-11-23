import { seedRows } from '../fixtures.mjs';
import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionMid,
  drawResearchConstructionRect,
} from '../defaults.mjs';
export function drawResourceAxis(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('resource-axis', state),
    currentBeat = modelState.b;
  api.focus.target('rs-resource-axis-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      '80 episodes per arm   /   Training transitions per seed',
    );
    const max = 900,
      x = 240,
      w = 58;
    seedRows.forEach((r, i) => {
      const hA = (r.steps_sparse / max) * 400,
        hB = (r.steps_shaped / max) * 400;
      drawResearchConstructionRect(
        ctx,
        api,
        x + i * w,
        800 - hA,
        22,
        hA,
        themeColors.blue,
        undefined,
      );
      drawResearchConstructionRect(
        ctx,
        api,
        x + i * w + 25,
        800 - hB,
        22,
        hB,
        themeColors.cyan,
        undefined,
      );
      if (i % 4 === 0)
        drawResearchConstructionMid(ctx, api, r.seed, x + i * w + 22, 850, 25, themeColors.muted);
    });
    drawResearchConstructionMid(
      ctx,
      api,
      'Training seed identity',
      960,
      900,
      28,
      themeColors.muted,
    );
    if (modelState.meansVisible)
      drawResearchConstructionMid(
        ctx,
        api,
        'Mean transitions per seed: sparse 773.2, shaped 754.7',
        960,
        355,
        34,
        themeColors.yellow,
      );
    else
      drawResearchConstructionMid(
        ctx,
        api,
        'All retained transition counts, not inferred wall-clock time',
        960,
        355,
        32,
        themeColors.muted,
      );
    drawResearchConstructionFooter(
      ctx,
      api,
      currentBeat
        ? 'A same-step or wall-clock study needs a separately controlled budget'
        : 'Blue sparse · cyan shaped · episode completion changes consumed steps',
    );
  });
}
export default {
  id: 'resource-axis',
  draw: drawResourceAxis,
  cues: [
    'rs-resource-axis-0',
    'rsx-resource-axis-b0-s0',
    'rsx-resource-axis-b0-s1',
    'rsx-resource-axis-b0-s2',
    'rs-resource-axis-1',
    'rsx-resource-axis-b1-s0',
    'rsx-resource-axis-b1-s1',
    'rsx-resource-axis-b1-s2',
  ],
};
