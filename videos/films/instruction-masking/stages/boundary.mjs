import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { modelSnapshot } from '../model.mjs';
import {
  instructionF,
  instructionFoot,
  instructionLine,
  instructionRow,
  instructionT,
} from '../defaults.mjs';
export function drawBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['boundary'] ?? [], () =>
    instructionF(ctx, api, 'boundary-construction', () => {
      const f = modelSnapshot('boundary', state),
        bad = f.crossBoundaryTargetEnabled;
      instructionT(
        ctx,
        api,
        'Two independent segments in one packed window',
        960,
        310,
        34,
        themeColors.ink,
        'center',
      );
      instructionRow(ctx, api, ['A0', 'A1', 'A2', 'B0', 'B1', 'B2'], 360, 390, {
        step: 200,
        w: 180,
        size: 34,
        color: (i) => (i < 3 ? themeColors.blue : themeColors.green),
      });
      instructionF(ctx, api, 'boundary-object-b-first-target-30', () => {
        instructionLine(
          ctx,
          api,
          850,
          490,
          1050,
          620,
          bad ? themeColors.pink : themeColors.muted,
          5,
        );
        instructionT(
          ctx,
          api,
          'A2 logit → B0 label',
          960,
          690,
          38,
          bad ? themeColors.pink : themeColors.muted,
          'center',
        );
      });
      instructionF(
        ctx,
        api,
        'boundary-object-snapshot-crossboundarytargetenabled-global-shift-p-31',
        () =>
          instructionT(
            ctx,
            api,
            bad ? 'cross-boundary target: B0' : 'cross-boundary target: −100',
            960,
            775,
            38,
            bad ? themeColors.pink : themeColors.green,
            'center',
          ),
      );
      if (beat === 1) {
        instructionF(ctx, api, 'boundary-perturbed-a', () =>
          instructionT(
            ctx,
            api,
            `A values: ${f.values.map(Math.round).join(', ')}`,
            320,
            900,
            34,
            themeColors.yellow,
          ),
        );
        instructionF(ctx, api, 'boundary-object-b-output-unchanged-under-isolation-33', () =>
          instructionT(
            ctx,
            api,
            'B1 isolated: (10 + 20) / 2 = 15',
            1030,
            900,
            34,
            themeColors.green,
          ),
        );
      }
      instructionFoot(
        ctx,
        api,
        'Independent checks: visibility inside attention; target ownership after the global shift',
      );
    }),
  );
  function drawExtended() {
    throw Error('Unknown instruction-masking scene boundary');
  }
}
export default {
  id: 'boundary',
  draw: drawBoundary,
  cues: [
    'boundary-beat-1-focus-1',
    'boundary-beat-1-focus-2',
    'boundary-beat-2-focus-1',
    'boundary-beat-2-focus-2',
  ],
};
