import { queueEvents } from '../../../films/streaming-features/fixtures.mjs';
import { queueState, applyUpdate } from '../../../films/streaming-features/arithmetic.mjs';
import {
  C,
  board,
  box,
  line,
  path,
  dot,
  type,
  mono,
  ticket,
  screen,
  rule,
  bracket,
  answer,
  after,
  heading,
  chassis,
} from './instrument.mjs';
const [q1, , q2, q3] = queueEvents;
const q4 = { id: 'Q4', delta: 10 };
const delta = (n) => (n > 0 ? '+' + n : String(n).replace('-', '−'));
export function journal(events) {
  const state = queueState();
  const trace = events.map((ev) => ({
    ...ev,
    status: applyUpdate(state, ev),
    backlog: state.backlog,
  }));
  return { state, trace };
}
function tally(g, x, y, w, n, label) {
  chassis(g, x, y, w, 189);
  mono(g, label, x + 20, y + 30, 15, C.muted);
  screen(g, x + 18, y + 54, w - 36, 78);
  mono(g, String(n).padStart(2, '0'), x + w / 2, y + 94, 55, C.green, 'center');
  for (let i = 0; i < 12; i++)
    box(
      g,
      x + 20 + i * ((w - 40) / 12),
      y + 151,
      (w - 50) / 12 - 3,
      15,
      i < n ? C.green : C.deep,
      1,
    );
}
const status = (s) =>
  ({
    'duplicate skipped': 'Retry skipped',
    'blocked negative backlog': 'Rejected',
    'applied': 'Applied',
  })[s];
