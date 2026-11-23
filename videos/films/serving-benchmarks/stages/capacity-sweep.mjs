import { rates } from '../fixtures.mjs';
import { servingGate } from '../model.mjs';
import { cueProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawCapacitySweep(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat ?? 0;
  const tested = cueProgress(
    state.cues,
    'sweep-evidence',
    beat > 0 ? 1 : api.phase(state.beatP ?? 0, 0.14, 0.67),
  );
  const selected = state.cues?.['sweep-choice']
    ? state.cues['sweep-choice'].phase === 'after'
    : beat >= 2;
  const best = servingGate(rates);
  const x = (rate) => 480 + (rate - 0.5) * 610;
  const y = (fraction) => 590 - fraction * 270;
  const target = 0.95;
  text(ctx, api, 'Offered requests/s', 105, 248, 30, C.muted, 'left');
  text(ctx, api, 'Attainment', 105, y(1) + 23, 32, C.ink, 'left');
  for (const pct of [0, 50])
    text(ctx, api, pct + '%', 354, y(pct / 100) + 10, 27, C.muted, 'right');
  api.line(ctx, 392, y(0), 1780, y(0), C.muted, 2);
  api.line(ctx, 392, y(0.5), 1780, y(0.5), '#333942', 2);
  api.line(ctx, 392, y(target), 1780, y(target), C.yellow, 3);
  text(ctx, api, '95%', 354, y(target) + 9, 29, C.yellow, 'right');
  const rows = [
    ['Qualified / 200', 668],
    ['Max lag (≤ 20 ms)', 743],
    ['Backlog', 818],
  ];
  for (const [label, yy] of rows) text(ctx, api, label, 105, yy, 29, C.muted, 'left');
  rates.forEach((row, i) => {
    const xx = x(row.rps);
    focus.target(i === 3 ? 'sweep-neighbor' : 'sweep-runs', () => {
      text(ctx, api, row.rps.toFixed(1), xx, 249, 39, C.ink);
      if (tested * 5 < i + 0.5) return;
      const color = selected && row === best ? C.green : C.cyan;
      api.line(ctx, xx, y(0) - 1, xx, y(row.attainment), '#3a4451', 3);
      api.circle(ctx, xx, y(row.attainment), 12, color);
      text(ctx, api, String(Math.round(row.attainment * 200)), xx, rows[0][1], 34, color);
      text(ctx, api, row.maxLag + ' ms', xx, rows[1][1], 32, C.ink);
      text(ctx, api, row.backlog, xx, rows[2][1], 31, C.ink);
    });
  });
  if (selected) {
    text(
      ctx,
      api,
      'Highest passing tested load   ' + best.rps + ' requests/s',
      135,
      977,
      39,
      C.green,
      'left',
    );
    if (beat >= 2) {
      const upper = rates.find((row) => row.rps > best.rps);
      const a = x(best.rps),
        b = x(upper.rps);
      api.line(ctx, a, 900, b, 900, C.yellow, 4);
      for (const xx of [a, b]) api.line(ctx, xx, 890, xx, 910, C.yellow, 3);
      text(ctx, api, 'Test inside this interval', (a + b) / 2, 953, 29, C.yellow);
    }
  }
}
export default {
  id: 'capacity-sweep',
  draw: drawCapacitySweep,
  cues: ['sweep-evidence', 'sweep-neighbor', 'sweep-choice', 'sweep-refine'],
};
