import { arrow, dot, draw, group, indicate, line, place, to } from 'vizmatic/stage';
import { operation, transactionTrace } from '../../../films/capstone-production-llm-agent/model.mjs';
import { area, chip, heading, label, mono } from '../../kit-narrated.mjs';
import { C, countQuery, field, paper, short } from '../parts.mjs';

function remotePaths() {
  const [headers, first, second, question] = area.rows([0.75, 3, 3, 1], 'normal');
  const columns = (r) => r.columns([1.5, 3.8, 2], 'wide');
  const [callerHead, , serviceHead] = columns(headers);
  const [caller1, route1, service1] = columns(first);
  const [caller2, route2, service2] = columns(second);
  const [outbound, inbound] = route1.rows(2, 'tight');
  const request = route2.rows(2, 'tight')[0];
  function journey(region, text, color, lost, returning = false) {
    const [name, track] = region.inset('tight').rows(2, 'tight');
    const start = track.point(returning ? 'right' : 'left');
    const end = track.point(lost ? 'center' : 'right');
    const stop = end[0] + (returning ? -26 : 26);
    const y = end[1];
    return {
      name: place(label(text, { color, size: 36 }), name),
      path: arrow(start, end, { stroke: color, width: 6 }),
      stop: lost && group(
        line([stop - 10, y - 10], [stop + 10, y + 10], { stroke: C.blocked, width: 6 }),
        line([stop - 10, y + 10], [stop + 10, y - 10], { stroke: C.blocked, width: 6 }),
      ),
    };
  }
  const delivered = journey(outbound, 'Restore request', C.ticket, false);
  const lostReply = journey(inbound, 'Reply lost', C.stored, true, true);
  const lostRequest = journey(request, 'Request lost', C.ticket, true);
  const receipts = [caller1, caller2].map((r) => place(mono('0 receipts', { size: 43, color: C.stored }), r));
  const unknown = [service1, service2].map((r) => field(r, '?', C.active, 64));
  const restored = field(service1, 'Access restored', C.effect, 42);
  const unchanged = field(service2, 'Key still disabled', 'dim', 42);
  const ask = field(question, 'Would you send the request again?', C.active, 42);
  const reuse = field(question, 'Same request key and parameters while the service honors them', C.stored, 39);
  const reconcile = field(question, 'Otherwise, check the account at the destination before retrying.', C.stored, 39);
  return { delivered, lostReply, lostRequest, receipts, unknown, restored, unchanged, ask, reuse, reconcile,
    desk: [heading('The caller timed out. Did the restore happen?'),
      field(callerHead, 'Caller', C.stored, 44), field(serviceHead, 'Access service', C.ticket, 44),
      line(headers.point('bottom left'), headers.point('bottom right'), { stroke: 'grid', width: 3 }),
      line(first.point('bottom left'), first.point('bottom right'), { stroke: 'grid', width: 3 })],
  };
}

