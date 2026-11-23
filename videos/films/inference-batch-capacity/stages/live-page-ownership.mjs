import { capacityEvent } from '../construction.mjs';
import {
  drawCapacityCard,
  drawCapacityText,
  drawCenteredText,
  drawFooter,
  drawLine,
} from '../defaults.mjs';
export function drawLivePageOwnership(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => capacityEvent(scene, state, name, beat),
    done = (name, beat) => ev(name, beat) === 1,
    begun = (name, beat) => ev(name, beat) > 0;
  api.focus.target('live-page-ownership-mechanism', () => {
    if (currentBeat === 0) {
      const rows = [
          ['A', 2, themeColors.blue],
          ['B', 5, themeColors.green],
          ['C', 3, themeColors.pink],
          ['D', 1, themeColors.yellow],
        ],
        paged = ev('pages', 0);
      drawCenteredText(
        ctx,
        api,
        'Same 11 live blocks · each color keeps its request identity',
        960,
        300,
        33,
        themeColors.yellow,
      );
      rows.forEach(([id, n, color], i) => {
        drawCapacityText(ctx, api, id, 145, 435 + i * 110, 30, color);
        for (let j = 0; j < 8; j++)
          api.rect(
            ctx,
            210 + j * 78,
            385 + i * 110,
            62,
            70,
            j < n ? color : themeColors.panel,
            themeColors.muted,
            0,
          );
      });
      drawCenteredText(
        ctx,
        api,
        '4 maximum slabs × 8 = 32 physical slots',
        550,
        925,
        29,
        themeColors.muted,
      );
      if (done('slabs', 0)) drawCenteredText(ctx, api, '21 unused', 550, 980, 31, themeColors.pink);
      if (paged > 0) {
        const owners = [
          'A0',
          'B0',
          'C0',
          'B1',
          'D0',
          'A1',
          'B2',
          'C1',
          'B3',
          'C2',
          'B4',
          null,
          null,
          null,
          null,
        ];
        owners.forEach((id, i) => {
          const color = id ? rows.find((r) => r[0] === id[0])[2] : themeColors.muted;
          drawCapacityCard(
            ctx,
            api,
            id ?? 'free',
            1070 + (i % 5) * 133,
            385 + Math.floor(i / 5) * 145,
            118,
            98,
            color,
            27,
          );
        });
        drawCenteredText(ctx, api, '15 slots · 11 live · 4 free', 1400, 925, 29, themeColors.green);
        if (begun('map', 0))
          drawCenteredText(
            ctx,
            api,
            'A logical [0,1] → physical [0,5]',
            1400,
            980,
            27,
            themeColors.blue,
          );
      }
    } else if (currentBeat === 1) {
      drawCenteredText(ctx, api, 'A single 16-position page', 960, 315, 36, themeColors.yellow);
      const p = ev('fragment', 1),
        n = Math.max(1, 16 - Math.floor(p * 15));
      for (let i = 0; i < 16; i++) {
        const x = 240 + (i % 8) * 180,
          y = 455 + Math.floor(i / 8) * 180;
        api.rect(
          ctx,
          x,
          y,
          150,
          125,
          i < n ? themeColors.green : themeColors.panel,
          themeColors.muted,
          0,
        );
        drawCenteredText(
          ctx,
          api,
          i < n ? 'live' : 'empty',
          x + 75,
          y + 77,
          29,
          i < n ? themeColors.bg : themeColors.muted,
        );
      }
      if (done('fragment', 1))
        drawCenteredText(
          ctx,
          api,
          '15 empty / 16 allocated = 93.75% tail waste',
          960,
          935,
          37,
          themeColors.pink,
        );
    } else {
      const release = ev('release', 2);
      drawCapacityCard(
        ctx,
        api,
        'A active reader',
        170,
        390,
        530,
        120,
        release === 1 ? themeColors.muted : themeColors.blue,
        35,
      );
      drawCapacityCard(ctx, api, 'B active reader', 1220, 390, 530, 120, themeColors.green, 35);
      drawCapacityCard(ctx, api, 'shared physical page', 690, 690, 540, 140, themeColors.cyan, 35);
      if (release < 1) drawLine(ctx, api, 435, 550, 820, 650, themeColors.blue, 4);
      drawLine(ctx, api, 1485, 550, 1100, 650, themeColors.green, 4);
      drawCenteredText(
        ctx,
        api,
        'references = ' + (release === 1 ? '1 · retain for B' : '2'),
        960,
        925,
        36,
        themeColors.yellow,
      );
    }
    drawFooter(
      ctx,
      api,
      'Paging changes physical allocation and ownership; keys and values themselves retain their meaning',
    );
  });
}
export default {
  id: 'live-page-ownership',
  draw: drawLivePageOwnership,
  cues: [
    'ic-live-page-ownership-slabs',
    'ic-live-page-ownership-pages',
    'ic-live-page-ownership-map',
    'ic-live-page-ownership-fragment',
    'ic-live-page-ownership-release',
  ],
};
