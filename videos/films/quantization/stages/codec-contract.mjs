import { decodeTeachingCodec, teachingCodec } from '../arithmetic.mjs';
import { detailProgress, spokenResult } from '../construction.mjs';
import {
  drawDetailLine,
  drawDetailRectangle,
  drawDetailText,
  drawEarnedNumber,
  drawFooter,
  drawRow,
} from '../defaults.mjs';
import assert from 'node:assert/strict';
import { compareByteSequences } from 'vizmatic';
export function drawCodecContract(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'codec-contract', beat);
  const body = () => {
    const codec = teachingCodec(),
      invalid = codec.bytes.slice();
    invalid[0] = 7;
    const diff = compareByteSequences(codec.bytes, invalid),
      changed = new Set(diff.columns.filter((c) => c.kind !== 'equal').map((c) => c.after?.offset)),
      corrupt = beat === 1 && spokenResult(state, 'change-count', 1, 0.24, 0.45),
      bytes = corrupt ? invalid : codec.bytes;
    const count = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true);
    drawDetailText(
      ctx,
      api,
      corrupt ? 'Same file, changed count' : 'Five weights in a little-endian file',
      960,
      280,
      35,
      themeColors.ink,
      'center',
    );
    const left = 210,
      step = 100;
    for (let i = 0; i < bytes.length; i++) {
      const x = left + i * step,
        color = i < 4 ? themeColors.blue : i < 12 ? themeColors.yellow : themeColors.cyan;
      drawDetailRectangle(ctx, api, x, 450, 86, 90, themeColors.panel);
      drawDetailText(
        ctx,
        api,
        bytes[i].toString(16).padStart(2, '0').toUpperCase(),
        x + 43,
        510,
        34,
        corrupt && changed.has(i) ? themeColors.pink : color,
        'center',
      );
      drawDetailText(ctx, api, i, x + 43, 590, 25, themeColors.muted, 'center');
    }
    for (const [start, count, label, color] of [
      [0, 4, 'count · 4 bytes', themeColors.blue],
      [4, 8, 'scale · 8 bytes', themeColors.yellow],
      [12, 3, 'codes · 3 bytes', themeColors.cyan],
    ]) {
      const x = left + start * step,
        w = count * step - 14;
      drawDetailLine(ctx, api, x, 390, x + w, 390, color, 3);
      drawDetailText(ctx, api, label, x + w / 2, 355, 30, color, 'center');
    }
    if (beat === 0) {
      drawRow(
        ctx,
        api,
        codec.codes.map((v) => String(v)),
        490,
        720,
        themeColors.cyan,
        220,
        44,
      );
      drawDetailText(
        ctx,
        api,
        '5 codes · last high nibble is padding',
        960,
        810,
        35,
        themeColors.ink,
        'center',
      );
      drawDetailText(
        ctx,
        api,
        '−7 … 7 used · −8 reserved · ties to even',
        960,
        910,
        32,
        themeColors.yellow,
        'center',
      );
    } else {
      drawEarnedNumber(
        ctx,
        api,
        '12 + 3 = 15 bytes',
        960,
        715,
        progress === 1,
        themeColors.green,
        50,
      );
      if (corrupt) {
        assert.equal(diff.columns.filter((c) => c.kind !== 'equal').length, 1);
        drawDetailText(
          ctx,
          api,
          count + ' weights need ' + Math.ceil(count / 2) + ' code bytes',
          960,
          830,
          33,
          themeColors.pink,
          'center',
        );
        if (spokenResult(state, 'reject-short-payload', 1, 0.46, 0.58))
          drawDetailText(
            ctx,
            api,
            bytes.length - 12 + ' code bytes present → reject',
            960,
            910,
            34,
            themeColors.pink,
            'center',
          );
      } else
        drawDetailText(
          ctx,
          api,
          'count = ' +
            decodeTeachingCodec(bytes).length +
            ' · scale = 2.4/7 · five weights recovered',
          960,
          850,
          32,
          themeColors.ink,
          'center',
        );
    }
    drawFooter(
      ctx,
      api,
      'A Python integer list has a different storage representation · decoding checks the byte contract',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'codec-contract'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'codec-contract',
  draw: drawCodecContract,
  cues: [
    'codec-contract-build-0',
    'codec-contract-build-1',
    'change-count',
    'reject-short-payload',
  ],
};
