import assert from 'node:assert/strict';
import { rayObjectLoss, rayApplyBatch } from '../../../films/deep-dive-ray/model.mjs';
import { tiles, east } from './storm.mjs';
import {
  C,
  mono,
  serif,
  rect,
  outline,
  line,
  label,
  center,
  paper,
  header,
  foot,
  cue,
  mix,
} from './drawing.mjs';

function engineState(route, release, admit) {
  return {
    slots: [4, admit ? 7 : release ? null : 9],
    queued: route && !admit,
    routed: route,
    admitted: admit,
  };
}
export function serving(g, c) {
  const travel = cue(c, 0, 'Follow request seven', 1.45);
  const free = cue(c, 1, 'Nine finishes and releases its slot', 1.0) === 1;
  const admit = free && cue(c, 1, 'next to four', 0.52) === 1;
  const s = engineState(travel === 1, free, admit);
  header(g, 'Ray Serve   /   An engine with two cache slots', 'Who admits request seven?');
  label(g, 'Ingress', 106, 390, 49, C.white, serif);
  label(g, 'Replica 1', 757, 390, 56, C.white, serif);
  rect(g, 719, 438, 1097, 369, C.faint);
  outline(g, 719, 438, 1097, 369, C.seam);
  center(g, 'Engine queue', 931, 511, 37, C.muted);
  center(g, 'Cache slots', 1491, 511, 37, C.muted);
  const token = (x, y, id, fill) => {
    rect(g, x - 99, y - 74, 198, 148, fill);
    center(g, 'R' + id, x, y + 20, 60, C.ink, mono);
  };
  for (let i = 0; i < 2; i++) {
    const x = 1337 + 310 * i;
    outline(g, x - 111, 569, 222, 170, C.muted);
    if (s.slots[i] !== null) token(x, 654, s.slots[i], s.slots[i] === 7 ? C.orange : C.aqua);
  }
  line(g, 155, 654, 698, 654, C.seam, 5);
  if (!admit) token(mix(202, 932, travel), 654, 7, C.orange);
  if (travel === 1) label(g, 'Route complete', 102, 803, 38, C.aqua);
  foot(
    g,
    admit
      ? 'Engine batch   R4 + R7    /    R9 released its cache slot'
      : free
        ? 'R9 finished    /    one slot available'
        : s.queued
          ? 'R7 is at replica 1    /    both cache slots occupied'
          : 'Routing among replicas',
    admit ? C.aqua : C.muted,
  );
}
const layout = (tp, pp, replicas) => ({
  tp,
  pp,
  replicas,
  gpus: tp * pp * replicas,
  cpus: replicas,
});
const libraries = [
  ['Data', 'Blocks', 'Read  →  transform  →  sink'],
  ['Train', 'Workers', 'Coordinate training and checkpoints'],
  ['Tune', 'Trials', 'Allocate, evaluate and stop'],
  ['RLlib', 'Samplers', 'Collect experience and learn'],
  ['Serve', 'Replicas', 'Route requests and scale'],
];
export function replicas(g, c) {
  if (c.beat.beatIndex === 2) {
    header(g, 'Ray libraries   /   Units of work', 'What does each library organize?');
    const phases = [
      1,
      cue(c, 2, 'Train coordinates'),
      cue(c, 2, 'Tune runs'),
      cue(c, 2, 'RLlib organizes'),
      cue(c, 2, 'Serve scales'),
    ];
    libraries.forEach(([lib, unit, action], i) => {
      const y = 325 + i * 111;
      if (!phases[i]) return;
      rect(g, 90, y, 16, 84, i === 4 ? C.orange : C.aqua);
      label(g, lib, 134, y + 61, 47, C.white, serif);
      label(g, unit, 515, y + 61, 43, C.aqua, mono);
      label(g, action, 957, y + 60, 42, C.paper);
    });
    foot(g, 'Train coordinates workers. The training framework computes gradients.');
    return;
  }
  const doubled = !!cue(c, 0, 'Double the replica'),
    answer = !!cue(c, 1, 'Multiply tensor size');
  const s = layout(3, 2, doubled ? 2 : 1);
  header(g, 'Ray 2.58.0   /   Standard vLLM layout', 'What must the replicas reserve?');
  for (let r = 0; r < s.replicas; r++) {
    const x = 108 + r * 921;
    label(g, 'Replica ' + (r + 1), x, 354, 55, C.white, serif);
    rect(g, x, 392, 773, 83, C.paper);
    label(g, 'LLMServer    ·    1 CPU actor', x + 24, 448, 40, C.ink, mono);
    for (let stage = 0; stage < s.pp; stage++) {
      const yy = 537 + stage * 148;
      label(g, 'Stage ' + (stage + 1), x, yy + 64, 37, C.muted);
      for (let i = 0; i < s.tp; i++) {
        const xx = x + 205 + i * 189;
        rect(g, xx, yy, 160, 98, C.aqua);
        center(g, 'GPU', xx + 80, yy + 64, 38, C.ink, mono);
        for (let pin = 0; pin < 6; pin++) rect(g, xx + 14 + pin * 24, yy + 98, 11, 10, C.orange);
      }
    }
  }
  foot(
    g,
    answer
      ? s.replicas +
          ' × (' +
          s.tp +
          ' × ' +
          s.pp +
          ') = ' +
          s.gpus +
          ' GPU-worker bundles    /    ' +
          s.cpus +
          ' CPU actors'
      : 'One GPU worker per tile    ·    one CPU actor per replica',
    answer ? C.aqua : C.muted,
  );
}
const start = { count: 0, records: {} };
const first = rayApplyBatch(start, 'B41', 5);
const later = rayApplyBatch(first.ledger, 'B42', 3);
function practiceState(newRef, reply) {
  const repeated = rayApplyBatch(later.ledger, 'B41', 5);
  return {
    old: rayObjectLoss({ ownerAlive: false, copies: 1, lineage: true }).status,
    records: repeated.ledger.records,
    total: repeated.ledger.count,
    result: reply ? repeated.result : null,
    ref: newRef ? 'Y' : null,
  };
}
export function practice(g, c) {
  const failed = cue(c, 1, 'The surviving pixels'),
    reply = cue(c, 1, 'It finds that batch');
  const fresh = cue(c, 2, 'The worker rebuilds'),
    scan = cue(c, 2, 'rebuilds the pixels', 1.5),
    s = practiceState(!!fresh, !!reply);
  header(g, 'Recovery exercise   /   One tile and one batch', 'Which operation would you repeat?');
  const x = 104,
    y = 391,
    w = 550,
    h = 393;
  label(g, 'Node B   /   east', x, 345, 42, C.paper, serif);
  g.drawImage(tiles[1], x, y, w, h);
  label(g, 'Original reference X', 752, 373, 40, C.white);
  line(g, 758, 437, 1150, 437, C.lost, 4, [13, 10]);
  line(g, 941, 419, 974, 455, C.lost, 7);
  line(g, 974, 419, 941, 455, C.lost, 7);
  label(g, 'Owner lost', 754, 519, 46, C.lost, serif);
  if (failed) label(g, s.old, 750, 606, 37, C.orange, mono);
  if (s.ref) {
    label(g, 'Supervisor  /  ' + s.ref, 754, 685, 40, C.aqua, mono);
    rect(g, 754, 712, 179, 128, C.faint);
    const rows = Math.floor(120 * scan);
    if (rows) g.drawImage(tiles[1], 0, 0, 168, rows, 754, 712, 179, (128 * rows) / 120);
    label(g, rows === 120 ? 'ready' : 'decoding', 960, 798, 35, C.aqua);
  }
  paper(g, 1230, 330, 573, 487);
  label(g, 'Durable ledger', 1265, 408, 51, C.ink, serif);
  label(g, 'Latest count', 1267, 486, 36, C.ink);
  label(g, s.total, 1762, 498, 63, C.ink, mono, 'right');
  line(g, 1263, 527, 1765, 527, C.seam);
  Object.entries(s.records).forEach(([id, val], i) => {
    const yy = 611 + i * 90;
    if (reply && id === 'B41') rect(g, 1253, yy - 48, 520, 66, '#b9e2d2');
    label(g, id + '   →   ' + val, 1272, yy, 45, C.ink, mono);
  });
  foot(
    g,
    s.ref
      ? scan === 1
        ? 'Recomputed tile under Y    /    B41 still returns 5'
        : 'New owner and handle    /    decoding the saved scan'
      : s.result !== null
        ? 'Read X   →   ' + s.old + '       Retry B41   →   ' + s.result
        : failed
          ? 'X cannot resolve through its old owner. Look up B41.'
          : 'Source scan saved    /    retry B41 against the restored ledger',
    s.ref ? C.aqua : C.muted,
  );
}
export function checkServing() {
  assert.deepEqual(engineState(true, false, false), {
    slots: [4, 9],
    queued: true,
    routed: true,
    admitted: false,
  });
  assert.deepEqual(engineState(true, true, false).slots, [4, null]);
  assert.deepEqual(engineState(true, true, true).slots, [4, 7]);
  assert.equal(engineState(true, true, true).queued, false);
  assert.deepEqual(layout(3, 2, 2), { tp: 3, pp: 2, replicas: 2, gpus: 12, cpus: 2 });
  assert.deepEqual(practiceState(true, true), {
    old: 'OwnerDiedError',
    records: { B41: 5, B42: 8 },
    total: 8,
    result: 5,
    ref: 'Y',
  });
  assert.equal(east.length, 168 * 120);
}
