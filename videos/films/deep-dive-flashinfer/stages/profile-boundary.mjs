import { mix } from '../arithmetic.mjs';
import { bracket } from '../cache-picture.mjs';
import { flashinferExtensionFrame } from '../construction.mjs';

export function drawProfileBoundary(ctx, scene, state, api) {
  const { C } = api;
  const model = flashinferExtensionFrame('profile-boundary', state);
  const colors = [C.blue, C.cyan, C.muted, C.yellow, C.pink];
  const names = ['Plan', 'Copy', 'Launch gap', 'Attention', 'Merge'];
  const left = 370;
  const unit = 420;
  function bar(label, y, values, finished) {
    api.text(ctx, label, left - 45, y + 62, 41, C.ink, 'right');
    let x = left;
    values.forEach((ms, i) => {
      const width = unit * ms;
      api.rect(ctx, x, y, width - 3, 95, colors[i], undefined, 3);
      if (i === 3) api.text(ctx, ms.toFixed(1) + ' ms', x + width / 2, y + 63, 41, C.bg, 'center');
      x += width;
    });
    if (finished)
      api.text(
        ctx,
        values.reduce((sum, ms) => sum + ms, 0).toFixed(1) + ' ms',
        x + 24,
        y + 62,
        41,
        C.ink,
      );
  }
  api.focus.target('fi-profile-boundary-mechanism', () => {
    api.text(ctx, 'One serial GPU call', 155, 277, 47, C.ink);
    for (let i = 0; i < names.length; i++) {
      const x = 155 + i * 332;
      api.rect(ctx, x, 343, 25, 25, colors[i], undefined, 3);
      api.text(ctx, names[i] + '  ' + model.original[i].toFixed(1) + ' ms', x + 42, 369, 31, C.ink);
    }
    bar('Original', 452, model.original, model.totalReady);
    if (state.beat > 0) {
      const values = model.original.map((ms, i) =>
        mix(ms, model.repaired[i], model.repairProgress),
      );
      bar('Shorter kernel', 616, values, model.repairReady);
    }
    const axisY = 765;
    api.line(ctx, left, axisY, left + model.total * unit, axisY, C.muted, 3);
    for (let tick = 0; tick <= model.total; tick += 0.5) {
      const x = left + tick * unit;
      api.line(ctx, x, axisY, x, axisY + 14, C.muted, 3);
      api.text(ctx, tick + ' ms', x, axisY + 61, 30, C.muted, 'center');
    }
    if (state.beat === 2) {
      const cue = state.cues?.['profile-compute'];
      const kernel = cue ? cue.phase !== 'before' : state.beatP > 0.34;
      const start = kernel ? model.repaired.slice(0, 3).reduce((sum, ms) => sum + ms, 0) : 0;
      const end = kernel ? start + model.repaired[3] : model.next;
      const color = kernel ? C.yellow : C.cyan;
      bracket(ctx, api, left + start * unit, left + end * unit, 734, color);
      api.text(
        ctx,
        kernel
          ? 'Nsight Compute   /   inside the attention kernel'
          : 'Nsight Systems   /   host and device timeline',
        960,
        951,
        47,
        color,
        'center',
      );
    } else if (model.speedReady) {
      const ratio = (model.total / model.next).toFixed(2);
      api.text(
        ctx,
        'Whole call    ' +
          model.total.toFixed(1) +
          ' ÷ ' +
          model.next.toFixed(1) +
          ' ≈ ' +
          ratio +
          '×',
        960,
        951,
        54,
        C.yellow,
        'center',
      );
    }
  });
}

export default {
  id: 'profile-boundary',
  draw: drawProfileBoundary,
  cues: [
    'fi-profile-boundary-0',
    'fi-profile-boundary-0-result',
    'fi-profile-boundary-total',
    'fi-profile-boundary-1',
    'fi-profile-boundary-1-result',
    'fi-profile-boundary-speed',
    'fi-profile-boundary-2',
    'profile-compute',
    'fi-profile-boundary-2-result',
  ],
};
