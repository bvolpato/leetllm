import { HEAD_WORKSHEET } from '../fixtures.mjs';
import { splitHeads, sum } from '../arithmetic.mjs';
import {
  drawExtendedArrow,
  drawExtendedMatrix,
  drawExtendedNote,
  drawExtendedRow,
  drawExtendedText,
  drawExtendedTitle,
  withTransformerExtendedFrame,
} from '../defaults.mjs';
import { dotProduct, stableSoftmax } from 'vizmatic';
export function paintParallelHeads(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors) {
  const heads = splitHeads(HEAD_WORKSHEET);
  if (b === 0) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Split features, preserve all three positions',
      'Authored projected entries · B=1, T=3, d=6, h=3',
    );
    drawExtendedMatrix(ctx, api, C, f, HEAD_WORKSHEET, 180, 410, 750, 340, colors);
    for (let h = 0; h < 3; h++) {
      const xx = 1090 + h * 240;
      drawExtendedText(ctx, api, C, 'head ' + h, xx + 100, 390, 28, colors[h], 'center');
      drawExtendedMatrix(ctx, api, C, f, heads[h], xx, mix(540, 425, p), 210, 310, colors[h]);
    }
    drawExtendedText(
      ctx,
      api,
      C,
      known('split', 0) ? '[1, 3, 3, 2]' : '[B, h, T, dₕ] = ?',
      960,
      870,
      34,
      C.yellow,
      'center',
    );
    drawExtendedNote(ctx, api, C, 'Each head keeps rows 0, 1 and 2 · no token is assigned away');
  } else if (b === 1) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Three independent reads concatenate by feature',
      'Supplied Q=K=V per head · causal rows normalize independently',
    );
    const reads = [];
    for (let h = 0; h < 3; h++) {
      const v = heads[h],
        w = v.map((q, i) => [
          ...stableSoftmax(v.slice(0, i + 1).map((k) => dotProduct(q, k) / Math.sqrt(2))),
          ...Array(2 - i).fill(0),
        ]),
        read = [0, 1].map((j) => sum(v.map((r, i) => r[j] * w[2][i])));
      reads.push(read);
      drawExtendedMatrix(
        ctx,
        api,
        C,
        f,
        w,
        230 + h * 510,
        405,
        400,
        245,
        colors[h],
        Math.ceil(p * 27),
      );
      drawExtendedText(
        ctx,
        api,
        C,
        'head ' + h + ' · final read',
        430 + h * 510,
        710,
        28,
        colors[h],
        'center',
      );
      drawExtendedRow(
        ctx,
        api,
        C,
        f,
        read.map((x) => (p > 0.35 ? x : '?')),
        230 + h * 510,
        735,
        400,
        colors[h],
      );
    }
    drawExtendedRow(
      ctx,
      api,
      C,
      f,
      reads.flat().map((x) => (p > 0.55 ? x : '?')),
      390,
      835,
      1140,
      C.yellow,
      65,
    );
    if (known('merge', 1))
      drawExtendedText(
        ctx,
        api,
        C,
        'inverse transpose + reshape restores entry identity',
        960,
        925,
        26,
        C.green,
        'center',
      );
  } else {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Parallel heads, sequential blocks',
      'Head count and depth describe different axes',
    );
    const row0 = [0.1, 0.3, 0.9, 1.1];
    for (let i = 0; i < 3; i++) {
      const y = 410 + i * 150;
      drawExtendedText(ctx, api, C, 'block ' + (i + 1), 210, y + 40, 31, colors[i]);
      drawExtendedRow(
        ctx,
        api,
        C,
        f,
        row0.map((v, j) => v + (i + 1) * 0.1 * (j + 1)),
        550,
        y,
        780,
        colors[i],
      );
      if (i < 2 && p > (i + 1) / 3)
        drawExtendedArrow(ctx, api, C, 1450, y + 60, 1450, y + 140, colors[i]);
    }
    drawExtendedText(ctx, api, C, 'separate learned weights', 1510, 855, 27, C.muted, 'center');
    drawExtendedNote(
      ctx,
      api,
      C,
      'Illustrative residual states · each block consumes the preceding output',
    );
  }
}
export function drawParallelHeadsStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintParallelHeads);
}
export default {
  id: 'parallel-heads',
  draw: drawParallelHeadsStage,
  cues: [
    'tr-parallel-heads-voice-0',
    'tr-parallel-heads-split',
    'tr-parallel-heads-voice-1',
    'tr-parallel-heads-merge',
    'tr-parallel-heads-voice-2',
  ],
};
