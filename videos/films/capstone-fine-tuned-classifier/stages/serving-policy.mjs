import { clamp01 } from '../arithmetic.mjs';
import {
  drawExpandedClassifierArrow,
  drawExpandedClassifierCard,
  drawExpandedClassifierLine,
  drawExpandedClassifierNote,
  drawExpandedClassifierRect,
  drawExpandedClassifierText,
} from '../defaults.mjs';
export function drawServingPolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0);
  api.focus.target('serving-contract', () => {
    const checks =
      currentBeat === 0
        ? ['Exact keys', 'Exact types', 'Pinned cutoff', 'Pinned fallback']
        : currentBeat === 1
          ? ['Nonblank text', 'Positive integer count', 'Count ≤ 256', 'Finite non-Boolean score']
          : ['0.18 valid', 'Empty text', 'Unavailable / NaN', 'Boolean / oversized'];
    checks.forEach((v, i) => {
      const x = 175 + i * 440;
      drawExpandedClassifierRect(
        ctx,
        api,
        x,
        390,
        365,
        220,
        i === 0 ? themeColors.blue : themeColors.cyan,
      );
      drawExpandedClassifierText(ctx, api, v, x + 182, 465, 27, themeColors.ink, 'center');
      if (i < 3)
        drawExpandedClassifierArrow(ctx, api, x + 370, 500, x + 435, 500, themeColors.yellow, 4);
      if (raw > (i + 1) / 5)
        drawExpandedClassifierText(
          ctx,
          api,
          currentBeat === 2 ? (i === 0 ? 'GUARDED' : 'HUMAN') : 'check',
          x + 182,
          565,
          28,
          currentBeat === 2 && i > 0 ? themeColors.pink : themeColors.green,
          'center',
        );
    });
    if (currentBeat < 2) {
      drawExpandedClassifierLine(ctx, api, 180, 740, 1740, 740, themeColors.muted, 3);
      drawExpandedClassifierCard(
        ctx,
        api,
        'Any failed admission → pinned human fallback',
        390,
        830,
        1140,
        themeColors.pink,
        100,
        33,
      );
    }
    drawExpandedClassifierNote(
      ctx,
      api,
      'Supplied routing-layer inputs · not a tokenizer, endpoint or network run',
    );
  });
}
export default {
  id: 'serving-policy',
  draw: drawServingPolicy,
  cues: ['serving-keys', 'serving-tokens', 'serving-score'],
};
