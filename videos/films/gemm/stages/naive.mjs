import { A, B } from '../fixtures.mjs';
import { cell, finished, label, progress } from '../workbench.mjs';

export function drawNaive(ctx, scene, state, api) {
  const { C } = api;
  const steps = 2 * 2 * 3;
  const replay = progress(state, 0, 'independent-reads');
  const count = Math.min(steps, Math.floor(steps * replay));
  const shared = state.beat >= 1;
  const staged = Math.floor(12 * progress(state, 1, 'unique-reads'));
  api.focus.target('load-count', () => {
    label(ctx, api, shared ? 'One shared copy per input' : 'One thread per output', 960, 308, 44, C.ink);
    for (const [side, values, x, color] of [['A', A, 332, C.blue], ['B', B, 1164, C.pink]]) {
      label(ctx, api, side, x - 78, 491, 43, color);
      values.forEach((row, i) => row.forEach((v, j) => {
        let reads = 0;
        for (let step = 0; step < count; step++) {
          const r = Math.floor(step / 6), c = Math.floor(step / 3) % 2, k = step % 3;
          if (side === 'A' ? i === r && j === k : i === k && j === c) reads++;
        }
        const loaded = shared ? Number((side === 'A' ? i * 3 + j : 6 + i * 2 + j) < staged) : reads;
        const xx = x + j * 141, yy = 380 + i * 118;
        cell(ctx, api, v, xx, yy, 119, 76, loaded ? color : C.muted, 36);
        for (let n = 0; n < loaded; n++) api.circle(ctx, xx + 48 + n * 22, yy + 92, 7, color);
      }));
    }
    const loads = shared ? staged : 2 * count;
    label(ctx, api, `${loads} scalar input reads`, 960, 836, 57, C.yellow);
    label(ctx, api, 'Each dot marks one read of that input', 960, 922, 32, C.muted);
    if (finished(state, 2, 'same-work')) {
      label(ctx, api, 'Both plans · 12 multiply-adds · 4 output stores', 960, 1001, 33, C.ink);
    }
  });
}
export default { id: 'naive', draw: drawNaive, cues: ['independent-reads', 'unique-reads', 'same-work'] };