export default function replay(s, c) {
  const [meta, views, ledger, foot] = area.rows([0.8, 4.2, 2.1, 0.85], 'normal');
  const [left, right] = views.columns(2, 'wide');
  const [reviews, effects] = ledger.columns(2, 'wide');
  const key = short(operation) + '…';
  const failed = transactionTrace(true).at(-1);
  const success = transactionTrace(false).at(-1);
  const counter = (where, value, color) => place(label(String(value), { color, size: 95 }), where);
  function connection(region, name, color) {
    const [title, sql, value, row] = region.inset('normal').rows([1, 1, 2, 1.2], 'tight');
    return {
      shell: [paper(region, color), field(title, name, color, 40)],
      sql: place(mono(countQuery, { size: 34 }), sql),
      value, row,
    };
  }
  const writer = connection(left, 'Writer connection', C.active);
  const reader = connection(right, 'Independent reader', C.stored);
  const [reviewLabel, approvalRow] = reviews.inset('normal').rows([1, 1.4], 'tight');
  const [effectLabel, effectRow] = effects.inset('normal').rows([1, 1.4], 'tight');
  const pending = place(chip('Uncommitted   ' + key, { color: C.active, size: 31 }), writer.row);
  const second = place(chip('Uncommitted   ' + key, { color: C.active, size: 31 }), writer.row);
  const moving = dot(12, C.effect).moveTo(writer.row.point('center'));
  const done = place(chip(key + '    A300    prod-api', { color: C.effect, size: 33 }), effectRow);
  const stationary = place(chip('Approved   ' + key, { color: C.review, size: 33 }), approvalRow);
  const empty = place(label('Empty', { color: 'dim', size: 40 }), effectRow);
  const w1 = counter(writer.value, 1, C.active);
  const w0 = counter(writer.value, failed.committed, C.stored);
  const r0 = counter(reader.value, failed.committed, C.stored);
  const r1 = counter(reader.value, success.committed, C.effect);
  const wCommitted = counter(writer.value, success.committed, C.effect);
  const begin = field(meta, 'Attempt 1    ·    clock 1001    ·    ' + key, C.ticket);
  const retry = field(meta, 'Attempt 2    ·    clock 1002    ·    ' + key, C.ticket);
  const replayed = field(meta, 'Attempt 3    ·    clock 1003    ·    ' + key, C.ticket);
  const lock = field(foot, 'BEGIN IMMEDIATE    ·    one writer', C.active);
  const fault = field(foot, 'Exception before COMMIT', C.blocked);
  const question = field(foot, 'After rollback, which record survives: approval or effect?', C.active);
  const rollback = field(foot, 'ROLLBACK', C.blocked);
  const commit = field(foot, 'COMMIT', C.effect);
  const duplicate = field(foot, 'duplicate_ignored', C.stored);
  const remote = remotePaths();
  s.add(heading(c.title), begin, writer.shell, reader.shell, paper(reviews), paper(effects),
    field(reviewLabel, 'Committed approval', C.review, 32), stationary,
    field(effectLabel, 'Committed effects', C.effect, 32), empty);
  c.show('begin-write', lock);
  c.show('insert-pending', pending);
  c.show('count-both', [writer.sql, reader.sql]);
  c.show('writer-one', w1, { after: true });
  c.show('reader-zero', r0, { after: true });
  c.swap('precommit-fault', lock, fault);
  c.swap('survival-question', fault, question);
  c.swap('rollback', [pending, w1, question], [w0, rollback], { after: true });
  c.on('rollback', () => s.play(indicate(stationary, { scale: 1, color: C.review })));
  c.swap('retry', [begin, rollback], [retry, lock]);
  c.show('retry-insert', second);
  c.swap('retry-insert', w0, w1, { after: true });
  c.swap('commit', [lock, empty, w1, second], [commit, wCommitted], { after: true, fade: 0.1 });
  c.after('commit', () => {
    s.add(moving);
    s.play(to(moving, (n) => n.moveTo(reader.row.point('center')), { duration: 0.32 }));
    s.play(to(moving, (n) => n.moveTo(effectRow.point('center')), { duration: 0.22 }));
  }, 0.13);
  c.swap('commit', moving, done, { after: true, lead: -0.68, fade: 0.1 });
  c.swap('reader-one', r0, r1, { after: true });
  c.swap('replay-key', [retry, commit], replayed);
  c.on('replay-key', () => s.play(indicate(done, { scale: 1, color: C.active })));
  c.show('duplicate', duplicate, { after: true });
  c.swapAll('remote-uncertain', [...remote.desk, remote.delivered.name, ...remote.unknown, ...remote.receipts], { fade: 0.12 });
  c.on('remote-timeout', () => s.play(...remote.unknown.map((value) => indicate(value, { scale: 1.1 }))));
  c.on('remote-arrival', () => s.play(draw(remote.delivered.path), { duration: 0.65 }));
  c.swap('remote-applied', remote.unknown[0], remote.restored, { after: true });
  for (const [cue, leg] of [['remote-no-reply', remote.lostReply], ['remote-absent', remote.lostRequest]]) {
    c.show(cue, leg.name);
    c.on(cue, () => s.play(draw(leg.path), { duration: 0.65 }));
    c.show(cue, leg.stop, { after: true });
  }
  c.swap('remote-absent', remote.unknown[1], remote.unchanged, { after: true });
  c.on('remote-predict', () => s.play(...remote.receipts.map((value) => indicate(value, { scale: 1.1 }))));
  c.show('remote-predict', remote.ask, { after: true });
  c.swap('remote-reuse', remote.ask, remote.reuse, { after: true });
  c.swap('remote-reconcile', remote.reuse, remote.reconcile);
}
