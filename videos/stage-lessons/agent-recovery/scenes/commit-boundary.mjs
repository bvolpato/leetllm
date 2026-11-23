// Scene `commit-boundary`: the fault point decides what the controller holds.
//
// The picture: the line of the operation. The ledger row and the job row wait over the commit
// line in one transaction. A fault before the line: both go away. Run again: both cross the
// line together, and the reply is lost. Then the same key finds the row, and a status read
// finds the job. The result is 0 records or 2 records, and never 1.
import {
  appear,
  assertEqual,
  beside,
  between,
  boxOf,
  column,
  delay,
  fadeIn,
  fadeOut,
  grid,
  group,
  indicate,
  moveTo,
  par,
  pictogram,
  place,
  rect,
  row,
  seq,
  vanish,
} from 'vizmatic/stage';
import { commitScenario } from '../../../films/agent-recovery/model.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, OP, STATE, board, cross, docked, record, token, travel } from '../parts.mjs';

export default function commitBoundary(s, c) {
  const before = commitScenario('before-commit');
  const after = commitScenario('after-commit');
  const records = (run) => run.operationCount + run.jobCount;
  assertEqual([records(before), records(after)], [0, 2], 'the records that each fault leaves');
  assertEqual([after.replay, after.job.state], [OP.job, OP.state], 'what the next lookup finds');

  const b = board();
  const context = beside(note(STATE['commit-boundary'].startLabel), b.name, 'right', 'normal');

  // The card of the agent, as the scene before left it.
  const key = beside(token(OP.key, COLOR.op), b.agent, 'under', 'normal', 'left');
  const target = beside(token('RUN-842 → ' + OP.revision, COLOR.op), key, 'under', 'tight', 'left');

  // The two records, over the commit line, in one transaction.
  const ledgerWords = column(
    [
      row(
        [
          [OP.key, COLOR.op],
          ['→', 'dim'],
          [OP.job, COLOR.sure],
        ].map(([words, color]) => mono(words, { size: 32, color })),
        { gap: 'tight' },
      ),
      mono('run: RUN-842', { size: 26, color: COLOR.op }),
      mono(`revision: ${OP.revision}`, { size: 26, color: COLOR.op }),
    ],
    { gap: 'none' },
  );
  const ledger = group(
    rect(b.recordWidth(0), boxOf(ledgerWords).height + 20, {
      radius: 10,
      fill: 'bg',
      stroke: COLOR.sure,
      width: 2.5,
    }).moveTo(boxOf(ledgerWords).point()),
    ledgerWords,
  ).moveTo(b.stagedAt(0));
  const job = record(
    [
      [OP.job, COLOR.sure],
      [OP.state, 'ink'],
    ],
    b.recordWidth(1),
  ).moveTo(b.stagedAt(1));
  const around = boxOf([ledger, job]).grow('tight');
  const transaction = rect(around.width, around.height, {
    radius: 16,
    stroke: COLOR.mark,
    fill: null,
    width: 3,
    dash: [10, 8],
  }).moveTo(around.point());
  const transactionName = beside(
    note('one transaction', { color: COLOR.mark }),
    transaction,
    'under',
    'tight',
    'left',
  );
  const fault = beside(
    pictogram('bolt', { size: 64, color: COLOR.fail, accent: COLOR.fail }),
    transaction,
    'under',
    'tight',
    'right',
  );

  // What each fault leaves, between the two lanes.
  const cases = [
    [
      label('fault before commit', { color: COLOR.fail, size: 36 }),
      mono(`${records(before)} records`, { size: 36 }),
    ],
    [
      label('fault after commit', { color: COLOR.fail, size: 36 }),
      mono(`${records(after)} records`, { size: 36 }),
    ],
  ];
  place(
    grid(cases.flat(), { columns: 2, gap: ['normal', 'tight'] }),
    between(b.request, b.reply).inset('normal', 'loose'),
    'top right',
  );

  // The sends and the replies.
  const attempt = (trace) => token([[OP.key, COLOR.op]], COLOR.attempt, { tag: trace });
  const a1 = attempt('trace-a1');
  a1.moveTo(docked(a1, b.out, 'right'));
  const lost = token(OP.job, COLOR.sure);
  lost.moveTo(docked(lost, b.exit));
  const broken = cross();
  const silence = label('no reply', { color: COLOR.fail }).moveTo(b.viewBox.point());

  const [queryBand, files, conclusion] = area.rows([1, 4, 1], 'wide');
  const title = heading(c.title);
  const lookup = place(mono('controller.lookup("' + OP.key + '")', { size: 54 }), queryBand);
  const runs = [before, after];
  const rows = files.rows(2, 'wide');
  const results = rows.map((zone, i) => {
    const [file, input, output] = zone.columns([4, 3, 5], 'wide');
    const name = place(label(i ? 'Fault after commit' : 'Fault before commit'), file, 'left');
    const moveKey = place(token(OP.key, COLOR.op), input);
    const readout = place(
      mono(runs[i].job ? "('" + runs[i].job.id + "', '" + runs[i].job.state + "')" : 'None', {
        color: i ? COLOR.sure : 'ink',
        size: 47,
      }),
      output,
    );
    const frame = rect(output.width, 128, {
      fill: 'surface',
      stroke: 'dim',
      width: 2,
      radius: 12,
    }).moveTo(output.point());
    const cover = mono('?', { color: COLOR.mark, size: 48 }).moveTo(output.point());
    return { name, moveKey, readout, frame, cover };
  });
  const count = place(
    label('One queue entry. Worker completion unknown.', { color: COLOR.sure }),
    conclusion,
  );
  const prediction = place(
    label('What will the reopened files return?', { color: COLOR.mark }),
    conclusion,
  );

  const carried = [
    record(
      [
        [OP.key, COLOR.op],
        ['→', 'dim'],
        [OP.job, COLOR.sure],
      ],
      b.recordWidth(0),
    ).moveTo(b.durableAt(0)),
    record(
      [
        [OP.job, COLOR.sure],
        [OP.state, 'ink'],
      ],
      b.recordWidth(1),
    ).moveTo(b.durableAt(1)),
    record(
      [
        [STATE['operation-identity'].alternativeKey, 'ink'],
        ['→', 'dim'],
        ['job-2', COLOR.fail],
      ],
      b.recordWidth(0),
      { color: COLOR.fail },
    ).moveTo(b.durableAt(0, 1)),
    record(
      [
        ['job-2', COLOR.fail],
        [OP.state, 'ink'],
      ],
      b.recordWidth(1),
      { color: COLOR.fail },
    ).moveTo(b.durableAt(1, 1)),
    token(OP.job, COLOR.sure).moveTo(b.viewBox.point()),
  ];
  c.take([
    ...b.base.filter((node) => node !== b.request && node !== b.reply),
    key,
    target,
    ...carried,
  ]);
  s.add(title, b.request, b.reply, context);
  b.close(c);

  // The labeled alternative resets the carried records only after the viewer sees the context.
  c.hide('atomic-records', carried);
  // One transaction: the request arrives, and both records wait over the line.
  c.on('atomic-records', () =>
    s.play(...b.heads.map((head) => indicate(head, { color: COLOR.mark, scale: 1 }))),
  );
  c.after('atomic-records', () =>
    s.play(seq(travel(a1, docked(a1, b.door), { duration: 1.1 }), b.absorb(a1))),
  );
  c.show('paired-writes', [ledger, job, transaction, transactionName]);
  c.on('binds', () =>
    s.play(indicate(ledger, { color: COLOR.mark }), indicate(job, { color: COLOR.mark })),
  );

  // A fault before the line: the transaction is undone, and both records go away.
  c.show('before-commit-fault', fault);
  c.on('before-commit-fault', () =>
    s.play(delay(fadeOut([ledger, job, transaction, transactionName], { duration: 0.6 }), 0.7)),
  );
  c.show('before-commit-fault', cases[0], { after: true });

  // The same run with a fault after the line: both records are durable, and the reply is lost.
  c.hide('after-commit-fault', fault);
  c.on('after-commit-fault', () =>
    s.play(
      seq(
        par(fadeIn(ledger, { duration: 0.3 }), fadeIn(job, { duration: 0.3 })),
        par(
          moveTo(ledger, b.durableAt(0), { duration: 0.7 }),
          moveTo(job, b.durableAt(1), { duration: 0.7 }),
        ),
        b.lose(lost, broken),
      ),
    ),
  );
  c.show('after-commit-fault', cases[1], { after: true });
  c.show('no-reply', silence);
  c.on('failure-point', () =>
    s.play(
      indicate(cases[0][1], { color: COLOR.mark }),
      indicate(cases[1][1], { color: COLOR.mark }),
    ),
  );

  // Hold the query fixed and run it against both reopened files.
  c.swapAll('open-files', [lookup, ...results.flatMap((r) => [r.name, r.frame, r.cover])], {
    keep: [title],
  });
  c.show('predict-reads', prediction);
  for (const [index, cue] of ['first-file', 'second-file'].entries()) {
    const r = results[index];
    c.show(cue, r.moveKey);
    c.on(cue, () =>
      s.play(
        seq(
          moveTo(r.moveKey, r.frame.center, { duration: 0.6 }),
          vanish(r.moveKey),
          vanish(r.cover),
          appear(r.readout),
        ),
      ),
    );
  }
  c.swap('worker-proof', prediction, count);
}
