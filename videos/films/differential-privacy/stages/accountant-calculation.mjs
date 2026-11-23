import { gaussianAccountantFixture } from '../model.mjs';

export function drawAccountantCalculation(ctx, scene, state, api) {
  const { C, focus } = api;
  const text = (v, x, y, size, color = C.ink, align = 'left') => api.text(ctx, v, x, y, size, color, align);
  const two = gaussianAccountantFixture(2);
  if (state.beat >= 3) {
    focus.target('transcript', () => {
      text('Already accounted together', 230, 301, 42, C.cyan);
      for (const [i, name] of ['Noisy score 1', 'Noisy score 2'].entries()) {
        const y = 415 + 160 * i;
        api.rect(ctx, 250, y, 440, 95, C.panel, C.cyan);
        text(name, 470, y + 63, 35, C.cyan, 'center');
        api.line(ctx, 710, y + 48, 870, y + 48, C.cyan, 4);
      }
      api.line(ctx, 870, 463, 870, 623, C.cyan, 4);
      api.arrow(ctx, 870, 543, 1090, 543, C.cyan, 5);
      text('Choose a checkpoint', 1140, 552, 40);
      text('Bound for the joint release ≈ ' + two.best.epsilon.toFixed(3), 960, 812, 46, C.yellow, 'center');
      text('Reusing saved scores adds no new private measurement.', 960, 948, 35, C.ink, 'center');
    });
    return;
  }
  focus.target('order-table', () => {
    text('Whole customers   ·   add/remove   ·   no sampling   ·   SD = 4C', 190, 260, 36);
    text('δ = 0.00001', 1720, 260, 34, C.yellow, 'right');
    text('Bound per release at order α   =   α / (2 × 4²)   =   α / 32', 960, 373, 40, C.cyan, 'center');
    const sum = focus.progress('second-release', 0) > 0;
    const convert = focus.progress('convert-orders', 0) > 0;
    const best = focus.progress('read-minimum', 0) > 0;
    const columns = [335, 710, 1110, 1510];
    ['Order α', sum ? 'Two releases' : 'One release', 'Conversion', 'ε bound'].forEach((s, i) => text(s, columns[i], 500, 33, C.muted, 'center'));
    for (const [i, row] of two.rows.entries()) {
      const y = 590 + i * 88;
      const color = best && row.alpha === two.best.alpha ? C.green : C.ink;
      text(String(row.alpha), columns[0], y, 40, color, 'center');
      text((sum ? row.rdp : row.charges[0]).toFixed(3), columns[1], y, 40, color, 'center');
      if (convert) {
        text('+' + row.conversion.toFixed(3), columns[2], y, 40, color, 'center');
        text(row.epsilon.toFixed(3), columns[3], y, 40, color, 'center');
      }
    }
    const footer = best ? 'Smallest of these four bounds   ≈ ' + two.best.epsilon.toFixed(3) + '     •     cap 2'
      : convert ? 'Conversion term   =   ln(1 / δ) / (α − 1)' : 'Each column uses the same four orders.';
    text(footer, 960, 990, 37, best ? C.green : C.ink, 'center');
  });
}
export default { id: 'accountant-calculation', draw: drawAccountantCalculation, cues: ['charge-order', 'second-release', 'convert-orders', 'read-minimum', 'reuse-scores'] };
