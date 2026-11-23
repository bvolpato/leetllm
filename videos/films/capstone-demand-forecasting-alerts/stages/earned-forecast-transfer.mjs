import { transferActuals, transferCapacities, transferForecasts } from '../fixtures.mjs';
import { forecastChapterState } from '../model.mjs';
import {
  drawForecastChapterHead,
  drawForecastChapterNote,
  drawForecastChapterText,
} from '../defaults.mjs';
export function drawEarnedForecastTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = forecastChapterState(state),
    currentBeat = f.b,
    progress = f.p;
  api.focus.target('earned-forecast-transfer-operation', () => {
    const arrived = f.freshArrived;
    drawForecastChapterHead(ctx, api, 'Fresh three-record worksheet · every record required');
    ['A', 'B(Wed)', 'C'].forEach((id, i) => {
      const x = 310 + i * 650;
      drawForecastChapterText(ctx, api, id, x, 390, 33, themeColors.blue, 'center');
      drawForecastChapterText(
        ctx,
        api,
        'issued forecast ' + transferForecasts[i],
        x,
        475,
        32,
        themeColors.cyan,
        'center',
      );
      drawForecastChapterText(
        ctx,
        api,
        'capacity ' + transferCapacities[i],
        x,
        545,
        30,
        themeColors.yellow,
        'center',
      );
      const visible = i !== 1 || arrived;
      drawForecastChapterText(
        ctx,
        api,
        visible ? 'final actual ' + transferActuals[i] : 'actual: pending',
        x,
        640,
        32,
        visible ? themeColors.pink : themeColors.muted,
        'center',
      );
      if (i === 1 && arrived && f.completed('forecast-fresh-error'))
        drawForecastChapterText(
          ctx,
          api,
          '|145 − 138| = 7',
          x,
          725,
          29,
          themeColors.pink,
          'center',
        );
    });
    if (currentBeat === 1) {
      if (f.freshPartial)
        drawForecastChapterText(
          ctx,
          api,
          '2 mature / 1 pending · MAE (1+0)/2 = 0.5',
          960,
          800,
          34,
          themeColors.cyan,
          'center',
        );
      const fields = [];
      if (f.completed('forecast-fresh-partial-tolerance')) fields.push('Tolerance 2/2');
      if (f.completed('forecast-fresh-partial-signal')) fields.push('precision 1 · recall 1');
      if (f.completed('forecast-fresh-incomplete')) fields.push('incomplete');
      if (fields.length)
        drawForecastChapterText(
          ctx,
          api,
          fields.join(' · '),
          960,
          900,
          33,
          themeColors.yellow,
          'center',
        );
    }
    if (currentBeat === 2) {
      const fields = [];
      if (f.freshMean) fields.push('3 mature · MAE 8/3 = 2.667');
      if (f.completed('forecast-fresh-tolerance')) fields.push('tolerance 2/3');
      if (fields.length)
        drawForecastChapterText(
          ctx,
          api,
          fields.join(' · '),
          960,
          810,
          34,
          themeColors.cyan,
          'center',
        );
      if (f.freshRecall)
        drawForecastChapterText(
          ctx,
          api,
          'TP 1 / FP 0 / FN 1 → precision 1 · recall 0.5',
          960,
          900,
          33,
          themeColors.pink,
          'center',
        );
      if (f.completed('forecast-fresh-peak'))
        drawForecastChapterText(
          ctx,
          api,
          'Wednesday 145 < 150 → selective peak 0',
          960,
          970,
          29,
          themeColors.yellow,
          'center',
        );
    }
    drawForecastChapterNote(
      ctx,
      api,
      currentBeat === 0
        ? 'Predict what can be scored now,and what one later label can change.'
        : 'Issued predictions stay fixed · separate worksheet from the 14-row fixture.',
    );
  });
}
export default {
  id: 'earned-forecast-transfer',
  draw: drawEarnedForecastTransfer,
  cues: [
    'earned-forecast-transfer-0',
    'forecast-fresh-inputs',
    'earned-forecast-transfer-1',
    'forecast-fresh-partial',
    'forecast-fresh-partial-tolerance',
    'forecast-fresh-partial-signal',
    'forecast-fresh-incomplete',
    'earned-forecast-transfer-2',
    'forecast-fresh-arrive',
    'forecast-fresh-mean',
    'forecast-fresh-recall',
    'forecast-fresh-peak',
    'forecast-fresh-error',
    'forecast-fresh-tolerance',
  ],
};
