import { cueFraction } from '../cues.mjs';
import { address } from '../arithmetic.mjs';
import { bankY, cellX, original, storageBank, transposed } from '../storage.mjs';

export function drawStrides(ctx, scene, state, api) {
  const { C } = api;
  const changed = cueFraction(state, 'alias-write', 2, 0, 0.15) > 0;
  const addr = address([0, 1], [1, 3]);
  const value = changed ? 30 : original[addr];
  const copied = cueFraction(state, 'flat-copy', 1, 0.23, 0.53) * 6;
  const count = Math.floor(copied);
  const copying = copied > 0 && count < 6;
  api.focus.target('addresses', () => {
    storageBank(
      ctx,
      api,
      original.map((v, i) => (i === addr ? value : v)),
      copying ? transposed[count] : addr,
    );
    if (copying) return;
    const x = cellX(addr);
    api.line(ctx, x, bankY + 60, x, 448, C.yellow, 4);
    api.text(ctx, 'x[1, 0]     1 × 3 + 0 × 1', 340, 550, 36, C.blue);
    api.text(ctx, 'y[0, 1]     0 × 1 + 1 × 3', 1185, 550, 36, C.yellow);
    if (cueFraction(state, 'locate-three', 0, 0.45, 0.64) > 0)
      api.text(ctx, 'element ' + addr, x, 495, 38, C.ink, 'center');
    if (state.beat === 0 && cueFraction(state, 'byte-offset', 0, 0.78, 0.88) > 0)
      api.text(ctx, '3 elements × 8 bytes = 24 bytes', 960, 790, 55, C.yellow, 'center');
  });
  if (state.beat === 0) return;
  api.focus.target('storage-copy', () => {
    api.text(ctx, 'Flat copy', 85, 811, 38, C.green);
    if (!changed && (state.beat === 2 || count < 6))
      api.text(ctx, 'flat = y.reshape(-1)', 960, 973, 44, C.green, 'center');
    transposed.forEach((v, i) => {
      const x = cellX(i);
      api.rect(ctx, x - 110, 742, 220, 105, C.panel, i === 1 && count > 1 ? C.green : C.muted, 5);
      if (i < count) api.text(ctx, String(v), x, 817, 60, i === 1 ? C.green : C.ink, 'center');
    });
    if (copying) {
      const sourceX = cellX(transposed[count]),
        destX = cellX(count);
      const progress = copied - count;
      const fromY = bankY + 66,
        toY = 720;
      api.line(ctx, sourceX, fromY, destX, toY, C.green, 3);
      const x = sourceX + (destX - sourceX) * progress,
        y = fromY + (toY - fromY) * progress;
      api.circle(ctx, x, y, 24, C.green);
      api.text(ctx, String(transposed[count]), x, y + 12, 32, C.bg, 'center');
    }
    if (state.beat === 1 && count === 6)
      api.text(ctx, 'After y[0, 1] = 30, which three changes?', 960, 973, 46, C.yellow, 'center');
    if (changed) {
      const sharedRead = cueFraction(state, 'alias-read', 2, 0.15, 0.32) > 0;
      const copiedRead = cueFraction(state, 'flat-read', 2, 0.34, 0.52) > 0;
      api.text(
        ctx,
        'y[0, 1] = 30      x[1, 0] = ' +
          (sharedRead ? value : '?') +
          '      flat[1] = ' +
          (copiedRead ? transposed[1] : '?'),
        960,
        973,
        47,
        C.ink,
        'center',
      );
    }
  });
}
export default {
  id: 'strides',
  draw: drawStrides,
  cues: [
    'locate-three',
    'byte-offset',
    'flat-copy',
    'alias-question',
    'alias-write',
    'alias-read',
    'flat-read',
  ],
};
