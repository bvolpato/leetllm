import {
  C,
  base,
  box,
  cents,
  circle,
  cue,
  fmt,
  line,
  paper,
  small,
  spoken,
  stamp,
  strip,
  smooth,
  txt,
} from './art.mjs';
import {
  early,
  edgeA,
  edgeB,
  grant,
  grantPermit,
  grantRequest,
  policy,
  replays,
} from './examples.mjs';

function receipt(g, x, y) {
  const r = grant.receipt;
  strip(g, x, y, 544, 379, '#dfebd0');
  small(g, 'GRANT RECEIPT', x + 40, y + 52, C.ok);
  txt(g, r.id, x + 38, y + 146, 77, C.ink, 'serif');
  line(g, x + 40, y + 175, x + 500, y + 175, C.rule, 2);
  small(g, r.subject + '  →  ' + r.resource, x + 40, y + 232, C.ink, 28);
  txt(g, 'Role: ' + r.role, x + 40, y + 291, 35, C.ink);
  small(g, 'Approval   ' + r.reviewReceipt, x + 40, y + 345, C.muted, 26);
}

export function audit(g, k) {
  const b = k.beat.beatIndex;
  base(g, b !== 1 && b !== 2);
  if (b === 0) {
    strip(g, 115, 127, 1680, 795);
    small(g, 'POLICY REPLAY   /   R900', 182, 210);
    txt(g, 'Three rehearsals', 180, 321, 74, C.ink, 'serif');
    const names = ['Healthy primary', 'Early timeout', 'Oversized input'];
    small(g, 'CASE', 191, 417);
    small(g, 'CALLS MADE', 780, 417);
    small(g, 'OUTCOME', 1338, 417);
    replays.forEach((r, i) => {
      const y = 512 + i * 108,
        visible = cue(k, 0, ['An early timeout', 'The oversized request', 'Both served routes'][i]);
      line(g, 175, y + 37, 1727, y + 37, C.rule, 2);
      txt(g, names[i], 191, y, 41);
      if (visible) {
        txt(
          g,
          r.spans.length ? r.spans.map((s) => s.lane.id).join('  →  ') : '0',
          783,
          y,
          41,
          C.ink,
          'mono',
        );
        txt(g, r.served ? 'Transport OK' : 'Escalated', 1337, y, 38, r.served ? C.ok : C.rust);
      }
    });
    if (cue(k, 0, 'For each one'))
      small(g, 'Join reviewed answers, supporting passages and usage.', 190, 849, C.muted, 31);
    return;
  }
  if (b <= 2) {
    const committed = cue(k, 1, 'Only the explanation timed out');
    const use = cue(k, 1, 'Pass the verified receipt');
    const duplicate = cue(k, 2, 'The grant count stays');
    const different = cue(k, 2, 'Even with fresh approval');
    const conflict = cue(k, 2, 'A durable service');
    const currentRequest = different ? grant.changedRequest : grantRequest;
    const permit = different ? grant.changedPermit : grantPermit;
    small(g, 'WRITE SERVICE   /   HUMAN APPROVAL ' + permit.reviewReceipt, 135, 158, C.mint);
    txt(g, 'The grant has its own record', 130, 269, 77, C.paper, 'serif');
    paper(g, 125, 360, 980, 455);
    small(g, 'SCOPED OPERATION', 171, 434);
    txt(g, grant.receipt.key, 169, 542, 77, C.ink, 'mono');
    txt(g, currentRequest.subject + '   →   ' + currentRequest.resource, 172, 628, 47, C.ink);
    if (committed) {
      const result = different ? grant.changed : duplicate ? grant.replay : grant.first;
      const stamps = { reused: 'RECEIPT REUSED', committed: 'COMMITTED', conflict: 'KEY CONFLICT' };
      const label = different && !conflict ? 'COMPARE TARGETS' : stamps[result.status];
      stamp(g, label, 173, 748, different ? C.rust : C.ok, 34);
      txt(g, result.effects + ' grant', 734, 750, 43, C.ok, 'mono');
      receipt(g, 1241, 384);
    }
    if (different)
      small(g, 'Stored receipt still refers to ' + grant.receipt.resource, 142, 932, C.mint, 32);
    else if (use && b === 1) {
      const transfer = cue(k, 1, 'Pass the verified receipt', 1.4);
      box(g, 129, 857, 967, 126, C.field, 8, C.mint, 2);
      small(g, 'Explanation input', 174, 936, C.light, 35);
      const x = 1333 - 671 * transfer;
      box(g, x, 881, 367, 77, C.light, 5);
      txt(g, grant.receipt.id, x + 183, 936, 45, C.ink, 'mono', 'center');
    } else if (use)
      small(g, 'Recheck caller, operation and exact parameters', 145, 928, C.mint, 32);
    return;
  }
  const c = early.run.spans[0],
    d = early.run.spans[1];
  small(g, 'EXPLANATION   /   REQUEST R900', 130, 151);
  txt(g, 'Both attempts appear on the bill', 125, 257, 76, C.ink, 'serif');
  const settledC = cue(k, 3, 'We reserved half a cent');
  const holdD = cue(k, 3, 'Its final charge');
  const settledD = spoken(k, 3);
  for (const [i, s] of [c, d].entries()) {
    const x = 124 + i * 840,
      y = 367;
    strip(g, x, y, 801, 353, i === 0 ? '#e4e7db' : C.paper);
    small(g, 'ATTEMPT 0' + (i + 1) + '     LANE ' + s.lane.id, x + 43, y + 75);
    txt(g, i === 0 ? 'Timed out' : 'Reply returned', x + 42, y + 167, 56, C.ink, 'serif');
    line(g, x + 44, y + 201, x + 751, y + 201, C.rule, 2);
    const settled = i === 0 ? settledC : settledD;
    if (settled || (i === 1 && holdD)) {
      txt(g, settled ? 'Billed' : 'Reserved', x + 46, y + 281, 36, C.muted);
      txt(
        g,
        cents(settled ? s.charge : policy.reservation, 2),
        x + 728,
        y + 292,
        65,
        settled ? C.ink : C.blue,
        'mono',
        'right',
      );
    }
  }
  if (cue(k, 4, "Price each provider's reported usage")) {
    txt(g, 'Total billed', 135, 856, 51, C.ink, 'serif');
    txt(
      g,
      cents(c.charge, 2) + ' + ' + cents(d.charge, 2) + ' = ' + cents(early.run.spent, 2),
      615,
      859,
      58,
      C.ok,
      'mono',
    );
  }
  if (cue(k, 4, 'The receipt records'))
    small(g, 'GR-27   /   1 committed grant', 136, 955, C.muted, 32);
}

