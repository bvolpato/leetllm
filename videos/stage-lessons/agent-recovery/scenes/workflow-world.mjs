import {
  appear,
  arrow,
  assertEqual,
  beside,
  dot,
  draw,
  indicate,
  line,
  place,
  rect,
  seq,
  vanish,
} from 'vizmatic/stage';
import { commitScenario } from '../../../films/agent-recovery/model.mjs';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, OP, cross, token, travel } from '../parts.mjs';

export default function workflowWorld(s, c) {
  const after = commitScenario('after-commit');
  assertEqual([after.replay, after.jobCount], [OP.job, 1], 'replay finds the committed job');
  const title = heading(c.title);
  const [top, body, foot] = area.rows([1, 5, 1], 'normal');
  const [local, remote] = body.columns(2, 'wide');
  const [localHead, remoteHead] = top.columns(2, 'wide');
  const page = (zone) =>
    rect(zone.width, zone.height, {
      fill: 'surface',
      stroke: 'faint',
      width: 3,
      radius: 16,
    }).moveTo(zone.point());
  const slots = (zone) => zone.inset('wide').rows(2, 'wide');
  const [identity, receipt] = slots(local);
  const [ledger, queue] = slots(remote);
  const field = (zone, name) => place(note(name), zone, 'top left');
  const value = (zone, words, color) => place(mono(words, { size: 49, color }), zone, 'left');
  const base = [
    page(local),
    page(remote),
    place(label('Workflow journal', { color: COLOR.attempt }), localHead, 'left'),
    place(label('Controller database', { color: COLOR.controller }), remoteHead, 'left'),
    field(identity, 'Saved before dispatch'),
    field(receipt, 'Local receipt'),
    field(ledger, 'Operation ledger'),
    field(queue, 'Queued jobs'),
  ];
  const key = value(identity, OP.key, COLOR.op);
  const payload = beside(note('RUN-842   ' + OP.revision), key, 'under', 'tight', 'left');
  const empty = value(receipt, '[   empty   ]', 'dim');
  const mapping = value(ledger, OP.key + ' → ' + OP.job, COLOR.op);
  const job = value(queue, OP.job + '   ' + after.job.state, COLOR.sure);
  const confirmed = value(receipt, after.replay, COLOR.sure);
  const caption = (words, color = 'ink') => place(label(words, { color, size: 44 }), foot);
  const prompt = caption(
    'After restart, which job ID can the workflow read from its own journal?',
    COLOR.mark,
  );
  const admit = caption('Approval and preconditions checked again', COLOR.sure);
  const crash = beside(cross(42), empty, 'right', 'wide');
  const send = token('send', COLOR.attempt);
  const repeat = token(OP.key, COLOR.op);
  const returned = token(after.replay, COLOR.sure);
  for (const node of [send, repeat])
    node.moveTo([identity.right - node.width / 2, identity.bottom - 15]);
  returned.moveTo([queue.right - returned.width / 2, queue.bottom - 15]);
  const sendTo = (node) => [ledger.right - node.width / 2, ledger.bottom - 15];
  const receivedAt = [receipt.right - returned.width / 2, receipt.bottom - 15];

  // Put the crash at the same instant on three example schedules.
  const timelineRows = body.rows(3, 'normal');
  const range = body.columns([2, 7], 'wide')[1].inset('wide', 'none');
  const point = (i, fraction) => [range.left + fraction * range.width, timelineRows[i].cy];
  const modes = ['Synchronous', 'Asynchronous', 'On exit'];
  const modeBase = timelineRows.flatMap((region, i) => [
    place(label(modes[i]), region, 'left'),
    arrow(point(i, 0), point(i, 1), { stroke: 'faint', width: 3 }),
  ]);
  const gateX = point(0, 0.76)[0];
  const gate = line([gateX, body.top], [gateX, body.bottom], {
    stroke: COLOR.fail,
    width: 4,
    dash: [10, 9],
  });
  const gateName = label('Process crash', { color: COLOR.fail }).moveTo([gateX, top.cy]);
  const checkpointTitle = place(label('LangGraph on a persistent store'), localHead, 'left');
  const event = (i, fraction, words, color) => {
    const at = point(i, fraction);
    return [dot(11, color).moveTo(at), beside(note(words, { color }), at, 'above', 'normal')];
  };
  const saved = event(0, 0.23, 'key saved', COLOR.sure);
  const outgoing = event(0, 0.58, 'dispatch', COLOR.attempt);
  const writing = event(1, 0.23, 'save started', COLOR.op);
  const concurrent = event(1, 0.58, 'dispatch', COLOR.attempt);
  const unsaved = event(2, 0.58, 'dispatch', COLOR.attempt);
  const pendingSave = line([point(1, 0.23)[0], point(1, 0)[1] + 24], [gateX, point(1, 0)[1] + 24], {
    stroke: COLOR.op,
    width: 4,
    dash: [10, 8],
  });
  const atExit = event(2, 0.92, 'planned exit', 'dim');
  const unknown = caption('Can this process restart with its saved key?', COLOR.mark);
  const answer = caption('The synchronous step confirmed the save before dispatch.', COLOR.sure);

  // Two Activity histories for the same external job. Only the lower path needs the controller.
  const [historyColumn, resultColumn, controllerColumn] = body.columns([4, 3, 3], 'wide');
  const heads = [historyColumn, resultColumn, controllerColumn].map((col, i) =>
    label(['Temporal history at restart', 'Workflow result', 'Controller queue'][i], {
      size: 41,
    }).moveTo([col.cx, top.cy]),
  );
  const historyRows = historyColumn.rows(2, 'wide');
  const resultRows = resultColumn.rows(2, 'wide');
  const inputs = historyRows.map((region) => region.columns(2, 'normal'));
  const names = inputs.flatMap(([a, b]) => [
    place(note('Scheduled key'), a, 'top left'),
    place(note('Completion'), b, 'top left'),
  ]);
  const keys = inputs.map(([cell]) => place(token(OP.key, COLOR.op), cell, 'left'));
  const records = [after.replay, '[ empty ]'].map((words, i) =>
    place(token(words, i ? 'dim' : COLOR.sure), inputs[i][1], 'left'),
  );
  const destinations = resultRows.map((region) => place(token(OP.job, COLOR.sure), region));
  const unknownResults = resultRows.map((region) =>
    place(token('?', COLOR.mark, { dash: [8, 8] }), region),
  );
  const jobOnDisk = place(token(OP.job + '   ' + OP.state, COLOR.sure), controllerColumn);
  const storedKey = beside(
    mono(OP.key, { color: COLOR.op, size: 38 }),
    jobOnDisk,
    'above',
    'normal',
  );
  const jobCount = beside(note(after.jobCount + ' queued job'), jobOnDisk, 'under', 'normal');
  const readBack = token(after.replay, COLOR.sure).moveTo(records[0].center);
  const secondSend = token(OP.key, COLOR.op).moveTo(keys[1].center);
  const historyLink = arrow(records[0].right, destinations[0].left, {
    stroke: COLOR.sure,
    width: 3,
    pad: 12,
  });
  const retryLink = arrow(keys[1].right, storedKey.left, { stroke: COLOR.op, width: 3, pad: 12 });
  const returnLink = arrow(jobOnDisk.left, destinations[1].right, {
    stroke: COLOR.sure,
    width: 3,
    pad: 12,
  });
  const secondReply = token(after.replay, COLOR.sure).moveTo(jobOnDisk.center);
  const question = caption(
    'Which workflow can recover its result entirely from history?',
    COLOR.mark,
  );
  const noSend = beside(note('No new send'), destinations[0], 'under', 'normal');
  const retried = beside(note('Same-key retry'), destinations[1], 'under', 'normal');
  const sameJob = caption('Two attempts at the same operation left one queued job.', COLOR.sure);

  s.add(title, base, empty);
  c.show('save-key', [key, payload]);
  c.on('dispatch', () => s.play(seq(travel(send, sendTo(send)), vanish(send))));
  c.show('commit', [mapping, job]);
  c.show('crash', crash);
  c.show('own-journal', prompt);
  c.on('no-receipt', () => s.play(indicate(empty, { color: COLOR.mark, scale: 1 })));
  c.on('key-survived', () => s.play(indicate(key, { color: COLOR.mark, scale: 1 })));
  c.swap('permission', prompt, admit);
  c.on('same-dispatch', () =>
    s.play(seq(travel(repeat, sendTo(repeat)), vanish(repeat), indicate(mapping, { scale: 1 }))),
  );
  c.on('same-job', () => s.play(seq(travel(returned, receivedAt), vanish(returned))));
  c.swap('save-receipt', [empty, crash], confirmed);
  c.swapAll('graph', [checkpointTitle, modeBase, gate, gateName, unknown], { keep: [title] });
  c.show('sync-save', saved);
  c.show('sync-send', outgoing);
  c.show('async-save', writing);
  c.on('async-send', () => s.play(draw(pendingSave, { duration: 1.2 })));
  c.show('async-send', concurrent);
  c.show('exit-send', [unsaved, atExit]);
  c.swap('durable-first', unknown, answer);
  c.swapAll(
    'temporal',
    [...heads, ...names, ...keys, ...records, ...unknownResults, storedKey, jobOnDisk, jobCount],
    { keep: [title] },
  );
  c.show('which-history', question);
  c.hide('history-read', [question, unknownResults[0]]);
  c.on('history-read', () =>
    s.play(
      draw(historyLink, { duration: 0.8 }),
      seq(
        travel(readBack, destinations[0].center),
        vanish(readBack),
        appear([destinations[0], noSend]),
      ),
    ),
  );
  c.on('missing-result', () => s.play(indicate(records[1], { color: COLOR.mark, scale: 1 })));
  c.on('rerun', () =>
    s.play(
      draw(retryLink, { duration: 0.8 }),
      seq(travel(secondSend, storedKey.center), vanish(secondSend)),
    ),
  );
  c.hide('original-job', unknownResults[1]);
  c.on('original-job', () =>
    s.play(
      draw(returnLink, { duration: 0.8 }),
      seq(
        travel(secondReply, destinations[1].center),
        vanish(secondReply),
        appear([destinations[1], retried]),
      ),
    ),
  );
  c.show('one-job', sameJob);
}
