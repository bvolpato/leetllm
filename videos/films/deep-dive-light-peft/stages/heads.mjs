import { clamp01 } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import { originalCard, originalMath, originalText } from '../defaults.mjs';
export function drawHeads(ctx, scene, state, api) {
  const { components: components, teaching: teaching } = api,
    themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    modelState = sampleModel('heads', state);
  {
    originalText(
      ctx,
      api,
      themeColors,
      modelState.stage === 0
        ? 'One scalar mask per head · initialize each mask to one'
        : 'Head IDs stay attached as their scores sort',
      960,
      295,
      30,
      themeColors.blue,
      'center',
    );
    if (modelState.stage === 0) {
      for (let index = 0; index < 4; index++) {
        api.focus.target('heads-h-mask-1-00', () =>
          originalCard(
            ctx,
            api,
            themeColors,
            `H${index + 1} · ${index < modelState.active ? 'mask 1.00' : 'mask unset'}`,
            280 + index * 350,
            390,
            300,
            95,
            themeColors.yellow,
            31,
          ),
        );
      }
    } else {
      originalText(ctx, api, themeColors, 'Original head order', 205, 345, 25, themeColors.muted);
      modelState.scores.forEach((score, index) => {
        const selected = modelState.kept.includes(index),
          color =
            modelState.stage === 2
              ? selected
                ? themeColors.green
                : themeColors.pink
              : themeColors.cyan;
        api.focus.target('heads-h', () =>
          originalCard(
            ctx,
            api,
            themeColors,
            `H${index + 1} · ${score.toFixed(2)}`,
            250 + index * 365,
            360,
            285,
            82,
            color,
            28,
          ),
        );
      });
      originalText(
        ctx,
        api,
        themeColors,
        'Sorted scores · value scale',
        205,
        485,
        25,
        themeColors.muted,
      );
      const scoreX = (value) => 350 + value * 1260;
      api.line(ctx, 350, 620, 1610, 620, themeColors.muted, 2);
      for (let i = 0; i < modelState.sortedCount; i++) {
        const row = modelState.sorted[i],
          selected = modelState.kept.includes(row.index),
          color =
            modelState.stage === 2
              ? selected
                ? themeColors.green
                : themeColors.pink
              : themeColors.cyan;
        api.focus.target('heads-sorted-scores', () =>
          originalCard(
            ctx,
            api,
            themeColors,
            `H${row.index + 1} · ${row.score.toFixed(2)}`,
            scoreX(row.score) - 105,
            520,
            210,
            75,
            color,
            26,
          ),
        );
      }
      api.focus.target('heads-cutoff', () => {
        const cutoffX = scoreX(modelState.thresholdValue);
        api.line(ctx, cutoffX, 605, cutoffX, 635, themeColors.yellow, 4);
        originalText(
          ctx,
          api,
          themeColors,
          '25th percentile',
          1610,
          485,
          23,
          themeColors.yellow,
          'right',
        );
        if (modelState.thresholdProgress === 1 || modelState.stage === 2)
          originalMath(ctx, api, themeColors, 'Q_{0.25}=0.08+0.75(0.54-0.08)=0.425', 960, 680, 37);
      });
      if (modelState.stage === 2) {
        originalText(
          ctx,
          api,
          themeColors,
          'One selection changes four matching projection shapes',
          960,
          730,
          27,
          themeColors.muted,
          'center',
        );
        originalText(
          ctx,
          api,
          themeColors,
          'Before · four head blocks',
          440,
          775,
          26,
          themeColors.blue,
          'center',
        );
        const rows = ['Q', 'K', 'V', 'Output'];
        const beforeLabels = rows.map(() => ['H1', 'H2', 'H3', 'H4']);
        const beforeHighlights = beforeLabels.flatMap((row, rowIndex) =>
          row.map((_value, column) => ({
            row: rowIndex,
            column,
            fill: modelState.kept.includes(column) ? '#8cdeb52b' : '#ef9ac82b',
            stroke: modelState.kept.includes(column) ? themeColors.green : themeColors.pink,
          })),
        );
        api.focus.target('heads-beforelabels', () =>
          teaching.grid({
            x: 205,
            y: 815,
            width: 570,
            height: 160,
            rows: 4,
            columns: 4,
            labels: beforeLabels,
            fill: themeColors.panel,
            stroke: themeColors.muted,
            lineWidth: 2,
            highlights: beforeHighlights,
            fontSize: 22,
            textColor: themeColors.ink,
            padding: 4,
          }),
        );
        rows.forEach((name, row) =>
          originalText(
            ctx,
            api,
            themeColors,
            name,
            160,
            835 + row * 40,
            21,
            themeColors.blue,
            'center',
          ),
        );
        const resultProgress = clamp01((modelState.projectionsProgress - 0.22) / 0.5);
        components.fade(resultProgress, () => {
          api.line(ctx, 825, 895, 1040, 895, themeColors.yellow, 4);
          api.line(ctx, 1040, 895, 1024, 885, themeColors.yellow, 4);
          api.line(ctx, 1040, 895, 1024, 905, themeColors.yellow, 4);
          originalText(
            ctx,
            api,
            themeColors,
            'drop H2',
            960,
            875,
            24,
            themeColors.yellow,
            'center',
          );
          originalText(
            ctx,
            api,
            themeColors,
            'After · three kept blocks',
            1435,
            775,
            26,
            themeColors.green,
            'center',
          );
          const resultLabels = rows.map(() =>
            modelState.projectionHeads.map((index) => 'H' + (index + 1)),
          );
          const resultHighlights = resultLabels.flatMap((row, rowIndex) =>
            row.map((_value, column) => ({
              row: rowIndex,
              column,
              fill: '#8cdeb52b',
              stroke: themeColors.green,
            })),
          );
          teaching.grid({
            x: 1140,
            y: 815,
            width: 570,
            height: 160,
            rows: 4,
            columns: 3,
            labels: resultLabels,
            fill: themeColors.panel,
            stroke: themeColors.muted,
            lineWidth: 2,
            highlights: resultHighlights,
            fontSize: 22,
            textColor: themeColors.ink,
            padding: 4,
          });
          rows.forEach((name, row) =>
            originalText(
              ctx,
              api,
              themeColors,
              name,
              1095,
              835 + row * 40,
              21,
              themeColors.blue,
              'center',
            ),
          );
        });
      }
    }
  }
}
export default {
  id: 'heads',
  draw: drawHeads,
  cues: [
    'heads-beat-1-focus-1',
    'heads-beat-1-focus-2',
    'heads-sort-scores',
    'heads-beat-2-focus-1',
    'heads-beat-3-focus-1',
    'heads-beat-3-focus-2',
  ],
};
