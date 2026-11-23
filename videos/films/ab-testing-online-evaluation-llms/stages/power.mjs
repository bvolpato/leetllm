import { sampleModel } from '../construction.mjs';
import { text as originalText } from '../defaults.mjs';
export function drawPower(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('power', state),
    currentBeat = modelState.step;
  {
    api.focus.target('power-sample-size-bars', () =>
      modelState.rows.forEach((row, i) => {
        const y = 380 + i * 180;
        originalText(
          ctx,
          api,
          'MDE ' + (100 * row.delta).toFixed(0) + ' points',
          170,
          y + 45,
          33,
          i === modelState.focus ? themeColors.yellow : themeColors.blue,
        );
        api.rect(
          ctx,
          590,
          y,
          (row.n / 20000) * 1050,
          85,
          i === modelState.focus ? themeColors.yellow : themeColors.cyan,
          undefined,
          0,
        );
        originalText(ctx, api, row.n.toLocaleString(), 1730, y + 60, 40, themeColors.ink, 'right');
      }),
    );
    originalText(
      ctx,
      api,
      'Baseline 60% · two-sided α = 0.05 · power 80% · total independent units',
      960,
      975,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'power',
  draw: drawPower,
  cues: ['power-beat-1-focus-1', 'power-beat-2-focus-1'],
};
