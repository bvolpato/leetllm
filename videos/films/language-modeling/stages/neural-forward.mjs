import { bound } from '../arithmetic.mjs';
import { FITTED_NGRAM } from '../fixtures.mjs';
import { languageStep } from '../construction.mjs';
import { extendedLanguageState } from '../model.mjs';
import {
  drawExtendedCell,
  drawExtendedEquation,
  drawExtendedFoot,
  drawExtendedGrid,
  drawExtendedHead,
  drawExtendedText,
  formatLanguage,
  mixLanguage,
} from '../defaults.mjs';
export function drawNeuralForward(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('neural-forward', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('neural-forward-construction', () => {
    const m = extendedLanguageState('neural-forward', state);
    if (currentBeat === 2 && S(2, 2) > 0) {
      drawExtendedHead(ctx, api, 'Two comments begin with the same words');
      drawExtendedText(ctx, api, 'Training comment', 235, 385, 36, themeColors.muted);
      drawExtendedText(
        ctx,
        api,
        'Model probability of the last word',
        940,
        385,
        36,
        themeColors.muted,
      );
      for (const [i, word] of ['result', 'error'].entries()) {
        const y = 446 + 158 * i;
        const probability = m.probabilities[FITTED_NGRAM.vocab.indexOf(word)];
        const color = i === 0 ? themeColors.green : themeColors.blue;
        drawExtendedText(ctx, api, 'test returns', 235, y + 61, 54);
        drawExtendedText(ctx, api, word, 558, y + 61, 54, color);
        api.rect(ctx, 940, y, 590, 80, themeColors.panel, themeColors.muted, 4);
        api.rect(ctx, 940, y, 590 * probability, 80, color, undefined, 4);
        drawExtendedText(ctx, api, (probability * 100).toFixed(2) + '%', 1590, y + 58, 44, color);
      }
      if (S(2, 3) > 0)
        drawExtendedText(
          ctx,
          api,
          'Score = contribution from “test” + contribution from “returns” + bias',
          960,
          867,
          38,
          themeColors.ink,
          'center',
        );
      drawExtendedFoot(ctx, api, 'Mean training loss on six targets     2.145 → 0.235 nats');
      return;
    }
    drawExtendedHead(
      ctx,
      api,
      currentBeat === 0
        ? 'Look up two learned rows · concatenate their actual coordinates'
        : currentBeat === 1
          ? 'Accumulate the actual value logit'
          : 'Change function to test · preserve the fitted parameters',
    );
    if (currentBeat === 0) {
      FITTED_NGRAM.vocab.forEach((word, i) =>
        drawExtendedText(
          ctx,
          api,
          word,
          120,
          348 + i * 59,
          25,
          [1, 5].includes(i) ? themeColors.cyan : themeColors.muted,
        ),
      );
      drawExtendedGrid(
        ctx,
        api,
        FITTED_NGRAM.embeddings.map((r) => r.map((v) => formatLanguage(ctx, api, v, 2))),
        300,
        310,
        760,
        472,
        themeColors.blue,
        24,
        [1, 5].flatMap((row) =>
          Array.from(
            {
              length: 6,
            },
            (_, column) => ({
              row,
              column,
              fill: '#163b46',
              stroke: themeColors.cyan,
            }),
          ),
        ),
      );
      const p = S(0, 1);
      drawExtendedText(
        ctx,
        api,
        'E: 8 rows × 6 coordinates',
        680,
        850,
        30,
        themeColors.blue,
        'center',
      );
      const selected = [1, 5];
      selected.forEach((ri, i) => {
        if (p > i / 2) {
          const frac = bound(p * 2 - i),
            fromY = 310 + (ri + 0.5) * 59,
            toY = 360 + i * 200;
          api.arrow(
            ctx,
            1075,
            fromY,
            mixLanguage(ctx, api, 1075, 1160, frac),
            mixLanguage(ctx, api, fromY, toY, frac),
            themeColors.cyan,
            4,
          );
          if (frac === 1) {
            drawExtendedText(
              ctx,
              api,
              FITTED_NGRAM.vocab[ri],
              1430,
              toY - 35,
              28,
              themeColors.cyan,
              'center',
            );
            drawExtendedGrid(
              ctx,
              api,
              [FITTED_NGRAM.embeddings[ri].map((v) => formatLanguage(ctx, api, v, 2))],
              1165,
              toY,
              630,
              70,
              themeColors.cyan,
              23,
            );
          }
        }
      });
      if (E(0, 2)) {
        drawExtendedEquation(ctx, api, String.raw`48+96+8=152`, 1460, 850, 40, themeColors.yellow);
        drawExtendedText(
          ctx,
          api,
          'embedding + affine map + biases',
          1460,
          910,
          24,
          themeColors.muted,
          'center',
        );
      }
      if (E(0, 3))
        drawExtendedFoot(
          ctx,
          api,
          'This lab uses an affine head; the historical Bengio model also had a tanh route',
        );
    } else {
      drawExtendedText(ctx, api, m.prefix.join(' '), 210, 320, 30, themeColors.cyan);
      drawExtendedText(
        ctx,
        api,
        'coordinate × value weight',
        650,
        320,
        25,
        themeColors.muted,
        'center',
      );
      const phase = currentBeat === 1 ? m.accumulation : S(2, 0),
        applied = currentBeat === 1 ? m.completed : Math.floor(phase * 13);
      m.features.forEach((x, i) => {
        const col = i % 6,
          row = Math.floor(i / 6),
          xx = 150 + col * 180,
          yy = 370 + row * 105;
        const ink =
          i < applied ? themeColors.muted : i === applied ? themeColors.yellow : themeColors.blue;
        drawExtendedCell(
          ctx,
          api,
          `${formatLanguage(ctx, api, x, 2)} × ${formatLanguage(ctx, api, FITTED_NGRAM.weights[i][7], 2)}`,
          xx,
          yy,
          165,
          64,
          ink,
          23,
        );
        drawExtendedText(ctx, api, 'x' + i, xx + 82, yy + 90, 20, themeColors.muted, 'center');
      });
      const plot = api.teaching.axes({
        x: 190,
        y: 660,
        width: 1030,
        height: 245,
        xDomain: [0, 13],
        yDomain: [-5, 9],
        xTicks: [0, 6, 12, 13],
        yTicks: [-4, 0, 4, 8],
        fontSize: 23,
        color: themeColors.muted,
      });
      let sum = 0;
      const points = [
          {
            x: 0,
            y: 0,
          },
        ],
        terms = m.terms;
      for (let i = 0; i < applied && i < 13; i++) {
        sum += terms[i];
        points.push({
          x: i + 1,
          y: sum,
        });
      }
      const fraction = phase * 13 - Math.floor(phase * 13);
      if (applied < 13 && fraction > 0)
        points.push({
          x: applied + fraction,
          y: sum + terms[applied] * fraction,
        });
      api.teaching.curve({
        plot,
        points,
        color: themeColors.cyan,
        width: 5,
      });
      const partial = points.at(-1).y;
      drawExtendedText(
        ctx,
        api,
        (applied === 13 ? 'logit' : 'partial sum') + ' ' + formatLanguage(ctx, api, partial, 3),
        700,
        975,
        31,
        applied === 13 ? themeColors.green : themeColors.yellow,
        'center',
      );
      drawExtendedText(
        ctx,
        api,
        'bias ' + formatLanguage(ctx, api, m.valueBias, 3),
        1110,
        625,
        24,
        themeColors.muted,
        'center',
      );
      if (applied < 12)
        drawExtendedText(
          ctx,
          api,
          `active x${applied}: ${Number(m.features[applied].toPrecision(3))} × ${Number(FITTED_NGRAM.weights[applied][7].toPrecision(3))}`,
          590,
          615,
          26,
          themeColors.yellow,
          'center',
        );
      drawExtendedText(
        ctx,
        api,
        'Complete vocabulary head',
        1530,
        330,
        27,
        themeColors.blue,
        'center',
      );
      FITTED_NGRAM.vocab.forEach((word, j) => {
        const ready =
          currentBeat === 2 ? E(2, 0) : j === 7 ? E(1, 2) : [0, 4].includes(j) ? E(1, 3) : E(1, 4);
        const y = 382 + j * 57,
          selected = j === (currentBeat === 2 ? 4 : 7);
        drawExtendedText(
          ctx,
          api,
          word,
          1320,
          y,
          26,
          selected ? themeColors.green : themeColors.muted,
        );
        drawExtendedText(
          ctx,
          api,
          ready ? formatLanguage(ctx, api, m.logits[j], 3) : '?',
          1740,
          y,
          27,
          selected ? themeColors.green : themeColors.ink,
          'right',
        );
      });
      if (currentBeat === 1 && E(1, 5))
        drawExtendedText(
          ctx,
          api,
          'P(value) ' + (m.probabilities[7] * 100).toFixed(2) + '%',
          1530,
          910,
          32,
          themeColors.green,
          'center',
        );
      if (currentBeat === 2 && E(2, 0))
        drawExtendedText(
          ctx,
          api,
          'P(result) ' + (m.probabilities[4] * 100).toFixed(2) + '%',
          1530,
          910,
          32,
          themeColors.green,
          'center',
        );
      if (currentBeat === 2 && E(2, 1))
        drawExtendedFoot(ctx, api, 'Mean training loss on six targets     2.145 → 0.235 nats');
      else
        drawExtendedFoot(
          ctx,
          api,
          'Twelve weighted features plus one bias give the score for “value”',
        );
    }
  });
}
export default {
  id: 'neural-forward',
  draw: drawNeuralForward,
  cues: [
    'neural-forward-b1',
    'neural-forward-voice-1',
    'neural-forward-step-0-1',
    'neural-forward-step-0-2',
    'neural-forward-step-0-3',
    'neural-forward-b2',
    'neural-forward-voice-2',
    'neural-products',
    'neural-value-score',
    'neural-value-probability',
    'neural-forward-step-1-1',
    'neural-forward-step-1-2',
    'neural-forward-step-1-3',
    'neural-forward-step-1-4',
    'neural-forward-step-1-5',
    'neural-forward-b3',
    'neural-forward-voice-3',
    'neural-forward-step-2-1',
    'neural-forward-step-2-2',
    'neural-forward-step-2-3',
    'neural-forward-step-2-4',
  ],
};
