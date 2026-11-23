import { sourceWaitBudget } from '../arithmetic.mjs';
import { cueDone, cueProgress } from '../construction.mjs';
import { chapterText, focusTargets, footer } from '../defaults.mjs';
export function drawSourceWait(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const z = sourceWaitBudget(),
      x = 230,
      width = 1450,
      scale = width / 1300,
      other = cueProgress(state, 'wait-other', 0, 0.2),
      hop = cueProgress(state, 'wait-hop', 0, 0.6);
    chapterText(
      ctx,
      api,
      'Controlled serial request · unchanged upstream quota',
      960,
      285,
      32,
      themeColors.blue,
      'center',
    );
    for (let row = 0; row < 2; row++) {
      const y = 440 + row * 250;
      chapterText(
        ctx,
        api,
        row ? 'separate service' : 'in-process',
        x,
        y - 45,
        28,
        row ? themeColors.purple : themeColors.blue,
      );
      api.rect(ctx, x, y, scale * z.wait, 70, themeColors.blue, undefined, 0);
      chapterText(
        ctx,
        api,
        'source wait · 1,000 ms',
        x + (scale * z.wait) / 2,
        y + 44,
        31,
        themeColors.ink,
        'center',
      );
      focusTargets(ctx, api, ['wait-other'], () => {
        if (other > 0) {
          api.rect(
            ctx,
            x + scale * z.wait,
            y,
            scale * z.other * other,
            70,
            themeColors.cyan,
            undefined,
            0,
          );
          chapterText(
            ctx,
            api,
            '200 ms',
            x + scale * (z.wait + z.other / 2),
            y + 123,
            28,
            themeColors.cyan,
            'center',
          );
        }
      });
      if (row)
        focusTargets(ctx, api, ['wait-hop'], () => {
          if (hop > 0) {
            api.rect(
              ctx,
              x + scale * z.before,
              y,
              scale * z.hop * hop,
              70,
              themeColors.purple,
              undefined,
              0,
            );
            chapterText(
              ctx,
              api,
              '+20 ms hop',
              x + scale * z.before,
              y - 45,
              27,
              themeColors.purple,
              'center',
            );
          }
        });
      focusTargets(ctx, api, [row ? 'wait-after' : 'wait-before'], () => {
        const done = cueDone(state, row ? 'wait-after' : 'wait-before', 0, row ? 0.8 : 0.4);
        chapterText(
          ctx,
          api,
          done ? `${row ? z.after : z.before} ms total` : 'total pending',
          x + width,
          y + 170,
          30,
          done ? themeColors.yellow : themeColors.muted,
          'right',
        );
      });
    }
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'A separate isolation requirement needs its own evidence and reversal signal'
        : 'Invented times · the added boundary preserves the original 1,000 ms wait',
    );
  }
}
export default {
  id: 'source-wait',
  draw: drawSourceWait,
  cues: ['wait-other', 'wait-before', 'wait-hop', 'wait-after'],
};
