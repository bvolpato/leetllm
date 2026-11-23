import { requests } from '../fixtures.mjs';
import { dot, line, text } from '../defaults.mjs';
import { requestContract } from '../model.mjs';
import { monitoringScene } from '../storyboard.mjs';

const examples = ['s-104', 's-105'].map((id) => requests.find((row) => row.id === id));
const noon = 12 * 60;

function pointOnClock(x, y, turns, radius) {
  const angle = 2 * Math.PI * turns;
  return { x: x + radius * Math.sin(angle), y: y - radius * Math.cos(angle) };
}

function snapshotClock(ctx, api, x, y, minutes, sweep) {
  const { C } = api;
  dot(ctx, api, x, y, C.ink, 171);
  for (let hour = 0; hour < 12; hour++) {
    const major = hour % 3 === 0;
    const inner = pointOnClock(x, y, hour / 12, major ? 129 : 145);
    const outer = pointOnClock(x, y, hour / 12, 156);
    line(ctx, api, inner.x, inner.y, outer.x, outer.y, C.bg, major ? 6 : 3);
  }
  const hour = pointOnClock(x, y, minutes / noon, 88);
  const minute = pointOnClock(x, y, (minutes % 60) / 60, 124);
  line(ctx, api, x, y, hour.x, hour.y, C.bg, 13);
  line(ctx, api, x, y, minute.x, minute.y, C.bg, 7);
  dot(ctx, api, x, y, C.bg, 11);

  // The outside arc measures elapsed time while the face keeps its recorded reading.
  const from = minutes / noon;
  const arc = Array.from({ length: 33 }, (_, i) =>
    pointOnClock(x, y, from + (1 - from) * sweep * (i / 32), 187),
  );
  api.path(ctx, arc, { color: C.cyan, width: 12 });
  const tip = arc.at(-1);
  dot(ctx, api, tip.x, tip.y, C.cyan, 9);
}

export default monitoringScene(
  'intro',
  ['left', 'right', 'rule', 'block', 'latency', 'score', 'heartbeat', 'outcome'],
  (ctx, api, cue, state) => {
    const { C } = api;
    if (state.t < 0.35) ctx.globalAlpha = 1;
    const elapsed = Math.min(1, (state.t ?? 0) / 1.6);
    const sweep = 0.04 + 0.96 * (1 - (1 - elapsed) ** 2);
    examples.forEach((row, i) => {
      const x = i === 0 ? 520 : 1400;
      const minutes = noon - row.age;
      const stamp = [Math.floor(minutes / 60), minutes % 60]
        .map((v) => String(v).padStart(2, '0'))
        .join(':');
      snapshotClock(ctx, api, x, 388, minutes, sweep);
      text(ctx, api, stamp, x, 702, 108, C.ink);
      text(ctx, api, `${row.backlog} jobs in queue`, x, 774, 43, C.blue);
      const read = cue.started(i === 0 ? 'left' : 'right');
      if (read) {
        const valid = requestContract(row) === 'pass';
        if (cue.done(valid ? 'score' : 'block')) {
          const age = row.age % 60 === 0 ? `${row.age / 60} h` : `${row.age} min`;
          text(
            ctx,
            api,
            `${age} old   /   ${valid ? 'Score' : 'Block'}`,
            x,
            845,
            38,
            valid ? C.green : C.yellow,
          );
        } else {
          text(ctx, api, row.id, x, 845, 38, C.muted);
        }
      }
    });
    let note = 'It’s noon. Which queue count can we use?';
    if (cue.started('rule')) note = 'At noon, use a snapshot from 11:00 through 12:00.';
    if (cue.done('latency')) note = 'Service response time   /   40 milliseconds';
    if (cue.started('heartbeat'))
      note = `At 11:55, the snapshot recorded ${examples[1].heartbeatHours} hours since the last heartbeat.`;
    if (cue.started('outcome'))
      note = `${examples[1].id}   /   score ${examples[1].score.toFixed(2)}   /   sent for review   /   outcome pending`;
    text(ctx, api, note, 960, 950, 38, C.ink);
  },
);
