import assert from 'node:assert/strict';
import { taskRows, holdoutRows } from '../../../films/hypothesis-testing/fixtures.mjs';
import { joinTaskResults } from '../../../films/hypothesis-testing/model.mjs';
import {
  P,
  bi,
  rect,
  line,
  dot,
  text,
  label,
  title,
  ticket,
  mark,
  note,
  captionSafeNote,
  lerp,
  smooth,
  cue,
  arrow,
  bracket,
} from './art.mjs';
export const six = taskRows.slice(0, 6);
export function tally(rows) {
  const winB = rows.filter((r) => r.b > r.a).length,
    winA = rows.filter((r) => r.a > r.b).length;
  return { winB, winA, ties: rows.length - winB - winA, lift: (winB - winA) / rows.length };
}
const finishA = [
    { id: 'T01', pass: 1 },
    { id: 'T06', pass: 0 },
  ],
  finishB = [
    { id: 'T06', pass: 0 },
    { id: 'T01', pass: 1 },
  ];
const repaired = joinTaskResults(finishA, finishB).rows;
const stalled = joinTaskResults(finishA, finishB.slice(0, 1)).rows;
function gate(c, y, model, closed, p) {
  const x = 765,
    w = 970;
  label(c, 'MODEL ' + model, x, y - 68, 27);
  rect(c, x, y - 22, w, 44, P.faint, 22);
  const lock = closed === null;
  const gx = x + 535;
  rect(c, gx - 28, y - 78, 56, 53, P.slate, 8);
  if (!lock) {
    c.save();
    c.translate(gx, y - 51);
    if (!closed) c.rotate(-Math.PI / 2);
    rect(c, -9, -4, 18, 111, closed ? P.teal : P.rust, 4);
    for (const d of [20, 49, 78]) rect(c, -9, d, 18, 11, P.white);
    c.restore();
  } else {
    rect(c, gx - 27, y - 40, 54, 80, P.straw, 8);
    label(c, '?', gx, y, 33, P.gold, 'center');
  }
  dot(c, gx, y - 51, 12, P.ink);
  const end = closed === false ? x + w - 32 : gx - 40;
  const tx = lerp(x + 32, end, smooth(p));
  rect(c, tx - 29, y - 18, 58, 36, P.dark, 5);
  line(c, tx - 15, y - 6, tx + 15, y - 6, P.light, 3);
  line(c, tx - 15, y + 6, tx + 7, y + 6, P.light, 3);
  if (!lock)
    text(
      c,
      closed ? 'blocked' : p === 1 ? 'let through' : 'gate open',
      x + w,
      y + 66,
      34,
      closed ? P.teal : P.rust,
      { align: 'right' },
    );
}
export function opening(c, k) {
  const b = bi(k),
    answered = cue(k, 1, 'That passes the test', 0) > 0;
  ticket(c, 128, 350, 470, 404);
  label(c, 'T02   /   hidden test', 171, 411, 27);
  title(c, 'Permission', 171, 492, 58);
  text(c, 'Request is denied.', 171, 578, 34);
  line(c, 166, 626, 555, 626, P.line, 2, [6, 6]);
  label(c, 'Expect   BLOCK', 171, 686, 31, P.teal);
  gate(c, 460, 'A', false, cue(k, 0, 'A lets the request', 1.2));
  const approach = cue(k, 1, 'B keeps the gate closed', 1.1);
  gate(c, 700, 'B', approach ? true : null, approach);
  const ties = cue(k, 1, 'Five tasks ended in ties', 0.9);
  if (ties > 0) {
    label(c, 'Tied tasks', 172, 804, 27);
    six
      .filter((r) => r.a === r.b)
      .slice(0, Math.ceil(5 * ties))
      .forEach((r, i) => label(c, r.id, 401 + i * 95, 804, 28, P.slate));
  }
  const a = six.filter((r) => r.a).length,
    bCount = six.filter((r) => r.b && (r.id !== 'T02' || answered)).length;
  note(
    c,
    !answered
      ? 'One test result is still open.'
      : ties === 1
        ? 'How surprising is one B win?'
        : 'One disagreement in six matched tasks.',
    'A  ' + a + '     B  ' + bCount,
  );
}
export function pairs(c, k) {
  const b = bi(k),
    showAll = cue(k, 1, 'Read the six tickets', 1),
    diff = cue(k, 2, 'Subtract A from B', 1);
  const rows = b === 0 ? [six[1]] : six;
  rows.forEach((r, i) => {
    const x = b === 0 ? 380 : 140 + (i % 3) * 554,
      y = b === 0 ? 370 : 310 + Math.floor(i / 3) * 244,
      w = b === 0 ? 1160 : 524;
    ticket(c, x, y, w, 190, r.id === 'T02' ? P.sea : P.white);
    label(c, r.id, x + 33, y + 35, 27);
    title(c, r.task, x + 113, y + 35, 38);
    line(c, x + 26, y + 68, x + w - 28, y + 68, P.line, 2, [6, 6]);
    label(c, 'A', x + 40, y + 128);
    mark(c, x + 96, y + 128, r.a);
    label(c, 'B', x + 163, y + 128);
    mark(c, x + 218, y + 128, r.b);
    if (diff > i / 7 && b === 2) {
      label(c, 'B−A', x + w - 176, y + 126, 26);
      label(
        c,
        r.difference ? '+1' : '0',
        x + w - 58,
        y + 126,
        38,
        r.difference ? P.teal : P.slate,
        'center',
      );
    }
    if (b === 0) {
      label(c, 'explicit denial', x + 470, y + 128);
      arrow(c, x + 746, y + 128, x + 818, y + 128);
      label(c, 'blocked', x + 850, y + 128, 32, P.teal);
    }
  });
  if (b === 0) {
    title(c, 'One ID travels with both outcomes.', 960, 685, 46, P.ink, 'center');
    note(c, 'Same prompt and hidden tests.');
  } else
    note(
      c,
      'One extra pass across all six tasks.',
      showAll === 1 && (b === 2 || k.reveal('Keep the task population', 0))
        ? '1 / 6  ≈  +16.7 points'
        : '',
    );
}
export function identity(c, k) {
  const b = bi(k);
  if (b <= 2) {
    const swap = smooth(cue(k, 1, 'Now match the task IDs', 1.3));
    const apparent = [
      cue(k, 1, 'A appears to win timestamp', 0),
      cue(k, 1, 'B appears to win cache', 0),
    ];
    const missing = cue(k, 1, "Suppose B's timestamp result", 0) > 0;
    // The caption starts each sentence before the voice reaches “failure” and “minus one”.
    const timeoutIsFailure = cue(k, 2, 'failure', 0, { captionStart: 'Our declared policy' }) === 1;
    const showDifference = cue(k, 2, 'minus one', 0, { captionStart: 'A passed timestamp' }) === 1;
    label(c, 'CURRENT  /  A', 205, 315);
    label(c, 'CHALLENGER  /  B', 805, 315);
    label(c, 'B − A', 1575, 315, 29, P.slate, 'center');
    finishA.forEach((a, i) => {
      const y = 395 + i * 202;
      ticket(c, 180, y, 470, 128);
      title(c, a.id === 'T01' ? 'timestamp' : 'cache expiry', 222, y + 42, 41);
      label(c, a.id, 222, y + 97, 36);
      mark(c, 578, y + 68, a.pass);
      line(c, 650, y + 64, 795, y + 64, P.line, 3, [8, 8]);
      let v = swap === 1 ? repaired[i].difference : finishB[i].pass - a.pass;
      if (missing && stalled[i].b === null) v = showDifference ? 0 - a.pass : null;
      if ((!swap && apparent[i]) || swap === 1)
        title(
          c,
          v === null ? '?' : v.toLocaleString('en-US', { signDisplay: 'exceptZero' }).replace('-', '−'),
          1575,
          y + 64,
          66,
          v === 0 ? P.slate : P.rust,
          'center',
        );
    });
    finishB.forEach((r, i) => {
      const y = 395 + lerp(i, 1 - i, swap) * 202,
        x = 800 + Math.sin(Math.PI * swap) * (i ? 520 : 0);
      ticket(c, x, y, 490, 128, P.sea);
      title(c, r.id === 'T01' ? 'timestamp' : 'cache expiry', x + 40, y + 42, 41);
      label(c, r.id, x + 40, y + 97, 36);
      if (missing && r.id === 'T01')
        label(c, timeoutIsFailure ? 'timeout = fail' : 'timeout', x + 158, y + 97, 36, P.rust);
      else mark(c, x + 413, y + 69, r.pass);
    });
    note(
      c,
      b === 2
        ? 'A timeout occupies its original slot.'
        : swap === 1
          ? 'Each task now faces its own result.'
          : 'Pairing by finish order',
      '1 attempt per assistant',
    );
  } else if (b <= 5) {
    ticket(c, 170, 299, 1580, 482);
    label(c, 'RUN PLAN   /   one attempt per model', 220, 353, 29);
    const fields =
      b === 3
        ? [
            ['Checkpoint', 'A and B hashes'],
            ['Test conditions', 'Prompt, tests, decoder, seeds'],
            ['Limits', 'Tokens, timeout, selector'],
          ]
        : [
            ['Fixed analysis', 'Right tail for B'],
            ['Stopping rule', '40 matched tasks'],
            ['Release rule', b === 5 ? 'Lower endpoint > +2 points' : 'Minimum chosen in advance'],
          ];
    fields.forEach(([left, right], i) => {
      const y = 452 + i * 108;
      line(c, 215, y - 43, 1704, y - 43, P.line, 2, [6, 6]);
      text(c, left, 225, y, 39);
      text(c, right, 1678, y, 38, i === 2 ? P.teal : P.ink, { align: 'right' });
    });
    note(
      c,
      b === 3
        ? 'Save the settings with the matched rows.'
        : b === 4
          ? 'Changing the timeout changes the comparison.'
          : 'Freeze the choice. Reserve fresh tasks.',
    );
  } else {
    const n = 20,
      selected = cue(k, 6, 'Carry those related tasks', 1.3);
    for (let i = 0; i < n; i++) {
      const x = 185 + (i % 10) * 153,
        y = 411 + Math.floor(i / 10) * 129 - 35 * smooth(selected);
      ticket(c, x, y, 129, 91, P.sea);
      label(c, 'v' + (i + 1), x + 64, y + 45, 30, P.teal, 'center');
    }
    bracket(c, 180, 711, 1507, P.gold, -33);
    title(c, 'One repository', 930, 774, 46, P.ink, 'center');
    captionSafeNote(c, 'Draw whole independent clusters.', '20 variants   /   1 cluster');
  }
}
export function forty(c, k) {
  const arrive = cue(k, 0, 'Finish the planned forty-task run', 1.8);
  const sorted = Math.floor(40 * cue(k, 0, 'Watch the original permission row', 4.4));
  const colors = [P.white, P.sea, P.blush],
    starts = [142, 1000, 1472],
    cols = [9, 4, 3];
  const out = [[], [], []];
  label(c, 'Run order   /   T01 through T40', 142, 296, 28);
  taskRows.forEach((r, j) => {
    const g = r.difference === 0 ? 0 : r.difference > 0 ? 1 : 2;
    const x = 142 + (j % 20) * 82,
      y = 335 + Math.floor(j / 20) * 65;
    const present = j < 6 + Math.floor(34 * arrive);
    ticket(c, x, y, 73, 55, j < sorted || !present ? P.faint : colors[g]);
    if (present) label(c, r.id, x + 36, y + 28, 22, j < sorted ? P.slate : P.ink, 'center');
    if (j < sorted) out[g].push(r);
  });
  out.forEach((rows, g) => {
    label(c, ['AGREEMENTS', 'B ONLY', 'A ONLY'][g], starts[g], 514, 28);
    rows.forEach((r, i) => {
      const x = starts[g] + (i % cols[g]) * 87,
        y = 557 + Math.floor(i / cols[g]) * 68;
      ticket(c, x, y, 78, 57, colors[g]);
      label(c, r.id, x + 39, y + 28, 25, P.ink, 'center');
    });
    title(c, String(rows.length), starts[g], 796, 50, [P.slate, P.teal, P.rust][g]);
  });
  const result = cue(k, 1, 'Before opening the results', 0);
  note(c, 'Same one-attempt protocol on forty tasks.', result ? '(8 − 5) / 40  =  +7.5 pts' : '');
}
export function checkPairs() {
  assert.deepEqual(tally(six), { winA: 0, winB: 1, ties: 5, lift: 1 / 6 });
  assert.deepEqual(tally(taskRows), { winA: 5, winB: 8, ties: 27, lift: 0.075 });
  assert.deepEqual(tally(holdoutRows), { winA: 12, winB: 52, ties: 336, lift: 0.1 });
  assert.deepEqual(
    finishB.map((r, i) => r.pass - finishA[i].pass),
    [-1, 1],
  );
  assert.deepEqual(
    repaired.map((r) => r.difference),
    [0, 0],
  );
  assert.equal(stalled[0].difference, null);
}
