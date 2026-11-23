import { bounded } from '../arithmetic.mjs';
import {
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionRow,
  drawExtensionTable,
  drawExtensionText,
} from '../defaults.mjs';
export function drawOptimizerRestart(ctx, scene, state, api) {
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
  if (!supported.has('optimizer-restart')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue optimizer-restart/' + id);
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
      drawExtensionHeading(ctx, api, 'Same weights are not the same optimizer state');
      drawExtensionRow(
        ctx,
        api,
        ['θ weights', 'm first moment', 'v second moment', 'scheduler step'],
        180,
        440,
        410,
        370,
        (i) => (i === 0 ? themeColors.blue : themeColors.yellow),
        28,
      );
      drawExtensionText(
        ctx,
        api,
        'released checkpoint may contain only θ',
        180,
        715,
        36,
        themeColors.pink,
      );
      drawExtensionText(
        ctx,
        api,
        'complete resume preserves θ,m,v and schedule history',
        180,
        900,
        34,
        themeColors.green,
      );
    } else {
      const q = cueProgress('cpt-optimizer-moments', 1),
        corrected = currentBeat > 1 || resultComplete('cpt-optimizer-corrected', 1),
        g = -0.5,
        beta1 = 0.9,
        beta2 = 0.999;
      drawExtensionHeading(
        ctx,
        api,
        'First step from zero moments · supplied scalar gradient g = −0.5',
      );
      drawExtensionF(ctx, api, 'cpt-optimizer-moments', () => {
        drawExtensionTable(
          ctx,
          api,
          ['state', 'before', 'after one observed gradient'],
          [
            ['m', '0', q === 1 ? ((1 - beta1) * g).toFixed(3) : '?'],
            ['v', '0', q === 1 ? ((1 - beta2) * g * g).toFixed(6) : '?'],
          ],
          180,
          430,
          1560,
          130,
        );
      });
      drawExtensionF(ctx, api, 'cpt-optimizer-corrected', () => {
        drawExtensionText(
          ctx,
          api,
          corrected ? 'm̂ = −0.5     v̂ = 0.25     √v̂ = 0.5' : 'bias correction pending',
          180,
          785,
          37,
          corrected ? themeColors.cyan : themeColors.muted,
        );
      });
      drawExtensionF(ctx, api, 'cpt-optimizer-step', () => {
        const ready = currentBeat === 2 && resultComplete('cpt-optimizer-update', 2);
        drawExtensionText(
          ctx,
          api,
          ready ? 'Adam first move ≈ +η; SGD first move = +0.5η' : 'ΔAdam = −η g / (|g| + ε)',
          180,
          915,
          35,
          ready ? themeColors.green : themeColors.yellow,
        );
      });
    }
    drawExtensionFoot(
      ctx,
      api,
      'Decoupled weight decay is separate; later AdamW moves depend on the actual saved moment history.',
    );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('optimizer-restart-construction')),
    )
  )
    drawExtensionF(ctx, api, 'optimizer-restart-construction', construct);
  else construct();
  return;
}
export default {
  id: 'optimizer-restart',
  draw: drawOptimizerRestart,
  cues: [
    'optimizer-restart-b1',
    'optimizer-restart-b2',
    'cpt-optimizer-moments',
    'cpt-optimizer-corrected',
    'optimizer-restart-b3',
    'cpt-optimizer-update',
  ],
};
