import { averageResidenceMs, timedArrivalsMs } from '../fixtures.mjs';
import { averageInFlight } from '../construction.mjs';
import { inFlightAt } from '../model.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawRateAndConcurrency(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.9) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    const xOf = (timeMs) => 260 + (timeMs / 1000 + 1) * 250;
    const currentTime = api.lerp(0, 3000, phaseForBeat(0));
    const currentX = xOf(currentTime);
    api.focus.target('rate-active-intervals', () =>
      timedArrivalsMs.forEach((arrival, index) => {
        const completion = arrival + averageResidenceMs,
          y = 390 + index * 29;
        const active = arrival <= currentTime && currentTime < completion;
        const completed = currentTime >= completion;
        const color = active
          ? themeColors.yellow
          : completed
            ? themeColors.blue
            : themeColors.muted;
        api.line(ctx, xOf(arrival), y, xOf(completion), y, color, active ? 9 : 5);
        api.circle(ctx, xOf(arrival), y, 7, themeColors.cyan);
        api.circle(ctx, xOf(completion), y, 7, themeColors.pink);
      }),
    );
    api.line(ctx, xOf(-1000), 850, xOf(4700), 850, themeColors.muted, 3);
    for (const second of [-1, 0, 1, 2, 3, 4]) {
      const x = xOf(second * 1000);
      api.line(ctx, x, 835, x, 865, themeColors.muted, 2);
      text(ctx, api, `${second}s`, x, 895, 25, themeColors.muted);
    }
    api.line(ctx, currentX, 390, currentX, 845, themeColors.yellow, 3);
    api.focus.target('rate-and-concurrency-time-s-in-flight', () =>
      card(
        ctx,
        api,
        `time ${(currentTime / 1000).toFixed(1)} s · ${inFlightAt(currentTime)} in flight`,
        990,
        315,
        themeColors.yellow,
        620,
        68,
      ),
    );
    text(
      ctx,
      api,
      'Integral of active spans in [0, 3 s] = 8.1 request-seconds',
      960,
      925,
      28,
      themeColors.muted,
    );
    api.focus.target('rate-average-calculation', () =>
      equation(
        ctx,
        api,
        String.raw`L=\lambda W=3\times0.9=${averageInFlight.toFixed(1)}`,
        960,
        970,
        43,
        themeColors.ink,
      ),
    );
  }
}
export default {
  id: 'rate-and-concurrency',
  draw: drawRateAndConcurrency,
  cues: [
    'rate-and-concurrency-beat-1-focus-1',
    'rate-and-concurrency-beat-2-focus-1',
    'rate-and-concurrency-beat-3-focus-1',
  ],
};
