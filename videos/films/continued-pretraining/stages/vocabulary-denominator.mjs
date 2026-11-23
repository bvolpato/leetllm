import { bounded } from '../arithmetic.mjs';
import { vocabularyMass } from '../model.mjs';
import {
  drawExtensionCell,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionText,
} from '../defaults.mjs';
export function drawVocabularyDenominator(ctx, scene, state, api) {
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
  if (!supported.has('vocabulary-denominator')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0),
    colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue vocabulary-denominator/' + id);
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
    const adding = currentBeat > 0 && resultComplete('cpt-vocab-third', 1),
      v = vocabularyMass(adding);
    drawExtensionHeading(ctx, api, 'Same hidden [0,1] · unchanged old logits');
    drawExtensionF(ctx, api, 'cpt-vocab-mass', () => {
      const rows = [
        [2, 0],
        [-2, 0],
        [0, 0],
      ];
      rows.forEach((r, i) => {
        const active = i < 2 || adding,
          y = 415 + i * 150;
        drawExtensionCell(
          ctx,
          api,
          `W${i}: [${r.join(', ')}]`,
          180,
          y,
          430,
          75,
          i < 2 ? themeColors.blue : active ? themeColors.yellow : themeColors.muted,
        );
        drawExtensionText(
          ctx,
          api,
          i < 2 ? 'dot h = 0' : adding ? 'added row: dot h = 0' : 'predict after adding this row',
          680,
          y + 46,
          31,
          active ? themeColors.ink : themeColors.muted,
        );
        if (active) {
          api.rect(
            ctx,
            1200,
            y + 14,
            450 * v.probabilities[i],
            46,
            i === 0 ? themeColors.green : colors[i],
          );
          drawExtensionText(
            ctx,
            api,
            `p=${v.probabilities[i].toFixed(3)}`,
            1690,
            y + 45,
            31,
            i === 0 ? themeColors.green : colors[i],
            'right',
          );
        }
      });
      drawExtensionText(
        ctx,
        api,
        `Z = ${v.sum} · each exp(logit) = 1`,
        180,
        930,
        34,
        themeColors.yellow,
      );
    });
    drawExtensionF(ctx, api, 'cpt-vocab-loss', () =>
      drawExtensionText(
        ctx,
        api,
        currentBeat > 0 && resultComplete('cpt-vocab-nll', 1)
          ? `old-target NLL: ln2 → ln3 · increase ${v.increase.toFixed(6)}`
          : adding
            ? 'Same two old logits; the normalizer now includes three rows'
            : 'Old-target probability: predict before adding the third row',
        960,
        875,
        31,
        themeColors.pink,
        'center',
      ),
    );
    if (currentBeat === 2)
      drawExtensionFoot(ctx, api, 'Code Llama added four markers for infilling.');
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('vocabulary-denominator-construction')),
    )
  )
    drawExtensionF(ctx, api, 'vocabulary-denominator-construction', construct);
  else construct();
  return;
}
export default {
  id: 'vocabulary-denominator',
  draw: drawVocabularyDenominator,
  cues: [
    'vocabulary-denominator-b1',
    'vocabulary-denominator-b2',
    'cpt-vocab-third',
    'cpt-vocab-nll',
    'vocabulary-denominator-b3',
  ],
};
