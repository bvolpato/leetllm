import { boundedContext, contextDone, contextProgress } from '../arithmetic.mjs';
import {
  drawCompleteColumns,
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteLine,
  drawCompleteRecord,
  drawCompleteText,
} from '../defaults.mjs';
export function drawThrashBudget(ctx, scene, state, api) {
  if (paintThrashBudget(ctx, scene, state, api)) return;
}
function paintThrashBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat, start = 0.08, end = 0.88) =>
      contextProgress(state, id, beat, start, end),
    resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  drawCompleteFocus(ctx, api, 'ce-thrash-budget-mechanism', () => {
    drawCompleteHeading(ctx, api, 'Same trace-17 · repeated preparation does not complete a task');
    const q = cueProgress('ce-thrash-five', 0),
      labels = ['retrieve', 'summarize', 'evict', 'reload', 'summarize'],
      step = currentBeat === 0 ? Math.min(4, Math.floor(q * 5)) : 4;
    labels.forEach((v, i) => {
      const x = 150 + i * 335;
      drawCompleteRecord(
        ctx,
        api,
        v,
        i === 0 || i === 3 ? 'trace-17' : 'ID omitted',
        x,
        420,
        290,
        i <= step ? themeColors.blue : themeColors.muted,
        100,
      );
      if (i < 4)
        drawCompleteLine(
          ctx,
          api,
          x + 300,
          470,
          x + 325,
          470,
          i < step ? themeColors.cyan : themeColors.muted,
          2,
        );
    });
    if (currentBeat === 0) {
      const known = resultComplete('ce-thrash-five', 0);
      drawCompleteText(
        ctx,
        api,
        known ? 'Context operations · 5' : 'Context operations · ?',
        150,
        660,
        35,
        themeColors.blue,
      );
      drawCompleteText(
        ctx,
        api,
        known ? 'Completed steps · 0' : 'Completed steps · ?',
        1000,
        660,
        35,
        themeColors.pink,
      );
      drawCompleteText(
        ctx,
        api,
        known ? 'ratio undefined · stalled' : 'ratio waits for a nonzero completion count',
        150,
        800,
        38,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      drawCompleteColumns(
        ctx,
        api,
        ['work record', 'progress evidence'],
        [
          ['reload trace-17', 'same span; no new resolution'],
          ['empty search', 'valid result; evidence gap identified'],
          ['ruled-out path', 'negative finding retained'],
        ],
        150,
        650,
        [760, 790],
        90,
      );
    } else {
      const pinned = resultComplete('ce-pin-id', 2),
        exit = resultComplete('ce-stalled-exit', 2);
      drawCompleteRecord(
        ctx,
        api,
        'pinned task key',
        pinned
          ? 'R17 persists until completion / freshness reread'
          : 'key must survive every summary',
        150,
        650,
        740,
        pinned ? themeColors.green : themeColors.yellow,
        110,
      );
      drawCompleteRecord(
        ctx,
        api,
        'retry boundary',
        exit ? 'budget exhausted → preserve unknown + escalate' : 'bounded preparation work',
        1050,
        650,
        690,
        exit ? themeColors.pink : themeColors.cyan,
        110,
      );
      drawCompleteText(
        ctx,
        api,
        'Unknown external effect stays unknown until reconciled',
        150,
        950,
        34,
        themeColors.yellow,
      );
    }
    drawCompleteFooter(
      ctx,
      api,
      'Counts describe this toy sequence; no external search or write is executed.',
    );
  });
  return true;
}
export default {
  id: 'thrash-budget',
  draw: drawThrashBudget,
  cues: [
    'ce-thrash-budget-1',
    'ce-thrash-five',
    'ce-thrash-budget-2',
    'ce-thrash-budget-3',
    'ce-pin-id',
    'ce-stalled-exit',
  ],
};