export function dedupe(g, k) {
  board(g, k, 'One queue, repeated deliveries', 'EVENT LEDGER');
  const n = after(k, 2, 'records a rejection')
    ? 4
    : after(k, 2, 'leaving two')
      ? 3
      : after(k, 2, 'Its retry is skipped')
        ? 2
        : after(k, 2, 'the backlog becomes three')
          ? 1
          : 0;
  const { trace, state } = journal(queueEvents.slice(0, n));
  heading(g, 'SOURCE ORDER', 44, 133);
  heading(g, 'DELTA', 203, 133);
  heading(g, 'OUTCOME', 335, 133);
  queueEvents.forEach((e, i) => {
    const y = 186 + 63 * i;
    const r = trace[i];
    mono(g, e.id, 48, y, 25, r ? C.cream : C.muted);
    mono(g, delta(e.delta), 215, y, 22, r ? C.amber : C.muted);
    mono(
      g,
      r ? status(r.status) : '·',
      335,
      y,
      19,
      r?.status.startsWith('blocked') ? C.red : C.green,
    );
    line(g, 46, y + 30, 536, y + 30, C.metal, 1);
  });
  tally(g, 586, 155, 320, state.backlog, 'QUEUE BACKLOG');
  if (n > 0)
    mono(g, 'Durable IDs needed: ' + [...state.seen.keys()].join(', '), 47, 468, 17, C.muted);
  else type(g, 'What should a retry of Q1 do?', 585, 403, 23, C.cream, 'left', 'Serif');
}
export function transaction(stage) {
  const committed = ['committed', 'retry'].includes(stage);
  return {
    ledger: committed ? 'Q1 applied' : 'Empty',
    backlog: committed ? 3 : 0,
    pendingLedger: ['id', 'both'].includes(stage) ? 'Q1 applied' : 'Empty',
    pendingBacklog: stage === 'both' ? 3 : 0,
  };
}
export function restart(g, k) {
  const b = k.beat.beatIndex + 1;
  board(
    g,
    k,
    b <= 3 ? 'What survives the stop?' : 'Can a rejected change run later?',
    b <= 3 ? 'SQLITE TRANSACTION' : 'SOURCE ORDER',
  );
  if (b <= 3) {
    let stage = 'empty',
      action = 'Begin Q1    +3';
    if (after(k, 1, 'write the ID')) {
      stage = 'id';
      action = 'ID written inside transaction';
    }
    if (after(k, 1, 'Reopen the file')) {
      stage = 'rollback';
      action = 'Reopened after process exit';
    }
    if (after(k, 2, 'write both')) {
      stage = 'both';
      action = 'Two tentative writes';
    }
    if (after(k, 2, 'Reopen and we still')) {
      stage = 'rollback';
      action = 'Stopped before commit · reopened';
    }
    if (after(k, 2, 'On the next attempt')) {
      stage = 'both';
      action = 'Retry Q1 in a new transaction';
    }
    if (after(k, 2, 'Stop before acknowledgment')) {
      stage = 'committed';
      action = 'Committed · acknowledgment lost';
    }
    if (after(k, 3, 'the ledger recognizes')) {
      stage = 'retry';
      action = 'Retry recognized · same durable state';
    }
    const s = transaction(stage);
    for (const [i, [label, lg, bg]] of [
      ['In transaction', s.pendingLedger, s.pendingBacklog],
      ['Durable file', s.ledger, s.backlog],
    ].entries()) {
      const x = 49 + i * 450;
      chassis(g, x, 129, 410, 235);
      mono(g, label, x + 24, 163, 20, i ? C.green : C.amber);
      screen(g, x + 18, 190, 374, 153);
      mono(g, 'Ledger', x + 30, 231, 16, C.muted);
      mono(g, lg, x + 367, 231, 21, C.cream, 'right');
      mono(g, 'Backlog', x + 30, 294, 16, C.muted);
      mono(g, !i && stage !== 'both' ? '·' : bg, x + 367, 294, 29, C.cream, 'right');
    }
    type(g, action, 480, 433, 28, C.cream, 'center', 'Serif');
    return;
  }
  const events = [q1];
  if (after(k, 4, 'Q two subtracts')) events.push(q2);
  if (after(k, 4, 'the ledger records')) events.push(q3);
  if (after(k, 4, 'bringing the backlog')) events.push(q4);
  if (after(k, 5, 'its rejection still stands')) events.push(q3);
  const { state, trace } = journal(events);
  trace.forEach((r, i) => {
    const y = 152 + 52 * i;
    mono(g, r.id, 51, y, 22);
    mono(g, delta(r.delta), 142, y, 20, C.amber);
    mono(g, status(r.status), 244, y, 18, r.status === 'applied' ? C.green : C.red);
    mono(g, r.backlog, 452, y, 22, C.cream, 'right');
    line(g, 46, y + 23, 478, y + 23, C.lip, 1);
  });
  tally(g, 555, 150, 342, state.backlog, 'COMMITTED BACKLOG');
  if (after(k, 5, 'raises a payload conflict'))
    mono(g, 'Q1 with a different delta: payload conflict', 50, 466, 18, C.red);
}
export function retentionTrial(days) {
  const retryDay = 10;
  const onFile = retryDay < days;
  return { days, retryDay, onFile, backlog: onFile ? q1.delta : q1.delta * 2 };
}
export function horizon(g, k) {
  const b = k.beat.beatIndex + 1;
  board(
    g,
    k,
    b === 1
      ? 'A rejection travels with the ID'
      : b <= 3
        ? 'Is Q1 still on file on day ten?'
        : 'Where the transaction ends',
    'SINK RECOVERY',
  );
  if (b === 1) {
    const { state } = journal([q1, q2, q3, q4, q3]);
    ticket(g, 54, 157, 471, 141, 'Q3     DELTA −5', 'Rejection on file', C.rust);
    tally(g, 569, 133, 325, state.backlog, 'QUEUE BACKLOG');
    type(g, 'Source order fixes the state that Q3 saw.', 55, 409, 27, C.cream, 'left', 'Serif');
    mono(g, 'Out-of-order changes need buffering or reconciliation.', 55, 457, 16, C.muted);
    return;
  }
  if (b <= 3) {
    const x = rule(g, 213, 354, 638, 0, 14, [
      [0, 'Day 0'],
      [7, '7'],
      [10, '10'],
      [14, '14'],
    ]);
    heading(g, 'STORE IDs', 46, 179);
    heading(g, 'SOURCE LOG', 45, 259);
    const trial = retentionTrial(b === 3 ? 14 : 7);
    box(g, x(0), 158, x(trial.days) - x(0), 39, C.green, 4);
    mono(g, trial.days + ' days', x(0) + 14, 179, 18, C.deep);
    box(g, x(0), 239, x(14) - x(0), 39, C.blue, 4);
    mono(g, '14 days', x(0) + 14, 259, 18, C.deep);
    if (after(k, 2, 'On day ten')) {
      line(g, x(trial.retryDay), 122, x(trial.retryDay), 347, C.amber, 3);
      mono(g, 'Q1 retry', x(trial.retryDay), 103, 18, C.amber, 'center');
    }
    if (b === 2 ? after(k, 2, 'It can add three') : after(k, 3, 'the store still recognizes')) {
      type(
        g,
        trial.onFile
          ? 'Q1 is still on file. Backlog stays at ' + trial.backlog + '.'
          : 'Q1 can apply again after expiry. Backlog can rise from 3 to ' + trial.backlog + '.',
        47,
        446,
        25,
        C.cream,
        'left',
        'Serif',
      );
    }
    return;
  }
  box(g, 51, 142, 568, 206, C.metal, 12, C.green);
  heading(g, 'KAFKA TRANSACTION', 75, 173);
  ticket(g, 76, 209, 251, 91, 'OUTPUT TOPIC', 'Record');
  ticket(g, 348, 209, 239, 91, 'CONSUMER', 'Offset');
  line(g, 620, 252, 718, 252, C.amber, 3);
  path(
    g,
    [
      [710, 246],
      [720, 252],
      [710, 258],
    ],
    C.amber,
    2,
  );
  screen(g, 724, 189, 183, 132);
  mono(g, 'Redis', 816, 232, 25, C.green, 'center');
  mono(g, 'Sink write', 816, 282, 15, C.muted, 'center');
  type(
    g,
    'Coordinate source progress with the external write.',
    51,
    417,
    26,
    C.cream,
    'left',
    'Serif',
  );
  if (b === 5)
    mono(
      g,
      'Stop before commit    ·    Stop after commit    ·    Lose acknowledgment',
      51,
      469,
      15,
      C.muted,
    );
}
