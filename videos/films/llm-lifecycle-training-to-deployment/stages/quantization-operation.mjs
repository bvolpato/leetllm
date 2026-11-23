import { quantizationToy } from '../arithmetic.mjs';
import { sceneCues } from '../picture.mjs';

const weights = [-0.84, -0.22, 0.05, 0.41, 0.96];
const grid = Math.max(...weights.map(Math.abs)) / 127;
const codes = weights.map((w) => Math.round(w / grid));
const restored = codes.map((q) => q * grid);
const maxError = Math.max(...weights.map((w, i) => Math.abs(w - restored[i])));

function dotText(w, x) {
  return w.map((value, i) => value + ' × ' + x[i]).join('  +  ');
}

function outputRuler(ctx, api, cue, q) {
  const { C } = api;
  const x = (v) => 300 + (v - 2.3) * 2000;
  const y = 700;
  api.line(ctx, x(2.3), y, x(3), y, C.muted, 4);
  for (let tick = 23; tick <= 30; tick++) {
    const pos = x(tick / 10);
    api.line(ctx, pos, y - 10, pos, y + 14, C.muted, 2);
    api.text(ctx, (tick / 10).toFixed(1), pos, y + 65, 31, C.ink, 'center');
  }
  api.text(ctx, 'Layer output', 122, 897, 36, C.muted);
  if (cue.after('quant-exact')) {
    api.line(ctx, x(q.exact), y - 63, x(q.exact), y + 10, C.yellow, 5);
    api.text(ctx, 'Exact  ' + q.exact.toFixed(2), x(q.exact) - 13, y - 85, 38, C.yellow, 'right');
  }
  for (const [id, value, color, label] of [
    ['quant-plain', q.plain, C.blue, 'Direct'],
    ['quant-scaled', q.scaled, C.cyan, 'Rescaled'],
  ]) {
    if (!cue.after(id)) continue;
    api.circle(ctx, x(value), y, 13, color);
    api.text(ctx, label + '  ' + value.toFixed(2), x(value), y + 161, 36, color, 'center');
  }
}

export function drawQuantizationOperation(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  const q = quantizationToy();
  api.focus.target('quantization-operation-mechanism', () => {
    if (state.beat === 0) {
      api.text(ctx, 'Symmetric INT8   ·   Step = 0.96 / 127', 125, 275, 42, C.ink);
      const rows = [
        ['Weight', weights],
        ['Integer code', cue.after('quant-round') ? codes : []],
        ['Read back', cue.after('quant-read') ? restored.map((n) => n.toFixed(4)) : []],
      ];
      rows.forEach(([name, values], i) => {
        const y = 435 + i * 139;
        api.text(ctx, name, 125, y, 36, C.muted);
        for (let j = 0; j < weights.length; j++)
          api.text(
            ctx,
            String(values[j] ?? '·'),
            560 + 273 * j,
            y,
            42,
            i === 1 ? C.cyan : C.ink,
            'center',
          );
      });
      if (cue.after('quant-max'))
        api.text(
          ctx,
          'Largest absolute difference   ' + maxError.toFixed(4),
          960,
          930,
          46,
          C.yellow,
          'center',
        );
      return;
    }
    if (state.beat === 1) {
      api.text(ctx, 'Magnitude of each channel’s output error', 125, 266, 40, C.ink);
      for (const [i, [activation, error, id]] of [
        [10, 0.01, 'quant-error-one'],
        [1, 0.04, 'quant-error-two'],
      ].entries()) {
        const y = 435 + 225 * i,
          value = activation * error;
        api.text(ctx, 'Channel ' + (i + 1), 125, y, 38, C.muted);
        api.text(ctx, activation + ' × ' + error.toFixed(2), 515, y, 49, C.ink);
        const length = 7000 * value * cue.progress(id);
        if (length > 0) api.rect(ctx, 850, y - 40, length, 46, i ? C.blue : C.cyan, undefined, 5);
        if (cue.after(id)) api.text(ctx, value.toFixed(2), 1640, y, 48, C.ink);
      }
      api.text(ctx, 'Input magnitude × weight error magnitude', 960, 910, 38, C.muted, 'center');
      return;
    }
    if (state.beat <= 4) {
      const rescale = cue.after('quant-rescale');
      const exact = dotText(rescale ? q.scaledW : q.w, rescale ? q.scaledX : q.x);
      const rounded = dotText(rescale ? q.scaledRounded : q.rounded, rescale ? q.scaledX : q.x);
      api.text(ctx, 'Round weights to the nearest tenth', 125, 254, 38, C.muted);
      api.text(ctx, 'Exact', 125, 379, 38, C.yellow);
      api.text(ctx, exact, 480, 379, 51, C.ink);
      api.text(
        ctx,
        cue.after('quant-exact') ? '=  ' + q.exact.toFixed(2) : '=  ?',
        1660,
        379,
        52,
        C.yellow,
        'right',
      );
      const ready = rescale ? cue.after('quant-round-scaled') : cue.started('quant-plain');
      if (ready) {
        api.text(ctx, 'Rounded', 125, 490, 38, C.cyan);
        api.text(ctx, rounded, 480, 490, 51, C.ink);
        const value = rescale ? q.scaled : q.plain;
        const shown = cue.after(rescale ? 'quant-scaled' : 'quant-plain');
        api.text(ctx, shown ? '=  ' + value.toFixed(2) : '=  ?', 1660, 490, 52, C.cyan, 'right');
      }
      outputRuler(ctx, api, cue, q);
      if (cue.started('quant-predict') && !cue.started('quant-scaled'))
        api.text(ctx, 'Where will the rounded output land?', 960, 970, 37, C.ink, 'center');
      else if (cue.after('quant-distance'))
        api.text(
          ctx,
          'Absolute error    ' +
            Math.abs(q.plain - q.exact).toFixed(2) +
            '   →   ' +
            Math.abs(q.scaled - q.exact).toFixed(2),
          960,
          970,
          40,
          C.ink,
          'center',
        );
      return;
    }
    api.text(ctx, 'Compensate before rounding the second weight', 125, 265, 41, C.ink);
    const loss = -0.05 * 2,
      gain = 0.1 * 1;
    api.text(ctx, 'First channel', 125, 443, 39, C.muted);
    api.text(ctx, '−0.05 × 2', 550, 443, 52, C.ink);
    if (cue.after('quant-deficit')) api.text(ctx, '=  ' + loss.toFixed(2), 1380, 443, 52, C.blue);
    api.text(ctx, 'Second channel', 125, 626, 39, C.muted);
    if (cue.started('quant-compensate')) api.text(ctx, '+0.10 × 1', 550, 626, 52, C.ink);
    if (cue.after('quant-compensate')) {
      api.text(ctx, '=  +' + gain.toFixed(2), 1380, 626, 52, C.cyan);
      api.text(
        ctx,
        'Net output change before the next rounding   ' + (loss + gain).toFixed(2),
        960,
        885,
        43,
        C.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'quantization-operation',
  draw: drawQuantizationOperation,
  cues: [
    'quant-round',
    'quant-read',
    'quant-max',
    'quant-error-one',
    'quant-error-two',
    'quant-exact',
    'quant-plain',
    'quant-rescale',
    'quant-round-scaled',
    'quant-predict',
    'quant-scaled',
    'quant-distance',
    'quant-deficit',
    'quant-compensate',
  ],
};
