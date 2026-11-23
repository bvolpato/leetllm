import { sampleOriginalModel } from '../construction.mjs';
import { drawCard, drawText } from '../defaults.mjs';
export function drawLimiter(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleOriginalModel('limiter', state);
  {
    api.focus.target('limiter-capacity', () =>
      drawText(
        ctx,
        api,
        `Capacity ${modelState.capacity} · refill ${modelState.rate} token/s`,
        390,
        300,
        34,
        themeColors.ink,
      ),
    );
    const meter = {
      x: 500,
      y: 455,
      width: 920,
      height: 58,
    };
    api.focus.target('limiter-token-meter', () => {
      api.rect(
        ctx,
        meter.x,
        meter.y,
        meter.width,
        meter.height,
        themeColors.panel,
        themeColors.muted,
        2,
      );
      const width = (meter.width * modelState.event.tokens) / modelState.capacity;
      if (width > 8)
        api.rect(
          ctx,
          meter.x + 4,
          meter.y + 4,
          width - 8,
          meter.height - 8,
          modelState.event.allowed === false ? themeColors.pink : themeColors.green,
        );
    });
    [0, 1, 2, 3].forEach((value) => {
      const x = meter.x + (meter.width * value) / modelState.capacity;
      api.line(ctx, x, meter.y - 12, x, meter.y + meter.height + 12, themeColors.muted, 2);
      drawText(
        ctx,
        api,
        String(value),
        x,
        meter.y + meter.height + 54,
        28,
        themeColors.muted,
        'center',
      );
    });
    drawText(
      ctx,
      api,
      `${modelState.event.tokens.toFixed(1)} of ${modelState.capacity} tokens available`,
      960,
      395,
      34,
      modelState.event.allowed ? themeColors.green : themeColors.pink,
      'center',
    );
    const label =
      modelState.event.allowed === null
        ? 'ready · first request costs 1 token'
        : modelState.event.allowed
          ? 'request admitted'
          : `denied · retry after ${modelState.event.retryAfter.toFixed(1)} s`;
    api.focus.target('limiter-label', () =>
      drawCard(
        ctx,
        api,
        label,
        510,
        680,
        900,
        modelState.event.allowed ? themeColors.green : themeColors.pink,
        100,
        38,
      ),
    );
    api.focus.target('limiter-clock', () =>
      drawText(
        ctx,
        api,
        `t = ${modelState.event.now.toFixed(1)} s · request cost = ${modelState.event.cost}`,
        960,
        860,
        34,
        themeColors.yellow,
        'center',
      ),
    );
    drawText(
      ctx,
      api,
      'A denied request preserves the remaining tokens',
      960,
      930,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'limiter',
  draw: drawLimiter,
  cues: [
    'limiter-beat-1-focus-1',
    'limiter-spend-burst',
    'limiter-denied-fourth',
    'limiter-half-token',
    'limiter-one-second',
  ],
};
