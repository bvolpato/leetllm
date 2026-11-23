import { mtEvent } from '../construction.mjs';
import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionPacket,
  drawConstructionPage,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawKvGrowth(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('kv-growth', state),
    currentBeat = modelState.b,
    ev = (beat, sentence) => mtEvent('kv-growth', state, beat, sentence);
  withConstructionFocus(ctx, api, 'kv-growth', () => {
    if (currentBeat < 2) {
      drawConstructionCenter(
        ctx,
        api,
        'Separate growth case · input 16 · output cap 1',
        960,
        285,
        34,
        themeColors.yellow,
      );
      drawConstructionPage(ctx, api, 'kv-growth', 'P0', 250, 420, {
        used: 16,
        owner: 'input',
        fill: themeColors.blue,
      });
      if (modelState.outputShown)
        drawConstructionPacket(
          ctx,
          api,
          'kv-growth',
          'one allowed output',
          250,
          720,
          1100,
          720,
          ev(0),
          themeColors.yellow,
          420,
          85,
        );
      if (modelState.reservationShown) {
        drawConstructionPage(ctx, api, 'kv-growth', 'P1', 1150, 420, {
          used: 0,
          owner: 'reserved output',
          fill: themeColors.yellow,
          reserved: true,
        });
        drawConstructionCenter(
          ctx,
          api,
          'ceil(17 / 16) = 2 pages · 32 allocated positions',
          960,
          850,
          35,
          themeColors.green,
        );
      } else
        drawConstructionBox(ctx, api, 'Second page?', 1150, 420, 278, 136, themeColors.muted, 30);
      if (modelState.pageBytesVisible)
        drawConstructionCenter(
          ctx,
          api,
          '16 × 0.3125 MiB = ' + modelState.pageMiB + ' MiB / page',
          960,
          950,
          34,
          themeColors.cyan,
        );
    } else {
      drawConstructionCenter(
        ctx,
        api,
        'Integer regression input · not an admitted context',
        960,
        285,
        34,
        themeColors.yellow,
      );
      drawConstructionBox(
        ctx,
        api,
        '2⁵⁴ + 1 = ' + modelState.huge,
        180,
        380,
        1560,
        110,
        themeColors.blue,
        35,
      );
      if (modelState.integerVisible) {
        drawConstructionBox(
          ctx,
          api,
          'Exact integer pages\n' + modelState.exact,
          180,
          585,
          710,
          150,
          themeColors.green,
          33,
        );
        drawConstructionBox(
          ctx,
          api,
          'Floating conversion loses one token\n' + modelState.rounded + ' pages',
          1030,
          585,
          710,
          150,
          themeColors.pink,
          31,
        );
      }
      if (modelState.contextRejected)
        drawConstructionCenter(
          ctx,
          api,
          'Real context cap rejects this request before allocation',
          960,
          900,
          34,
          themeColors.pink,
        );
    }
    drawConstructionFoot(
      ctx,
      api,
      'Reserve whole blocks; an output-growth policy is separate from exact page arithmetic',
    );
  });
}
export default {
  id: 'kv-growth',
  draw: drawKvGrowth,
  cues: [
    'mt-kv-growth-b0',
    'mt-kv-growth-s0-2',
    'mt-kv-growth-s0-3',
    'mt-kv-growth-b1',
    'mt-kv-growth-s1-0',
    'mt-kv-growth-b2',
    'mt-kv-growth-s2-1',
    'mt-kv-growth-s2-2',
  ],
};
