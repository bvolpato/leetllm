import assert from 'node:assert/strict';
import { rayApplyBatch } from '../../../films/deep-dive-ray/model.mjs';
import { docs, values } from './results.mjs';
import {
  C,
  mono,
  serif,
  rect,
  line,
  label,
  center,
  circ,
  paper,
  header,
  foot,
  cue,
  arrow,
} from './drawing.mjs';

const blank = { count: 0, records: {} };
const saved = rayApplyBatch(blank, 'B17', docs.length).ledger;
function processState(newProcess, example, restored) {
  return {
    pid: newProcess ? 202 : 101,
    count: newProcess ? (example && restored ? saved.count : 0) : docs.length,
    example,
    restored: newProcess && example && restored,
  };
}
function spine(g, x, y, w, h) {
  rect(g, x + 3, y + 11, w + 11, h + 3, '#071e26');
  rect(g, x + 7, y + 4, w, h + 4, '#c8bd9f');
  paper(g, x, y, w, h);
  rect(g, x + 28, y, 13, h, '#c6b99c');
  for (let i = 0; i < 4; i++) circ(g, x + 16, y + 50 + (i * (h - 100)) / 3, 7, C.sky);
}
function ledgerCount(g, x, y, w, h, s, origin) {
  spine(g, x, y, w, h);
  label(g, 'Batch ledger', x + 68, y + 76, 52, C.ink, serif);
  label(g, 'PID ' + s.pid, x + w - 35, y + 70, 34, C.ink, mono, 'right');
  line(g, x + 65, y + 104, x + w - 36, y + 104, C.seam);
  label(g, 'Completed', x + 70, y + 182, 41, C.ink);
  center(g, s.count, x + w / 2, y + 362, 169, C.ink, serif);
  line(g, x + 65, y + h - 87, x + w - 36, y + h - 87, '#b1b6a3');
  label(g, origin, x + 70, y + h - 31, 34, C.ink);
}
export function restart(g, c) {
  const requested = cue(c, 0, 'Stop the actor'),
    stale = cue(c, 0, 'An early poll');
  const changed = !!cue(c, 1, 'Process two oh two');
  const backInLab = !!cue(c, 2, 'Back in the single-node lab');
  const example = !!cue(c, 2, 'Try an application') && !backInLab;
  const s = processState(changed, example, !!cue(c, 2, 'Those entries came from storage'));
  const record = s.example && cue(c, 2, 'batch seventeen');
  header(
    g,
    s.example ? 'Application example   /   Durable batch record, illustrative PIDs'
      : 'Actor restart   /   Single-node lab, illustrative PIDs',
    s.example ? 'What can the replacement recover from B17?' : 'Which count belongs to the replacement?',
  );
  label(g, 'Driver-owned results', 99, 348, 46, C.paper, serif);
  docs.forEach((d, i) => {
    const y = 393 + i * 132;
    rect(g, 97, y, 740, 107, C.faint);
    label(g, String.fromCharCode(65 + i), 123, y + 69, 48, C.aqua, mono);
    label(g, d, 230, y + 69, 45, C.white, serif);
    label(g, '(' + values[i].join(', ') + ')', 810, y + 69, 44, C.paper, mono, 'right');
  });
  ledgerCount(
    g,
    992,
    321,
    824,
    507,
    s,
    s.restored
      ? 'Restored from batch B17'
      : changed
        ? 'Fresh constructor'
        : stale
          ? 'Poll still answered by PID 101'
          : requested
            ? 'Restart requested'
            : 'Three tuples recorded',
  );
  if (record) label(g, 'Durable record    B17 → ' + saved.records.B17, 101, 850, 39, C.orange, mono);
  foot(
    g,
    backInLab
      ? 'Lab check    /    PID changed and count = ' + s.count
      : s.restored
        ? 'Application restore   /   recorded count ' + s.count
        : changed
          ? 'New process ID    ·    same three completed inputs'
          : stale
            ? 'Wait for a different PID before accepting a restart reading.'
            : 'The count lives in the ledger process.',
  );
}

export function control(g, c) {
  const down = cue(c, 0, 'Only the durably backed'),
    known = cue(c, 1, 'because they need the control service');
  const up = cue(c, 1, 'control operations can resume', 0.95) === 1;
  header(g, 'GCS recovery   /   Durable backing store', 'What changes when only the GCS restarts?');
  const x = 100,
    y = 359,
    w = 738,
    h = 405;
  spine(g, x, y, w, h);
  label(g, 'Surviving actor', x + 72, y + 79, 50, C.ink, serif);
  label(g, 'Same process', x + 72, y + 147, 40, C.ink);
  label(g, 'count', x + 72, y + 278, 44, C.ink);
  label(g, 7, x + w - 116, y + 295, 128, C.ink, serif, 'right');
  label(g, 'Existing task running', x + 70, y + 365, 36, C.ink);
  const rx = 1026;
  label(g, 'Cluster records', rx, 402, 52, C.white, serif);
  for (const [i, name] of ['Nodes', 'Actors', 'Groups'].entries()) {
    const yy = 453 + i * 107;
    rect(g, rx, yy, 711, 82, up || !down ? C.aqua : C.faint);
    label(g, name, rx + 24, yy + 56, 39, up || !down ? C.ink : C.paper);
    label(
      g,
      up ? 'reloaded' : down ? 'in backing store' : 'registered',
      rx + 675,
      yy + 55,
      35,
      up || !down ? C.ink : C.muted,
      mono,
      'right',
    );
  }
  foot(
    g,
    up
      ? 'Workers reconnected    /    new control operations resume'
      : !down
        ? 'Cluster control online'
        : known
          ? 'GCS reloading   /   new actor and group operations paused'
          : 'GCS reloading   /   can Ray create a new placement group?',
    up ? C.aqua : C.orange,
  );
}

