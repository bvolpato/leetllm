import { FORECAST_CUE_AT, FORECAST_ROWS } from '../fixtures.mjs';
import { forecastCueProgress } from '../construction.mjs';
import { box, caption, dot, extensionText, line, mini } from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawOriginFeatures(ctx, scene, state, api) {
  if (!Object.keys(FORECAST_CUE_AT).some((id) => id.startsWith('fc-origin-features-'))) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (suffix) => forecastCueProgress(state, `fc-${'origin-features'}-${suffix}`);
  const done = (suffix) => cueProgress(suffix) >= 1;
  const lerp = (a, z, p) => a + (z - a) * smoothstep(p);
  api.focus.target('fc-origin-features-mechanism', () => {
    const x0 = 230,
      step = 150;
    for (let i = 0; i < 10; i++) {
      mini(
        ctx,
        api,
        i < 7 ? FORECAST_ROWS[i + 7].volume : '?',
        x0 + i * step,
        420,
        i < 7 ? themeColors.blue : themeColors.muted,
      );
      extensionText(
        ctx,
        api,
        i < 7 ? `t−${7 - i}` : i === 7 ? 'target t' : `t+${i - 7}`,
        x0 + i * step + 60,
        520,
        24,
        themeColors.muted,
      );
    }
    if (cueProgress('window') > 0) {
      line(ctx, api, 230, 565, lerp(230, 1250, cueProgress('window')), 565, themeColors.cyan, 7);
      extensionText(ctx, api, 'Lag / rolling window ends at t−1', 700, 620, 29, themeColors.cyan);
    }
    if (done('leak')) {
      line(ctx, api, 1280, 400, 1280, 545, themeColors.pink, 5);
      extensionText(ctx, api, 'Target-containing window leaks', 1460, 620, 27, themeColors.pink);
    }
    if (cueProgress('cycle') > 0) {
      const cx = 410,
        cy = 790,
        r = 110;
      api.circle(ctx, cx, cy, r, 'transparent', themeColors.muted, 2);
      for (let d = 0; d < 7; d++) {
        const a = (2 * Math.PI * d) / 7;
        const x = cx + r * Math.cos(a);
        const y = cy - r * Math.sin(a);
        const neighbor = d === 0 || d === 6;
        dot(ctx, api, x, y, neighbor ? themeColors.yellow : themeColors.cyan, neighbor ? 9 : 6);
        if (neighbor)
          extensionText(
            ctx,
            api,
            d === 0 ? 'Mon' : 'Sun',
            x + 16,
            y + 10,
            27,
            themeColors.yellow,
            'left',
          );
      }
      extensionText(ctx, api, 'sin(2πd/7), cos(2πd/7)', 800, 800, 29, themeColors.cyan);
    }
    if (done('known')) box(ctx, api, 'Known: launch calendar', 1090, 715, 620, themeColors.green);
    if (done('weather'))
      box(ctx, api, 'Future realized weather: unavailable', 1090, 825, 620, themeColors.pink, 25);
    if (done('weather'))
      caption(ctx, api, 'Use the weather forecast available when you issued the job forecast.');
  });
  return;
}
export default {
  id: 'origin-features',
  draw: drawOriginFeatures,
  cues: [
    'fc-origin-features-window',
    'fc-origin-features-leak',
    'fc-origin-features-cycle',
    'fc-origin-features-known',
    'fc-origin-features-weather',
  ],
};
