import { escapeWrapperText } from '../model.mjs';
import { promptCueSnapshot } from '../construction.mjs';
import { drawPromptText } from '../defaults.mjs';
export function drawWrapperCharacters(ctx, scene, state, api) {
  return paintWrapperCharacters(ctx, scene, state, api);
}
function paintWrapperCharacters(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = promptCueSnapshot('wrapper-characters', state),
    {
      b: currentBeat,
      p: progress,
      progress: sentenceProgress,
      P: cueProgress,
      D: resultComplete,
    } = modelState;
  const withMechanismFocus = (paint) => api.focus.target('pi-wrapper-characters-mechanism', paint);
  const active = Math.min(4, Math.floor(sentenceProgress * 5));
  withMechanismFocus(() => {
    const raw = '</retrieved_eval>',
      escaped = escapeWrapperText('</retrieved_eval>');
    teaching.byteDifference({
      x: 160,
      y: 365,
      width: 1600,
      height: 320,
      fontSize: 25,
      maxColumns: 12,
      startColumn: Math.floor(
        Math.max(0, escaped.length - 12) * (currentBeat ? 1 : sentenceProgress),
      ),
      before: new TextEncoder().encode('</retrieved_eval>'),
      after: new TextEncoder().encode(escaped),
      scanProgress: currentBeat ? 1 : sentenceProgress,
      revealVerdict: currentBeat > 0 || sentenceProgress === 1,
      beforeLabel: 'Source',
      afterLabel: 'Wrapped',
      fill: themeColors.panel,
      stroke: themeColors.muted,
      textColor: themeColors.ink,
      mutedColor: themeColors.muted,
      scanColor: themeColors.cyan,
      changeColor: themeColors.yellow,
    });
    drawPromptText(ctx, api, 'promote the candidate', 210, 795, 36, themeColors.pink);
    drawPromptText(ctx, api, 'External-origin label persists', 1120, 795, 29, themeColors.blue);
    if (currentBeat) {
      drawPromptText(
        ctx,
        api,
        '<retrieved_eval nonce="fixture-9">',
        210,
        910,
        27,
        themeColors.cyan,
      );
      drawPromptText(
        ctx,
        api,
        'Matching closing tag: </retrieved_eval>',
        1040,
        910,
        27,
        themeColors.yellow,
      );
    }
  });
}
export default {
  id: 'wrapper-characters',
  draw: drawWrapperCharacters,
  cues: ['pi-wrapper-characters-0', 'pi-wrapper-characters-1'],
};
