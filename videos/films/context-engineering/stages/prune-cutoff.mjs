import { boundedContext, contextDone, pruneContextResults } from '../arithmetic.mjs';
import {
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteLine,
  drawCompleteRecord,
  drawCompleteText,
} from '../defaults.mjs';
export function drawPruneCutoff(ctx, scene, state, api) {
  if (paintPruneCutoff(ctx, scene, state, api)) return;
}
function paintPruneCutoff(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  drawCompleteFocus(ctx, api, 'ce-prune-cutoff-mechanism', () => {
    const rows = pruneContextResults(
      [true, false, true, true].map((recorded, i) => ({
        id: 'call-' + i,
        source: 'S' + i,
        raw: 'raw output ' + i,
        finding: 'checked observation',
        recorded,
      })),
      2,
    );
    drawCompleteHeading(
      ctx,
      api,
      'Ordered results · keep recent2 · recorded flags[true,false,true,true]',
    );
    rows.rows.forEach((row, i) => {
      const x = 150 + i * 420,
        replaced = currentBeat > 1 || (currentBeat === 1 && resultComplete('ce-prune-first', 1));
      drawCompleteRecord(
        ctx,
        api,
        'index' + i + ' · ' + row.id,
        [
          `recorded:${row.recorded}`,
          row.replaced && replaced ? '[pruned] source + finding' : row.raw,
        ],
        x,
        455,
        375,
        row.replaced && replaced ? themeColors.green : themeColors.blue,
        150,
      );
      if (currentBeat > 0) {
        drawCompleteText(
          ctx,
          api,
          i < 2 ? 'older' : 'recent',
          x,
          710,
          28,
          i < 2 ? themeColors.yellow : themeColors.cyan,
        );
        if (i === 0 && replaced)
          drawCompleteText(ctx, api, 'replace payload', x, 805, 29, themeColors.green);
        if (i === 1 && (currentBeat > 1 || resultComplete('ce-prune-unrecorded', 1)))
          drawCompleteText(ctx, api, 'retain unresolved raw', x, 805, 26, themeColors.yellow);
        if (i >= 2 && (currentBeat > 1 || resultComplete('ce-prune-recent', 1)))
          drawCompleteText(ctx, api, 'retain recent raw', x, 805, 27, themeColors.cyan);
      }
      drawCompleteText(
        ctx,
        api,
        'call_id stays ' + row.id,
        x,
        925,
        24,
        themeColors.muted,
        'left',
        'mono',
      );
    });
    if (currentBeat > 1 || (currentBeat === 1 && resultComplete('ce-prune-cutoff', 1))) {
      drawCompleteLine(ctx, api, 970, 385, 970, 990, themeColors.yellow, 3);
      drawCompleteText(ctx, api, 'cutoff2', 970, 345, 29, themeColors.yellow, 'center');
    }
    drawCompleteFooter(
      ctx,
      api,
      'Replace only index <cutoff AND recorded===true; transcript identities remain valid.',
    );
  });
  return true;
}
export default {
  id: 'prune-cutoff',
  draw: drawPruneCutoff,
  cues: [
    'ce-prune-cutoff-1',
    'ce-prune-cutoff-2',
    'ce-prune-cutoff',
    'ce-prune-first',
    'ce-prune-unrecorded',
    'ce-prune-recent',
    'ce-prune-cutoff-3',
  ],
};
