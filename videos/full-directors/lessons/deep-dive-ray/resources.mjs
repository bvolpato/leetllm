import assert from 'node:assert/strict';
import { rayPlacement, rayResources } from '../../../films/deep-dive-ray/model.mjs';
import {
  C,
  mono,
  serif,
  rect,
  outline,
  line,
  label,
  center,
  circ,
  paper,
  header,
  foot,
  cue,
} from './drawing.mjs';

const bundles = [1, 1, 1, 1];
function placementState(capacities, policy, failedNode) {
  const { assignment } = rayPlacement(capacities, bundles, policy);
  return capacities.map((capacity, i) => ({
    capacity,
    offline: i === failedNode,
    members: assignment.flatMap((owner, j) => owner === i ? ['B' + (j + 1)] : []),
  }));
}
function rack(g, x, y, node, known, bound) {
  const width = 735;
  rect(g, x + 10, y + 10, width, 237, '#0a2028');
  rect(g, x, y, width, 237, '#405964');
  for (let j = 0; j < node.capacity; j++) {
    const cellWidth = 153,
      sx = x + 33 + j * (cellWidth + 16),
      sy = y + 31;
    const member = known && node.members[j];
    rect(g, sx, sy, cellWidth, 172, member && !node.offline ? C.aqua : C.sky);
    for (let k = 0; k < 8; k++) rect(g, sx + 11 + k * 17, sy + 155, 9, 17, node.offline ? C.seam : C.orange);
    if (member) {
      const ink = node.offline ? C.lost : C.ink;
      center(g, member, sx + 76, sy + 76, 54, ink, mono);
      center(g, node.offline ? 'lost' : bound ? 'worker' : 'held', sx + 76, sy + 130, 35, ink);
    } else center(g, 'free', sx + 76, sy + 90, 42, C.muted, mono);
  }
  for (const pos of [15, width - 15]) {
    circ(g, x + pos, y + 14, 5, C.sky);
    circ(g, x + pos, y + 222, 5, C.sky);
  }
}
export function placement(g, c) {
  const b = c.beat.beatIndex,
    strictSpread = cue(c, 4, 'Try STRICT SPREAD');
  const policy = !cue(c, 1, 'Try that policy')
    ? 'PACK'
    : b < 3
      ? 'STRICT_PACK'
      : strictSpread
        ? 'STRICT_SPREAD'
        : 'SPREAD';
  const expanded = cue(c, 2, 'Give node A four free slots') && b === 2;
  const extra = cue(c, 4, 'even if we add free GPUs');
  const cap = expanded ? [4, 2] : extra ? [3, 3] : [2, 2];
  const failed = !!cue(c, 4, 'Node A goes offline') && !strictSpread;
  const nodes = placementState(cap, policy, failed ? 0 : null);
  const used = nodes.map(node => node.offline ? 0 : node.members.length);
  const known = b !== 0 || cue(c, 0, 'can reserve two on each node');
  const bound = b === 2 && !!cue(c, 2, 'These workers each select');
  header(
    g,
    'Placement group   /   Four one-GPU bundles',
    policy === 'SPREAD' ? 'If A fails, which reservations survive?'
      : strictSpread ? 'How many distinct nodes can the group use?' : 'Can all four workers share one node?',
  );
  label(g, policy, 97, 380, 68, C.paper, mono);
  label(
    g,
    {
      PACK: 'Prefer one node',
      STRICT_PACK: 'Require one node',
      SPREAD: 'Prefer different nodes',
      STRICT_SPREAD: 'Require four different nodes',
    }[policy],
    790,
    377,
    48,
    C.orange,
  );
  for (let i = 0; i < 2; i++) {
    const x = 108 + i * 967;
    const node = nodes[i];
    const status = node.offline ? 'offline' : node.capacity + ' GPUs';
    label(g, 'Node ' + 'AB'[i] + '   ·   ' + status, x, 497, 48, node.offline ? C.lost : C.paper);
    rack(g, x, 536, node, known, bound);
  }
  const ready = used[0] + used[1] === bundles.length;
  let caption = '0 GPUs reserved    /    group pending';
  if (!known) {
    caption = 'Initial request    4 × {GPU: 1}';
  } else if (failed) {
    caption = cue(c, 4, 'Ray tries to reschedule')
      ? nodes[1].members.join(' + ') + ' still reserved on B    /    ' +
        nodes[0].members.join(' + ') + ' awaiting GPUs'
      : 'Node A went offline after the group was placed.';
  } else if (ready) {
    caption = used.join(' + ') + ' GPUs reserved    /    ' +
      (bound ? 'workers use explicit bundle indices' : 'group ready');
  }
  foot(g, caption, ready && known ? C.aqua : C.orange);
}

