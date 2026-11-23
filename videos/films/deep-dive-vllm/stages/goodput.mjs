import { sampleModel } from '../construction.mjs';
import { math, text } from '../defaults.mjs';
export function drawGoodput(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleModel('goodput', state),
    currentBeat = modelState.b;
  {
    if (modelState.rateReady)
      api.focus.target('goodput-window', () =>
        text(
          ctx,
          api,
          'Same supplied elapsed window: ' + modelState.window + ' seconds',
          960,
          285,
          31,
          themeColors.yellow,
          'center',
        ),
      );
    modelState.rows.forEach((row, i) => {
      const x = 170 + i * 880,
        key = row.id.toLowerCase(),
        color = i ? themeColors.green : themeColors.blue;
      components.panel({
        x,
        y: 330,
        width: 770,
        height: 550,
        fill: themeColors.panel,
        stroke: color,
      });
      api.focus.target('goodput-candidate-' + key, () =>
        text(ctx, api, 'Candidate ' + row.id, x + 40, 390, 37, color),
      );
      const bar = (kind, label, value, y, ready, tone, detail) => {
        if (!ready) return;
        api.focus.target('goodput-' + key + '-' + kind, () => {
          text(ctx, api, label + ' ' + value, x + 40, y, 31, tone);
          api.rect(ctx, x + 40, y + 18, 650, 28, themeColors.panel, themeColors.muted, 2);
          api.rect(ctx, x + 40, y + 18, (650 * value) / row.offered, 28, tone, undefined, 0);
          if (detail) text(ctx, api, detail, x + 40, y + 76, 24, themeColors.muted);
        });
      };
      bar('offered', 'Offered', row.offered, 445, modelState.offeredReady, themeColors.blue);
      bar(
        'complete',
        'Successful',
        row.complete,
        545,
        modelState.completeReady,
        themeColors.green,
        'Failed or unfinished: ' + row.unfinishedOrFailed,
      );
      bar(
        'passed',
        'Within both limits',
        row.passed,
        685,
        modelState.passedReady,
        themeColors.cyan,
        'Completed outside limits: ' + row.outsideLimits,
      );
      if (modelState.rateReady)
        api.focus.target('goodput-' + key + '-rate', () =>
          math(
            ctx,
            api,
            String.raw`\frac{${row.passed}}{${modelState.window}\ \mathrm{s}}=${row.goodput.toFixed(2)}\ \mathrm{requests/s}`,
            x + 385,
            835,
            38,
            themeColors.green,
          ),
        );
      if (modelState.wrongReady)
        api.focus.target('goodput-' + key + '-wrong', () => {
          text(ctx, api, 'Completion-only estimate', x + 385, 925, 27, themeColors.pink, 'center');
          math(
            ctx,
            api,
            String.raw`\frac{${row.passed}}{${row.complete}}\cdot\frac{${row.offered}}{100\ \mathrm{s}}=${row.wrong.toFixed(2)}\ \mathrm{/s}`,
            x + 385,
            1005,
            33,
            themeColors.pink,
          );
        });
    });
  }
}
export default {
  id: 'goodput',
  draw: drawGoodput,
  cues: [
    'goodput-beat-1-focus-1',
    'goodput-offered-receipts',
    'goodput-successful-receipts',
    'goodput-compliant-receipts',
    'goodput-beat-2-focus-1',
    'goodput-divide-window',
    'goodput-compare-candidates',
    'goodput-beat-3-focus-1',
  ],
};
