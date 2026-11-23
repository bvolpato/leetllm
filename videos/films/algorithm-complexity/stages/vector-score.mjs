import { DOCS, QUERY, SCORES } from '../fixtures.mjs';
import { q } from '../construction.mjs';
import { scoringSnapshot } from '../model.mjs';
import { arrow, box, cells, focus, math, text } from '../defaults.mjs';
export function drawVectorScore(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const s = scoringSnapshot(state);
    const showGrid =
      beat === 1 &&
      ['vector-rest', 'vector-n', 'vector-d', 'vector-size', 'vector-both'].some(
        (id) => q(state, id, 1) > 0,
      );
    focus(ctx, api, themeColors, 'vector-work', () => {
      if (!showGrid) {
        text(
          ctx,
          api,
          themeColors,
          'Supplied query [1, 0, 0] · raw dot products',
          960,
          265,
          36,
          themeColors.muted,
        );
        DOCS.forEach((d, i) => {
          const events = s.events.filter((e) => e.row === i),
            sum = events.at(-1)?.sum ?? 0,
            y = 365 + i * 130;
          box(ctx, api, themeColors, d.name, 140, y, 390, 88, themeColors.blue, 31);
          d.vector.forEach((v, c) =>
            box(
              ctx,
              api,
              themeColors,
              events.length > c ? `${v} × ${QUERY[c]} = ${v * QUERY[c]}` : `${v} × ${QUERY[c]} = ?`,
              580 + c * 300,
              y,
              275,
              88,
              events.length > c ? themeColors.cyan : themeColors.muted,
              29,
            ),
          );
          text(
            ctx,
            api,
            themeColors,
            events.length === 3
              ? sum.toFixed(1)
              : events.length
                ? sum.toFixed(1) + ' running'
                : '?',
            1630,
            y + 56,
            36,
            events.length === 3 ? themeColors.green : themeColors.yellow,
          );
        });
        text(
          ctx,
          api,
          themeColors,
          s.completed + ' / 12 coordinate products completed',
          960,
          1000,
          36,
          themeColors.yellow,
        );
      }
    });
    focus(ctx, api, themeColors, 'vector-growth', () => {
      if (showGrid) {
        text(ctx, api, themeColors, 'Required dense products · one cell per product', 960, 270, 36);
        cells(
          ctx,
          api,
          themeColors,
          s.n,
          s.d,
          460,
          360,
          72,
          s.originalExample ? s.completed : s.products,
          themeColors.cyan,
          4,
          3,
        );
        text(
          ctx,
          api,
          themeColors,
          'n = ' + s.n + ' candidate rows',
          1210,
          390,
          34,
          q(state, 'vector-n', 1) > 0 ? themeColors.yellow : themeColors.muted,
        );
        text(
          ctx,
          api,
          themeColors,
          'd = ' + s.d + ' coordinate columns',
          1210,
          455,
          34,
          q(state, 'vector-d', 1) > 0 ? themeColors.cyan : themeColors.muted,
        );
        text(
          ctx,
          api,
          themeColors,
          s.products + ' required products',
          1360,
          560,
          44,
          themeColors.yellow,
        );
        if (s.originalExample)
          text(
            ctx,
            api,
            themeColors,
            'Issuer note score = ' + SCORES[2].score.toFixed(1),
            1360,
            625,
            30,
            themeColors.cyan,
          );
        math(
          ctx,
          api,
          themeColors,
          String.raw`W_{\mathrm{score}}=nd\in\Theta(nd)`,
          1330,
          720,
          46,
          themeColors.ink,
        );
        if (s.originalExample)
          text(
            ctx,
            api,
            themeColors,
            s.completed + ' / 12 coordinate products completed',
            1350,
            850,
            28,
            themeColors.muted,
          );
        text(
          ctx,
          api,
          themeColors,
          s.originalExample
            ? 'Original example: 4 rows × 3 coordinates'
            : 'Original 4 × 3 block retained in blue',
          960,
          1010,
          28,
          themeColors.muted,
        );
      }
    });
    focus(ctx, api, themeColors, 'vector-n', () => {
      if (showGrid && q(state, 'vector-n', 1) > 0) {
        api.line(ctx, 440, 360, 440, 642, themeColors.yellow, 4);
        api.line(ctx, 440, 360, 452, 360, themeColors.yellow, 4);
        api.line(ctx, 440, 642, 452, 642, themeColors.yellow, 4);
        arrow(ctx, api, 392, 505, 445, 505, themeColors.yellow, 5);
        text(ctx, api, themeColors, 'candidate rows', 300, 470, 28, themeColors.yellow);
      }
    });
    focus(ctx, api, themeColors, 'vector-d', () => {
      if (showGrid && q(state, 'vector-d', 1) > 0) {
        api.line(ctx, 460, 350, 670, 350, themeColors.cyan, 4);
        api.line(ctx, 460, 350, 460, 360, themeColors.cyan, 4);
        api.line(ctx, 670, 350, 670, 360, themeColors.cyan, 4);
        text(ctx, api, themeColors, 'coordinate columns', 570, 325, 28, themeColors.cyan);
      }
    });
  }
}
export default {
  id: 'vector-score',
  draw: drawVectorScore,
  cues: ['vector-first', 'vector-rest', 'vector-n', 'vector-d', 'vector-size', 'vector-both'],
};
