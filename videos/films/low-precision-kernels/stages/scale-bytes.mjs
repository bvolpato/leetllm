import { hexByte } from '../encoding.mjs';
import { cueDone, sampleModel } from '../construction.mjs';
import { bits, labelText, line } from '../defaults.mjs';
export function drawScaleBytes(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('scale-bytes', state),
    currentBeat = modelState.step,
    progress2 = modelState.q;
  const ready = (name) => cueDone(state, 'lp-scale-bytes-' + name);
  api.focus.target('lp-scale-bytes-trace', () => {
    if (currentBeat === 0) {
      for (const [code, decoded, i] of [
        [0x77, '2^−8', 0],
        [0x80, '2', 1],
      ]) {
        bits(ctx, api, code, 250, 340 + i * 280, 800, 'e8m0');
        labelText(
          ctx,
          api,
          ready('decode') ? hexByte(code) + ' → ' + decoded : hexByte(code) + ' → ?',
          1370,
          390 + i * 280,
          36,
          themeColors.yellow,
          'center',
        );
      }
      labelText(
        ctx,
        api,
        '0x00 → 2^−127 > 0 · 0xff → NaN',
        960,
        1000,
        33,
        themeColors.pink,
        'center',
      );
    } else if (currentBeat === 1) {
      for (const [title, scaleCount, i] of [
        ['one FP32 tensor scale', 4, 0],
        ['two E8M0 block scales', 2, 1],
      ]) {
        const y = 365 + i * 260;
        labelText(ctx, api, title, 200, y - 35, 30, themeColors.muted);
        teaching.grid({
          x: 240,
          y,
          width: 1280,
          height: 100,
          rows: 2,
          columns: 32,
          fill: themeColors.panel,
          stroke: themeColors.blue,
        });
        for (let k = 0; k < scaleCount; k++)
          api.rect(ctx, 1570 + k * 39, y + 30, 32, 55, themeColors.yellow, themeColors.panel, 0);
        labelText(
          ctx,
          api,
          ready('count') ? 64 + scaleCount + ' B' : '64 code B + metadata',
          960,
          y + 170,
          34,
          themeColors.yellow,
          'center',
        );
      }
      labelText(
        ctx,
        api,
        ready('bits')
          ? '(32 × 8 + 8) / 32 = 8.25 bits/value'
          : 'One block: 256 code bits + 8 scale bits',
        960,
        1010,
        31,
        themeColors.cyan,
        'center',
      );
    } else {
      labelText(
        ctx,
        api,
        'Separate supplied layout · 3 rows × 70 logical values',
        960,
        305,
        32,
        themeColors.blue,
        'center',
      );
      for (let row = 0; row < 3; row++) {
        const y = 400 + row * 160;
        for (let j = 0; j < 96; j++)
          api.rect(
            ctx,
            220 + j * 14.5,
            y,
            13,
            56,
            j < 70 ? themeColors.panel : themeColors.pink,
            j < 70 ? themeColors.blue : themeColors.pink,
            0,
          );
        for (let block = 0; block < 3; block++) {
          line(
            ctx,
            api,
            220 + block * 464,
            y + 80,
            220 + (block + 1) * 464 - 4,
            y + 80,
            themeColors.yellow,
            3,
          );
          api.rect(
            ctx,
            430 + block * 464,
            y + 100,
            28,
            28,
            themeColors.yellow,
            themeColors.panel,
            0,
          );
        }
        labelText(ctx, api, 'row ' + row, 150, y + 38, 24, themeColors.muted);
      }
      labelText(
        ctx,
        api,
        ready('logical') ? 'Logical only: 210 + 9 = 219 B' : 'Logical count = ?',
        960,
        940,
        31,
        themeColors.blue,
        'center',
      );
      labelText(
        ctx,
        api,
        ready('padding') ? 'Stored padded: 288 + 9 = 297 B' : 'Padded count = ?',
        960,
        1025,
        33,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'scale-bytes',
  draw: drawScaleBytes,
  cues: [
    'lp-scale-bytes-build-0',
    'lp-scale-bytes-decode',
    'lp-scale-bytes-build-1',
    'lp-scale-bytes-bits',
    'lp-scale-bytes-count',
    'lp-scale-bytes-build-2',
    'lp-scale-bytes-logical',
    'lp-scale-bytes-padding',
  ],
};
