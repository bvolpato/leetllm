import { languageStep } from '../construction.mjs';
import {
  drawExtendedCell,
  drawExtendedFoot,
  drawExtendedHead,
  drawExtendedText,
  formatLanguage,
} from '../defaults.mjs';
export function drawVocabularySoftmax(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('vocabulary-softmax', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('vocabulary-softmax-construction', () => {
    drawExtendedHead(ctx, api, 'Complete compiler-token row · keep the denominator visible');
    const words = ['error', 'warning', 'success', 'the', 'end'],
      z = [3, 1.5, -1, -2, -3],
      shift = z.map((v) => v - 3),
      ex = shift.map(Math.exp),
      den = ex.reduce((a, v) => a + v, 0),
      pr = ex.map((v) => v / den),
      op = currentBeat > 0 ? 1 : S(0, 2);
    ['token', 'logit z', 'z − max(z)', 'exp(z − max)', 'probability'].forEach((v, i) =>
      drawExtendedText(
        ctx,
        api,
        v,
        [170, 480, 800, 1170, 1590][i],
        325,
        25,
        themeColors.muted,
        'center',
      ),
    );
    words.forEach((word, i) => {
      const y = 370 + i * 100;
      drawExtendedCell(
        ctx,
        api,
        word,
        80,
        y,
        200,
        75,
        i === 0 ? themeColors.yellow : themeColors.blue,
      );
      drawExtendedText(
        ctx,
        api,
        E(0, 1) || currentBeat > 0 ? z[i] : '?',
        480,
        y + 49,
        30,
        themeColors.ink,
        'center',
      );
      drawExtendedText(
        ctx,
        api,
        op >= 0.25 ? shift[i] : '?',
        800,
        y + 49,
        30,
        themeColors.ink,
        'center',
      );
      drawExtendedText(
        ctx,
        api,
        op >= 0.5 ? formatLanguage(ctx, api, ex[i], 4) : '?',
        1170,
        y + 49,
        30,
        themeColors.cyan,
        'center',
      );
      drawExtendedText(
        ctx,
        api,
        currentBeat > 0 || E(0, 3) ? pr[i].toFixed(3) : '?',
        1590,
        y + 49,
        31,
        themeColors.green,
        'center',
      );
    });
    if (op >= 0.5)
      drawExtendedText(
        ctx,
        api,
        'sum of all five exponentials = ' + formatLanguage(ctx, api, den, 5),
        960,
        930,
        31,
        themeColors.yellow,
        'center',
      );
    drawExtendedFoot(
      ctx,
      api,
      currentBeat === 0
        ? E(0, 4)
          ? 'Complete probability row sums to 1'
          : 'Subtract the largest logit, then exponentiate each difference'
        : E(1, 3)
          ? 'The model predicts the next word. The compiler log records the outcome.'
          : 'A common shift preserves ratios · filtering to two outputs changes the denominator',
    );
  });
}
export default {
  id: 'vocabulary-softmax',
  draw: drawVocabularySoftmax,
  cues: [
    'vocabulary-softmax-b1',
    'vocabulary-softmax-voice-1',
    'vocabulary-softmax-step-0-1',
    'vocabulary-softmax-step-0-2',
    'vocabulary-softmax-step-0-3',
    'vocabulary-softmax-step-0-4',
    'vocabulary-softmax-b2',
    'vocabulary-softmax-voice-2',
    'vocabulary-softmax-step-1-1',
    'vocabulary-softmax-step-1-2',
    'vocabulary-softmax-step-1-3',
    'vocabulary-softmax-step-1-4',
  ],
};
