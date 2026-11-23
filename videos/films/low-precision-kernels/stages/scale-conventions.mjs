import { cueDone, sampleModel } from '../construction.mjs';
import { dot, labelText, line, rectangle, vector } from '../defaults.mjs';
export function drawScaleConventions(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('scale-conventions', state),
    currentBeat = modelState.step,
    progress2 = modelState.q;
  const ready = (name) => cueDone(state, 'lp-scale-conventions-' + name);
  api.focus.target('lp-scale-conventions-trace', () => {
    if (currentBeat === 0) {
      for (const [name, formula, reverse, i, color] of [
        ['S = 10/448', '500 / S', 'q × S', 0, themeColors.blue],
        ['α = 448/10', 'α × 500', 'q / α', 1, themeColors.cyan],
      ]) {
        const y = 390 + i * 300;
        labelText(ctx, api, name, 150, y + 45, 31, color);
        const xs = [560, 990, 1450],
          labels = [formula, 'Q(22,400) = 448', reverse + ' = 10'];
        labels.forEach((v, j) => {
          rectangle(ctx, api, xs[j] - 150, y, 330, 100, color);
          labelText(
            ctx,
            api,
            j === 0 || ready('reciprocal') ? v : '?',
            xs[j] + 15,
            y + 61,
            j === 1 ? 25 : 29,
            color,
            'center',
          );
          if (j) line(ctx, api, xs[j - 1] + 180, y + 50, xs[j] - 150, y + 50, color, 3);
        });
        dot(ctx, api, 560 + progress2 * 890, y + 160, themeColors.yellow, 11);
      }
      labelText(
        ctx,
        api,
        'Same activation, same encoded value, reciprocal scale conventions',
        960,
        1010,
        28,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      labelText(ctx, api, 'Finite positive amax', 960, 330, 33, themeColors.blue, 'center');
      labelText(ctx, api, 'S = amax / 448', 560, 490, 39, themeColors.blue, 'center');
      labelText(ctx, api, 'α = 448 / amax', 1400, 490, 39, themeColors.cyan, 'center');
      labelText(ctx, api, 'Zero-only group', 960, 660, 34, themeColors.yellow, 'center');
      vector(ctx, api, Array(16).fill(0), 270, 730, 1380, 75);
      labelText(
        ctx,
        api,
        ready('zero') ? 'S = 1 · codes remain zero' : 'Positive scale policy = ?',
        960,
        965,
        35,
        themeColors.green,
        'center',
      );
    } else {
      vector(ctx, api, [1, 1, 1, 2], 300, 350, 1300, 90);
      vector(ctx, api, [1, 1, 1, 1], 300, 485, 1300, 80);
      labelText(ctx, api, 'qX', 180, 405, 28, themeColors.blue);
      labelText(ctx, api, 'qW', 180, 535, 28, themeColors.cyan);
      for (let i = 0; i < 2; i++) {
        line(
          ctx,
          api,
          300 + i * 650,
          605,
          950 + i * 650,
          605,
          i ? themeColors.pink : themeColors.blue,
          4,
        );
        labelText(
          ctx,
          api,
          'block ' + i + ' · scale product ' + (i ? 8 : 5),
          625 + i * 650,
          680,
          29,
          i ? themeColors.pink : themeColors.blue,
          'center',
        );
      }
      labelText(
        ctx,
        api,
        progress2 > 0.45 ? 'partials: 2 and 3' : 'partial dots = ?',
        960,
        790,
        32,
        themeColors.green,
        'center',
      );
      labelText(
        ctx,
        api,
        progress2 > 0.8 ? '2 × 5 + 3 × 8 = 34' : 'Each partial retains its changing scale',
        960,
        900,
        35,
        themeColors.yellow,
        'center',
      );
      labelText(
        ctx,
        api,
        'Real arithmetic over reconstructed operands · reordering can round differently',
        960,
        1015,
        26,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'scale-conventions',
  draw: drawScaleConventions,
  cues: [
    'lp-scale-conventions-build-0',
    'lp-scale-conventions-reciprocal',
    'lp-scale-conventions-build-1',
    'lp-scale-conventions-zero',
    'lp-scale-conventions-build-2',
  ],
};
