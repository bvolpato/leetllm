import { samplerBoundary } from '../arithmetic.mjs';
import {
  drawConstructionsBox,
  drawConstructionsCenter,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawMedusaContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  api.focus.target('sd-medusa-contract-mechanism', () => {
    drawConstructionsCenter(
      ctx,
      api,
      'Which model supplies the next-word probabilities?',
      245,
    );
    if (currentBeat === 0) {
      drawConstructionsBox(
        ctx,
        api,
        'Medusa-1: frozen backbone',
        180,
        365,
        700,
        themeColors.blue,
        105,
      );
      drawConstructionsBox(
        ctx,
        api,
        'Medusa-2: joint backbone + heads',
        1040,
        365,
        700,
        themeColors.pink,
        105,
      );
      for (let col = 0; col < 2; col++)
        for (let i = 0; i < 3; i++) {
          const x = 250 + col * 860 + i * 205;
          api.arrow(
            ctx,
            530 + col * 860,
            485,
            x + 70,
            610,
            col ? themeColors.pink : themeColors.blue,
            3,
          );
          drawConstructionsBox(
            ctx,
            api,
            'future ' + (i + 1),
            x,
            650,
            150,
            col ? themeColors.pink : themeColors.blue,
            75,
          );
        }
      drawConstructionsCenter(
        ctx,
        api,
        'Future heads propose continuations; tree attention scores their prefixes',
        1005,
        themeColors.muted,
      );
    } else {
      drawConstructionsText(
        ctx,
        api,
        'Exact conditional verifier',
        930,
        360,
        31,
        themeColors.green,
        'center',
      );
      drawConstructionsText(
        ctx,
        api,
        'Typical acceptance',
        1530,
        360,
        31,
        themeColors.pink,
        'center',
      );
      for (let row = 0; row < 2; row++) {
        const y = 470 + row * 235;
        drawConstructionsBox(
          ctx,
          api,
          row ? 'Joint target W1' : 'Frozen target W0',
          150,
          y,
          460,
          row ? themeColors.cyan : themeColors.blue,
        );
        for (let col = 0; col < 2; col++) {
          const out = samplerBoundary(Boolean(row), col === 0);
          drawConstructionsBox(
            ctx,
            api,
            out.targetLawEstablished ? 'Samples from ' + out.target : 'Word probabilities can shift',
            650 + col * 600,
            y,
            550,
            col === 0 ? themeColors.green : themeColors.pink,
            95,
          );
        }
      }
      drawConstructionsCenter(
        ctx,
        api,
        'W0 = original weights     ·     W1 = jointly trained weights',
        1005,
        themeColors.yellow,
        30,
      );
    }
  });
  return;
}
export default {
  id: 'medusa-contract',
  draw: drawMedusaContract,
  cues: ['sd-medusa-contract-b0', 'sd-medusa-contract-b1'],
};
