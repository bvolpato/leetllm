import { stopReason } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawStopping(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  {
    if (!modelState.b) {
      const rows = [
        ['Exact FAQ', 'Evidence complete', 'STOP'],
        ['Parser repair', 'Alternatives matter', 'SEARCH'],
        ['High-impact claim', 'Evidence missing', 'TOOL / REVIEW'],
      ];
      api.focus.target('stopping-rows', () =>
        teaching.grid({
          x: 230,
          y: 400,
          width: 1460,
          height: 360,
          rows: 3,
          columns: 3,
          labels: rows,
          fontSize: 31,
          padding: 15,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
        }),
      );
      drawOriginalText(
        ctx,
        api,
        'Route by task structure and checkable completion',
        960,
        285,
        36,
        themeColors.cyan,
        'center',
      );
    } else {
      const history = [0.72, 0.7, 0.71, 0.69],
        count = 1 + Math.floor(3 * api.focus.progress('stopping-progress-history', modelState.p)),
        points = history.slice(0, count).map((y, x) => ({
          x: x + 1,
          y,
        }));
      const plot = api.focus.target('stopping-inspected-score-history-proxy-score', () =>
        teaching.axes({
          x: 290,
          y: 410,
          width: 1320,
          height: 370,
          xDomain: [0.8, 4.2],
          yDomain: [0.64, 0.76],
          xTicks: [1, 2, 3, 4],
          yTicks: [0.65, 0.7, 0.75],
          xLabel: 'inspected score history',
          yLabel: 'proxy score',
          fontSize: 28,
        }),
      );
      api.focus.target('stopping-actual-history', () => {
        teaching.curve({
          plot,
          points,
          color: themeColors.cyan,
          width: 5,
        });
        teaching.scatter({
          plot,
          points: points.map((v) => ({
            ...v,
            color: themeColors.yellow,
            radius: 11,
          })),
        });
      });
      api.focus.target('stopping-actual-decision', () =>
        drawOriginalText(
          ctx,
          api,
          stopReason({
            scores: history.slice(0, count),
          }),
          960,
          285,
          36,
          themeColors.yellow,
          'center',
        ),
      );
    }
    drawOriginalText(
      ctx,
      api,
      'Repeated state, token cap and deadline are separate stop conditions',
      960,
      950,
      31,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'stopping',
  draw: drawStopping,
  cues: [
    'stopping-beat-1-focus-1',
    'ra-stopping-0-0',
    'ra-stopping-0-1',
    'ra-stopping-0-2',
    'ra-stopping-0-3',
    'stopping-progress-history',
    'stopping-plateau',
    'ra-stopping-1-0',
    'ra-stopping-1-1',
    'ra-stopping-1-2',
    'ra-stopping-1-3',
  ],
};
