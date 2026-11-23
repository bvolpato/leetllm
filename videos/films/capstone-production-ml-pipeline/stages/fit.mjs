import { score } from '../arithmetic.mjs';
import { bundle, train } from '../fixtures.mjs';
import { line } from '../defaults.mjs';
export function drawFit(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const drawText = (v, x, y, z = 30, col = themeColors.ink, a = 'left', mono = false) => {
    const text = String(v),
      key =
        text.startsWith('(') || text.startsWith('Compute the mean')
          ? 'fit-mean-output'
          : text.startsWith('Range')
            ? 'fit-range-output'
            : text.startsWith('Σ')
              ? 'fit-cross-output'
              : text.startsWith('Slope')
                ? 'fit-slope-output'
                : null;
    const paint = () =>
      api.text(ctx, text, x, y, z, col, a, mono || text.includes('_') ? 'mono' : 'sans');
    return key ? api.focus.target(key, paint) : paint();
  };
  const cueProgress = (n) => api.focus.progress('fit-' + n, 0),
    cueStarted = (n) => cueProgress(n) > 0,
    resultComplete = (n) => api.focus.progress('pipe-result-' + n, 0) === 1,
    footer = (v) => drawText(v, 960, 1025, 24, themeColors.muted, 'center');
  {
    if (currentBeat === 0) {
      drawText('Six training delays', 960, 280, 35, themeColors.blue, 'center');
      line(ctx, api, 260, 490, 1660, 490, themeColors.muted, 3);
      train.forEach((r, i) => {
        const x = 260 + r.x * 140;
        api.circle(ctx, x, 490, 13, themeColors.blue);
        drawText(r.x, x, 440, 34, themeColors.blue, 'center');
      });
      drawText(
        resultComplete('fitted-mean')
          ? '(0 + 1 + 2 + 8 + 9 + 10) / 6 = 5'
          : 'Compute the mean from these rows',
        960,
        670,
        39,
        themeColors.yellow,
        'center',
      );
      drawText(
        resultComplete('fitted-range') ? 'Range = 10 − 0 = 10' : 'Range: pending',
        960,
        825,
        40,
        resultComplete('fitted-range') ? themeColors.cyan : themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      const plot = teaching.axes({
        x: 260,
        y: 365,
        width: 1360,
        height: 440,
        xDomain: [-0.3, 10.3],
        yDomain: [-0.15, 1.15],
        xTicks: [0, 5, 10],
        yTicks: [0, 0.5, 1],
        xLabel: 'delay minutes',
        yLabel: 'score / training label',
        fontSize: 27,
      });
      teaching.scatter({
        plot,
        points: train.map((r) => ({
          ...r,
          color: themeColors.blue,
          radius: 12,
        })),
      });
      teaching.curve({
        plot,
        points: [
          {
            x: 0,
            y: score(bundle, 0),
          },
          {
            x: 10,
            y: score(bundle, 10),
          },
        ],
        color: themeColors.cyan,
        width: 5,
        progress: Math.max(0.02, cueProgress('line')),
      });
      teaching.scatter({
        plot,
        points: [9, 8, 1, 0].map((x) => ({
          x,
          y: score(bundle, x),
          color: themeColors.yellow,
          radius: 10,
        })),
      });
      drawText(
        'Numeric score can be negative; threshold 0.5 chooses a warning',
        960,
        920,
        33,
        themeColors.yellow,
        'center',
      );
    } else {
      const rows = [
        ['x', ...train.map((r) => r.x)],
        ['y', ...train.map((r) => r.y)],
        ['z', ...train.map((r) => ((r.x - 5) / 10).toFixed(1))],
        ['z(y−0.5)', ...train.map((r) => (((r.x - 5) / 10) * (r.y - 0.5)).toFixed(2))],
        ['z²', ...train.map((r) => (((r.x - 5) / 10) ** 2).toFixed(2))],
      ];
      const limit = cueStarted('cross') ? 5 : cueStarted('z') ? 3 : 2;
      teaching.grid({
        x: 130,
        y: 320,
        width: 1660,
        height: 410,
        rows: 5,
        columns: 7,
        labels: rows.map((r, i) => r.map((v) => (i < limit ? v : '—'))),
        fontSize: 29,
        padding: 10,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
      });
      drawText(
        resultComplete('cross-product-total')
          ? 'Σ z(y−0.5) = 1.2     Σ z² = 1.0'
          : 'Σ cross-product / squared-feature totals pending',
        960,
        805,
        36,
        resultComplete('cross-product-total') ? themeColors.yellow : themeColors.muted,
        'center',
      );
      drawText(
        resultComplete('slope-intercept')
          ? 'Slope 1.2 / 1.0 = 1.2     Intercept 0.5'
          : 'Slope / intercept pending',
        960,
        895,
        37,
        resultComplete('slope-intercept') ? themeColors.green : themeColors.muted,
        'center',
      );
      if (resultComplete('four-evaluation-scores'))
        drawText(
          's(9)=0.98 · s(8)=0.86 · s(1)=0.02 · s(0)=−0.10',
          960,
          970,
          30,
          themeColors.cyan,
          'center',
        );
    }
    footer('Train-only center and range remain fixed for evaluation and serving');
  }
  return;
}
export default {
  id: 'fit',
  draw: drawFit,
  cues: [
    'fit-b1-1',
    'fit-b1-2',
    'fit-mean',
    'fit-range',
    'pipe-result-fitted-mean',
    'pipe-result-fitted-range',
    'fit-b2-1',
    'fit-b2-2',
    'fit-line',
    'fit-extension-3',
    'fit-z',
    'fit-cross',
    'fit-slope',
    'fit-scores',
    'pipe-result-cross-product-total',
    'pipe-result-slope-intercept',
    'pipe-result-four-evaluation-scores',
  ],
};
