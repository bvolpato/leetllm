import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawKvByteShape(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('kv-byte-shape', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'kv-byte-shape', () => {
    const x0 = 160,
      w = 270;
    modelState.factors.forEach(([label, value], i) => {
      const x = x0 + i * 325;
      drawConstructionBox(
        ctx,
        api,
        value,
        x,
        390,
        w,
        130,
        [
          themeColors.blue,
          themeColors.cyan,
          themeColors.yellow,
          themeColors.pink,
          themeColors.green,
        ][i],
        45,
      );
      drawConstructionCenter(ctx, api, label, x + w / 2, 565, 28, themeColors.muted);
      if (i < 4) drawConstructionCenter(ctx, api, '×', x + w + 28, 470, 38, themeColors.muted);
    });
    drawConstructionCenter(
      ctx,
      api,
      modelState.bytesVisible
        ? modelState.bytes.toLocaleString('en-US') + ' bytes / token'
        : 'Product pending',
      960,
      680,
      44,
      modelState.bytesVisible ? themeColors.green : themeColors.muted,
    );
    if (modelState.mibVisible)
      drawConstructionCenter(
        ctx,
        api,
        '327,680 / 1,048,576 = ' + modelState.perMiB + ' MiB / token',
        960,
        795,
        34,
        themeColors.cyan,
      );
    if (modelState.gibVisible)
      drawConstructionCenter(
        ctx,
        api,
        '4,000 tokens → ' + modelState.totalGiB.toFixed(4) + ' GiB aggregate',
        960,
        895,
        36,
        themeColors.green,
      );
    if (currentBeat > 0)
      drawConstructionBox(
        ctx,
        api,
        'Query heads are not the stored KV-head factor',
        420,
        295,
        1080,
        70,
        themeColors.yellow,
        28,
      );
    if (currentBeat === 2)
      drawConstructionCenter(
        ctx,
        api,
        'Per-device placement still needs heads, layers, metadata and headroom',
        960,
        975,
        28,
        themeColors.yellow,
      );
    drawConstructionFoot(
      ctx,
      api,
      'Supplied full-attention shape · weights and other runtime allocations are separate',
    );
  });
}
export default {
  id: 'kv-byte-shape',
  draw: drawKvByteShape,
  cues: [
    'mt-kv-byte-shape-b0',
    'mt-kv-byte-shape-s0-2',
    'mt-kv-byte-shape-b1',
    'mt-kv-byte-shape-s1-0',
    'mt-kv-byte-shape-s1-1',
    'mt-kv-byte-shape-b2',
  ],
};
