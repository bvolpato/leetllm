import '../construction.mjs';
import { L, equation, rectangle, text } from '../defaults.mjs';
export function drawKvState(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const q = (i, a = 0.12, z = 0.8) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    const layers = currentBeat === 0 ? Math.max(1, Math.ceil(q(0) * 4)) : 4,
      tokens = 128;
    ['K', 'V'].forEach((name, k) => {
      const x = 180 + k * 490,
        oy = 410,
        color = k ? themeColors.green : themeColors.blue;
      for (let layer = layers - 1; layer >= 1; layer--) {
        const dx = layer * 42,
          dy = layer * 24;
        L(ctx, api, x + dx, oy - dy, x + 360 + dx, oy - dy, color, 3);
        L(ctx, api, x + 360 + dx, oy - dy, x + 360 + dx, oy + 365 - dy, color, 3);
      }
      rectangle(ctx, api, x, oy, 360, 365, color);
      text(ctx, api, name + ' · ' + layers + ' layers', x + 180, oy + 48, 30, color, 'center');
      for (let t = 0; t < 4; t++)
        for (let d = 0; d < 8; d++)
          rectangle(ctx, api, x + 24 + d * 39, oy + 85 + t * 55, 31, 44, color);
      text(
        ctx,
        api,
        '4 of ' + tokens + ' token rows',
        x + 180,
        oy + 335,
        25,
        themeColors.muted,
        'center',
      );
      text(ctx, api, 'one of2 KV heads shown', x + 180, oy + 415, 25, themeColors.muted, 'center');
    });
    text(ctx, api, '2 KV heads per layer', 1500, 395, 33, themeColors.cyan, 'center');
    text(ctx, api, 'width 8 values per head', 1500, 485, 31, themeColors.muted, 'center');
    text(ctx, api, '2 bytes per value', 1500, 575, 32, themeColors.muted, 'center');
    const productReady = api.focus.progress('kv-total-reveal', q(1, 0.65, 0.82)) >= 1;
    equation(
      ctx,
      api,
      productReady
        ? String.raw`2\cdot4\cdot128\cdot2\cdot8\cdot2=32{,}768\ \mathrm{bytes}`
        : String.raw`2\cdot4\cdot128\cdot2\cdot8\cdot2`,
      960,
      900,
      45,
    );
    text(
      ctx,
      api,
      productReady
        ? '32 KiB · these axes grow the same owned K/V state'
        : 'Multiply the dimensions of this owned K/V state',
      960,
      1010,
      37,
      productReady ? themeColors.green : themeColors.yellow,
      'center',
    );
  };
  if (api.focus)
    api.focus.target('kv-state-construction', () => {
      body();
    });
  else body();
}
export default {
  id: 'kv-state',
  draw: drawKvState,
  cues: ['kv-state-b1', 'kv-state-b2', 'kv-total-reveal', 'kv-state-b3'],
};
