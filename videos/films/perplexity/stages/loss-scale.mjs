import { ppl, probabilities, total } from '../fixtures.mjs';
import { spokenCue } from '../construction.mjs';
import { drawExtendedLine, drawExtendedText, drawExtendedTitle } from '../defaults.mjs';
export function drawLossScale(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (id) => spokenCue(scene, state, id);
  {
    if (currentBeat === 0) {
      const k =
        cue('split-eight').phase === 'after' ? 16 : cue('split-four').phase === 'after' ? 8 : 4;
      const splitting =
        cue('split-eight').phase === 'during'
          ? cue('split-eight').progress
          : cue('split-four').phase === 'during'
            ? cue('split-four').progress
            : 0;
      const showCount =
        k === 4 || cue(k === 8 ? 'double-choice' : 'double-again').phase === 'after';
      drawExtendedTitle(ctx, api, 'Each slice has the same chance');
      api.focus.target('uniform-choices', () => {
        api.circle(ctx, 650, 650, 240, 'transparent', themeColors.blue, 3);
        for (let i = 0; i < k; i++) {
          let a = (i / k) * 2 * Math.PI;
          drawExtendedLine(
            ctx,
            api,
            650,
            650,
            650 + Math.cos(a) * 240,
            650 + Math.sin(a) * 240,
            themeColors.blue,
            2,
          );
          if (splitting > 0) {
            const middle = ((i + 0.5) / k) * 2 * Math.PI;
            drawExtendedLine(
              ctx,
              api,
              650,
              650,
              650 + Math.cos(middle) * 240 * splitting,
              650 + Math.sin(middle) * 240 * splitting,
              themeColors.blue,
              2,
            );
          }
          if (k <= 8) {
            a = ((i + 0.5) / k) * 2 * Math.PI;
            drawExtendedText(
              ctx,
              api,
              i + 1,
              650 + Math.cos(a) * (240 + 45),
              660 + Math.sin(a) * (240 + 45),
              28,
              themeColors.blue,
              'center',
            );
          }
        }
      });
      api.focus.target('choice-count', () => {
        if (showCount)
          drawExtendedText(ctx, api, 'K = ' + k, 1450, 430, 52, themeColors.blue, 'center');
        drawExtendedText(ctx, api, 'p = 1/' + k, 1450, 600, 40, themeColors.cyan, 'center');
        drawExtendedText(
          ctx,
          api,
          '−ln(p) = ' + Math.log(k).toFixed(3) + ' nats',
          1450,
          760,
          37,
          themeColors.yellow,
          'center',
        );
        if (showCount)
          drawExtendedText(
            ctx,
            api,
            'exp(ln K) = ' + k,
            1450,
            910,
            40,
            themeColors.green,
            'center',
          );
      });
      drawExtendedText(
        ctx,
        api,
        'Each added ln(2) of loss doubles the equivalent choice count',
        960,
        1030,
        32,
        themeColors.ink,
        'center',
      );
    } else if (currentBeat === 1) {
      const equivalent = Math.exp(-total / probabilities.length);
      const revealed = cue('equivalent-share').phase === 'after';
      drawExtendedTitle(ctx, api, 'Probability assigned to the word that appeared');
      api.focus.target('equivalent-share', () => {
        const labels = ['Fair three-way guess', 'Same mean loss as the sentence'];
        [1 / 3, equivalent].forEach((share, i) => {
          const y = 405 + i * 245;
          const color = i === 0 ? themeColors.blue : themeColors.cyan;
          drawExtendedText(ctx, api, labels[i], 200, y - 35, 39, color);
          api.rect(ctx, 200, y, 1250, 87, themeColors.panel, themeColors.muted, 2);
          if (i === 0 || revealed) {
            api.rect(ctx, 200, y, 1250 * share, 87, color);
            drawExtendedText(
              ctx,
              api,
              (100 * share).toFixed(1) + '%',
              1625,
              y + 58,
              48,
              color,
              'center',
            );
          }
          if (i === 0)
            api.line(
              ctx,
              200 + (1250 * 2) / 3,
              y,
              200 + (1250 * 2) / 3,
              y + 87,
              themeColors.muted,
              2,
            );
        });
        const words = ['on', 'the', 'mat'];
        const shares = probabilities.map((p, i) => words[i] + '  ' + Math.round(100 * p) + '%');
        drawExtendedText(ctx, api, shares.join('     ·     '), 200, 810, 34, themeColors.muted);
        if (revealed) {
          const product = probabilities.map((p) => p.toFixed(2)).join(' × ');
          drawExtendedText(
            ctx,
            api,
            '∛(' + product + ') ≈ ' + equivalent.toFixed(3),
            1030,
            810,
            35,
            themeColors.cyan,
          );
        }
      });
      api.focus.target('equivalent-count', () => {
        const text =
          cue('effective-count').phase === 'after'
            ? 'Perplexity ≈ 1 / ' + equivalent.toFixed(3) + ' ≈ ' + ppl.toFixed(2)
            : 'Which single probability gives the same average surprise?';
        drawExtendedText(ctx, api, text, 960, 970, 44, themeColors.ink, 'center');
      });
    } else {
      drawExtendedTitle(ctx, api, 'Two possible tokens at each step');
      for (let i = 0; i < 2; i++) {
        const y = 410 + i * 240;
        drawExtendedText(
          ctx,
          api,
          'Observed ' + ['A', 'B'][i],
          200,
          y + 45,
          31,
          i ? themeColors.pink : themeColors.blue,
        );
        api.rect(ctx, 550, y, 12, 85, i ? themeColors.pink : themeColors.blue);
        api.rect(ctx, 562, y, 1188, 85, themeColors.panel, themeColors.muted, 2);
        drawExtendedText(ctx, api, '0.01', 550, y + 150, 29, themeColors.yellow, 'center');
        drawExtendedText(
          ctx,
          api,
          'other token: 0.99',
          1160,
          y + 55,
          31,
          themeColors.muted,
          'center',
        );
      }
      api.focus.target('wrong-count', () =>
        drawExtendedText(
          ctx,
          api,
          cue('wrong-ppl').phase === 'after'
            ? 'PPL = exp(−ln 0.01) = 100 > vocabulary 2'
            : 'Predict perplexity from the observed 0.01 mass',
          960,
          1030,
          39,
          themeColors.yellow,
          'center',
        ),
      );
    }
    return;
  }
}
export default {
  id: 'loss-scale',
  draw: drawLossScale,
  cues: [
    'double-choice',
    'uniform-four',
    'split-four',
    'split-eight',
    'double-again',
    'equivalent-share',
    'effective-count',
    'wrong-ppl',
  ],
};