export function cpu(g, c) {
  const full = cue(c, 1, 'If all four units'),
    admitted = cue(c, 1, 'The waiting actors');
  const actors = full ? [1, 1, 1, 1] : [1, 1],
    state = rayResources(4, actors);
  header(g, 'Raylet   /   Logical resources on one node', 'How many one-CPU tasks fit?');
  label(g, '4 logical CPUs', 107, 370, 47, C.muted);
  for (let i = 0; i < state.total; i++) {
    const x = 106 + i * 435,
      held = i < state.held,
      job = admitted && !held;
    const fill = held ? C.blue : job ? C.aqua : C.faint;
    for (let k = 0; k < 9; k++) {
      rect(g, x + 25 + k * 36, 433, 11, 28, C.seam);
      rect(g, x + 25 + k * 36, 719, 11, 30, C.seam);
    }
    rect(g, x, 461, 353, 258, fill);
    outline(g, x + 15, 476, 323, 228, held || job ? C.ink : C.seam, 2);
    center(
      g,
      held ? 'Actor ' + (i + 1) : job ? 'Task ' + (i - state.held + 1) : 'Available',
      x + 176,
      587,
      51,
      held || job ? C.ink : C.muted,
      serif,
    );
    center(
      g,
      held ? 'waiting' : job ? 'admitted' : '1 CPU',
      x + 176,
      653,
      34,
      held || job ? C.ink : C.muted,
      mono,
    );
  }
  foot(
    g,
    full
      ? '4 reserved by actors    /    child pending'
      : admitted
        ? '4 logical CPUs − 2 actor reservations = 2 task slots'
        : 'Waiting actors retain their lifetime reservations.',
    full ? C.orange : C.muted,
  );
}

// A slot covers a submitted result until the sink consumes it, even after the worker finishes.
function windowState(event) {
  const slots = [1, 2, 3],
    consumed = [],
    ready = new Set();
  let submitted = 3;
  if (event >= 1) ready.add(1);
  for (let i = 1; i <= 9; i++) {
    if (event < 2 * i) break;
    const slot = slots.indexOf(i);
    slots[slot] = null;
    consumed.push(i);
    ready.delete(i);
    if (event >= 2 * i + 1 && submitted < 9) slots[slot] = ++submitted;
    if (event >= 2 * i + 1 && i < 9) ready.add(i + 1);
  }
  return { slots, ready, submitted, consumed, outstanding: submitted - consumed.length };
}
export function windowScene(g, c) {
  let event = cue(c, 0, 'The first report becomes ready');
  if (cue(c, 1, 'Now the sink takes it')) event = 2;
  if (cue(c, 1, 'Submit number four')) event = 3;
  if (c.beat.beatIndex === 2) event = 3 + Math.floor(15 * cue(c, 2, 'Let the sink drain', 4.8));
  const state = windowState(event);
  header(g, 'Report archive   /   Nine documents', 'When can the next report enter?');
  label(g, 'At the driver', 90, 375, 44, C.muted);
  label(g, 'Three outstanding slots', 542, 375, 44, C.white);
  label(g, 'At the sink', 1490, 375, 44, C.muted);
  for (let i = 0; i < Math.min(4, 9 - state.submitted); i++) {
    const off = (Math.min(4, 9 - state.submitted) - 1 - i) * 10;
    paper(g, 102 + off, 475 - off, 240, 279);
  }
  if (state.submitted < 9) {
    label(g, 'Report', 125, 548, 36, C.ink);
    center(g, state.submitted + 1, 226, 673, 96, C.ink, serif);
  }
  center(g, 9 - state.submitted + ' waiting', 241, 827, 36, C.muted);
  state.slots.forEach((id, i) => {
    const x = 533 + 285 * i;
    outline(g, x, 444, 254, 362, C.seam);
    if (id) {
      rect(g, x + 14, 483, 226, 225, state.ready.has(id) ? C.aqua : C.blue);
      center(g, 'Report', x + 127, 554, 37, C.ink);
      center(g, id, x + 127, 655, 83, C.ink, serif);
    }
    center(
      g,
      id ? (state.ready.has(id) ? 'ready' : 'running') : 'open',
      x + 127,
      770,
      37,
      id ? C.paper : C.aqua,
    );
  });
  const n = state.consumed.length;
  if (n) {
    paper(g, 1501, 489, 236, 215);
    center(g, 'Received', 1619, 563, 34, C.ink);
    center(g, state.consumed.at(-1), 1619, 653, 77, C.ink, serif);
  } else center(g, 'busy', 1622, 609, 51, C.orange);
  center(g, n + ' consumed', 1623, 827, 36, C.muted);
  foot(
    g,
    state.submitted +
      ' submitted   −   ' +
      n +
      ' consumed   =   ' +
      state.outstanding +
      ' outstanding',
    C.aqua,
  );
}

