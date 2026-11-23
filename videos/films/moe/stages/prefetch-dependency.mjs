import { mc } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { arrow, footer, mechanismLine, mechanismText, rectangle, tag } from '../defaults.mjs';
export function drawPrefetchDependency(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    cueProgress = (i) => moeCue(state, 'prefetch-dependency-op-' + i, 'progress');
  api.focus.target('mo-prefetch-dependency-mechanism', () => {
    const fetched = resultComplete('prefetch-weight'),
      next = resultComplete('prefetch-input'),
      miss = resultComplete('prefetch-miss');
    mechanismText(
      ctx,
      api,
      'Token traffic and weight traffic have different owners',
      960,
      285,
      35,
      themeColors.yellow,
    );
    if (currentBeat === 0) {
      tag(ctx, api, 'Token x', 270, 440, 200, themeColors.cyan);
      tag(ctx, api, 'Resident expert', 1450, 440, 600, themeColors.blue);
      mechanismLine(ctx, api, 400, 440, 1120, 440, themeColors.muted, 2);
      rectangle(ctx, api, 400 + 650 * cueProgress(0), 420, 50, 40, themeColors.cyan);
      tag(ctx, api, 'CPU / SSD weight pages', 420, 730, 650, themeColors.yellow);
      tag(ctx, api, 'Expert weight residency', 1450, 730, 650, themeColors.blue);
      if (fetched) {
        for (let i = 0; i < 8; i++)
          rectangle(
            ctx,
            api,
            780 + i * 50 + 150 * cueProgress(0),
            855 + (i % 2) * 45,
            35,
            30,
            themeColors.yellow,
          );
      }
    } else {
      tag(ctx, api, 'current layer output h', 390, 420, 560, themeColors.cyan);
      tag(
        ctx,
        api,
        next ? 'next router Wg h' : 'next router waits for h',
        1350,
        420,
        680,
        next ? themeColors.blue : themeColors.muted,
      );
      if (next) arrow(ctx, api, 710, 420, 980, 420, themeColors.cyan);
      mechanismText(ctx, api, 'Predicted E0 pages', 480, 720, 32, themeColors.yellow);
      mechanismText(
        ctx,
        api,
        miss ? 'Required E2 pages still missing' : 'Prediction is provisional',
        1430,
        720,
        32,
        miss ? themeColors.pink : themeColors.yellow,
      );
      if (miss) {
        arrow(ctx, api, 480, 790, 480, 900, themeColors.pink);
        mechanismText(ctx, api, 'unused transfer', 480, 955, 31, themeColors.pink);
        arrow(ctx, api, 1420, 790, 1420, 900, themeColors.blue);
        mechanismText(ctx, api, 'fetch / stall', 1420, 955, 31, themeColors.blue);
      }
    }
    footer(
      ctx,
      api,
      'Illustrative page identities; exact next-layer routing waits for its hidden-state input.',
    );
  });
}
export default {
  id: 'prefetch-dependency',
  draw: drawPrefetchDependency,
  cues: [
    'mo-prefetch-dependency-op-0',
    'mo-prefetch-token',
    'mo-prefetch-weight',
    'mo-prefetch-dependency-op-1',
    'mo-prefetch-input',
    'mo-prefetch-miss',
    'mo-prefetch-dependency-op-2',
  ],
};
