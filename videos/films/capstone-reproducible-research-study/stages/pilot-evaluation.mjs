import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionLine,
  drawResearchConstructionMid,
  drawResearchConstructionRect,
} from '../defaults.mjs';
export function drawPilotEvaluation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('pilot-evaluation', state),
    currentBeat = modelState.b;
  api.focus.target('rs-pilot-evaluation-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      currentBeat === 0
        ? 'Keep pilot work out of the primary sample'
        : 'Freeze learning before evaluation',
    );
    if (currentBeat === 0) {
      ['pilot 900', 'pilot 901', 'pilot 902'].forEach((v, i) =>
        drawResearchConstructionBox(ctx, api, v, 250 + i * 520, 410, 410, 100, themeColors.yellow),
      );
      drawResearchConstructionLine(ctx, api, 250, 630, 1700, 630, themeColors.muted);
      drawResearchConstructionMid(
        ctx,
        api,
        'Worked sample: seeds 0 through 23',
        960,
        755,
        35,
        themeColors.cyan,
      );
      drawResearchConstructionMid(
        ctx,
        api,
        'New confirmatory seeds: untouched until the plan is frozen',
        960,
        895,
        31,
        themeColors.muted,
      );
    } else {
      drawResearchConstructionBox(
        ctx,
        api,
        'Learned Q table\nFROZEN · no update',
        240,
        390,
        500,
        160,
        themeColors.blue,
        34,
      );
      drawResearchConstructionArrow(ctx, api, 770, 470, 1070, 470, themeColors.cyan);
      drawResearchConstructionBox(
        ctx,
        api,
        'Separate evaluation tape\nseed = 10000 + training seed',
        1110,
        390,
        560,
        160,
        themeColors.cyan,
        30,
      );
      for (let i = 0; i < 40; i++)
        drawResearchConstructionRect(
          ctx,
          api,
          280 + i * 35,
          700,
          23,
          38,
          themeColors.panel,
          themeColors.muted,
        );
      drawResearchConstructionMid(
        ctx,
        api,
        '200 greedy episodes · original goal reward only',
        960,
        840,
        34,
        themeColors.yellow,
      );
      if (currentBeat === 2)
        drawResearchConstructionMid(
          ctx,
          api,
          'If you tune on these scores, evaluate the choice on fresh seeds.',
          960,
          923,
          32,
          themeColors.pink,
        );
    }
    drawResearchConstructionFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Keep the seeds, generator, calls and software environment for the rerun.'
        : 'Pilot, training and evaluation each have their own draws.',
    );
  });
}
export default {
  id: 'pilot-evaluation',
  draw: drawPilotEvaluation,
  cues: [
    'rs-pilot-evaluation-0',
    'rsx-pilot-evaluation-b0-s0',
    'rsx-pilot-evaluation-b0-s1',
    'rsx-pilot-evaluation-b0-s2',
    'rs-pilot-evaluation-1',
    'rsx-pilot-evaluation-b1-s0',
    'rsx-pilot-evaluation-b1-s1',
    'rsx-pilot-evaluation-b1-s2',
    'rs-pilot-evaluation-2',
    'rsx-pilot-evaluation-b2-s0',
    'rsx-pilot-evaluation-b2-s1',
    'rsx-pilot-evaluation-b2-s2',
  ],
};
