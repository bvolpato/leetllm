import { spokenProgress, stopwatchFixture } from '../model.mjs';
import { chapterFooter, chapterSubtitle, chapterText, focusScope } from '../defaults.mjs';
export function drawCompleteStopwatch(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = (id, fallback = progress) => spokenProgress(state, id, fallback),
    done = (id) => q(id) >= 0.98;
  {
    const f = stopwatchFixture();
    chapterSubtitle(ctx, api, themeColors, 'Declared matched toy window · minutes');
    focusScope(ctx, api, 'lp-clock', () => {
      const start = 330,
        scale = 11.7;
      chapterText(ctx, api, themeColors, 'baseline', 160, 420, 31, themeColors.blue);
      api.rect(ctx, start, 365, f.baseline * scale, 95, themeColors.blue, undefined, 0);
      chapterText(ctx, api, themeColors, '120 minutes', 1734, 330, 31, themeColors.blue, 'right');
      chapterText(ctx, api, themeColors, 'candidate', 160, 700, 31, themeColors.cyan);
      let x = start;
      f.parts.forEach((r, i) => {
        const width = r.minutes * scale;
        api.rect(
          ctx,
          x,
          645,
          width - 3,
          95,
          [
            themeColors.yellow,
            themeColors.purple,
            themeColors.pink,
            themeColors.cyan,
            themeColors.green,
          ][i],
          undefined,
          0,
        );
        chapterText(
          ctx,
          api,
          themeColors,
          r.label + ' ' + r.minutes,
          350 + i * 295,
          835,
          26,
          [
            themeColors.yellow,
            themeColors.purple,
            themeColors.pink,
            themeColors.cyan,
            themeColors.green,
          ][i],
          'center',
        );
        x += width;
      });
    });
    focusScope(ctx, api, 'lp-clock-total', () => {
      chapterText(
        ctx,
        api,
        themeColors,
        beat === 1 && done('lp-complete-time')
          ? '90 minutes complete'
          : 'include every declared stage',
        1440,
        600,
        30,
        themeColors.cyan,
        'center',
      );
    });
    focusScope(ctx, api, 'lp-clock-ratio', () => {
      if (beat === 1) {
        chapterText(
          ctx,
          api,
          themeColors,
          done('lp-complete-ratio') ? '120 / 90 = 1.33×' : 'Full-window ratio?',
          620,
          935,
          34,
          themeColors.yellow,
          'center',
        );
        chapterText(
          ctx,
          api,
          themeColors,
          done('lp-time-saved') ? '(120 − 90) / 120 = 25% saved' : 'Time saved?',
          1310,
          935,
          32,
          themeColors.green,
          'center',
        );
      }
    });
    if (!beat)
      chapterFooter(
        ctx,
        api,
        themeColors,
        'Process / preparation / export boundaries must be declared for the actual comparison.',
      );
  }
}
export default {
  id: 'complete-stopwatch',
  draw: drawCompleteStopwatch,
  cues: ['lp-estimate-time', 'lp-complete-time', 'lp-complete-ratio', 'lp-time-saved'],
};