const xStart = (ms) => 229 + (ms - 1397) * 118;
const xEnd = (ms) => 1115 + (ms - 2497) * 118;
const limit = policy.deadline;
function graduation(g, x, first, last, y, step) {
  line(g, x(first), y, x(last), y, C.muted, 3);
  for (let n = first; n <= last; n += step) {
    line(g, x(n), y - 13, x(n), y + 13, C.muted, 3);
    txt(g, fmt(n), x(n), y + 57, 28, C.ink, 'mono', 'center');
  }
}
function band(g, p, y, progress, actual, history = false, a = xStart(p.start)) {
  const z = 897 + (xEnd(p.finish) - 897) * progress;
  const ink = history ? C.muted : actual ? C.ok : C.blue;
  const thick = history ? 5 : 12;
  const dash = history || actual ? [] : [13, 9];
  line(g, a, y, 839, y, ink, thick, dash);
  line(g, 850, y + 13, 864, y - 14, ink, 4);
  line(g, 868, y + 13, 882, y - 14, ink, 4);
  if (progress > 0) line(g, 897, y, z, y, ink, thick, dash);
  if (progress === 1)
    circle(g, z, y, history ? 12 : 16, history || actual ? C.ok : C.paper, ink, 5);
  line(g, a, y - 14, a, y + 14, ink, 5);
}

