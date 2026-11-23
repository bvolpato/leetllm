import { clamp } from '../arithmetic.mjs';
import {
  drawExpandedArrow,
  drawExpandedBox,
  drawExpandedFooter,
  drawExpandedLine,
  text as drawExpandedText,
  drawExpandedTile,
} from '../defaults.mjs';
export function drawReadyRecovery(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-ready-recovery-' + currentBeat),
    u = api.phase(full, 0.08, 0.82);
  api.focus.target('mm-ready-recovery-construction', () => {
    if (currentBeat === 0) {
      const retry = api.phase(u, 0.15, 0.85);
      drawExpandedText(
        ctx,
        api,
        'C17 · independent modality jobs',
        960,
        290,
        35,
        themeColors.ink,
        'center',
      );
      drawExpandedTile(ctx, api, 'T17 · transcript READY', 210, 390, 650, 110, themeColors.green);
      drawExpandedTile(
        ctx,
        api,
        'I17 · image attempt 1 FAILED',
        210,
        610,
        650,
        110,
        themeColors.pink,
      );
      drawExpandedTile(
        ctx,
        api,
        retry === 1 ? 'I17 · attempt 2 READY' : 'I17 · attempt 2 PENDING',
        1090,
        610,
        650,
        110,
        retry === 1 ? themeColors.green : themeColors.yellow,
      );
      drawExpandedArrow(ctx, api, 890, 665, 1050, 665, themeColors.yellow, retry);
      drawExpandedText(
        ctx,
        api,
        'Completed transcript is retained',
        540,
        850,
        32,
        themeColors.green,
        'center',
      );
      drawExpandedFooter(
        ctx,
        api,
        'Retry identities belong to the modality stage and producer version.',
      );
    } else if (currentBeat === 1) {
      [
        ['Quote the transcript', 'T17 ready', 'partial permitted', themeColors.green],
        ['Read chart chronology', 'I17 missing', 'abstain / wait / review', themeColors.pink],
      ].forEach(([q, e, o, col], i) => {
        const y = 390 + i * 250;
        drawExpandedText(ctx, api, q, 200, y, 34, themeColors.ink);
        drawExpandedTile(ctx, api, e, 200, y + 45, 500, 90, col);
        drawExpandedArrow(ctx, api, 745, y + 90, 1030, y + 90, col, u);
        drawExpandedTile(ctx, api, o, 1090, y + 45, 640, 90, col);
      });
      drawExpandedFooter(
        ctx,
        api,
        'The question’s required evidence and explicit product policy determine the allowed gap.',
      );
    } else {
      const labels = ['Frozen offline', 'Shadow', 'Tenant canary', 'Staged expansion'];
      labels.forEach((s, i) => {
        const x = 150 + i * 430,
          y = 430;
        drawExpandedBox(
          ctx,
          api,
          x,
          y,
          350,
          190,
          i <= Math.floor(u * 4) ? themeColors.green : themeColors.muted,
        );
        drawExpandedText(ctx, api, s, x + 175, y + 65, 28, themeColors.ink, 'center');
        drawExpandedText(
          ctx,
          api,
          i < 2 ? 'compare cases' : 'keep old generation',
          x + 175,
          y + 135,
          25,
          themeColors.muted,
          'center',
        );
      });
      drawExpandedLine(ctx, api, 1600, 780, 400, 780, themeColors.yellow, 4);
      drawExpandedText(
        ctx,
        api,
        'Old feature generation remains a rollback target',
        960,
        865,
        31,
        themeColors.yellow,
        'center',
      );
      drawExpandedFooter(
        ctx,
        api,
        'Plan separate latency, grounded quality, memory, cost and failure-slice measurements.',
      );
    }
  });
}
export default {
  id: 'ready-recovery',
  draw: drawReadyRecovery,
  cues: ['mm-ready-recovery-0', 'mm-ready-recovery-1', 'mm-ready-recovery-2'],
};
