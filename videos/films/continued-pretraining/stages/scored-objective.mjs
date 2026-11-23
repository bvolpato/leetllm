import { bounded } from '../arithmetic.mjs';
import {
  drawExtensionCell,
  drawExtensionEquation,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionText,
} from '../defaults.mjs';
export function drawScoredObjective(ctx, scene, state, api) {
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
  if (!supported.has('scored-objective')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue scored-objective/' + id);
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
    const response = currentBeat > 0 && resultComplete('cpt-objective-four', 1),
      n = 7,
      selected = Array.from(
        {
          length: n,
        },
        (_, i) => i > 0 && (!response || i >= 3),
      );
    drawExtensionHeading(
      ctx,
      api,
      response
        ? 'Same seven positions · four response targets'
        : 'Seven-position authored sequence · one causal shift',
    );
    drawExtensionF(ctx, api, 'cpt-objective-pairs', () => {
      for (let i = 0; i < n; i++) {
        const x = 170 + i * 235;
        drawExtensionCell(
          ctx,
          api,
          `x${i}`,
          x,
          410,
          210,
          80,
          i < 3 ? themeColors.blue : themeColors.green,
          37,
        );
        drawExtensionText(ctx, api, String(i), x + 105, 365, 25, themeColors.muted, 'center');
        if (i < n - 1) {
          const active = selected[i + 1];
          drawExtensionLine(
            ctx,
            api,
            x + 105,
            520,
            x + 340,
            650,
            active ? themeColors.yellow : themeColors.muted,
            active ? 4 : 2,
          );
          drawExtensionCell(
            ctx,
            api,
            active ? `target x${i + 1}` : 'ignored',
            x + 250,
            685,
            195,
            74,
            active ? themeColors.yellow : themeColors.muted,
            27,
          );
        }
      }
      drawExtensionText(
        ctx,
        api,
        `direct targets: ${selected.filter(Boolean).length}`,
        180,
        850,
        38,
        themeColors.green,
      );
      drawExtensionEquation(
        ctx,
        api,
        String.raw`\mathrm{PPL}=\exp\!\left({\sum_{i\in\mathcal T}-\ln p_i\over|\mathcal T|}\right)`,
        1190,
        860,
        43,
        themeColors.cyan,
      );
    });
    drawExtensionF(ctx, api, 'cpt-objective-source', () =>
      drawExtensionText(
        ctx,
        api,
        currentBeat === 2
          ? 'Runbook continuation → CPT; selected assistant response → SFT'
          : 'The same earlier context remains available to every later prediction',
        180,
        945,
        30,
        themeColors.blue,
      ),
    );
    drawExtensionFoot(
      ctx,
      api,
      'Position0 has no preceding predictor in this block; parameter freezing is a separate choice.',
    );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('scored-objective-construction')),
    )
  )
    drawExtensionF(ctx, api, 'scored-objective-construction', construct);
  else construct();
  return;
}
export default {
  id: 'scored-objective',
  draw: drawScoredObjective,
  cues: [
    'scored-objective-b1',
    'cpt-objective-shift',
    'scored-objective-b2',
    'cpt-objective-four',
    'scored-objective-b3',
    'cpt-objective-source',
  ],
};
