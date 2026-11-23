import { cueAmount, cueDone } from '../defaults.mjs';

const plan = 120,
  join = 50;
const reads = [
  { label: 'CI', ms: 200 },
  { label: 'Diff', ms: 350 },
  { label: 'Health', ms: 150 },
];
const longestRead = Math.max(...reads.map((r) => r.ms));
const parallelEnd = plan + longestRead + join;
const serialEnd = plan + reads.reduce((total, r) => total + r.ms, 0) + join;

export function drawCriticalPath(ctx, scene, state, api) {
  const { C } = api;
  const x = (ms) => 385 + 1.56 * ms;
  const backToParallel = cueAmount(state, 'schedule-two-parallel');
  const single = cueAmount(state, 'schedule-serial-move') * (1 - backToParallel);
  const two = cueDone(state, 'schedule-drop');
  const visible = two ? reads.slice(0, 2) : reads;
  const serial = visible.reduce((total, r) => total + r.ms, plan);
  const moving = single > 0 && single < 1;
  const lane = (name, start, duration, y, color, fraction = 1) => {
    api.text(ctx, name, 150, y + 37, 37, C.ink);
    if (fraction <= 0) return;
    api.rect(ctx, x(start), y, duration * 1.56 * fraction, 54, color, undefined, 4);
    api.text(ctx, duration + ' ms', x(start) + 12, y - 15, 28, color);
  };
  api.focus.target('schedule', () => {
    api.text(
      ctx,
      (two ? 'Two reads' : 'Three reads') +
        '   /   ' +
        (moving ? 'rescheduling' : single === 1 ? 'one worker' : 'three workers'),
      150,
      256,
      35,
      C.muted,
    );
    lane('Plan', 0, plan, 350, C.blue);
    let previous = plan,
      joinStart = plan;
    visible.forEach((r, i) => {
      const offset = plan + (previous - plan) * single;
      joinStart = Math.max(joinStart, offset + r.ms);
      const elapsed = cueAmount(state, 'schedule-read') * longestRead;
      lane(r.label, offset, r.ms, 467 + 117 * i, C.cyan, Math.min(1, elapsed / r.ms));
      previous += r.ms;
    });
    if (cueDone(state, 'schedule-diff') && single === 0) {
      api.line(ctx, x(parallelEnd - join), 573, x(parallelEnd - join), 846, C.yellow, 3);
    }
    lane('Join', joinStart, join, 818, C.green, cueAmount(state, 'schedule-join'));
    if (single > 0 || two) {
      const reference = backToParallel > 0 ? serial + join : parallelEnd;
      const workers = backToParallel > 0 ? 'one worker' : 'three workers';
      api.line(ctx, x(0), 285, x(reference), 285, C.muted, 2);
      api.line(ctx, x(reference), 275, x(reference), 295, C.muted, 3);
      api.text(ctx, reference + ' ms with ' + workers, x(reference) + 18, 295, 27, C.muted);
    }
    const label = two
      ? backToParallel === 1
        ? 'The diff still sets the finish   /   120 + 350 + 50 = ' + parallelEnd + ' ms'
        : backToParallel > 0
          ? 'Start CI and diff together again.'
          : cueDone(state, 'schedule-two-read')
            ? 'Two reads in series   /   120 + 200 + 350 + 50 = ' + (serial + join) + ' ms'
            : 'Only the health read has been removed.'
      : cueDone(state, 'schedule-serial')
        ? '120 + 200 + 350 + 150 + 50 = ' + serialEnd + ' ms'
        : moving
          ? 'Place each read after the previous one.'
          : single === 1
            ? 'The reads now take turns on one worker.'
            : cueDone(state, 'schedule-parallel')
              ? '120 + 350 + 50 = ' + parallelEnd + ' ms'
              : state.beat === 0
                ? 'Which read keeps the join waiting?'
                : 'The join starts when the last read returns.';
    api.text(ctx, label, 960, 990, 39, C.ink, 'center');
  });
}
export default {
  id: 'critical-path',
  draw: drawCriticalPath,
  cues: [
    'schedule-plan',
    'schedule-read',
    'schedule-diff',
    'schedule-join',
    'schedule-parallel',
    'schedule-serial-move',
    'schedule-serial',
    'schedule-drop',
    'schedule-two-read',
    'schedule-two-parallel',
  ],
};
