import { fp16, bf16 } from '../arithmetic.mjs';
import { operation } from '../construction.mjs';

const inputs = [1.2e-8, 100000].map(Math.fround);
const logX = (value) => 420 + (Math.log10(value) + 9) * 88;
const format = (value) =>
  value === Infinity
    ? '∞'
    : value === 0
      ? '0'
      : value < 1
        ? value.toExponential(2)
        : value.toLocaleString('en-US');

export function drawRangeCheck(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const { C } = api;
  const large = beat === 0 ? operation(state, 'range-large') : 1;
  api.text(ctx, 'Input magnitude on a logarithmic scale', 120, 275, 34, C.muted);
  api.line(ctx, logX(1e-9), 440, logX(1e6), 440, C.muted, 3);
  const limits = [
    [2 ** -25, 'Half the first FP16 step'],
    [65504, 'FP16 maximum'],
  ];
  for (const [value, name] of limits) {
    const x = logX(value);
    api.line(ctx, x, 391, x, 466, C.pink, 3);
    api.text(ctx, name, x, 365, 30, C.pink, 'center');
  }
  const headers = ['Backward gradient', 'Forward activation'];
  inputs.forEach((value, i) => {
    if (i === 1 && !large) return;
    const x = logX(value);
    api.focus.target(i ? 'activation-input' : 'gradient-input', () => {
      api.circle(ctx, x, 440, 13, C.yellow);
      api.text(ctx, i ? '100,000' : '1.2 × 10⁻⁸', x, 515, 39, C.yellow, 'center');
    });
  });
  const smallX = 780,
    bigX = 1435;
  [smallX, bigX].forEach((x, i) => api.text(ctx, headers[i], x, 640, 35, C.ink, 'center'));
  for (const [i, cast] of [fp16, bf16].entries()) {
    const y = 761 + i * 136;
    const color = i ? C.cyan : C.blue;
    const ready =
      beat > i + 1 || (beat === i + 1 && operation(state, i ? 'range-wide' : 'range-half') === 1);
    api.focus.target(i ? 'bf16-casts' : 'fp16-casts', () => {
      api.text(ctx, i ? 'BF16' : 'FP16', 200, y, 43, color);
      inputs.forEach((v, j) =>
        api.text(
          ctx,
          ready ? format(cast(v)) : '?',
          j ? bigX : smallX,
          y,
          49,
          ready ? color : C.muted,
          'center',
        ),
      );
    });
  }
  const caption =
    beat === 0
      ? 'What does FP16 store for each input?'
      : beat === 1
        ? 'The forward cast happens before loss scaling.'
        : 'Choose a forward dtype that can hold the activation.';
  api.text(ctx, caption, 960, 1012, 34, C.ink, 'center');
}
export default {
  id: 'range-check',
  draw: drawRangeCheck,
  cues: ['range-large', 'range-half', 'range-wide'],
};
