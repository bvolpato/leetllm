import { box, cueAtEnd, detailEquation, detailText } from '../defaults.mjs';
export function drawCoordinateNoise(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const branchTarget =
    currentBeat === 3 ? 'coordinate-noise-extension-4' : 'coordinate-noise-mechanism';
  api.focus.target(branchTarget, () => {
    if (currentBeat === 0) {
      detailText(
        ctx,
        api,
        'Each coordinate contributes its variance',
        960,
        275,
        36,
        themeColors.cyan,
        'center',
      );
      const count = Math.floor(8 * api.focus.progress('coordinate-noise-b1', 0));
      for (let i = 0; i < 8; i++) {
        const x = 260 + i * 200;
        box(ctx, api, x, 410, 140, 140, i < count ? themeColors.pink : themeColors.muted);
        if (i < count) detailText(ctx, api, 'σ²C²', x + 70, 495, 32, themeColors.pink, 'center');
      }
      detailEquation(
        ctx,
        api,
        String.raw`\mathbb E\|Z\|_2^2=d\sigma^2C^2\quad\Rightarrow\quad\operatorname{RMS}\|Z\|_2=\sigma C\sqrt d`,
        960,
        730,
        43,
        themeColors.yellow,
      );
      detailEquation(
        ctx,
        api,
        String.raw`\operatorname{RMS\ step}=\eta\sigma C\sqrt d/L`,
        960,
        950,
        44,
        themeColors.green,
      );
    } else if (currentBeat === 1) {
      detailText(
        ctx,
        api,
        'Same per-coordinate noise · different coordinate counts',
        960,
        280,
        36,
        themeColors.cyan,
        'center',
      );
      const ratio = Math.sqrt(7e9 / 5e6);
      detailText(ctx, api, 'Adapter · 5 million', 200, 425, 34, themeColors.blue);
      api.rect(ctx, 700, 380, 1030 / ratio, 85, themeColors.blue);
      detailText(ctx, api, 'Full · 7 billion', 200, 690, 34, themeColors.pink);
      api.rect(ctx, 700, 645, 1030, 85, themeColors.pink);
      const showLengths = cueAtEnd(ctx, api, 'coordinate-noise-rms-ratio');
      if (showLengths) {
        [5e6, 7e9].forEach((d, i) => {
          const rms = Math.sqrt(d);
          detailText(ctx, api, 'Sum RMS  ' + rms.toFixed(2) + '     step RMS  ' + (0.01 * rms / 128).toFixed(2), 700, 530 + 250 * i, 32, themeColors.ink);
        });
      }
      detailText(
        ctx,
        api,
        cueAtEnd(ctx, api, 'coordinate-noise-rms-ratio')
          ? 'RMS ratio √1400 ≈ ' + ratio.toFixed(2)
          : 'Length of each bar = RMS of the sum noise',
        960,
        870,
        42,
        cueAtEnd(ctx, api, 'coordinate-noise-rms-ratio') ? themeColors.yellow : themeColors.muted,
        'center',
      );
      detailText(
        ctx,
        api,
        cueAtEnd(ctx, api, 'coordinate-noise-energy-ratio')
          ? 'Expected squared-norm ratio = 1400     •     σC = 1,   L = 128,   η = 0.01'
          : 'Equal per-coordinate SD = 1     •     L = 128,   η = 0.01',
        960,
        1010,
        30,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 2) {
      detailText(
        ctx,
        api,
        'Freeze the base · bound the incremental training path',
        960,
        280,
        36,
        themeColors.cyan,
        'center',
      );
      for (let i = 0; i < 16; i++)
        api.rect(
          ctx,
          300 + (i % 4) * 95,
          390 + Math.floor(i / 4) * 95,
          70,
          70,
          themeColors.panel,
          themeColors.muted,
          2,
        );
      detailText(ctx, api, 'Fixed non-private base', 490, 850, 32, themeColors.muted, 'center');
      api.arrow(ctx, 780, 560, 1050, 560, themeColors.blue, 5);
      for (let i = 0; i < 8; i++)
        api.rect(
          ctx,
          1150 + (i % 4) * 130,
          450 + Math.floor(i / 4) * 130,
          95,
          95,
          themeColors.panel,
          themeColors.blue,
          2,
        );
      detailText(
        ctx,
        api,
        'Clip and perturb adapter gradients',
        1410,
        850,
        31,
        themeColors.blue,
        'center',
      );
      detailText(
        ctx,
        api,
        'Private fine-tuning does not retroactively protect base training',
        960,
        1010,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      detailText(
        ctx,
        api,
        'Frozen W₀ plus a low-rank update',
        960,
        270,
        38,
        themeColors.cyan,
        'center',
      );
      detailEquation(
        ctx,
        api,
        String.raw`W=W_0+\frac{\alpha}{r}BA`,
        960,
        390,
        53,
        themeColors.yellow,
      );
      const grids = [
        {
          x: 250,
          rows: 4,
          cols: 4,
          col: themeColors.muted,
          label: 'W₀: 4 × 4 frozen',
        },
        {
          x: 1000,
          rows: 4,
          cols: 1,
          col: themeColors.blue,
          label: 'B: 4 × 1',
        },
        {
          x: 1370,
          rows: 1,
          cols: 4,
          col: themeColors.pink,
          label: 'A: 1 × 4',
        },
      ];
      grids.forEach((g) => {
        for (let i = 0; i < g.rows; i++)
          for (let j = 0; j < g.cols; j++)
            api.rect(ctx, g.x + j * 70, 500 + i * 70, 55, 55, themeColors.panel, g.col, 2);
        detailText(ctx, api, g.label, g.x, 855, 30, g.col);
      });
      detailText(
        ctx,
        api,
        'Rank 1: 1 × (4 + 4) = 8 trainable coordinates vs 16 full weights',
        960,
        970,
        32,
        themeColors.green,
        'center',
      );
      detailText(
        ctx,
        api,
        'Clip each protected unit’s joint gradient over both factors',
        960,
        1040,
        28,
        themeColors.muted,
        'center',
      );
    }
  });
  return;
}
export default {
  id: 'coordinate-noise',
  draw: drawCoordinateNoise,
  cues: [
    'coordinate-noise-b1',
    'coordinate-noise-b2',
    'dp-result-coordinate-noise-rms-ratio',
    'dp-result-coordinate-noise-energy-ratio',
    'coordinate-noise-b3',
    'coordinate-noise-extension-4',
  ],
};
