import { sampleModel } from '../model.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawComparability(ctx, scene, state, api) {
  api.focus.target('tr-comparability-trace', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = sampleModel('comparability', state),
      currentBeat = modelState.beat;
    if (state.cues) {
      Object.assign(
        modelState,
        sampleModel('comparability', {
          ...state,
          beat: api.focus.visible('changed-evaluator') ? 1 : 0,
        }),
      );
    }
    const grid = (labels, x, y, width, height, z = 30) =>
      teaching.grid({
        x,
        y,
        width,
        height,
        rows: labels.length,
        columns: labels[0].length,
        labels,
        fontSize: z,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        textColor: themeColors.ink,
        cellFocusTarget: (row, col) => {
          if (!row) return undefined;
          return col === 0
            ? 'run-identities'
            : col === 1
              ? 'suite-identities'
              : 'evaluator-identities';
        },
      });
    {
      grid(
        [
          ['Run', 'Suite SHA prefix', 'Evaluator'],
          ...modelState.records.map((r) => [
            r.id,
            r.context.suite.slice(0, 12),
            r.context.evaluator,
          ]),
        ],
        190,
        360,
        1540,
        390,
        34,
      );
      api.focus.target('comparison-verdict', () =>
        drawOriginalText(
          ctx,
          api,
          modelState.comparable
            ? 'Declared comparison conditions match'
            : 'New scoring condition: rerun or justify a comparison design',
          960,
          925,
          35,
          modelState.comparable ? themeColors.green : themeColors.pink,
          'center',
        ),
      );
    }
  });
}
export default {
  id: 'comparability',
  draw: drawComparability,
  cues: [
    'matched-context',
    'tr-comparability-0-0',
    'tr-comparability-0-1',
    'tr-comparability-0-2',
    'tr-comparability-0-3',
    'changed-evaluator',
    'tr-comparability-1-0',
    'tr-comparability-1-1',
    'tr-comparability-1-2',
    'tr-comparability-1-3',
  ],
};
