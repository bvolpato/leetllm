import {
  C,
  reveal,
  mix,
  rect,
  label,
  mono,
  serif,
  line,
  dot,
  plate,
  substrate,
  head,
  foot,
  strip,
  socket,
  polygon,
} from './drawing.mjs';
import { recovery, standard, practice, pagesFor } from './examples.mjs';
import { ledger } from './memory.mjs';

function connector(c, x, y, dx, loss, cut) {
  const l = x - 78 - loss * 31 - (cut ? 15 : 0),
    r = x + loss * 47 + (cut ? 15 : 0);
  line(
    c,
    [
      [dx, y],
      [l, y],
    ],
    C.board,
    13,
  );
  line(
    c,
    [
      [r + 68, y],
      [1360, y],
    ],
    C.board,
    13,
  );
  rect(c, l, y - 27, 66, 54, C.A);
  rect(c, l + 65, y - 15, 37, 30, C.gold);
  rect(c, r, y - 30, 68, 60, C.B);
  rect(c, r + 2, y - 16, 9, 32, C.deep);
  for (let j = 0; j < 4; j++) {
    rect(c, l + 6 + j * 11, y - 21, 4, 43, '#db8b65');
    rect(c, r + 19 + j * 10, y - 24, 4, 48, '#7097b0');
  }
}
function linkRecovery(c, k) {
  const b = k.beat.beatIndex;
  const sever = reveal(k, 0, 'connection breaks', 0.55);
  const cut = Boolean(reveal(k, 0, 'connection breaks'));
  const usage = Boolean(reveal(k, 2, 'worker reports'));
  const retired = Boolean(reveal(k, 3, 'owner confirms execution has stopped'));
  const repeat = reveal(k, 3, 'A duplicate completion'),
    partial = reveal(k, 4, 'End this stream');
  const s = recovery(standard, { lost: cut, usage, retired, handles: 3, duplicate: Boolean(repeat) });
  head(
    c,
    k,
    'Attempt ownership   /   A · r1 · 1',
    partial ? 'How does the partial reply end?' : 'What did the disconnect actually release?',
  );
  plate(c, 107, 282, 465, 147, C.board);
  label(c, 'Worker  /  attempt 1', 140, 341, 39, C.cream);
  mono(c, cut && !retired ? 'reconciling' : s.status, 140, 394, 32, C.gold);
  connector(c, 974, 354, 572, sever, cut);
  plate(c, 1353, 275, 457, 163, '#d2dac7');
  label(c, 'Client received', 1390, 331, 32, C.muted);
  const words = reveal(k, 0, 'reply reach the client', 0.7);
  const prefix =
    words === 1 ? 'The review found' : words > 0.45 ? 'The review' : words > 0 ? 'The' : '';
  serif(c, '“' + prefix + (cut ? ' …' : '') + '”', 1390, 396, 39);
  if (partial) mono(c, 'PARTIAL RESULT', 1364, 483, 32, C.red);
  substrate(c, 92, 501, 1738, 285);
  ledger(c, standard, s, 154, 564, 947, 46);
  line(
    c,
    [
      [1173, 537],
      [1173, 745],
    ],
    C.trace,
    3,
  );
  label(c, 'Last device read', 1230, 565, 31, C.cream);
  for (let i = 0; i < 3; i++) socket(c, 1229 + i * 154, 591, 128, 70, C.aLight, i < s.livePages);
  mono(c, s.livePages + ' page references', 1233, 720, 31, C.cream);
  let msg = 'The client is receiving the reply.';
  if (cut) msg = 'The reply is partial. The attempt still has an owner.';
  if (b === 1) msg = 'Reconcile the old attempt under its original identity.';
  if (usage) msg = 'Usage recorded. The last device read still holds its pages.';
  if (retired)
    msg = repeat
      ? 'Duplicate delivery. No further release.'
      : 'Execution retired. The ledger can settle once.';
  if (partial) msg = 'Preserve the delivered prefix and report a partial result.';
  foot(
    c,
    msg,
    usage
      ? 'Trusted usage   300 input + 120 generated   ·   ' +
          (retired ? 'retirement confirmed' : 'retirement pending')
      : 'Period limit   1,000 units   ·   Reservation covers 300 input + 400 maximum output',
  );
}
function exercise(c, k) {
  const b = k.beat.beatIndex;
  const held = Boolean(reveal(k, 7, 'Hold six hundred')),
    grant = Boolean(reveal(k, 7, 'Reserve thirty-eight'));
  const candidate = Boolean(reveal(k, 7, 'Thirty-seven pages cover'));
  const usage = Boolean(reveal(k, 7, 'receipt reports ninety')),
    lost = Boolean(reveal(k, 7, 'acknowledgement goes missing'));
  const retired = Boolean(reveal(k, 8, 'worker confirms the attempt has stopped'));
  const duplicate = reveal(k, 8, 'A second delivery');
  const n = pagesFor(practice.input, practice.cap);
  const s = recovery(practice, {
    booked: held,
    lost,
    usage,
    retired,
    handles: grant ? n : 0,
    duplicate: Boolean(duplicate),
  });
  head(
    c,
    k,
    'Practice   /   C · r9 · 2',
    duplicate
      ? 'What does the second delivery change?'
      : retired
        ? 'How much can C spend now?'
        : usage
          ? 'What does the usage receipt release?'
          : 'What must the platform reserve?',
  );
  substrate(c, 88, 287, 1743, 495);
  mono(c, 'PERIOD LIMIT  1,500', 143, 360, 31, C.cream);
  mono(c, 'WORKER PAGES  /  16 POSITIONS EACH', 943, 360, 29, C.cream);
  ledger(c, practice, s, 145, 432, 716, 51);
  line(
    c,
    [
      [909, 326],
      [909, 722],
    ],
    C.trace,
    3,
  );
  const visible = grant ? n : candidate ? 37 : 0;
  if (!candidate) {
    mono(c, 'One page', 944, 464, 32, C.cream);
    for (let i = 0; i < 16; i++)
      socket(c, 945 + (i % 8) * 75, 487 + Math.floor(i / 8) * 63, 59, 48, C.bLight, false);
  }
  for (let i = 0; i < (grant ? n : visible); i++) {
    const x = 944 + (i % 10) * 78,
      y = 405 + Math.floor(i / 10) * 55;
    socket(c, x, y, 62, 42, C.bLight, !retired && i < visible && grant);
    if (!grant && candidate && i < 37) rect(c, x + 7, y + 14, 48, 12, C.steel);
  }
  const pagesText = retired
    ? '38 returned   /   0 held'
    : grant
      ? '38 held   /   608 slots'
      : candidate
        ? '37 pages fit only 592'
        : 'How many whole pages?';
  mono(c, pagesText, 942, 676, 33, C.cream);
  mono(
    c,
    usage ? '240 input  +  90 generated output' : '240 input  +  360 maximum output',
    147,
    688,
    32,
    C.gold,
  );
  const main = retired
    ? duplicate
      ? 'Replay complete. C can still spend 1,170 units.'
      : 'Settle 330 units and return the unused 270.'
    : usage
      ? 'Receipt for 90 output. The last read is pending.'
      : grant
        ? '600 units held. Eight reserved slots remain spare.'
        : candidate
          ? '37 pages fall short by eight positions.'
          : held
            ? '600 units move from available into held allowance.'
            : 'Size allowance and page capacity independently.';
  foot(
    c,
    main,
    retired
      ? 'Trusted usage and retired execution   ·   request 9, attempt 2'
      : usage
        ? 'Can the owner settle the receipt or return the pages yet?'
        : lost
          ? 'Acknowledgement missing. Preserve the owner.'
          : 'Full-cap admission   ·   one quota unit per token   ·   integer pages',
  );
}
function rollout(c, k) {
  const switchRoute = reveal(k, 5, 'Route new requests', 0.65);
  const review = reveal(k, 5, 'Compare short summaries');
  head(c, k, 'Rollout under load', 'Where should a new request run?');
  const rows = [
    ['Active stream', 'Original revision', 'Live reader / old namespace', C.aLight],
    ['New request', 'Approved revision', 'New namespace / ready capacity', C.bLight],
  ];
  rows.forEach(([name, revision, state, color], i) => {
    const y = 319 + i * 233;
    plate(c, 103, y + 15, 475, 126, i ? C.B : C.A);
    label(c, name, 151, y + 92, 47, C.cream);
    const t = i ? switchRoute : 1;
    line(
      c,
      [
        [584, y + 79],
        [947, y + 79],
      ],
      C.edge,
      9,
    );
    if (t > 0)
      line(
        c,
        [
          [584, y + 79],
          [584 + 363 * t, y + 79],
        ],
        i ? C.B : C.A,
        10,
      );
    substrate(c, 943, y, 850, 170);
    mono(c, revision, 1003, y + 71, 41, color);
    label(c, state, 1005, y + 126, 32, C.cream);
  });
  foot(
    c,
    review
      ? 'Compare both tenants under the same offered load.'
      : 'Drain old readers on the revision they pinned.',
    review
      ? 'Measure successful completions and tail latency. Audit each delivered citation separately.'
      : 'Approve the destination and budget compute for shadow traffic. Retain a rollback route.',
  );
}
export function finish(c, k) {
  if (k.beat.beatIndex < 5) return linkRecovery(c, k);
  if (k.beat.beatIndex === 5) return rollout(c, k);
  exercise(c, k);
}
