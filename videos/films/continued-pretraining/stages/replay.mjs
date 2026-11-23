import { bounded } from '../arithmetic.mjs';
import { controlledSgd } from '../model.mjs';
import {
  drawExtensionCell,
  drawExtensionEquation,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionText,
  formatSigned,
} from '../defaults.mjs';
export function drawReplay(ctx, scene, state, api) {
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
  if (!supported.has('replay')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id)) throw Error('Undeclared cue replay/' + id);
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
    const alpha =
        currentBeat === 0 ? 0 : currentBeat > 1 ? 0.25 : 0.25 * cueProgress('replay-b2-2', 1),
      gd = -0.5 * (1 - alpha),
      gr = 0.5 * alpha,
      g = gd + gr,
      ready = currentBeat > 1 || (currentBeat === 1 && resultComplete('replay-b2-2', 1)),
      restored =
        currentBeat > 1 || (currentBeat === 1 && resultComplete('replay-restore-control', 1)),
      v = controlledSgd(1, g),
      plotX = (value) => 180 + ((value + 0.6) / 1.2) * 900;
    drawExtensionHeading(ctx, api, 'Shared derivative control: θ₀=0 · opposed source gradients');
    drawExtensionF(ctx, api, 'source-gradients', () => {
      drawExtensionLine(ctx, api, 180, 585, 1080, 585, themeColors.muted, 3);
      drawExtensionText(ctx, api, '−0.6', 180, 740, 26, themeColors.muted);
      drawExtensionText(ctx, api, '0', plotX(0), 740, 26, themeColors.muted, 'center');
      drawExtensionText(ctx, api, '+0.6', 1080, 740, 26, themeColors.muted, 'right');
      api.arrow(ctx, plotX(0), 535, plotX(gd), 535, themeColors.cyan, 5);
      if (gr > 1e-9) api.arrow(ctx, plotX(gd), 635, plotX(g), 635, themeColors.yellow, 5);
      drawExtensionLine(ctx, api, plotX(gd), 545, plotX(gd), 620, themeColors.muted, 2);
      drawExtensionText(
        ctx,
        api,
        'domain: ' + formatSigned(ctx, api, gd),
        180,
        450,
        32,
        themeColors.cyan,
      );
      drawExtensionText(
        ctx,
        api,
        'replay: ' + formatSigned(ctx, api, gr),
        180,
        820,
        32,
        themeColors.yellow,
      );
    });
    drawExtensionF(ctx, api, 'replay-share', () =>
      drawExtensionCell(
        ctx,
        api,
        'α =' + (alpha * 100).toFixed(0) + '% replay',
        1240,
        375,
        490,
        85,
        themeColors.yellow,
        33,
      ),
    );
    drawExtensionF(ctx, api, 'mixture-marker', () =>
      api.circle(ctx, plotX(g), 585, 12, themeColors.green),
    );
    drawExtensionF(ctx, api, 'replay-mixture', () =>
      drawExtensionEquation(
        ctx,
        api,
        String.raw`g=(1-\alpha)(-0.5)+\alpha(0.5)=${g.toFixed(3)}`,
        960,
        920,
        42,
        themeColors.green,
      ),
    );
    drawExtensionF(ctx, api, 'source-gradients', () => {
      drawExtensionText(
        ctx,
        api,
        restored ? 'controlled input θ₀=0' : 'reset each comparison to θ₀=0',
        1240,
        540,
        26,
        themeColors.muted,
      );
      drawExtensionText(
        ctx,
        api,
        ready ? 'supplied η=1: next θ=' + v.theta.toFixed(3) : 'next θ: wait for combined gradient',
        1240,
        665,
        28,
        ready ? themeColors.green : themeColors.muted,
      );
      if (ready)
        drawExtensionText(
          ctx,
          api,
          'reef/tree =' + v.probabilities.map((x) => x.toFixed(3)).join(' / '),
          1240,
          780,
          27,
          themeColors.cyan,
        );
    });
    drawExtensionFoot(
      ctx,
      api,
      'Blue and yellow arrows add head to tail; the update moves opposite the resulting derivative.',
    );
  };
  if (
    scene.beats?.some((b) => b.visual_cues?.some((c) => c.targets?.includes('replay-construction')))
  )
    drawExtensionF(ctx, api, 'replay-construction', construct);
  else construct();
  return;
}
export default {
  id: 'replay',
  draw: drawReplay,
  cues: [
    'replay-b1-1',
    'replay-restore-control',
    'replay-b2-1',
    'replay-b2-2',
    'replay-b3-1',
    'replay-b3-2',
  ],
};
