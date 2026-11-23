import {
  completionBox,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawCache(ctx, scene, state, api) {
  api.focus.target('cc-cache-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = Math.max(0, Math.min(1, state.beatP ?? 0));
    {
      completionHeading(ctx, api, 'Same compatible header · new delta and new answer');
      api.focus.target(
        'cache-id-header-label-reusable-stable-header-value-1200-color-c-blue-id-de',
        () => {
          for (let i = 0; i < 12; i++) {
            const x = 220 + i * 120;
            api.rect(ctx, x, 400, 100, 70, themeColors.panel, themeColors.blue, 2, 4);
            completionText(ctx, api, '100 IDs', x + 50, 447, 22, themeColors.blue, 'center');
            api.rect(ctx, x, 550, 100, 48, themeColors.blue);
            api.rect(ctx, x, 620, 100, 48, themeColors.cyan);
            if (currentBeat) api.arrow(ctx, x + 50, 480, x + 50, 525, themeColors.green, 3);
          }
          completionText(ctx, api, 'K', 150, 585, 30, themeColors.blue);
          completionText(ctx, api, 'V', 150, 655, 30, themeColors.cyan);
          completionBox(ctx, api, '+80 new input IDs', 700, 725, 520, 78, themeColors.yellow);
        },
      );
      api.focus.target('cache-s-b-11-24-72-24-prefill-ms-decode-ms', () => {
        completionText(
          ctx,
          api,
          currentBeat ? 'Prefill 11 + decode 24 = 35 ms' : 'Prefill 72 + decode 24 = 96 ms',
          960,
          900,
          39,
          currentBeat ? themeColors.green : themeColors.pink,
          'center',
        );
      });
      completionFooter(
        ctx,
        api,
        'Each displayed header cell represents 100 token positions · new decode still runs',
      );
    }
    return true;
  });
}
export default {
  id: 'cache',
  draw: drawCache,
  cues: [
    'cache-beat-1-focus-1',
    'cache-beat-1-focus-2',
    'cache-beat-2-focus-1',
    'cache-beat-2-focus-2',
  ],
};
