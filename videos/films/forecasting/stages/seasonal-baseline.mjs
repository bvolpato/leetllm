import { FORECAST_ROWS, weekdayNames } from '../fixtures.mjs';
import { card, cueProgress, cueVisible, focus, text } from '../defaults.mjs';
export function drawSeasonalBaseline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    const previous = FORECAST_ROWS.slice(14, 21),
      xp = (i) => 240 + i * 225;
    focus(ctx, api, 'seasonal-model-rule', () =>
      text(ctx, api, 'Same weekday, seven calendar days earlier', 960, 300, 32, themeColors.yellow),
    );
    previous.forEach((r, i) => {
      const x = xp(i);
      text(ctx, api, weekdayNames[i], x, 365, 27, themeColors.muted);
      card(ctx, api, r.date.slice(5), x - 95, 390, themeColors.muted, 190, 58, 1, undefined, 24);
      const target =
        i === 0 ? 'seasonal-prior-monday' : i === 6 ? 'seasonal-sunday-count' : 'seasonal-day-' + i;
      focus(ctx, api, target, () => {
        const shown =
          i === 0
            ? cueVisible(ctx, api, 'seasonal-baseline-prior-monday', currentBeat > 0)
            : i === 6
              ? cueVisible(ctx, api, 'seasonal-baseline-latest-count', currentBeat > 0)
              : true;
        api.rect(
          ctx,
          x - 48,
          620 - r.volume * 1.12,
          96,
          r.volume * 1.12,
          i === 0 ? themeColors.blue : i === 6 ? themeColors.cyan : themeColors.muted,
        );
        if (
          shown &&
          !(i === 0 && cueProgress(ctx, api, 'seasonal-baseline-weekday-result', 0) > 0) &&
          !(i === 6 && cueProgress(ctx, api, 'seasonal-baseline-yesterday-result', 0) > 0)
        )
          text(
            ctx,
            api,
            r.volume,
            x,
            655,
            30,
            i === 0 ? themeColors.blue : i === 6 ? themeColors.cyan : themeColors.muted,
          );
      });
    });
    const week = cueProgress(ctx, api, 'seasonal-baseline-weekday-result', currentBeat > 1 ? 1 : 0),
      yesterday = cueProgress(
        ctx,
        api,
        'seasonal-baseline-yesterday-result',
        currentBeat > 1 ? 1 : 0,
      );
    focus(ctx, api, 'seasonal-target-day', () =>
      text(ctx, api, 'Target: Jan 26 · Monday', 540, 760, 27, themeColors.yellow),
    );
    focus(ctx, api, 'seasonal-yesterday-result', () => {
      if (yesterday > 0) {
        text(ctx, api, 'Copy Sunday', 1100, 735, 29, themeColors.cyan);
        const x = api.lerp(xp(6), 1100, yesterday),
          y = api.lerp(665, 820, yesterday);
        text(ctx, api, 78, x, y, 34, themeColors.cyan);
        if (yesterday >= 1)
          text(ctx, api, 'Actual 103 · absolute miss 25', 1300, 900, 31, themeColors.cyan);
      }
    });
    focus(ctx, api, 'seasonal-weekday-result', () => {
      if (week > 0) {
        text(ctx, api, 104, xp(0), api.lerp(665, 820, week), 34, themeColors.blue);
        if (week >= 1)
          text(ctx, api, 'Actual 103 · absolute miss 1', 420, 900, 31, themeColors.green);
      }
    });
    if (currentBeat === 2)
      text(
        ctx,
        api,
        'Carry the weekly pattern forward; compare later forecast origins.',
        960,
        975,
        28,
        themeColors.muted,
      );
  }
}
export default {
  id: 'seasonal-baseline',
  draw: drawSeasonalBaseline,
  cues: [
    'seasonal-baseline-beat-1-focus-1',
    'seasonal-baseline-latest-count',
    'seasonal-baseline-prior-monday',
    'seasonal-baseline-target-day',
    'seasonal-baseline-yesterday-result',
    'seasonal-baseline-weekday-result',
    'seasonal-baseline-beat-3-focus-1',
  ],
};
