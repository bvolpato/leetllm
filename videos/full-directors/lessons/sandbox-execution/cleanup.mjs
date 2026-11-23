import assert from 'node:assert/strict';
import { cleanupFixture, cleanupTransition } from '../../../films/sandbox-execution/model.mjs';
import { sprites } from './sprites.mjs';
import { C, rect, line, label, mono, cap, panel, frame, tag, cue, disk } from './art.mjs';

const leases = cleanupFixture();
function state(lease, processes, name, columns) {
  return { lease, processes, name, columns };
}
function apply(job, type, target, processes = job.processes) {
  if (target.runtimeId !== job.lease.runtimeId || target.generation !== job.lease.generation) return job;
  if ((type === 'terminated' && processes.length) || (type === 'reset-ok' && job.name)) return job;
  const lease = cleanupTransition(job.lease, {
    type,
    ...{ runtimeId: target.runtimeId, generation: target.generation },
  });
  return { ...job, lease, processes };
}
function admit(previous, lease) {
  assert.equal(previous.lease.status, 'reusable');
  assert(!previous.name && !previous.processes.length);
  assert.equal(lease.slot, previous.lease.slot);
  assert(lease.generation > previous.lease.generation);
  return state(lease, ['main', 'painter'], null, 0);
}
function paint(job, name, columns) {
  if (!job.processes.includes('painter')) return job;
  return { ...job, name, columns: Math.min(sprites.columns, Math.max(job.columns, Math.floor(columns))) };
}
const running = state(leases.old, ['main', 'painter'], 'koi', 48);
const canceled = apply(running, 'cancel', leases.old, ['painter']);
const stopped = apply(paint(canceled, 'koi', 69), 'terminated', leases.old, []);
const clean = { ...stopped, name: null, columns: 0 };
const ready = apply(clean, 'reset-ok', leases.old);
const next = admit(ready, leases.newer);

