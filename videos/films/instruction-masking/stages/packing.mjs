import { CONSTRUCTION_TARGETS, colors } from '../fixtures.mjs';
import { packingFrame } from '../model.mjs';
import { instructionCell, instructionF, instructionFoot, instructionT } from '../defaults.mjs';
export function drawPacking(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['packing'] ?? [], () =>
    instructionF(ctx, api, 'packing-construction', () => {
      const f = packingFrame(state);
      instructionT(ctx, api, 'Four separate 16-slot windows', 180, 325, 32, themeColors.blue);
      instructionF(ctx, api, 'packing-object-first-fit-packed-windows-15', () =>
        instructionT(ctx, api, 'Two 16-slot destinations', 1100, 325, 32, themeColors.green),
      );
      instructionF(ctx, api, 'packed-position-grid', () => {
        for (let r = 0; r < 4; r++)
          for (let col = 0; col < 16; col++)
            instructionCell(ctx, api, '', 180 + col * 42, 410 + r * 112, 38, 58, themeColors.muted);
        for (let r = 0; r < 2; r++)
          for (let col = 0; col < 16; col++)
            instructionCell(
              ctx,
              api,
              '',
              1100 + col * 42,
              475 + r * 170,
              38,
              58,
              themeColors.muted,
            );
        for (const a of f.actors)
          instructionCell(ctx, api, a.id, a.x, a.y, 38, 58, themeColors[colors[a.source]], 22);
      });
      instructionT(ctx, api, '27 tokens / 64 allocated = 42.1875%', 180, 935, 29, themeColors.blue);
      instructionF(ctx, api, 'packing-object-destination-rows-occupied-slots-18', () =>
        instructionT(
          ctx,
          api,
          f.packed
            ? '15 + 12 = 27 tokens / 32 = 84.375%'
            : `${f.placed} owners have reached their destination`,
          1100,
          935,
          29,
          f.packed ? themeColors.green : themeColors.muted,
        ),
      );
      instructionFoot(
        ctx,
        api,
        'One colored representation per token · empty source outlines preserve the old allocation',
      );
    }),
  );
  function drawExtended() {
    throw Error('Unknown instruction-masking scene packing');
  }
}
export default {
  id: 'packing',
  draw: drawPacking,
  cues: ['packing-placement', 'packing-beat-1-focus-1', 'packing-beat-2-focus-1'],
};
