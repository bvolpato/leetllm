import {
  arrow,
  assertEqual,
  boxOf,
  dot,
  dynamic,
  fitted,
  place,
  rect,
  table,
  to,
} from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { MAIN, FOOT, caseSlip, confirmed, money, open } from '../parts.mjs';
import {
  cases,
  confirmationFrame,
  decide,
  enqueue,
  payload,
} from '../../../films/design-conversational-ai-support-bot/model.mjs';

export default function ledger(s, c) {
  const board = open(s, c, 'parallel');
  const key = 'credit:' + confirmed.ticket;
  const request = payload(confirmed);
  const other = cases().find((row) => row.id === 'T8').state;
  const otherKey = 'credit:' + other.ticket;
  const changed = payload(confirmationFrame(2, 1).current);
  const store = [];
  assertEqual(
    decide(confirmed).outcome,
    'QUEUE ELIGIBLE',
    'Recheck the confirmed request before inserting.',
  );
  const first = enqueue(store, key, request);
  const replay = enqueue(store, key, request);
  assertEqual(first.status, 'INSERTED', 'A new operation inserts.');
  assertEqual(replay.entry === first.entry, true, 'The retry receives the very same record.');
  assertEqual(replay.status, 'RECOVERED', 'The retry recovers the original operation.');
  assertEqual(enqueue(store, key, changed).status, 'CONFLICT', 'Changed parameters conflict.');
  assertEqual(
    enqueue(store, otherKey, payload(other)).status,
    'DUPLICATE INVOICE',
    'A second key cannot claim this invoice.',
  );
  assertEqual(store.length, 1, 'All four requests leave one pending operation.');

  const [desk, transit, customerArea] = MAIN.rows([3.2, 1, 1.6], 'loose');
  const [left, right] = desk.columns(2, 'loose');
  const sender = caseSlip(left, 'SUPPORT APP', '', 'cyan');
  const queue = caseSlip(right, 'CREDIT QUEUE', '', 'blue');
  const attempt = s.value(0);
  const supplied = [request, changed, payload(other)];
  const form = (slip, record, operation, detail) => {
    const [reference, value, invoice] = slip.body.rows([1, 1.6, 1], 'tight');
    return [
      dynamic(() =>
        place(
          mono(operation(), { size: 34, color: attempt.value === 2 ? 'yellow' : 'cyan' }),
          reference,
          'left',
        ),
      ),
      dynamic(() =>
        place(
          mono(money(record().amount), { size: 64, color: attempt.value === 1 ? 'yellow' : 'ink' }),
          value,
          'left',
        ),
      ),
      dynamic(() =>
        place(
          note(record().invoice + '  /  ' + detail, {
            color: attempt.value === 2 ? 'yellow' : 'dim',
          }),
          invoice,
          'left',
        ),
      ),
    ];
  };
  const sentForm = form(
    sender,
    () => supplied[Math.round(attempt.value)],
    () => (attempt.value > 1.5 ? otherKey : key),
    request.item,
  );
  const retained = form(
    queue,
    () => first.entry.payload,
    () => first.entry.key,
    first.entry.payload.status,
  );
  const empty = place(note('No pending requests'), queue.body);
  const [wire, caption] = transit.rows([1, 1], 'normal');
  const ends = [left.cx, right.cx].map((x) => [x, wire.cy]);
  const rail = arrow(ends[1], ends[0], { stroke: 'dim', pad: 6 });
  const ack = namedBox('ACK', { width: 112, height: 54, color: 'blue' }).moveTo(ends[1]);
  const returned = namedBox('ACK', { width: 112, height: 54, color: 'blue' }).moveTo(ends[1]);
  const transitText = (words) => place(note(words), caption);
  const lost = transitText('Queue acknowledgment lost');
  const arrived = transitText('Stored acknowledgment received');
  const [status, next] = customerArea.rows(2, 'normal');
  const message = (words, color) => place(label(words, { size: 38, color }), status);
  const unknown = message('Support app: submission status unknown', 'yellow');
  const prompt = place(note('New operation or retry the original one?', { size: 35 }), next);
  const known = message('“Your $35 credit request is pending.”', 'cyan');
  const ref = place(mono('Reference  ' + key, { size: 32 }), next);
  const conflict = message('Same key, different amount: conflict', 'pink');
  const duplicate = message('Another ticket already claimed this invoice.', 'pink');
  const foot = place(
    note('Separate $35 partial-credit example. The queue records requests for billing.'),
    FOOT,
  );
  const [raceTitleArea, raceBody, raceStatusArea] = MAIN.rows([1, 5, 1], 'normal');
  const [processArea, dbArea] = raceBody.columns([1, 2], 'loose');
  const processRows = processArea.rows(2, 'loose');
  const processNames = processRows.map((region, i) =>
    place(
      namedBox('Process ' + (i ? 'B' : 'A'), {
        width: region.width,
        height: 110,
        color: 'cyan',
        sub: 'read: empty',
      }),
      region,
    ),
  );
  const dbFrame = place(
    rect(dbArea.width, dbArea.height, { fill: 'surface', stroke: 'green', radius: 14 }),
    dbArea,
  );
  const [dbTitleArea, dbWorkArea] = dbArea.inset('normal').rows([1, 4], 'normal');
  const [dbNameArea, countArea] = dbTitleArea.columns([2, 1], 'normal');
  const dbTitle = place(
    label('REPLAY TRANSACTION', { size: 30, color: 'green' }),
    dbNameArea,
    'left',
  );
  const racePending = s.value(0);
  const replayCount = dynamic(() =>
    place(
      label('pending ' + Math.round(racePending.value), { size: 32, color: 'cyan' }),
      countArea,
      'right',
    ),
  );
  const [uniqueArea, storedArea] = dbWorkArea.columns([1, 2], 'wide');
  const unique = place(
    namedBox('UNIQUE', {
      width: uniqueArea.width,
      height: 160,
      color: 'yellow',
      sub: 'key + invoice',
    }),
    uniqueArea,
  );
  const storeRows = storedArea.rows(2, 'wide');
  const emptyRows = ['queue: empty', 'outbox: empty'].map((text, i) =>
    place(
      namedBox(text, { width: storeRows[i].width, height: 100, color: 'dim', dash: true }),
      storeRows[i],
    ),
  );
  const retainedRows = [
    place(
      namedBox(key, {
        width: storeRows[0].width,
        height: 100,
        color: 'cyan',
        sub: money(request.amount) + ' · pending',
      }),
      storeRows[0],
    ),
    place(
      namedBox('outbox: ' + key, {
        width: storeRows[1].width,
        height: 100,
        color: 'pink',
        sub: 'same atomic commit',
      }),
      storeRows[1],
    ),
  ];
  const raceTitle = place(
    label('Separate replay · same key + payload · two empty reads', { size: 34, color: 'cyan' }),
    raceTitleArea,
  );
  const raceStatus = place(
    label('Balance + authorization rechecked inside the transaction', {
      size: 32,
      color: 'yellow',
    }),
    raceStatusArea,
  );
  const raceResult = place(
    label('A inserts once · B recovers the retained result', { size: 34, color: 'cyan' }),
    raceStatusArea,
  );
  const starts = processRows.map((region) => [region.right, region.cy]);
  const uniqueBox = boxOf(unique);
  const gates = processRows.map((region, i) => [
    uniqueBox.left,
    uniqueBox.cy + ((i ? 1 : -1) * uniqueBox.height) / 4,
  ]);
  const requests = starts.map((point) => dot(16, 'cyan').moveTo(point));
  const raceRails = starts.map((point, i) => arrow(point, gates[i], { stroke: 'grid' }));
  const raceFoot = place(
    note('Separate replay from an empty database. The left ledger retains the earlier $35 result.'),
    FOOT,
  );
  const versions = place(
    note('Check key retention, parameter comparison and error replay at the destination.'),
    FOOT,
  );

  s.add(sender.paper, sentForm, queue.paper, empty, foot);
  c.swap('insert-credit', empty, retained, { after: true });
  c.after('insert-credit', () => s.play(board.pending.to(store.length, { duration: 0 })));
  c.show('return-ack', [rail, ack]);
  c.on('return-ack', () =>
    s.play(to(ack, (n) => n.moveTo(wire.point('center')), { duration: 0.8 })),
  );
  c.hide('lose-reply', ack);
  c.show('lose-reply', [lost, unknown], { after: true });
  c.show('retry-question', prompt);
  c.hide('retry-payload', prompt);
  c.hide('retry-payload', lost);
  c.show('recover-entry', returned);
  c.on('recover-entry', () => s.play(to(returned, (n) => n.moveTo(ends[0]), { duration: 0.85 })));
  c.show('receipt-arrived', arrived, { after: true });
  c.swap('receipt-arrived', unknown, [known, ref], { after: true });
  c.hide('changed-payload', [known, ref, arrived, returned, rail]);
  c.on('changed-payload', () => s.play(attempt.to(1, { duration: 0 })));
  c.show('key-conflict', conflict, { after: true });
  c.hide('other-ticket', conflict, { fade: 0.18, lead: 0.18 });
  c.on('other-ticket', () => s.play(attempt.to(2, { duration: 0 })));
  c.show('invoice-unique-fence', duplicate, { after: true });
  c.swapAll(
    'local-race',
    [
      raceTitle,
      processNames,
      dbFrame,
      dbTitle,
      replayCount,
      unique,
      emptyRows,
      raceStatus,
      raceRails,
      requests,
      raceFoot,
    ],
    {
      keep: [board.title, ...board.nodes],
    },
  );
  c.after('local-race', () =>
    s.play(...requests.map((node, i) => to(node, (n) => n.moveTo(gates[i]), { duration: 1.0 }))),
  );
  c.after('atomic-outbox', () => {
    s.play(to(requests[0], (n) => n.moveTo([storedArea.left, storeRows[0].cy]), { duration: 0.7 }));
    s.play(racePending.to(1, { duration: 0.1 }));
  });
  c.swap('atomic-outbox', emptyRows, retainedRows, { after: true, lead: -0.8 });
  c.on(
    'atomic-outbox',
    () => s.play(to(requests[1], (n) => n.moveTo(starts[1]), { duration: 1.0 })),
    2.0,
  );
  c.swap('atomic-outbox', raceStatus, raceResult, { after: true, lead: -1.5 });
  c.swap('destination-version', raceFoot, versions);
  c.clear(raceRails, 0.46, 0.2);
}
