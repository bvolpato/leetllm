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

  const { amount, outline, divisions, fill, count, events, timeArea } = bucketPicture(s, BOARD, 0);
  const formula = place(note('refill = min(capacity, old + elapsed × rate)'), timeArea);
  const leak = place(note('Delete at 0 s. A new bucket starts full.'), timeArea);
  const refill = place(note('Keep the bucket. Refill at 1 token per second.'), timeArea);
  const safe = place(note('After 3 idle seconds, either bucket has 3 tokens.'), timeArea);
  s.add(outline, fill, divisions, events, formula);
  c.on('ci-bucket-contract-0-build', () => s.play(indicate(events, { scale: 1, duration: 0.35 })));
  c.on('ci-bucket-contract-1-build', () => s.play(indicate(events, { scale: 1, duration: 0.35 })));
  c.on('bucket-refill', () =>
    s.play(
      amount.to(BUCKET.events[4].tokens, { duration: 1.1 }),
      events.setCell('clock', 'result', '0.5 s', { duration: 0.4 }),
    ),
  );
  c.after('ci-bucket-contract-wait', () =>
    s.play(
      events.setCell(
        'decision',
        'result',
        { value: 'wait 0.5 s', state: 'fail' },
        { duration: 0.4 },
      ),
    ),
  );
  c.on('bucket-cost', () =>
    s.play(
      events.setCell('cost', 'result', '> ' + BUCKET.capacity, { duration: 0.4 }),
      events.setCell('decision', 'result', { value: 'invalid', state: 'fail' }, { duration: 0.4 }),
    ),
  );
  c.on('ci-bucket-contract-2-build', () =>
    s.play(
      amount.to(0, { duration: 0.4 }),
      events.setCell('clock', 'result', '0 s', { duration: 0.35 }),
      events.setCell('cost', 'result', '1 token', { duration: 0.35 }),
      events.setCell('decision', 'result', { value: 'idle', state: null }, { duration: 0.35 }),
    ),
  );
  c.on('bucket-delete', () =>
    s.play(
      events.setCell('decision', 'result', { value: 'cleanup', state: null }, { duration: 0.3 }),
    ),
  );
  c.swap('bucket-delete', formula, leak);
  c.on('bucket-recreate', () => s.play(amount.to(BUCKET.capacity, { duration: 0.9 })));
  c.swap('bucket-rewind', leak, refill);
  c.on('bucket-rewind', () => s.play(amount.to(0, { duration: 0.35 }), events.setCell('decision', 'result', 'idle')));
  c.on('ci-bucket-contract-eviction', () => {
    const cue = c.cue('ci-bucket-contract-eviction');
    s.play(
      amount.to(BUCKET.capacity, { duration: cue.end - cue.start }),
      events.setCell('clock', 'result', '0 → 3 s', { duration: 0.3 }),
    );
  });
  c.swap('ci-bucket-contract-eviction', refill, safe, { after: true });
  c.after('ci-bucket-contract-eviction', () =>
    s.play(events.setCell('clock', 'result', (BUCKET.capacity / BUCKET.rate) + ' s', { duration: 0.3 })),
  );
}