function receipts(events) {
  let ledger = blank,
    result = null;
  for (const [id, delta] of events) {
    const call = rayApplyBatch(ledger, id, delta);
    ledger = call.ledger;
    result = call.result;
  }
  return { ledger, result };
}
const seventeen = ['B17', 3],
  eighteen = ['B18', 2];
function retryState(c) {
  const applied = cue(c, 0, 'The write commits'),
    lost = cue(c, 0, 'The reply is lost');
  const doubled = cue(c, 1, 'One batch changed'),
    rewind = cue(c, 1, 'Rewind to the same');
  const atomic = cue(c, 1, 'Both entries are on disk');
  const lostAgain = cue(c, 1, 'Lose the reply again');
  const restored = cue(c, 1, 'retry seventeen');
  const retried = cue(c, 1, 'and the count stays three');
  const later = cue(c, 2, 'The count is now five');
  const replied18 = cue(c, 2, 'The ledger sends that result');
  const incoming18 = cue(c, 2, 'A new batch');
  const answered = cue(c, 3, 'Return three');
  if (!rewind)
    return {
      mode: 'Blind increment',
      count: 3 * (Number(applied) + Number(doubled)),
      records: {},
      batch: 'B17',
      highlightedBatch: null,
      delta: 3,
      response: doubled ? '6' : lost ? 'reply lost' : applied ? 'returning' : 'pending',
      lost: lost && !doubled,
    };
  const askAgain = cue(c, 2, 'Try seventeen once more');
  const events = atomic ? [seventeen] : [];
  if (retried) events.push(seventeen);
  if (later) events.push(eighteen);
  if (answered) events.push(seventeen);
  const { ledger, result } = receipts(events);
  const uncertain = askAgain && !answered;
  const [batch, delta] = incoming18 && !askAgain ? eighteen : seventeen;
  return {
    mode: restored ? 'Restored batch receipts' : 'Atomic batch receipt',
    count: ledger.count,
    records: ledger.records,
    batch,
    delta,
    highlightedBatch: uncertain ? null : batch,
    response: uncertain
      ? '?'
      : incoming18 && !replied18
        ? 'pending'
        : retried
          ? String(result)
          : atomic
            ? lostAgain
              ? 'reply lost'
              : 'returning'
            : 'pending',
    lost: lostAgain && !retried,
  };
}
function traceReceipt(g, value, progress) {
  const route = [[968, 648], [1091, 648], [1091, 786], [1740, 786], [1740, 737]];
  const length = route.slice(1).reduce((sum, [x, y], i) =>
    sum + Math.abs(x - route[i][0]) + Math.abs(y - route[i][1]), 0);
  let remaining = progress * length;
  let [x, y] = route[0];
  for (const [tx, ty] of route.slice(1)) {
    if (remaining <= 0) break;
    const distance = Math.abs(tx - x) + Math.abs(ty - y);
    const fraction = Math.min(remaining / distance, 1);
    const nx = x + fraction * (tx - x);
    const ny = y + fraction * (ty - y);
    line(g, x, y, nx, ny, C.aqua, 5);
    [x, y] = [nx, ny];
    remaining -= distance;
  }
  label(g, 'Read receipt B17', 1123, 837, 37, C.aqua, mono);
  if (progress < 1) {
    circ(g, x, y, 27, C.aqua);
    label(g, value, x, y + 12, 34, C.ink, mono, 'center');
  }
}
export function retry(g, c) {
  const s = retryState(c);
  const resolving = c.beat.beatIndex === 3;
  const answer = resolving ? c.wordCue('Return three').end : 0;
  const transfer = resolving ? Math.max(0, Math.min(1, (c.elapsed - answer) / 0.58)) : 0;
  const selected = resolving ? (transfer > 0 ? s.batch : null) : s.highlightedBatch;
  const reply = resolving && transfer < 1 ? '?' : s.response;
  header(
    g,
    'Application recovery   /   Lost reply',
    c.beat.beatIndex >= 2
      ? (s.batch === 'B18' ? 'What should batch eighteen receive?' : 'What should batch seventeen receive?')
      : 'Did the increment commit?',
  );
  label(g, s.mode, 104, 349, 49, C.orange, serif);
  spine(g, 101, 398, 894, 432);
  label(g, 'Committed count', 173, 475, 43, C.ink);
  label(g, s.count, 940, 497, 84, C.ink, serif, 'right');
  line(g, 173, 526, 942, 526, C.seam);
  label(g, 'Batch', 174, 590, 33, C.ink, mono);
  label(g, 'Original reply', 941, 590, 33, C.ink, mono, 'right');
  Object.entries(s.records).forEach(([id, value], i) => {
    const y = 665 + 74 * i;
    if (id === selected) rect(g, 162, y - 52, 798, 67, '#bee0cf');
    label(g, id, 177, y, 45, C.ink, mono);
    label(g, value, 938, y, 45, C.ink, mono, 'right');
  });
  if (!Object.keys(s.records).length) label(g, 'No receipt', 174, 698, 46, '#476268', serif);
  label(g, 'Caller', 1193, 451, 48, C.white, serif);
  label(g, s.batch + '   +' + s.delta, 1197, 551, 58, C.white, mono);
  line(g, 1174, 618, 1775, 618, s.lost ? C.lost : C.aqua, 4, s.lost ? [19, 13] : []);
  if (s.lost) {
    line(g, 1445, 594, 1491, 644, C.lost, 9);
    line(g, 1491, 594, 1445, 644, C.lost, 9);
  }
  label(g, 'Reply', 1196, 727, 38, C.muted);
  label(g, reply, 1774, 732, 55, s.lost ? C.lost : C.aqua, mono, 'right');
  if (transfer > 0) traceReceipt(g, s.records[s.batch], transfer);
  if (c.beat.beatIndex >= 2) {
    label(g, 'One durable commit: count + ID + original reply', 1030, 349, 35, C.muted);
  } else {
    foot(
      g,
      s.mode === 'Blind increment'
        ? 'A lost reply leaves the caller uncertain.'
        : 'Count change + batch ID + original result   /   one durable commit',
    );
  }
}
const maxRetries = 2;
export function retryPolicy(g, c) {
  const b = c.beat.beatIndex,
    actor = b === 2;
  header(
    g,
    actor ? 'Actor   /   Process and method budgets' : 'Ordinary task   /   Worker failures',
    actor ? 'Can this method run again automatically?' : 'How many times can the task start?',
  );
  if (actor) {
    const reopened = cue(c, 2, 'it can open a new process');
    spine(g, 102, 385, 719, 395);
    label(g, 'Actor process', 174, 488, 52, C.ink, serif);
    label(g, 'max_restarts = 1', 172, 590, 44, C.ink, mono);
    label(g, reopened ? 'New process' : 'Process lost', 173, 699, 48, C.ink);
    label(g, 'Lost method reply', 970, 485, 52, C.paper, serif);
    label(g, 'max_task_retries = 0', 971, 590, 45, C.orange, mono);
    if (cue(c, 2, 'A restart budget')) label(g, '0 automatic method replays', 972, 695, 44, C.aqua);
    foot(g, 'Check the batch receipt before the caller retries.');
  } else {
    const firstExit = cue(c, 0, 'the worker exits', 0.65) === 1,
      second = cue(c, 0, 'The next worker exits'),
      secondExit = cue(c, 0, 'How many starts');
    const result = cue(c, 1, 'Two retries follow');
    const stage = 1 + Number(!!second) + Number(!!result);
    label(g, 'max_retries = ' + maxRetries, 100, 367, 53, C.orange, mono);
    for (let i = 0; i < stage; i++) {
      const x = 110 + i * 596;
      rect(g, x, 472, 487, 253, i === 2 ? C.aqua : C.faint);
      label(
        g,
        i === 0 ? 'Original' : 'Retry ' + i,
        x + 32,
        566,
        51,
        i === 2 ? C.ink : C.paper,
        serif,
      );
      label(
        g,
        i === 2 ? 'may start' : (i === 0 ? firstExit : secondExit) ? 'worker exited' : 'running',
        x + 32,
        666,
        40,
        i === 2 ? C.ink : C.orange,
        mono,
      );
      if (i < stage - 1) arrow(g, x + 505, 599, x + 572);
    }
    foot(
      g,
      !result
        ? 'Worker failures only    /    Python exceptions excluded'
        : '1 initial attempt + ' +
            maxRetries +
            ' retries = ' +
            (1 + maxRetries) +
            ' possible attempts',
    );
  }
}
export function checkRecovery() {
  assert.equal(processState(false, false, false).count, docs.length);
  assert.equal(processState(true, true, false).count, 0);
  assert.equal(processState(true, true, true).count, saved.records.B17);
  assert.deepEqual(processState(true, false, true), { pid: 202, count: 0, example: false, restored: false });
  assert.equal(receipts([seventeen, seventeen]).ledger.count, 3);
  const replay = receipts([seventeen, seventeen, eighteen, seventeen]);
  assert.equal(replay.result, 3);
  assert.equal(replay.ledger.count, 5);
  assert.deepEqual(replay.ledger.records, { B17: 3, B18: 5 });
  assert.equal(1 + maxRetries, 3);
}
