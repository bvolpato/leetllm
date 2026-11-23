import { A, B } from './fixtures.mjs';
import { partialProduct } from './model.mjs';
import { cell, label } from './workbench.mjs';

function source(ctx, api, matrix, x, y, name, color, selected) {
  label(ctx, api, name, x, y - 38, 32, color, 'left');
  matrix.forEach((row, i) => row.forEach((value, j) => {
    const lit = selected(i, j);
    cell(ctx, api, value, x + 98 * j, y + 89 * i, 86, 75, lit ? color : api.C.muted, 36,
      lit ? api.C.panel : api.C.bg);
  }));
}

// Each column header is one B operand. Each row header is one A operand.
// The four pale cells retain their positions as successive k values arrive.
export function drawPanel(ctx, api, k, count, routes, note, selected) {
  const { C } = api;
  const sums = partialProduct(0, count);
  api.focus.target('panel-loom', () => {
    source(ctx, api, A, 125, 320, 'A', C.blue, (_, j) => j === k);
    source(ctx, api, B, 125, 625, 'B', C.pink, (i) => i === k);
    const panelStart = k < 2 ? 0 : 2;
    const panelWidth = k < 2 ? 2 : 1;
    const ax = 125 + 98 * panelStart;
    const axEnd = ax + 98 * (panelWidth - 1) + 86;
    api.line(ctx, ax, 508, axEnd, 508, C.blue, 3);
    api.line(ctx, ax, 493, ax, 508, C.blue, 3);
    api.line(ctx, axEnd, 493, axEnd, 508, C.blue, 3);
    const by = 625 + 89 * panelStart;
    const byEnd = by + 89 * (panelWidth - 1) + 75;
    api.line(ctx, 331, by, 331, byEnd, C.pink, 3);
    api.line(ctx, 316, by, 331, by, C.pink, 3);
    api.line(ctx, 316, byEnd, 331, byEnd, C.pink, 3);
    label(ctx, api, `k = ${k}`, 735, 338, 40, C.ink);
    for (let j = 0; j < B[0].length; j++) {
      const x = 980 + 365 * j;
      label(ctx, api, `column ${j}`, x + 149, 265, 30, C.pink);
      cell(ctx, api, B[k][j], x + 68, 291, 162, 93, C.pink, 47);
      if (routes > 0) api.line(ctx, x + 149, 385, x + 149, 385 + routes * 423, C.pink, 4);
    }
    for (let i = 0; i < A.length; i++) {
      const y = 445 + 224 * i;
      label(ctx, api, `row ${i}`, 705, y + 33, 29, C.blue, 'right');
      cell(ctx, api, A[i][k], 752, y - 12, 145, 96, C.blue, 47);
      if (routes > 0) api.line(ctx, 898, y + 37, 898 + routes * 740, y + 37, C.blue, 4);
    }
    for (let i = 0; i < A.length; i++) {
      for (let j = 0; j < B[0].length; j++) {
        const x = 980 + 365 * j, y = 413 + 224 * i;
        const delta = A[i][k] * B[k][j];
        const changed = count === A[0].length && delta !== 0;
        const named = selected?.[0] === i && selected[1] === j;
        const color = changed || named ? C.yellow : C.cyan;
        api.rect(ctx, x, y, 298, 175, changed ? '#302b20' : C.panel, color, 8);
        const tag = changed ? `C[${i},${j}]    +${delta}` : `C[${i},${j}]`;
        label(ctx, api, tag, x + 149, y + 48, 29, color);
        label(ctx, api, sums[i][j], x + 149, y + 137, 67, C.ink);
      }
    }
    label(ctx, api, note, 1175, 948, 35, C.yellow);
  });
}
