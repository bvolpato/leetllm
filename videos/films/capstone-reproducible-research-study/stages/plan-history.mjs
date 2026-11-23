import { researchEvent } from '../construction.mjs';
import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionDot,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionLine,
  drawResearchConstructionResult,
} from '../defaults.mjs';
export function drawPlanHistory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('plan-history', state),
    currentBeat = modelState.b;
  const E = (beat, sentence) => researchEvent('plan-history', state, beat, sentence),
    resultComplete = (beat, sentence) => E(beat, sentence) === 1;
  api.focus.target('rs-plan-history-mechanism', () => {
    drawResearchConstructionHeader(ctx, api, 'Preserve what was known before each plan version');
    const xs = [260, 700, 1140, 1580],
      names = ['Pilot debugging', 'Observed seeds 0..23', 'Frozen new plan', 'Untouched sample'];
    drawResearchConstructionLine(ctx, api, 220, 475, 1690, 475, themeColors.muted, 4);
    names.forEach((n, i) => {
      drawResearchConstructionDot(
        ctx,
        api,
        xs[i],
        475,
        i < 2 ? themeColors.yellow : themeColors.cyan,
        13,
      );
      drawResearchConstructionBox(
        ctx,
        api,
        n,
        xs[i] - 175,
        345,
        350,
        90,
        i < 2 ? themeColors.yellow : themeColors.cyan,
        28,
      );
    });
    if (currentBeat >= 1) {
      drawResearchConstructionArrow(ctx, api, 700, 540, 700, 680, themeColors.pink);
      drawResearchConstructionBox(
        ctx,
        api,
        'Original outputs retained\nterminal bug discovered',
        470,
        685,
        460,
        110,
        themeColors.pink,
      );
      drawResearchConstructionArrow(ctx, api, 960, 740, 1100, 740);
      drawResearchConstructionBox(
        ctx,
        api,
        'Versioned correction\ncomplete corrected comparison',
        1130,
        685,
        540,
        110,
        themeColors.cyan,
      );
    }
    if (resultComplete(2, 0))
      drawResearchConstructionResult(
        ctx,
        api,
        'Corrected after observation → amended evidence',
        themeColors.yellow,
        918,
      );
    drawResearchConstructionFooter(
      ctx,
      api,
      'A later commit cannot make already observed data preregistered',
    );
  });
}
export default {
  id: 'plan-history',
  draw: drawPlanHistory,
  cues: [
    'rs-plan-history-0',
    'rsx-plan-history-b0-s0',
    'rsx-plan-history-b0-s1',
    'rsx-plan-history-b0-s2',
    'rs-plan-history-1',
    'rsx-plan-history-b1-s0',
    'rsx-plan-history-b1-s1',
    'rsx-plan-history-b1-s2',
    'rs-plan-history-2',
    'rsx-plan-history-b2-s0',
    'rsx-plan-history-b2-s1',
    'rsx-plan-history-b2-s2',
  ],
};
