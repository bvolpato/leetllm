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

  const { clock, record, now, live, expired, bottom, top } = storePicture(
    BOARD,
    'running',
    '10.000',
  );
  const instant = place(mono('scan now = 15.000 s', { color: 'yellow' }), bottom, 'top');
  const origin = place(
    note('Monotonic clock: unspecified origin. Deadlines are not portable timestamps.'),
    bottom,
    'bottom',
  );
  const zeroClock = place(
    lanes(['clock'], [], {
      width: top.width * 0.75,
      domain: [10, 15],
      ticks: [10, 15],
      format: (v) => v + ' s',
      size: 34,
      deadline: { at: 10, label: 'zero TTL: deadline = now', color: 'pink' },
    }),
    top,
  );
  const fixture = place(note('New fixture: zero TTL', { color: 'yellow' }), top, 'top');
  const scanFixture = place(
    note('Scan fixture: task:1 expires at 15 s', { color: 'yellow' }),
    top,
    'top',
  );
  const permanentFixture = place(
    note('Permanent overwrite: no deadline', { color: 'yellow' }),
    top,
    'top',
  );
  s.add(fixture);
  c.show('ci-ttl-reads-0-build', [zeroClock, record, now], { lead: -0.6 });
  c.on('ci-ttl-reads-1-build', () => s.play(indicate(record, { scale: 1, duration: 0.35 })));
  c.on('ci-ttl-reads-2-build', () => s.play(indicate(record, { scale: 1, duration: 0.35 })));
  c.on('ci-ttl-reads-zero', () =>
    s.play(record.setCell('one', 'deadline', '10.000', { duration: 0.4 })),
  );
  c.after('ci-ttl-reads-zero', () => s.play(record.remove(['one'], { duration: 0.5 })));
  c.swap(1, [zeroClock, fixture], [clock, scanFixture]);
  c.onBeat(1, () =>
    s.play(
      record.append([{ id: 'one', key: 'task:1', value: 'running', deadline: '15.000' }], {
        duration: 0.5,
      }),
    ),
  );
  c.swap('ttl-freeze', now, instant);
  c.on('ttl-freeze', () => s.play(clock.advance(15, { duration: 1.2 })));
  c.on('ci-ttl-reads-scan', () => s.play(record.remove(['one'], { duration: 0.7 })));
  c.on('ci-ttl-reads-overwrite', () =>
    s.play(
      record.append([{ id: 'overwrite', key: 'task:1', value: 'running', deadline: 'future' }], {
        duration: 0.5,
      }),
    ),
  );
  c.hide('ci-ttl-reads-overwrite', clock.deadlines, { after: true });
  c.swap('ci-ttl-reads-overwrite', scanFixture, permanentFixture, { after: true });
  c.after('ci-ttl-reads-overwrite', () =>
    s.play(
      record.setCell('overwrite', 'value', 'permanent', { duration: 0.4 }),
      record.setCell('overwrite', 'deadline', 'None', { duration: 0.4 }),
    ),
  );
  c.show('ttl-origin', origin);
}
