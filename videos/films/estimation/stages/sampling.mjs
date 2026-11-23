import { samplingFrame } from '../construction.mjs';
import { axes, dots, equation, focusTarget, labelGrid, text } from '../defaults.mjs';
export function drawSampling(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const f = samplingFrame(state);
    text(
      ctx,
      api,
      'Simulation · fixed population rate 16%',
      960,
      290,
      31,
      themeColors.yellow,
      'center',
    );
    focusTarget(ctx, api, 'batch-labels', () => {
      labelGrid(ctx, api, f.first, 100, f.counted, 200, 390, 31, 8);
      text(ctx, api, f.counted + ' labels counted', 345, 755, 29, themeColors.muted, 'center');
    });
    const plot = axes(
      ctx,
      api,
      800,
      400,
      900,
      400,
      [0.04, 0.3],
      [0, 2],
      [0.05, 0.1, 0.16, 0.22, 0.28],
      [],
      'sample estimate',
      '',
    );
    const truth = plot.point(0.16, 0);
    api.line(ctx, truth.x, 365, truth.x, 800, themeColors.yellow, 3);
    text(ctx, api, '100 labels', 750, plot.point(0, 1.5).y + 10, 29, themeColors.blue, 'right');
    text(ctx, api, '400 labels', 750, plot.point(0, 0.5).y + 10, 29, themeColors.cyan, 'right');
    const end = plot.point(f.firstK / 100, 1.5);
    focusTarget(ctx, api, 'batch-to-point', () => {
      equation(
        ctx,
        api,
        f.counted >= 100 ? f.firstK + '/100' : '?/100',
        350,
        865,
        43,
        themeColors.yellow,
        'center',
      );
      if (f.point > 0) {
        const x = api.lerp(570, end.x, f.point),
          y = api.lerp(855, end.y, f.point);
        api.circle(ctx, x, y, 13, themeColors.yellow);
      }
    });
    focusTarget(ctx, api, 'sample-cloud', () =>
      dots(ctx, api, plot, f.smallRates, themeColors.blue, 1.5),
    );
    focusTarget(ctx, api, 'large-cloud', () => {
      dots(ctx, api, plot, f.largeRates, themeColors.cyan, 0.5);
      if (currentBeat === 2)
        text(
          ctx,
          api,
          f.large + ' completed larger samples',
          1250,
          335,
          29,
          themeColors.cyan,
          'center',
        );
    });
    if (currentBeat === 2 && f.large === 40)
      equation(ctx, api, 'SE\\propto1/\\sqrt n', 960, 975, 40, themeColors.ink, 'center');
  }
}
export default {
  id: 'sampling',
  draw: drawSampling,
  cues: ['batch-count', 'batch-point', 'batch-repeat', 'larger-cloud'],
};
