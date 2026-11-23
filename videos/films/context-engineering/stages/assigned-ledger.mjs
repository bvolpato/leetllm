import { allocations } from '../fixtures.mjs';
import { boundedContext, contextDone } from '../arithmetic.mjs';
import {
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteText,
} from '../defaults.mjs';
export function drawAssignedLedger(ctx, scene, state, api) {
  if (paintAssignedLedger(ctx, scene, state, api)) return;
}
function paintAssignedLedger(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  const number = (value) => value.toLocaleString('en-US');
  drawCompleteFocus(ctx, api, 'ce-assigned-ledger-mechanism', () => {
    drawCompleteHeading(
      ctx,
      api,
      'Immutable assigned sizes · each retained and omitted item keeps its identity',
    );
    const raw = allocations.reduce((s, r) => s + r.units, 0),
      kept = allocations.slice(0, 3).reduce((s, r) => s + r.units, 0),
      omitted = raw - kept;
    allocations.forEach((row, i) => {
      const y = 395 + i * 85,
        retained = i < 3;
      drawCompleteText(
        ctx,
        api,
        row.id,
        150,
        y + 30,
        27,
        retained ? themeColors.blue : themeColors.muted,
      );
      api.rect(
        ctx,
        750,
        y,
        (800 * row.units) / raw,
        44,
        retained ? themeColors.blue : themeColors.panel,
        retained ? themeColors.blue : themeColors.muted,
        1,
      );
      drawCompleteText(
        ctx,
        api,
        number(row.units),
        1650,
        y + 32,
        29,
        retained ? themeColors.cyan : themeColors.muted,
        'right',
      );
    });
    if (currentBeat === 0)
      drawCompleteText(
        ctx,
        api,
        resultComplete('ce-ledger-3346', 0)
          ? `retained:2,400 +760 +186 =${number(kept)}`
          : 'retained total: ?',
        150,
        960,
        34,
        themeColors.green,
      );
    else {
      drawCompleteText(
        ctx,
        api,
        resultComplete('ce-ledger-9090', 1) || currentBeat > 1
          ? `omitted:${number(omitted)}`
          : 'omitted: ?',
        150,
        960,
        34,
        themeColors.yellow,
      );
      drawCompleteText(
        ctx,
        api,
        resultComplete('ce-ledger-percent', 1) || currentBeat > 1
          ? `${((100 * omitted) / raw).toFixed(1)}% of original`
          : 'omitted /original ×100',
        1000,
        960,
        34,
        themeColors.cyan,
      );
    }
    drawCompleteFooter(
      ctx,
      api,
      'Totals come from supplied labels; actual token counts and task quality need separate checks.',
    );
  });
  return true;
}
export default {
  id: 'assigned-ledger',
  draw: drawAssignedLedger,
  cues: [
    'ce-assigned-ledger-1',
    'ce-ledger-3346',
    'ce-assigned-ledger-2',
    'ce-ledger-9090',
    'ce-ledger-percent',
    'ce-assigned-ledger-3',
  ],
};
