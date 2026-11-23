import { recipeLedger } from '../model.mjs';
import { gbX, memoryAxis, memoryRow, onWords } from '../card-memory.mjs';

function drawPrecision(ctx, api, state) {
  const { C } = api;
  const second = state.beat === 4;
  const decrement = second ? 1e-4 : 1e-8;
  const delta = Math.fround(1 - Math.fround(decrement)) - 1;
  const motion = onWords(state, api, second ? 4 : 3, second ? 'larger-store' : 'tiny-store', 0.27, 0.56);
  const baseX = 1390;
  const scale = 750 / 1e-4;
  api.text(ctx, second ? 'Trial 2     1.0 − 0.0001' : 'Trial 1     1.0 − 0.00000001',
    120, 280, 48, C.ink);
  api.text(ctx, 'Subtract in FP32, then round to the storage dtype', 120, 356, 31, C.muted);
  api.text(ctx, 'Stored weight', 225, 459, 31, C.muted);
  api.text(ctx, '0.9999', baseX - 750, 459, 32, C.ink, 'center');
  api.text(ctx, '1.0', baseX, 459, 32, C.ink, 'center');
  api.text(ctx, 'Gap below 1', 1690, 459, 30, C.muted, 'center');
  for (const [i, [name, exponent, color]] of [
    ['FP32', 24, C.blue], ['FP16', 11, C.cyan], ['BF16', 8, C.green],
  ].entries()) {
    const y = 553 + i * 139;
    // Both trials remain within the binade immediately below one.
    const gap = 2 ** -exponent;
    const stored = 1 + Math.round(delta / gap) * gap;
    api.text(ctx, name, 250, y + 13, 39, color);
    api.line(ctx, baseX - 818, y, baseX + 48, y, C.muted, 3);
    api.line(ctx, baseX - 750, y - 12, baseX - 750, y + 12, C.muted, 3);
    api.line(ctx, baseX, y - 15, baseX, y + 15, C.ink, 3);
    api.focus.target('stored-update', () => {
      const x = baseX + (stored - 1) * scale * motion;
      api.circle(ctx, x, y, 16, color);
      if (motion === 1)
        api.text(ctx, stored === 1 ? '1.0' : '≈ ' + stored.toFixed(7), x, y + 60, 30, color, 'center');
    });
    api.text(ctx, ['2⁻²⁴', '2⁻¹¹', '2⁻⁸'][i], 1690, y + 13, 37, color, 'center');
  }
  api.text(ctx, 'All three tracks use the same magnification.', 960, 985, 32, C.muted, 'center');
}

export function drawRealLedger(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat ?? 0;
  const ledger = recipeLedger(70, 16);
  if (b > 2) return drawPrecision(ctx, api, state);
  if (b === 2) {
    api.text(ctx, '70B parameters   /   16 equal shards', 120, 280, 42, C.ink);
    const q = onWords(state, api, 2, 'state-share', 0.1, 0.32);
    memoryAxis(ctx, api, 538, 774);
    api.focus.target('state-share', () => {
      memoryRow(ctx, api, 603, 'One rank', [
        [ledger.parts.weights * q, C.blue], [ledger.parts.gradients * q, C.pink],
        [ledger.parts.optimizer * q, C.yellow],
      ]);
      if (q === 1) {
        api.text(ctx, '1,120 GB ÷ 16 = 70 GB', gbX(0), 757, 40, C.ink);
        api.text(ctx, '10 GB free', gbX(80) + 35, 655, 35, C.yellow);
      }
    });
    api.text(ctx, 'Model state at this step  /  activations and temporary copies still to count',
      960, 950, 31, C.muted, 'center');
    return;
  }

  const parts = [
    ['Compute weight', 2, C.blue, 1, 'weight-bytes'],
    ['Gradient', 2, C.pink, onWords(state, api, 0, 'add-gradient', 0.12, 0.24), 'gradient-bytes'],
    ['Master weight', 4, C.yellow, onWords(state, api, 0, 'add-master', 0.36, 0.5), 'master-bytes'],
    ['Adam m', 4, C.yellow, onWords(state, api, 0, 'add-moments', 0.5, 0.7), 'moment-bytes'],
    ['Adam v', 4, C.yellow, onWords(state, api, 0, 'add-moments', 0.5, 0.7), 'moment-bytes'],
  ];
  api.text(ctx, b === 0 ? 'One parameter' : '70 billion parameters', 120, 310, 49, C.ink);
  const pitch = 98;
  let x = 176;
  for (const [label, size, color, q, target] of parts) {
    const center = x + (size * pitch - 10) / 2;
    api.focus.target(target, () => {
      for (let i = 0; i < size; i++) {
        api.rect(ctx, x + pitch * i, 445, pitch - 10, 133, C.panel, C.muted, 3);
        if (q > 0) api.rect(ctx, x + pitch * i, 445, (pitch - 10) * q, 133, color, undefined, 2);
      }
      if (q > 0) {
        api.text(ctx, label, center, 650, 29, color, 'center');
        api.text(ctx, b === 0 ? size + ' bytes' : size * 70 + ' GB', center, 724, 41, C.ink, 'center');
      }
    });
    x += size * pitch;
  }
  if (b === 0 && parts.at(-1)[3] === 1)
    api.text(ctx, '2 + 2 + 4 + 4 + 4 = 16 bytes per parameter', 960, 925, 44, C.ink, 'center');
  if (b === 1) {
    api.line(ctx, 574, 792, 1729, 792, C.yellow, 4);
    api.text(ctx, 'Master + moments  =  ' + ledger.full.optimizer + ' GB', 1152, 850, 38, C.yellow, 'center');
    api.focus.target('inventory-total', () => {
      const total = Object.values(ledger.full).reduce((a, v) => a + v, 0);
      if (onWords(state, api, 1, 'sum-inventory', 0.7, 0.82) > 0)
        api.text(ctx, total.toLocaleString('en-US') + ' GB of model state', 960, 980, 48, C.ink, 'center');
      else api.text(ctx, 'Model-state inventory', 960, 980, 33, C.muted, 'center');
    });
  }
}

export default {
  id: 'real-ledger', draw: drawRealLedger,
  cues: ['add-gradient', 'add-master', 'add-moments', 'sum-inventory', 'state-share', 'tiny-store', 'larger-store'],
};
