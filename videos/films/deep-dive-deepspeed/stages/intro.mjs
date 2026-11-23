import { sampleModel } from '../model.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors, components } = api,
    modelState = sampleModel('intro', state),
    currentBeat = modelState.b;
  {
    drawOriginalText(
      ctx,
      api,
      'Mixed-precision Adam state recipe',
      960,
      290,
      39,
      themeColors.yellow,
      'center',
    );
    let x = 240;
    const colors = [themeColors.blue, themeColors.cyan, themeColors.pink],
      names = ['Weights', 'Gradients', 'Optimizer + master'];
    modelState.parts.forEach((part, i) =>
      api.focus.target('intro-component-' + i, () => {
        const width = (part / 24) * 1440;
        if (part > 0)
          api.focus.target('intro-panel-intro', () =>
            components.panel({
              x,
              y: 440,
              width,
              height: 170,
              fill: colors[i],
              stroke: colors[i],
            }),
          );
        drawOriginalText(
          ctx,
          api,
          `${names[i]}: ${part.toFixed(2)} GB`,
          210,
          735 + i * 75,
          33,
          colors[i],
        );
        x += width;
      }),
    );
    const limitX = 240 + (1440 * 16) / 24;
    api.line(ctx, limitX, 420, limitX, 640, themeColors.yellow, 4);
    drawOriginalText(
      ctx,
      api,
      'Supplied device capacity: 16 GB',
      limitX,
      690,
      28,
      themeColors.yellow,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      `Current persistent total: ${modelState.total.toFixed(2)} GB per rank`,
      960,
      360,
      37,
      themeColors.green,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      '1.5 billion parameters · recipe 2 + 2 + 12 bytes · excludes working sets',
      960,
      1010,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-beat-1-focus-1',
    'ds-intro-b0-s0',
    'ds-intro-b0-s1',
    'ds-intro-b0-s2',
    'intro-beat-2-focus-1',
    'ds-intro-b1-s0',
    'ds-intro-b1-s1',
    'ds-intro-b1-s2',
    'ds-intro-b1-s3',
    'intro-beat-3-focus-1',
    'ds-intro-b2-s0',
    'ds-intro-b2-s1',
    'ds-intro-b2-s2',
  ],
};
