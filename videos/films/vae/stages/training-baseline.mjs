import { built, clamped, cueAmount } from '../arithmetic.mjs';
import { TRAINED_AE } from '../fixtures.mjs';
import { arrow, bar, chapterGrid, chapterText, line, note, point } from '../defaults.mjs';
export function drawTrainingBaseline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamped(state.beatP ?? 0),
    q = cueAmount(state, 'vae-training-baseline-' + currentBeat + '-build', progress),
    ready = (id) => built(state, 'vae-training-baseline-' + id);
  {
    if (currentBeat === 0) {
      const widths = [25, 8, 2, 8, 25],
        xs = [230, 560, 890, 1220, 1550],
        counts = [5, 4, 2, 4, 5];
      widths.forEach((n, j) => {
        chapterText(
          ctx,
          api,
          String(n),
          xs[j],
          320,
          40,
          j === 2 ? themeColors.yellow : themeColors.ink,
          'center',
        );
        for (let i = 0; i < counts[j]; i++) {
          const y = 450 + i * 65;
          point(
            ctx,
            api,
            xs[j],
            y,
            j === 2 ? themeColors.yellow : j < 2 ? themeColors.cyan : themeColors.green,
            12,
          );
          if (j < 4 && q > (j + 1) / 6)
            for (let k = 0; k < counts[j + 1]; k++)
              line(ctx, api, xs[j] + 20, y, xs[j + 1] - 20, 450 + k * 65, themeColors.muted, 1.3);
        }
        chapterText(
          ctx,
          api,
          j < 2 ? 'encoder' : j === 2 ? 'code' : 'decoder',
          xs[j],
          850,
          28,
          themeColors.muted,
          'center',
        );
      });
      note(
        ctx,
        api,
        'Actual CPU network · tanh hidden layers · sigmoid output · Adam updates both maps.',
      );
    } else {
      chapterText(
        ctx,
        api,
        '4 of the actual 48 noisy crops',
        420,
        300,
        31,
        themeColors.ink,
        'center',
      );
      for (let j = 0; j < 4; j++) {
        const gx = 210 + (j % 2) * 235,
          gy = 375 + Math.floor(j / 2) * 235;
        chapterGrid(ctx, api, TRAINED_AE.rows[j], gx, gy, 34);
        chapterText(ctx, api, 'sample ' + j, gx + 80, gy + 192, 25, themeColors.muted, 'center');
      }
      const initial = 0.1537,
        final = 0.0006,
        trained = ready('trained') || currentBeat === 2,
        constant = ready('constant') || currentBeat === 2;
      chapterText(ctx, api, 'same-data MSE', 1110, 320, 33, themeColors.ink, 'center');
      line(ctx, api, 830, 760, 1680, 760);
      [
        [initial, 'before updates', themeColors.pink],
        [trained ? final : null, 'after 250 updates', themeColors.cyan],
        [constant ? final : null, 'constant mean crop', themeColors.yellow],
      ].forEach(([v, label, color], i) => {
        const y = 430 + i * 115;
        chapterText(ctx, api, label, 820, y - 20, 29, color);
        if (v !== null) {
          bar(ctx, api, 820, y, Math.max(3, (v / initial) * 730), 36, color);
          chapterText(ctx, api, '≈ ' + v.toFixed(4), 1640, y + 28, 30, color, 'center');
        } else chapterText(ctx, api, 'await result', 1250, y + 28, 29, themeColors.muted, 'center');
      });
      if (currentBeat === 2) {
        arrow(ctx, api, 680, 600, 780, 600, themeColors.yellow);
        chapterText(
          ctx,
          api,
          'Swap the codes. Where does the patch go?',
          1190,
          865,
          30,
          themeColors.ink,
          'center',
        );
      }
      note(ctx, api, 'Both predictors see 48 variations of the same badge.');
    }
  }
}
export default {
  id: 'training-baseline',
  draw: drawTrainingBaseline,
  cues: [
    'vae-training-baseline-0-build',
    'vae-training-baseline-1-build',
    'vae-training-baseline-trained',
    'vae-training-baseline-constant',
    'vae-training-baseline-2-build',
  ],
};
