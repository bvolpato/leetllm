import { bounded } from '../arithmetic.mjs';
import {
  drawExtensionCell,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionRow,
  drawExtensionText,
} from '../defaults.mjs';
export function drawObjectiveAndParameters(ctx, scene, state, api) {
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
  if (!supported.has('objective-and-parameters')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue objective-and-parameters/' + id);
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
    if (currentBeat < 2) {
      drawExtensionHeading(ctx, api, 'Same trainable coordinates · different direct target masks');
      drawExtensionF(ctx, api, 'cpt-parameter-path', () => {
        const response = currentBeat === 0 && resultComplete('objective-and-parameters-b1', 0);
        drawExtensionCell(
          ctx,
          api,
          'input representation h',
          690,
          355,
          540,
          70,
          themeColors.cyan,
          31,
        );
        drawExtensionLine(ctx, api, 960, 430, 465, 500, themeColors.cyan, 3);
        drawExtensionLine(ctx, api, 960, 430, 1410, 500, themeColors.cyan, 3);
        drawExtensionCell(ctx, api, 'Frozen base W0', 180, 500, 570, 90, themeColors.blue, 35);
        drawExtensionCell(ctx, api, 'Trainable B·A', 1100, 500, 620, 90, themeColors.yellow, 35);
        drawExtensionLine(ctx, api, 465, 605, 960, 690, themeColors.blue, 3);
        drawExtensionLine(ctx, api, 1410, 605, 960, 690, themeColors.yellow, 3);
        drawExtensionText(
          ctx,
          api,
          'sum both branch outputs',
          960,
          740,
          31,
          themeColors.cyan,
          'center',
        );
        if (currentBeat === 0) {
          for (let i = 0; i < 7; i++)
            drawExtensionCell(
              ctx,
              api,
              'x' + i,
              210 + i * 225,
              825,
              195,
              72,
              i > 0 && (!response || i >= 3) ? themeColors.green : themeColors.muted,
              30,
            );
          drawExtensionText(
            ctx,
            api,
            response
              ? 'response targets:4 · same adapter coordinates'
              : 'full causal targets:6 · same adapter coordinates',
            180,
            965,
            30,
            themeColors.green,
          );
          if (cueProgress('cpt-parameters-frozen', 0) > 0)
            drawExtensionText(
              ctx,
              api,
              'QLoRA stores the frozen base quantized',
              180,
              785,
              27,
              themeColors.blue,
            );
        } else {
          drawExtensionRow(
            ctx,
            api,
            ['Code Llama Instruct', 'Llama 3 code expert'],
            180,
            835,
            810,
            740,
            themeColors.green,
            29,
          );
          drawExtensionText(ctx, api, 'Code pretraining → SFT', 180, 965, 30, themeColors.muted);
          drawExtensionText(
            ctx,
            api,
            'Code pretraining → SFT → DPO',
            990,
            965,
            30,
            themeColors.muted,
          );
        }
      });
    } else {
      drawExtensionHeading(ctx, api, 'Exact continuation includes advancing state');
      drawExtensionF(ctx, api, 'cpt-resume-state', () => {
        const fields = [
          'weights + tokenizer',
          'config + manifest',
          'optimizer + schedule',
          'RNG states',
          'Domain: 15   Replay: 5',
        ];
        fields.forEach((v, i) => {
          const x = 210 + (i % 3) * 550,
            y = 420 + Math.floor(i / 3) * 220;
          drawExtensionCell(
            ctx,
            api,
            v,
            x,
            y,
            490,
            110,
            i < 3
              ? themeColors.blue
              : resultComplete('cpt-parameters-resume', 2)
                ? themeColors.yellow
                : themeColors.muted,
            30,
          );
        });
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-parameters-resume', 2)
            ? 'Next window begins after both consumed prefixes'
            : 'Same weights alone can lead to a different next window',
          180,
          930,
          33,
          themeColors.green,
        );
      });
    }
    drawExtensionFoot(
      ctx,
      api,
      'W0 and B·A process the same input in parallel; masking and trainable-parameter choices are independent.',
    );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('objective-and-parameters-construction')),
    )
  )
    drawExtensionF(ctx, api, 'objective-and-parameters-construction', construct);
  else construct();
  return;
}
export default {
  id: 'objective-and-parameters',
  draw: drawObjectiveAndParameters,
  cues: [
    'objective-and-parameters-b1',
    'cpt-parameters-frozen',
    'objective-and-parameters-b2',
    'objective-and-parameters-b3',
    'cpt-parameters-resume',
  ],
};
