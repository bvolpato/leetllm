import { spoken } from '../arithmetic.mjs';
import { interpolatedQuantile } from '../model.mjs';

const samples = [40, 8, 16, 10, 14, 12];
export function drawSampleContract(ctx, scene, state, api) {
  const { C, text, rect, line, circle } = api;
  api.focus.target('sample-contract-mechanism', () => {
    const left = 493, dx = 228;
    const sorted = interpolatedQuantile(samples, 0.5).sorted;
    const sortedP = spoken(state, 'sorted-copy', 0);
    text(ctx, 'Six completed launches   /   microseconds', 140, 257, 37, C.ink);
    for (const [y, name, values] of [[378, 'Recorded', samples], [595, 'Sorted copy', sorted]]) {
      text(ctx, name, 140, y + 54, 38, C.ink);
      values.forEach((v, i) => {
        const x = left + dx * i;
        const visible = y === 378 || sortedP >= (i + 1) / values.length;
        const color = visible && v === 40 ? C.pink : C.blue;
        rect(ctx, x - 82, y, 164, 84, C.panel, color, 2);
        if (visible) text(ctx, String(v), x, y + 57, 41, color, 'center');
        if (y === 595) text(ctx, String(i), x, y + 136, 28, C.muted, 'center');
      });
    }
    if (sortedP < 1) return;
    let q = 0.5;
    if (spoken(state, 'sample-p10', 1) > 0) q = 0.1;
    if (spoken(state, 'sample-p90-question', 1) > 0) q = 0.9;
    const quantile = interpolatedQuantile(samples, q);
    const placed = spoken(state, 'sample-median', 0) > 0;
    if (!placed) return;
    const x = left + dx * quantile.position;
    line(ctx, left, 776, left + dx * 5, 776, C.muted, 2);
    circle(ctx, x, 776, 11, C.yellow);
    text(ctx, 'q × (6 − 1)   =   ' + q + ' × 5   =   ' + quantile.position, 960, 858, 36, C.yellow, 'center');
    const pending = q === 0.9 && spoken(state, 'sample-p90', 2) < 1;
    text(ctx, pending ? 'Halfway between 16 and 40 µs   =   ?' :
      'Halfway between ' + sorted[quantile.lo] + ' and ' + sorted[quantile.hi] + ' µs   =   ' + quantile.value + ' µs', 960, 961, 46, C.ink, 'center');
  });
}
export default { id: 'sample-contract', draw: drawSampleContract, cues: ['sorted-copy', 'sample-median', 'sample-p10', 'sample-p90-question', 'sample-p90'] };
