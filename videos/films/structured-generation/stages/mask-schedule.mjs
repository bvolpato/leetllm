import { maskStepTime } from '../arithmetic.mjs';
import { maskScheduleClock } from '../construction.mjs';
import { constructionFooter, constructionText, focusProgress, label } from '../defaults.mjs';
export function drawMaskSchedule(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-mask-schedule-mechanism', () => {
      const changed = done('sg-schedule-change'),
        gpu = 8,
        mask = changed ? 10 : 3,
        scale = 105,
        x = 300;
      const serial = done('sg-schedule-serial'),
        answer = changed ? done('sg-schedule-slow-result') : done('sg-schedule-result'),
        elapsed = maskScheduleClock(state);
      [0, 3, 8, 10, 11, 12].forEach((v) => {
        api.line(ctx, x + v * scale, 340, x + v * scale, 825, themeColors.muted, 1);
        label(ctx, api, v + ' ms', x + v * scale, 290, themeColors.muted, 25);
      });
      const lane = (name, y, start, duration, color, visible = true) => {
        constructionText(ctx, api, name, 130, y + 43, 27, color);
        if (visible) {
          api.rect(ctx, x + start * scale, y, duration * scale, 76, themeColors.panel, color, 7);
          const work = Math.max(0, Math.min(duration, elapsed - start));
          if (work > 0) api.rect(ctx, x + start * scale, y + 62, work * scale, 10, color, null, 3);
          label(ctx, api, duration + ' ms', x + (start + duration / 2) * scale, y + 49, color, 29);
        }
      };
      if (currentBeat === 0) {
        lane('GPU', 390, 0, 8, themeColors.blue);
        lane('Mask', 520, 8, 3, themeColors.yellow);
        lane(
          'Sample',
          650,
          11,
          1,
          themeColors.green,
          focusProgress(ctx, api, 'sg-schedule-serial') > 0,
        );
        if (serial) label(ctx, api, '12 ms serial', 960, 900, themeColors.green, 36);
      } else {
        lane('GPU', 390, 0, gpu, themeColors.blue);
        lane('Mask', 520, 0, mask, themeColors.yellow);
        lane(
          'Sample',
          650,
          Math.max(gpu, mask),
          1,
          themeColors.green,
          focusProgress(ctx, api, changed ? 'sg-schedule-slow-result' : 'sg-schedule-result') > 0,
        );
        if (answer)
          label(
            ctx,
            api,
            maskStepTime(gpu, mask, 1) + ' ms total',
            960,
            900,
            themeColors.green,
            36,
          );
      }
      label(
        ctx,
        api,
        'Simulated work clock: ' +
          (Number.isInteger(elapsed) ? elapsed.toFixed(1) + ' ms' : 'advancing'),
        960,
        850,
        themeColors.cyan,
        28,
      );
      constructionFooter(ctx, api, 'Both inputs use the accepted prefix. Sampling waits for both.');
    });
  }
}
export default {
  id: 'mask-schedule',
  draw: drawMaskSchedule,
  cues: [
    'sg-mask-schedule-0',
    'sg-schedule-serial',
    'sg-mask-schedule-1',
    'sg-schedule-mask',
    'sg-schedule-gpu',
    'sg-schedule-result',
    'sg-mask-schedule-2',
    'sg-schedule-change',
    'sg-schedule-slow-result',
    'sg-schedule-wait',
  ],
};
