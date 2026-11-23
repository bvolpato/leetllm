import { allocationOptimum } from '../arithmetic.mjs';
import { scalingEvent } from '../construction.mjs';
import { band, curve, line, plot, point, text } from '../defaults.mjs';
export function drawDataCap(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const X = (x, a, z, l, w) => l + ((x - a) / (z - a)) * w,
    Y = (y, a, z, t, h) => t + h - ((y - a) / (z - a)) * h;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-data-cap-construction', () => {
    band(ctx, api, 'Synthetic loss fit   ·   full budget 5.88 × 10²³ FLOPs');
    const product = 70e9 * 1.4e12,
      o = allocationOptimum(product, 2.8, 7.8, 0.07, 0.098);
    const pl = plot(
      ctx,
      api,
      300,
      370,
      1260,
      440,
      [0, 70],
      [0, 16],
      'Parameters N (billions)',
      'Presentations D (trillions)',
    );
    curve(ctx, api, pl, (n) => product / (n * 1e9) / 1e12, 6.2, 70, themeColors.cyan);
    point(ctx, api, pl, o.n / 1e9, o.d / 1e12, themeColors.muted, 11);
    if (currentBeat === 0) {
      const n = 70 + (o.n / 1e9 - 70) * progress;
      point(ctx, api, pl, n, product / (n * 1e9) / 1e12, themeColors.yellow);
      result('Unconstrained: N 7.82B · D 12.53T · loss 2.074');
    } else {
      const wallY = Y(2, 0, 16, 370, 440);
      line(ctx, api, 300, wallY, 1560, wallY, themeColors.pink, 4);
      text(ctx, api, 'D max = 2T', 1660, wallY + 5, 30, themeColors.pink, 'center');
      const n = currentBeat >= 2 ? 49 : o.n / 1e9 + (49 - o.n / 1e9) * progress,
        d = product / (n * 1e9) / 1e12;
      point(ctx, api, pl, n, d, themeColors.yellow);
      if (currentBeat >= 2) {
        const maxX = X(30, 0, 70, 300, 1260);
        line(ctx, api, maxX, 370, maxX, 810, themeColors.blue, 4);
        text(ctx, api, 'Separate N max 30B', maxX, 335, 29, themeColors.blue, 'center');
      }
      if (currentBeat === 1)
        result('At least 49B parameters  ·  49B on 2T tokens  ·  fitted loss 2.086');
      if (currentBeat === 2)
        text(
          ctx,
          api,
          'Can the whole budget fit inside both limits?',
          960,
          965,
          37,
          themeColors.ink,
          'center',
        );
      if (currentBeat === 3) result('30B available < 49B required to spend the full budget');
    }
  });
}
export default {
  id: 'data-cap',
  draw: drawDataCap,
  cues: ['sl-data-cap-0', 'sl-data-cap-1', 'sl-data-cap-2', 'sl-data-cap-3'],
};
