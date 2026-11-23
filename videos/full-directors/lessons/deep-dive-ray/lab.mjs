import assert from 'node:assert/strict';
import { rayPlacement, rayResources } from '../../../films/deep-dive-ray/model.mjs';
import { docs, values } from './results.mjs';
import {
  C,
  mono,
  serif,
  rect,
  outline,
  line,
  label,
  paper,
  header,
  foot,
  cue,
  arrow,
} from './drawing.mjs';

const groups = rayPlacement([2], [1, 1], 'STRICT_PACK');
function labSlots(reserved, ran, released, actor) {
  if (released) return [actor ? 'Ledger' : 'Available', 'Available'];
  if (!reserved) return ['Available', 'Available'];
  return groups.assignment.map((_, i) => (ran ? docs[i] : 'Reserved'));
}
export function lab(g, c) {
  const b = c.beat.beatIndex;
  if (b === 3) {
    header(g, 'Pinned source   /   ray-2.58.0', 'Where would you follow this call?');
    const start = cue(c, 3, 'follow the remote function'),
      worker = cue(c, 3, 'to the raylet');
    const owner = cue(c, 3, 'follow its owner');
    label(g, 'Python submission', 104, 377, 43, C.muted);
    label(g, 'remote_function.py', 104, 467, 46, C.paper, mono);
    if (cue(c, 3, 'start in the actor module')) label(g, 'actor.py', 105, 545, 44, C.paper, mono);
    if (start) {
      arrow(g, 636, 454, 808);
      label(g, 'CoreWorker', 858, 472, 52, C.blue, mono);
    }
    if (worker) {
      arrow(g, 1197, 454, 1350);
      label(g, 'raylet', 1400, 471, 55, C.aqua, mono);
      label(g, 'worker execution', 1400, 555, 38, C.paper);
    }
    if (owner) {
      line(g, 972, 518, 972, 718, C.orange, 4);
      line(g, 972, 718, 748, 718, C.orange, 4);
      label(g, 'Submitting process', 108, 728, 49, C.orange, serif);
      label(g, 'owns result metadata', 108, 805, 38, C.paper);
    }
    foot(
      g,
      'Ray (2018)   /   task and actor execution        Ownership (2021)   /   reference lifetime',
    );
    return;
  }
  header(g, 'Local lab   /   Ray 2.58.0 and Python 3.12', 'What can one machine establish?');
  label(g, 'One node   ·   2 logical CPUs   ·   no GPUs', 108, 353, 46, C.paper);
  outline(g, 99, 400, 1720, 443, C.seam, 4);
  if (b === 0) {
    const reserved = cue(c, 0, 'Two one-CPU bundles reserve'),
      ran = cue(c, 0, 'inspect their tuples'),
      released = cue(c, 0, 'Release the group');
    const actor = cue(c, 0, 'Its explicit reservation');
    const slots = labSlots(reserved, ran, released, actor);
    slots.forEach((name, i) => {
      const x = 169 + i * 855;
      rect(g, x, 466, 705, 295, name === 'Available' ? C.faint : C.paper);
      const ink = name === 'Available' ? C.muted : C.ink;
      label(g, 'CPU ' + (i + 1), x + 34, 541, 36, ink, mono);
      label(g, name, x + 35, 641, 65, ink, serif);
      if (ran && !released)
        label(
          g,
          'Bundle ' + i + '   →   (' + values[i].join(', ') + ')',
          x + 35,
          715,
          40,
          ink,
          mono,
        );
    });
    foot(
      g,
      actor
        ? 'One lifetime CPU for the actor    /    one CPU available for tasks'
        : 'Fresh local runtime    /    80 MiB object-store budget   +   separate worker heaps',
    );
  } else {
    const mark = !!cue(c, 1, 'creates a temporary local marker'),
      dead = !!cue(c, 1, 'then exits'),
      again = !!cue(c, 1, 'The replacement finds'),
      done = !!cue(c, 1, 'What evidence');
    label(g, 'Worker attempt', 163, 498, 42, C.muted);
    label(
      g,
      again ? 'Second process' : 'First process',
      162,
      613,
      61,
      again ? C.aqua : C.paper,
      serif,
    );
    label(
      g,
      again ? (done ? 'returned' : 'read marker') : dead ? 'exited' : 'running',
      164,
      705,
      46,
      C.orange,
      mono,
    );
    if (mark) {
      paper(g, 1053, 463, 634, 305);
      label(g, 'Local filesystem', 1091, 542, 45, C.ink, serif);
      label(g, 'failed-once', 1094, 641, 54, C.ink, mono);
      label(g, 'marker exists', 1094, 711, 38, C.ink);
    }
    foot(
      g,
      b === 1
        ? 'max_retries = 1    /    the marker survives the worker process'
        : 'Two-node evidence requires distinct node IDs and observed bytes or replay.',
    );
  }
}
export function checkLab() {
  assert.deepEqual(groups.assignment, [0, 0]);
  assert.deepEqual(labSlots(true, true, false, false), ['cache', 'router']);
  assert.deepEqual(labSlots(true, true, true, true), ['Ledger', 'Available']);
  assert.equal(rayResources(2, [1]).free, 1);
}
