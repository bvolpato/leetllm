import { operation } from '../construction.mjs';
import { below, weightHistory } from '../weight-ruler.mjs';

const history = weightHistory(6);

export function drawUpdate(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const step =
    beat === 0
      ? Math.floor(2 * operation(state, 'two-updates'))
      : beat === 1
        ? 2 + Math.floor(operation(state, 'third-update'))
        : 3 + Math.floor(3 * operation(state, 'six-updates'));
  const current = history[step];
  const x = (i) => 390 + i * 208;
  const y = (v) => 440 + (1 - v) * 545000;
  api.text(ctx, 'Subtract 0.0001 each time', 110, 255, 37, C.ink);
  api.text(ctx, 'FP32 weight', 1040, 255, 34, C.cyan, 'center');
  api.text(ctx, 'FP16 compute copy', 1540, 255, 34, C.yellow, 'center');
  api.text(ctx, 'Stored weight', 110, 375, 29, C.muted);
  if (beat === 0 && step === 2) {
    api.text(ctx, 'Has the FP32 weight crossed the midpoint?', 1080, 365, 35, C.ink, 'center');
  }
  for (const value of [1, (1 + below) / 2, below]) {
    const mid = value !== 1 && value !== below;
    api.line(ctx, x(0), y(value), x(6), y(value), mid ? C.pink : C.muted, 2);
    api.text(
      ctx,
      mid ? 'FP16 midpoint' : value === 1 ? '1' : value.toFixed(8),
      x(0) - 35,
      y(value) + 9,
      29,
      mid ? C.pink : C.ink,
      'right',
    );
  }
  api.focus.target('update-trace', () => {
    for (let i = 0; i <= step; i++) {
      const row = history[i];
      if (i > 0) {
        const prev = history[i - 1];
        api.line(ctx, x(i - 1), y(prev.master), x(i), y(row.master), C.cyan, 5);
        api.line(ctx, x(i - 1), y(prev.copy), x(i), y(prev.copy), C.yellow, 5);
        if (row.copy !== prev.copy)
          api.line(ctx, x(i), y(prev.copy), x(i), y(row.copy), C.yellow, 5);
      }
      api.circle(ctx, x(i), y(row.copy), 9, C.yellow);
      api.circle(ctx, x(i), y(row.master), 6, C.cyan);
    }
  });
  for (let i = 0; i <= 6; i++)
    api.text(ctx, String(i), x(i), 830, 31, i === step ? C.ink : C.muted, 'center');
  api.text(ctx, 'Optimizer step', x(6) + 45, 881, 29, C.muted, 'right');
  const cells = [
    ['Direct FP16 update', current.direct, C.blue],
    ['FP32 weight', current.master, C.cyan],
    ['Refreshed FP16 copy', current.copy, C.yellow],
  ];
  cells.forEach(([name, value, color], i) => {
    const center = 360 + i * 595;
    api.text(ctx, name, center, 938, 30, color, 'center');
    api.text(ctx, value === 1 ? '1' : value.toFixed(8), center, 1000, 46, color, 'center');
  });
}
export default {
  id: 'update',
  draw: drawUpdate,
  cues: ['two-updates', 'third-update', 'six-updates'],
};
