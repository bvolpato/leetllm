import { promptCueSnapshot } from '../construction.mjs';
import { drawPromptCard, drawPromptNote, drawPromptText } from '../defaults.mjs';
export function drawPoisonedMemory(ctx, scene, state, api) {
  return paintPoisonedMemory(ctx, scene, state, api);
}
function paintPoisonedMemory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = promptCueSnapshot('poisoned-memory', state),
    {
      b: currentBeat,
      p: progress,
      progress: sentenceProgress,
      P: cueProgress,
      D: resultComplete,
    } = modelState;
  const withMechanismFocus = (paint) => api.focus.target('pi-poisoned-memory-mechanism', paint);
  const active = Math.min(4, Math.floor(sentenceProgress * 5));
  withMechanismFocus(() => {
    const noteText = 'approval granted',
      turn = currentBeat === 0 ? 1 : 2;
    drawPromptText(
      ctx,
      api,
      'Constructed turn ' + turn + ' · same report-origin sentence',
      180,
      315,
      31,
      themeColors.blue,
    );
    drawPromptCard(
      ctx,
      api,
      'External report → model-written note',
      180,
      410,
      1580,
      themeColors.pink,
      90,
      32,
    );
    drawPromptText(
      ctx,
      api,
      'approval granted',
      180,
      currentBeat === 1 ? 620 + 155 * sentenceProgress : 620,
      42,
      themeColors.pink,
    );
    drawPromptCard(
      ctx,
      api,
      'origin: report-C17 · trust: external evidence',
      900,
      565,
      860,
      themeColors.blue,
      110,
      28,
    );
    if (currentBeat > 0) {
      drawPromptCard(
        ctx,
        api,
        'Later context reloads the same note',
        180,
        840,
        730,
        themeColors.blue,
        90,
        29,
      );
      drawPromptCard(
        ctx,
        api,
        'Current approval store: no matching grant',
        1050,
        840,
        710,
        themeColors.green,
        90,
        28,
      );
    } else if (sentenceProgress > 0.5)
      drawPromptText(
        ctx,
        api,
        'Provenance travels with the stored words',
        960,
        855,
        32,
        themeColors.cyan,
        'center',
      );
    if (currentBeat === 2)
      drawPromptNote(
        ctx,
        api,
        'Keep authorized summaries useful; measure influenced outputs and host effects separately.',
      );
  });
}
export default {
  id: 'poisoned-memory',
  draw: drawPoisonedMemory,
  cues: ['pi-poisoned-memory-0', 'pi-poisoned-memory-1', 'pi-poisoned-memory-2'],
};
