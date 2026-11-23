import { bounded } from '../arithmetic.mjs';
import { RETAINED_CHECKS } from '../fixtures.mjs';
import {
  drawExtensionCell,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionText,
} from '../defaults.mjs';
export function drawRetainedOutcomes(ctx, scene, state, api) {
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
  if (!supported.has('retained-outcomes')) return;
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue retained-outcomes/' + id);
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
      const q = cueProgress('cpt-retained-fail', 0),
        j = currentBeat > 0 ? 4 : Math.min(4, Math.floor(q * 5)),
        labels = ['Base', 'C1', 'C2', 'C3', 'C4'];
      drawExtensionHeading(ctx, api, 'Same authored case IDs · requirements declared first');
      drawExtensionF(ctx, api, 'cpt-retained-cases', () => {
        drawExtensionText(
          ctx,
          api,
          `${labels[j]}     safety≥9/10     reasoning≥7/10`,
          180,
          385,
          34,
          themeColors.yellow,
        );
        for (const [name, k, x, col] of [
          ['safety', 9, 180, themeColors.blue],
          ['reasoning', 7, 1020, themeColors.cyan],
        ]) {
          const a = RETAINED_CHECKS[name][j];
          drawExtensionText(ctx, api, name, x, 500, 35, col);
          a.forEach((ok, i) =>
            drawExtensionCell(
              ctx,
              api,
              (name === 'safety' ? 'S' : 'R') + (i + 1) + (ok ? '✓' : '×'),
              x + (i % 5) * 140,
              560 + Math.floor(i / 5) * 125,
              120,
              80,
              ok ? col : themeColors.pink,
              27,
            ),
          );
          drawExtensionText(
            ctx,
            api,
            `${a.filter(Boolean).length}/10 · ${a.filter(Boolean).length >= k ? 'PASS' : 'FAIL'}`,
            x,
            895,
            38,
            a.filter(Boolean).length >= k ? themeColors.green : themeColors.pink,
          );
        }
      });
    } else {
      drawExtensionHeading(ctx, api, 'Same 70% →68% change · two distinct units');
      drawExtensionF(ctx, api, 'cpt-retained-units', () => {
        teaching.bars({
          x: 240,
          y: 430,
          width: 620,
          height: 350,
          values: [0.7, 0.68],
          labels: ['base', 'candidate'],
          max: 1,
          colors: [themeColors.blue, themeColors.pink],
          showValues: true,
          format: (v) => (100 * v).toFixed(0) + '%',
          progress: 1,
          fontSize: 30,
        });
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-retained-pp', 2)
            ? 'absolute: −2 percentage points'
            : 'absolute change: ?',
          1030,
          560,
          36,
          themeColors.yellow,
        );
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-retained-relative', 2)
            ? 'relative: −2/70 ≈−2.86%'
            : 'relative change: ?',
          1030,
          740,
          36,
          themeColors.cyan,
        );
      });
    }
    drawExtensionFoot(
      ctx,
      api,
      'General-text PPL and specified safety/task suites are separate measurements, each with a frozen protocol.',
    );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('retained-outcomes-construction')),
    )
  )
    drawExtensionF(ctx, api, 'retained-outcomes-construction', construct);
  else construct();
  return;
}
export default {
  id: 'retained-outcomes',
  draw: drawRetainedOutcomes,
  cues: [
    'retained-outcomes-b1',
    'cpt-retained-fail',
    'retained-outcomes-b2',
    'retained-outcomes-b3',
    'cpt-retained-pp',
    'cpt-retained-relative',
  ],
};
