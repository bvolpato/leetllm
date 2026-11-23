import { boundedContext, contextDone, contextProgress } from '../arithmetic.mjs';
import {
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompletePacket,
  drawCompleteRecord,
  drawCompleteText,
  drawFieldCells,
} from '../defaults.mjs';
export function drawVerifiedNoteState(ctx, scene, state, api) {
  if (paintVerifiedNoteState(ctx, scene, state, api)) return;
}
function paintVerifiedNoteState(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat, start = 0.08, end = 0.88) =>
      contextProgress(state, id, beat, start, end),
    resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  drawCompleteFocus(ctx, api, 'ce-verified-note-state-mechanism', () => {
    drawCompleteHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'A tool-supplied flag cannot certify its own claim'
        : currentBeat === 1
          ? 'The finding retains the scope of its evidence'
          : 'Stored bytes need an admission policy before reload',
    );
    if (currentBeat === 0) {
      const q = cueProgress('ce-flag-rejected', 0);
      drawFieldCells(ctx, api, ['"true"', '1', 'true'], 210, 450, 390, 100, themeColors.blue);
      ['string', 'integer', 'Boolean'].forEach((v, i) =>
        drawCompleteText(ctx, api, v, 405 + i * 402, 620, 30, themeColors.muted, 'center'),
      );
      if (q === 1) {
        drawCompleteText(ctx, api, 'reject', 405, 740, 35, themeColors.pink, 'center');
        drawCompleteText(ctx, api, 'reject', 807, 740, 35, themeColors.pink, 'center');
        drawCompleteText(
          ctx,
          api,
          'host check still required',
          1209,
          740,
          30,
          themeColors.yellow,
          'center',
        );
      }
      drawCompleteRecord(
        ctx,
        api,
        'source comparison',
        'R17 /100 /403 · lock-check R17 /100 /false',
        250,
        850,
        1400,
        themeColors.green,
        100,
      );
    } else {
      drawCompleteRecord(
        ctx,
        api,
        'checked note',
        ['source: lock-check · revision7', 'R17 · observed at100 · lock absent'],
        150,
        400,
        730,
        themeColors.green,
        145,
      );
      const changed = currentBeat === 1 && resultComplete('ce-note-revision', 1);
      drawCompleteRecord(
        ctx,
        api,
        changed ? 'CURRENT SOURCE REVISION8' : 'archived source revision7',
        changed ? 'recheck this observation' : 'observation scoped to time 100',
        1030,
        400,
        730,
        changed ? themeColors.yellow : themeColors.blue,
        145,
      );
      drawCompleteText(
        ctx,
        api,
        'No lock in this inspected transaction',
        150,
        680,
        33,
        themeColors.green,
      );
      drawCompleteText(ctx, api, '≠ no lock at every time', 1030, 680, 33, themeColors.pink);
      drawCompletePacket(ctx, api, 1080, 780, 660, 200, 'SELECTIVE RELOAD');
      drawCompleteRecord(
        ctx,
        api,
        'negative finding',
        'source + time + uncertainty',
        150,
        805,
        730,
        themeColors.green,
        100,
      );
      if (currentBeat === 2)
        drawCompleteText(
          ctx,
          api,
          'Reloaded note tokens count in the next call',
          150,
          970,
          31,
          themeColors.yellow,
        );
    }
    drawCompleteFooter(
      ctx,
      api,
      'The host checks the source before it marks the finding as confirmed.',
    );
  });
  return true;
}
export default {
  id: 'verified-note-state',
  draw: drawVerifiedNoteState,
  cues: [
    'ce-verified-note-state-1',
    'ce-flag-rejected',
    'ce-verified-note-state-2',
    'ce-note-revision',
    'ce-verified-note-state-3',
  ],
};
