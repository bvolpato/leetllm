import { A, B } from '../fixtures.mjs';
import { phaseCue } from '../construction.mjs';
import { partialProduct } from '../model.mjs';
import { borderedRect, detailText } from '../defaults.mjs';
import { multiplyMatrices } from 'vizmatic';
export function drawAsyncOwnership(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.92),
    whole = (currentBeat + phaseForBeat(currentBeat)) / 3;
  const full = multiplyMatrices(A, B),
    first = partialProduct(0, 2),
    last = partialProduct(2, 3);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = state.beatP ?? 0,
      ev = (beat, id) => phaseCue(state, beat, id);
    {
      const repaired = currentBeat > 2 || (currentBeat === 2 && ev(2, 'slot-repair') === 1),
        fail = currentBeat >= 1 && ev(1, 'slot-overwrite') === 1 && !repaired,
        clock =
          currentBeat > 0
            ? 4
            : ev(0, 'slot-release') > 0.01
              ? 3 + ev(0, 'slot-release')
              : ev(0, 'slot-read') > 0.01
                ? 1 + 2 * ev(0, 'slot-read')
                : ev(0, 'slot-copy');
      detailText(
        ctx,
        api,
        fail
          ? 'Failure: overwrite while the consumer still reads'
          : 'Two physical slots with explicit ownership',
        960,
        290,
        37,
        themeColors.ink,
        'center',
      );
      const x = (time) => 420 + time * 200;
      detailText(ctx, api, 'step', 180, 410, 26, themeColors.muted);
      [0, 1, 2, 3, 4, 5].forEach((i) =>
        detailText(ctx, api, String(i), x(i), 410, 24, themeColors.muted, 'center'),
      );
      const rows = [
        {
          slot: 0,
          tile: 0,
          load: [0, 1],
          read: [1, 3],
        },
        {
          slot: 1,
          tile: 1,
          load: [1, 2],
          read: [3, 4],
        },
      ];
      rows.forEach((r, i) => {
        const y = 490 + i * 180;
        detailText(ctx, api, 'Slot ' + r.slot, 230, y + 52, 30, themeColors.cyan);
        const load = Math.max(0, Math.min(r.load[1], clock) - r.load[0]),
          read = Math.max(0, Math.min(r.read[1], clock) - r.read[0]);
        if (load > 0) borderedRect(ctx, api, x(r.load[0]), y, load * 200, 90, themeColors.yellow);
        if (load > 0.85)
          detailText(
            ctx,
            api,
            'copy t' + r.tile,
            x(r.load[0]) + 100,
            y + 55,
            28,
            themeColors.yellow,
            'center',
          );
        if (read > 0) borderedRect(ctx, api, x(r.read[0]), y, read * 200, 90, themeColors.cyan);
        if (read > 0.5)
          detailText(
            ctx,
            api,
            'consumer reads t' + r.tile,
            (x(r.read[0]) + x(r.read[1])) / 2,
            y - 20,
            25,
            themeColors.cyan,
            'center',
          );
      });
      const overwrite = fail ? 2 : 3;
      if (fail || repaired) {
        borderedRect(
          ctx,
          api,
          x(overwrite),
          490,
          200,
          90,
          fail ? themeColors.pink : themeColors.green,
          fail ? '#db547755' : themeColors.panel,
        );
        detailText(
          ctx,
          api,
          'copy t2',
          x(overwrite) + 100,
          545,
          27,
          fail ? themeColors.pink : themeColors.green,
          'center',
        );
      }
      api.focus.target('gemm-slot-ownership', () =>
        detailText(
          ctx,
          api,
          fail
            ? 'Slot 0 loses tile 0 before its final read'
            : clock >= 3
              ? 'Slot 0 is reusable after its last read at step 3'
              : clock >= 1 ? 'Slot 0 is ready for its reader' : clock > 0 ? 'Tile 0 is still arriving' : 'Both slots start empty',
          960,
          870,
          33,
          fail ? themeColors.pink : themeColors.green,
          'center',
        ),
      );
      if (currentBeat === 3)
        detailText(
          ctx,
          api,
          'Ampere · direct copy to shared memory        Hopper · TMA copy and four-warp WGMMA',
          960,
          985,
          27,
          themeColors.muted,
          'center',
        );
      else
        detailText(
          ctx,
          api,
          'Copy completion → readable; consumer completion → reusable',
          960,
          985,
          29,
          themeColors.yellow,
          'center',
        );
    }
  }
}
export default {
  id: 'async-ownership',
  draw: drawAsyncOwnership,
  cues: [
    'slots',
    'slot-copy',
    'slot-read',
    'slot-release',
    'slot-repair',
    'slot-overwrite',
    'architecture',
  ],
};
