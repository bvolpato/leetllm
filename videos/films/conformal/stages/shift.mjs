import { RESIDUALS, TEST_OUTCOMES, TEST_PREDICTIONS } from '../fixtures.mjs';
import { clamp } from '../construction.mjs';
import { arrow, caption, line, text } from '../defaults.mjs';
export function drawShift(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const paint = () => {
    text(ctx, api, 'frozen model + fixed score', 440, 315, 33, themeColors.yellow, 'center');
    text(ctx, api, 'calibration collection', 450, 415, 29, themeColors.cyan, 'center');
    text(ctx, api, 'later requests', 1320, 415, 29, themeColors.ink, 'center');
    RESIDUALS.forEach((v, i) => {
      const x = 200 + i * 58;
      line(ctx, api, x, 740, x, 740 - v * 17, themeColors.cyan, 14);
    });
    line(ctx, api, 170, 740, 760, 740, themeColors.border, 3);
    text(ctx, api, 'C1 … C9', 450, 805, 28, themeColors.cyan, 'center');
    const residuals = TEST_OUTCOMES.map((v, i) => Math.abs(v - TEST_PREDICTIONS[i]));
    residuals.forEach((v, i) => {
      const x = 1100 + i * 155;
      line(ctx, api, x, 740, x, 740 - v * 17, themeColors.green, 25);
      text(ctx, api, `E${i + 1}`, x, 805, 25, themeColors.muted, 'center');
    });
    arrow(
      ctx,
      api,
      790,
      600,
      1010,
      600,
      currentBeat === 0 ? themeColors.pink : themeColors.yellow,
      5,
    );
    text(
      ctx,
      api,
      currentBeat === 0
        ? 'same law?'
        : currentBeat === 1
          ? 'new collection premise?'
          : 'diagnose the changed mechanism',
      960,
      880,
      34,
      themeColors.pink,
      'center',
    );
    caption(
      ctx,
      api,
      currentBeat === 0
        ? 'Heavy tails can be exchangeable; a time trend or changed queue can break the premise.'
        : currentBeat === 1
          ? 'A fresh file helps only when its sampling assumptions fit the subsequent stream.'
          : 'Bias, input-dependent scale, group mixture and fitting leakage need different repairs.',
    );
  };
  if (api.focus) api.focus.target(`${'shift'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'shift',
  draw: drawShift,
  cues: ['shift-b1', 'shift-b2', 'shift-b3'],
};
