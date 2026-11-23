import { sentence } from '../construction.mjs';
import {
  chapterCard,
  chapterGrid,
  chapterHeading,
  chapterLine,
  chapterNote,
  chapterRectangle,
  chapterText,
} from '../defaults.mjs';
export function drawAlltoallLayout(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = (bi, si) => sentence(state, 'alltoall-layout', bi, si);
    const rankColors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow];
    {
      if (currentBeat > 0) {
        const counts = [2, 1, 3],
          tokens = [[1, 2], [3], [4, 5, 6]],
          q = currentBeat === 1 ? progress(1, 2) : progress(2, 2),
          paddingCount = currentBeat === 1 ? Math.floor(q * 3) : 0;
        chapterHeading(
          ctx,
          api,
          currentBeat === 1
            ? 'Toy expert dispatch · unequal counts need an explicit layout'
            : 'Same toy dispatch · matched peer counts are an alternative',
        );
        chapterText(
          ctx,
          api,
          'Source S0 · token counts by destination',
          960,
          355,
          31,
          themeColors.blue,
          'center',
        );
        counts.forEach((count, d) => {
          const x = 180 + d * 570;
          chapterText(
            ctx,
            api,
            'D' + d + ' · ' + count + ' real tokens',
            x + 240,
            435,
            29,
            rankColors[d],
            'center',
          );
          chapterGrid(
            ctx,
            api,
            [
              Array.from(
                {
                  length: 3,
                },
                (_, j) => {
                  if (j < count) return String(tokens[d][j]);
                  const earlierPads = counts.slice(0, d).reduce((n, count) => n + 3 - count, 0);
                  return earlierPads + j - count < paddingCount ? 'PAD' : '·';
                },
              ),
            ],
            x,
            485,
            480,
            115,
            Array(3).fill(rankColors[d]),
          );
          if (currentBeat === 2) {
            const received = q >= (d + 1) / 3;
            chapterCard(
              ctx,
              api,
              'send D' + d + ' · count ' + count,
              x,
              680,
              480,
              80,
              rankColors[d],
            );
            chapterLine(ctx, api, x + 240, 775, x + 240, 835, rankColors[d]);
            chapterCard(
              ctx,
              api,
              received ? 'recv S0 · count ' + count : 'matching receive pending',
              x,
              865,
              480,
              80,
              received ? themeColors.green : themeColors.muted,
            );
          }
        });
        if (currentBeat === 1) {
          chapterText(
            ctx,
            api,
            paddingCount === 3
              ? 'Equal chunks of 3: 6 real tokens + 3 padding tokens'
              : 'Useful tokens: 6     Padding added: ' + paddingCount,
            960,
            760,
            34,
            paddingCount === 3 ? themeColors.green : themeColors.yellow,
            'center',
          );
          chapterText(
            ctx,
            api,
            'Source buffer: ' + (6 + paddingCount) + ' token positions',
            960,
            965,
            30,
            themeColors.yellow,
            'center',
          );
        } else
          chapterText(
            ctx,
            api,
            'Matched send/receive operations: ' + 2 * Math.floor(q * 3 + 1e-9) + ' / 6',
            960,
            990,
            30,
            themeColors.cyan,
            'center',
          );
        chapterNote(
          ctx,
          api,
          'Supplied token counts. Padding and matched point-to-point are different layouts',
        );
        return;
      }
      chapterHeading(ctx, api, 'One chunk from each source');
      const data = [
          [1, 2, 3],
          [10, 20, 30],
          [100, 200, 300],
        ],
        q = progress(0, 4);
      chapterText(ctx, api, 'Source rows', 190, 350, 30, themeColors.blue);
      for (let r = 0; r < 3; r++) {
        chapterText(ctx, api, 'S' + r, 200, 430 + r * 100, 29, rankColors[r]);
        chapterGrid(
          ctx,
          api,
          [data[r].map((v, j) => 'D' + j + ': ' + v)],
          320,
          380 + r * 100,
          1270,
          80,
          [themeColors.muted, progress(0, 2) > 0 ? themeColors.yellow : themeColors.muted, themeColors.muted],
        );
      }
      for (let d = 0; d < 3; d++) {
        const x = 210 + d * 550;
        chapterText(ctx, api, 'Destination ' + d, x + 225, 755, 29, rankColors[d], 'center');
        chapterGrid(
          ctx,
          api,
          [data.map((row) => (q * 3 >= d + 1 ? String(row[d]) : '…'))],
          x,
          790,
          450,
          90,
          rankColors,
        );
      }
      if (q > 0 && q < 1) {
        const column = Math.min(2, Math.floor(q * 3)),
          local = q * 3 - column,
          value = data.map((row) => row[column]).join(' / '),
          x0 = 530 + column * 423,
          x1 = 435 + column * 550,
          x = x0 + (x1 - x0) * local;
        chapterRectangle(ctx, api, x - 125, 674, 250, 51, themeColors.panel, rankColors[column]);
        chapterText(ctx, api, value, x, 710, 27, rankColors[column], 'center');
      }
      chapterNote(ctx, api, q === 1 ? 'Destination 1 reads [2, 20, 200] in source order' : 'Each source sends one value to each destination.');
    }
  });
}
export default {
  id: 'alltoall-layout',
  draw: drawAlltoallLayout,
  cues: [
    'nc-alltoall-layout-b0-s0',
    'nc-alltoall-layout-b0-s1',
    'nc-alltoall-layout-b0-s2',
    'nc-alltoall-layout-b0-s3',
    'nc-alltoall-layout-b0-s4',
    'nc-alltoall-layout-b1-s0',
    'nc-alltoall-layout-b1-s1',
    'nc-alltoall-layout-b1-s2',
    'nc-alltoall-layout-b1-s3',
    'nc-alltoall-layout-b2-s0',
    'nc-alltoall-layout-b2-s1',
    'nc-alltoall-layout-b2-s2',
    'nc-alltoall-layout-b2-s3',
  ],
};
