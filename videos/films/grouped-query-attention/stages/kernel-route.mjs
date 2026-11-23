import { chapterModel } from '../construction.mjs';
import { chapterEquation, chapterText, grid, note, operation } from '../defaults.mjs';
export function drawKernelRoute(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('kernel-route', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Eight independent query scores at one stored position',
        960,
        275,
        37,
        themeColors.cyan,
      );
      const scores = [1, 2, 3, 4, 50, 60, 70, 80],
        n = Math.ceil(8 * progress);
      chapterText(
        ctx,
        api,
        'Queries [1,0]…[8,0] · group keys [1,0] and [10,0]',
        960,
        345,
        31,
        themeColors.muted,
      );
      for (let i = 0; i < 8; i++) {
        const x = 240 + i * 185,
          height = 4 * scores[i];
        api.rect(
          ctx,
          x,
          800 - height,
          125,
          height,
          i < n ? (i < 4 ? themeColors.blue : themeColors.pink) : themeColors.panel,
          themeColors.muted,
          1,
        );
        chapterText(ctx, api, 'Q' + i, x + 62, 865, 29, themeColors.ink);
        chapterText(ctx, api, `[${i + 1},0]`, x + 62, 910, 26, themeColors.muted);
        if (i < n) chapterText(ctx, api, scores[i], x + 62, 750 - height, 31, themeColors.yellow);
      }
      operation(ctx, api, 'kernel-route', () =>
        chapterEquation(
          ctx,
          api,
          String.raw`\mathrm{KV}(i)=\lfloor i/4\rfloor:\quad[0,0,0,0,1,1,1,1]`,
          960,
          970,
          35,
          themeColors.yellow,
        ),
      );
    } else if (currentBeat === 1) {
      chapterText(
        ctx,
        api,
        'Reference materialization is separate from retained storage',
        960,
        275,
        35,
        themeColors.cyan,
      );
      grid(
        ctx,
        api,
        280,
        390,
        1,
        8,
        55,
        () => themeColors.green,
        (r, c) => c,
      );
      chapterText(ctx, api, '8 retained heads', 500, 520, 33, themeColors.green);
      const n = Math.ceil(32 * progress);
      grid(ctx, api, 250, 640, 1, 32, 44, (r, c) =>
        c < n ? (Math.floor(c / 4) % 2 ? themeColors.pink : themeColors.blue) : themeColors.panel,
      );
      operation(ctx, api, 'kernel-route', () =>
        chapterText(
          ctx,
          api,
          '32 temporary head copies · same logical histories repeated',
          960,
          820,
          37,
          themeColors.yellow,
        ),
      );
      note(
        ctx,
        api,
        'Native grouped kernels can avoid these materialized tensors; profile the selected dispatch',
      );
    } else {
      chapterText(
        ctx,
        api,
        'Stored heads shrink; query work remains',
        960,
        275,
        39,
        themeColors.cyan,
      );
      grid(ctx, api, 250, 390, 4, 8, 46, () => themeColors.blue);
      chapterText(ctx, api, '32 query results', 430, 690, 34, themeColors.blue);
      grid(ctx, api, 1080, 390, 1, 8, 55, () => themeColors.green);
      chapterText(ctx, api, '8 K/V histories', 1300, 550, 34, themeColors.green);
      operation(ctx, api, 'kernel-route', () =>
        chapterEquation(
          ctx,
          api,
          String.raw`QK^\top+AV\propto H_q\qquad\mathrm{cache}\propto H_{kv}`,
          1130,
          760,
          42,
          themeColors.yellow,
        ),
      );
      note(
        ctx,
        api,
        'Projection, backward, communication, weight traffic and queues retain separate costs',
      );
    }
  }
}
export default {
  id: 'kernel-route',
  draw: drawKernelRoute,
  cues: ['kernel-route-0', 'kernel-route-1', 'kernel-route-2'],
};
