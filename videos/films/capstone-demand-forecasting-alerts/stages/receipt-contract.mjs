import { forecastChapterState, forecastComparison, metrics, peakDiagnostic } from '../model.mjs';
import {
  drawForecastChapterBox,
  drawForecastChapterHead,
  drawForecastChapterNote,
  drawForecastChapterText,
} from '../defaults.mjs';
export function drawReceiptContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = forecastChapterState(state),
    currentBeat = f.b,
    progress = f.p;
  api.focus.target('receipt-contract-operation', () => {
    if (currentBeat === 0) {
      drawForecastChapterHead(
        ctx,
        api,
        'Independent predicates · declare before looking at outcomes',
      );
      const rows = [
        ['Both origins × 7 horizons', 'complete mature grid'],
        ['MAE + peak', 'strictly better than baseline'],
        ['Tolerance fraction', '≥0.85'],
        ['Capacity precision / recall', 'each≥0.60'],
        ['Previous model', 'nonblank name'],
      ];
      const n = Math.ceil(5 * f.progress('forecast-receipt-fields'));
      rows.forEach(([k, v], i) => {
        if (i < n) {
          drawForecastChapterText(ctx, api, k, 200, 430 + i * 110, 30, themeColors.blue);
          drawForecastChapterText(ctx, api, v, 1030, 430 + i * 110, 30, themeColors.cyan);
        }
      });
      drawForecastChapterNote(
        ctx,
        api,
        'A model name does not verify compatible artifacts or a recovery procedure.',
      );
    } else if (currentBeat === 1) {
      const earned = f.completed('forecast-receipt-counterfactual'),
        original = f.completed('forecast-receipt-failed'),
        fake = !original,
        r = forecastComparison(
          fake ? 1 : 11 / 14,
          fake ? 0 : metrics(14).mae,
          fake ? 0 : peakDiagnostic().candidateUnits,
        );
      drawForecastChapterHead(
        ctx,
        api,
        !earned
          ? 'Evaluate the counterfactual candidate'
          : fake
            ? 'Counterfactual perfect forecast: all numerical gates pass'
            : 'Original 14-row fixture: one numerical gate fails',
      );
      if (earned) {
        Object.entries(r.gates).forEach(([k, v], i) => {
          const x = 280 + (i % 4) * 440,
            y = 440 + Math.floor(i / 4) * 130;
          drawForecastChapterBox(
            ctx,
            api,
            k + ':' + (v ? 'pass' : 'fail'),
            x,
            y,
            370,
            85,
            v ? themeColors.green : themeColors.pink,
            27,
          );
        });
        drawForecastChapterText(
          ctx,
          api,
          'Comparison passes: ' + r.comparisonPass,
          540,
          800,
          36,
          r.comparisonPass ? themeColors.green : themeColors.pink,
          'center',
        );
        drawForecastChapterText(
          ctx,
          api,
          'Decision hold · live readiness false',
          1340,
          800,
          36,
          themeColors.yellow,
          'center',
        );
        drawForecastChapterText(
          ctx,
          api,
          'Synthetic fixture only',
          960,
          935,
          32,
          themeColors.yellow,
          'center',
        );
      } else
        drawForecastChapterBox(
          ctx,
          api,
          'Checking numerical comparison and operational evidence',
          960,
          650,
          1500,
          110,
          themeColors.muted,
          30,
        );
      drawForecastChapterNote(
        ctx,
        api,
        'Numerical comparison and operational readiness stay separate even when every local metric passes.',
      );
    } else {
      drawForecastChapterHead(
        ctx,
        api,
        'Operational evidence must include the decision actually taken',
      );
      const n = Math.ceil(4 * progress),
        rows = [
          ['Representative data', 'seasons + events + label delay'],
          ['Planner pilot', 'actionable warnings + decisions'],
          ['Intervention ledger', 'issued schedule → actual capacity'],
          ['Verified recovery', 'compatible previous model + dependencies'],
        ];
      rows.forEach(([k, v], i) => {
        if (i < n) {
          drawForecastChapterText(ctx, api, k, 240, 430 + i * 130, 30, themeColors.blue);
          drawForecastChapterText(ctx, api, v, 880, 430 + i * 130, 30, themeColors.cyan);
        }
      });
      drawForecastChapterNote(
        ctx,
        api,
        'The fixture sends no alerts,changes no staffing and executes no rollout.',
      );
    }
  });
}
export default {
  id: 'receipt-contract',
  draw: drawReceiptContract,
  cues: [
    'receipt-contract-0',
    'forecast-receipt-fields',
    'receipt-contract-1',
    'forecast-receipt-counterfactual',
    'forecast-receipt-failed',
    'receipt-contract-2',
  ],
};
