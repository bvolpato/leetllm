import { clamp01 } from '../arithmetic.mjs';
import {
  drawExpandedClassifierCard,
  drawExpandedClassifierNote,
  drawExpandedClassifierText,
  drawExpandedClassifierTransfer,
} from '../defaults.mjs';
export function drawFallback(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0);
  api.focus.target('fallback-cases', () => {
    const cases = [
        ['Empty', 'text = empty'],
        ['Oversized', '257 tokens'],
        ['Unavailable', 'score = None'],
        ['Nonfinite', 'score = NaN'],
      ],
      k = Math.min(3, Math.floor(raw * 4));
    api.focus.target('invalid-inputs', () => {
      cases.forEach((r, i) =>
        drawExpandedClassifierCard(
          ctx,
          api,
          r[0],
          170,
          350 + i * 125,
          400,
          i === k ? themeColors.pink : themeColors.muted,
          82,
          30,
        ),
      );
    });
    api.focus.target('oversized-row', () =>
      drawExpandedClassifierCard(ctx, api, cases[k][1], 790, 490, 420, themeColors.pink, 105, 33),
    );
    api.focus.target('nan-row', () => {
      drawExpandedClassifierCard(
        ctx,
        api,
        'Validate before threshold',
        1340,
        490,
        450,
        themeColors.yellow,
        105,
        29,
      );
      if (currentBeat > 0)
        drawExpandedClassifierText(
          ctx,
          api,
          'invalid → human',
          1550,
          760,
          33,
          themeColors.pink,
          'center',
        );
    });
    drawExpandedClassifierTransfer(
      ctx,
      api,
      [570, 391 + k * 125],
      [790, 540],
      raw,
      themeColors.pink,
    );
    api.focus.target('valid-score-row', () => {
      if (currentBeat > 0)
        drawExpandedClassifierCard(
          ctx,
          api,
          'Finite valid score → pinned cutoff',
          600,
          890,
          1100,
          themeColors.green,
          80,
          29,
        );
    });
    drawExpandedClassifierNote(
      ctx,
      api,
      'One input moves through admission; invalid cases never reach the score threshold',
    );
  });
}
export default {
  id: 'fallback',
  draw: drawFallback,
  cues: ['fallback-b1-1', 'fallback-b1-2', 'fallback-b2-1', 'fallback-b2-2'],
};
