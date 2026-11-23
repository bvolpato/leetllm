import { cueProgress } from '../construction.mjs';
import {
  drawRewardExpansionArrow,
  drawRewardExpansionBox,
  drawRewardExpansionText,
  drawRewardExpansionTitle,
} from '../defaults.mjs';
export function drawSignalSpectrum(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    q = (id, a = 0.15, z = 0.75) => cueProgress(state, id, api.phase(progress, a, z)),
    on = (id, a = 0.3) => q(id, a, a + 0.02) > 0;
  api.focus.target('signal-spectrum-mechanism', () => {
    if (currentBeat === 0) {
      drawRewardExpansionTitle(
        ctx,
        api,
        'Attach the reward to the response or to its comparison group',
      );
      const vals = [2, 4, 6],
        mean = 4;
      vals.forEach((v, i) => {
        const x = 220 + i * 570;
        drawRewardExpansionBox(
          ctx,
          api,
          'Response ' + (i + 1),
          x,
          390,
          430,
          100,
          themeColors.blue,
          34,
        );
        drawRewardExpansionBox(
          ctx,
          api,
          'terminal reward ' + v,
          x,
          570,
          430,
          100,
          themeColors.cyan,
          31,
        );
        drawRewardExpansionBox(
          ctx,
          api,
          'group relative ' + (v - mean),
          x,
          760,
          430,
          100,
          themeColors.yellow,
          31,
        );
        drawRewardExpansionArrow(ctx, api, x + 215, 510, x + 215, 545, themeColors.cyan);
        drawRewardExpansionArrow(ctx, api, x + 215, 690, x + 215, 735, themeColors.yellow);
      });
      drawRewardExpansionText(
        ctx,
        api,
        'PPO: learned value baseline · outcome GRPO: response-group baseline',
        960,
        960,
        31,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      drawRewardExpansionTitle(
        ctx,
        api,
        'A process judgment can locate the first invalid reasoning step',
      );
      const rows = ['1. 2 + 3 = 5', '2. Multiply by 2 → 11', '3. Therefore result = 11'];
      rows.forEach((v, i) => {
        const bad = i === 1 && on('process-location');
        drawRewardExpansionBox(
          ctx,
          api,
          v,
          200,
          370 + i * 180,
          1130,
          110,
          bad ? themeColors.pink : themeColors.blue,
          36,
        );
        drawRewardExpansionBox(
          ctx,
          api,
          bad ? 'ERROR' : i === 0 ? 'valid' : i === 1 ? 'check 5 × 2' : 'depends on step 2',
          1430,
          370 + i * 180,
          300,
          110,
          bad ? themeColors.pink : themeColors.muted,
          29,
        );
      });
      drawRewardExpansionText(
        ctx,
        api,
        'Lightman et al.: fixed generator · MATH · best-of-N selection',
        960,
        980,
        31,
        themeColors.muted,
      );
    } else {
      drawRewardExpansionTitle(ctx, api, 'Does this function add two numbers?');
      drawRewardExpansionBox(
        ctx,
        api,
        'def add(a, b): return 5',
        200,
        380,
        1500,
        110,
        themeColors.blue,
        38,
      );
      drawRewardExpansionBox(
        ctx,
        api,
        'Visible: add(2, 3) = 5',
        200,
        580,
        650,
        110,
        themeColors.green,
        35,
      );
      drawRewardExpansionBox(
        ctx,
        api,
        on('verifier-hidden') ? 'Hidden: add(4, 4) = 5' : 'Hidden: add(4, 4) → ?',
        1050,
        580,
        650,
        110,
        on('verifier-hidden') ? themeColors.pink : themeColors.muted,
        35,
      );
      drawRewardExpansionText(
        ctx,
        api,
        on('verifier-hidden') ? 'Expected 8 · hidden property FAILS' : 'Hidden input result held',
        1375,
        790,
        34,
        on('verifier-hidden') ? themeColors.pink : themeColors.muted,
      );
      drawRewardExpansionText(
        ctx,
        api,
        'A final-answer parser can also accept a number from false reasoning',
        960,
        920,
        31,
        themeColors.yellow,
      );
    }
  });
}
export default {
  id: 'signal-spectrum',
  draw: drawSignalSpectrum,
  cues: [
    'signal-spectrum-step-1',
    'signal-spectrum-step-2',
    'process-location',
    'signal-spectrum-step-3',
    'verifier-hidden',
  ],
};
