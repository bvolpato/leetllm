import { experiment } from '../model.mjs';
import { settled } from '../timing.mjs';

export function drawLocalScales(ctx, scene, state, api) {
  const { C } = api;
  const local = state.beat > 0;
  const tinyReady = local ? settled(state, 'local-tiny', 1) : settled(state, 'local-shared', 0);
  const spikeReady = local
    ? settled(state, 'local-spike', 2)
    : settled(state, 'local-shared-spike', 0);
  const values = local ? experiment.block : experiment.tensor;
  api.focus.target('local-groups', () => {
    for (const [r, row] of experiment.rows.entries()) {
      const y = 298 + r * 143;
      api.text(ctx, 'Row ' + r, 150, y + 29, 38, C.ink);
      for (const [k] of row.entries()) {
        const selected = k === (r === 0 ? 0 : 3);
        api.rect(ctx, 362 + k * 32, y - 13, 30, 60, selected ? C.blue : C.panel, C.muted, 1);
      }
      const ix = 377 + (r === 0 ? 0 : 3) * 32;
      api.text(ctx, row[r === 0 ? 0 : 3], ix, y - 34, 30, C.blue, 'center');
    }
    const bracket = (top, bottom, name) => {
      api.line(ctx, 1407, top, 1433, top, C.yellow, 4);
      api.line(ctx, 1433, top, 1433, bottom, C.yellow, 4);
      api.line(ctx, 1407, bottom, 1433, bottom, C.yellow, 4);
      api.text(ctx, name, 1472, (top + bottom) / 2 + 12, 37, C.yellow);
    };
    if (local) {
      bracket(285, 345, 'S = 2⁻⁸');
      bracket(428, 488, 'S = 2');
    } else bracket(285, 488, 'S = 500/448');
  });
  for (const [i, entry, from, to, base, width, ready] of [
    [0, values[0][0], 0, 0.00225, 210, 650, tinyReady],
    [1, values[1][3], 480, 520, 1070, 650, spikeReady],
  ]) {
    api.focus.target(i === 0 ? 'local-tiny-ruler' : 'local-spike-ruler', () => {
      const x = (v) => base + (width * (v - from)) / (to - from);
      const y = 754;
      api.text(ctx, 'Row ' + i + '   ·   index ' + (i === 0 ? 0 : 3), base, 637, 33, C.ink);
      api.line(ctx, base, y, base + width, y, C.muted, 3);
      for (const v of [from, to]) {
        api.line(ctx, x(v), y - 10, x(v), y + 10, C.muted, 3);
        api.text(ctx, v, x(v), y + 56, 28, C.muted, 'center');
      }
      api.circle(ctx, x(entry.original), y - 14, 11, C.blue);
      api.text(ctx, 'Input  ' + entry.original, x(entry.original), y - 42, 33, C.blue, 'center');
      if (ready) api.circle(ctx, x(entry.reconstructed), y + 14, 11, C.cyan);
      if (i === 0) {
        const step = entry.scale * 2 ** -9;
        if (!local) {
          api.line(ctx, x(step / 2), y + 16, x(step / 2), y + 47, C.yellow, 3);
          api.text(
            ctx,
            'Half step ≈ ' + (step / 2).toFixed(5),
            x(step / 2),
            y + 112,
            29,
            C.yellow,
            'center',
          );
        } else
          api.text(ctx, 'First positive step ≈ ' + step.toFixed(8), base, y + 112, 29, C.yellow);
      }
      api.text(ctx, 'Stored   ' + (ready ? entry.reconstructed : '?'), base, 957, 42, C.cyan);
    });
  }
}
export default {
  id: 'local-scales',
  draw: drawLocalScales,
  cues: ['local-shared', 'local-shared-spike', 'local-tiny', 'local-probe', 'local-spike'],
};
