import { sampleModel } from '../construction.mjs';
import { card, text as originalText } from '../defaults.mjs';
export function drawScreen(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('screen', state),
    currentBeat = modelState.step;
  {
    originalText(ctx, api, 'Curated screen · supplied judge outcomes', 150, 285, 36);
    modelState.results
      .slice(0, modelState.visible)
      .forEach((value, i) =>
        api.focus.target('screen-value-5-tie-t-wins', () =>
          card(
            ctx,
            api,
            value === 0.5 ? 'TIE' : 'T WINS',
            170 + i * 330,
            440,
            270,
            value === 0.5 ? themeColors.yellow : themeColors.green,
            130,
            33,
          ),
        ),
      );
    originalText(
      ctx,
      api,
      'Tie-adjusted score ' +
        (100 * modelState.score).toFixed(1) +
        '% · ' +
        modelState.visible +
        ' cases',
      960,
      780,
      54,
      themeColors.cyan,
      'center',
    );
    originalText(
      ctx,
      api,
      'Calibrate judges against human labels and approved source evidence',
      960,
      975,
      30,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'screen',
  draw: drawScreen,
  cues: ['screen-beat-1-focus-1', 'screen-beat-2-focus-1'],
};
