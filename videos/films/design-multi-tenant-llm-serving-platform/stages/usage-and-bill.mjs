import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionText,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawUsageAndBill(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('usage-and-bill', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'usage-and-bill', () => {
    if (currentBeat === 0) {
      drawConstructionBox(
        ctx,
        api,
        'A-1 / attempt-1 / reservation A-1',
        240,
        285,
        1440,
        95,
        themeColors.blue,
        33,
      );
      [
        'tenant / principal',
        'model / adapter',
        'input / output / cached',
        'terminal / metering revision',
      ].forEach((v, i) =>
        drawConstructionBox(
          ctx,
          api,
          v,
          180 + (i % 2) * 850,
          465 + Math.floor(i / 2) * 170,
          780,
          120,
          i % 2 ? themeColors.cyan : themeColors.blue,
          29,
        ),
      );
      drawConstructionBox(ctx, api, 'msg-7', 300, 855, 460, 85, themeColors.cyan, 30);
      drawConstructionBox(
        ctx,
        api,
        'msg-8 · same logical attempt',
        1100,
        855,
        590,
        85,
        themeColors.cyan,
        29,
      );
      drawConstructionCenter(
        ctx,
        api,
        'Two deliveries → one logical settlement',
        960,
        995,
        31,
        themeColors.green,
      );
    } else if (currentBeat === 1) {
      drawConstructionCenter(
        ctx,
        api,
        'Supplied disconnect illustration',
        960,
        285,
        34,
        themeColors.yellow,
      );
      drawConstructionText(ctx, api, 'Generated output', 190, 440, 31, themeColors.cyan);
      api.rect(ctx, 640, 390, 960, 70, themeColors.cyan, undefined, 0);
      drawConstructionText(ctx, api, '120 tokens', 1640, 440, 28, themeColors.cyan);
      if (modelState.generatedExample) {
        drawConstructionText(ctx, api, 'Delivered output', 190, 625, 31, themeColors.blue);
        api.rect(ctx, 640, 575, 720, 70, themeColors.blue, undefined, 0);
        drawConstructionText(ctx, api, '90 tokens', 1410, 625, 28, themeColors.blue);
      }
      if (modelState.billPolicy)
        drawConstructionBox(
          ctx,
          api,
          'Billable output: declared tariff policy',
          360,
          815,
          1200,
          115,
          themeColors.yellow,
          34,
        );
      drawConstructionCenter(
        ctx,
        api,
        'Queue time uses deadline; busy GPU time is a separate observation',
        960,
        985,
        28,
        themeColors.muted,
      );
    } else if (currentBeat === 2) {
      const columns = [140, 745, 1350];
      ['Worker observation', 'Cost allocation policy', 'Customer tariff'].forEach((v, i) =>
        drawConstructionBox(
          ctx,
          api,
          v,
          columns[i],
          315,
          430,
          100,
          [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
          28,
        ),
      );
      drawConstructionBox(
        ctx,
        api,
        '4 GPUs × 0.2 s\n0.8 GPU-seconds',
        140,
        505,
        430,
        170,
        themeColors.blue,
        31,
      );
      if (modelState.allocVisible) {
        drawConstructionBox(ctx, api, 'A 25% / B 75%', 745, 505, 430, 170, themeColors.cyan, 32);
        api.rect(ctx, 440, 805, 260, 70, themeColors.blue, undefined, 0);
        api.rect(ctx, 700, 805, 780, 70, themeColors.pink, undefined, 0);
        drawConstructionCenter(
          ctx,
          api,
          '$' + modelState.a.toFixed(9),
          570,
          930,
          30,
          themeColors.blue,
        );
        drawConstructionCenter(
          ctx,
          api,
          '$' + modelState.bShare.toFixed(9),
          1090,
          930,
          30,
          themeColors.pink,
        );
      }
      if (modelState.tariffVisible)
        drawConstructionBox(
          ctx,
          api,
          'Revisioned token price\nmay differ from cost',
          1350,
          505,
          430,
          170,
          themeColors.yellow,
          29,
        );
    } else {
      drawConstructionCenter(
        ctx,
        api,
        'Supplied rates · seconds to hours before multiplying',
        960,
        285,
        34,
        themeColors.yellow,
      );
      drawConstructionBox(
        ctx,
        api,
        '0.8 GPU-s × $2 / GPU-hour',
        170,
        410,
        1580,
        110,
        themeColors.cyan,
        35,
      );
      drawConstructionBox(
        ctx,
        api,
        '0.2 node-s × $8 / node-hour',
        170,
        600,
        1580,
        110,
        themeColors.blue,
        35,
      );
      if (modelState.hourlyVisible) {
        drawConstructionCenter(ctx, api, '÷ 3,600', 960, 555, 36, themeColors.yellow);
        drawConstructionCenter(ctx, api, '÷ 3,600', 960, 745, 36, themeColors.yellow);
      }
      if (modelState.consistentVisible)
        drawConstructionCenter(
          ctx,
          api,
          'Both paths = $' + modelState.total.toFixed(9),
          960,
          925,
          42,
          themeColors.green,
        );
    }
    drawConstructionFoot(
      ctx,
      api,
      'Usage evidence, allocation choices and invoice prices retain their own meanings and revisions',
    );
  });
}
export default {
  id: 'usage-and-bill',
  draw: drawUsageAndBill,
  cues: [
    'mt-usage-and-bill-b0',
    'mt-usage-and-bill-s0-0',
    'mt-usage-and-bill-s0-1',
    'mt-usage-and-bill-b1',
    'mt-usage-and-bill-s1-0',
    'mt-usage-and-bill-s1-1',
    'mt-usage-and-bill-b2',
    'mt-usage-and-bill-s2-0',
    'mt-usage-and-bill-s2-1',
    'mt-usage-and-bill-s2-2',
    'mt-usage-and-bill-b3',
    'mt-usage-and-bill-s3-0',
    'mt-usage-and-bill-s3-1',
  ],
};
