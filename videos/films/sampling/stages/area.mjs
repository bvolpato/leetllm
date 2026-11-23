import { begun, directed } from '../construction.mjs';
import { durationCdf, durationDensity, lateProbability } from '../model.mjs';
import {
  drawOriginalSamplingAxes,
  drawOriginalSamplingDensity,
  drawOriginalSamplingEquation,
  drawOriginalSamplingFillArea,
  drawOriginalSamplingFooter,
  drawOriginalSamplingPath,
  drawOriginalSamplingTarget,
  drawOriginalSamplingText,
} from '../defaults.mjs';
export function drawArea(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const guide = (q, x, top, color) =>
    drawOriginalSamplingPath(ctx, api, [q.point(x, 0), q.point(x, top)], color, 3);
  const percent = (value) => (100 * value).toFixed(1) + '%';
  {
    const q = drawOriginalSamplingAxes(ctx, api);
    const band = beat === 0 ? directed(state, 'area-band', 0.4, 0.65) : 1;
    const shrink = beat === 1 ? directed(state, 'area-narrow', 0.03, 0.3) : 0;
    const lower = beat === 2 ? 0 : 6 - band * (1 - shrink),
      upper =
        beat === 2 ? 10 * directed(state, 'area-deadline', 0.05, 0.35) : 6 + band * (1 - shrink);
    drawOriginalSamplingTarget(ctx, api, 'density-area', () => {
      drawOriginalSamplingFillArea(
        ctx,
        api,
        q,
        lower,
        upper,
        0.55,
        beat === 2 ? themeColors.green : themeColors.cyan,
      );
      drawOriginalSamplingDensity(ctx, api, q);
      if (band > 0 || beat > 0) {
        guide(q, lower, durationDensity(lower), themeColors.yellow);
        guide(q, upper, durationDensity(upper), themeColors.yellow);
      }
      drawOriginalSamplingText(
        ctx,
        api,
        `range: ${lower.toFixed(1)} to ${upper.toFixed(1)} seconds`,
        1550,
        395,
        31,
        themeColors.muted,
        'center',
      );
      drawOriginalSamplingText(ctx, api, 'area', 1550, 490, 32, themeColors.muted, 'center');
      drawOriginalSamplingText(
        ctx,
        api,
        percent(durationCdf(upper) - durationCdf(lower)),
        1550,
        560,
        58,
        beat === 2 ? themeColors.green : themeColors.cyan,
        'center',
      );
      if (beat < 2) {
        drawOriginalSamplingText(
          ctx,
          api,
          'density at 6 s',
          1550,
          690,
          29,
          themeColors.muted,
          'center',
        );
        drawOriginalSamplingText(
          ctx,
          api,
          `${durationDensity(6).toFixed(3)} per second`,
          1550,
          750,
          33,
          themeColors.blue,
          'center',
        );
      }
    });
    drawOriginalSamplingTarget(ctx, api, 'deadline-probability', () => {
      if (beat === 2 && begun(state, 'area-result', 0.65)) {
        drawOriginalSamplingText(ctx, api, 'timer wins', 1550, 690, 33, themeColors.pink, 'center');
        drawOriginalSamplingText(
          ctx,
          api,
          percent(lateProbability),
          1550,
          765,
          54,
          themeColors.pink,
          'center',
        );
      } else
        drawOriginalSamplingEquation(
          ctx,
          api,
          'P(a<T\\le b)=\\int_a^b f(t)\\,dt',
          960,
          945,
          40,
          themeColors.ink,
          'center',
        );
    });
    if (beat === 2)
      drawOriginalSamplingFooter(ctx, api, 'Original model: median 6 s · log-spread 0.55');
  }
}
export default {
  id: 'area',
  draw: drawArea,
  cues: ['area-band', 'area-narrow', 'area-deadline', 'area-result'],
};
