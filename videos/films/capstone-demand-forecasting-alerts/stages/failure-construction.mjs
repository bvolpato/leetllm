import { candidate } from '../fixtures.mjs';
import { forecastChapterState } from '../model.mjs';
import {
  drawForecastChapterBar,
  drawForecastChapterHead,
  drawForecastChapterNote,
  drawForecastChapterText,
} from '../defaults.mjs';
export function drawFailureConstruction(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = forecastChapterState(state),
    currentBeat = f.b,
    progress = f.p;
  api.focus.target('failure-construction-operation', () => {
    if (currentBeat === 0) {
      drawForecastChapterHead(
        ctx,
        api,
        'Actual first-origin invariance experiment · 15 unavailable rows',
      );
      const changed = f.progress('forecast-failure-input');
      const mature = 62,
        late = 15;
      drawForecastChapterBar(ctx, api, mature, 77, 230, 420, 1450, themeColors.blue);
      drawForecastChapterText(
        ctx,
        api,
        '62 mature rows: unchanged',
        230,
        390,
        30,
        themeColors.blue,
      );
      drawForecastChapterText(
        ctx,
        api,
        '15 later rows: +' + Math.round(10000 * changed),
        1600,
        560,
        33,
        themeColors.pink,
        'right',
      );
      for (let i = 0; i < 15; i++) {
        const x = 230 + i * 95;
        api.rect(ctx, x, 620, 75, 60, themeColors.panel, themeColors.pink, 2);
        drawForecastChapterText(
          ctx,
          api,
          '+' + Math.round(10000 * changed),
          x + 37,
          720,
          20,
          themeColors.pink,
          'center',
        );
      }
      drawForecastChapterText(
        ctx,
        api,
        'Predict: will any of the 7 forecasts move?',
        960,
        900,
        36,
        themeColors.yellow,
        'center',
      );
      drawForecastChapterNote(
        ctx,
        api,
        'Only records later than first-origin availability receive the mutation.',
      );
    } else if (currentBeat === 1) {
      drawForecastChapterHead(ctx, api, 'The exercised design and labels are unchanged');
      const show = f.completed('forecast-failure-invariant');
      candidate.slice(0, 7).forEach((v, i) => {
        const y = 405 + i * 75;
        drawForecastChapterText(ctx, api, 'h' + (i + 1), 230, y, 28, themeColors.blue);
        drawForecastChapterBar(ctx, api, v, 180, 360, y - 32, 480, themeColors.cyan);
        if (show) {
          drawForecastChapterBar(ctx, api, v, 180, 1020, y - 32, 480, themeColors.green);
          drawForecastChapterText(
            ctx,
            api,
            v.toFixed(3) + ' = ' + v.toFixed(3),
            1700,
            y,
            26,
            themeColors.green,
            'right',
          );
        }
      });
      drawForecastChapterText(ctx, api, 'Original fit', 530, 330, 29, themeColors.cyan, 'center');
      drawForecastChapterText(
        ctx,
        api,
        show ? 'Mutated raw future data · same fit' : 'Awaiting rerun',
        1230,
        330,
        29,
        show ? themeColors.green : themeColors.muted,
        'center',
      );
      drawForecastChapterNote(
        ctx,
        api,
        f.completed('forecast-failure-late-plan')
          ? 'Late plan likewise leaves first-origin output fixed · other feature paths still need their own audit.'
          : 'Inspect the repeated fit · other feature paths need their own audit.',
      );
    } else {
      drawForecastChapterHead(
        ctx,
        api,
        'Actual executable boundary outcomes · each test has its own question',
      );
      const rows = [
        ['NaN/Boolean/naive time', 'reject malformed field'],
        ['Forged or duplicate identity', 'reject inconsistent ledger'],
        ['Provisional / partial grid', 'pending / completenessfalse'],
        ['Blank previous model', 'namingfalse'],
        ['Zero tolerance', 'point MAE unchanged'],
        ['Edited ledger bytes', 'original digest mismatch'],
      ];
      const n = Math.ceil(6 * progress);
      rows.slice(0, n).forEach(([v, result], i) => {
        drawForecastChapterText(ctx, api, v, 210, 410 + i * 100, 28, themeColors.blue);
        drawForecastChapterText(ctx, api, result, 1060, 410 + i * 100, 28, themeColors.green);
      });
      drawForecastChapterNote(
        ctx,
        api,
        'Local contract experiments · no alert-delivery or hardware/service proof.',
      );
    }
  });
}
export default {
  id: 'failure-construction',
  draw: drawFailureConstruction,
  cues: [
    'failure-construction-0',
    'forecast-failure-input',
    'failure-construction-1',
    'forecast-failure-invariant',
    'forecast-failure-late-plan',
    'failure-construction-2',
    'forecast-failure-tests',
  ],
};
