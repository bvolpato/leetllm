import { bounded } from '../arithmetic.mjs';
import { groupedSplit } from '../model.mjs';
import {
  drawExtensionCell,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionText,
} from '../defaults.mjs';
export function drawGroupedHoldout(ctx, scene, state, api) {
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
  if (!supported.has('grouped-holdout')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue grouped-holdout/' + id);
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
    drawExtensionHeading(ctx, api, 'One supplied group chooses one immutable split');
    const gs = [
      ['auth-docs-v3', 2],
      ['webhook-runbooks', 2],
      ['sdk-notes', 1],
      ['payments-api', 1],
    ];
    drawExtensionF(ctx, api, 'cpt-groups', () => {
      gs.forEach(([g, n], i) => {
        const s = groupedSplit(g),
          y = 395 + i * 130,
          q = cueProgress(
            currentBeat === 0 ? 'cpt-groups-buckets' : 'cpt-groups-route',
            currentBeat === 0 ? 0 : 1,
          );
        drawExtensionCell(ctx, api, g, 180, y, 470, 80, themeColors.blue, 30);
        drawExtensionText(
          ctx,
          api,
          `SHA256 mod4 = ${s.bucket}`,
          780,
          y + 50,
          31,
          themeColors.yellow,
        );
        drawExtensionLine(ctx, api, 1140, y + 40, 1240, y + 40, themeColors.muted);
        drawExtensionText(
          ctx,
          api,
          q === 1 ? s.split + ' · ' + n + ' docs' : 'split: ?',
          1280,
          y + 50,
          31,
          q === 1
            ? s.split === 'train'
              ? themeColors.green
              : themeColors.pink
            : themeColors.muted,
        );
      });
    });
    drawExtensionF(ctx, api, 'cpt-group-leak', () => {
      if (currentBeat > 0) {
        const bad = resultComplete('cpt-groups-gap', 1);
        drawExtensionText(
          ctx,
          api,
          bad
            ? 'related text + different group names → set check can still pass'
            : 'supplied group identity is an input, not discovered',
          180,
          955,
          30,
          bad ? themeColors.pink : themeColors.muted,
        );
      }
    });
    drawExtensionFoot(
      ctx,
      api,
      'Train groups2/4 is not a promise of25% validation tokens in this small fixture.',
    );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('grouped-holdout-construction')),
    )
  )
    drawExtensionF(ctx, api, 'grouped-holdout-construction', construct);
  else construct();
  return;
}
export default {
  id: 'grouped-holdout',
  draw: drawGroupedHoldout,
  cues: [
    'grouped-holdout-b1',
    'cpt-groups-buckets',
    'grouped-holdout-b2',
    'cpt-groups-route',
    'cpt-groups-gap',
    'grouped-holdout-b3',
  ],
};
