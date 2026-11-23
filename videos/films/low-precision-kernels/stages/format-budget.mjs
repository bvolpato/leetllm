import { cueDone, sampleModel } from '../construction.mjs';
import { bits, labelText, line, vector } from '../defaults.mjs';
export function drawFormatBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('format-budget', state),
    currentBeat = modelState.step,
    progress2 = modelState.q;
  const ready = (name) => cueDone(state, 'lp-format-budget-' + name);
  api.focus.target('lp-format-budget-trace', () => {
    if (currentBeat === 0) {
      const rows = [
          ['FP32', 1, 8, 23],
          ['BF16', 1, 8, 7],
          ['FP16', 1, 5, 10],
        ],
        width = 1250 / 32;
      rows.forEach(([name, sign, exponent, fraction], i) => {
        const y = 350 + i * 180;
        labelText(ctx, api, name, 150, y + 45, 34);
        let x = 410;
        [sign, exponent, fraction].forEach((n, j) => {
          const visible = Math.max(
            0,
            Math.min(
              n,
              Math.floor(progress2 * 32 - (j === 0 ? 0 : j === 1 ? sign : sign + exponent)),
            ),
          );
          for (let k = 0; k < n; k++)
            api.rect(
              ctx,
              x + k * width,
              y,
              width - 2,
              62,
              k < visible
                ? [themeColors.pink, themeColors.blue, themeColors.cyan][j]
                : themeColors.panel,
              themeColors.muted,
              0,
            );
          labelText(
            ctx,
            api,
            n + ' ' + ['sign', 'exponent', 'fraction'][j],
            x + (n * width) / 2,
            y + 110,
            23,
            [themeColors.pink, themeColors.blue, themeColors.cyan][j],
            'center',
          );
          x += n * width;
        });
      });
      labelText(
        ctx,
        api,
        'Same bit-cell width · shorter rows store fewer bits',
        960,
        995,
        26,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      labelText(ctx, api, 'TF32: FP32 storage', 150, 300, 32, themeColors.blue);
      const size = 1480 / 32;
      for (let i = 0; i < 32; i++)
        api.rect(
          ctx,
          240 + i * size,
          345,
          size - 2,
          70,
          themeColors.panel,
          i === 0 ? themeColors.pink : i < 9 ? themeColors.blue : themeColors.muted,
          0,
        );
      for (let i = 9; i < 19; i++)
        api.rect(ctx, 240 + i * size, 345, size - 2, 70, themeColors.cyan, themeColors.panel, 0);
      labelText(
        ctx,
        api,
        '32 stored bits · matrix path reads 10 fraction bits',
        960,
        465,
        30,
        themeColors.cyan,
        'center',
      );
      [
        ['E4M3', 4, 3, 7, 448],
        ['E5M2', 5, 2, 15, 57344],
      ].forEach(([name, e, f, bias, max], i) => {
        const y = 565 + i * 195;
        labelText(ctx, api, name, 150, y + 38, 32);
        const labels = ['0', ...Array(e).fill('e'), ...Array(f).fill('f')];
        vector(ctx, api, labels, 430, y, 650, 70);
        labelText(ctx, api, 'bias ' + bias, 1170, y + 40, 28, themeColors.blue);
        labelText(
          ctx,
          api,
          ready('limits') ? 'max ' + max : 'finite limit pending',
          1170,
          y + 96,
          28,
          themeColors.yellow,
        );
      });
    } else if (currentBeat === 2) {
      const x = (v) => 260 + (v - 1) * 1330;
      [3, 2].forEach((f, i) => {
        const y = 395 + i * 220;
        labelText(
          ctx,
          api,
          i ? 'E5M2' : 'E4M3',
          150,
          y - 65,
          32,
          i ? themeColors.pink : themeColors.blue,
        );
        line(ctx, api, 260, y, 1590, y);
        for (let k = 0; k <= 2 ** f; k++) {
          const xx = x(1 + k / 2 ** f);
          line(ctx, api, xx, y - 16, xx, y + 16, i ? themeColors.pink : themeColors.blue, 3);
        }
        labelText(
          ctx,
          api,
          ready('spacing') ? 'Δ = ' + 1 / 2 ** f : 'spacing = ?',
          1690,
          y - 50,
          28,
          themeColors.yellow,
          'right',
        );
      });
      labelText(
        ctx,
        api,
        'Normalized one-spike row · n = 1,024 · before affine and epsilon',
        960,
        825,
        29,
        themeColors.muted,
        'center',
      );
      const n = Math.sqrt(1023);
      labelText(
        ctx,
        api,
        'Supplied row: one 1 and 1,023 zeros',
        960,
        875,
        28,
        themeColors.blue,
        'center',
      );
      labelText(
        ctx,
        api,
        progress2 > 0.25 ? 'mean = 1/1,024' : 'mean = ?',
        430,
        945,
        28,
        themeColors.blue,
        'center',
      );
      labelText(
        ctx,
        api,
        progress2 > 0.55 ? 'σ = √1023/1,024' : 'σ = ?',
        1290,
        945,
        28,
        themeColors.cyan,
        'center',
      );
      labelText(
        ctx,
        api,
        ready('norm') ? '(1 − mean) / σ = √1023 ≈ ' + n.toFixed(2) : 'outlier magnitude = ?',
        960,
        1025,
        32,
        themeColors.yellow,
        'center',
      );
    } else {
      bits(ctx, api, 0x38, 330, 345, 1000);
      labelText(
        ctx,
        api,
        'sign bit 0 | exponent 7 | fraction 0',
        960,
        530,
        30,
        themeColors.muted,
        'center',
      );
      labelText(
        ctx,
        api,
        'OCP: 2^(7 − 7) × (1 + 0/8) = 1',
        960,
        640,
        34,
        themeColors.blue,
        'center',
      );
      labelText(
        ctx,
        api,
        'FNUZ: 2^(7 − 8) × (1 + 0/8) = 0.5',
        960,
        730,
        34,
        themeColors.pink,
        'center',
      );
      bits(ctx, api, 0x80, 340, 820, 720);
      labelText(
        ctx,
        api,
        ready('bias') ? 'OCP −0 · FNUZ NaN' : 'Same 0x80 · two encodings',
        1450,
        860,
        29,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'format-budget',
  draw: drawFormatBudget,
  cues: [
    'lp-format-budget-build-0',
    'lp-format-budget-build-1',
    'lp-format-budget-limits',
    'lp-format-budget-build-2',
    'lp-format-budget-spacing',
    'lp-format-budget-norm',
    'lp-format-budget-build-3',
    'lp-format-budget-bias',
  ],
};
