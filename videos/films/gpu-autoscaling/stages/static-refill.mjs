import { refillSchedule } from '../arithmetic.mjs';
import { afterClause, cueProgress } from '../timing.mjs';

const fixed = refillSchedule();
const continuous = refillSchedule(true);

function drawSchedule(ctx, api, y, name, schedule, elapsed, showTotal) {
  const { C } = api;
  const colors = { R1: C.blue, R2: C.pink, R3: C.cyan, R4: C.green };
  api.text(ctx, name, 146, y - 35, 38, C.ink);
  if (showTotal)
    api.text(
      ctx,
      schedule.makespan + ' steps  ·  ' + schedule.empty + ' empty slot-steps',
      1790,
      y - 35,
      35,
      C.yellow,
      'right',
    );
  for (let slot = 0; slot < 2; slot++) {
    const top = y + slot * 70;
    api.text(ctx, 'Slot ' + (slot + 1), 146, top + 41, 32, C.muted);
    for (let step = 0; step < schedule.makespan; step++) {
      const x = 350 + 109 * step;
      const row = schedule.rows.find((r) => r.slot === slot && step >= r.start && step < r.end);
      api.rect(ctx, x, top, 102, 56, C.panel, C.muted + '55', 4);
      const fill = Math.max(0, Math.min(1, elapsed - step));
      if (fill === 0) continue;
      api.rect(ctx, x, top, 102 * fill, 56, row ? colors[row.id] : C.yellow + '38', undefined, 4);
      if (row?.start === step && fill >= 0.9)
        api.text(ctx, row.id, x + 50, top + 40, 32, C.bg, 'center');
      if (!row && fill >= 0.9) api.line(ctx, x + 37, top + 28, x + 64, top + 28, C.yellow, 4);
    }
  }
}

export function drawStaticRefill(ctx, scene, state, api) {
  const cue = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  const firstPair = fixed.rows.slice(0, 2);
  const firstFinish = Math.min(...firstPair.map((row) => row.end));
  const secondFinish = Math.max(...firstPair.map((row) => row.end));
  const elapsed =
    firstFinish * cue('ga-static-refill-b0', 0, 0.2, 0.4) +
    (secondFinish - firstFinish) * cue('static-wait', 0, 0.5, 0.78) +
    (fixed.makespan - secondFinish) * cue('static-last-pair', 0, 0.8, 0.98);

  api.focus.target('static-refill-mechanism', () => {
    api.text(ctx, 'Reply lengths  ·  8, 2, 5 and 3 steps', 146, 250, 40, api.C.ink);
    drawSchedule(
      ctx,
      api,
      395,
      'Static batch',
      fixed,
      elapsed,
      afterClause(state, 'ga-static-count', 1, 0.63),
    );
    if (state.beat >= 1) {
      const refill = cue('ga-static-refill-b1', 1, 0, 0.34);
      drawSchedule(
        ctx,
        api,
        710,
        'Continuous batching',
        continuous,
        continuous.makespan * refill,
        afterClause(state, 'ga-continuous-count', 1, 0.81),
      );
    }
    api.text(
      ctx,
      'One cell per decode step  ·  a dash marks an empty slot',
      960,
      978,
      37,
      api.C.muted,
      'center',
    );
  });
}

export default {
  id: 'static-refill',
  draw: drawStaticRefill,
  cues: [
    'ga-static-refill-b0',
    'static-wait',
    'static-last-pair',
    'ga-static-refill-b1',
    'ga-static-count',
    'ga-continuous-count',
    'ga-static-refill-b2',
  ],
};
