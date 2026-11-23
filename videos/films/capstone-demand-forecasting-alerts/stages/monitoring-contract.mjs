import { forecastChapterState } from '../model.mjs';
import {
  drawForecastChapterBar,
  drawForecastChapterBox,
  drawForecastChapterHead,
  drawForecastChapterNote,
  drawForecastChapterText,
} from '../defaults.mjs';
export function drawMonitoringContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = forecastChapterState(state),
    currentBeat = f.b,
    progress = f.p;
  api.focus.target('monitoring-contract-operation', () => {
    if (currentBeat === 0) {
      drawForecastChapterHead(ctx, api, 'An apparent zero is not a verified demand drop');
      const bad = f.started('forecast-monitor-zero');
      drawForecastChapterBox(
        ctx,
        api,
        'Upstream count not reconciled',
        500,
        425,
        700,
        100,
        themeColors.pink,
      );
      api.arrow(ctx, 850, 425, 1140, 425, themeColors.muted, 3);
      drawForecastChapterBox(
        ctx,
        api,
        bad ? 'Pending:exclude from fit' : 'Naive fill:0parcels',
        1430,
        425,
        560,
        100,
        bad ? themeColors.green : themeColors.yellow,
      );
      const n = bad ? 2 : 3;
      drawForecastChapterText(ctx, api, 'Training examples', 250, 660, 31, themeColors.blue);
      [122, 119, ...(bad ? [] : [0])].forEach((v, i) => {
        drawForecastChapterBar(
          ctx,
          api,
          v,
          150,
          600,
          610 + i * 95,
          900,
          i === 2 ? themeColors.pink : themeColors.cyan,
        );
        drawForecastChapterText(
          ctx,
          api,
          v,
          1550,
          645 + i * 95,
          30,
          i === 2 ? themeColors.pink : themeColors.cyan,
        );
      });
      drawForecastChapterText(
        ctx,
        api,
        'Count' + n + ' · protect the measurement boundary',
        960,
        940,
        32,
        themeColors.green,
        'center',
      );
      drawForecastChapterNote(
        ctx,
        api,
        'Arrival delay,null rate and forecast error are distinct observations.',
      );
    } else if (currentBeat === 1) {
      drawForecastChapterHead(ctx, api, 'Authored review thresholds need denominators and windows');
      const rows = [
        ['Breach fraction >15%', 'labels mature? sample large enough?'],
        ['Precision <60%', 'event mix? changed plans?'],
        ['Repeated monitoring', 'review false-alarm behavior'],
        ['Weekly fit proposal', 'forward evaluation before replacement'],
      ];
      const n = Math.ceil(4 * progress);
      rows.forEach(([k, v], i) => {
        if (i < n) {
          drawForecastChapterText(ctx, api, k, 230, 420 + i * 135, 30, themeColors.yellow);
          drawForecastChapterText(ctx, api, v, 900, 420 + i * 135, 29, themeColors.cyan);
        }
      });
      drawForecastChapterNote(
        ctx,
        api,
        'Threshold crossing proposes review · no automatic retraining scheduler is implemented.',
      );
    } else {
      drawForecastChapterHead(
        ctx,
        api,
        'Append versioned evidence without overwriting earlier forecasts',
      );
      const n = Math.ceil(3 * progress);
      [
        'fit-v1 + original issue rows',
        'fit-v2 + later mature labels',
        'fit-v3 + untouched forward window',
      ]
        .slice(0, n)
        .forEach((v, i) => {
          drawForecastChapterBox(
            ctx,
            api,
            v,
            960,
            430 + i * 180,
            1300,
            100,
            i === 2 ? themeColors.green : themeColors.blue,
          );
          if (i)
            api.arrow(
              ctx,
              960,
              430 + (i - 1) * 180 + 50,
              960,
              430 + i * 180 - 50,
              themeColors.muted,
              3,
            );
        });
      drawForecastChapterNote(
        ctx,
        api,
        'Add cancellation versions and entity keys before expanding scope · actual booking costs before savings claims.',
      );
    }
  });
}
export default {
  id: 'monitoring-contract',
  draw: drawMonitoringContract,
  cues: [
    'monitoring-contract-0',
    'forecast-monitor-zero',
    'monitoring-contract-1',
    'forecast-monitor-review',
    'monitoring-contract-2',
    'forecast-monitor-version',
  ],
};
