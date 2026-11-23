import { cell, finished, label, progress } from '../workbench.mjs';

function ruler(ctx, api, state) {
  const { C } = api;
  const low = state.beat === 2;
  const ticks = [1023.5, 1024, 1025];
  const exact = low ? 1024 - 0.375 : 1024 + 0.25;
  const half = ticks.reduce((nearest, v) =>
    Math.abs(v - exact) < Math.abs(nearest - exact) ? v : nearest);
  const pos = (v) => 540 + (v - 1023.5) * 790;
  const proposed = finished(state, low ? 2 : 0, low ? 'exact-below' : 'exact-above');
  const movement = progress(state, low ? 2 : 1, low ? 'round-below' : 'round-above');
  const stored = finished(state, low ? 2 : 1, low ? 'round-below' : 'round-above');
  label(ctx, api, proposed ? (low ? '1024 − 0.375' : '1024 + 0.25') : 'Starting sum   1024', 960, 292, 55, C.ink);
  for (const [name, y, result, color] of [['FP16', 528, half, C.pink], ['FP32', 776, Math.fround(exact), C.cyan]]) {
    label(ctx, api, name, 355, y + 12, 43, color, 'right');
    api.line(ctx, 454, y, 1810, y, C.muted, 3);
    for (const v of ticks) {
      api.line(ctx, pos(v), y - 12, pos(v), y + 15, C.ink, 3);
      label(ctx, api, v, pos(v), y + 58, 30, C.ink);
    }
    if (proposed) api.line(ctx, pos(exact), y - 40, pos(exact), y + 20, C.yellow, 4);
    api.circle(ctx, pos(1024 + (result - 1024) * movement), y, 12, color);
    const movingX = pos(1024 + (result - 1024) * movement);
    label(ctx, api, stored ? `stored ${result}` : movement > 0 ? 'storing' : 'stored 1024', movingX, y - 68, 32, color);
  }
  label(ctx, api, proposed && !stored ? 'Which stored value will move?' : 'Same scale on both lines · round to nearest', 960, 950, 32, C.ink);
}

export function drawPrecisionContract(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('precision-paths', () => {
    if (state.beat < 3) return ruler(ctx, api, state);
    const original = Math.fround(1.0001);
    const reference = original - 1;
    const candidate = 0;
    const rounded = finished(state, 3, 'input-quantize');
    const candidateKnown = finished(state, 4, 'candidate-zero');
    const tested = finished(state, 4, 'rounded-zero');
    const compared = finished(state, 4, 'dual-reference');
    const errorKnown = finished(state, 4, 'precision-error-result');
    label(ctx, api, 'A = [1.0001, 1]       B = [1, −1]ᵀ', 960, 300, 48, C.ink);
    for (const [target, name, y, operand, result, color] of [
      ['original-reference', 'Original FP32 inputs', 470, '1.0001 × 1 + 1 × (−1)', compared ? reference.toFixed(8) : '?', C.blue],
      ['rounded-reference', 'FP16 inputs', 687, rounded ? '1 × 1 + 1 × (−1)' : 'convert A and B', tested ? 0 : '?', C.pink],
    ]) {
      label(ctx, api, name, 487, y + 63, 33, color, 'right');
      cell(ctx, api, operand, 545, y, 625, 107, color, 40);
      label(ctx, api, '=', 1230, y + 70, 43, C.ink);
      api.focus.target(target, () => cell(ctx, api, result, 1295, y, 356, 107, color, 40));
    }
    const candidateLabel = tested ? 'Kernel output 0 · absolute error on rounded inputs = 0' : 'Kernel output 0';
    label(ctx, api, candidateKnown ? candidateLabel : 'Both reference sums use FP64', 960, 895, 32, C.ink);
    if (errorKnown) {
      const value = reference.toFixed(8);
      const fraction = `Relative error on original inputs = |0 − ${value}| / ${value}`;
      const percent = 100 * Math.abs(candidate - reference) / Math.abs(reference);
      api.focus.target('original-reference', () =>
        label(ctx, api, `${fraction} = ${percent}%`, 960, 969, 36, C.blue));
    }
  });
}
export default { id: 'precision-contract', draw: drawPrecisionContract, cues: ['exact-above', 'round-above', 'exact-below', 'round-below', 'input-quantize', 'candidate-zero', 'rounded-zero', 'dual-reference', 'precision-error-result'] };
