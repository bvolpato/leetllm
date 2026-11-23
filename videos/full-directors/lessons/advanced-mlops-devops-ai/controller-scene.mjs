import { P, box, line, dot, txt, mono, cap, serif, stage, caption, cue, travel } from './paint.mjs';
import {
  readings,
  arbitrate,
  streak,
  threshold,
  measured,
  revisions,
  letter,
  stale,
  fail,
  retry,
} from './mechanics.mjs';

function metrics(c, k) {
  const malformed = k.beat.beatIndex >= 1;
  const rows = readings(malformed);
  const issued = malformed
    ? cue(k, 2, 'Both are unavailable')
    : cue(k, 0, 'The latency rule requests rollback');
  const paused = malformed
    ? cue(k, 2, 'Both are unavailable')
    : cue(k, 0, 'The quality rule requests');
  const combined = malformed
    ? cue(k, 2, 'quality calls for review')
    : cue(k, 0, 'Our policy chooses');
  stage(
    c,
    'ROLLOUT CONTROLLER',
    'What does this window authorize?',
    'Candidate C  /  generation 12   ·   age 30 seconds   ·   minimum 100 integer samples per rule',
  );
  ['Measurement', 'Expected window', 'Received window', 'Samples', 'Decision'].forEach((s, i) =>
    cap(c, s, [104, 622, 958, 1287, 1531][i], 407),
  );
  rows.forEach((r, i) => {
    const { rule, sample } = r,
      y = 509 + 180 * i,
      vis = i ? paused : issued;
    line(c, 100, y + 85, 1818, y + 85, P.line);
    txt(c, i ? 'Groundedness' : 'Time to first token · p95', 104, y - 20, 34);
    mono(
      c,
      i ? sample.value.toFixed(2) + '   min ' + rule.min : sample.value + ' ms   max ' + rule.max,
      104,
      y + 41,
      38,
    );
    mono(c, rule.window, 622, y + 22, 42);
    mono(c, sample.window, 958, y + 22, 42);
    mono(c, String(sample.count), 1287, y + 22, 39);
    if (vis && (!malformed || (i ? combined : cue(k, 2, 'Latency calls for rollback')))) {
      mono(c, r.action.toUpperCase(), 1531, y + 22, 34, r.action === 'review' ? P.amber : P.red);
    }
    if (vis && !r.valid) txt(c, 'unavailable', 1531, y + 66, 29, P.red);
  });
  caption(
    c,
    combined
      ? 'Combined action   /   ' +
          arbitrate(rows).toUpperCase() +
          (malformed
            ? '    ·    neither value passed validation'
            : '    ·    operational breach takes precedence')
      : malformed
        ? 'Which readings satisfy their rule’s input contract?'
        : 'Evaluate each rule on its own measurement and window.',
  );
}
function windows(c, k) {
  const reset = cue(k, 4, 'The third window'),
    fired = cue(k, 4, 'window six'),
    last = cue(k, 4, 'final healthy window');
  stage(
    c,
    'SUSTAINED LATENCY POLICY',
    'Where does a run of three breaches finish?',
    'Valid five-minute p95 measurements   /   strict threshold > 850 ms',
  );
  const x = (i) => 230 + i * 242,
    y = (v) => 759 - (v - 750) * 1.54;
  for (const v of [750, 800, 850, 900, 950]) {
    line(
      c,
      170,
      y(v),
      1740,
      y(v),
      v === threshold ? P.red : P.grid,
      v === threshold ? 4 : 2,
      v === threshold ? [10, 10] : [],
    );
    mono(c, v, 150, y(v) + 9, 27, v === threshold ? P.red : P.muted, 'right');
  }
  streak.forEach((r, i) => {
    const end = i ? streak[i - 1] : null,
      col = r.value > threshold ? P.amber : P.blue;
    if (end) line(c, x(i - 1), y(end.value), x(i), y(r.value), P.muted, 4);
    dot(c, x(i), y(r.value), 13, col);
    mono(c, r.value, x(i), y(r.value) - 23, 34, col, 'center');
    mono(c, 'W' + (i + 1), x(i), 816, 32, P.ink, 'center');
    const seen = (i < 3 && reset) || (i < 6 && fired) || last;
    if (seen) {
      const label = i === 6 ? 'latched' : 'run ' + r.count;
      mono(c, label, x(i), 398, 32, r.latched ? P.red : P.blue, 'center');
    }
  });
  caption(
    c,
    last
      ? 'The later healthy window leaves the emitted rollback in force.'
      : fired
        ? 'Window 6 completes the third consecutive breach.'
        : reset
          ? 'Window 3 resets the count to zero.'
          : 'Trace the consecutive breaches. Which window triggers rollback?',
  );
}
function digest(c, hash, x, y, color) {
  const bits = [...hash].map((d) => parseInt(d, 16).toString(2).padStart(4, '0')).join('');
  box(c, x - 10, y - 10, 180, 180, P.white);
  for (let i = 0; i < bits.length; i++)
    if (bits[i] === '1') box(c, x + 10 * (i % 16), y + 10 * Math.floor(i / 16), 10, 10, color);
}
function generation(c, k) {
  const restored = cue(k, 5, 'another controller restores B'),
    back = cue(k, 5, 'redeploys the identical C');
  const route = revisions[back ? 2 : restored ? 1 : 0];
  const digestMatch = cue(k, 5, 'fingerprints now match');
  const attempt = cue(k, 6, 'Zero rows match', 0.26);
  const reject = attempt === 1;
  const audit = cue(k, 6, 'adds no audit row');
  stage(
    c,
    'CONDITIONAL ROUTING UPDATE',
    'Can the queued command still change this route?',
    'Each square encodes the 256 bits of a release digest. Each switch increments the routing generation.',
  );
  const xs = [142, 1022];
  [measured, route].forEach((token, i) => {
    const x = xs[i],
      col = i ? P.blue : P.amber;
    cap(c, i ? 'Live routing row' : 'Queued rollback', x, 405, col);
    digest(c, token.release, x, 473, col);
    mono(c, 'release ' + letter(token), x + 213, 524, 40, col);
    txt(c, 'generation', x + 213, 588, 34, P.muted);
    mono(c, token.generation, x + 207, 690, 101, col);
    mono(c, token.release.slice(0, 10) + '…', x, 720, 29, col);
  });
  line(c, 928, 410, 928, 724, P.line);
  if (digestMatch && measured.release === route.release) {
    const rail = [[369, 758], [882, 758], [968, 758], [994, 758]];
    travel(c, rail, attempt, P.amber);
    txt(c, 'Release digest matches', 655, 743, 29, P.aqua);
    if (reject && measured.generation !== route.generation) {
      line(c, 1018, 741, 1018, 776, P.red, 7);
      txt(c, 'Generation mismatch', 1100, 766, 33, P.red);
    }
  }
  txt(
    c,
    audit
      ? '0 rows updated   ·   live route ' +
          letter(stale.pointer) + ' / ' + stale.pointer.generation +
          '   ·   no audit row added'
      : reject
        ? '0 rows updated'
        : 'Expected release and generation must both match the live row.',
    104, 843, 41, reject ? P.red : P.ink, 'Serif',
  );
}
function transaction(c, k) {
  const pending = cue(k, 7, 'tentatively writes'),
    fault = cue(k, 7, 'audit insert fails');
  const done = cue(k, 8, 'committed pointer stays'),
    inserted = cue(k, 8, 'the insert succeeds');
  const next = cue(k, 8, 'commits B'),
    previous = revisions[2],
    state = next ? retry : fail;
  const committed = done ? state.pointer : previous;
  stage(
    c,
    'LOCAL SQLITE TRANSACTION',
    inserted ? 'What commits when the retry succeeds?' : 'What survives an audit failure?',
    'Matching release + generation   /   pointer update and audit insert share one transaction',
  );
  line(c, 950, 371, 950, 809, P.line);
  cap(c, 'Inside the transaction', 111, 414);
  cap(c, 'Committed database', 1026, 414);
  txt(
    c,
    inserted
      ? 'Valid retry'
      : fault
        ? 'Audit insert raises'
        : pending
          ? 'Pending update'
          : 'Expected pointer',
    110,
    504,
    45,
  );
  const attempted = pending ? retry.pointer : previous;
  mono(
    c,
    letter(attempted) + ' / ' + attempted.generation,
    109,
    615,
    72,
    done && !inserted ? P.muted : P.blue,
  );
  if (pending)
    txt(
      c,
      inserted ? 'Audit row inserted' : fault ? 'Constraint error' : 'Awaiting audit insert',
      111,
      716,
      39,
      fault && !inserted ? P.red : P.muted,
    );
  if (done && !inserted) line(c, 107, 588, 388, 588, P.red, 5);
  if (!fault || done) {
    mono(c, letter(committed) + ' / ' + committed.generation, 1023, 615, 72, P.aqua);
    txt(c, next ? '1 new audit row' : '0 new audit rows', 1025, 716, 40);
  } else serif(c, 'Which writes survive?', 1023, 615, 51);
  caption(
    c,
    next && state.committed
      ? 'Both writes commit in this database. Confirm fleet and Git separately.'
      : inserted
        ? 'The insert succeeded. The retry can now commit both writes.'
        : done
          ? 'The exception discards both pending writes.'
          : fault
            ? 'Which pointer and audit row are durable?'
            : 'Other connections see the last committed state.',
  );
}
export function controllerScene(c, k) {
  const b = k.beat.beatIndex;
  if (b < 3) return metrics(c, k);
  if (b < 5) return windows(c, k);
  if (b < 7) return generation(c, k);
  return transaction(c, k);
}
