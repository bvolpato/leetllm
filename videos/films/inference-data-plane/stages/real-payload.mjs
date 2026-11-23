import { L, equation, memory, rectangle, text } from '../defaults.mjs';
export function drawRealPayload(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const q = (i, a = 0.12, z = 0.8) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    if (currentBeat === 0) {
      text(
        ctx,
        api,
        'Same cache axes · hypothetical production shape',
        960,
        285,
        37,
        themeColors.yellow,
        'center',
      );
      for (let layer = 7; layer >= 1; layer--) {
        const dx = layer * 35,
          dy = layer * 17;
        L(
          ctx,
          api,
          210 + dx,
          430 - dy,
          1010 + dx,
          430 - dy,
          layer % 2 ? themeColors.green : themeColors.blue,
          3,
        );
        L(
          ctx,
          api,
          1010 + dx,
          430 - dy,
          1010 + dx,
          755 - dy,
          layer % 2 ? themeColors.green : themeColors.blue,
          3,
        );
      }
      rectangle(ctx, api, 210, 430, 800, 325, themeColors.blue);
      text(ctx, api, 'K + V ·8 heads × width128', 610, 520, 36, themeColors.cyan, 'center');
      text(ctx, api, 'Each slab represents10 layers', 610, 635, 32, themeColors.muted, 'center');
      text(ctx, api, '80 layers', 1510, 420, 46, themeColors.blue, 'center');
      if (api.focus.progress('production-per-token', q(0, 0.55, 0.65)) >= 1)
        text(ctx, api, '320 KiB / token', 1510, 580, 43, themeColors.green, 'center');
      text(ctx, api, '8,192 tokens', 1510, 710, 42, themeColors.yellow, 'center');
      if (api.focus.progress('production-total', q(0, 0.82, 0.94)) >= 1)
        equation(ctx, api, String.raw`320\ \mathrm{KiB}\cdot8192=2.5\ \mathrm{GiB}`, 960, 1000, 46);
    } else if (currentBeat === 1) {
      text(
        ctx,
        api,
        '512 model-wide blocks · 5 MiB each',
        960,
        285,
        39,
        themeColors.yellow,
        'center',
      );
      memory(ctx, api, 165, 385, 8, 4, 32, 'rank0 · 4 heads · 1.25 GiB', themeColors.blue, 75);
      memory(ctx, api, 1130, 385, 8, 4, 32, 'rank1 · 4 heads · 1.25 GiB', themeColors.green, 75);
      text(
        ctx,
        api,
        'Each displayed cell groups16 prompt blocks',
        960,
        775,
        31,
        themeColors.muted,
        'center',
      );
      rectangle(ctx, api, 555, 835, 810, 100, themeColors.yellow);
      text(
        ctx,
        api,
        '+8 future blocks reserved; no KV sent yet',
        960,
        895,
        31,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        '520 blocks =2,600 MiB · one extra prompt token →521',
        960,
        1015,
        35,
        themeColors.cyan,
        'center',
      );
    } else if (currentBeat === 2) {
      text(
        ctx,
        api,
        'Same total2.5 GiB · change only the bottleneck',
        960,
        285,
        37,
        themeColors.yellow,
        'center',
      );
      const times = [107.374, 53.687],
        names = ['one shared25 GB/s path', 'two independent25 GB/s paths'];
      times.forEach((t, i) => {
        const y = 460 + i * 230;
        text(ctx, api, names[i], 180, y - 48, 34, themeColors.muted);
        L(ctx, api, 200, y, 1700, y, themeColors.muted, 3);
        rectangle(
          ctx,
          api,
          200,
          y - 15,
          (t / 107.374) * 1400,
          80,
          i ? themeColors.green : themeColors.blue,
        );
        text(
          ctx,
          api,
          t.toFixed(3) + ' ms',
          1700,
          y - 55,
          35,
          i ? themeColors.green : themeColors.blue,
          'right',
        );
      });
      text(
        ctx,
        api,
        '40 transfers/s demand107.4 GB/s; shared path ceiling≈9.31/s',
        960,
        1000,
        35,
        themeColors.pink,
        'center',
      );
    } else {
      text(
        ctx,
        api,
        'Available cache pool:8 GiB =8,192 MiB',
        960,
        285,
        40,
        themeColors.yellow,
        'center',
      );
      let x = 170;
      for (let i = 0; i < 3; i++) {
        rectangle(ctx, api, x, 445, 470, 270, i === 2 ? themeColors.cyan : themeColors.blue);
        text(ctx, api, 'R' + (4219 + i), x + 235, 525, 42, themeColors.yellow, 'center');
        text(ctx, api, '2,600 MiB', x + 235, 645, 42, themeColors.ink, 'center');
        x += 490;
      }
      rectangle(ctx, api, 1640, 445, 100, 270, themeColors.muted);
      text(ctx, api, '392 MiB left', 960, 820, 39, themeColors.green, 'center');
      text(
        ctx,
        api,
        'Fourth reservation needs2,600 MiB → WAIT',
        960,
        1000,
        38,
        themeColors.pink,
        'center',
      );
    }
  };
  if (api.focus)
    api.focus.target('real-payload-construction', () => {
      body();
    });
  else body();
}
export default {
  id: 'real-payload',
  draw: drawRealPayload,
  cues: [
    'real-payload-b1',
    'production-per-token',
    'production-total',
    'real-payload-b2',
    'real-payload-b3',
    'real-payload-b4',
  ],
};
