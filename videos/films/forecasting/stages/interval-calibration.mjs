import {
  errors,
  intervalErrors,
  intervalHalfWidth,
  intervalSortedRows,
  introComparison,
  weekdayNames,
} from '../fixtures.mjs';
import { intervalCalibrationGeometry } from '../model.mjs';
import { cueProgress, cueReveal, cueVisible, equation, focus, text } from '../defaults.mjs';
export function drawIntervalCalibration(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phase = (beat, start = 0.06, end = 0.82) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(progress, start, end);
  {
    const sorted = intervalCalibrationGeometry(),
      sortProgress = cueProgress(
        ctx,
        api,
        'interval-calibration-sort',
        currentBeat > 0 ? 1 : phase(0, 0.12, 0.84),
      );
    const x0 = 400,
      gap = 82,
      yTop = 450;
    text(ctx, api, 'Earlier one-day absolute forecast errors', 960, 315, 30, themeColors.muted);
    focus(ctx, api, 'interval-error-distribution', () =>
      intervalSortedRows.forEach(({ value, index }, rank) => {
        const x = api.lerp(x0 + index * gap, x0 + rank * gap, sortProgress);
        const y = yTop - value * 28;
        focus(ctx, api, rank === 13 ? 'interval-order-statistic' : `interval-error-${index}`, () =>
          api.circle(
            ctx,
            x,
            y,
            13,
            rank === 13 && cueVisible(ctx, api, 'interval-calibration-rank', currentBeat > 1)
              ? themeColors.yellow
              : themeColors.cyan,
          ),
        );
        if (
          cueVisible(ctx, api, 'interval-calibration-sort', currentBeat > 0) &&
          sortProgress >= 0.98
        )
          text(
            ctx,
            api,
            String(value),
            x,
            520,
            24,
            rank === 13 ? themeColors.yellow : themeColors.muted,
          );
      }),
    );
    cueReveal(ctx, api, 'interval-calibration-rank', currentBeat > 1, () =>
      focus(ctx, api, 'interval-order-statistic', () =>
        equation(
          ctx,
          api,
          String.raw`k=\lceil0.95\times14\rceil=14`,
          620,
          585,
          37,
          themeColors.yellow,
        ),
      ),
    );
    cueReveal(ctx, api, 'interval-calibration-half-width', currentBeat > 1, () =>
      focus(ctx, api, 'interval-half-width', () =>
        equation(
          ctx,
          api,
          String.raw`q_{0.95}=|e|_{(14)}=${intervalHalfWidth}\text{ jobs}`,
          1300,
          585,
          37,
          themeColors.yellow,
        ),
      ),
    );
    const bandProgress = cueProgress(
      ctx,
      api,
      'interval-calibration-band',
      currentBeat > 1 ? 1 : 0,
    );
    cueReveal(ctx, api, 'interval-calibration-band', currentBeat > 1, () =>
      focus(ctx, api, 'interval-prediction-band', () => {
        const center = (sorted.x0 + sorted.x1) / 2;
        const left = api.lerp(center, sorted.x0, bandProgress);
        const right = api.lerp(center, sorted.x1, bandProgress);
        api.line(ctx, left, sorted.y, right, sorted.y, themeColors.blue, 18);
        for (const edge of [left, right]) api.line(ctx, edge, 625, edge, 675, themeColors.blue, 4);
        api.circle(ctx, center, sorted.y, 11, themeColors.bg, themeColors.blue, 4);
        text(ctx, api, introComparison.forecast, center, 725, 33, themeColors.blue);
        if (bandProgress < 1) return;
        text(ctx, api, sorted.lower, sorted.x0, 725, 33, themeColors.blue);
        text(ctx, api, sorted.upper, sorted.x1, 725, 33, themeColors.blue);
        equation(
          ctx,
          api,
          String.raw`${introComparison.forecast}\pm${intervalHalfWidth}=[${sorted.lower},${sorted.upper}]`,
          960,
          780,
          48,
          themeColors.ink,
        );
      }),
    );
    cueReveal(ctx, api, 'interval-calibration-prior-coverage', currentBeat > 2, () =>
      focus(ctx, api, 'interval-prior-coverage', () =>
        text(
          ctx,
          api,
          `${intervalErrors.length}/${intervalErrors.length} earlier errors inside ±${intervalHalfWidth}`,
          960,
          825,
          25,
          themeColors.cyan,
        ),
      ),
    );
    const gapEnd = api.lerp(
      sorted.x1,
      sorted.markerX,
      cueProgress(ctx, api, 'interval-calibration-outlier', currentBeat > 2 ? 1 : 0),
    );
    cueReveal(ctx, api, 'interval-calibration-outlier', currentBeat > 2, () =>
      focus(ctx, api, 'interval-friday-outlier', () => {
        api.line(ctx, sorted.x1, sorted.y, gapEnd, sorted.y, themeColors.pink, 3);
        api.circle(ctx, sorted.markerX, sorted.y, 15, themeColors.pink);
        text(
          ctx,
          api,
          'Friday actual 160 · outside',
          sorted.markerX,
          sorted.y + 80,
          20,
          themeColors.pink,
          'center',
        );
      }),
    );
    const showWeek = cueVisible(ctx, api, 'interval-calibration-week-coverage', currentBeat > 2);
    if (showWeek)
      api.teaching.grid({
        x: 330,
        y: 840,
        width: 1260,
        height: 80,
        rows: 2,
        columns: 7,
        labels: [
          weekdayNames,
          errors.map(
            (value, index) =>
              `${Math.abs(value) <= intervalHalfWidth ? 'inside' : 'outside'} · ${value > 0 ? '+' : ''}${value}`,
          ),
        ],
        cellFocusTarget: (row, column) =>
          row === 1 ? `interval-week-${weekdayNames[column].toLowerCase()}` : undefined,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        fontSize: 18,
        textColor: themeColors.ink,
        padding: 3,
      });
    cueReveal(ctx, api, 'interval-calibration-week-coverage', currentBeat > 2, () =>
      focus(ctx, api, 'interval-week-coverage', () =>
        text(
          ctx,
          api,
          `${errors.filter((value) => Math.abs(value) <= intervalHalfWidth).length}/7 later-week observations inside the band`,
          960,
          950,
          22,
          themeColors.yellow,
        ),
      ),
    );
    cueReveal(ctx, api, 'interval-calibration-more-origins', currentBeat > 2, () =>
      focus(ctx, api, 'interval-more-origins', () =>
        text(
          ctx,
          api,
          'Move the forecast date forward and score the next week.',
          960,
          978,
          19,
          themeColors.muted,
        ),
      ),
    );
  }
}
export default {
  id: 'interval-calibration',
  draw: drawIntervalCalibration,
  cues: [
    'interval-calibration-sort',
    'interval-calibration-rank',
    'interval-calibration-half-width',
    'interval-calibration-band',
    'interval-calibration-outlier',
    'interval-calibration-prior-coverage',
    'interval-calibration-week-coverage',
    'interval-calibration-more-origins',
  ],
};
