import { arrow, box, cueVisible, footer, rankingText, tile } from '../defaults.mjs';
export function drawSlateRecheck(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('slate-recheck-mechanism', () => {
    if (currentBeat === 0) {
      rankingText(ctx, api, 'First-failure rule · policy → stock → region', 150, 275, 34);
      ['policy', 'stock', 'region'].forEach((name, j) =>
        rankingText(ctx, api, name, 490 + j * 260, 345, 25, themeColors.muted, 'center'),
      );
      ['P8', 'P11', 'P5', 'P6', 'P4'].forEach((id, i) => {
        const y = 380 + i * 110;
        rankingText(ctx, api, id, 180, y + 35, 34, themeColors.blue);
        const flags =
          id === 'P8'
            ? [false, false, true]
            : id === 'P11'
              ? [true, true, false]
              : [true, true, true];
        flags.forEach((flag, j) =>
          box(
            ctx,
            api,
            flag ? 'true' : 'false',
            390 + j * 260,
            y,
            200,
            68,
            flag ? themeColors.blue : themeColors.pink,
            28,
          ),
        );
        if (cueVisible(ctx, api, 'slate-first-failure'))
          rankingText(
            ctx,
            api,
            id === 'P8' ? 'policy_block' : id === 'P11' ? 'unavailable_region' : 'eligible',
            1260,
            y + 35,
            27,
            i < 2 ? themeColors.pink : themeColors.green,
          );
      });
      footer(
        ctx,
        api,
        'P8 has two failed flags, but the declared helper retains its first failure.',
      );
    } else if (currentBeat === 1) {
      rankingText(ctx, api, 'Slate rule · maximum2 listings per seller', 150, 275, 34);
      const rows = [
        {
          id: 'P5',
          seller: 'S5',
        },
        {
          id: 'P6',
          seller: 'S6',
        },
        {
          id: 'P4',
          seller: 'S4',
        },
      ];
      rows.forEach((row, i) => {
        tile(ctx, api, row.id, null, 200, 400 + i * 160, themeColors.blue, 450);
        if (cueVisible(ctx, api, 'slate-seller')) {
          arrow(ctx, api, 690, 437 + i * 160, 1010, 437 + i * 160, themeColors.cyan);
          box(
            ctx,
            api,
            row.seller + ' · count1 ≤2',
            1070,
            400 + i * 160,
            600,
            74,
            themeColors.green,
            30,
          );
        }
      });
      footer(
        ctx,
        api,
        'This supplied slate passes its concentration cap; it does not establish fairness.',
      );
    } else {
      const changed = cueVisible(ctx, api, 'slate-stock'),
        rebuild = cueVisible(ctx, api, 'slate-rebuild');
      rankingText(ctx, api, 'Keep old score; change only current P5 stock', 150, 270, 34);
      const rows = [
        ['P5', 0.96],
        ['P6', 0.84],
        ['P4', 0.45],
      ];
      rows.forEach(([id, score], i) => {
        tile(
          ctx,
          api,
          id,
          score,
          170,
          400 + i * 155,
          id === 'P5' && changed ? themeColors.pink : themeColors.blue,
          500,
        );
        rankingText(
          ctx,
          api,
          id === 'P5' && changed ? 'current stock = false' : 'current stock = true',
          760,
          448 + i * 155,
          29,
          id === 'P5' && changed ? themeColors.pink : themeColors.green,
        );
      });
      if (changed)
        box(
          ctx,
          api,
          'Reject old proposal · no new response rows',
          250,
          875,
          1420,
          80,
          themeColors.pink,
          32,
        );
      if (rebuild)
        rankingText(
          ctx,
          api,
          'Refresh eligible candidates → new pinned snapshot',
          960,
          350,
          30,
          themeColors.yellow,
          'center',
        );
      if (cueVisible(ctx, api, 'slate-history'))
        footer(
          ctx,
          api,
          'Historical rows validate against retained old catalog; new responses use current eligibility.',
        );
    }
  });
}
export default {
  id: 'slate-recheck',
  draw: drawSlateRecheck,
  cues: [
    'slate-first-failure',
    'slate-fill',
    'slate-seller',
    'slate-stock',
    'slate-rebuild',
    'slate-history',
  ],
};
