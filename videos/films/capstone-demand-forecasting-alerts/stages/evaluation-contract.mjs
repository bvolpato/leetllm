import { forecastChapterState } from '../model.mjs';
import {
  drawForecastChapterBox,
  drawForecastChapterEquation,
  drawForecastChapterHead,
  drawForecastChapterNote,
  drawForecastChapterPlot,
  drawForecastChapterText,
} from '../defaults.mjs';
export function drawEvaluationContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = forecastChapterState(state),
    currentBeat = f.b,
    progress = f.p;
  api.focus.target('evaluation-contract-operation', () => {
    if (currentBeat === 0) {
      const n = Math.floor(5 * f.progress('forecast-eval-mature'));
      drawForecastChapterHead(
        ctx,
        api,
        n
          ? 'Score only the same mature rows'
          : 'No labels → undefined scores · pending records persist',
      );
      [0, 1, 2, 3, 4].forEach((i) => {
        const x = 280 + i * 330;
        drawForecastChapterBox(ctx, api, 'record' + (i + 1), x, 430, 280, 80, themeColors.blue);
        drawForecastChapterBox(
          ctx,
          api,
          i < n ? 'final+available' : 'pending',
          x,
          600,
          280,
          80,
          i < n ? themeColors.green : themeColors.muted,
        );
      });
      drawForecastChapterText(
        ctx,
        api,
        n ? 'Mature:' + n + ' · denominator:' + n : 'MAE / peak / fraction:undefined',
        960,
        800,
        36,
        n ? themeColors.cyan : themeColors.yellow,
        'center',
      );
      drawForecastChapterText(
        ctx,
        api,
        'Complete origin/horizon grid still required',
        960,
        935,
        32,
        themeColors.pink,
        'center',
      );
      drawForecastChapterNote(
        ctx,
        api,
        'Unavailable is not an observed zero · empty precision/recall denominators remain undefined.',
      );
    } else if (currentBeat === 1) {
      drawForecastChapterHead(ctx, api, 'Selective peak cost · actual threshold150');
      const visible = f.completed('forecast-eval-wed');
      drawForecastChapterText(ctx, api, 'Actual y', 270, 430, 30, themeColors.muted);
      drawForecastChapterText(ctx, api, 'Forecast ŷ', 690, 430, 30, themeColors.muted);
      drawForecastChapterText(ctx, api, 'Issued capacity C', 1190, 430, 30, themeColors.muted);
      [145, 138, 140].forEach((v, i) =>
        drawForecastChapterText(
          ctx,
          api,
          v,
          270 + i * 460,
          560,
          55,
          [themeColors.pink, themeColors.cyan, themeColors.yellow][i],
          'center',
        ),
      );
      drawForecastChapterEquation(
        ctx,
        api,
        String.raw`3\max(y-\hat y,0)\ \mathrm{only\ if}\ y\ge150`,
        960,
        750,
        42,
      );
      if (visible) {
        drawForecastChapterText(
          ctx,
          api,
          '145>140:overload proxy',
          540,
          915,
          32,
          themeColors.pink,
          'center',
        );
        drawForecastChapterText(
          ctx,
          api,
          '145<150:peak cost0',
          1430,
          915,
          32,
          themeColors.yellow,
          'center',
        );
      }
      drawForecastChapterNote(
        ctx,
        api,
        'This diagnostic ignores overforecasts and lower-volume days · it is not total operational cost.',
      );
    } else {
      drawForecastChapterHead(
        ctx,
        api,
        'A tolerance and a probability interval make different claims',
      );
      const ax = drawForecastChapterPlot(
        ctx,
        api,
        230,
        460,
        1430,
        300,
        [0, 8],
        [0, 14],
        [1, 2, 3, 4, 5, 6, 7],
        [0, 6, 12],
        'horizon',
        'half-width',
      );
      const tol = Array.from(
        {
          length: 7,
        },
        (_, i) => ({
          x: i + 1,
          y: 6,
        }),
      );
      api.teaching.curve({
        plot: ax,
        points: tol,
        color: themeColors.yellow,
        width: 4,
      });
      drawForecastChapterText(
        ctx,
        api,
        'Chosen tolerance ±6 · no probability level',
        960,
        365,
        31,
        themeColors.yellow,
        'center',
      );
      if (f.started('forecast-eval-interval')) {
        api.teaching.curve({
          plot: ax,
          points: [
            {
              x: 1,
              y: 3,
            },
            {
              x: 2,
              y: 4,
            },
            {
              x: 3,
              y: 5,
            },
            {
              x: 4,
              y: 5,
            },
            {
              x: 5,
              y: 5,
            },
            {
              x: 6,
              y: 7,
            },
            {
              x: 7,
              y: 8,
            },
          ],
          color: themeColors.cyan,
          width: 4,
          progress: progress,
        });
        drawForecastChapterText(
          ctx,
          api,
          'Illustrative interval width · method + later calibration needed',
          960,
          900,
          31,
          themeColors.cyan,
          'center',
        );
      }
      drawForecastChapterNote(
        ctx,
        api,
        'Width need not grow every horizon · conditional campaign scenarios omit campaign-execution uncertainty.',
      );
    }
  });
}
export default {
  id: 'evaluation-contract',
  draw: drawEvaluationContract,
  cues: [
    'evaluation-contract-0',
    'forecast-eval-none',
    'forecast-eval-mature',
    'evaluation-contract-1',
    'forecast-eval-peak',
    'forecast-eval-wed',
    'evaluation-contract-2',
    'forecast-eval-interval',
  ],
};
