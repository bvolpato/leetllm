import { sampleModel } from '../construction.mjs';
import { text as originalText } from '../defaults.mjs';
export function drawRatio(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('ratio', state),
    currentBeat = modelState.step;
  {
    api.focus.target('ratio-arm-counts', () =>
      [
        ['Control', modelState.a, themeColors.blue],
        ['Treatment', modelState.b, themeColors.cyan],
      ].forEach(([name, n, color], i) => {
        const y = 400 + i * 220;
        originalText(ctx, api, name, 170, y - 35, 34, color);
        api.rect(ctx, 170, y, (n / 5500) * 1550, 100, color, undefined, 0);
        originalText(ctx, api, n.toLocaleString(), 1730, y - 35, 43, color, 'right');
      }),
    );
    originalText(
      ctx,
      api,
      'Expected 5,000 each · χ² = ' + modelState.chi.toFixed(2),
      960,
      855,
      43,
      themeColors.yellow,
      'center',
    );
    originalText(
      ctx,
      api,
      modelState.flag
        ? 'HOLD: investigate assignment and data flow'
        : 'No crossing of the declared diagnostic threshold',
      960,
      970,
      32,
      modelState.flag ? themeColors.pink : themeColors.green,
      'center',
    );
  }
}
export default {
  id: 'ratio',
  draw: drawRatio,
  cues: ['ratio-beat-1-focus-1', 'ratio-beat-2-focus-1'],
};