export function lastMillisecond(g, k) {
  base(g, true);
  const b = k.beat.beatIndex;
  const response = (beat, phrase) => {
    if (b !== beat) return Number(b > beat);
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart: false });
  };
  const compare = b >= 3;
  const p = compare ? edgeB : edgeA;
  const start = response(0, 'thirteen hundred ninety-nine milliseconds') === 1;
  const duration = spoken(k, 0);
  const lifted = smooth(cue(k, 3, 'Keep D and the deadline fixed', 0.35));
  const movement = b === 3
    ? smooth(
        k.reveal(
          "Move C's timeout",
          k.wordCue('fourteen hundred milliseconds').end - k.wordCue("Move C's timeout").start,
          { captionStart: "Move C's timeout" },
        ),
      )
    : Number(b > 3);
  const finish = smooth(
    compare
      ? response(4, 'This finish lands exactly at twenty-five hundred')
      : response(2, 'The finish is twenty-four hundred ninety-nine milliseconds'),
  );
  const sent = !compare && response(2, 'Send D') === 1;
  const finished = !compare && response(2, 'the reply arrives on that tick') === 1;
  const skipped = compare && response(4, 'Skip D') === 1;
  const returned = compare && response(4, 'Viewer access was granted') === 1;
  small(g, 'R900   /   EXPLANATION ONLY   /   NO WORDS DELIVERED BY C', 117, 127);
  txt(g, 'The last millisecond', 110, 234, 85, C.ink, 'serif');
  strip(g, 100, 284, 1720, 644);
  small(g, 'C TIMES OUT', 164, 369);
  small(g, 'D NEEDS', 706, 369);
  small(g, 'REQUIRED FINISH', 1191, 369);
  const visibleStart = movement === 1 ? edgeB.start : edgeA.start;
  txt(g, start ? fmt(visibleStart) + ' ms' : '…', 163, 452, 60, C.ink, 'mono');
  txt(g, duration ? fmt(p.duration) + ' ms' : '…', 706, 452, 60, C.ink, 'mono');
  txt(g, '< ' + fmt(limit) + ' ms', 1191, 452, 56, C.rust, 'mono');
  line(g, 162, 487, 1751, 487, C.rule, 2);
  small(g, 'Start ticks', 167, 552, C.muted, 28);
  small(g, 'Finish ticks', 1070, 552, C.muted, 28);
  const axisY = 720,
    y = 650;
  graduation(g, xStart, 1397, 1402, axisY, 1);
  graduation(g, xEnd, 2497, 2502, axisY, 1);
  line(g, xEnd(limit), 580, xEnd(limit), axisY + 12, C.rust, 5);
  if (compare) {
    band(g, edgeA, y - 50 * lifted, 1, true, true);
    if (lifted === 1) small(g, 'First run', 160, 607, C.ok, 24);
    if (movement > 0) {
      const cursor = xStart(edgeA.start) + (xStart(edgeB.start) - xStart(edgeA.start)) * movement;
      band(g, p, y, finish, false, false, cursor);
      small(g, 'Proposed', 160, 657, C.blue, 24);
    }
  } else if (start) {
    band(g, p, y, finish, finished);
  }
  if (finish === 0 && duration && (!compare || movement === 1))
    txt(g, '?', 1221, 668, 48, C.muted, 'serif', 'center');
  if (finish === 1)
    txt(g, fmt(p.start) + ' + ' + fmt(p.duration) + ' = ' + fmt(p.finish) + ' ms',
      166, 830, 44, C.ink, 'mono');
  if (sent || skipped)
    stamp(
      g,
      skipped ? 'SKIP D' : finished ? 'D FINISHED' : 'SEND D',
      1237,
      845,
      skipped ? C.rust : C.ok,
      37,
    );
  if (returned)
    small(
      g,
      p.run.spans.length + ' attempt  ·  ' + fmt(p.run.elapsed) + ' ms  ·  ' +
        grant.receipt.id + ' confirms viewer access',
      165,
      879,
      C.ink,
      28,
    );
}
