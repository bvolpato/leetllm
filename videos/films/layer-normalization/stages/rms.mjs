import { ln, mean, rms, variance } from '../arithmetic.mjs';
import { epsilon, x } from '../fixtures.mjs';
import { equation, text } from '../defaults.mjs';
import { motion } from '../timing.mjs';

export function drawRms(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 3) {
    const fixed = 98, original = 2;
    const faster = original * (1 - 0.5 * motion(state, 'faster-norm', 3, 0.32, 0.48));
    const toX = time => 430 + (time - 96) * 310;
    text(ctx, api, 'Last four milliseconds of an illustrative step', 960, 308, 48, C.ink, 'center');
    for (const [i, duration] of [original, faster].entries()) {
      const y = 460 + i * 210;
      const draw = () => {
        text(ctx, api, i ? 'Trial' : 'Baseline', 125, y + 42, 39, C.ink);
        api.rect(ctx, toX(96), y, toX(fixed) - toX(96), 61, C.blue, undefined, 3);
        api.rect(ctx, toX(fixed), y, 310 * duration, 61, i ? C.green : C.cyan, undefined, 3);
        text(ctx, api, 'Other work', toX(97), y + 124, 32, C.blue, 'center');
        text(ctx, api, `Norm   ${Number(duration.toFixed(1))} ms`, toX(fixed + duration / 2), y + 124, 33, i ? C.green : C.cyan, 'center');
      };
      if (i) api.focus.target('faster-operator', draw);
      else draw();
    }
    for (const tick of [96, 97, 98, 99, 100]) text(ctx, api, `${tick} ms`, toX(tick), 938, 35, C.muted, 'center');
    return;
  }
  const offset = 5 * motion(state, 'rms-offset', 1, 0.02, 0.23);
  const values = x.map(v => v + offset);
  api.focus.target('common-offset', () => {
    text(ctx, api, 'Token features', 135, 304, 40, C.ink);
    values.forEach((value, i) => {
      const left = 465 + i * 168;
      const active = i === 2;
      api.rect(ctx, left, 224, 136, 108, active ? C.yellow : C.panel, undefined, 6);
      text(ctx, api, String(Number(value.toFixed(1))), left + 68, 300, 58, active ? C.bg : C.ink, 'center');
    });
    text(ctx, api, `Mean   ${Number(mean(values).toFixed(1))}`, 1250, 301, 44, C.ink);
    if (state.beat > 0) text(ctx, api, `Offset   +${Number(offset.toFixed(1))}`, 1520, 301, 38, C.yellow);
  });

  const position = value => 1390 + value * 470;
  const zero = position(0);
  text(ctx, api, 'Feature 3 output   ·   gain 1, shift 0', 135, 438, 35, C.ink);
  text(ctx, api, '0', zero, 440, 35, C.ink, 'center');
  api.line(ctx, zero, 458, zero, 828, C.muted, 3);

  function output(name, color, y, progress, normalize, scale, target) {
    const oldValue = normalize(x)[2];
    const after = progress > 0;
    const row = after ? values : x;
    const result = normalize(row)[2];
    const numerator = name === 'LayerNorm' ? `(${row[2]} − ${mean(row)})` : String(row[2]);
    const label = state.beat === 0 ? '' : after ? 'After   ' : 'Before   ';
    api.focus.target(target, () => {
      text(ctx, api, name, 135, y - 12, 56, color);
      text(ctx, api, `${label}${numerator} / ${scale(row).toFixed(3)}`, 135, y + 50, 38, C.ink);
      api.line(ctx, position(-1.6), y, position(0.8), y, C.muted, 2);
      const here = position(oldValue + progress * (result - oldValue));
      if (after) {
        api.line(ctx, position(oldValue), y, here, y, color, 5);
        api.circle(ctx, position(oldValue), y, 20, C.bg, color, 3);
      }
      api.circle(ctx, here, y, 13, color);
      if (progress === 0 || progress === 1)
        text(ctx, api, result.toFixed(3), here, y - 35, 42, color, 'center');
    });
  }
  const center = motion(state, 'ln-centering', 2, 0.55, 0.78);
  output('LayerNorm', C.green, 586, center,
    ln, row => Math.sqrt(variance(row) + epsilon), 'layernorm-output-values');
  output('RMSNorm', C.pink, 790, motion(state, 'rms-crossing', 2, 0.12, 0.38),
    rms, row => Math.sqrt(mean(row.map(v => v * v)) + epsilon), 'rmsnorm-output-values');

  if (state.beat === 0) {
    api.focus.target('rms-divisor-rule', () =>
      equation(ctx, api, String.raw`s_{\rm RMS}=\sqrt{(9+1+1+25)/4+\epsilon}`, 960, 969, 51, C.ink, 'center'));
  } else if (state.beat === 1) {
    text(ctx, api, 'Which output will cross zero?', 960, 975, 45, C.yellow, 'center');
  } else if (center === 1) {
    const before = x[2] - mean(x);
    const after = values[2] - mean(values);
    text(ctx, api, `Before   ${x[2]} − ${mean(x)} = ${before}          After   ${values[2]} − ${mean(values)} = ${after}`,
      960, 975, 45, C.green, 'center');
  }
}
export default { id: 'rms', draw: drawRms, cues: ['rms-rms-divisor-rule-b1-1', 'rms-offset', 'rms-crossing', 'ln-centering', 'faster-norm'] };
