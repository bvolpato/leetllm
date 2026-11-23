import { LATENCY_STAGES, LATENCY_TRACES } from '../fixtures.mjs';
import { nearestRank } from '../arithmetic.mjs';
import { spoken } from '../construction.mjs';

export function drawLatencyWaterfall(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  if (state.beat === 0) {
    const total = LATENCY_STAGES.reduce((sum, item) => sum + item.ms, 0);
    const colors = [C.blue, C.cyan, C.green, C.yellow, C.pink];
    const complete = spoken(state, 0, 'qx-ttft-result') === 1;
    label('One uncached request   ·   serial stages', 135, 277, 42);
    let elapsed = 0;
    LATENCY_STAGES.forEach((stage, i) => {
      const center = 277 + i * 335;
      const p = spoken(state, 0, 'time-' + i);
      focus.target('latency-intervals', () => {
        label(stage.id, center, 443, 34, colors[i], 'center');
        label(stage.ms + ' ms', center, 519, 45, C.ink, 'center');
      });
      if (p > 0)
        api.rect(
          ctx,
          145 + (1610 * elapsed) / total,
          643,
          (1610 * stage.ms * p) / total,
          75,
          colors[i],
        );
      elapsed += stage.ms;
    });
    focus.target('latency-total', () => {
      label(complete ? total + ' ms' : 'Total   ?', 960, 878, 68, C.yellow, 'center');
      label(
        complete ? 'Time to first delivered answer token' : 'Completed TTFT pending',
        960,
        975,
        34,
        C.muted,
        'center',
      );
    });
    return;
  }
  if (state.beat < 3) {
    const done = spoken(state, 2, 'qx-percentile-result') === 1;
    const sorted = [...LATENCY_TRACES].sort((a, b) => a.total - b.total);
    const percentile = nearestRank(sorted.map((r) => r.total));
    const rank = Math.ceil(sorted.length * 0.95);
    const scale = 2.8;
    label('20 requests   ·   stages A and B, in milliseconds', 135, 251, 41);
    ['Requests 1–18', 'Request 19', 'Request 20'].forEach((name, i) => {
      const x = 393 + 572 * i;
      const example = sorted[[0, 18, 19][i]];
      label(name, x, 351, 31, C.muted, 'center');
      label(example.a + '  +  ' + example.b, x, 418, 43, C.ink, 'center');
    });
    sorted.forEach((row, i) => {
      const x = 164 + i * 80;
      api.rect(ctx, x, 821 - row.a * scale, 54, row.a * scale, C.blue, undefined, 0);
      api.rect(ctx, x, 821 - row.total * scale, 54, row.b * scale, C.cyan, undefined, 0);
      label(i + 1, x + 27, 872, 28, done && i === rank - 1 ? C.yellow : C.muted, 'center');
    });
    label('A', 148, 573, 34, C.blue);
    label('+ B', 187, 573, 34, C.cyan);
    label('Sorted by request total', 148, 625, 29, C.muted);
    focus.target('latency-percentile', () =>
      label('0.95 × ' + sorted.length + ' = ' + rank + '   ·   take rank ' + rank, 149, 695, 32, C.ink),
    );
    focus.target('latency-percentile', () =>
      label(
        done
          ? '19th sorted total = ' + percentile + ' ms'
          : 'At rank ' + rank + ', what is the total?',
        960,
        985,
        44,
        C.yellow,
        'center',
      ),
    );
    return;
  }

  const single = 0.95;
  const complete = spoken(state, 3, 'qx-fanout-result') === 1;
  label('Three independent searches   ·   due in 25 ms', 135, 272, 46);
  for (let i = 0; i < 3; i++) {
    const x = 155 + 568 * i;
    label('Search ' + (i + 1), x + 210, 445, 35, C.muted, 'center');
    api.rect(ctx, x, 550, 420, 63, C.panel);
    api.rect(ctx, x, 550, 420 * single, 63, C.cyan);
    label('95% by deadline', x + 210, 699, 40, C.ink, 'center');
  }
  focus.target('fanout-probability', () =>
    label(
      'P(all three by deadline)   =   0.95 × 0.95 × 0.95   ≈   ' +
        (complete ? (single ** 3).toFixed(3) : '?'),
      960,
      914,
      43,
      C.yellow,
      'center',
    ),
  );
}

export default {
  id: 'latency-waterfall',
  draw: drawLatencyWaterfall,
  cues: [
    'time-0',
    'time-1',
    'time-2',
    'time-3',
    'time-4',
    'qx-ttft-result',
    'latency-sort',
    'qx-percentile-result',
    'qx-fanout-result',
  ],
};