const memoryState = (ref, view, spilled) => ({
  ref,
  view,
  array: ref || view ? 48 : 0,
  heap: 30,
  other: spilled ? 0 : 16,
  disk: spilled ? 16 : 0,
});
export function memory(g, c) {
  const deleted = cue(c, 0, 'Delete the local object reference'),
    other = c.beat.beatIndex === 2;
  const spilled = !!cue(c, 2, 'The pinned array stays');
  const m = memoryState(!deleted, true, spilled);
  header(
    g,
    'Worker memory   /   Payload sizes in MiB',
    other ? 'Where did the spill go?' : 'Can the store reuse these 48 MiB?',
  );
  const top = 438,
    h = 257,
    scale = 15;
  label(g, 'Shared object store', 110, 369, 49, C.paper, serif);
  label(g, 'Private heap', 1197, 369, 49, C.paper, serif);
  rect(g, 108, top, scale * m.array, h, C.aqua);
  center(g, 'Array   ' + m.array + ' MiB', 108 + (scale * m.array) / 2, 588, 55, C.ink, mono);
  if (other) {
    outline(g, 108 + scale * 48, top, scale * 16, h);
    if (m.other) {
      rect(g, 108 + scale * 48, top, scale * m.other, h, C.orange);
      center(g, '16 MiB', 948, 587, 41, C.ink, mono);
    }
  }
  rect(g, 1197, top, scale * m.heap, h, C.blue);
  center(g, m.heap + ' MiB', 1422, 588, 58, C.ink, mono);
  if (m.ref) {
    line(g, 249, top + h, 249, 754, C.blue, 5);
    center(g, 'ObjectRef', 249, 807, 38, C.blue, mono);
  }
  if (m.view) {
    line(g, 596, top + h, 596, 754, C.aqua, 5);
    center(g, 'array view', 596, 807, 38, C.aqua, mono);
  }
  if (other)
    label(g, 'Disk   ' + m.disk + ' MiB', 1197, 806, 44, spilled ? C.orange : C.muted, mono);
  foot(
    g,
    other
      ? 'Shared payload   ' +
          (m.array + m.other) +
          ' MiB    /    heap   ' +
          m.heap +
          ' MiB    /    disk   ' +
          m.disk +
          ' MiB'
      : c.beat.beatIndex === 1 && cue(c, 1, 'so those pages stay occupied')
        ? 'Live view    /    all ' + m.array + ' MiB remain pinned in the object store'
        : deleted
        ? 'ObjectRef deleted    ·    array view still live'
        : 'One shared allocation, two live links',
  );
}
export function checkResources() {
  assert.deepEqual(rayPlacement([2, 2], bundles, 'PACK').used, [2, 2]);
  for (const policy of ['STRICT_PACK', 'STRICT_SPREAD'])
    assert.deepEqual(rayPlacement([2, 2], bundles, policy).used, [0, 0]);
  assert.deepEqual(rayPlacement([4, 2], bundles, 'STRICT_PACK').used, [4, 0]);
  assert.equal(rayPlacement([3, 3], bundles, 'STRICT_SPREAD').ready, false);
  assert.deepEqual(placementState([2, 2], 'SPREAD', 0), [
    { capacity: 2, offline: true, members: ['B1', 'B3'] },
    { capacity: 2, offline: false, members: ['B2', 'B4'] },
  ]);
  assert.equal(rayResources(4, [1, 1]).free, 2);
  assert.equal(rayResources(4, [1, 1, 1, 1]).childFits, false);
  for (let i = 0; i <= 18; i++) {
    const s = windowState(i);
    assert.equal(s.slots.filter(Boolean).length, s.outstanding);
    assert.equal(new Set([...s.consumed, ...s.slots.filter(Boolean)]).size, s.submitted);
    for (const id of s.ready) assert.ok(s.slots.includes(id));
  }
  assert.deepEqual(windowState(2).slots, [null, 2, 3]);
  assert.deepEqual(windowState(3).slots, [4, 2, 3]);
  assert.equal(windowState(18).consumed.length, 9);
  const pinned = memoryState(false, true, true);
  assert.equal(pinned.array, 48);
  assert.equal(pinned.heap, 30);
  assert.equal(pinned.disk, 16);
}
