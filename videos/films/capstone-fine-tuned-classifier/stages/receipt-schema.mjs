import { clamp01, format, mix } from '../arithmetic.mjs';
import { GATE_CASES } from '../fixtures.mjs';
import { evaluateGate } from '../model.mjs';
import { classifierCueProgress } from '../construction.mjs';
import {
  drawExpandedClassifierCard,
  drawExpandedClassifierLine,
  drawExpandedClassifierNote,
  drawExpandedClassifierText,
} from '../defaults.mjs';
export function drawReceiptSchema(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0),
    cueProgress = (id) => classifierCueProgress(state, id);
  api.focus.target('owned-receipt', () => {
    const flood = currentBeat === 2 ? cueProgress('receipt-capacity') : 0;
    const scores = GATE_CASES.map((r) => ({
      ...r,
      score: r.gold ? r.score : mix(r.score, 0.9, flood),
    }));
    const owned = [
      ['G1', 'required', '1'],
      ['G2', 'required', '1'],
      ['G3', 'required', '1'],
      ['G4', 'routine', '0'],
      ['G5', 'routine', '0'],
      ['G6', 'routine', '0'],
    ];
    drawExpandedClassifierText(
      ctx,
      api,
      'Evaluator-owned',
      470,
      300,
      34,
      themeColors.pink,
      'center',
    );
    drawExpandedClassifierText(
      ctx,
      api,
      currentBeat === 2 ? 'Raise the three routine scores' : 'Scoring worker submits',
      1430,
      300,
      34,
      themeColors.cyan,
      'center',
    );
    owned.forEach((r, i) => {
      const yy = 375 + i * 75;
      drawExpandedClassifierCard(ctx, api, r.join('  ·  '), 180, yy, 590, themeColors.pink, 62, 26);
      if (currentBeat === 0 || currentBeat === 2)
        drawExpandedClassifierCard(
          ctx,
          api,
          r[0] + '   score ' + format(scores[i].score),
          1130,
          yy,
          610,
          themeColors.cyan,
          62,
          26,
        );
    });
    if (currentBeat === 1) {
      const p = cueProgress('receipt-mutation');
      drawExpandedClassifierCard(
        ctx,
        api,
        'G2  score 0.41  gold 0  slice routine',
        1010,
        420,
        780,
        themeColors.pink,
        100,
        28,
      );
      if (p > 0) {
        drawExpandedClassifierLine(ctx, api, 1030, 540, 1750, 540, themeColors.pink, 5);
        drawExpandedClassifierCard(
          ctx,
          api,
          'Reject extra worker fields',
          1090,
          600,
          620,
          themeColors.pink,
          86,
          30,
        );
      }
      if (cueProgress('receipt-types') > 0)
        drawExpandedClassifierText(
          ctx,
          api,
          'NaN  ·  ∞  ·  true  ·  “0.14”  →  reject',
          1430,
          830,
          29,
          themeColors.yellow,
          'center',
        );
    }
    if (currentBeat === 2 && flood > 0) {
      const result = evaluateGate(
        scores.map((r) => ({
          fixture_id: r.id,
          score: r.score,
        })),
      );
      drawExpandedClassifierText(
        ctx,
        api,
        'Routine reviews: ' +
          result.FP +
          '  ·  capacity: 1  ·  ' +
          result.decision.replaceAll('_', ' '),
        960,
        920,
        35,
        result.FP > 1 ? themeColors.pink : themeColors.green,
        'center',
      );
    }
    drawExpandedClassifierNote(
      ctx,
      api,
      'Match all six scores to the evaluator’s labels before counting errors',
    );
  });
}
export default {
  id: 'receipt-schema',
  draw: drawReceiptSchema,
  cues: [
    'receipt-owned',
    'receipt-inventory',
    'receipt-mutation',
    'receipt-types',
    'receipt-capacity',
  ],
};
