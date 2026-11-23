import { phase } from '../arithmetic.mjs';
import { apiChapterState } from '../construction.mjs';
import { chapterText, footer, heading, panel, strokeLine, travel } from '../defaults.mjs';
export function drawDomainWire(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    modelState = apiChapterState('domain-wire', state),
    u = modelState.p,
    done = modelState.settled;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'One internal task carries several independent contracts');
      panel(
        ctx,
        api,
        'LLMTask · T-17\naccount 10234 · policy P-7',
        220,
        385,
        1480,
        120,
        themeColors.blue,
        32,
      );
      ['task + access', 'connect / read', 'total deadline', 'retry cap'].forEach((v, i) => {
        const q = phase(u, i * 0.15, i * 0.15 + 0.3);
        panel(
          ctx,
          api,
          v,
          240 + i * 400,
          650 + 150 * (1 - q),
          350,
          90,
          i < 2 ? themeColors.cyan : themeColors.yellow,
          26,
        );
      });
      footer(
        ctx,
        api,
        'Validate the incoming request before constructing the task',
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Validate internal values before adapting the request');
      panel(
        ctx,
        api,
        'allowed task\nfinite positive timeouts\nnonnegative retry cap',
        210,
        410,
        590,
        210,
        themeColors.green,
        29,
      );
      panel(ctx, api, 'Provider wire request', 1130, 420, 580, 100, themeColors.blue, 30);
      travel(
        ctx,
        api,
        'T-17',
        {
          x: 360,
          y: 730,
        },
        {
          x: 1300,
          y: 730,
        },
        u,
        themeColors.cyan,
      );
      if (done)
        panel(
          ctx,
          api,
          'required_fields is internal metadata',
          900,
          850,
          820,
          80,
          themeColors.yellow,
          27,
        );
      footer(ctx, api, 'The supported schema is supplied separately through the provider API');
    } else {
      heading(ctx, api, 'The legacy field names a minimum age');
      strokeLine(ctx, api, 250, 650, 1680, 650, themeColors.muted);
      [0, 15, 30, 45, 60].forEach((v, i) => {
        strokeLine(ctx, api, 250 + i * 350, 640, 250 + i * 350, 660);
        chapterText(ctx, api, v + ' days', 250 + i * 350, 710, 27, themeColors.muted, 'center');
      });
      panel(ctx, api, 'rotation_window_days = 30', 400, 420, 1120, 100, themeColors.yellow, 32);
      const x = 250 + 350 * 2;
      strokeLine(ctx, api, x, 550, x, 620, themeColors.yellow);
      strokeLine(ctx, api, x, 750, x, 900, themeColors.yellow);
      api.rect(ctx, x + 12, 780, Math.max(1, 680 * u), 60, themeColors.green);
      chapterText(ctx, api, 'eligible age range', 1330, 930, 28, themeColors.green, 'center');
      footer(ctx, api, 'A stale key qualifies as soon as its age reaches the policy minimum');
    }
  }
}
export default {
  id: 'domain-wire',
  draw: drawDomainWire,
  cues: ['ap-domain-wire-0', 'ap-domain-wire-1', 'ap-domain-wire-2'],
};
