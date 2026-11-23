import { clamp01, format, softmax } from '../arithmetic.mjs';
import { classifierCueProgress } from '../construction.mjs';
import {
  drawExpandedClassifierMatrix,
  drawExpandedClassifierNote,
  drawExpandedClassifierProbabilityRows,
  drawExpandedClassifierText,
} from '../defaults.mjs';
export function drawStablePositiveScore(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0),
    cueProgress = (id) => classifierCueProgress(state, id);
  api.focus.target('stable-score', () => {
    const z =
        currentBeat === 0
          ? [-1, 2]
          : currentBeat === 1
            ? cueProgress('score-second') > 0
              ? [1, -1]
              : [-1, 2]
            : [2, 1],
      max = Math.max(...z),
      shift = z.map((v) => v - max),
      strength = shift.map(Math.exp),
      sum = strength.reduce((a, v) => a + v, 0),
      probs = softmax(z),
      shiftP = currentBeat ? 1 : cueProgress('score-shift'),
      norm = currentBeat ? 1 : cueProgress('score-normalize');
    ['0 · Guarded', '1 · Human review'].forEach((v, i) =>
      drawExpandedClassifierText(
        ctx,
        api,
        v,
        250,
        440 + i * 160,
        29,
        i ? themeColors.pink : themeColors.blue,
      ),
    );
    drawExpandedClassifierText(ctx, api, 'Logits', 650, 325, 31, themeColors.ink, 'center');
    drawExpandedClassifierText(
      ctx,
      api,
      'Shift by max',
      1015,
      325,
      31,
      themeColors.yellow,
      'center',
    );
    drawExpandedClassifierText(ctx, api, 'exp(shift)', 1370, 325, 31, themeColors.cyan, 'center');
    drawExpandedClassifierMatrix(
      ctx,
      api,
      z.map((v) => [v]),
      590,
      380,
      {
        cell: 120,
        height: 160,
        color: themeColors.ink,
      },
    );
    if (shiftP > 0)
      drawExpandedClassifierMatrix(
        ctx,
        api,
        shift.map((v) => [v]),
        955,
        380,
        {
          cell: 120,
          height: 160,
          color: themeColors.yellow,
        },
      );
    if (shiftP === 1)
      drawExpandedClassifierMatrix(
        ctx,
        api,
        strength.map((v) => [v]),
        1310,
        380,
        {
          cell: 140,
          height: 160,
          color: themeColors.cyan,
        },
      );
    if (
      norm > 0 &&
      !(currentBeat === 1 && cueProgress('score-second') > 0 && cueProgress('score-second') < 1)
    ) {
      drawExpandedClassifierText(
        ctx,
        api,
        'Z = ' + format(sum),
        960,
        790,
        38,
        themeColors.yellow,
        'center',
      );
      drawExpandedClassifierProbabilityRows(ctx, api, probs, 545, 795, 640);
    }
    if (currentBeat === 2)
      drawExpandedClassifierNote(
        ctx,
        api,
        'Mean [1,1] → logits [2,1] → review ' + format(probs[1]),
        themeColors.green,
      );
    else
      drawExpandedClassifierNote(
        ctx,
        api,
        'Normalize by the same sum; keep class-one ownership fixed',
      );
  });
}
export default {
  id: 'stable-positive-score',
  draw: drawStablePositiveScore,
  cues: ['score-shift', 'score-normalize', 'score-first', 'score-second', 'score-miniature'],
};
