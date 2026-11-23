import { projectionFixture } from '../model.mjs';
import { spokenProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawFeatureProjection(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const complete = (id, beatIndex, start, end) =>
    spokenProgress(state, api, id, beatIndex, start, end) === 1;
  const rowsChanged = complete('projection-update', 1, 0.61, 0.83);
  const recomputed = complete('projection-output', 1, 0.89, 0.98);
  const fresh = complete('projection-fresh', 3, 0.12, 0.3);
  const showOutput = !fresh || complete('projection-check', 4, 0.01, 0.1);
  const matrix = projectionFixture(rowsChanged ? 1 : 0, fresh);
  const shown = projectionFixture(recomputed ? 1 : 0, fresh);
  const previousOutput = rowsChanged && !recomputed;
  const rowNames = ['Top', 'Middle', 'Bottom'];
  const format = (v) => String(Number(v.toFixed(2)));

  api.focus.target('projection-rulers', () => {
    text(ctx, api, fresh ? 'New token' : 'One token', 145, 282, 37, C.muted);
    text(ctx, api, 'Student features   [ ' + matrix.h.join(',  ') + ' ]', 520, 282, 44);
    text(ctx, api, rowsChanged ? 'Updated projection rows' : 'Projection rows', 145, 397, 39);
    text(ctx, api, '× feature 1', 408, 466, 31, C.muted, 'center');
    text(ctx, api, '× feature 2', 638, 466, 31, C.muted, 'center');
    matrix.A.forEach((row, i) => {
      const y = 550 + i * 118;
      text(ctx, api, rowNames[i], 145, y, 35);
      row.forEach((v, j) => {
        text(
          ctx,
          api,
          v.toFixed(2),
          408 + 230 * j,
          y,
          42,
          rowsChanged && i > 0 ? C.yellow : C.ink,
          'center',
        );
      });
    });

    const baseline = 816;
    const unit = 140;
    const y = (value) => baseline - unit * value;
    api.circle(ctx, 900, 323, 10, C.cyan);
    text(ctx, api, previousOutput ? 'Previous output' : 'Row output', 923, 333, 30, C.cyan);
    api.line(ctx, 1295, 323, 1345, 323, C.blue, 6);
    text(ctx, api, 'Fixed teacher target', 1364, 333, 30, C.blue);
    api.line(ctx, 890, y(3), 890, baseline, C.muted, 2);
    api.line(ctx, 890, baseline, 1490, baseline, C.muted, 2);
    for (const value of [0, 1, 2, 3]) {
      api.line(ctx, 878, y(value), 890, y(value), C.muted, 2);
      text(ctx, api, String(value), 851, y(value) + 10, 27, C.muted, 'right');
    }
    rowNames.forEach((name, i) => {
      const x = 995 + 202 * i;
      const value = shown.output[i];
      if (showOutput) {
        api.rect(ctx, x - 47.5, y(value), 95, unit * value, C.cyan);
        api.circle(ctx, x, y(value), 10, C.cyan);
        text(ctx, api, format(value), x, y(value) - 24, 30, C.cyan, 'center');
      }
      api.line(ctx, x - 69, y(matrix.target[i]), x + 69, y(matrix.target[i]), C.blue, 5);
      text(ctx, api, name, x, 868, 32, C.ink, 'center');
    });

    if (!showOutput) {
      text(
        ctx,
        api,
        'Middle row     0.2 × 2 + 1.4 × 1 = ?     •     Teacher target 3',
        960,
        957,
        39,
        C.yellow,
        'center',
      );
    } else if (beat === 0 && complete('projection-gaps', 0, 0.5, 0.66)) {
      text(
        ctx,
        api,
        'Which row can stay?     What is the sum of the squared gaps?',
        960,
        957,
        39,
        C.yellow,
        'center',
      );
    } else if (complete('projection-error', 1, 0.08, 0.2)) {
      const squares = shown.error.map((e) => format(e * e));
      const label = previousOutput ? 'Previous squared error' : 'Squared error';
      text(
        ctx,
        api,
        label + '     ' + squares.join('  +  ') + '  =  ' + format(shown.sse),
        960,
        952,
        40,
        C.ink,
        'center',
      );
      if (beat === 1 && !rowsChanged && complete('projection-gradient', 1, 0.4, 0.54))
        text(
          ctx,
          api,
          'Middle row gradient     2 × (−1) × [1, 2] = [' + matrix.gradient[1].join(', ') + ']',
          960,
          1011,
          31,
          C.muted,
          'center',
        );
    }
  });
}
export default {
  id: 'feature-projection',
  draw: drawFeatureProjection,
  cues: [
    'projection-gaps',
    'projection-error',
    'projection-gradient',
    'projection-update',
    'projection-output',
    'projection-fresh',
    'projection-check',
  ],
};
