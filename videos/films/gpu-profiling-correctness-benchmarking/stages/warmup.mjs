import { spoken } from '../arithmetic.mjs';
import { regimes } from '../fixtures.mjs';

export function drawWarmup(ctx, scene, state, api) {
  const { C, text, rect, line, circle } = api;
  const firstUse = state.beat === 0;
  const x = (i) => 440 + i * 238;
  const y = (v) => 667 - v * 7.4;
  const p = spoken(state, firstUse ? 'first-series' : 'address-series', firstUse ? 0 : 1);
  const last = Math.min(5, Math.floor(5 * p));
  const sampleFour = spoken(state, 'sample-four', 1) > 0;
  api.focus.target('warmup-trace', () => {
    text(ctx, firstUse ? 'First six launches   /   no warmup' : 'After warmup   /   same kernel and timer', 145, 248, 37, C.ink);
    text(ctx, 'Synthetic event intervals (µs)', 1780, 248, 29, C.muted, 'right');
    for (const tick of [0, 20, 40]) {
      line(ctx, x(0) - 28, y(tick), x(5) + 65, y(tick), C.muted, 1);
      text(ctx, String(tick), x(0) - 50, y(tick) + 10, 29, C.muted, 'right');
    }
    if (sampleFour) line(ctx, x(3), 316, x(3), 681, C.yellow, 3);
    const series = firstUse ? [[regimes[0], C.pink]] : [[regimes[2], C.yellow], [regimes[1], C.cyan]];
    for (const [values, color] of series) {
      for (let i = 0; i <= last; i++) {
        if (i) line(ctx, x(i - 1), y(values[i - 1]), x(i), y(values[i]), color, 5);
        circle(ctx, x(i), y(values[i]), 9, color);
      }
      const next = last + 1;
      if (next < values.length) {
        const fraction = 5 * p - last;
        line(ctx, x(last), y(values[last]), x(last + fraction), y(values[last] + fraction * (values[next] - values[last])), color, 5);
      }
      if (firstUse && p === 1) text(ctx, '19 µs', x(5) + 25, y(19) + 49, 32, color);
      if (firstUse) text(ctx, '44 µs', x(0) + 14, y(44) - 22, 34, color);
    }
    text(ctx, 'Launch', 145, 731, 31, C.muted);
    for (let i = 0; i < 6; i++) text(ctx, String(i + 1), x(i), 731, 32, C.ink, 'center');
    if (firstUse) {
      text(ctx, 'Keep sample order when choosing how much warmup to use.', 960, 895, 39, C.ink, 'center');
      return;
    }
    for (const [row, label, color] of [[0, 'Rotating', C.yellow], [1, 'Same buffer', C.cyan]]) {
      const top = 760 + row * 78;
      text(ctx, label, 145, top + 44, 33, color);
      for (let i = 0; i <= last; i++) {
        rect(ctx, x(i) - 88, top, 176, 60, C.panel, color, sampleFour && i === 3 ? 4 : 1);
        text(ctx, 'slot ' + (row === 0 ? i : 0), x(i), top + 41, 30, color, 'center');
      }
    }
    if (sampleFour) {
      text(ctx, '20 µs', x(3) + 22, y(20) - 22, 31, C.yellow);
      text(ctx, '12 µs', x(3) + 22, y(12) + 45, 31, C.cyan);
      const footer = state.beat === 1 ? 'Which slot did each launch touch?' :
        spoken(state, 'matching-policy', 2) > 0 ? 'Use traffic counters to see where the loads went.' : 'Launch 4   ·   slot 3 with rotation, slot 0 with reuse';
      text(ctx, footer, 960, 984, 37, C.ink, 'center');
    }
  });
}
export default { id: 'warmup', draw: drawWarmup, cues: ['first-series', 'address-series', 'sample-four', 'matching-policy'] };
