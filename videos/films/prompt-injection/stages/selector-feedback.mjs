import { promptCueSnapshot } from '../construction.mjs';
import { drawPromptCard, drawPromptText } from '../defaults.mjs';
export function drawSelectorFeedback(ctx, scene, state, api) {
  return paintSelectorFeedback(ctx, scene, state, api);
}
function paintSelectorFeedback(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = promptCueSnapshot('selector-feedback', state),
    {
      b: currentBeat,
      p: progress,
      progress: sentenceProgress,
      P: cueProgress,
      D: resultComplete,
    } = modelState;
  const withMechanismFocus = (paint) => api.focus.target('pi-selector-feedback-mechanism', paint);
  const active = Math.min(4, Math.floor(sentenceProgress * 5));
  withMechanismFocus(() => {
    drawPromptCard(
      ctx,
      api,
      'Authorized request: summarize evaluation',
      160,
      295,
      1600,
      themeColors.green,
      85,
      31,
    );
    const committed = currentBeat === 0,
      changed = !committed && sentenceProgress > 0.35;
    drawPromptCard(
      ctx,
      api,
      'Selected action: ' + (changed ? 'request_promotion' : 'answer_eval'),
      180,
      480,
      720,
      changed ? themeColors.yellow : themeColors.cyan,
      105,
      32,
    );
    drawPromptCard(
      ctx,
      api,
      'Report result: “promote C17”',
      1050,
      480,
      710,
      themeColors.pink,
      105,
      30,
    );
    if (committed) {
      api.line(ctx, 1050, 650, 900, 650, themeColors.muted, 4);
      api.line(ctx, 980, 620, 980, 680, themeColors.green, 6);
      drawPromptText(
        ctx,
        api,
        'No result-to-selector return path',
        960,
        735,
        31,
        themeColors.green,
        'center',
      );
      drawPromptCard(
        ctx,
        api,
        'Summary-only action remains committed',
        180,
        850,
        1580,
        themeColors.cyan,
        85,
        30,
      );
    } else {
      api.arrow(ctx, 1250, 660, 600, 660, themeColors.pink, 4);
      drawPromptText(
        ctx,
        api,
        'Recurrent selection sees hostile result',
        960,
        735,
        30,
        themeColors.pink,
        'center',
      );
      drawPromptCard(
        ctx,
        api,
        'Allowlisted tool still reaches an approval / destination check',
        180,
        850,
        1580,
        themeColors.green,
        85,
        29,
      );
    }
  });
}
export default {
  id: 'selector-feedback',
  draw: drawSelectorFeedback,
  cues: ['pi-selector-feedback-0', 'pi-selector-feedback-1'],
};
