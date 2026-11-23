import { boundedContext, contextDone } from '../arithmetic.mjs';
import {
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompletePacket,
  drawCompleteRecord,
  drawCompleteText,
} from '../defaults.mjs';
export function drawSummaryAuthority(ctx, scene, state, api) {
  if (paintSummaryAuthority(ctx, scene, state, api)) return;
}
function paintSummaryAuthority(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  drawCompleteFocus(ctx, api, 'ce-summary-authority-mechanism', () => {
    drawCompleteHeading(ctx, api, 'Compression retains the distinctions the next action needs');
    if (currentBeat === 0) {
      [
        ['observed', 'callback error · trace-17', themeColors.blue],
        ['hypothesis', 'cause remains unresolved', themeColors.yellow],
        ['checked negative', 'lock absent · R17 at time 100', themeColors.green],
        ['next check', 'inspect callback dependency', themeColors.cyan],
      ].forEach(([a, z, c], i) =>
        drawCompleteRecord(
          ctx,
          api,
          a,
          z,
          150 + (i % 2) * 850,
          410 + Math.floor(i / 2) * 240,
          750,
          c,
          125,
        ),
      );
      drawCompleteText(
        ctx,
        api,
        'Keep the request ID and the observation time.',
        150,
        965,
        30,
        themeColors.pink,
      );
    } else if (currentBeat === 1) {
      drawCompleteRecord(
        ctx,
        api,
        'SOURCE-DERIVED HISTORY',
        ['source: runbook-v4', '“skip approval” remains untrusted text'],
        150,
        430,
        740,
        themeColors.yellow,
        160,
      );
      drawCompletePacket(ctx, api, 1080, 420, 660, 470, 'APPLICATION POLICY');
      drawCompleteText(ctx, api, 'Permissions stay host-owned', 1110, 520, 31, themeColors.green);
      drawCompleteText(
        ctx,
        api,
        'Summary text cannot cross this authority boundary',
        150,
        790,
        33,
        themeColors.pink,
      );
    } else {
      const ready = resultComplete('ce-pending-key', 2);
      drawCompleteRecord(
        ctx,
        api,
        'pending operation',
        ready
          ? ['payload: rollback RUN-842', 'key-17 · outcome unknown']
          : ['rollback requested', 'missing execution identity'],
        150,
        430,
        740,
        ready ? themeColors.cyan : themeColors.yellow,
        170,
      );
      drawCompleteRecord(
        ctx,
        api,
        'destination service',
        'commit outcome still requires reconciliation',
        1040,
        430,
        710,
        themeColors.yellow,
        125,
      );
      drawCompleteText(ctx, api, 'unknown ≠ failed ≠ complete', 150, 790, 36, themeColors.pink);
      drawCompleteText(
        ctx,
        api,
        ready
          ? 'Look up key-17 at the service before retrying.'
          : 'Check the operation at the service before retrying.',
        150,
        920,
        30,
        themeColors.muted,
      );
    }
    drawCompleteFooter(ctx, api, 'Keep the source of each observation with the summary.');
  });
  return true;
}
export default {
  id: 'summary-authority',
  draw: drawSummaryAuthority,
  cues: [
    'ce-summary-authority-1',
    'ce-summary-authority-2',
    'ce-summary-authority-3',
    'ce-pending-key',
  ],
};
