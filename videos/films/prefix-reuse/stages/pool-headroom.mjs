import { ownershipAfter, clamp } from '../arithmetic.mjs';
import { drawText, footer, mark } from '../defaults.mjs';
export function drawPoolHeadroom(ctx, scene, state, api) {
  return api.focus.target('pool-headroom-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (id) =>
      state.cues ? api.focus.progress(id, 0) : clamp(((state.beatP ?? 0) - 0.15) / 0.65);
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    {
      const allocation = currentBeat
        ? Math.floor(
            150 * (currentBeat > 1 ? 1 : cueProgress('headroom-allocate')) +
              50 * (currentBeat > 1 ? 1 : cueProgress('headroom-evict')),
          )
        : 0;
      const data = ownershipAfter(
        {
          total: 1000,
          referenced: 450,
          cached: 400,
          free: 150,
        },
        allocation,
      );
      drawText(ctx, api, '1,000 physical blocks · one cell is one block', 150, 270, 33);
      for (let i = 0; i < 1000; i++) {
        const isNew =
          (i >= 850 && i < 850 + Math.min(allocation, 150)) ||
          (i >= 450 && i < 450 + Math.max(0, allocation - 150));
        const color = isNew
          ? themeColors.green
          : i < 450
            ? themeColors.blue
            : i < 850
              ? themeColors.yellow
              : themeColors.muted;
        api.rect(ctx, 150 + (i % 40) * 23, 365 + Math.floor(i / 40) * 20, 19, 15, color);
      }
      [
        ['Referenced', data.referenced, themeColors.blue],
        ['Cached, unreferenced', data.cached, themeColors.yellow],
        ['Uncached free', data.free, themeColors.muted],
        ['Available', data.available, themeColors.green],
      ].forEach(([name, value, color], i) => {
        drawText(ctx, api, name, 1170, 410 + i * 135, 27, color);
        const ready =
          currentBeat > 0 ||
          cueVisible(['headroom-ref', 'headroom-cached', 'headroom-free', 'headroom-total'][i]);
        if (ready) drawText(ctx, api, value, 1690, 410 + i * 135, 36, color, 'right');
      });
      if (currentBeat === 1)
        mark(ctx, api, 'headroom-evict', () => {
          if (cueVisible('headroom-evict'))
            drawText(
              ctx,
              api,
              'Allocate ' + allocation + ' · replaced cached identities ' + data.evicted,
              960,
              945,
              33,
              themeColors.green,
              'center',
            );
        });
      if (currentBeat === 2) {
        mark(ctx, api, 'headroom-protect', () =>
          drawText(
            ctx,
            api,
            'References and pending device work protect storage',
            960,
            930,
            31,
            themeColors.blue,
            'center',
          ),
        );
        mark(ctx, api, 'headroom-touch', () => {
          if (cueVisible('headroom-touch'))
            footer(
              ctx,
              api,
              'Touch: refcount rises / free-queue membership ends. Allocation: old hash is removed.',
            );
        });
      }
      if (currentBeat === 0)
        footer(
          ctx,
          api,
          'Cached contents can also be available; the resident allocation is not 1,550 blocks.',
        );
    }
  });
}
export default {
  id: 'pool-headroom',
  draw: drawPoolHeadroom,
  cues: [
    'headroom-ref',
    'headroom-cached',
    'headroom-free',
    'headroom-total',
    'headroom-allocate',
    'headroom-evict',
    'headroom-touch',
    'headroom-protect',
  ],
};
