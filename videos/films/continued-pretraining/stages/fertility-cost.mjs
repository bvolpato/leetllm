import { bounded } from '../arithmetic.mjs';
import {
  drawExtensionCell,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionRow,
  drawExtensionText,
} from '../defaults.mjs';
export function drawFertilityCost(ctx, scene, state, api) {
  const supported = new Set([
    'schedule',
    'replay',
    'intro',
    'incident-controls',
    'prompt-gradient',
    'scored-objective',
    'fertility-cost',
    'vocabulary-shapes',
    'vocabulary-denominator',
    'grouped-holdout',
    'manifest-gate',
    'normalized-overlap',
    'packed-remainder',
    'optimizer-restart',
    'exact-schedule',
    'dapt-tapt',
    'fixed-budget',
    'target-weighting',
    'byte-normalization',
    'corpus-reduction',
    'retained-outcomes',
    'select',
    'selection-and-stopping',
    'objective-and-parameters',
    'earned-adaptation',
  ]);
  if (!supported.has('fertility-cost')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue fertility-cost/' + id);
      return cue
        ? cue.phase === 'before'
          ? 0
          : cue.phase === 'after'
            ? 1
            : bounded(cue.progress)
        : state.beat < beat
          ? 0
          : state.beat > beat
            ? 1
            : bounded((progress - 0.12) / 0.76);
    },
    resultComplete = (id, beat = currentBeat) => cueProgress(id, beat) >= 1 - 1e-8;
  const construct = () => {
    if (currentBeat === 0) {
      drawExtensionHeading(ctx, api, 'Explicit longest-match toy vocabulary');
      drawExtensionCell(ctx, api, 'timeout', 180, 410, 350, 80, themeColors.blue, 36);
      drawExtensionText(ctx, api, 'one vocabulary entry', 180, 560, 31, themeColors.blue);
      drawExtensionText(ctx, api, 'AUTH_TIMEOUT', 800, 405, 40, themeColors.yellow);
      drawExtensionF(ctx, api, 'cpt-fertility-pieces', () => {
        const pieces = ['AUTH', '_', 'T', 'I', 'M', 'E', 'O', 'U', 'T'],
          n = Math.floor(cueProgress('cpt-fertility-pieces', 0) * 9 + 1e-9);
        pieces.forEach((s, i) => {
          drawExtensionCell(
            ctx,
            api,
            i < n ? s : '·',
            760 + (i % 5) * 185,
            490 + Math.floor(i / 5) * 150,
            160,
            85,
            i < n ? themeColors.cyan : themeColors.muted,
            33,
          );
        });
        drawExtensionText(ctx, api, `${n} / 9 emitted pieces`, 800, 870, 33, themeColors.cyan);
      });
    } else if (currentBeat === 1) {
      drawExtensionHeading(ctx, api, 'What if the whole sequence gets three times longer?');
      drawExtensionF(ctx, api, 'cpt-fertility-work', () => {
        for (let i = 0; i < 9; i++)
          for (let j = 0; j < 9; j++)
            api.rect(
              ctx,
              240 + j * 45,
              390 + i * 45,
              38,
              38,
              i < 3 && j < 3
                ? themeColors.blue
                : cueProgress('cpt-fertility-pairs', 1) > 0
                  ? themeColors.cyan
                  : themeColors.panel,
            );
        drawExtensionText(ctx, api, 'length L → 3L', 1030, 475, 39, themeColors.blue);
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-fertility-pairs', 1)
            ? 'pair component L² → 9L²'
            : 'pair component: predict the factor',
          1030,
          640,
          35,
          themeColors.cyan,
        );
        drawExtensionText(
          ctx,
          api,
          'total work includes other operators',
          1030,
          805,
          28,
          themeColors.muted,
        );
      });
    } else {
      drawExtensionHeading(ctx, api, 'The checkpoint tokenizer still emits nine pieces');
      drawExtensionF(ctx, api, 'cpt-fertility-pieces', () =>
        drawExtensionRow(
          ctx,
          api,
          ['AUTH', '_', 'T', 'I', 'M', 'E', 'O', 'U', 'T'],
          150,
          460,
          185,
          165,
          themeColors.cyan,
          32,
        ),
      );
      drawExtensionText(
        ctx,
        api,
        'The same nine IDs still point to the same rows.',
        180,
        730,
        39,
        themeColors.yellow,
      );
      drawExtensionText(ctx, api, 'held-out text fit', 180, 885, 34, themeColors.blue);
      drawExtensionText(ctx, api, 'incident tasks', 1130, 885, 34, themeColors.green);
    }
    drawExtensionFoot(ctx, api, 'Example tokenizer: longest matching piece first');
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('fertility-cost-construction')),
    )
  )
    drawExtensionF(ctx, api, 'fertility-cost-construction', construct);
  else construct();
  return;
}
export default {
  id: 'fertility-cost',
  draw: drawFertilityCost,
  cues: [
    'fertility-cost-b1',
    'cpt-fertility-pieces',
    'fertility-cost-b2',
    'cpt-fertility-pairs',
    'fertility-cost-b3',
  ],
};
