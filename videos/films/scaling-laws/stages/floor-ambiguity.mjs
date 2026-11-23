import { anchorFit } from '../arithmetic.mjs';
import { scalingEvent } from '../construction.mjs';
import { band, curve, plot, point, text } from '../defaults.mjs';
export function drawFloorAmbiguity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const X = (x, a, z, l, w) => l + ((x - a) / (z - a)) * w,
    Y = (y, a, z, t, h) => t + h - ((y - a) / (z - a)) * h;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-floor-ambiguity-construction', () => {
    band(ctx, api, 'Two exact anchors can support different distant forecasts');
    const pl = plot(
      ctx,
      api,
      290,
      380,
      1300,
      420,
      [0, 6],
      [1.5, 3.1],
      'log₁₀ normalized compute',
      'Loss',
    );
    const colors = [themeColors.blue, themeColors.cyan];
    [0.1, 0.2].forEach((a, i) => {
      const f = anchorFit(a);
      curve(
        ctx,
        api,
        pl,
        (x) => f.predict(10 ** x),
        0,
        currentBeat === 0
          ? Math.max(0.001, 2 * progress)
          : currentBeat === 1
            ? 2 + 4 * progress
            : 6,
        colors[i],
      );
      if (currentBeat === 2 || (currentBeat === 1 && end)) {
        text(
          ctx,
          api,
          `α ${a} · E ${f.e.toFixed(3)} · K ${f.k.toFixed(3)}`,
          460 + i * 850,
          875,
          29,
          colors[i],
          'center',
        );
        point(ctx, api, pl, 6, f.predict(1e6), colors[i], 11);
        text(
          ctx,
          api,
          f.predict(1e6).toFixed(3),
          1625,
          Y(f.predict(1e6), 1.5, 3.1, 380, 420) + 10,
          32,
          colors[i],
        );
      }
    });
    for (const [x, y] of [
      [0, 3],
      [2, 2.5],
    ]) {
      point(ctx, api, pl, x, y, themeColors.yellow, 12);
      text(
        ctx,
        api,
        `(${10 ** x},${y})`,
        X(x, 0, 6, 290, 1300) + 15,
        Y(y, 1.5, 3.1, 380, 420) - 22,
        27,
        themeColors.yellow,
      );
    }
    result(
      currentBeat === 0
        ? 'K = (3−2.5)/(1−100^−α) · E = 3−K'
        : currentBeat === 1
          ? 'At C = 10⁶: 1.985 versus 2.222'
          : 'Zero anchor residual · distant gap ≈ 0.237 · no confidence interval claimed',
    );
  });
}
export default {
  id: 'floor-ambiguity',
  draw: drawFloorAmbiguity,
  cues: ['sl-floor-ambiguity-0', 'sl-floor-ambiguity-1', 'sl-floor-ambiguity-2'],
};
