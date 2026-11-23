import { prefixPageState } from '../arithmetic.mjs';
import { capacityEvent } from '../construction.mjs';
import {
  drawArrow,
  drawCapacityCard,
  drawCapacityText,
  drawCells,
  drawCenteredText,
  drawFooter,
  drawLine,
} from '../defaults.mjs';
export function drawPrefixSharing(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => capacityEvent(scene, state, name, beat),
    done = (name, beat) => ev(name, beat) === 1,
    begun = (name, beat) => ev(name, beat) > 0;
  api.focus.target('prefix-sharing-mechanism', () => {
    if (currentBeat === 0) {
      const p = ev('share', 0);
      drawCenteredText(
        ctx,
        api,
        'Three compatible 4,096-position prefixes',
        960,
        300,
        35,
        themeColors.yellow,
      );
      for (let i = 0; i < 3; i++) {
        drawCapacityCard(
          ctx,
          api,
          'R' + (i + 1) + ' private tail',
          1200,
          380 + i * 170,
          480,
          110,
          [themeColors.blue, themeColors.green, themeColors.pink][i],
          30,
        );
      }
      if (p < 1) {
        for (let i = 0; i < 3; i++)
          drawCapacityCard(
            ctx,
            api,
            'same prefix\n0.50 GiB',
            160 + Math.round(p * 210),
            380 + i * 170,
            480,
            110,
            themeColors.cyan,
            30,
          );
      } else {
        drawCapacityCard(
          ctx,
          api,
          'shared prefix\n0.50 GiB',
          350,
          510,
          550,
          160,
          themeColors.cyan,
          36,
        );
        for (let i = 0; i < 3; i++)
          drawLine(
            ctx,
            api,
            940,
            560,
            1160,
            435 + i * 170,
            [themeColors.blue, themeColors.green, themeColors.pink][i],
            4,
          );
      }
      drawCenteredText(
        ctx,
        api,
        p === 1
          ? '1.50 GiB → 0.50 GiB stored prefix'
          : 'Before sharing: 3 separately stored copies',
        960,
        955,
        34,
        themeColors.yellow,
      );
      if (begun('attend', 0))
        drawCenteredText(
          ctx,
          api,
          'Each decode still attends to the shared keys and values',
          960,
          1020,
          27,
          themeColors.muted,
        );
    } else {
      let stage =
        currentBeat === 2
          ? 3
          : begun('private', 1)
            ? 3
            : done('copy', 1)
              ? 2
              : begun('copy', 1)
                ? 1
                : 0;
      const model = prefixPageState(stage);
      if (stage === 1)
        model.pages[1].values = model.pages[1].values.map((v, i) =>
          i < Math.floor(ev('copy', 1) * 3) ? v : null,
        );
      drawCenteredText(
        ctx,
        api,
        'Authored partial-page copy-on-write · page 7 keeps p,q,r',
        960,
        295,
        31,
        themeColors.yellow,
      );
      drawCapacityCard(ctx, api, 'Request A', 140, 420, 340, 110, themeColors.blue, 35);
      drawCapacityCard(ctx, api, 'Request B', 1440, 420, 340, 110, themeColors.green, 35);
      model.pages.forEach((page, i) => {
        const y = 620 + i * 180;
        drawCapacityText(
          ctx,
          api,
          'page ' + page.id,
          350,
          y + 42,
          30,
          i ? themeColors.green : themeColors.blue,
        );
        drawCells(ctx, api, page.values, 610, y, 140, 90, i ? themeColors.green : themeColors.blue);
        drawCenteredText(ctx, api, 'refs ' + page.references, 1370, y + 52, 32, themeColors.yellow);
      });
      drawLine(ctx, api, 310, 570, 540, 640, themeColors.blue, 4);
      if (model.B === 7) drawLine(ctx, api, 1610, 570, 1250, 640, themeColors.green, 4);
      else drawLine(ctx, api, 1610, 570, 1430, 835, themeColors.green, 4);
      if (stage === 1) {
        const p = ev('copy', 1),
          count = Math.floor(p * 3);
        for (let i = 0; i < 3; i++)
          if (i < count)
            drawArrow(ctx, api, 677 + i * 140, 725, 677 + i * 140, 785, themeColors.yellow);
        drawCenteredText(
          ctx,
          api,
          'Copied ' + count + ' / 3 prefix values · B still points to page 7',
          960,
          970,
          30,
          themeColors.yellow,
        );
      } else
        drawCenteredText(
          ctx,
          api,
          stage === 0
            ? '2 readers · no writer may mutate the shared page'
            : stage === 2
              ? 'A→7 · B→12 · each page has one owner'
              : 'A appends a to 7 · B appends b to 12 · p,q,r unchanged',
          960,
          1005,
          29,
          stage === 3 ? themeColors.green : themeColors.yellow,
        );
    }
    if (currentBeat !== 0)
      drawFooter(
        ctx,
        api,
        'Lookup keys and tenant scope govern reuse; independent caches may reuse complete pages only',
      );
  });
}
export default {
  id: 'prefix-sharing',
  draw: drawPrefixSharing,
  cues: [
    'ic-prefix-sharing-share',
    'ic-prefix-sharing-attend',
    'ic-prefix-sharing-references',
    'ic-prefix-sharing-copy',
    'ic-prefix-sharing-private',
    'ic-prefix-sharing-guard',
  ],
};
