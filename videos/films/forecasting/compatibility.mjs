import { FORECAST_CUE_AT } from './fixtures.mjs';
import { forecastCueProgress } from './construction.mjs';
import { line } from './defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  if (Object.keys(FORECAST_CUE_AT).some((id) => id.startsWith(`fc-${scene.id}-`))) {
    const { C } = api,
      b = state.beat ?? 0;
    const P = (suffix) => forecastCueProgress(state, `fc-${scene.id}-${suffix}`);
    const done = (suffix) => P(suffix) >= 1;
    const lerp = (a, z, p) => a + (z - a) * smoothstep(p);
    const plot = (x, y, w, h, xmin, xmax, ymin, ymax) => {
      const X = (v) => x + ((v - xmin) / (xmax - xmin)) * w,
        Y = (v) => y + h - ((v - ymin) / (ymax - ymin)) * h;
      line(ctx, api, x, y + h, x + w, y + h);
      line(ctx, api, x, y, x, y + h);
      return {
        X,
        Y,
      };
    };
    const target = `fc-${scene.id}-mechanism`;
    api.focus.target(target, () => {});
    return;
  }
  {
    const { C } = api,
      b = state.beat ?? 0,
      p = api.clamp(state.beatP ?? 0);
    const phase = (beat, start = 0.06, end = 0.82) =>
      b < beat ? 0 : b > beat ? 1 : api.phase(p, start, end);
  }
}
