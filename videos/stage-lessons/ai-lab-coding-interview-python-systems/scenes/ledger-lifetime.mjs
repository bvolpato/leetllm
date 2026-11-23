import {
  appear,
  arrow,
  assertEqual,
  boxOf,
  codeBlock,
  column,
  dot,
  draw,
  dynamic,
  fade,
  fadeOut,
  graph,
  grid,
  indicate,
  lanes,
  line,
  morphCode,
  place,
  recolor,
  rect,
  row,
  seq,
  table,
  to,
} from 'vizmatic/stage';
import { chip, display, heading, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import {
  BOARD,
  COLOR,
  context,
  racePicture,
  storePicture,
  schedulePicture,
  bucketPicture,
  ledgerPicture,
  workloadPicture,
  CRAWL,
  LEDGER,
  BUCKET,
  SCHEDULE_RETRY,
  SCHEDULE_BLOCKED,
  expiryState,
  parserTrace,
  mixedWorkSchedule,
} from '../parts.mjs';

export default function scene(s, c) {
  context(s, c);
  const { events, balance, receipt } = ledgerPicture(BOARD, LEDGER[3]);
  const [left] = BOARD.columns([7, 5], 'wide');
  const [keysArea, slotArea] = left.rows([1, 2], 'wide');
  const keyTrue = chip('True : bool', { color: 'pink' });
  const keyOne = chip('1 : int', { color: 'pink' });
  const keys = place(row([keyTrue, keyOne], { gap: 'loose' }), keysArea);
  const slot = place(
    table(
      [
        { key: 'slot', sample: 'one dictionary slot' },
        { key: 'value', sample: 'second request', marks: true },
      ],
      [{ id: 'key', slot: 'True == 1', value: 'first request' }],
      { width: slotArea.width, size: 34, maxRows: 1, leading: 3 },
    ),
    slotArea,
  );
  const collisions = [keyTrue, keyOne].map((key) =>
    arrow(boxOf(key).point('bottom'), boxOf(slot).point('top'), { color: 'pink', width: 3 }),
  );
  const rejected = place(
    note('Rejected debit → no event, no receipt. Same key can retry after funding.'),
    BOARD,
    'bottom',
  );
  const validation = place(
    note('String-only keys keep these typed identities out of the ledger.'),
    BOARD,
    'bottom',
  );
  const replay = place(
    note('Replay withdraw-1: balance → event → receipt in volatile memory'),
    BOARD,
    'bottom',
  );
  const crash = place(
    note('Between writes: balance 70, withdrawal event missing, receipt missing', { color: 'yellow' }),
    BOARD,
    'bottom',
  );
  const atomic = place(
    note('Withdrawal recorded: one event and one receipt'),
    BOARD,
    'bottom',
  );
  const registry = place(
    note('A → B and C → D can submit the same request key.'),
    BOARD,
    'bottom',
  );
  s.add(events, balance, receipt, rejected);
  c.on('ci-ledger-lifetime-0-build', () => s.play(indicate(balance, { scale: 1, duration: 0.35 })));
  c.on('lifetime-reject', () =>
    s.play(
      receipt.append([{ id: 'debit', key: 'debit key', result: 'absent' }], { duration: 0.4 }),
    ),
  );
  c.on('lifetime-retry', () => s.play(receipt.light('debit', undefined, { duration: 0.4 })));
  c.on('ci-ledger-lifetime-replay', () =>
    s.play(receipt.light('deposit', undefined, { duration: 0.5 })),
  );
  c.swap(1, [events, rejected], [keys, slot, validation]);
  c.on(
    'ci-ledger-lifetime-1-build',
    () => s.play(indicate(keys, { scale: 1, duration: 0.35 })),
    0.6,
  );
  c.show(
    'lifetime-collision',
    collisions.map((node) => draw(node, { duration: 0.8 })),
  );
  c.after('lifetime-collision', () =>
    s.play(
      slot.setCell('key', 'value', { value: 'second request', state: 'fail' }, { duration: 0.5 }),
    ),
  );
  c.swap(2, [keys, slot, collisions, validation], [events, replay]);
  c.on(
    'ci-ledger-lifetime-2-build',
    () =>
      s.play(
        balance.setCell('balance', 'value', LEDGER[1].balance, { duration: 0.3 }),
        balance.setCell('events', 'value', 1, { duration: 0.3 }),
        events.remove(['withdraw'], { duration: 0.3 }),
        seq(
          receipt.remove(['debit'], { duration: 0.3 }),
          receipt.append([{ id: 'withdraw', key: 'withdraw-1', result: 'absent' }], {
            duration: 0.3,
          }),
        ),
      ),
    0.6,
  );
  c.after('lifetime-balance', () =>
    s.play(balance.setCell('balance', 'value', LEDGER[2].balance, { duration: 0.4 })),
  );
  c.swap('lifetime-event', replay, crash);
  c.on('lifetime-event', () => s.play(receipt.light('withdraw', undefined, { duration: 0.4 })));
  c.hide('lifetime-result', crash);
  c.show('lifetime-receipt', atomic, { after: true, lead: -0.5 });
  c.after('lifetime-result', () =>
    s.play(
      events.append(
        [
          {
            id: 'withdraw',
            key: LEDGER[2].events[1].key,
            delta: LEDGER[2].events[1].delta,
            balance: LEDGER[2].balance,
          },
        ],
        { duration: 0.5 },
      ),
      balance.setCell('events', 'value', LEDGER[2].events.length, { duration: 0.5 }),
    ),
  );
  c.after('lifetime-receipt', () =>
    s.play(receipt.setCell('withdraw', 'result', LEDGER[2].balance, { duration: 0.5 })),
  );
  c.swap('lifetime-keys', atomic, registry);
}
