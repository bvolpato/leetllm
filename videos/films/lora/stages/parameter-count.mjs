import { point } from '../geometry.mjs';
import { resultAfter } from '../construction.mjs';
import { text, math, rect, line, fade } from '../defaults.mjs';
export function drawParameterCount(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    const size = 520,
      x = 220,
      y = 330;
    rect(ctx, api, x, y, size, size, '#79aaff20', themeColors.blue, 5);
    for (let i = 1; i < 16; i++) {
      line(
        ctx,
        api,
        point(x + (i * size) / 16, y),
        point(x + (i * size) / 16, y + size),
        '#79aaff44',
        1,
      );
      line(
        ctx,
        api,
        point(x, y + (i * size) / 16),
        point(x + size, y + (i * size) / 16),
        '#79aaff44',
        1,
      );
    }
    text(ctx, api, '4096 × 4096', 480, 285, 38, themeColors.blue, 'center', 'mono');
    api.focus.target('base-count', () =>
      text(
        ctx,
        api,
        resultAfter(state, 'parameter-base-result', 0)
          ? '16,777,216 base weights'
          : 'Base count pending',
        480,
        920,
        34,
        themeColors.blue,
        'center',
      ),
    );
    fade(
      ctx,
      api,
      Math.max(stage(1), Number(api.focus.progress('parameter-count-b2-1', 0) > 0)),
      () => {
        rect(ctx, api, 850, y, (size * 16) / 4096, size, themeColors.yellow, undefined, 0);
        rect(ctx, api, 930, y, size, (size * 16) / 4096, themeColors.yellow, undefined, 0);
        text(ctx, api, 'r = 16', 1590, 285, 36, themeColors.yellow, 'center', 'mono');
        const inset = rect(
          ctx,
          api,
          1060,
          450,
          640,
          300,
          themeColors.panel,
          themeColors.yellow,
          18,
        );
        api.container(
          ctx,
          inset,
          () => {
            text(ctx, api, 'MAGNIFIED FACTORS', 1380, 505, 28, themeColors.muted, 'center');
            api.focus.target('adapter-count', () =>
              rect(ctx, api, 1110, 550, 45, 150, '#f4d47760', themeColors.yellow, 3),
            );
            rect(ctx, api, 1230, 550, 400, 45, '#f4d47760', themeColors.yellow, 3);
            api.focus.target('adapter-count', () =>
              text(
                ctx,
                api,
                resultAfter(state, 'parameter-adapter-result', 1)
                  ? '131,072 trainable values'
                  : 'Factor count pending',
                1415,
                687,
                31,
                themeColors.yellow,
                'center',
              ),
            );
          },
          {
            padding: 18,
          },
        );
        api.focus.target('adapter-ratio', () =>
          text(
            ctx,
            api,
            resultAfter(state, 'parameter-percent-result', 1)
              ? '0.78125% of the base matrix'
              : 'Relative count pending',
            1380,
            815,
            36,
            themeColors.yellow,
            'center',
          ),
        );
      },
    );
    fade(
      ctx,
      api,
      Math.max(stage(2), Number(api.focus.progress('parameter-count-b3-1', 0) > 0)),
      () =>
        api.focus.target('parameter-equation', () =>
          math(
            ctx,
            api,
            'N_{\\mathrm{adapter}}=r(d_{\\mathrm{in}}+d_{\\mathrm{out}})',
            1210,
            955,
            46,
            themeColors.ink,
            'center',
          ),
        ),
    );
  }
  ctx.restore();
}
export default {
  id: 'parameter-count',
  draw: drawParameterCount,
  cues: [
    'parameter-count-b1-1',
    'parameter-base-result',
    'parameter-count-b2-1',
    'parameter-adapter-result',
    'parameter-percent-result',
    'parameter-count-b3-1',
  ],
};
