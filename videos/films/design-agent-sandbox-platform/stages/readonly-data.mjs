import { clamp, motion } from '../arithmetic.mjs';
import { drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawReadonlyData(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-readonly-data-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-readonly-data-' + name);
      return q
        ? {
            q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
            done: q.phase === 'after',
          }
        : {
            q: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
            done: currentBeat > index || (currentBeat === index && progress > 0.8),
          };
    },
    cueProgress = (n, i) => cue(n, i).q;
  api.focus.target('sp-readonly-data-mechanism', () => {
    drawRectangle(ctx, api, 180, 335, 650, 390, themeColors.blue);
    drawText(ctx, api, 'Managed image', 220, 400, 34, themeColors.blue);
    drawText(ctx, api, '50 GiB / read-only', 220, 470, 32, themeColors.blue);
    drawText(ctx, api, 'revision + reader policy', 220, 540, 29);
    const q =
      currentBeat === 0
        ? cueProgress('image', 0)
        : currentBeat === 1
          ? cueProgress('fault', 1)
          : cueProgress('dirty', 2);
    for (let i = 0; i < 6; i++) {
      const x = 1010 + (i % 3) * 230,
        y = 355 + Math.floor(i / 3) * 240;
      drawRectangle(ctx, api, x, y, 180, 170, themeColors.cyan);
      drawText(ctx, api, 'clone ' + i, x + 90, y + 60, 28, themeColors.cyan, 'center');
      if (q > i / 6) {
        drawRectangle(
          ctx,
          api,
          x + 25,
          y + 90,
          130,
          45,
          currentBeat === 2 ? themeColors.pink : themeColors.green,
        );
        drawText(
          ctx,
          api,
          currentBeat === 2 ? 'GC marks' : 'clean read',
          x + 90,
          y + 120,
          23,
          currentBeat === 2 ? themeColors.pink : themeColors.green,
          'center',
        );
      }
    }
    if (currentBeat === 2)
      drawText(
        ctx,
        api,
        'GC marks / refcounts → private metadata writes',
        190,
        880,
        31,
        themeColors.pink,
      );
    else
      drawText(
        ctx,
        api,
        'Shared file bytes still have I/O and resident working-set cost',
        190,
        880,
        30,
        themeColors.yellow,
      );
    drawFooter(
      ctx,
      api,
      'Host accounting follows clean faults and private growth separately, not configured guest RAM.',
    );
  });
}
export default {
  id: 'readonly-data',
  draw: drawReadonlyData,
  cues: [
    'sp-readonly-data-0',
    'sp-readonly-data-image',
    'sp-readonly-data-1',
    'sp-readonly-data-fault',
    'sp-readonly-data-2',
    'sp-readonly-data-dirty',
  ],
};
