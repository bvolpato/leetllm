import { spokenProgress } from '../model.mjs';
import { chapterFooter, chapterSubtitle, chapterText, focusScope } from '../defaults.mjs';
export function drawPaperMemory(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = (id, fallback = progress) => spokenProgress(state, id, fallback),
    done = (id) => q(id) >= 0.98;
  {
    chapterSubtitle(ctx, api, themeColors, 'Figure 4 · independent normalized memory measurements');
    focusScope(ctx, api, 'lp-memory', () => {
      [
        ['weight', 0.68, 'lp-weight-memory'],
        ['activation', 0.6, 'lp-activation-memory'],
        ['peak', 0.61, 'lp-peak-memory'],
      ].forEach(([name, fraction, cue], i) => {
        const value = beat > 0 || done(cue) ? fraction : 1,
          y = 370 + i * 155;
        chapterText(ctx, api, themeColors, name, 220, y + 55, 32, themeColors.blue);
        api.rect(ctx, 600, y, 1000, 88, themeColors.panel, themeColors.muted, 0);
        api.rect(ctx, 600, y, value * 1000, 88, themeColors.cyan, undefined, 0);
        chapterText(
          ctx,
          api,
          themeColors,
          Math.round(value * 100) + '% of baseline',
          1820,
          y + 55,
          25,
          themeColors.cyan,
          'right',
        );
      });
    });
    focusScope(ctx, api, 'lp-memory-window', () => {
      chapterText(
        ctx,
        api,
        themeColors,
        beat
          ? '2.2× · ten forward/backward batches'
          : 'RoBERTa-Large · retained 67% · trainable .3M',
        960,
        900,
        34,
        themeColors.yellow,
        'center',
      );
    });
    chapterFooter(
      ctx,
      api,
      themeColors,
      'RTX 3090 · batch 32 / length 128 · peak is a separate live-memory measurement, not a sum of these bars.',
    );
  }
}
export default {
  id: 'paper-memory',
  draw: drawPaperMemory,
  cues: ['lp-weight-memory', 'lp-activation-memory', 'lp-peak-memory', 'lp-memory-window'],
};
