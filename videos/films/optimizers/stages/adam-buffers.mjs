import { COLD } from '../fixtures.mjs';
import { fmt, pair, texPair } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawOptimizerFocus,
  drawOptimizerHeader,
  drawOptimizerLine,
  drawOptimizerMath,
  drawOptimizerText,
} from '../defaults.mjs';
import { preserveLegacyPaletteReads } from '../compatibility.mjs';
export function drawAdamBuffers(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  const q = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  preserveLegacyPaletteReads(themeColors);
  {
    drawOptimizerHeader(
      ctx,
      api,
      themeColors,
      'Reset to g = (100, 1) · β₁ = 0.9 · β₂ = 0.999',
      'Squared size is the uncentered second moment',
    );
    const n = currentBeat < 2 ? 1 : 1 + Math.floor(q('cold-start-check', 2, 0.03, 0.68) * 2 + 1e-9),
      r = COLD.records[n - 1];
    const columns = [
      {
        x: 240,
        color: themeColors.cyan,
        title: 'Signed memory m',
        raw: r.mean,
        weight: 1 - 0.9 ** n,
        maxWeight: 0.3,
        beta: '0.9',
        hat: r.correctedMean,
        id: 'adam-mean',
        cue: 'adam-raw-mean',
        correct: 'corrected-mean',
        correctCue: 'correct-mean',
      },
      {
        x: 1060,
        color: themeColors.green,
        title: 'Squared-size memory v',
        raw: r.square,
        weight: 1 - 0.999 ** n,
        maxWeight: 0.003,
        beta: '0.999',
        hat: r.correctedSquare,
        id: 'adam-square',
        cue: 'adam-raw-square',
        correct: 'corrected-square',
        correctCue: 'correct-square',
      },
    ];
    for (const col of columns) {
      const rawQ = q(col.cue, 0, col.x < 500 ? 0.3 : 0.55, col.x < 500 ? 0.5 : 0.75);
      drawOptimizerText(ctx, api, themeColors, col.title, col.x, 340, 40, col.color);
      drawOptimizerFocus(ctx, api, col.id, () => {
        drawOptimizerMath(
          ctx,
          api,
          themeColors,
          col.x < 500 ? 'm_t=0.9m_{t-1}+0.1g_t' : 'v_t=0.999v_{t-1}+0.001g_t^2',
          col.x,
          400,
          34,
          col.color,
        );
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          rawQ === 1 ? 'raw ≈ ' + pair(col.raw, 5) : 'raw = (?, ?)',
          col.x,
          475,
          36,
          col.color,
        );
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          'Observed weight 1 − ' + col.beta + 'ᵗ',
          col.x,
          540,
          31,
        );
        drawOptimizerLine(
          ctx,
          api,
          themeColors,
          col.x,
          605,
          col.x + 580,
          605,
          themeColors.muted,
          2,
        );
        if (rawQ > 0)
          api.rect(
            ctx,
            col.x,
            580,
            ((580 * col.weight) / col.maxWeight) * rawQ,
            50,
            col.color,
            undefined,
            2,
          );
        drawOptimizerText(ctx, api, themeColors, '0', col.x, 655, 25, themeColors.muted);
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          fmt(col.maxWeight, 3),
          col.x + 580,
          655,
          25,
          themeColors.muted,
          'right',
        );
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          rawQ === 1 ? 'weight ≈ ' + fmt(col.weight, 6) : 'weight = ?',
          col.x,
          720,
          30,
          col.color,
        );
      });
      drawOptimizerFocus(ctx, api, col.correct, () => {
        const visible =
          q(col.correctCue, 1, col.x < 500 ? 0.25 : 0.55, col.x < 500 ? 0.48 : 0.75) === 1;
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          visible ? 'raw ÷ (1 − ' + col.beta + 'ᵗ)' : 'corrected = ?',
          col.x,
          815,
          32,
          themeColors.muted,
        );
        if (visible)
          drawOptimizerMath(
            ctx,
            api,
            themeColors,
            '\\widehat{' + (col.x < 500 ? 'm' : 'v') + '}=' + texPair(col.hat),
            col.x,
            900,
            42,
            col.color,
          );
      });
    }
    const completed =
      currentBeat === 0 &&
      (q('adam-raw-mean', 0, 0.3, 0.5) < 1 || q('adam-raw-square', 0, 0.55, 0.75) < 1)
        ? 0
        : n;
    drawOptimizerFocus(ctx, api, 'cold-start-growth', () =>
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        'Completed updates t = ' + completed + '  ·  η = 0  ·  parameters = (1, 1)',
        960,
        1000,
        31,
        themeColors.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'adam-buffers',
  draw: drawAdamBuffers,
  cues: ['adam-raw-mean', 'adam-raw-square', 'correct-mean', 'correct-square', 'cold-start-check'],
};
