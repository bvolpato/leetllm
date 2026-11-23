import {
  chapterFooter,
  chapterPanel,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawSharedFleet(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    progress = state.beatP ?? 0;
  {
    chapterSubtitle(
      ctx,
      api,
      themeColors,
      'Toy head inventory · separate bases, masks, or survivor union',
    );
    focusScope(ctx, api, 'lp-fleet', () => {
      const cases = [
        {
          label: 'separate bases',
          x: 180,
          ids: ['A:H0', 'A:H2', 'A:H3', 'B:H0', 'B:H1', 'B:H3'],
          color: themeColors.cyan,
        },
        {
          label: 'full base + masks',
          x: 780,
          ids: ['H0', 'H1', 'H2', 'H3'],
          color: themeColors.blue,
        },
        {
          label: 'union A ∪ B',
          x: 1380,
          ids: ['H0', 'H1', 'H2', 'H3'],
          color: themeColors.purple,
        },
      ];
      cases.forEach(({ label, x, ids, color }) => {
        chapterText(ctx, api, themeColors, label, x + 180, 390, 30, color, 'center');
        ids.forEach((v, i) =>
          chapterPanel(
            ctx,
            api,
            themeColors,
            v,
            x + (i % 2) * 190,
            460 + Math.floor(i / 2) * 110,
            165,
            80,
            color,
            29,
          ),
        );
      });
      chapterText(
        ctx,
        api,
        themeColors,
        '6 stored head units',
        360,
        870,
        29,
        themeColors.cyan,
        'center',
      );
      chapterText(
        ctx,
        api,
        themeColors,
        '4 units · work needs mask-aware kernels',
        960,
        870,
        25,
        themeColors.blue,
        'center',
      );
      chapterText(
        ctx,
        api,
        themeColors,
        '4 units · union restores full width',
        1560,
        870,
        25,
        themeColors.purple,
        'center',
      );
    });
    focusScope(ctx, api, 'lp-fleet-cache', () =>
      chapterFooter(
        ctx,
        api,
        themeColors,
        'A receiving loader/compiler needs synchronized axes, routing and cache invalidation.',
      ),
    );
  }
}
export default {
  id: 'shared-fleet',
  draw: drawSharedFleet,
  cues: ['lp-separate', 'lp-masks', 'lp-union', 'lp-cache-layout'],
};
