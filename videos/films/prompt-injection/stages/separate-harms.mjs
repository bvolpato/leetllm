import { promptCueSnapshot } from '../construction.mjs';
import { drawPromptCard, drawPromptText } from '../defaults.mjs';
export function drawSeparateHarms(ctx, scene, state, api) {
  return paintSeparateHarms(ctx, scene, state, api);
}
function paintSeparateHarms(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = promptCueSnapshot('separate-harms', state),
    {
      b: currentBeat,
      p: progress,
      progress: sentenceProgress,
      P: cueProgress,
      D: resultComplete,
    } = modelState;
  const withMechanismFocus = (paint) => api.focus.target('pi-separate-harms-mechanism', paint);
  const active = Math.min(4, Math.floor(sentenceProgress * 5));
  withMechanismFocus(() => {
    const removed = currentBeat > 0 || sentenceProgress > 0.6;
    drawPromptCard(ctx, api, 'Reader context', 650, 320, 620, themeColors.blue, 85, 32);
    drawPromptCard(ctx, api, 'Untrusted report C17', 150, 500, 590, themeColors.pink, 100, 29);
    if (!removed)
      drawPromptCard(
        ctx,
        api,
        'Private red-team notes',
        1180,
        500,
        590,
        themeColors.yellow,
        100,
        29,
      );
    else
      drawPromptText(
        ctx,
        api,
        'Private notes removed from reader',
        1180,
        555,
        28,
        themeColors.muted,
      );
    api.line(ctx, 740, 550, 955, 550, themeColors.pink, 4);
    drawPromptText(ctx, api, 'Influenced proposal', 955, 700, 31, themeColors.yellow, 'center');
    if (!removed) {
      api.line(ctx, 1180, 550, 1055, 550, themeColors.yellow, 4);
      api.arrow(ctx, 960, 750, 1600, 875, themeColors.pink, 4);
      drawPromptText(
        ctx,
        api,
        'Unapproved disclosure sink',
        1420,
        950,
        28,
        themeColors.pink,
        'center',
      );
    } else {
      api.line(ctx, 1090, 515, 1090, 590, themeColors.pink, 5);
      drawPromptText(
        ctx,
        api,
        'Direct note route closed',
        1350,
        715,
        27,
        themeColors.green,
        'center',
      );
    }
    if (currentBeat > 0) {
      api.arrow(ctx, 930, 750, 440, 875, themeColors.yellow, 4);
      drawPromptCard(
        ctx,
        api,
        currentBeat === 1
          ? 'Bad production-write request still possible'
          : 'No promotion credential / no effect tool',
        150,
        885,
        710,
        currentBeat === 1 ? themeColors.yellow : themeColors.green,
        80,
        27,
      );
    }
    if (currentBeat === 2)
      drawPromptCard(
        ctx,
        api,
        'Executor: narrow approved endpoint only',
        1090,
        885,
        680,
        themeColors.green,
        80,
        27,
      );
  });
}
export default {
  id: 'separate-harms',
  draw: drawSeparateHarms,
  cues: ['pi-separate-harms-0', 'pi-separate-harms-1', 'pi-separate-harms-2'],
};
