import { FIT_ROWS, forecastWeights } from '../fixtures.mjs';
import { featureProducts, forecastChapterState } from '../model.mjs';
import {
  drawForecastChapterBar,
  drawForecastChapterBox,
  drawForecastChapterEquation,
  drawForecastChapterHead,
  drawForecastChapterNote,
  drawForecastChapterText,
} from '../defaults.mjs';
export function drawFitConstruction(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = forecastChapterState(state),
    currentBeat = f.b,
    progress = f.p;
  api.focus.target('fit-construction-operation', () => {
    if (currentBeat === 0) {
      drawForecastChapterHead(ctx, api, 'Actual first-origin fit · 62 mature rows × 9 features');
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'weeks', 'plan'];
      labels.forEach((v, i) =>
        drawForecastChapterText(
          ctx,
          api,
          v,
          260 + i * 165,
          390,
          25,
          i < 7 ? themeColors.blue : themeColors.cyan,
          'center',
        ),
      );
      drawForecastChapterText(ctx, api, 'y', 1810, 390, 27, themeColors.pink, 'center');
      const rows = FIT_ROWS.slice(0, 5);
      rows.forEach((r, k) => {
        r.x.forEach((v, i) =>
          drawForecastChapterText(
            ctx,
            api,
            i === 7 ? v.toFixed(3) : v,
            260 + i * 165,
            470 + k * 65,
            27,
            themeColors.ink,
            'center',
          ),
        );
        drawForecastChapterText(ctx, api, r.y, 1810, 470 + k * 65, 27, themeColors.pink, 'center');
      });
      drawForecastChapterText(ctx, api, '…62 rows', 960, 820, 29, themeColors.muted, 'center');
      if (f.started('forecast-fit-weights')) {
        drawForecastChapterEquation(ctx, api, String.raw`\min_w\sum_i(x_iw-y_i)^2`, 640, 930, 41);
        drawForecastChapterText(
          ctx,
          api,
          f.completed('forecast-fit-rank')
            ? 'rank9 · no added intercept'
            : 'No added intercept · rank pending',
          1400,
          925,
          30,
          f.completed('forecast-fit-rank') ? themeColors.green : themeColors.muted,
          'center',
        );
      }
      drawForecastChapterNote(
        ctx,
        api,
        'Full actual design and target values used to compute residual objective; same pinned least-squares coefficients.',
      );
    } else if (currentBeat === 1) {
      drawForecastChapterHead(ctx, api, 'Friday February 6 · actual full-precision fit');
      const cues = [
          'forecast-fit-friday-result',
          'forecast-fit-trend-result',
          'forecast-fit-campaign-result',
        ],
        steps = [
          {
            label: 'Friday indicator',
            x: 1,
            w: forecastWeights[4],
          },
          {
            label: 'Elapsed weeks',
            x: 67 / 7,
            w: forecastWeights[7],
          },
          {
            label: 'Known campaign',
            x: 1,
            w: forecastWeights[8],
          },
        ];
      steps.forEach((v, i) => {
        const y = 430 + i * 150;
        drawForecastChapterText(ctx, api, v.label, 230, y, 30, themeColors.blue);
        drawForecastChapterText(
          ctx,
          api,
          v.x.toFixed(4) + ' × ' + v.w.toFixed(6),
          610,
          y,
          30,
          themeColors.cyan,
        );
        if (f.completed(cues[i])) {
          const term = v.x * v.w;
          drawForecastChapterBar(ctx, api, term, 170, 1070, y - 35, 580, themeColors.yellow);
          drawForecastChapterText(
            ctx,
            api,
            term.toFixed(6),
            1680,
            y,
            30,
            themeColors.yellow,
            'right',
          );
        } else
          drawForecastChapterText(
            ctx,
            api,
            'Calculating contribution',
            1340,
            y,
            27,
            themeColors.muted,
            'center',
          );
      });
      if (f.completed('forecast-fit-result')) {
        const result = featureProducts();
        drawForecastChapterText(
          ctx,
          api,
          'Stored full-precision prediction',
          510,
          930,
          29,
          themeColors.muted,
          'center',
        );
        drawForecastChapterText(
          ctx,
          api,
          result.forecast.toFixed(6) + ' parcels',
          1340,
          930,
          44,
          themeColors.green,
          'center',
        );
      } else
        drawForecastChapterText(
          ctx,
          api,
          'Accumulate the active products',
          1240,
          930,
          30,
          themeColors.muted,
          'center',
        );
      drawForecastChapterNote(
        ctx,
        api,
        'Six inactive weekday columns contribute 0 · negative raw predictions clip at 0.',
      );
    } else {
      drawForecastChapterHead(
        ctx,
        api,
        'Plan availability chooses the feature before the future happens',
      );
      const data = [
        ['Historical training row', 'min(fit cutoff,day start)'],
        ['Future target row', 'announced by issue time'],
        ['Later cancellation', 'new evidence after original issue'],
      ];
      data.forEach(([k, v], i) => {
        drawForecastChapterText(ctx, api, k, 250, 450 + i * 170, 31, themeColors.blue);
        drawForecastChapterBox(
          ctx,
          api,
          v,
          1210,
          435 + i * 170,
          1000,
          90,
          i === 2 ? themeColors.pink : themeColors.cyan,
          29,
        );
      });
      if (f.started('forecast-fit-plans')) {
        drawForecastChapterText(
          ctx,
          api,
          'Frozen Friday feature:campaign1 · original ŷ163.284',
          960,
          950,
          32,
          themeColors.yellow,
          'center',
        );
      }
      drawForecastChapterNote(
        ctx,
        api,
        'Announcement file has no complete cancellation revision history or proof of execution.',
      );
    }
  });
}
export default {
  id: 'fit-construction',
  draw: drawFitConstruction,
  cues: [
    'fit-construction-0',
    'forecast-fit-columns',
    'forecast-fit-weights',
    'forecast-fit-rank',
    'fit-construction-1',
    'forecast-fit-products',
    'forecast-fit-result',
    'forecast-fit-clip',
    'forecast-fit-friday-result',
    'forecast-fit-trend-result',
    'forecast-fit-campaign-result',
    'fit-construction-2',
    'forecast-fit-plans',
  ],
};
