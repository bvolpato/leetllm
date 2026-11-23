import { registerDemand } from '../arithmetic.mjs';
import { cell, finished, label, progress } from '../workbench.mjs';

export function drawRegisterBlocking(ctx, scene, state, api) {
  const { C } = api;
  const square = state.beat >= 1;
  const rows = square ? 8 : 1, cols = square ? 8 : 4;
  const demand = registerDemand(rows, cols);
  const step = square ? 1 : 0;
  const live = Math.floor(rows * cols * progress(state, step, square ? 'register-square' : 'register-reuse'));
  const ready = finished(state, step, square ? 'register-result-square' : 'register-result');
  const w = square ? 84 : 198, h = square ? 54 : 147;
  const left = square ? 647 : 631, top = square ? 376 : 494;
  api.focus.target('register-grid', () => {
    label(ctx, api, `One thread · ${rows} × ${cols} output tile`, 960, 263, 41, C.ink);
    for (let j = 0; j < cols; j++) {
      cell(ctx, api, `B${j}`, left + j * w, top - (square ? 66 : 118), w - 8, square ? 52 : 90, C.pink, square ? 27 : 42);
    }
    for (let i = 0; i < rows; i++) {
      cell(ctx, api, `A${i}`, left - w - 20, top + i * h, w - 8, h - 8, C.blue, square ? 27 : 42);
      for (let j = 0; j < cols; j++) {
        const active = i * cols + j < live;
        cell(ctx, api, active ? '+=' : '·', left + j * w, top + i * h, w - 8, h - 8, active ? C.cyan : C.muted, square ? 28 : 48);
      }
    }
    if (state.beat === 2) {
      label(ctx, api, '64 live sums', 1547, 552, 37, C.cyan);
      label(ctx, api, '+ temporary values', 1547, 613, 29, C.muted);
    }
  });
  api.focus.target('gemm-register-demand', () => {
    const expression = `${demand.flops} FLOPs / ${demand.bytes} operand bytes`;
    label(ctx, api, ready ? `${expression} = ${demand.ratio} FLOP/B` : expression,
      960, 914, 40, C.yellow);
  });
  label(ctx, api, 'FP32 operands requested by one thread for one reduction step', 960, 993, 30, C.muted);
}
export default { id: 'register-blocking', draw: drawRegisterBlocking, cues: ['register-reuse', 'register-result', 'register-square', 'register-result-square', 'register-pressure'] };
