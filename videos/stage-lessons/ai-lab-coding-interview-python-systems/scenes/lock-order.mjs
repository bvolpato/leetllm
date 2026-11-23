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

  const [left, right] = BOARD.columns([7, 5], 'wide');
  const code = place(
    codeBlock(
      'with ExitStack() as stack:\n    for account in sorted(set(ids)):\n        lock = registry[account]\n        stack.enter_context(lock)\n    yield',
      { language: 'python', size: 34, leading: 1.8, panel: true },
    ),
    left,
  );
  const locks = place(
    table(
      [
        { key: 'account', sample: 'unknown' },
        { key: 'lock', sample: 'unlocked', marks: true },
      ],
      [
        { id: 'B', account: 'B', lock: 'unlocked' },
        { id: 'A', account: 'A', lock: 'unlocked' },
        { id: 'dup', account: 'A', lock: 'duplicate' },
      ],
      { width: right.width, size: 40, maxRows: 3, leading: 2.4 },
    ),
    right,
  );
  const cleanup = place(note('KeyError → active ExitStack releases A'), BOARD, 'bottom');
  s.add(code, locks);
  c.on('ci-lock-order-0-build', () => s.play(indicate(locks, { scale: 1, duration: 0.35 })));
  c.on('ci-lock-order-1-build', () => s.play(indicate(locks, { scale: 1, duration: 0.35 })));
  c.on('ci-lock-order-2-build', () => s.play(locks.light('A', 'lock', { duration: 0.4 })));
  c.on('locks-order', () => s.play(locks.sort('account', { duration: 0.8 })));
  c.on('locks-unique', () => s.play(locks.remove(['dup'], { duration: 0.6 })));
  c.on('locks-enter', () =>
    s.play(
      locks.setCell('A', 'lock', 'locked', { duration: 0.4 }),
      code.focus([0, 3], { duration: 0.4 }),
    ),
  );
  c.on('locks-unknown', () =>
    s.play(
      locks.setCell('B', 'account', 'unknown', { duration: 0.4 }),
      locks.setCell('B', 'lock', { value: 'KeyError', state: 'fail' }, { duration: 0.4 }),
      code.focus(2, { color: 'red', duration: 0.4 }),
    ),
  );
  c.on('ci-lock-order-unwind', () =>
    s.play(locks.setCell('A', 'lock', { value: 'unlocked', state: 'pass' }, { duration: 0.5 })),
  );
  c.show('ci-lock-order-unwind', cleanup, { after: true });
}
