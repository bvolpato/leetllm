import { researchEvent } from '../construction.mjs';
import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionCorridor,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionMid,
  drawResearchConstructionRect,
  drawResearchConstructionSmallGrid,
} from '../defaults.mjs';
export function drawEnvironmentRuntime(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('environment-runtime', state),
    currentBeat = modelState.b;
  const E = (beat, sentence) => researchEvent('environment-runtime', state, beat, sentence);
  api.focus.target('rs-environment-runtime-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      currentBeat < 2
        ? 'Retain intended action and realized movement separately'
        : 'Actual study configuration',
    );
    if (currentBeat === 0) {
      const p = E(0, 2),
        pos = p < 0.5 ? 1 : 1 - (p - 0.5) * 2;
      drawResearchConstructionCorridor(ctx, api, 430, pos);
      drawResearchConstructionMid(ctx, api, 'intended RIGHT', 510, 355, 32, themeColors.blue);
      drawResearchConstructionArrow(ctx, api, 510, 380, 730, 380, themeColors.blue);
      if (p > 0.5) {
        drawResearchConstructionMid(
          ctx,
          api,
          'slip < .15 reverses movement',
          960,
          660,
          34,
          themeColors.yellow,
        );
        drawResearchConstructionArrow(ctx, api, 510, 720, 290, 720, themeColors.yellow);
      }
      drawResearchConstructionSmallGrid(
        ctx,
        api,
        [
          ['start', 'intended action', 'successor', 'ending reason'],
          ['1', 'right', pos === 0 ? '0' : 'in transit', 'nonterminal'],
        ],
        260,
        805,
        1400,
        135,
      );
    } else if (currentBeat === 1) {
      const capped = E(1, 2) > 0,
        pos = capped ? 3 : 6;
      drawResearchConstructionCorridor(ctx, api, 430, pos);
      drawResearchConstructionMid(
        ctx,
        api,
        capped
          ? 'Last collected step    2 → 3'
          : 'Goal entry    5 → 6',
        960,
        355,
        32,
        themeColors.cyan,
      );
      drawResearchConstructionMid(
        ctx,
        api,
        capped
          ? 'Reward 0   /   Twelve-step collection cap'
          : 'Reward 1   /   Goal reached',
        960,
        670,
        35,
        capped ? themeColors.yellow : themeColors.green,
      );
      drawResearchConstructionSmallGrid(
        ctx,
        api,
        [
          ['start', 'intended action', 'successor', 'ending reason'],
          [capped ? '2' : '5', 'right', String(pos), capped ? 'truncated' : 'terminal goal'],
        ],
        260,
        805,
        1400,
        135,
      );
    } else {
      drawResearchConstructionSmallGrid(
        ctx,
        api,
        [
          ['discount γ', 'step size α', 'exploration ε'],
          ['.95', '.35', '.20'],
        ],
        300,
        350,
        1320,
        180,
        [themeColors.muted, themeColors.cyan],
      );
      for (let i = 0; i < 80; i++) {
        const x = 255 + (i % 40) * 36,
          y = 635 + Math.floor(i / 40) * 65;
        drawResearchConstructionRect(
          ctx,
          api,
          x,
          y,
          27,
          42,
          i < 30 ? themeColors.cyan : themeColors.panel,
          themeColors.muted,
        );
      }
      drawResearchConstructionMid(
        ctx,
        api,
        '80 training episodes · first 30 define the early metric',
        960,
        825,
        34,
        themeColors.cyan,
      );
      drawResearchConstructionMid(
        ctx,
        api,
        'Goal at state 6   /   Collection cap at step 12',
        960,
        918,
        31,
        themeColors.yellow,
      );
    }
    drawResearchConstructionFooter(
      ctx,
      api,
      'Movement stops at the walls. Arriving at state 6 earns one goal reward.',
    );
  });
}
export default {
  id: 'environment-runtime',
  draw: drawEnvironmentRuntime,
  cues: [
    'rs-environment-runtime-0',
    'rsx-environment-runtime-b0-s0',
    'rsx-environment-runtime-b0-s1',
    'rsx-environment-runtime-b0-s2',
    'rs-environment-runtime-1',
    'rsx-environment-runtime-b1-s0',
    'rsx-environment-runtime-b1-s1',
    'rsx-environment-runtime-b1-s2',
    'rsx-environment-runtime-b1-s3',
    'rs-environment-runtime-2',
    'rsx-environment-runtime-b2-s0',
    'rsx-environment-runtime-b2-s1',
    'rsx-environment-runtime-b2-s2',
  ],
};