export function fishState(clock) {
  const b = clock.beat.beatIndex;
  if (b === 0) {
    const cancel = cue(clock, 0, 'Cancel the parent');
    return cancel
      ? paint(canceled, 'koi', 50 + 7 * cue(clock, 0, 'Cancel the parent', 4))
      : paint(running, 'koi', 48 + 2 * clock.progress);
  }
  if (b === 1) return paint(canceled, 'koi', 57 + 9 * clock.progress);
  if (b === 2) {
    const stop = cue(clock, 2, 'verifies zero live processes');
    if (stop) return stopped;
    return paint(canceled, 'koi', 66 + 3 * cue(clock, 2, 'stops the whole job', 1));
  }
  if (b === 3)
    return cue(clock, 3, 'Verify it is empty')
      ? ready
      : cue(clock, 3, 'Replace the scratch volume')
        ? clean
        : stopped;
  if (b === 4) {
    const stroke = cue(clock, 4, 'starts a blue ray', 4.2);
    return stroke > 0 ? paint(next, 'ray', 49 * stroke) : next;
  }
  const job = paint(next, 'ray', 49 + 27 * cue(clock, 5, 'Eight keeps painting', 3.8));
  return cue(clock, 5, 'guard slot updates') ? apply(job, 'cancel', leases.old) : job;
}
function preview(c, job) {
  const left = 76,
    top = 260,
    px = 13,
    w = px * sprites.columns,
    h = px * sprites.rows;
  rect(c, left, top, w, h, '#dae3df');
  for (let r = 0; r < sprites.rows; r += 2)
    for (let col = r % 4 ? 2 : 0; col < sprites.columns; col += 4)
      rect(c, left + px * col, top + px * r, px * 2, px * 2, '#e8eee6');
  if (!job.name) return;
  const { pixels, palette } = sprites[job.name];
  pixels.forEach((row, r) => {
    for (let col = 0; col < job.columns; col++)
      if (row[col]) rect(c, left + px * col, top + px * r, px, px, palette[row[col]]);
  });
}
export function cleanup(c, clock) {
  const job = fishState(clock),
    b = clock.beat.beatIndex;
  const recordArrives = b >= 4;
  const guardChecked = b === 5
    && clock.elapsed >= clock.wordCue('guard slot updates by lease generation').end;
  const retryIgnored = guardChecked && apply(job, 'cancel', leases.old) === job;
  frame(
    c,
    'Sprite maker   /   slot A',
    b < 2
      ? 'Who is still drawing the fish?'
      : b < 4
        ? 'May we reuse this slot?'
        : 'Which worker owns slot A?',
  );
  preview(c, job);
  panel(c, 1112, 260, 732, 572);
  const x = 1150;
  cap(c, 'RUNTIME OWNER', x, 326);
  mono(c, job.lease.runtimeId, x, 397, 47);
  line(c, x, 430, 1799, 430);
  const current = job.processes;
  ['main', 'painter'].forEach((name, i) => {
    const live = current.includes(name),
      y = 506 + 84 * i;
    const indent = i * 43;
    if (i) {
      line(c, x + 9, y - 60, x + 9, y - 17);
      line(c, x + 9, y - 17, x + 37, y - 17);
    }
    disk(c, x + indent + 17, y - 13, 14, live ? C.teal : C.line);
    mono(c, name, x + indent + 50, y, 40);
    label(c, live ? 'alive' : 'exited', 1793, y, 40, { align: 'right', color: live ? C.teal : C.muted });
  });
  cap(c, 'ADMISSION STATE', x, recordArrives ? 634 : 667);
  const phase = {
    running: 'Running',
    terminated: 'Hold for reset',
    reusable: 'Verified empty',
    'cancellation-requested': 'Cancel requested',
  };
  tag(
    c,
    phase[job.lease.status],
    x,
    recordArrives ? 650 : 698,
    634,
    job.lease.status === 'reusable' ? C.teal : C.ochre,
    job.lease.status === 'reusable' ? C.pale : '#f6e9c9',
  );
  const footerY = recordArrives ? 861 : 903;
  mono(c, job.name ? job.name + '.rgba' : 'Empty volume', 77, footerY, 41);
  mono(c, (job.name ? 1 : 0) + ' scratch ' + (job.name ? 'file' : 'files'), 1061, footerY, 35, {
    align: 'right',
    color: C.muted,
  });
  if (recordArrives) {
    cap(c, 'INCOMING CLEANUP RECORD', x, 748);
    line(c, x, 784, retryIgnored ? x + 408 : 1799, 784);
    const arrival = cue(clock, 4, 'delayed cleanup record', 0.8);
    if (arrival) {
      const start = x + 130 * (1 - arrival);
      tag(c, leases.old.runtimeId, start, 757, 408, C.red, C.blush);
      if (retryIgnored) {
        const newGeneration = job.lease.generation;
        mono(c, 'g' + leases.old.generation + ' ≠ g' + newGeneration, 1799, 797, 33,
          { align: 'right', color: C.red });
        mono(c, 'Slot keeps g' + newGeneration, x, footerY, 39, { color: C.teal });
      }
    }
  } else
    mono(c, current.length + ' live ' + (current.length === 1 ? 'process' : 'processes'), 1150, 903, 37, {
      color: C.muted,
    });
}
export function checkCleanup() {
  assert.deepEqual(canceled.processes, ['painter']);
  assert(paint(canceled, 'koi', 66).columns > running.columns);
  assert.equal(apply(canceled, 'terminated', leases.old), canceled);
  assert.deepEqual(stopped.processes, []);
  assert.equal(paint(stopped, 'koi', 75), stopped);
  assert.equal(apply(stopped, 'reset-ok', leases.old), stopped);
  assert.throws(() => admit(stopped, leases.newer));
  assert.throws(() => admit(clean, leases.newer));
  assert.equal(next.name, null);
  assert.equal(apply(next, 'cancel', leases.old), next);
  assert.equal(next.lease.generation, 8);
  assert(sprites.koi.pixels.some((row) => row.slice(57, 69).some(Boolean)));
}
