import { verificationBudget } from '../arithmetic.mjs';
import { completedCue } from '../construction.mjs';
import {
  drawConstructionsCenter,
  drawConstructionsLine,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawVerificationBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    done = (beat, cue) => currentBeat > beat || (currentBeat === beat && completedCue(state, cue));
  api.focus.target('sd-verification-budget-mechanism', () => {
    drawConstructionsCenter(
      ctx,
      api,
      'Scheduled input positions and expected emitted output are different units',
      245,
    );
    if (currentBeat === 0) {
      const revealed = done(0, 'sd-budget-eighty'),
        n = revealed ? 5 : 1;
      for (let stream = 0; stream < 16; stream++) {
        const x = 150 + (stream % 8) * 215,
          y = 350 + Math.floor(stream / 8) * 235;
        drawConstructionsText(
          ctx,
          api,
          'stream ' + (stream + 1),
          x + 80,
          y - 20,
          23,
          themeColors.ink,
          'center',
        );
        for (let j = 0; j < n; j++)
          api.rect(ctx, x + j * 31, y, 25, 70, j === 0 ? themeColors.yellow : themeColors.blue);
      }
      drawConstructionsCenter(
        ctx,
        api,
        revealed
          ? '16 × (1 pending + 4 proposals) = 80 scheduled positions'
          : '16 streams · each pending input consumes a position',
        865,
        themeColors.blue,
        34,
      );
      drawConstructionsCenter(
        ctx,
        api,
        done(0, 'sd-budget-deny')
          ? '80 > 64: batch cannot be admitted together'
          : 'Step input budget: 64 positions',
        980,
        done(0, 'sd-budget-deny') ? themeColors.pink : themeColors.muted,
        35,
      );
    } else {
      const ks = [0, 2, 4, 8];
      ks.forEach((k, i) => {
        const y = 375 + i * 145,
          f = verificationBudget(16, k);
        drawConstructionsText(ctx, api, 'depth ' + k, 160, y, 30, themeColors.ink);
        api.rect(ctx, 450, y - 45, (f.inputs / 144) * 850, 55, themeColors.blue);
        drawConstructionsLine(
          ctx,
          api,
          450 + (64 / 144) * 850,
          y - 68,
          450 + (64 / 144) * 850,
          y + 35,
          themeColors.yellow,
          3,
        );
        drawConstructionsText(ctx, api, String(f.inputs) + ' input', 1350, y, 29, themeColors.blue);
        drawConstructionsText(
          ctx,
          api,
          f.expectedOutput.toFixed(2) + ' expected output',
          1730,
          y + 60,
          27,
          themeColors.muted,
          'right',
        );
      });
      drawConstructionsCenter(
        ctx,
        api,
        'Yellow boundary: 64 inputs · later rejection does not refund evaluated work',
        1010,
        themeColors.yellow,
        30,
      );
    }
  });
  return;
}
export default {
  id: 'verification-budget',
  draw: drawVerificationBudget,
  cues: [
    'sd-verification-budget-b0',
    'sd-budget-eighty',
    'sd-budget-deny',
    'sd-verification-budget-b1',
    'sd-budget-depths',
  ],
};
