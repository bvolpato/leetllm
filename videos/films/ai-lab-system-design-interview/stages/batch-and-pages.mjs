import { lerp, segment } from '../arithmetic.mjs';
import { systemExtensionFrame } from '../construction.mjs';
import { chapterCard, chapterText, footer, header } from '../defaults.mjs';
export function drawBatchAndPages(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('batch-and-pages', state),
    currentBeat = modelState.beat,
    progress = modelState.op;
  return api.focus.target('sd-batch-and-pages-mechanism', () => {
    header(ctx, api, 'Iteration slots and physical cache pages are distinct');
    const finish = currentBeat > 0 ? 1 : segment(progress, 0.12, 0.4),
      join = currentBeat > 0 ? 1 : segment(progress, 0.55, 0.92),
      finished = finish === 1,
      newcomer = join === 1;
    chapterText(ctx, api, 'Live iteration', 475, 350, 29, themeColors.blue, 'center');
    chapterText(ctx, api, 'Waiting → next iteration', 1430, 350, 29, themeColors.yellow, 'center');
    if (!finished || join === 0)
      chapterCard(
        ctx,
        api,
        finished ? 'Free live slot' : 'Short finishing',
        200,
        390,
        550,
        finished ? themeColors.muted : themeColors.blue,
        95,
      );
    if (finished)
      chapterCard(ctx, api, 'Completion receipt · Short', 200, 785, 550, themeColors.green, 95, 28);
    chapterCard(
      ctx,
      api,
      'Long · long history stays in place',
      200,
      570,
      550,
      themeColors.cyan,
      95,
      28,
    );
    chapterCard(ctx, api, 'Next', lerp(1200, 200, join), 390, 550, themeColors.yellow, 95);
    chapterText(ctx, api, 'Physical pages', 1375, 550, 29, themeColors.muted, 'center');
    const pageFocus = currentBeat === 1 ? 2 + Math.min(2, Math.floor(progress * 3)) : null;
    for (let i = 0; i < 8; i++) {
      const owner =
        i < 2 ? (newcomer ? 'Next' : finished ? 'free' : 'Short') : i < 5 ? 'Long' : 'free';
      chapterCard(
        ctx,
        api,
        'P' + i + '\n' + owner,
        970 + (i % 4) * 205,
        590 + Math.floor(i / 4) * 150,
        165,
        pageFocus === i
          ? themeColors.yellow
          : owner === 'free'
            ? themeColors.muted
            : owner === 'Next'
              ? themeColors.yellow
              : themeColors.blue,
        105,
        25,
      );
    }
    if (currentBeat === 1)
      chapterText(
        ctx,
        api,
        'Long logical page ' + (pageFocus - 2) + ' → physical P' + pageFocus,
        1375,
        890,
        27,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 2)
      chapterText(
        ctx,
        api,
        'Require active < 64 AND free ≥ needed; claim atomically',
        960,
        945,
        31,
        themeColors.yellow,
        'center',
      );
    else
      chapterText(
        ctx,
        api,
        'The same Long history survives its neighbor’s completion',
        960,
        945,
        31,
        themeColors.green,
        'center',
      );
    footer(
      ctx,
      api,
      'Iteration scheduling chooses participants; paging maps their independently owned storage',
    );
  });
}
export default {
  id: 'batch-and-pages',
  draw: drawBatchAndPages,
  cues: [
    'sd-batch-and-pages-0-operation',
    'sd-batch-and-pages-0-result',
    'sd-batch-and-pages-1-operation',
    'sd-batch-and-pages-1-result',
    'sd-batch-and-pages-2-operation',
    'sd-batch-and-pages-2-result',
  ],
};
