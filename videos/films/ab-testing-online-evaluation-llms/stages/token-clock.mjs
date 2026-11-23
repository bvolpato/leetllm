import { clamp, mix } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { tokenClocks } from '../model.mjs';
import { axis, box, caption, text as constructionText, line } from '../defaults.mjs';
export function drawTokenClock(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'token-clock'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1,
    N = (n, p) => Math.min(n, Math.floor(clamp(p) * n + 1e-8));
  api.focus.target('oa-token-clock-mechanism', () => {
    const s = tokenClocks();
    if (B !== 1) {
      const x = axis(
        ctx,
        api,
        230,
        540,
        1400,
        0,
        600,
        [0, 100, 200, 300, 400, 500, 600],
        'Supplied illustrative timing · milliseconds',
      );
      const first = cueProgress('first', 0),
        gaps = cueProgress('gaps', 0);
      line(ctx, api, x(0), 410, x(mix(0, 300, first)), 410, themeColors.blue, 8);
      constructionText(ctx, api, 'request start', x(0), 350, 27, themeColors.muted, 'center');
      s.arrivals.forEach((v, i) => {
        if (i === 0 ? first === 1 : gaps > i / 4) {
          line(ctx, api, x(v), 450, x(v), 560, themeColors.cyan, 4);
          constructionText(ctx, api, 't' + (i + 1), x(v), 680, 28, themeColors.cyan, 'center');
          constructionText(ctx, api, v, x(v), 725, 28, themeColors.ink, 'center');
        }
      });
      if (gaps > 0)
        s.gaps.forEach((v, i) => {
          if (gaps > (i + 1) / 4) {
            const mid = (x(s.arrivals[i]) + x(s.arrivals[i + 1])) / 2;
            constructionText(
              ctx,
              api,
              v + ' ms',
              mid,
              470,
              26,
              v === 120 ? themeColors.pink : themeColors.yellow,
              'center',
            );
          }
        });
      if (B === 0 && resultComplete('mean', 0))
        box(
          ctx,
          api,
          '(500 − 300) / (4 − 1) ≈ 66.67 ms',
          400,
          760,
          1120,
          90,
          themeColors.yellow,
          36,
        );
    }
    if (B === 1) {
      constructionText(ctx, api, 'Client events', 220, 365, 33, themeColors.cyan);
      const items = [
        ['empty event', 300],
        ['chunk: t1 + t2', 340],
        ['chunk: t3 + t4', 500],
        ['closure', 560],
      ];
      items
        .slice(0, N(4, cueProgress('chunks', 1)))
        .forEach((r, i) => box(ctx, api, r, 200 + i * 410, 480, 370, 110, themeColors.cyan, 28));
      if (resultComplete('closure', 1))
        box(
          ctx,
          api,
          'Last content ≠ demonstrated stream closure',
          350,
          690,
          1220,
          105,
          themeColors.yellow,
          35,
        );
    }
    if (B === 2) {
      constructionText(ctx, api, 'Mean 66.67 ms', 440, 790, 36, themeColors.cyan, 'center');
      constructionText(
        ctx,
        api,
        resultComplete('stall', 2)
          ? 'Largest individual gap: 120 ms'
          : 'Inspect the individual gaps',
        1330,
        790,
        36,
        themeColors.pink,
        'center',
      );
    }
    caption(ctx, api, 'Pin the request clock, observation surface, terminal event and formula');
  });
}
export default {
  id: 'token-clock',
  draw: drawTokenClock,
  cues: [
    'oa-token-clock-0',
    'oa-token-clock-first',
    'oa-token-clock-gaps',
    'oa-token-clock-mean',
    'oa-token-clock-1',
    'oa-token-clock-chunks',
    'oa-token-clock-closure',
    'oa-token-clock-2',
    'oa-token-clock-stall',
  ],
};
