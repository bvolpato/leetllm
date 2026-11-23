import { visualPrefix } from '../fixtures.mjs';
import { prefixCosts } from '../arithmetic.mjs';
import { spokenProgress } from '../construction.mjs';
import {
  drawClipEquation,
  drawClipRectangle,
  drawClipText,
  rackPhoto,
  withClipFocus,
} from '../defaults.mjs';
export function drawPrefixBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const clauseProgress = (id, beat) => spokenProgress(state, id, beat);
  {
    if (currentBeat < 2) {
      const { crops, side, patch, question } = visualPrefix;
      const { visual, total } = prefixCosts(crops, side, patch);
      const grid = side / patch;
      const x = 180,
        y = 335,
        size = 530;
      const { tag } = rackPhoto(ctx, api, x, y, size, size);
      const midX = x + size / 2;
      const tagTop = y + size * tag[1];
      const tagBottom = tagTop + size * tag[3];
      api.line(ctx, midX, y, midX, tagTop, themeColors.yellow, 5);
      api.line(ctx, midX, tagBottom, midX, y + size, themeColors.yellow, 5);
      api.line(ctx, x, y + size / 2, x + size, y + size / 2, themeColors.yellow, 5);
      drawClipText(ctx, api, 'Four crops from photo 17', x + size / 2, 936, 35);
      api.text(ctx, 'Each crop enters at 336 × 336 pixels', 855, 380, 40, themeColors.ink);
      api.text(ctx, 'Patch size   14 × 14 pixels', 855, 472, 37, themeColors.cyan);
      api.text(ctx, 'Question   180 text tokens', 855, 561, 37, themeColors.ink);
      withClipFocus(ctx, api, 'prefix-cost', () => {
        if (clauseProgress('prefix-patches', 1) > 0) {
          const n = Math.ceil(grid * clauseProgress('prefix-patches', 1));
          for (let i = 1; i < n; i++) {
            const d = (size * i) / (2 * grid);
            api.line(ctx, x + d, y, x + d, y + size / 2, themeColors.muted, 1);
            api.line(ctx, x, y + d, x + size / 2, y + d, themeColors.muted, 1);
          }
        }
        if (clauseProgress('prefix-single', 1) === 1)
          api.text(
            ctx,
            grid + ' × ' + grid + ' = ' + grid ** 2 + ' patches per crop',
            855,
            693,
            39,
            themeColors.yellow,
          );
        if (clauseProgress('prefix-answer', 1) === 1)
          api.text(
            ctx,
            visual.toLocaleString('en-US') +
              ' + ' +
              question +
              ' = ' +
              total.toLocaleString('en-US') +
              ' tokens',
            855,
            814,
            49,
            themeColors.yellow,
          );
        else api.text(ctx, '4 × (336 / 14)² + 180 = ?', 855, 814, 43, themeColors.ink);
      });
      drawClipText(
        ctx,
        api,
        'Width-only projector   ·   separators and chat framing excluded',
        1290,
        935,
        28,
        themeColors.muted,
      );
    } else if (currentBeat === 2) {
      const q = clauseProgress('prefix-cache', 2),
        layers = Math.floor(80 * q);
      drawClipText(ctx, api, 'Hypothetical full-attention KV model', 960, 285, 39);
      for (let i = 0; i < 80; i++)
        drawClipRectangle(
          ctx,
          api,
          280 + (i % 20) * 55,
          430 + Math.floor(i / 20) * 70,
          40,
          45,
          i < layers ? themeColors.cyan : themeColors.panel,
          themeColors.muted,
        );
      withClipFocus(ctx, api, 'prefix-cost', () => {
        if (q === 1)
          drawClipEquation(
            ctx,
            api,
            '80\\times8\\times128\\times2(K,V)\\times2B=320KiB/token',
            960,
            360,
            34,
          );
        else
          drawClipText(
            ctx,
            api,
            'One token owns a key and a value at each model layer',
            960,
            360,
            30,
            themeColors.muted,
          );
        drawClipRectangle(ctx, api, 280, 820, 1200 * q, 65, themeColors.blue);
        if (clauseProgress('prefix-visual-memory', 2) === 1)
          drawClipText(
            ctx,
            api,
            '2,304 visual tokens → 720 MiB per sequence',
            960,
            955,
            38,
            themeColors.blue,
          );
        if (clauseProgress('prefix-question-memory', 2) === 1)
          drawClipText(
            ctx,
            api,
            '180 question tokens add 56.25 MiB of logical cache',
            960,
            1030,
            28,
            themeColors.muted,
          );
      });
    } else {
      const q = clauseProgress('prefix-compress', 3);
      drawClipText(ctx, api, 'The compressor scope changes the retained length', 960, 285, 39);
      for (let scope = 0; scope < 2; scope++) {
        const count = scope ? 256 : 64,
          progress = scope ? clauseProgress('prefix-per-crop', 3) : q;
        for (let i = 0; i < count; i++)
          drawClipRectangle(
            ctx,
            api,
            260 + (i % 32) * 44,
            430 + scope * 240 + Math.floor(i / 32) * 18,
            29,
            11,
            i < count * progress
              ? scope
                ? themeColors.blue
                : themeColors.cyan
              : themeColors.panel,
          );
      }
      withClipFocus(ctx, api, 'prefix-cost', () => {
        drawClipText(
          ctx,
          api,
          q > 0.95 ? '64 across all crops + 180 = 244' : 'whole crop set →64 output slots',
          960,
          370,
          33,
          themeColors.cyan,
        );
        drawClipText(
          ctx,
          api,
          clauseProgress('prefix-per-crop', 3) === 1
            ? '64 per crop × 4 + 180 = 436'
            : 'each crop →64 output slots',
          960,
          630,
          33,
          themeColors.blue,
        );
        drawClipText(
          ctx,
          api,
          'Paged allocation keeps admitted tokens; discarded text needs a different route',
          960,
          1020,
          29,
          themeColors.muted,
        );
      });
    }
  }
}
export default {
  id: 'prefix-budget',
  draw: drawPrefixBudget,
  cues: [
    'prefix-patches',
    'prefix-answer',
    'prefix-single',
    'prefix-cache',
    'prefix-visual-memory',
    'prefix-question-memory',
    'prefix-compress',
    'prefix-per-crop',
  ],
};
