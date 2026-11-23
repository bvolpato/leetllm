import { mix } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { box, caption, text as constructionText } from '../defaults.mjs';
export function drawInlineAsynchronous(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'inline-asynchronous'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1;
  api.focus.target('oa-inline-asynchronous-mechanism', () => {
    const buffer = cueProgress('buffer', 0),
      judge = cueProgress('judge', 1);
    constructionText(ctx, api, 'Current response path', 180, 290, 33, themeColors.blue);
    box(ctx, api, 'Generated answer', 180, 400, 440, 120, themeColors.blue, 31);
    box(ctx, api, 'Buffer + detector', 750, 400, 500, 120, themeColors.yellow, 31);
    box(ctx, api, 'User', 1410, 400, 320, 120, themeColors.cyan, 34);
    api.arrow(ctx, 645, 460, 720, 460, themeColors.blue, 5);
    if (buffer === 1) api.arrow(ctx, 1280, 460, 1380, 460, themeColors.cyan, 5);
    constructionText(
      ctx,
      api,
      buffer === 1 ? 'Check before releasing this content' : 'Release held while checking',
      1000,
      605,
      30,
      themeColors.yellow,
      'center',
    );
    if (B >= 1) {
      box(
        ctx,
        api,
        ['Retained request trace', 'request / conversation / served versions'],
        400,
        730,
        940,
        120,
        themeColors.cyan,
        29,
      );
      api.arrow(ctx, 580, 555, 580, mix(565, 700, judge), themeColors.muted, 4);
      if (judge === 1) {
        box(
          ctx,
          api,
          ['After-response judge', 'separate resource budget'],
          1410,
          720,
          330,
          130,
          themeColors.yellow,
          26,
        );
        api.arrow(ctx, 1360, 785, 1385, 785, themeColors.yellow, 4);
      }
    }
    if (B === 2 && resultComplete('resource', 2))
      constructionText(
        ctx,
        api,
        'Shared queues can still affect the response path',
        960,
        900,
        32,
        themeColors.pink,
        'center',
      );
    caption(
      ctx,
      api,
      'Already streamed content cannot be recalled; asynchronous scoring measures a sample',
    );
  });
}
export default {
  id: 'inline-asynchronous',
  draw: drawInlineAsynchronous,
  cues: [
    'oa-inline-asynchronous-0',
    'oa-inline-asynchronous-buffer',
    'oa-inline-asynchronous-released',
    'oa-inline-asynchronous-1',
    'oa-inline-asynchronous-judge',
    'oa-inline-asynchronous-trace',
    'oa-inline-asynchronous-2',
    'oa-inline-asynchronous-resource',
  ],
};
