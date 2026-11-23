import { chapterPanel } from './defaults.mjs';
import { clamp01 } from './arithmetic.mjs';

const vector = (v) => '[' + v.join(', ').replaceAll('-', '−') + ']';
const sourceX = (i) => 490 + i * 290;
const packedX = (i) => 520 + i * 370;

// Both bases keep their original IDs as the selected features slide into physical slots.
export function drawHeadComparison(
  ctx,
  api,
  f,
  { values, pack, sumA, sumB, inputTarget, sourceTarget, aTarget, bTarget },
) {
  const { C } = api;
  const txt = (s, x, y, size, c = C.ink) => api.text(ctx, s, x, y, size, c, 'center');
  api.focus.target(inputTarget, () => {
    api.text(ctx, 'Token  x = ' + vector(f.input), 130, 248, 45, C.yellow);
    api.text(ctx, 'One scalar per head in this example', 1790, 248, 33, C.muted, 'right');
  });
  api.focus.target(sourceTarget, () => {
    api.text(ctx, 'Weight row', 130, 405, 31, C.muted);
    api.text(ctx, 'Row × token', 130, 480, 31, C.muted);
    f.rows.forEach((row, i) => {
      const x = sourceX(i);
      txt('H' + i, x, 335, 33, C.blue);
      txt(vector(row), x, 405, 39);
      txt(
        values >= (i + 1) / f.rows.length ? String(f.contributions[i]).replace('-', '−') : '·',
        x,
        482,
        49,
        C.cyan,
      );
    });
  });
  for (const [name, ready, target, y] of [
    ['A', sumA, aTarget, 590],
    ['B', sumB, bTarget, 730],
  ]) {
    api.focus.target(target, () => {
      const ids = f.selected[name];
      api.text(ctx, 'Base ' + name, 130, y + 58, 43, C.ink);
      ids.forEach((id, slot) => {
        const x = api.lerp(sourceX(id), packedX(slot), pack);
        const color = slot === 1 && pack === 1 ? C.yellow : C.blue;
        const value =
          values >= (id + 1) / f.rows.length ? String(f.contributions[id]).replace('-', '−') : '?';
        chapterPanel(ctx, api, C, 'H' + id + '    ' + value, x - 99, y, 198, 86, color, 39);
      });
      txt(
        ready ? 'sum = ' + f.outputs[name] : 'sum = ?',
        1645,
        y + 60,
        43,
        ready ? C.cyan : C.muted,
      );
    });
  }
}

export function drawShiftedCases(ctx, api, passed, cases, required, progress) {
  const { C } = api;
  const start = 579,
    width = 51,
    gap = 14;
  for (let i = 0; i < cases; i++) {
    const filled = clamp01(progress * cases - i);
    api.rect(ctx, start + i * (width + gap), 915, width, 54, C.panel, C.muted, 3);
    if (filled > 0)
      api.rect(
        ctx,
        start + i * (width + gap) + 3,
        918,
        (width - 6) * filled,
        48,
        i < passed ? C.green : C.pink,
        undefined,
        2,
      );
  }
  const boundary = start + required * (width + gap) - gap / 2;
  api.line(ctx, boundary, 900, boundary, 980, C.yellow, 4);
  api.text(ctx, 'Need ' + required + ' passes', boundary, 1024, 29, C.yellow, 'center');
}
