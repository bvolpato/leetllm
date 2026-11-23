import { formatClock, pointInTime } from '../arithmetic.mjs';
import { backlogUpdates, hourlyRows } from '../fixtures.mjs';
import { minuteScale, spoken } from '../request-clock.mjs';

export function drawPerRowJoins(ctx, scene, state, api) {
  const clock = spoken(scene, state);
  const shared = clock.started('snapshot');
  const x = minuteScale(525, 575, 486, 1440);
  api.text(ctx, 'Job', 107, 289, 32, api.C.muted);
  api.text(ctx, 'Published queue depth', 504, 289, 32, api.C.muted);
  api.text(ctx, 'Joined value', 1777, 289, 32, api.C.muted, 'right');
  hourlyRows.forEach(({ job, cutoff }, i) => {
    const y = i ? 701 : 466;
    const read = shared ? hourlyRows[1].cutoff : cutoff;
    const match = pointInTime(job, read);
    const updates = backlogUpdates.filter((row) => row.job === job);
    const chosen = updates.filter((row) => row.time <= read).at(-1);
    const label = i ? 'second' : 'first';
    const search = shared ? clock.progress('snapshot') : clock.progress(label);
    const settled = shared ? clock.finished('snapshot-value') : clock.finished(label);
    api.focus.target(i ? 'second-job' : 'first-job', () => {
      api.text(ctx, job, 108, y - 6, 54, api.C.ink);
      api.text(ctx, `scored ${formatClock(cutoff)}`, 110, y + 54, 32, api.C.muted);
      api.line(ctx, x(525), y, x(575), y, '#4b505b', 4);
      api.line(ctx, x(read), y - 65, x(read), y + 62, api.C.yellow, 4);
      api.text(ctx, formatClock(read), x(read), y - 85, 32, api.C.yellow, 'center');
      updates.forEach((row) => {
        api.circle(ctx, x(row.time), y, 12, api.C.cyan);
        api.text(ctx, String(row.value), x(row.time), y - 32, 42, api.C.cyan, 'center');
        api.text(ctx, formatClock(row.time), x(row.time), y + 71, 30, api.C.muted, 'center');
      });
      if (search > 0) {
        const tip = x(read) + (x(chosen.time) - x(read)) * search;
        api.line(ctx, x(read), y + 16, tip, y + 16, api.C.yellow, 5);
        api.circle(ctx, tip, y + 16, 8, api.C.yellow);
      }
      const leaked = chosen.time > cutoff;
      api.text(
        ctx,
        settled ? String(match) : '?',
        1680,
        y + 21,
        74,
        settled ? (leaked ? api.C.pink : api.C.green) : api.C.muted,
        'center',
      );
    });
  });
  api.line(ctx, 105, 839, 1805, 839, '#555962', 2);
  const correct = pointInTime(hourlyRows[0].job, hourlyRows[0].cutoff);
  const later = pointInTime(hourlyRows[0].job, hourlyRows[1].cutoff);
  const description = clock.finished('snapshot-value')
    ? `J-201    ·    ${correct} at its cutoff    →    ${later} using the later snapshot`
    : shared
      ? 'Give both jobs the 09:30 snapshot.'
      : 'Search backward from each request on its own job’s line.';
  api.text(ctx, description, 110, 934, 40, shared ? api.C.pink : api.C.ink);
}
export default {
  id: 'per-row-joins',
  draw: drawPerRowJoins,
  cues: ['first', 'second', 'snapshot', 'snapshot-value'].map((id) => 'sf-per-row-joins-' + id),
};
