import { sampleDeepGemmVisual } from '../construction.mjs';
import { drawOriginalCard, drawOriginalEquation, drawOriginalText } from '../defaults.mjs';
export function drawIndexer(ctx, scene, state, api) {
  return api.focus.target('indexer-construction', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = sampleDeepGemmVisual('indexer', state),
      currentBeat = modelState.b;
    {
      if (currentBeat === 0) {
        drawOriginalText(
          ctx,
          api,
          'Dequantized key: [1, −0.5]',
          960,
          300,
          39,
          themeColors.blue,
          'center',
        );
        modelState.queries.forEach((query, i) => {
          drawOriginalCard(
            ctx,
            api,
            `head ${i} · [${query.join(', ')}]`,
            200 + i * 850,
            420,
            650,
            i === 0 ? themeColors.blue : themeColors.pink,
          );
          api.focus.target('indexer-transform-' + i, () => {
            drawOriginalText(
              ctx,
              api,
              modelState.dotsReady ? `dot ${modelState.dots[i]}` : 'matching-coordinate products',
              525 + i * 850,
              610,
              35,
              themeColors.cyan,
              'center',
            );
            if (modelState.reluReady)
              drawOriginalText(
                ctx,
                api,
                `ReLU ${modelState.relu[i]}`,
                525 + i * 850,
                675,
                35,
                themeColors.cyan,
                'center',
              );
            drawOriginalText(
              ctx,
              api,
              `weight ${modelState.weights[i]}`,
              525 + i * 850,
              755,
              34,
              themeColors.yellow,
              'center',
            );
          });
        });
        api.focus.target('indexer-total', () => {
          if (modelState.scoreReady)
            drawOriginalEquation(
              ctx,
              api,
              modelState.weights
                .map((weight, i) => `${weight}\\cdot${modelState.relu[i]}`)
                .join('+') + `=${modelState.score}`,
              960,
              920,
              52,
            );
          else
            drawOriginalText(
              ctx,
              api,
              'Clip each head · apply its weight · add',
              960,
              920,
              34,
              themeColors.muted,
              'center',
            );
        });
      } else {
        drawOriginalText(
          ctx,
          api,
          'Compressed row for cache span [40, 42)',
          960,
          300,
          39,
          themeColors.blue,
          'center',
        );
        api.focus.target('indexer-s-row-map-string', () =>
          teaching.grid({
            x: 330,
            y: 440,
            width: 1260,
            height: 150,
            rows: 1,
            columns: 3,
            labels: [modelState.row.map(String)],
            fontSize: 46,
            fill: themeColors.panel,
            stroke: themeColors.muted,
            textColor: themeColors.ink,
            highlights: modelState.selectionReady
              ? [
                  {
                    row: 0,
                    column: modelState.selectedColumn,
                    fill: themeColors.panel,
                    stroke: currentBeat === 1 ? themeColors.pink : themeColors.green,
                  },
                ]
              : [],
          }),
        );
        ['cache 40', 'cache 41', 'invalid slot'].forEach((label, i) =>
          drawOriginalText(
            ctx,
            api,
            label,
            540 + i * 420,
            700,
            33,
            i < 2 ? themeColors.blue : themeColors.pink,
            'center',
          ),
        );
        drawOriginalText(
          ctx,
          api,
          modelState.selectionReady
            ? currentBeat === 1
              ? 'Unrestricted maximum selects an invalid column'
              : `Valid column 1 → cache token ${modelState.selectedToken}`
            : currentBeat === 1
              ? 'Compare the whole allocation with the valid span'
              : 'Restrict ranking to valid columns',
          960,
          860,
          37,
          modelState.selectionReady
            ? currentBeat === 1
              ? themeColors.pink
              : themeColors.green
            : themeColors.muted,
          'center',
        );
        drawOriginalText(
          ctx,
          api,
          'Large invalid sentinel is a deliberate CPU reference input',
          960,
          990,
          28,
          themeColors.muted,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'indexer',
  draw: drawIndexer,
  cues: [
    'indexer-beat-1-focus-1',
    'dg-indexer-0-0',
    'dg-indexer-0-1',
    'dg-indexer-0-2',
    'dg-indexer-0-3',
    'indexer-beat-2-focus-1',
    'dg-indexer-1-0',
    'dg-indexer-1-1',
    'dg-indexer-1-2',
    'dg-indexer-1-3',
    'indexer-beat-3-focus-1',
    'dg-indexer-2-0',
    'dg-indexer-2-1',
    'dg-indexer-2-2',
    'dg-indexer-2-3',
  ],
};
