import { DEDUP, PAIRS } from '../fixtures.mjs';
import { q } from '../construction.mjs';
import { pairSnapshot } from '../model.mjs';
import { box, focus, math, text } from '../defaults.mjs';
export function drawUniquePairs(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const s = pairSnapshot(state);
    focus(ctx, api, themeColors, 'pair-work', () => {
      if (beat < 2) {
        text(ctx, api, themeColors, 'One cell = one unordered comparison', 960, 270, 36);
        for (let i = 0; i < s.n; i++) {
          text(ctx, api, themeColors, i + 1, 262 + i * 72, 340, 26, themeColors.muted);
          text(ctx, api, themeColors, i + 1, 205, 400 + i * 72, 26, themeColors.muted, 'right');
        }
        for (let r = 0; r < s.n; r++)
          for (let c = 0; c < s.n; c++) {
            const index = PAIRS.findIndex((p) => p.left === r && p.right === c),
              done = index >= 0 && index < s.count;
            api.rect(
              ctx,
              230 + c * 72,
              360 + r * 72,
              64,
              64,
              done ? (c < 4 ? themeColors.blue : themeColors.cyan) : themeColors.panel,
              1,
              3,
              themeColors.muted,
            );
          }
        text(
          ctx,
          api,
          themeColors,
          s.count + ' unique comparisons',
          1340,
          510,
          42,
          themeColors.yellow,
        );
        text(ctx, api, themeColors, s.n + ' notes', 1340, 610, 38, themeColors.ink);
        if (s.count > 0) {
          const pair = s.pairs.at(-1);
          text(
            ctx,
            api,
            themeColors,
            'Last: note ' + (pair.left + 1) + ' with note ' + (pair.right + 1),
            1340,
            740,
            30,
            themeColors.cyan,
          );
        }
      }
    });
    focus(ctx, api, themeColors, 'pair-bound', () => {
      if (beat < 2 && q(state, 'pairs-add', 0) === 1)
        math(
          ctx,
          api,
          themeColors,
          q(state, 'pairs-formula', 1) === 1
            ? String.raw`P(n)=\frac{n(n-1)}{2}\in\Theta(n^2)`
            : String.raw`P(4)=6,\quad P(5)=6+4=10`,
          1070,
          1000,
          40,
          themeColors.yellow,
        );
    });
    focus(ctx, api, themeColors, 'dedup-work', () => {
      if (beat === 2) {
        const count = Math.floor(s.dedup * 5 + 1e-9),
          current = count ? DEDUP[count - 1] : null;
        text(
          ctx,
          api,
          themeColors,
          'Exact text equality · first occurrences retained',
          960,
          270,
          36,
        );
        DEDUP.forEach((d, i) =>
          box(
            ctx,
            api,
            themeColors,
            d.value,
            150,
            350 + i * 115,
            700,
            86,
            i < count ? (d.duplicate ? themeColors.pink : themeColors.green) : themeColors.blue,
            30,
          ),
        );
        text(
          ctx,
          api,
          themeColors,
          count + ' membership checks',
          1330,
          380,
          38,
          themeColors.yellow,
        );
        (current?.unique ?? []).forEach((value, i) =>
          box(ctx, api, themeColors, value, 1030, 465 + i * 130, 710, 95, themeColors.green, 31),
        );
        text(
          ctx,
          api,
          themeColors,
          'Retained: ' + (current?.unique.length ?? 0) + ' unique strings',
          1330,
          930,
          37,
          themeColors.green,
        );
      }
    });
    focus(ctx, api, themeColors, 'dedup-limit', () => {
      if (beat === 2 && s.meaning > 0)
        text(
          ctx,
          api,
          themeColors,
          '“expired login fixture” ≠ “expired login test fixture”',
          960,
          1020,
          30,
          themeColors.yellow,
        );
    });
  }
}
export default {
  id: 'unique-pairs',
  draw: drawUniquePairs,
  cues: [
    'pairs-first',
    'pairs-add',
    'pairs-eight',
    'pairs-formula',
    'dedup-arrivals',
    'dedup-meaning',
  ],
};
