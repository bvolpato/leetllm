import { clamp01 } from '../arithmetic.mjs';
import { classifierCueProgress } from '../construction.mjs';
import {
  drawExpandedClassifierCard,
  drawExpandedClassifierNote,
  drawExpandedClassifierRect,
  drawExpandedClassifierText,
  drawExpandedClassifierTransfer,
} from '../defaults.mjs';
export function drawShadowRollback(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0),
    cueProgress = (id) => classifierCueProgress(state, id);
  api.focus.target('shadow-evidence', () => {
    const keys = ['Weights', 'Tokenizer', 'Preprocessing', 'Calibrator', 'Threshold', 'Fallback'],
      rollback = currentBeat === 2 ? cueProgress('shadow-rollback') : 0;
    drawExpandedClassifierText(
      ctx,
      api,
      currentBeat === 0
        ? 'Retained release evidence'
        : currentBeat === 1
          ? 'Proposed shadow protocol'
          : 'Restore the complete prior behavior',
      960,
      285,
      33,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 1) {
      drawExpandedClassifierText(
        ctx,
        api,
        'Actual route retained',
        530,
        400,
        30,
        themeColors.blue,
        'center',
      );
      drawExpandedClassifierText(
        ctx,
        api,
        'Copy for proposed route',
        1390,
        400,
        30,
        themeColors.cyan,
        'center',
      );
      ['Ticket A', 'Ticket B', 'Ticket C'].forEach((label, i) => {
        const yy = 475 + i * 135;
        drawExpandedClassifierCard(
          ctx,
          api,
          label + ' · people',
          220,
          yy,
          600,
          themeColors.blue,
          85,
          29,
        );
        if (cueProgress('shadow-proposals') > i / 3) {
          drawExpandedClassifierCard(
            ctx,
            api,
            label + ' · proposal only',
            1120,
            yy,
            600,
            themeColors.cyan,
            85,
            29,
          );
          drawExpandedClassifierTransfer(
            ctx,
            api,
            [820, yy + 42],
            [1120, yy + 42],
            cueProgress('shadow-proposals'),
            themeColors.cyan,
          );
        }
      });
      if (cueProgress('shadow-unknown') > 0)
        drawExpandedClassifierCard(
          ctx,
          api,
          'Ticket C   ·   Awaiting human label',
          450,
          890,
          1020,
          themeColors.yellow,
          76,
          30,
        );
    } else {
      keys.forEach((v, i) => {
        const x = 180 + (i % 3) * 570,
          y = 380 + Math.floor(i / 3) * 230;
        drawExpandedClassifierRect(ctx, api, x, y, 500, 165, themeColors.cyan);
        drawExpandedClassifierText(ctx, api, v, x + 250, y + 55, 30, themeColors.ink, 'center');
        const changed = rollback > 0 && i / 6 < rollback;
        drawExpandedClassifierText(
          ctx,
          api,
          changed ? 'prior bundle' : 'candidate bundle',
          x + 250,
          y + 120,
          28,
          changed ? themeColors.green : themeColors.cyan,
          'center',
        );
      });
      if (currentBeat === 2 && rollback > 0)
        drawExpandedClassifierText(
          ctx,
          api,
          'One approved rollback contract covers all six',
          960,
          925,
          30,
          themeColors.green,
          'center',
        );
    }
    drawExpandedClassifierNote(
      ctx,
      api,
      currentBeat === 2
        ? 'Restore the full approved bundle before resuming use'
        : currentBeat === 1
          ? 'Record when each human outcome arrives'
          : 'Keep the approved bundle with its training and gate records',
    );
  });
}
export default {
  id: 'shadow-rollback',
  draw: drawShadowRollback,
  cues: ['shadow-artifacts', 'shadow-proposals', 'shadow-unknown', 'shadow-rollback'],
};
