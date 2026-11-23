import { bounded } from '../arithmetic.mjs';
import { packingOwners } from '../model.mjs';
import {
  drawExtensionCell,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionRect,
  drawExtensionText,
} from '../defaults.mjs';
export function drawPackedRemainder(ctx, scene, state, api) {
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
  if (!supported.has('packed-remainder')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0),
    colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue packed-remainder/' + id);
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
      drawExtensionHeading(ctx, api, 'Four tokenized documents');
      const q =
          currentBeat === 0
            ? 0
            : (6 * cueProgress('packed-remainder-b2', 1) +
                6 * cueProgress('cpt-pack-place', 1) +
                2 * cueProgress('cpt-pack-tail', 1)) /
              14,
        actors = packingOwners(q),
        full = actors.slice(0, 12).filter((a) => a.placed).length,
        tail = actors.slice(12).filter((a) => a.placed).length,
        inserted = actors.filter(
          (a) => a.token === 0 && cueProgress('cpt-pack-concatenate', 0) > a.source / 4,
        ).length;
      drawExtensionF(ctx, api, 'cpt-pack-stream', () => {
        ['D1', 'D2', 'D3', 'D4'].forEach((name, i) =>
          drawExtensionText(ctx, api, name, 145, 455 + i * 125, 27, colors[i]),
        );
        drawExtensionText(
          ctx,
          api,
          full === 12 ? 'two complete blocks of 6' : 'Full-block output slots · size 6',
          990,
          415,
          30,
          themeColors.green,
        );
        for (let r = 0; r < 2; r++) {
          drawExtensionLine(ctx, api, 955, 420 + r * 180, 955, 515 + r * 180, themeColors.muted);
          drawExtensionLine(ctx, api, 1720, 420 + r * 180, 1720, 515 + r * 180, themeColors.muted);
        }
        drawExtensionText(ctx, api, 'tail / next call', 990, 900, 29, themeColors.yellow);
        for (const a of actors)
          if (
            currentBeat > 0 ||
            a.token !== 0 ||
            cueProgress('cpt-pack-concatenate', 0) > a.source / 4
          )
            drawExtensionCell(ctx, api, a.token, a.x, a.y, 92, 64, colors[a.source], 29);
      });
      drawExtensionF(ctx, api, 'cpt-pack-tail', () =>
        drawExtensionText(
          ctx,
          api,
          currentBeat === 1 && resultComplete('cpt-pack-tail', 1)
            ? 'Return [41, 0] for the next packing call.'
            : currentBeat === 0
              ? '10 source tokens + ' + inserted + ' inserted endings'
              : full === 12 && tail === 2
                ? '14 tokens = 12 packed + 2 returned'
                : '14 tokens total · packed ' + full + '/12 · returned ' + tail + '/2',
          180,
          950,
          26,
          themeColors.yellow,
        ),
      );
    } else {
      drawExtensionHeading(ctx, api, 'Which earlier positions can this token read?');
      drawExtensionF(ctx, api, 'cpt-pack-mask', () => {
        const isolated = resultComplete('cpt-pack-mask', 2);
        for (let q = 0; q < 6; q++)
          for (let k = 0; k < 6; k++) {
            const same = q < 4 === k < 4,
              active = k <= q && (!isolated || same);
            drawExtensionRect(
              ctx,
              api,
              300 + k * 64,
              400 + q * 64,
              55,
              55,
              active ? themeColors.blue : themeColors.panel,
              themeColors.muted,
            );
          }
        drawExtensionText(
          ctx,
          api,
          isolated
            ? 'isolated: restrict to the same document'
            : 'ordinary causal context crosses ID0',
          850,
          500,
          31,
          isolated ? themeColors.green : themeColors.yellow,
        );
        drawExtensionText(
          ctx,
          api,
          'six positions → five shifted target pairs',
          850,
          680,
          31,
          themeColors.cyan,
        );
        drawExtensionText(
          ctx,
          api,
          isolated
            ? 'mask the cross-document target pair too'
            : 'ID0 is an input; it does not mask this pair',
          850,
          820,
          29,
          themeColors.pink,
        );
      });
    }
    drawExtensionFoot(
      ctx,
      api,
      'Every source token and document ending stays visible exactly once during packing.',
    );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('packed-remainder-construction')),
    )
  )
    drawExtensionF(ctx, api, 'packed-remainder-construction', construct);
  else construct();
  return;
}
export default {
  id: 'packed-remainder',
  draw: drawPackedRemainder,
  cues: [
    'packed-remainder-b1',
    'cpt-pack-concatenate',
    'packed-remainder-b2',
    'cpt-pack-place',
    'cpt-pack-tail',
    'packed-remainder-b3',
    'cpt-pack-mask',
  ],
};
