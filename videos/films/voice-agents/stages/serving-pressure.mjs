import { voiceWorksheet } from '../arithmetic.mjs';
import { drawBox, drawCell, drawFooter, drawText } from '../defaults.mjs';
export function drawServingPressure(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-serving-pressure-${i}-${j}`;
    if (state.cues && !Object.hasOwn(state.cues, key))
      throw Error('Unknown voice narration cue: ' + key);
    return state.cues?.[key];
  };
  const cueVisible = (i, j) => {
    const c = cue(i, j);
    return c ? c.phase !== 'before' : currentBeat > i || (currentBeat === i && beatProgress > 0.02);
  };
  const cueComplete = (i, j) => {
    const c = cue(i, j);
    return c
      ? c.phase === 'after' || c.progress >= 1
      : currentBeat > i || (currentBeat === i && beatProgress > 0.98);
  };
  const withStageFocus = (name, paint) => api.focus.target(`va-serving-pressure-${name}`, paint);
  {
    const items = [
        'final turn',
        'heard text',
        'tool result',
        'final turn',
        'heard text',
        'tool result',
        'interim',
        'unheard',
      ],
      n = cueVisible(0, 1) ? 8 : 4,
      trim = cueVisible(0, 2);
    withStageFocus('context', () => {
      drawText(ctx, api, 'Same call context grows', 150, 300, 31, themeColors.blue);
      for (let i = 0; i < n; i++) {
        const removed = trim && i >= 6,
          color = i >= 6 ? themeColors.pink : i % 3 === 2 ? themeColors.yellow : themeColors.cyan;
        drawBox(ctx, api, 150 + i * 180, 350, 155, 100, removed ? themeColors.muted : color);
        if (!removed) drawText(ctx, api, items[i], 150 + i * 180 + 77, 410, 23, color, 'center');
      }
      if (trim)
        drawText(
          ctx,
          api,
          'Interim revisions and unheard text removed from this view',
          150,
          555,
          29,
          themeColors.pink,
        );
    });
    withStageFocus('allocation', () => {
      drawText(
        ctx,
        api,
        'Illustrative block occupancy · retained state still has storage',
        150,
        660,
        30,
        themeColors.cyan,
      );
      for (let i = 0; i < 12; i++)
        drawBox(
          ctx,
          api,
          150 + i * 125,
          705,
          95,
          60,
          i < 6 ? themeColors.cyan : themeColors.muted,
          i < 6 ? themeColors.cyan : themeColors.panel,
        );
    });
    withStageFocus('draft-verify', () => {
      if (cueVisible(1, 2)) {
        drawText(ctx, api, 'draft proposal', 150, 840, 29, themeColors.yellow);
        ['A', 'B', 'C', 'D'].forEach((s, i) =>
          drawCell(
            ctx,
            api,
            s,
            500 + i * 180,
            800,
            125,
            cueComplete(1, 2) && i < 2 ? themeColors.green : themeColors.yellow,
          ),
        );
        drawText(
          ctx,
          api,
          cueComplete(1, 2) ? 'target verifies A B' : 'target verification pending',
          1300,
          840,
          27,
          themeColors.green,
        );
      }
    });
    drawFooter(
      ctx,
      api,
      'Inspect context, queues and real first-audio paths; a draft count is not a speedup.',
    );
  }
}
export default {
  id: 'serving-pressure',
  draw: drawServingPressure,
  cues: [
    'va-serving-pressure-0-0',
    'va-serving-pressure-0-1',
    'va-serving-pressure-0-2',
    'va-serving-pressure-1-0',
    'va-serving-pressure-1-1',
    'va-serving-pressure-1-2',
    'va-serving-pressure-1-3',
  ],
};
