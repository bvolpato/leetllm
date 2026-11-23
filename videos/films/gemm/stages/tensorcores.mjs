import { A, B } from '../fixtures.mjs';
import { partialProduct } from '../model.mjs';
import { bf16 } from '../arithmetic.mjs';
import { cell, finished, label } from '../workbench.mjs';

function fragment(ctx, api, x, y, rows, cols, color, crop = false) {
  const pitch = 14;
  api.rect(ctx, x - 2, y - 2, (crop ? cols : 16) * pitch + 4, (crop ? rows : 16) * pitch + 4, api.C.panel, api.C.muted, 2);
  for (let i = 0; i < (crop ? rows : 16); i++) {
    for (let j = 0; j < (crop ? cols : 16); j++) {
      api.rect(ctx, x + pitch * j, y + pitch * i, pitch - 2, pitch - 2,
        i < rows && j < cols ? color : '#373941', undefined, 0);
    }
  }
}

export function drawTensorcores(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('warp-fragment', () => {
    if (state.beat === 0) {
      const count = finished(state, 0, 'warp-add') ? 2 : 1;
      const k = count - 1;
      const before = partialProduct(0, k), after = partialProduct(0, count);
      const blocks = [
        ['A column', A.map((r) => [r[k]]), C.blue, 237],
        ['B row', [B[k]], C.pink, 530],
        ['Prior sums', before, C.yellow, 1020],
        ['Updated sums', after, C.cyan, 1470],
      ];
      for (const [name, values, color, x] of blocks) {
        label(ctx, api, name, x + values[0].length * 54 - 4, 410, 35, color);
        values.forEach((r, i) => r.forEach((v, j) => cell(ctx, api, v, x + 108 * j, 467 + i * 108, 100, 96, color)));
      }
      for (const [v, x] of [['×', 433], ['+', 888], ['=', 1350]]) label(ctx, api, v, x, 570, 52, C.ink);
      label(ctx, api, 'Two steps of the arithmetic inside D = AB + C', 960, 815, 38, C.ink);
      label(ctx, api, 'The lab maps a 16 × 16 × 16 tile to a whole warp', 960, 942, 33, C.cyan);
      return;
    }
    if (state.beat === 1) {
      const product = bf16(1.125) * bf16(1.25);
      const wide = Math.fround(1024 + product);
      label(ctx, api, 'Exactly representable BF16 inputs', 960, 345, 38, C.ink);
      cell(ctx, api, '1.125', 465, 407, 335, 130, C.blue, 54);
      label(ctx, api, '×', 960, 490, 55, C.ink);
      cell(ctx, api, '1.25', 1120, 407, 335, 130, C.pink, 54);
      label(ctx, api, `Prior FP32 sum   1024   +   ${product}`, 960, 677, 46, C.yellow);
      if (finished(state, 1, 'wide-sum')) {
        label(ctx, api, `FP32   ${wide}       →       stored as BF16   ${bf16(wide)}`, 960, 845, 45, C.cyan);
      }
      return;
    }

    const m = 73, n = 61, k = 67, tile = 16;
    const rows = m % tile, cols = n % tile, tail = k % tile;
    const last = finished(state, 2, 'tail-panel');
    const cropped = finished(state, 3, 'crop-fragment');
    label(ctx, api, `M = ${m}      N = ${n}      K = ${k}`, 960, 277, 38, C.ink);
    const slots = Math.ceil(k / tile);
    for (let p = 0; p < slots; p++) {
      const x = 368 + p * 240;
      const active = p === (last ? slots - 1 : 0);
      const real = Math.min(tile, k - p * tile);
      api.rect(ctx, x, 330, 220, 43, C.panel, C.muted, 3);
      api.rect(ctx, x, 330, 220 * real / tile, 43, active ? C.yellow : C.muted, undefined, 2);
      label(ctx, api, `k = ${p * tile}–${p * tile + real - 1}`, x + 110, 421, 27, active ? C.yellow : C.muted);
    }
    const width = last ? tail : tile;
    for (const [name, x, r, c, color] of [
      ['A', 287, rows, width, C.blue], ['B', 847, width, cols, C.pink], ['C', 1407, rows, cols, C.cyan],
    ]) {
      label(ctx, api, `${name} · ${r} × ${c} useful`, x + 112, 536, 34, color);
      fragment(ctx, api, x, 574, r, c, color, cropped && name === 'C');
    }
    label(ctx, api, '×', 674, 709, 55, C.ink);
    label(ctx, api, '→', 1231, 709, 55, C.ink);
    label(ctx, api, cropped ? 'Store the aligned fragment, then crop to 9 rows × 13 columns' :
      'Output tile starts at row 64, column 48 · gray cells are padding', 960, 950, 35, C.ink);
  });
}
export default { id: 'tensorcores', draw: drawTensorcores, cues: ['warp-add', 'wide-sum', 'tail-panel', 'crop-fragment'] };
