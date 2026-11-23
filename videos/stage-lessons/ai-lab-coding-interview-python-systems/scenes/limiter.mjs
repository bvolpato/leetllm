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

  const elapsed = s.value(0);
  const spent = s.value(0);
  const amount = { get value() { return Math.max(0, Math.min(BUCKET.capacity, BUCKET.capacity - spent.value + elapsed.value * BUCKET.rate)); } };
  assertEqual(BUCKET.rate * BUCKET.events[4].now, BUCKET.events[4].tokens, 'half-second refill');
  const { outline, divisions, fill, count, events, clock, scale, capacity } = bucketPicture(s, BOARD, BUCKET.capacity, { amount, clock: elapsed });
  s.add(outline, fill, divisions, count, events, clock, scale, capacity);
  c.on('limiter-beat-1-focus-1', () => s.play(indicate(capacity, { scale: 1, duration: 0.35 })));
  c.on('limiter-spend-burst', () => s.play(seq(...BUCKET.events.slice(0, 3).map((e) => spent.to(BUCKET.capacity - e.tokens, { duration: 0.55 })))));
  c.after('limiter-denied-fourth', () => s.play(events.setCell('decision', 'result', { value: 'wait 1 s', state: 'fail' }, { duration: 0.4 })));
  c.on('limiter-half-token', () => {
    s.play(events.setCell('decision', 'result', { value: null, state: null }, { duration: 0.12 }));
    s.play(elapsed.to(BUCKET.events[4].now, { duration: c.cue('limiter-half-refill').end - c.cue('limiter-half-token').start - 0.12 }));
  });
  c.on('limiter-half-refill', () => s.play(indicate(outline, { scale: 1, duration: 0.3 })));
  c.after('limiter-half-token', () => s.play(events.setCell('decision', 'result', { value: 'wait 0.5 s', state: 'fail' }, { duration: 0.4 })));
  c.after('limiter-one-clock', () => {
    s.play(events.setCell('decision', 'result', { value: null, state: null }, { duration: 0.12 }));
    s.play(elapsed.to(BUCKET.events[5].now, { duration: c.cue('limiter-one-second').end - c.cue('limiter-one-clock').end - 0.12 }));
  });
  c.after('limiter-one-second', () => s.play(
    spent.to(BUCKET.capacity + BUCKET.rate * BUCKET.events[5].now - BUCKET.events[5].tokens, { duration: 0.5 }),
    events.setCell('decision', 'result', { value: 'admit', state: 'pass' }, { duration: 0.4 }),
  ));
}
