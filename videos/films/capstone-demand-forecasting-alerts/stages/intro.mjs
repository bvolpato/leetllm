import { actual, candidate } from '../fixtures.mjs';
import { sampleModel } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('intro', state);
  {
    const showActual =
      modelState.b || Boolean(state.cues && state.cues['intro-b1-2'].phase !== 'before');
    text(
      ctx,
      api,
      'A decision on Sunday · an outcome on Friday',
      960,
      280,
      38,
      themeColors.ink,
      'center',
    );
    api.focus.target('forecast-capacity', () =>
      teaching.bars({
        x: 240,
        y: 440,
        width: 1440,
        height: 330,
        values: showActual ? [150, candidate[4], actual[4]] : [150, candidate[4]],
        labels: showActual
          ? ['Planned capacity', 'Issued forecast', 'Later actual']
          : ['Planned capacity', 'Issued forecast'],
        colors: [themeColors.blue, themeColors.cyan, themeColors.pink].slice(0, showActual ? 3 : 2),
        max: 200,
        showValues: true,
        format: (v) => v.toFixed(1),
        fontSize: 30,
        gap: 150,
      }),
    );
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-b1-1', 'intro-b1-2', 'intro-b2-1', 'intro-b2-2'],
};
