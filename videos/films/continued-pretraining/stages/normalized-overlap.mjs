import { bounded } from '../arithmetic.mjs';
import {
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionRow,
  drawExtensionTable,
  drawExtensionText,
} from '../defaults.mjs';
export function drawNormalizedOverlap(ctx, scene, state, api) {
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
  if (!supported.has('normalized-overlap')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue normalized-overlap/' + id);
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
      drawExtensionHeading(
        ctx,
        api,
        'Fingerprint comparison; original training strings stay intact',
      );
      drawExtensionF(ctx, api, 'cpt-overlap-rows', () => {
        const q = cueProgress('cpt-normalize-screen', 0);
        drawExtensionText(
          ctx,
          api,
          'held out: AUTH_TIMEOUT: token exchange …',
          180,
          410,
          30,
          themeColors.yellow,
        );
        drawExtensionText(
          ctx,
          api,
          'candidate:  auth_timeout: TOKEN exchange …',
          180,
          520,
          30,
          themeColors.blue,
        );
        drawExtensionLine(ctx, api, 600, 560, 600, 650, themeColors.muted);
        drawExtensionText(
          ctx,
          api,
          'lowercase + collapse whitespace',
          180,
          710,
          33,
          themeColors.cyan,
        );
        drawExtensionText(
          ctx,
          api,
          q === 1 ? 'same hash → remove candidate1' : 'hash comparison pending',
          1000,
          710,
          34,
          q === 1 ? themeColors.pink : themeColors.muted,
        );
        drawExtensionText(
          ctx,
          api,
          q === 1 ? '3 candidates → 1 removal → 2 original strings' : '3 candidate documents',
          180,
          900,
          34,
          themeColors.green,
        );
      });
    } else if (currentBeat === 1) {
      drawExtensionHeading(ctx, api, 'A policy can merge different meanings or miss related text');
      drawExtensionF(ctx, api, 'cpt-overlap-limits', () => {
        drawExtensionTable(
          ctx,
          api,
          ['source pair', 'normalized comparison', 'semantic check'],
          [
            ['ID vs id', 'equal after lowercase', 'case-sensitive difference'],
            ['partial copied paragraph', 'hash can differ', 'residual overlap'],
            ['paraphrase / related facts', 'hash can differ', 'provenance + review'],
          ],
          180,
          430,
          1580,
          150,
        );
        if (resultComplete('cpt-normalize-collision', 1))
          drawExtensionText(
            ctx,
            api,
            'An empty exact-match list does not prove clean evaluation',
            180,
            940,
            34,
            themeColors.pink,
          );
      });
    } else {
      drawExtensionHeading(ctx, api, 'Carry the marine document identities into the objective');
      drawExtensionF(ctx, api, 'cpt-overlap-lineage', () => {
        drawExtensionRow(
          ctx,
          api,
          ['D1: tide → reef', 'D6: shelters fish', 'E1: shelters fish'],
          180,
          440,
          550,
          500,
          (i) => (i === 0 ? themeColors.green : i === 1 ? themeColors.pink : themeColors.yellow),
          30,
        );
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-normalize-lineage', 2)
            ? 'D6 stays outside training with its held-out overlap'
            : 'D1 remains the training source',
          180,
          730,
          36,
          themeColors.green,
        );
        drawExtensionRow(
          ctx,
          api,
          ['The', 'tide', 'rises', 'near', 'the', 're', 'ef', '.'],
          180,
          860,
          198,
          180,
          themeColors.cyan,
          28,
        );
      });
    }
    drawExtensionFoot(
      ctx,
      api,
      'Exact comparison policy is a limited screen; group lineage and content screening address different paths.',
    );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('normalized-overlap-construction')),
    )
  )
    drawExtensionF(ctx, api, 'normalized-overlap-construction', construct);
  else construct();
  return;
}
export default {
  id: 'normalized-overlap',
  draw: drawNormalizedOverlap,
  cues: [
    'normalized-overlap-b1',
    'cpt-normalize-screen',
    'normalized-overlap-b2',
    'cpt-normalize-collision',
    'normalized-overlap-b3',
    'cpt-normalize-lineage',
  ],
};
