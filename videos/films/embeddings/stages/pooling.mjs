import { poolingState } from '../construction.mjs';
import { equation, focusTarget, rowMatrix, text } from '../defaults.mjs';
export function drawPooling(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = (i) => (currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.07, 0.9));
  {
    const pooled = poolingState(currentBeat, progress),
      cue = state.cues?.['pooling-beat-1-focus-2'],
      amount =
        currentBeat > 0
          ? 1
          : cue
            ? cue.phase === 'before'
              ? 0
              : cue.phase === 'after'
                ? 1
                : (cue.progress ?? 0)
            : q(0),
      values = pooled.values.slice(0, 3),
      colors = [themeColors.blue, themeColors.cyan, themeColors.green];
    focusTarget(ctx, api, 'pooling-input-states', () => {
      values.forEach((v, i) => {
        text(ctx, api, ['bank', 'river', 'water'][i], 300 + i * 500, 310, 31, colors[i], 'center');
        rowMatrix(ctx, api, [v], 180 + i * 500, 350, colors[i]);
      });
    });
    focusTarget(ctx, api, 'pooling-valid-mask', () => {
      values.forEach((v, i) =>
        text(ctx, api, 'mask 1 · weight 1/3', 300 + i * 500, 555, 28, themeColors.yellow, 'center'),
      );
    });
    const a = teaching.axes({
      x: 150,
      y: 660,
      width: 650,
      height: 290,
      equalUnits: true,
      xDomain: [0, 1],
      yDomain: [0, 1],
      xTicks: [0, 1],
      yTicks: [0, 1],
      fontSize: 25,
    });
    focusTarget(ctx, api, 'pooling-output-mean', () => {
      api.teaching.vectorAccumulation({
        plot: a,
        terms: values.map((v, i) => ({
          id: 'pool-' + i,
          label: ['bank', 'river', 'water'][i],
          values: v,
          weight: 1 / 3,
          color: colors[i],
        })),
        progress: amount,
        ledger: {
          x: 1000,
          y: 640,
          width: 750,
          height: 310,
        },
        fontSize: 27,
        color: themeColors.green,
        restColor: themeColors.muted,
        revealTotal: amount === 1,
        totalLabel: 'Mean',
        format: (v) => v.toFixed(3),
      });
    });
    if (pooled.entry > 0) {
      const x = 1660 + 100 * (1 - pooled.entry);
      components.card({
        label: 'PAD [1, 1]',
        x: x - 100,
        y: 350,
        width: 200,
        height: 125,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.muted,
        fontSize: 28,
        padding: 12,
      });
      text(ctx, api, 'mask 0', x, 555, 28, themeColors.yellow, 'center');
      api.line(ctx, x - 110, 500, x + 110, 500, themeColors.pink, 4);
      text(ctx, api, '0 × PAD = [0, 0]', 960, 600, 27, themeColors.pink, 'center');
    }
    focusTarget(ctx, api, 'pooling-object-token-states-23', () =>
      text(ctx, api, 'Chosen token states', 960, 260, 31, themeColors.cyan, 'center'),
    );
    focusTarget(ctx, api, 'pooling-object-masked-mean-25', () =>
      text(
        ctx,
        api,
        'Valid denominator = ' + pooled.count,
        1390,
        990,
        30,
        themeColors.yellow,
        'center',
      ),
    );
    focusTarget(ctx, api, 'pooling-equation-string-raw-bar-h-frac-sum-i-m-i-h-i-sum-i-m-i-28', () =>
      equation(
        ctx,
        api,
        String.raw`\bar h=\frac{\sum_i m_i h_i}{\sum_i m_i}`,
        800,
        1000,
        34,
        themeColors.green,
        'center',
      ),
    );
  }
}
export default {
  id: 'pooling',
  draw: drawPooling,
  cues: [
    'pooling-beat-1-focus-1',
    'pooling-beat-1-focus-2',
    'pooling-beat-2-focus-1',
    'pooling-beat-3-focus-1',
  ],
};
