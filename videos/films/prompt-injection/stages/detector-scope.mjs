import { promptCueSnapshot } from '../construction.mjs';
import { drawPromptCard, drawPromptRows, drawPromptText } from '../defaults.mjs';
export function drawDetectorScope(ctx, scene, state, api) {
  return paintDetectorScope(ctx, scene, state, api);
}
function paintDetectorScope(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = promptCueSnapshot('detector-scope', state),
    {
      b: currentBeat,
      p: progress,
      progress: sentenceProgress,
      P: cueProgress,
      D: resultComplete,
    } = modelState;
  const withMechanismFocus = (paint) => api.focus.target('pi-detector-scope-mechanism', paint);
  const active = Math.min(4, Math.floor(sentenceProgress * 5));
  withMechanismFocus(() => {
    if (currentBeat === 0) {
      drawPromptText(
        ctx,
        api,
        'Prompt Guard 2 · dated 2025 classifier disclosure',
        180,
        320,
        32,
        themeColors.blue,
      );
      const width = 1500 / 512;
      api.rect(ctx, 180, 465, 1500, 110, themeColors.panel, themeColors.blue, 2);
      api.rect(ctx, 180, 465, 1500 * sentenceProgress, 110, themeColors.cyan);
      drawPromptText(ctx, api, '512-token window', 930, 535, 33, themeColors.ink, 'center');
      drawPromptText(ctx, api, '22M / 86M variants', 180, 710, 32, themeColors.muted);
      drawPromptCard(ctx, api, 'benign', 900, 665, 350, themeColors.blue, 100, 31);
      drawPromptCard(ctx, api, 'malicious', 1370, 665, 350, themeColors.pink, 100, 31);
      void width;
    } else {
      drawPromptText(
        ctx,
        api,
        'Llama Guard 4: text / image hazard taxonomy',
        180,
        345,
        33,
        themeColors.blue,
      );
      drawPromptRows(
        ctx,
        api,
        [
          ['Content classification', 'hazard labels'],
          ['Case ownership', 'host access lookup'],
          ['Write approval', 'current exact operation grant'],
        ],
        180,
        490,
        1580,
        {
          active: Math.min(2, Math.floor(sentenceProgress * 3)),
        },
      );
      drawPromptCard(
        ctx,
        api,
        'Clean classifier label supplies no execution grant',
        180,
        850,
        1580,
        themeColors.green,
        100,
        31,
      );
    }
  });
}
export default {
  id: 'detector-scope',
  draw: drawDetectorScope,
  cues: ['pi-detector-scope-0', 'pi-detector-scope-1'],
};
