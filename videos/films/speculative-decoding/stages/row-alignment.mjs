import { prefixStates } from '../arithmetic.mjs';
import { completedCue } from '../construction.mjs';
import {
  drawConstructionsBox,
  drawConstructionsCenter,
  drawConstructionsLine,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawRowAlignment(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    done = (beat, cue) => currentBeat > beat || (currentBeat === beat && completedCue(state, cue));
  api.focus.target('sd-row-alignment-mechanism', () => {
    drawConstructionsCenter(
      ctx,
      api,
      currentBeat === 2
        ? 'Decimal prefix-state toy · each token changes the state'
        : 'A causal output row predicts the next token',
      245,
    );
    if (currentBeat < 2) {
      const inputs = ['u', 'x1', 'x2', 'x3'],
        scoring = ['p1 → x1', 'p2 → x2', 'p3 → x3', 'p4 → bonus'];
      drawConstructionsText(ctx, api, 'Cache C', 135, 465, 30, themeColors.blue);
      for (let i = 0; i < 4; i++) {
        const x = 350 + i * 355,
          removed = currentBeat === 1 && done(1, 'sd-row-trim') && i >= 2;
        drawConstructionsBox(
          ctx,
          api,
          inputs[i],
          x,
          380,
          285,
          removed ? themeColors.muted : themeColors.blue,
        );
        const reveal =
          currentBeat > 0 ||
          (i === 0 && done(0, 'sd-row-u')) ||
          (i === 1 && done(0, 'sd-row-x1')) ||
          (i >= 2 && done(0, 'sd-row-bonus'));
        if (reveal) {
          api.arrow(
            ctx,
            x + 143,
            485,
            x + 143,
            580,
            removed ? themeColors.muted : themeColors.cyan,
            3,
          );
          drawConstructionsBox(
            ctx,
            api,
            scoring[i],
            x,
            610,
            285,
            removed ? themeColors.muted : themeColors.cyan,
          );
        }
        if (removed)
          drawConstructionsText(
            ctx,
            api,
            'discard state',
            x + 143,
            830,
            29,
            themeColors.pink,
            'center',
          );
      }
      if (currentBeat === 1 && done(1, 'sd-row-pending')) {
        drawConstructionsBox(ctx, api, 'Correction committed', 440, 900, 560, themeColors.green);
        drawConstructionsBox(
          ctx,
          api,
          'Correction KV: pending',
          1090,
          900,
          640,
          themeColors.yellow,
        );
      } else
        drawConstructionsCenter(
          ctx,
          api,
          'Inputs and predicted events occupy different positions',
          970,
          themeColors.muted,
        );
    } else {
      const first = prefixStates([1, 2, 3]);
      for (let i = 0; i < 3; i++) {
        const x = 260 + i * 560;
        drawConstructionsBox(ctx, api, 'consume ' + (i + 1), x, 400, 400, themeColors.blue);
        drawConstructionsText(
          ctx,
          api,
          first[i] + ' × 10 + ' + (i + 1),
          x + 200,
          570,
          32,
          themeColors.ink,
          'center',
        );
        drawConstructionsText(
          ctx,
          api,
          String(first[i + 1]),
          x + 200,
          660,
          48,
          themeColors.blue,
          'center',
        );
      }
      drawConstructionsLine(ctx, api, 1560, 730, 1560, 810, themeColors.pink, 4);
      drawConstructionsText(
        ctx,
        api,
        'discard 123; retain 12',
        1560,
        855,
        29,
        themeColors.pink,
        'center',
      );
      drawConstructionsBox(
        ctx,
        api,
        done(2, 'sd-row-124') ? 'consume 4 → state 124' : 'correction 4 · state pending',
        470,
        910,
        1000,
        done(2, 'sd-row-124') ? themeColors.green : themeColors.yellow,
      );
    }
  });
  return;
}
export default {
  id: 'row-alignment',
  draw: drawRowAlignment,
  cues: [
    'sd-row-alignment-b0',
    'sd-row-u',
    'sd-row-x1',
    'sd-row-bonus',
    'sd-row-alignment-b1',
    'sd-row-trim',
    'sd-row-pending',
    'sd-row-alignment-b2',
    'sd-row-124',
  ],
};
