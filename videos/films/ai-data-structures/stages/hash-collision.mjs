import { collisionWorksheet } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawCard, drawText, withFocus } from '../defaults.mjs';

const original = collisionWorksheet();
const overwritten = collisionWorksheet(true);
const sum = (word) => [...word].reduce((total, letter) => total + letter.charCodeAt(0), 0);

export function drawHashCollision(ctx, scene, state, api) {
  const { C } = api;
  const bucket = q(state, 'ds-hash-collision-0', 0);
  const probe = q(state, 'ds-hash-collision-1', 1);
  const overwrite = q(state, 'ds-hash-collision-2', 2);
  const repair = q(state, 'hash-restore', 3);
  const numeric = state.beat >= 2 && repair < 1;
  const keys = original.entries.map(([word]) => word);
  withFocus(ctx, api, 'ds-hash-collision-mechanism', () => {
    drawText(ctx, api, 'Two buckets  /  sum of letter codes modulo 2', 155, 287, 35, C.ink);
    keys.forEach((word, i) => {
      const finished = bucket * 2 >= i + 1;
      drawText(ctx, api, word, 160, 437 + i * 167, 43, C.ink);
      drawText(ctx, api, sum(word) + ' mod 2', 160, 492 + i * 167, 30, C.muted);
      api.line(ctx, 375, 433 + i * 167, 685, 433 + i * 167, C.muted, 3);
      const p = api.clamp(bucket * 2 - i);
      if (p > 0 && !numeric) {
        api.line(ctx, 375, 433 + i * 167, 375 + 310 * p, 433 + i * 167, C.yellow, 4);
        drawCard(ctx, api, finished ? '0' : '…', 705, 399 + i * 167, 96, 66, C.yellow);
      }
    });
    drawText(ctx, api, 'Bucket 0', 985, 369, 38, C.yellow);
    api.rect(ctx, 932, 401, 842, 294, C.panel, C.muted, 14);
    const row = (key, ids, i, color) => {
      drawCard(ctx, api, key, 965, 437 + 132 * i, 240, 78, color, 1, 33);
      ids.forEach((id, index) =>
        drawCard(
          ctx,
          api,
          'M' + id,
          1250 + index * 164,
          437 + 132 * i,
          140,
          78,
          id === 3 ? C.yellow : C.cyan,
          1,
          33,
        ),
      );
    };
    if (numeric) {
      row('0', overwrite > 0 ? overwritten.charged : original.charged, 0, C.yellow);
      if (overwrite > 0 && overwrite < 1) {
        const p = overwrite;
        ctx.save();
        ctx.globalAlpha *= 1 - p;
        drawCard(ctx, api, 'M3', 1578, 437 + 154 * p, 140, 78, C.pink, 1, 33);
        ctx.restore();
      }
    } else {
      original.entries.forEach(([key, ids], i) => {
        const checked = state.beat === 1 && probe > i / 2;
        if (bucket * 2 >= i + 1) row(key, ids, i, checked ? (i === 0 ? C.pink : C.green) : C.cyan);
      });
    }
    drawText(ctx, api, 'Bucket 1     empty', 973, 760, 30, C.muted);
    if (state.beat === 1)
      drawText(
        ctx,
        api,
        probe === 1 ? 'twice = twice' : probe > 0 ? 'twice ≠ charged' : 'Looking for “twice”',
        155,
        862,
        39,
        C.ink,
      );
    if (state.beat >= 2)
      drawText(
        ctx,
        api,
        numeric ? 'Dictionary key: bucket number' : 'Saved postings restored by word',
        155,
        863,
        34,
        numeric ? C.yellow : C.green,
      );
    if (overwrite === 1 && repair === 0)
      drawText(ctx, api, 'Search “charged”    →    M0, M2', 975, 867, 36, C.pink);
    if (repair === 1)
      drawText(ctx, api, 'Search “charged”    →    M0, M2, M3', 975, 867, 36, C.green);
  });
}

export default {
  id: 'hash-collision',
  draw: drawHashCollision,
  cues: ['ds-hash-collision-0', 'ds-hash-collision-1', 'ds-hash-collision-2', 'hash-restore'],
};
