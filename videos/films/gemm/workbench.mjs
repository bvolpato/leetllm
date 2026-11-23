import { phaseCue } from './construction.mjs';

export function finished(state, beat, id) {
  if (state.beat !== beat) return state.beat > beat;
  if (state.cues?.[id]) return state.cues[id].phase === 'after';
  return (state.beatP ?? 0) >= 0.93;
}

export function progress(state, beat, id) {
  return phaseCue(state, beat, id);
}

export function label(ctx, api, value, x, y, size, color, align = 'center') {
  return api.text(ctx, String(value), x, y, size, color, align);
}

export function cell(ctx, api, value, x, y, width, height, color, size = 42, fill = api.C.panel) {
  return api.components.card({
    label: String(value), x, y, width, height, fontSize: size,
    stroke: color, textColor: color, fill, padding: 8, radius: 8,
  });
}

export function operandPairs(ctx, api, { a, b, row, col, products, active = [], skipped = [], operand, grouping = false }) {
  const { C } = api;
  const width = a.length === 5 ? 208 : 292;
  const stride = width + 24;
  const center = a.length === 5 ? 1160 : 1080;
  const start = center - (a.length * stride - 24) / 2;
  for (const [name, y, color] of [[`A · row ${row}`, 418, C.blue], [`B · column ${col}`, 562, C.pink], ['Product', 720, C.ink]]) {
    label(ctx, api, name, start - 42, y, 35, color, 'right');
  }
  for (let k = 0; k < a.length; k++) {
    const x = start + k * stride;
    const missing = skipped.includes(k);
    const accent = active.includes(k);
    const aLost = missing && operand === 'A';
    const bLost = missing && operand === 'B';
    label(ctx, api, `k = ${k}`, x + width / 2, 308, 30, C.muted);
    cell(ctx, api, aLost ? `${a[k]} → 0` : a[k], x, 345, width, 108, aLost ? C.red : C.blue, 47, operand === 'A' && accent && !aLost ? '#243349' : C.panel);
    label(ctx, api, '×', x + width / 2, 499, 31, C.muted);
    cell(ctx, api, bLost ? `${b[k]} → 0` : b[k], x, 509, width, 96, bLost ? C.red : C.pink, 47, operand === 'B' && accent ? '#3d2535' : C.panel);
    api.line(ctx, x + 16, 635, x + width - 16, 635, accent ? C.yellow : C.muted, accent ? 5 : 2);
    label(ctx, api, products[k] ?? '·', x + width / 2, 724, 57, missing ? C.red : accent ? C.yellow : C.ink);
  }
  if (grouping) {
    for (let k = 0; k < a.length; k += 2) {
      const x = start + k * stride;
      const end = x + Math.min(2, a.length - k) * stride - 24;
      api.line(ctx, x, 779, end, 779, C.cyan, 4);
      api.line(ctx, x, 761, x, 779, C.cyan, 4);
      api.line(ctx, end, 761, end, 779, C.cyan, 4);
    }
  }
}

export function runningSum(ctx, api, name, value, note, color = api.C.cyan) {
  label(ctx, api, name, 805, 898, 40, api.C.ink, 'right');
  cell(ctx, api, value, 855, 807, 215, 122, color, 60);
  label(ctx, api, note, 1120, 887, 32, color, 'left');
}

export function outputOwners(ctx, api, rows, cols) {
  const { C } = api;
  label(ctx, api, 'Thread block', 197, 322, 31, C.ink);
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const valid = ty < rows && tx < cols;
      const x = 91 + 108 * tx, y = 355 + 111 * ty;
      api.rect(ctx, x, y, 100, 100, valid ? C.panel : C.bg, tx === 1 && ty === 1 ? C.yellow : C.muted, 5);
      label(ctx, api, `T${ty}${tx}`, x + 50, y + 45, 31, valid ? C.cyan : C.muted);
      label(ctx, api, valid ? 'store' : 'no store', x + 50, y + 79, 20, valid ? C.cyan : C.muted);
    }
  }
}
