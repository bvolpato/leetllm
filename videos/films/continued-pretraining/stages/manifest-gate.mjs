import { bounded } from '../arithmetic.mjs';
import { manifestAdmission } from '../model.mjs';
import {
  drawExtensionCell,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionTable,
  drawExtensionText,
} from '../defaults.mjs';
export function drawManifestGate(ctx, scene, state, api) {
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
  if (!supported.has('manifest-gate')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue manifest-gate/' + id);
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
    const rows = [
      {
        id: 'API',
        rights: true,
        scrubbed: true,
        evalOnly: false,
        tokens: 800000,
      },
      {
        id: 'on-call',
        rights: true,
        scrubbed: false,
        evalOnly: false,
        tokens: 120000,
      },
      {
        id: 'probes',
        rights: true,
        scrubbed: true,
        evalOnly: true,
        tokens: 10000,
      },
      {
        id: 'vendor',
        rights: false,
        scrubbed: true,
        evalOnly: false,
        tokens: 500000,
      },
    ];
    if (currentBeat === 0) {
      drawExtensionHeading(ctx, api, 'Three checks for each source');
      drawExtensionF(ctx, api, 'cpt-manifest-rows', () => {
        drawExtensionTable(
          ctx,
          api,
          ['source', 'rights', 'scrubbed', 'eval only', 'decision'],
          rows.map((r) => [
            r.id,
            String(r.rights),
            String(r.scrubbed),
            String(r.evalOnly),
            resultComplete('cpt-manifest-admit', 0) ? manifestAdmission(r).reason : '?',
          ]),
          180,
          425,
          1560,
          115,
        );
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-manifest-admit', 0)
            ? 'API survives: 800,000 tokens'
            : 'admission pending',
          180,
          950,
          34,
          themeColors.green,
        );
      });
    } else if (currentBeat === 1) {
      drawExtensionHeading(ctx, api, 'What type did the manifest supply?');
      drawExtensionF(ctx, api, 'cpt-manifest-types', () => {
        drawExtensionTable(
          ctx,
          api,
          ['supplied field', 'actual type', 'decision'],
          [
            [
              'scrubbed = "false"',
              'string',
              resultComplete('cpt-manifest-type', 1) ? 'reject' : '?',
            ],
            ['tokens = True', 'boolean', resultComplete('cpt-manifest-type', 1) ? 'reject' : '?'],
            ['tokens = 800000', 'nonnegative integer', 'valid count'],
          ],
          180,
          440,
          1560,
          150,
        );
      });
    } else {
      drawExtensionHeading(ctx, api, 'Removing a particular source revision');
      drawExtensionF(ctx, api, 'cpt-manifest-owner', () => {
        drawExtensionCell(ctx, api, 'API revision r3', 180, 440, 530, 100, themeColors.blue, 37);
        const q = cueProgress('cpt-manifest-remove', 2);
        drawExtensionCell(
          ctx,
          api,
          'Training manifest',
          1130,
          440,
          600,
          100,
          themeColors.green,
          35,
        );
        drawExtensionLine(
          ctx,
          api,
          760,
          490,
          1080,
          490,
          q === 1 ? themeColors.pink : themeColors.cyan,
          4,
        );
        drawExtensionText(
          ctx,
          api,
          q === 1 ? 'removal request → revoke this revision' : 'approved owner → retained tokens',
          180,
          765,
          35,
          q === 1 ? themeColors.pink : themeColors.cyan,
        );
        drawExtensionText(
          ctx,
          api,
          'provenance · date · language · access policy',
          180,
          920,
          31,
          themeColors.muted,
        );
      });
    }
    drawExtensionFoot(
      ctx,
      api,
      'The function checks recorded flags and types; it does not verify a license or discover secrets.',
    );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('manifest-gate-construction')),
    )
  )
    drawExtensionF(ctx, api, 'manifest-gate-construction', construct);
  else construct();
  return;
}
export default {
  id: 'manifest-gate',
  draw: drawManifestGate,
  cues: [
    'manifest-gate-b1',
    'cpt-manifest-admit',
    'manifest-gate-b2',
    'cpt-manifest-type',
    'manifest-gate-b3',
    'cpt-manifest-remove',
  ],
};
