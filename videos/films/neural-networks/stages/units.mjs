import { standardize } from '../arithmetic.mjs';
import { neuralFrame } from '../construction.mjs';
import { axes, equation, focusTarget, formatNumber, head, note, text } from '../defaults.mjs';
export function drawUnits(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'units-mechanism', () => {
    const p = cueProgress('standardize-features', 1),
      raw = [8, 900],
      scaled = standardize(raw, [5, 500], [2, 200]),
      scale = 280 * (1 - p) + 0.7 * p,
      values = raw.map((v, i) => v + (scaled[i] - v) * p);
    head(ctx, api, 'The horizontal ruler changes explicitly with the units');
    const plot = axes(ctx, api, {
      x: 410,
      y: 420,
      width: 1070,
      height: 270,
      xDomain: [0, scale],
      yDomain: [0, 2.4],
      xTicks: p === 0 ? [0, 100, 200] : p === 1 ? [0, 0.3, 0.6] : [0, scale / 2, scale],
      yTicks: [],
      xLabel:
        p === 0
          ? 'coefficient × raw feature'
          : p === 1
            ? 'coefficient × standardized feature'
            : 'axis transforming to standardized units',
    });
    focusTarget(ctx, api, 'feature-contributions', () => {
      values.forEach((v, i) => {
        const q = plot.point(0.3 * v, 1.8 - i),
          zero = plot.point(0, 1.8 - i);
        api.rect(ctx, zero.x, q.y - 22, q.x - zero.x, 44, i ? themeColors.blue : themeColors.cyan);
        text(
          ctx,
          api,
          i ? 'prompt tokens' : 'queue score',
          355,
          q.y + 10,
          28,
          themeColors.ink,
          'right',
        );
        text(
          ctx,
          api,
          formatNumber(ctx, api, v * 0.3),
          q.x + 20,
          q.y + 10,
          30,
          i ? themeColors.blue : themeColors.cyan,
        );
      });
    });
    focusTarget(ctx, api, 'scaler-parameters', () => {
      equation(
        ctx,
        api,
        String.raw`\frac{8-5}{2}=1.5\qquad\frac{900-500}{200}=2`,
        960,
        825,
        48,
        themeColors.yellow,
      );
      text(
        ctx,
        api,
        'raw reference retained: [8,900] · training means [5,500] · std [2,200]',
        960,
        945,
        29,
        themeColors.muted,
        'center',
      );
      if (currentBeat === 2)
        text(
          ctx,
          api,
          'reuse this fitted transform at inference',
          960,
          330,
          32,
          themeColors.green,
          'center',
        );
    });
    note(
      ctx,
      api,
      'The equal coefficients illustrate a unit intervention; a real model must be trained or transformed accordingly.',
    );
    return;
  });
}
export default {
  id: 'units',
  draw: drawUnits,
  cues: ['raw-scale', 'standardize-features', 'reuse-training-stats'],
};
