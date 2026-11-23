import { researchEvent } from '../construction.mjs';
import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionMid,
} from '../defaults.mjs';
export function drawTimeLimit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('time-limit', state),
    currentBeat = modelState.b;
  const E = (beat, sentence) => researchEvent('time-limit', state, beat, sentence),
    resultComplete = (beat, sentence) => E(beat, sentence) === 1;
  api.focus.target('rs-time-limit-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      'Collection ends and task termination have different targets',
    );
    ['COLLECTION CAP', 'TRUE GOAL'].forEach((v, i) => {
      const x = 250 + i * 820;
      drawResearchConstructionBox(
        ctx,
        api,
        v,
        x,
        350,
        600,
        90,
        i ? themeColors.green : themeColors.blue,
        31,
      );
      drawResearchConstructionBox(
        ctx,
        api,
        i ? 'next state 6   /   terminal' : 'non-goal next state · capped',
        x,
        515,
        600,
        95,
        themeColors.muted,
        29,
      );
      if (resultComplete(0, 2) || currentBeat > 0) {
        drawResearchConstructionBox(
          ctx,
          api,
          i ? 'target = original goal reward' : 'target = reward + γ max Q(next)',
          x,
          725,
          600,
          100,
          i ? themeColors.green : themeColors.cyan,
          29,
        );
        drawResearchConstructionArrow(
          ctx,
          api,
          x + 300,
          625,
          x + 300,
          700,
          i ? themeColors.green : themeColors.cyan,
        );
      }
    });
    if (currentBeat >= 1)
      drawResearchConstructionMid(
        ctx,
        api,
        'Measured success: goal reached within twelve collected steps',
        960,
        930,
        32,
        themeColors.yellow,
      );
    drawResearchConstructionFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Separate terminal and truncation flags in code and tests'
        : 'The underlying task has no twelve-step deadline',
    );
  });
}
export default {
  id: 'time-limit',
  draw: drawTimeLimit,
  cues: [
    'rs-time-limit-0',
    'rsx-time-limit-b0-s0',
    'rsx-time-limit-b0-s1',
    'rsx-time-limit-b0-s2',
    'rs-time-limit-1',
    'rsx-time-limit-b1-s0',
    'rsx-time-limit-b1-s1',
    'rsx-time-limit-b1-s2',
    'rs-time-limit-2',
    'rsx-time-limit-b2-s0',
    'rsx-time-limit-b2-s1',
    'rsx-time-limit-b2-s2',
  ],
};
