import { cueDone } from '../construction.mjs';
import { chapterText, focusTargets, footer, panel } from '../defaults.mjs';
export function drawMigrationStages(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const stages = ['OFFLINE REPLAY', 'BOUNDED SHADOW', 'SMALL CANARY'];
    chapterText(ctx, api, stages[currentBeat], 960, 285, 36, themeColors.yellow, 'center');
    const old = panel(ctx, api, 250, 420, 550, 105, themeColors.blue),
      candidate = panel(ctx, api, 1120, 420, 550, 105, themeColors.purple);
    chapterText(ctx, api, 'old path', 525, 485, 35, themeColors.blue, 'center');
    chapterText(ctx, api, 'candidate path', 1395, 485, 35, themeColors.purple, 'center');
    focusTargets(ctx, api, ['migration-replay', 'migration-shadow', 'migration-canary'], () => {
      for (let i = 0; i < 20; i++) {
        const x = 220 + (i % 10) * 155,
          y = 650 + Math.floor(i / 10) * 105,
          green = currentBeat === 2 && i === 0;
        panel(ctx, api, x, y, 120, 70, green ? themeColors.purple : themeColors.blue);
        chapterText(
          ctx,
          api,
          String(i + 1),
          x + 60,
          y + 45,
          26,
          green ? themeColors.purple : themeColors.blue,
          'center',
        );
      }
      chapterText(
        ctx,
        api,
        currentBeat === 0
          ? 'Labeled fixture · no candidate-served users'
          : currentBeat === 1
            ? 'All user responses owned by old path'
            : 'Illustrative 1 of 20 served by candidate',
        960,
        910,
        30,
        currentBeat === 2 ? themeColors.purple : themeColors.blue,
        'center',
      );
      if (currentBeat === 1) {
        api.line(ctx, 800, 475, 1120, 475, themeColors.cyan, 3);
        chapterText(ctx, api, 'copied permitted input', 960, 385, 27, themeColors.cyan, 'center');
      }
    });
    focusTargets(ctx, api, ['migration-effects'], () => {
      if (currentBeat >= 1) {
        const show = currentBeat > 1 || cueDone(state, 'migration-effects', 1, 0.55);
        chapterText(
          ctx,
          api,
          show ? 'Audit record persists' : 'Operational effects require measurement',
          960,
          575,
          28,
          show ? themeColors.yellow : themeColors.muted,
          'center',
        );
      }
    });
    footer(
      ctx,
      api,
      'Each stage has its own authority, population and evidence; replay does not certify a live migration',
    );
  }
}
export default {
  id: 'migration-stages',
  draw: drawMigrationStages,
  cues: ['migration-replay', 'migration-shadow', 'migration-effects', 'migration-canary'],
};
