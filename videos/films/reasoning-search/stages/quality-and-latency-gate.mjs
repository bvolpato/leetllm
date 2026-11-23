import { chooseReasoningStrategy } from '../arithmetic.mjs';
import { cueAt } from '../cue-clock.mjs';
import { STRATEGY_RECEIPTS } from '../fixtures.mjs';

const floor = 0.9;
const names = {
  direct: 'Direct',
  single_trace: 'Single trace',
  vote_5: 'Vote five',
  tree_search: 'Tree search',
};
const x = (ms) => 270 + 0.71 * ms;
const y = (accuracy) => 845 - ((accuracy - 0.7) / 0.3) * 550;

export function drawQualityAndLatencyGate(ctx, scene, state, api) {
  api.focus.target('quality-and-latency-gate-mechanism', () => {
    const { C, text, line } = api;
    const limits = cueAt(state, 'gate-limits', 0, 0.39, 0.71);
    const tighten = cueAt(state, 'gate-tighten', 2, 0.28, 0.76);
    const cap = Math.round(900 - tighten.progress * 800);
    const result = chooseReasoningStrategy(STRATEGY_RECEIPTS, floor, cap);
    const graded = !tighten.started
      ? cueAt(state, 'gate-select', 1, 0, 0.25).done
      : cueAt(state, 'gate-none', 3, 0, 0.06).done;
    text(ctx, 'Task accuracy', 132, 232, 34, C.ink);
    text(ctx, 'Illustrative measurements', 1735, 232, 30, C.muted, 'right');
    if (limits.started) {
      api.rect(ctx, x(0), y(1), x(cap) - x(0), y(floor) - y(1), C.green + '20', undefined, 0);
      line(ctx, x(cap), y(1) - 16, x(cap), y(1), C.yellow, 5);
      line(ctx, x(cap), y(0.7), x(cap), y(0.7) + 16, C.yellow, 5);
    }
    for (const level of [0.7, 0.8, 0.9, 1]) {
      const color = limits.started && level === floor ? C.cyan : C.muted;
      line(ctx, x(0), y(level), x(2000), y(level), color, level === floor ? 3 : 1);
      text(ctx, Math.round(level * 100) + '%', 235, y(level) + 11, 30, color, 'right');
    }
    for (const value of [0, 500, 1000, 1500, 2000]) {
      line(ctx, x(value), y(0.7), x(value), y(0.7) + 11, C.muted, 2);
      text(ctx, String(value), x(value), 894, 28, C.muted, 'center');
    }
    text(ctx, 'p95 latency (ms)', 1735, 947, 31, C.muted, 'right');
    for (const [i, row] of STRATEGY_RECEIPTS.entries()) {
      const px = x(row.p95_ms),
        py = y(row.accuracy);
      const selected = graded && result?.strategy === row.strategy;
      const color = selected ? C.green : C.ink;
      api.circle(ctx, px, py, selected ? 14 : 10, color);
      const align = i === 3 ? 'right' : 'left';
      const lx = px + (i === 3 ? -24 : 25);
      text(ctx, names[row.strategy], lx, py - 10, 33, color, align);
      text(
        ctx,
        Math.round(row.accuracy * 100) + '%  ·  ' + row.p95_ms + ' ms',
        lx,
        py + 30,
        28,
        color,
        align,
      );
    }
    if (limits.started) {
      const invalid = cueAt(state, 'gate-invalid', 3, 0.32, 0.49).done;
      text(ctx, 'Cap   ' + cap + ' ms', 160, 988, 38, C.yellow);
      const caption = invalid
        ? 'Invalid row: accuracy ∞, latency −1 ms'
        : graded
          ? result
            ? names[result.strategy] + ' qualifies   ·   ' + result.calls + ' calls'
            : 'No eligible strategy'
          : 'Which strategy meets both limits?';
      text(ctx, caption, 1160, 989, 38, graded && result ? C.green : C.ink, 'center');
    }
  });
}
export default {
  id: 'quality-and-latency-gate',
  draw: drawQualityAndLatencyGate,
  cues: ['gate-limits', 'gate-select', 'gate-tighten', 'gate-none', 'gate-invalid'],
};
