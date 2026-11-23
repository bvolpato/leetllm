import { rsClamp } from '../arithmetic.mjs';
import { researchEvent } from '../construction.mjs';
import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionDot,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionMid,
  drawResearchConstructionRect,
} from '../defaults.mjs';
export function drawFrozenPolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('frozen-policy', state),
    currentBeat = modelState.b;
  const E = (beat, sentence) => researchEvent('frozen-policy', state, beat, sentence);
  api.focus.target('rs-frozen-policy-mechanism', () => {
    drawResearchConstructionHeader(ctx, api, 'Seed 18   /   Greedy actions after training');
    for (let j = 0; j < 6; j++) {
      drawResearchConstructionBox(
        ctx,
        api,
        String(j),
        230 + j * 245,
        345,
        185,
        75,
        themeColors.muted,
        31,
      );
      const dir = modelState.actions[j] === 0 ? -1 : 1;
      drawResearchConstructionArrow(
        ctx,
        api,
        322 + j * 245,
        510,
        322 + j * 245 + dir * 65,
        510,
        j ? themeColors.cyan : themeColors.pink,
      );
    }
    const escape = currentBeat === 0 ? rsClamp((E(0, 2) - 0.45) / 0.55) : 1;
    drawResearchConstructionDot(ctx, api, 322 + 245 * escape, 575, themeColors.yellow, 14);
    drawResearchConstructionMid(
      ctx,
      api,
      'Both choose left at state 0. A slip lets them leave.',
      960,
      635,
      32,
      themeColors.yellow,
    );
    if (currentBeat >= 1) {
      for (let j = 0; j < 200; j++)
        drawResearchConstructionRect(
          ctx,
          api,
          260 + (j % 40) * 35,
          700 + Math.floor(j / 40) * 32,
          23,
          20,
          modelState.rateVisible
            ? j < 91
              ? themeColors.cyan
              : themeColors.muted
            : themeColors.panel,
          themeColors.muted,
        );
      if (modelState.rateVisible)
        drawResearchConstructionMid(
          ctx,
          api,
          '91 / 200 = 45.5% in both arms   /   Difference 0',
          960,
          938,
          35,
          themeColors.yellow,
        );
    }
    drawResearchConstructionFooter(
      ctx,
      api,
      'Theorem assumptions do not certify finite-budget convergence',
    );
  });
}
export default {
  id: 'frozen-policy',
  draw: drawFrozenPolicy,
  cues: [
    'rs-frozen-policy-0',
    'rsx-frozen-policy-b0-s0',
    'rsx-frozen-policy-b0-s1',
    'rsx-frozen-policy-b0-s2',
    'rs-frozen-policy-1',
    'rsx-frozen-policy-b1-s0',
    'rsx-frozen-policy-b1-s1',
    'rsx-frozen-policy-b1-s2',
  ],
};
