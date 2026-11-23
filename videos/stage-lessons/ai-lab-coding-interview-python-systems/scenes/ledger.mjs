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

  const { events, balance, receipt } = ledgerPicture();
  const returned = place(note('replay → original result 100'), BOARD, 'bottom');
  const conflict = place(note('reject', { color: 'red' }), BOARD, 'bottom');
  s.add(events, balance, receipt);
  c.on('ledger-beat-1-focus-1', () => s.play(indicate(balance, { scale: 1, duration: 0.35 })));
  c.on('ledger-preserved-balance', () => s.play(indicate(balance, { scale: 1, duration: 0.35 })));
  c.after('ledger-deposit', () =>
    s.play(
      events.append(
        [
          {
            id: 'deposit',
            key: LEDGER[1].events[0].key,
            delta: LEDGER[1].events[0].delta,
            balance: LEDGER[1].balance,
          },
        ],
        { duration: 0.5 },
      ),
      balance.setCell('balance', 'value', LEDGER[1].balance, { duration: 0.4 }),
      balance.setCell('events', 'value', LEDGER[1].events.length, { duration: 0.4 }),
      receipt.setCell('deposit', 'result', LEDGER[1].returned, { duration: 0.4 }),
    ),
  );
  c.after('ledger-withdraw', () =>
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
      balance.setCell('balance', 'value', LEDGER[2].balance, { duration: 0.4 }),
      balance.setCell('events', 'value', LEDGER[2].events.length, { duration: 0.4 }),
    ),
  );
  c.show('ledger-beat-2-focus-2', returned, { after: true });
  c.after('ledger-beat-2-focus-2', () =>
    s.play(receipt.light('deposit', undefined, { duration: 0.4 })),
  );
  c.swap('ledger-beat-2-focus-1', returned, conflict, { after: true });
}
