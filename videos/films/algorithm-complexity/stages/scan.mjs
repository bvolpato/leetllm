import { scanSnapshot } from '../model.mjs';
import { box, focus, math, text } from '../defaults.mjs';
export function drawScan(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const s = scanSnapshot(state);
    focus(ctx, api, themeColors, 'scan-work', () => {
      text(ctx, api, themeColors, 'Same complete-scan recipe', 960, 280, 36);
      for (let i = 0; i < s.n; i++) {
        box(
          ctx,
          api,
          themeColors,
          'note ' + (i + 1),
          205 + i * 190,
          400,
          165,
          100,
          i < s.visited ? themeColors.yellow : themeColors.blue,
          29,
        );
        if (i < s.visited)
          text(ctx, api, themeColors, '✓', 287 + i * 190, 560, 40, themeColors.green);
      }
      text(ctx, api, themeColors, s.visited + ' inspections', 960, 660, 44, themeColors.yellow);
    });
    focus(ctx, api, themeColors, 'scan-bound', () => {
      if (s.bound > 0 || beat > 0)
        math(
          ctx,
          api,
          themeColors,
          s.notation === 1
            ? String.raw`W(n)=n\in\Theta(n),\qquad W(n)\in O(n)`
            : String.raw`W(4)=4,\qquad W(8)=8`,
          960,
          815,
          47,
          themeColors.yellow,
        );
      else
        text(
          ctx,
          api,
          themeColors,
          'What will the counter reach?',
          960,
          815,
          38,
          themeColors.muted,
        );
    });
    focus(ctx, api, themeColors, 'scan-inner-work', () => {
      if (s.inner > 0) {
        for (let i = 0; i < 8; i++)
          for (let j = 0; j < 3; j++)
            api.rect(
              ctx,
              215 + i * 190 + j * 49,
              915,
              42,
              44,
              j + i * 3 < Math.floor(s.inner * 24) ? themeColors.cyan : themeColors.panel,
            );
        text(
          ctx,
          api,
          themeColors,
          '3 fixed inner checks per row',
          960,
          1010,
          29,
          themeColors.cyan,
        );
      }
    });
  }
}
export default {
  id: 'scan',
  draw: drawScan,
  cues: ['scan-double', 'scan-visits', 'scan-linear', 'scan-notation', 'scan-inner'],
};
