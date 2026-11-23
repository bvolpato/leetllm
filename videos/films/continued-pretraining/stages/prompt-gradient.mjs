import { bounded, interpolate } from '../arithmetic.mjs';
import { dependencyModel } from '../model.mjs';
import {
  drawExtensionCell,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionRow,
  drawExtensionText,
} from '../defaults.mjs';
export function drawPromptGradient(ctx, scene, state, api) {
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
  if (!supported.has('prompt-gradient')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue prompt-gradient/' + id);
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
    const v = dependencyModel(),
      back = currentBeat > 0 ? cueProgress('cpt-dependency-backward', 1) : 0;
    drawExtensionHeading(ctx, api, 'Two prompt lookups feed one scored response');
    drawExtensionF(ctx, api, 'cpt-dependency-rows', () => {
      v.embeddings.forEach((r, i) => {
        const y = 405 + i * 160;
        drawExtensionCell(
          ctx,
          api,
          `E${i}: [${r.join(', ')}]`,
          180,
          y,
          400,
          78,
          i < 2 ? themeColors.blue : themeColors.muted,
        );
        if (i < 2) {
          drawExtensionLine(ctx, api, 600, y + 39, 850, 520, themeColors.blue);
          if (back > 0) {
            const x = interpolate(850, 600, back);
            api.circle(ctx, x, interpolate(520, y + 39, back), 9, themeColors.yellow);
          }
        }
        drawExtensionText(
          ctx,
          api,
          currentBeat > 0 && resultComplete('cpt-dependency-backward', 1) && i < 2
            ? `∂L/∂E${i} = [${v.inputGradients[i].map((x) => x.toFixed(3)).join(', ')}]`
            : i < 2
              ? 'gradient: ?'
              : 'unused lookup row',
          180,
          y + 125,
          28,
          i < 2 && back === 1 ? themeColors.green : themeColors.muted,
        );
      });
    });
    drawExtensionCell(ctx, api, 'h = E0 + E1 = [1, 1]', 860, 480, 780, 90, themeColors.cyan, 35);
    drawExtensionText(
      ctx,
      api,
      'fixed head rows: [1,0] · [0,1] · [−1,1]',
      860,
      635,
      28,
      themeColors.muted,
    );
    drawExtensionRow(
      ctx,
      api,
      ['z0=1', 'z1=1', 'z2=0'],
      860,
      700,
      270,
      240,
      (i) => (i === 2 ? themeColors.yellow : themeColors.blue),
      29,
    );
    drawExtensionF(ctx, api, 'cpt-dependency-loss', () =>
      drawExtensionText(
        ctx,
        api,
        currentBeat > 0 && resultComplete('cpt-dependency-loss', 1)
          ? `−ln p(class 2) = ${v.loss.toFixed(6)}`
          : 'Only class 2 has a direct target loss',
        860,
        825,
        33,
        themeColors.yellow,
      ),
    );
    drawExtensionF(ctx, api, 'cpt-dependency-unused', () =>
      drawExtensionText(
        ctx,
        api,
        currentBeat > 0 && resultComplete('cpt-dependency-unused', 1)
          ? 'E2 gradient = [0, 0]'
          : 'Only the response target is scored',
        860,
        925,
        31,
        currentBeat > 0 ? themeColors.muted : themeColors.blue,
      ),
    );
    drawExtensionFoot(
      ctx,
      api,
      currentBeat === 0
        ? 'Predict which used input rows receive the response derivative.'
        : 'The response depends on both inputs to the sum.',
    );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('prompt-gradient-construction')),
    )
  )
    drawExtensionF(ctx, api, 'prompt-gradient-construction', construct);
  else construct();
  return;
}
export default {
  id: 'prompt-gradient',
  draw: drawPromptGradient,
  cues: [
    'prompt-gradient-b1',
    'prompt-gradient-b2',
    'cpt-dependency-backward',
    'cpt-dependency-loss',
    'cpt-dependency-unused',
    'prompt-gradient-b3',
  ],
};
