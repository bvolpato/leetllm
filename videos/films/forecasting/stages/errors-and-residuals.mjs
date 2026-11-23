import { mae } from '../arithmetic.mjs';
import { actual, errors, weekdayNames, weeklyLagForecast } from '../fixtures.mjs';
import { card, cueProgress, cueReveal, cueVisible, equation, focus, text } from '../defaults.mjs';
export function drawErrorsAndResiduals(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phase = (beat, start = 0.06, end = 0.82) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(progress, start, end);
  {
    const baseline = 750,
      left = 390,
      step = 168,
      scale = 5;
    const observationsProgress = cueProgress(
      ctx,
      api,
      'errors-observations',
      currentBeat > 0 ? 1 : phase(0, 0.08, 0.66),
    );
    const smallMissProgress = cueProgress(ctx, api, 'errors-small-misses', currentBeat > 0 ? 1 : 0);
    const fridayProgress = cueProgress(ctx, api, 'errors-friday-outlier', currentBeat > 0 ? 1 : 0);
    const signedCue = 'errors-signed-mean';
    const absoluteCue = 'errors-mae-collect';
    const resultCue = 'errors-mae-result';
    const collected =
      currentBeat > 1
        ? errors.length
        : currentBeat < 1
          ? 0
          : Math.floor(errors.length * cueProgress(ctx, api, 'errors-mae-collect', 0));
    const absoluteSum = errors.slice(0, collected).reduce((sum, value) => sum + Math.abs(value), 0);
    const actualLabels = actual.map((value, index) =>
      index === 4
        ? fridayProgress > 0
          ? String(value)
          : ''
        : observationsProgress > index / 8
          ? String(value)
          : '',
    );
    const tableLabels = [
      ['Series', ...weekdayNames],
      ['Forecast', ...weeklyLagForecast.map(String)],
      ['Observed', ...actualLabels],
    ];
    focus(ctx, api, 'errors-weekly-grid', () =>
      api.teaching.grid({
        x: 280,
        y: 320,
        width: 1360,
        height: 210,
        rows: 3,
        columns: 8,
        labels: tableLabels,
        cellFocusTarget: (row, column) => {
          if (!column) return undefined;
          const day = weekdayNames[column - 1].toLowerCase();
          if (row === 1) return `errors-forecast-${day}`;
          if (row === 2)
            return column - 1 === 4 ? 'errors-friday-observation' : `errors-observation-${day}`;
          return undefined;
        },
        fill: themeColors.panel,
        stroke: themeColors.muted,
        fontSize: 22,
        textColor: themeColors.ink,
        padding: 4,
      }),
    );
    text(ctx, api, 'Signed forecast error · observed − forecast', 960, 555, 27, themeColors.muted);
    api.line(ctx, 340, baseline, 1585, baseline, themeColors.muted, 3);
    api.line(ctx, 340, 585, 340, 780, themeColors.muted, 3);
    for (const value of [-5, 0, 10, 20, 30]) {
      const y = baseline - value * scale;
      api.line(ctx, 330, y, 340, y, themeColors.muted, 2);
      text(ctx, api, String(value), 316, y + 8, 21, themeColors.muted, 'right');
    }
    const drawError = (index) => {
      const value = errors[index],
        x = left + index * step;
      const cueId = index === 4 ? 'errors-friday-outlier' : 'errors-small-misses';
      const targetId = index === 4 ? 'errors-friday-gap' : 'errors-small-misses';
      const amount = index === 4 ? fridayProgress : smallMissProgress;
      const height = Math.max(1, Math.abs(value) * scale * amount),
        y = value < 0 ? baseline : baseline - height;
      const color = value < 0 ? themeColors.cyan : value > 5 ? themeColors.pink : themeColors.green;
      cueReveal(ctx, api, cueId, currentBeat > 0, () =>
        focus(ctx, api, targetId, () => {
          api.rect(ctx, x, y, 68, height, color, undefined, 3);
          text(
            ctx,
            api,
            `${value > 0 ? '+' : ''}${value}`,
            x + 34,
            value < 0 ? baseline + height + 28 : y - 16,
            24,
            color,
          );
        }),
      );
      text(ctx, api, weekdayNames[index], x + 34, 812, 22, themeColors.muted);
    };
    errors.forEach((_, index) => drawError(index));
    cueReveal(ctx, api, 'errors-friday-outlier', fridayProgress > 0, () =>
      focus(ctx, api, 'errors-friday-observation', () =>
        text(
          ctx,
          api,
          `${actual[4]} − ${weeklyLagForecast[4]} = +${errors[4]}`,
          left + 4 * step + 200,
          625,
          22,
          themeColors.pink,
        ),
      ),
    );
    const magnitudes = errors.map(Math.abs);
    cueReveal(ctx, api, 'errors-mae-collect', cueVisible(ctx, api, 'errors-mae-collect'), () =>
      api.teaching.grid({
        x: 340,
        y: 835,
        width: 1220,
        height: 64,
        rows: 1,
        columns: 7,
        labels: [magnitudes.map((value, index) => (index < collected ? `|e| ${value}` : ''))],
        cellFocusTarget: (_row, column) => `errors-absolute-${weekdayNames[column].toLowerCase()}`,
        fill: themeColors.panel,
        stroke: themeColors.yellow,
        fontSize: 23,
        textColor: themeColors.yellow,
        padding: 4,
      }),
    );
    cueReveal(ctx, api, 'errors-signed-mean', cueVisible(ctx, api, 'errors-signed-mean'), () =>
      focus(ctx, api, 'errors-signed-mean', () =>
        equation(
          ctx,
          api,
          String.raw`\overline e=\frac{${errors.reduce((sum, value) => sum + value, 0)}}{${errors.length}}\approx${(errors.reduce((sum, value) => sum + value, 0) / errors.length).toFixed(1)}`,
          480,
          950,
          30,
          themeColors.ink,
        ),
      ),
    );
    cueReveal(ctx, api, 'errors-mae-result', cueVisible(ctx, api, 'errors-mae-result'), () =>
      focus(ctx, api, 'errors-mae-result', () =>
        equation(
          ctx,
          api,
          String.raw`\mathrm{MAE}=\frac{${absoluteSum || magnitudes.reduce((sum, value) => sum + Math.abs(value), 0)}}{${errors.length}}\approx${mae(errors).toFixed(1)}`,
          1360,
          950,
          30,
          themeColors.yellow,
        ),
      ),
    );
    cueReveal(ctx, api, 'errors-and-residuals-beat-3-focus-1', currentBeat > 2, () =>
      card(
        ctx,
        api,
        'Training-data error · residual',
        270,
        215,
        themeColors.cyan,
        620,
        62,
        1,
        'errors-residual-definition',
        20,
      ),
    );
    cueReveal(ctx, api, 'errors-forecast-definition', currentBeat > 2, () =>
      card(
        ctx,
        api,
        'Future-target error · forecast error',
        1030,
        215,
        themeColors.pink,
        620,
        62,
        1,
        'errors-forecast-definition',
        20,
      ),
    );
    cueReveal(ctx, api, 'errors-evaluation-period', currentBeat > 2, () =>
      focus(ctx, api, 'errors-evaluation-period', () =>
        text(
          ctx,
          api,
          'Same subtraction; the evaluation period changes the evidence.',
          960,
          298,
          23,
          themeColors.muted,
        ),
      ),
    );
  }
}
export default {
  id: 'errors-and-residuals',
  draw: drawErrorsAndResiduals,
  cues: [
    'errors-observations',
    'errors-small-misses',
    'errors-friday-outlier',
    'errors-attach',
    'errors-signed-mean',
    'errors-mae-collect',
    'errors-mae-result',
    'errors-and-residuals-beat-3-focus-1',
    'errors-forecast-definition',
    'errors-evaluation-period',
  ],
};
