import { actual, candidate } from '../fixtures.mjs';
import { capacity, sampleModel } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawSignals(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('signals', state);
  {
    const a = modelState.signals;
    const i = Math.max(0, modelState.inspected - 1),
      predicted = candidate[i] > capacity[i],
      observed = actual[i] > capacity[i];
    text(
      ctx,
      api,
      `Inspected ${modelState.inspected} / 14 mature days`,
      960,
      285,
      35,
      themeColors.yellow,
      'center',
    );
    if (modelState.inspected) {
      api.focus.target('inspected-day', () =>
        text(ctx, api, `Day ${i + 1}`, 480, 390, 34, themeColors.ink, 'center'),
      );
      api.focus.target('day-comparison', () =>
        teaching.bars({
          x: 210,
          y: 470,
          width: 560,
          height: 260,
          values: [candidate[i], capacity[i], actual[i]],
          labels: ['Forecast', 'Capacity', 'Actual'],
          colors: [themeColors.cyan, themeColors.yellow, themeColors.pink],
          max: 200,
          showValues: true,
          fontSize: 24,
          format: (v) => v.toFixed(0),
        }),
      );
      api.focus.target('case-outcome', () =>
        text(
          ctx,
          api,
          predicted
            ? observed
              ? 'Signal + overload → true positive'
              : 'Signal + spare capacity → false positive'
            : observed
              ? 'No signal + overload → false negative'
              : 'No signal + spare capacity → true negative',
          480,
          830,
          25,
          predicted === observed ? themeColors.green : themeColors.pink,
          'center',
        ),
      );
    }
    api.focus.target('signal-table', () =>
      teaching.grid({
        x: 970,
        y: 390,
        width: 750,
        height: 420,
        rows: 3,
        columns: 3,
        labels: [
          ['', 'Actual overload', 'Within capacity'],
          ['Signal sent', a.tp, a.fp],
          ['No signal', a.fn, a.tn],
        ],
        fontSize: 24,
        padding: 14,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        highlights: [
          {
            row: 1,
            column: 1,
            stroke: themeColors.green,
            fill: themeColors.panel,
          },
          {
            row: 2,
            column: 1,
            stroke: themeColors.pink,
            fill: themeColors.panel,
          },
        ],
      }),
    );
    api.focus.target('signal-metrics', () =>
      text(
        ctx,
        api,
        `Precision ${a.tp + a.fp ? (a.tp / (a.tp + a.fp)).toFixed(3) : 'pending'} · recall ${a.tp + a.fn ? (a.tp / (a.tp + a.fn)).toFixed(3) : 'pending'}`,
        1270,
        900,
        30,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'signals',
  draw: drawSignals,
  cues: ['signals-b1-1', 'signals-b1-2', 'signals-b2-1', 'signals-b2-2'],
};
