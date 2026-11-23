import '../fixtures.mjs';
import '../construction.mjs';
import { rectangle, text } from '../defaults.mjs';
export function drawLifecycleEvents(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const q = (i, a = 0.12, z = 0.8) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    const n =
        currentBeat === 0
          ? Math.floor(q(0) * 4)
          : currentBeat === 1
            ? 4 + Math.floor(q(1) * 2)
            : 6 + Math.floor(q(2)),
      labels = [
        'queued',
        'reserved',
        'transfer',
        'arrived',
        'decode ready',
        'generated',
        'delivered',
      ];
    text(
      ctx,
      api,
      'R4219 · op17 · generation4 · lease12',
      960,
      285,
      37,
      themeColors.yellow,
      'center',
    );
    const xs = [250, 480, 710, 940, 1170, 1400, 1630];
    labels.forEach((v, i) => {
      const y = i === 2 || i === 3 ? 570 : i === 6 ? 805 : 375;
      rectangle(
        ctx,
        api,
        xs[i] - 95,
        y,
        190,
        100,
        i < n ? (i < 4 ? themeColors.blue : themeColors.green) : themeColors.muted,
      );
      text(ctx, api, v, xs[i], y + 62, 25, i < n ? themeColors.ink : themeColors.muted, 'center');
      if (i < n)
        text(
          ctx,
          api,
          '✓',
          i === 6 ? 1770 : xs[i],
          i === 6 ? y + 60 : y - 24,
          31,
          themeColors.green,
          'center',
        );
    });
    text(ctx, api, 'request owner', 180, 515, 25, themeColors.yellow);
    text(ctx, api, 'transfer engine', 180, 610, 25, themeColors.blue);
    text(ctx, api, 'client', 180, 850, 25, themeColors.green);
    if (n >= 6) {
      const u = q(2),
        x = 1335 + 230 * u,
        y = 645 + 100 * u;
      rectangle(ctx, api, x, y, 130, 50, themeColors.yellow);
      text(ctx, api, 'token #1', x + 65, y + 34, 24, themeColors.yellow, 'center');
    }
    text(
      ctx,
      api,
      'arrived bytes ≠ validated state ≠ generated token ≠ delivered token',
      960,
      1010,
      32,
      themeColors.yellow,
      'center',
    );
  };
  if (api.focus)
    api.focus.target('lifecycle-events-construction', () => {
      body();
    });
  else body();
}
export default {
  id: 'lifecycle-events',
  draw: drawLifecycleEvents,
  cues: ['lifecycle-events-b1', 'lifecycle-events-b2', 'lifecycle-events-b3'],
};
