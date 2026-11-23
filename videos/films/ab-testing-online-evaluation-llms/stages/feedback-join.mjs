import { mix } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { box, caption, text as constructionText, line } from '../defaults.mjs';
export function drawFeedbackJoin(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'feedback-join'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1;
  api.focus.target('oa-feedback-join-mechanism', () => {
    if (B === 0) {
      const turns = [
        ['r1', 'conversation c7', 'prompt P0'],
        ['r2', 'conversation c7', 'prompt P0'],
        ['r3', 'conversation c7', 'prompt P0'],
      ];
      turns.forEach((r, i) =>
        box(
          ctx,
          api,
          r,
          180 + i * 545,
          350,
          490,
          145,
          i === 0 ? themeColors.blue : themeColors.cyan,
          29,
        ),
      );
      if (cueProgress('turns', 0) > 0) {
        const p = cueProgress('turns', 0);
        box(ctx, api, 'Downvote on turn 3', 1190, 640, 520, 85, themeColors.pink, 30);
        line(ctx, api, 1200, 610, mix(1200, 430, p), 610, themeColors.pink, 5);
        if (p === 1)
          constructionText(
            ctx,
            api,
            'Earlier error remains in the same conversation',
            960,
            775,
            32,
            themeColors.yellow,
            'center',
          );
      }
    }
    if (B === 1) {
      box(
        ctx,
        api,
        ['Delayed ticket e9', 'c7 / assigned B / model M1'],
        200,
        610,
        680,
        140,
        themeColors.yellow,
        30,
      );
      const p = cueProgress('join', 1);
      box(
        ctx,
        api,
        ['Original conversation receipt', 'c7 / assigned B / model M1'],
        1020,
        610,
        690,
        140,
        themeColors.blue,
        30,
      );
      api.arrow(ctx, 900, 680, mix(910, 990, p), 680, themeColors.cyan, 5);
    }
    if (B === 2) {
      const rows = [
        ['e9', 'resolution + mature follow-up', 'observed'],
        ['e9 retry', 'same event ID', 'deduplicated'],
        ['e10', 'confirmed timeout', 'observed failure'],
        ['e11', 'follow-up not mature', 'missing'],
      ];
      rows.forEach((r, i) => {
        const y = 380 + i * 115;
        constructionText(ctx, api, r[0], 225, y, 29, themeColors.cyan);
        constructionText(ctx, api, r[1], 640, y, 29);
        if ((i < 3 && resultComplete('retry', 2)) || (i === 3 && resultComplete('missing', 2)))
          constructionText(
            ctx,
            api,
            r[2],
            1510,
            y,
            30,
            i === 3 ? themeColors.yellow : themeColors.green,
            'center',
          );
      });
    }
    caption(
      ctx,
      api,
      'Silence does not establish resolution; retain response rates by assigned arm',
    );
  });
}
export default {
  id: 'feedback-join',
  draw: drawFeedbackJoin,
  cues: [
    'oa-feedback-join-0',
    'oa-feedback-join-turns',
    'oa-feedback-join-1',
    'oa-feedback-join-join',
    'oa-feedback-join-2',
    'oa-feedback-join-retry',
    'oa-feedback-join-missing',
  ],
};
