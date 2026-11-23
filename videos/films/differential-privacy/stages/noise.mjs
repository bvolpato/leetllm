import { clipVector, sumVectors } from '../arithmetic.mjs';

export function drawNoise(ctx, scene, state, api) {
  const { C, focus } = api;
  const text = (v, x, y, size, color = C.ink, align = 'left') => api.text(ctx, v, x, y, size, color, align);
  if (state.beat >= 3) {
    const p = focus.progress('swap-record', 0);
    const division = focus.progress('shrink-gap', 0);
    const x = (v) => 960 + 535 * v, y = 492;
    focus.target('neighbor-ruler', () => {
      text('Contribution of one record   ·   all other records fixed', 960, 254, 39, C.ink, 'center');
      api.line(ctx, x(-1), y, x(1), y, C.muted, 4);
      for (const [v, label] of [[-1, '−C'], [0, '0'], [1, '+C']]) {
        api.line(ctx, x(v), y + 23, x(v), y + 39, C.muted, 3);
        text(label, x(v), y + 94, 33, C.muted, 'center');
      }
      api.circle(ctx, x(-1), y, 16, C.cyan);
      text('Old record', x(-1), y - 90, 37, C.cyan, 'center');
      const end = x(-1 + 2 * p);
      if (p > 0) {
        api.line(ctx, x(-1), y - 52, end, y - 52, C.yellow, 5);
        api.circle(ctx, end, y, 14, C.pink);
      }
      if (p === 1) text('Replacement', x(1), y - 90, 37, C.pink, 'center');
      if (p === 1) text('Sum gap   2C', x(0), y - 82, 41, C.yellow, 'center');
      if (focus.progress('fixed-division', 0) > 0) {
        const extent = 1 + (1 / 3 - 1) * division, lowerY = 770;
        for (const v of [-1, 0, 1]) api.line(ctx, x(v), lowerY - 12, x(v), lowerY + 12, C.muted, 3);
        api.line(ctx, x(-1), lowerY, x(1), lowerY, C.muted, 3);
        api.line(ctx, x(-extent), lowerY, x(extent), lowerY, C.yellow, 6);
        api.circle(ctx, x(-extent), lowerY, 15, C.cyan);
        api.circle(ctx, x(extent), lowerY, 15, C.pink);
        text('Divide both sums by 3', 960, 696, 39, C.ink, 'center');
        if (division === 1) {
          text('−C/3', x(-extent), 841, 33, C.cyan, 'center');
          text('+C/3', x(extent), 841, 33, C.pink, 'center');
          const noise = focus.progress('divide-noise', 0) === 1;
          text(noise ? 'Gap   2C/3     ·     Noise SD per coordinate   2σC/3' : 'Gap   2C/3',
            960, 952, 40, C.yellow, 'center');
        }
      }
    });
    return;
  }
  const records = [[0.4, 0.3], [0.6, 0.8], clipVector([3, 4], 1).clipped];
  const base = sumVectors(records.slice(0, 2)), sum = sumVectors(records), offset = [0.2, -0.3];
  const add = focus.progress('add-record', 0);
  const noise = focus.progress('apply-draw', 0);
  const point = ([x, y]) => [260 + 286 * x, 914 - 286 * y];
  const partial = base.map((v, i) => v + records[2][i] * add);
  const noisy = sum.map((v, i) => v + offset[i] * noise);
  const fmt = v => '(' + v.map(x => x.toFixed(1)).join(', ') + ')';
  focus.target('sum-plane', () => {
    api.line(ctx, 223, 914, 955, 914, C.muted, 3);
    api.line(ctx, 260, 948, 260, 245, C.muted, 3);
    for (const n of [1, 2]) {
      text(String(n), point([n, 0])[0], 962, 27, C.muted, 'center');
      text(String(n), 219, point([0, n])[1] + 10, 27, C.muted, 'right');
    }
    api.arrow(ctx, ...point([0, 0]), ...point(base), C.cyan, 7);
    api.circle(ctx, ...point(base), 10, C.cyan);
    if (add > 0) api.arrow(ctx, ...point(base), ...point(partial), C.blue, 7);
    if (add === 1) api.circle(ctx, ...point(sum), 10, C.blue);
    if (noise > 0) {
      api.arrow(ctx, ...point(sum), ...point(noisy), C.pink, 7);
      api.circle(ctx, ...point(noisy), 12, C.pink);
    }
    text('R1 + R2', 1030, 303, 32, C.cyan);
    text('Without R4    ' + fmt(base), 1030, 372, 43);
    text('Add clipped R4    ' + fmt(records[2]), 1030, 488, 35, C.blue);
    if (add === 1) text('With R4    ' + fmt(sum), 1030, 555, 43);
    if (focus.progress('draw-offset', 0) > 0) {
      text('One Gaussian draw    (+0.2, −0.3)', 1030, 680, 35, C.pink);
      text(noise === 1 ? 'Noisy sum    ' + fmt(noisy) : 'Noisy sum    (?, ?)', 1030, 755, 43, noise === 1 ? C.pink : C.ink);
    }
    const note = state.beat === 0 ? 'Add/remove one record    •    maximum shift C = 1' : 'Gaussian noise on the sum    •    standard deviation σC per coordinate';
    text(note, 960, 1015, 31, C.ink, 'center');
  });
}
export default { id: 'noise', draw: drawNoise, cues: ['add-record', 'draw-offset', 'apply-draw', 'swap-record', 'fixed-division', 'shrink-gap', 'divide-noise'] };
