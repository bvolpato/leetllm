import { bounded } from '../arithmetic.mjs';
import { CHECKPOINTS } from '../fixtures.mjs';
import {
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionText,
} from '../defaults.mjs';
export function drawSelectionAndStopping(ctx, scene, state, api) {
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
  if (!supported.has('selection-and-stopping')) return;
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue selection-and-stopping/' + id);
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
      drawExtensionHeading(ctx, api, 'Each dot is one checkpoint from the selection table');
      drawExtensionF(ctx, api, 'cpt-selection-frontier', () => {
        const plot = teaching.axes({
          x: 260,
          y: 420,
          width: 1180,
          height: 400,
          xDomain: [0, 18],
          yDomain: [0, 5],
          xTicks: [0, 5, 10, 15],
          yTicks: [0, 1.5, 3, 5],
          xLabel: 'domain PPL improvement →',
          yLabel: 'general PPL increase ↑',
        });
        const gateY = plot.point(0, 1.5).y;
        drawExtensionLine(ctx, api, 260, gateY, 1440, gateY, themeColors.yellow, 3);
        teaching.scatter({
          plot,
          points: CHECKPOINTS.map((r, i) => ({
            x: 42 - r.domain,
            y: r.general - 19.2,
            color: i === 3 ? themeColors.pink : themeColors.blue,
            radius: 10,
          })),
        });
        CHECKPOINTS.forEach((r, i) => {
          const a = plot.point(42 - r.domain, r.general - 19.2);
          drawExtensionText(
            ctx,
            api,
            r.label,
            a.x + 15,
            a.y - 20,
            25,
            i === 3 ? themeColors.pink : themeColors.blue,
          );
        });
        if (currentBeat === 1 && resultComplete('cpt-selection-frontier', 1)) {
          for (const r of CHECKPOINTS.filter((r) => r.label !== 'Base')) {
            const pt = plot.point(42 - r.domain, r.general - 19.2);
            api.circle(ctx, pt.x, pt.y, 18, themeColors.bg, themeColors.cyan, 3);
            api.circle(
              ctx,
              pt.x,
              pt.y,
              8,
              r.label === 'CPT 12k' ? themeColors.pink : themeColors.blue,
            );
          }
          const pt = plot.point(14.1, 0.9);
          drawExtensionLine(ctx, api, 260, pt.y, pt.x, pt.y, themeColors.cyan, 2);
          drawExtensionLine(ctx, api, pt.x, 420, pt.x, pt.y, themeColors.cyan, 2);
          drawExtensionText(
            ctx,
            api,
            'Moving farther right also costs general perplexity.',
            180,
            340,
            28,
            themeColors.cyan,
          );
        }
        drawExtensionText(
          ctx,
          api,
          currentBeat === 1 && resultComplete('cpt-selection-frontier', 1)
            ? 'All four lie on the frontier. The budget excludes 12k.'
            : 'Allowed general perplexity increase ≤ 1.5',
          180,
          940,
          31,
          themeColors.yellow,
        );
      });
    } else {
      drawExtensionHeading(ctx, api, 'One answer changes on the same 500 cases');
      drawExtensionF(ctx, api, 'cpt-selection-noise', () => {
        for (let i = 0; i < 500; i++)
          api.rect(
            ctx,
            220 + (i % 50) * 26,
            405 + Math.floor(i / 50) * 29,
            19,
            20,
            i === 0 && resultComplete('cpt-selection-noise', 2)
              ? themeColors.yellow
              : themeColors.blue,
          );
        drawExtensionText(ctx, api, 'same fixed case cohort', 220, 790, 34, themeColors.blue);
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-selection-noise', 2)
            ? '1 / 500 × 100 = 0.2 percentage points'
            : 'How much did accuracy move?',
          220,
          920,
          38,
          themeColors.yellow,
        );
      });
    }
    drawExtensionFoot(
      ctx,
      api,
      'Patience, worthwhile gain, uncertainty and evaluation cost require an explicit run policy.',
    );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('selection-and-stopping-construction')),
    )
  )
    drawExtensionF(ctx, api, 'selection-and-stopping-construction', construct);
  else construct();
  return;
}
export default {
  id: 'selection-and-stopping',
  draw: drawSelectionAndStopping,
  cues: [
    'selection-and-stopping-b1',
    'selection-and-stopping-b2',
    'cpt-selection-frontier',
    'selection-and-stopping-b3',
    'cpt-selection-noise',
  ],
};
