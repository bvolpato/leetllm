import assert from 'node:assert/strict';
import { CASES, probes } from '../../../films/benchmark-audits/fixtures.mjs';
import { rankedPrecision } from '../../../films/benchmark-audits/arithmetic.mjs';
import {
  C,
  base,
  fill,
  line,
  path,
  dot,
  sheet,
  slot,
  letter,
  mono,
  serif,
  label,
  mark,
  medallion,
  arrow,
  mix,
  cue,
  note,
  reading,
} from './art.mjs';

const names = ['A', 'B'];
const renewals = CASES.filter((q) => q.category === 'renewal');
const ordinary = CASES.filter((q) => q.category === 'ordinary');
const total = (items, m) => items.filter((q) => q[m]).length;
const renewalGains = renewals.filter((q) => !q.A && q.B);
const ordinaryLoss = total(ordinary, 'A') - total(ordinary, 'B');
const renewalFloor = 8;
const audits = probes.map((row) => ({
  ...row,
  checker: ['books', 'friday'].every((w) => row.answer.toLowerCase().includes(w)),
}));
const ranks = [1, 0, 1];
const facts = ['Freeze in effect', 'Release in scope', 'Commander approval'];
const covered = [true, true, false];
function policyRows(duplicate, unsupported) {
  return [
    ['P1', 'Freeze requires commander approval', ['Commander approval']],
    [duplicate ? 'P1' : 'P2', 'Breach calls for the rollback runbook',
      [unsupported ? 'Keep deploying' : 'Rollback runbook']],
    ['P3', 'Revoke exposed tokens within 15 min', ['Revoke', 'within 15 min']],
  ];
}
const supportedSpans = ([, policy, spans]) =>
  spans.every((span) => policy.toLowerCase().includes(span.toLowerCase()));

export function checkLibrary() {
  const validRows = policyRows(false, false);
  assert.ok(validRows.every(supportedSpans));
  assert.equal(new Set(validRows.map(([id]) => id)).size, 3);
  assert.deepEqual(policyRows(true, false).map(([id]) => id), ['P1', 'P1', 'P3']);
  assert.deepEqual(policyRows(false, true).map(supportedSpans), [true, false, true]);
  assert.deepEqual(
    renewals.map((q) => q.id),
    Array.from({ length: 10 }, (_, i) => 'Q' + (91 + i)),
  );
  assert.deepEqual(
    names.map((m) => [total(CASES, m), total(ordinary, m), total(renewals, m)]),
    [
      [90, 88, 2],
      [90, 81, 9],
    ],
  );
  assert.deepEqual(
    renewalGains.map((q) => q.id),
    ['Q93', 'Q94', 'Q95', 'Q96', 'Q97', 'Q98', 'Q99'],
  );
  assert.equal(ordinaryLoss, 7);
  assert.equal(renewalGains.length - ordinaryLoss, total(CASES, 'B') - total(CASES, 'A'));
  assert.deepEqual(names.map((m) => total(renewals, m) >= renewalFloor), [false, true]);
  assert.deepEqual(
    audits.map((a) => [a.checker, a.reviewed]),
    [
      [true, true],
      [true, false],
      [false, true],
    ],
  );
  assert.equal(audits.filter((a) => a.reviewed).length, 2);
  assert.ok(Math.abs(rankedPrecision(ranks) - 5 / 6) < 1e-9);
  assert.equal(covered.filter(Boolean).length, 2);
}
export function renew(c, k) {
  const b = k.beat.beatIndex;
  base(c, 'Circulation  /  Case reader', 'Who should take the renewal desk?');
  const countSheets = b === 0 && k.elapsed < k.wordCue('Both assistants').start;
  let rows = 10;
  if (countSheets) {
    const first = k.wordCue('Two hundred').start;
    const last = k.wordCue('assistant').start;
    rows = k.elapsed < first ? 0 : 1 + Math.floor(9 * Math.min(1, (k.elapsed - first) / (last - first)));
  }
  const showScore = b > 0 || k.reveal('ninety', 0, { captionStart: false });
  const showGold = b > 0 || k.reveal('gold strip', 0, { captionStart: false });
  const showSlots = cue(k, 1, 'Line up', 0);
  const lift = cue(k, 1, 'Line up', 1.8);
  const travel = Math.min(1, lift / 0.62);
  const enlarge = Math.max(0, (lift - 0.62) / 0.38);
  const reveal = [cue(k, 2, "Open A's ten renewals", 1.25), cue(k, 2, "Open B's row", 1.25)];
  const pointToCase = b > 2 || (b === 2 && k.reveal('Put your finger', 0, { captionStart: false }));
  label(c, 'Numbered answer sheets', 108, 302);
  if (showScore) label(c, 'Whole sheet', 552, 302);
  if (showSlots) label(c, 'Renewal questions in case order', 864, 302);
  names.forEach((m, j) => {
    const y = 337 + j * 276,
      gx = 186,
      gy = y + 26,
      dx = 27,
      dy = 20;
    sheet(c, 105, y, 391, 248);
    fill(c, 105, y, 57, 248, C.cold);
    mono(c, m, 133, y + 116, 41, C.paper, { align: 'center' });
    for (let i = 0; i < rows * 10; i++) {
      const x = gx + (i % 10) * dx,
        py = gy + Math.floor(i / 10) * dy;
      fill(c, x, py, 21, 14, i < 90 || !showGold ? C.steel : C.shade);
    }
    if (countSheets && rows) letter(c, `${rows} × 10 = ${rows * 10} marks`, 548, y + 119, 56, C.cold, { bold: true });
    if (showScore) mono(c, total(CASES, m) + ' / 100', 548, y + 72, 48);
    if (lift === 1) mono(c, total(ordinary, m) + ' / 90 ordinary', 551, y + 145, 26, C.fine);
    if (showSlots) {
      fill(c, 846, y + 30, 986, 166, '#d6cdb6');
      fill(c, 846, y + 183, 986, 13, '#b3a387');
      renewals.forEach((q, i) => {
        const x = 860 + i * 97;
        slot(c, x, y + 42, 89, 138);
        if (travel < 1) mono(c, q.id, x + 44.5, y + 77, 26, C.fine, { align: 'center' });
        dot(c, x + 44.5, y + 144, 17, '#c2bdaf');
      });
    }
    if (!showGold) return;
    renewals.forEach((q, i) => {
      const x = mix(gx + i * dx, 860 + i * 97, travel),
        py = mix(gy + 9 * dy, y + 42, enlarge);
      const w = mix(21, 89, enlarge),
        h = mix(14, 142, enlarge);
      const selected = pointToCase && q.id === 'Q93';
      fill(c, x, py, w, h, selected ? C.ink : C.gold);
      if (enlarge > 0.55)
        mono(c, q.id, x + w / 2, py + 34, selected ? 42 : 28, selected ? C.paper : C.ink,
          { align: 'center', max: w - 6, bold: selected });
      if (reveal[j] * 10 > i) medallion(c, x + w / 2, py + h * 0.69, q[m], selected ? 34 : 24);
    });
    if (reveal[j] === 1) mono(c, total(renewals, m) + ' / 10 renewals', 864, y + 232, 35, C.cold);
  });
  if (b === 3)
    note(c, 'B handled nine renewals. Q93 is one of the cases behind the decision.', 110, 938);
}
export function contract(c, k) {
  const b = k.beat.beatIndex;
  base(c, 'Comparison protocol', 'What else changed with the model?');
  if (b === 2) {
    const lanes = [
      ['Knowledge', 'One question', 'Choice scored'],
      ['Code', 'One program', 'Tests executed'],
      ['Preference', 'Two replies', 'Vote recorded'],
    ];
    lanes.forEach(([h, a, z], i) => {
      const y = 320 + i * 186;
      label(c, h, 100, y);
      sheet(c, 440, y - 36, 525, 116);
      serif(c, a, 476, y + 20, 48);
      arrow(c, 1008, y + 18, 1140, y + 18);
      letter(c, z, 1190, y + 18, 47);
    });
    note(c, 'Shortlist candidates, then run the matched application task.');
    return;
  }
  const change = cue(k, 1, 'five retrieved passages', 1.2);
  const count = 3 + Math.round(2 * change);
  ['Cases', 'Retrieved passages', 'Model', 'Scoring rule'].forEach((t, i) =>
    label(c, t, [280, 650, 1280, 1560][i], 325),
  );
  names.forEach((m, j) => {
    const y = 455 + j * 220;
    letter(c, m, 110, y, 75, C.cold, { bold: true });
    mono(c, 'Q1–100', 280, y, 43);
    for (let i = 0; i < (j ? count : 3); i++) {
      sheet(c, 650 + i * 94, y - 63, 84, 116, j && i >= 3 ? C.gold : C.paper);
      mono(c, i + 1, 690 + i * 94, y, 37, C.ink, { align: 'center' });
    }
    mono(c, m, 1310, y, 53);
    letter(c, 'Frozen', 1560, y, 40);
  });
  note(
    c,
    count === 3
      ? 'Match the prompt, tool access and attempt budget.'
      : 'The second system also receives more evidence.',
  );
}
export function gold(c, k) {
  const b = k.beat.beatIndex,
    wrong =
      b === 2 && cue(k, 2, 'keep deploying') > 0 && cue(k, 2, 'Repair the gold row first') < 1;
  const dup = b === 1 && cue(k, 1, 'Duplicating an identity') > 0 && cue(k, 1, 'A reviewer') === 0;
  base(c, 'Policy collection  /  Answer key', 'Does the source support the required fact?');
  ['Case ID', 'Policy clause', 'Required in the answer'].forEach((t, i) =>
    label(c, t, [118, 405, 1180][i], 319),
  );
  policyRows(dup, wrong).forEach(([id, source, spans], i) => {
    const y = 386 + i * 135;
    sheet(c, 92, y, 1735, 112, i === 1 && (wrong || dup) ? C.rose : C.paper);
    mono(c, id, 121, y + 57, 43);
    letter(c, source, 405, y + 57, 39, C.ink, { max: 714 });
    const requirements = spans.map((span) => '“' + span + '”').join('    ');
    letter(c, requirements, 1180, y + 57, 39, wrong && i === 1 ? C.fail : C.ink, { max: 585 });
  });
  if (b === 3) note(c, 'When the policy is silent, the reviewed answer should say so.');
  else if (dup || wrong)
    note(
      c,
      dup
        ? 'Two results now have the same lookup key.'
        : 'A policy-following answer would lose this point.',
      100,
      900,
      C.fail,
    );
}
export function checker(c, k) {
  base(c, 'Circulation  /  Due slip', 'When are my books due?');
  const b = k.beat.beatIndex;
  // The deadline stays bound to the book while the three independent replies arrive.
  fill(c, 96, 321, 393, 539, '#233d43');
  fill(c, 103, 319, 381, 531, '#b6b0a1');
  fill(c, 96, 309, 382, 528, '#815446');
  fill(c, 105, 309, 17, 528, '#563b36');
  sheet(c, 139, 343, 312, 373);
  label(c, 'DATE DUE', 166, 395);
  for (let j = 0; j < 4; j++) line(c, 159, 439 + j * 60, 428, 439 + j * 60, C.line, 2);
  serif(c, 'Friday', 171, 477, 69, C.plum);
  path(
    c,
    [
      [135, 599],
      [172, 582],
      [291, 612],
      [415, 580],
      [456, 600],
      [456, 801],
      [135, 801],
    ],
    '#d5b186',
    '#aa8a69',
    3,
  );
  letter(c, 'Library copy', 295, 672, 39, C.ink, { align: 'center' });
  letter(c, 'Due on Friday', 295, 737, 34, C.ink, { align: 'center' });
  mono(c, 'Terms: books + friday', 110, 897, 31, C.fine);
  const cols = [571, 1345, 1620];
  ['Answer', 'Checker', 'Librarian'].forEach((t, i) => label(c, t, cols[i], 331));
  const show = [true, b >= 1, b >= 3];
  const checked = [
    cue(k, 0, 'Both pieces are there'),
    cue(k, 2, 'It passes'),
    cue(k, 4, 'It fails'),
  ];
  const reviewed = [
    cue(k, 0, 'A reviewer also accepts'),
    cue(k, 2, 'The reviewer rejects'),
    cue(k, 3, 'The reviewer accepts'),
  ];
  audits.forEach((a, i) => {
    if (!show[i]) return;
    const y = 380 + i * 130;
    sheet(c, 540, y, 1285, 108);
    serif(c, a.answer, 570, y + 56, 43, C.ink, { max: 710 });
    if (checked[i] > 0) {
      medallion(c, 1400, y + 54, a.checker, 29);
    }
    if (reviewed[i] > 0) {
      medallion(c, 1702, y + 54, a.reviewed, 29);
    }
  });
  if (cue(k, 4, 'Both columns') > 0) {
    label(c, 'Passes', 571, 830);
    mono(c, audits.filter((q) => q.checker).length + ' / 3', 1340, 830, 44);
    mono(c, audits.filter((q) => q.reviewed).length + ' / 3', 1632, 830, 44);
  }
}
export function trace(c, k) {
  const b = k.beat.beatIndex;
  base(c, 'Policy collection  /  Request trace', 'Where did the approval condition disappear?');
  if (b === 3) {
    const rows = [
      ['Get commander approval', 'P1', true, true],
      ['Get commander approval', 'P3', false, false],
      ['Approval is optional', 'P1', true, false],
    ];
    ['Answer', 'Page', 'Page ID matches', 'Claim follows'].forEach((s, i) =>
      label(c, s, [100, 810, 1140, 1510][i], 320),
    );
    rows.forEach(([t, p, id, ent], i) => {
      const y = 428 + i * 165;
      sheet(c, 90, y - 55, 1735, 118);
      letter(c, t, 110, y, 43);
      mono(c, p, 812, y, 42);
      medallion(c, 1280, y, id);
      medallion(c, 1630, y, ent);
    });
    return;
  }
  const lacked = b === 0;
  const source = 'Commander approval';
  const rows = [
    ['Policy P1', source, true],
    ['Final input', lacked ? 'General checklist' : source, !lacked],
    ['Model answer', lacked ? 'Update the changelog' : 'Ask on-call engineer', false],
  ];
  rows.forEach(([s, t, right], i) => {
    const x = 105 + i * 612;
    label(c, s, x, 350);
    sheet(c, x, 421, 486, 245, i === 2 && lacked ? C.paper : right ? C.pale : C.rose);
    serif(c, t, x + 22, 534, 48, C.ink, { max: 445 });
    if (i < 2) arrow(c, x + 497, 542, x + 591, 542);
  });
  note(
    c,
    lacked
      ? 'Inspect retrieval, permissions and final context assembly.'
      : b === 4
        ? 'Retain the input, answer and source version. Replay the complete request.'
        : 'The approval condition reached the model. Inspect generation.',
  );
}
export function metrics(c, k) {
  const b = k.beat.beatIndex;
  base(
    c,
    'Policy collection  /  Retrieval measures',
    b < 2
      ? 'How early did relevant chunks arrive?'
      : b < 4
        ? 'Which denominator belongs to each score?'
        : 'How close are the two questions?',
  );
  if (b < 2) {
    const n = cue(k, 0, 'at the third') > 0 ? 3 : 1;
    ranks.forEach((v, i) => {
      const x = 120 + i * 569;
      sheet(c, x, 385, 518, 262, v ? C.pale : C.paper);
      label(c, 'Rank ' + (i + 1), x + 33, 434);
      serif(c, v ? 'Relevant' : 'Unrelated', x + 33, 532, 57);
      if (v && i < n) mono(c, i === 0 ? '1 / 1' : '2 / 3', x + 35, 602, 34, C.cold);
    });
    if (cue(k, 0, 'Averaging those precisions') > 0)
      mono(c, '(1 + 2/3) / 2  =  5/6  ≈  ' + rankedPrecision(ranks).toFixed(3), 124, 790, 48);
    return;
  }
  if (b >= 4) {
    sheet(c, 102, 327, 766, 184, C.paper);
    label(c, 'Original question', 131, 370);
    serif(c, 'Who approves a frozen release?', 130, 447, 46, C.ink, { max: 708 });
    sheet(c, 956, 327, 842, 184, C.pale);
    label(c, 'Question generated from the answer', 985, 370);
    serif(c, 'Is the release in scope for the freeze?', 985, 447, 44, C.ink, { max: 779 });
    label(c, 'Compare question embeddings', 110, 557);
    for (let j = 0; j < 2; j++) {
      const angle = j === 0 ? -0.5 : -0.72;
      arrow(
        c,
        187,
        808,
        187 + 336 * Math.cos(angle),
        808 + 336 * Math.sin(angle),
        j === 0 ? C.cold : C.plum,
      );
    }
    serif(c, 'Similar topic', 653, 685, 57);
    letter(c, 'The answer still omits who approves the change.', 657, 771, 40);
    if (b === 5)
      note(
        c,
        'Use human labels to check whether a model-based score tracks the intended distinction.',
      );
    return;
  }
  const n = covered.filter(Boolean).length;
  ['Required fact', 'In final context', 'In answer'].forEach((t, i) =>
    label(c, t, [115, 887, 1390][i], 321),
  );
  facts.forEach((f, i) => {
    const y = 418 + i * 113;
    line(c, 107, y + 54, 1803, y + 54);
    letter(c, f, 116, y, 43);
    [1000, 1500].forEach((x) => {
      if (covered[i]) medallion(c, x, y, true, 25);
      else mono(c, 'absent', x, y, 35, C.fine, { align: 'center' });
    });
  });
  mono(c, 'Recall    ' + n + ' / ' + facts.length, 117, 799, 46);
  mono(c, 'Faithfulness    ' + n + ' / ' + n, 891, 799, 46);
}
export function slices(c, k) {
  const b = k.beat.beatIndex;
  const after = (beat, phrase) => b > beat || (b === beat && k.elapsed >= k.wordCue(phrase).end);
  const gains = renewalGains.length;
  const scan = b === 1
    ? k.reveal('a pass under B', 1.2, { captionStart: false })
    : Number(b > 1);
  const opened = Math.ceil(scan * gains);
  base(
    c,
    'Circulation  /  Paired cases',
    b === 3 ? 'Who clears the renewal requirement?' : 'How did both assistants tie?',
  );
  if (after(0, 'both passed ninety questions'))
    mono(c, 'Overall    A ' + total(CASES, 'A') + '/100    B ' + total(CASES, 'B') + '/100',
      1818, 282, 34, C.cold, { align: 'right' });
  renewals.forEach((q, i) => {
    const x = 493 + i * 133;
    const gain = renewalGains.indexOf(q);
    const shared = q.A
      ? after(0, 'both assistants pass')
      : after(0, 'On one hundred both miss');
    const visible = gain >= 0 ? gain < opened : shared;
    const inspectMiss = q.id === 'Q100' && after(3, 'Keep question one hundred in the report');
    if ((gain >= 0 && visible) || inspectMiss)
      fill(c, x - 54, 360, 108, 209, inspectMiss ? C.rose : C.pale);
    mono(c, q.id, x, 339, 33, C.fine, { align: 'center' });
    names.forEach((m, j) => {
      const y = 410 + j * 109;
      if (visible) medallion(c, x, y, q[m], 32);
      else dot(c, x, y, 8, C.line);
    });
  });
  names.forEach((m, j) => {
    letter(c, 'Assistant ' + m, 108, 410 + j * 109, 42);
  });
  if (b === 0) return;
  if (b === 3) {
    label(c, 'Renewal passes', 109, 636);
    const x = 490;
    const step = 95;
    const floorX = x + renewalFloor * step;
    names.forEach((m, j) => {
      const y = 710 + j * 106;
      const passes = total(renewals, m);
      const spoken = after(3, j ? 'B has nine' : 'A has two');
      letter(c, 'Assistant ' + m, 110, y, 42);
      for (let i = 0; i < renewals.length; i++)
        fill(c, x + i * step + 4, y - 20, step - 8, 40, spoken && i < passes ? C.cold : C.steel);
      if (spoken) mono(c, passes + ' / ' + renewals.length, 1510, y, 39);
      if (after(3, 'Only B clears this check'))
        medallion(c, 1771, y, passes >= renewalFloor, 28);
    });
    if (after(3, 'eight passes in these ten cases')) {
      line(c, floorX, 669, floorX, 852, C.gold, 7);
      mono(c, 'Floor ' + renewalFloor + ' / ' + renewals.length, floorX, 637, 31, C.cold,
        { align: 'center' });
    }
    return;
  }

  // Both rows use the same pass scale. The ordinary losses start at the renewal gain.
  const zeroX = 504;
  const step = 142;
  const peakX = zeroX + step * gains;
  const loss = b === 2 ? k.reveal('Seven fewer', 0.9) : 0;
  label(c, 'Change in passes (B − A)', 110, 623);
  mono(c, '0', zeroX, 624, 31, C.fine, { align: 'center' });
  line(c, zeroX, 649, zeroX, 858, C.fine, 3);
  letter(c, 'Renewals', 110, 701, 42);
  for (let i = 0; i < opened; i++)
    fill(c, zeroX + step * i + 4, 674, step - 8, 53, C.pass);
  if (b === 1) k.reveal('Seven gains on renewals', 0);
  if (after(1, 'Seven gains on renewals')) mono(c, '+' + gains, 1620, 701, 48, C.pass);
  if (b < 2) return;
  letter(c, 'Ordinary', 110, 811, 42);
  if (after(2, 'A passed eighty-eight there'))
    mono(c, 'A ' + total(ordinary, 'A'), 112, 862, 32);
  if (after(2, 'B passed eighty-one')) mono(c, 'B ' + total(ordinary, 'B'), 263, 862, 32);
  line(c, peakX, 726, peakX, 812, C.fine, 3);
  const lossesShown = Math.ceil(loss * ordinaryLoss);
  for (let i = 0; i < lossesShown; i++)
    fill(c, peakX - step * (i + 1) + 4, 785, step - 8, 53, C.fail);
  if (lossesShown)
    arrow(c, peakX - 14, 757, peakX - step * lossesShown + 8, 757, C.fail);
  if (loss === 1 && after(2, 'Seven fewer')) mono(c, '−' + ordinaryLoss, 1620, 811, 48, C.fail);
  k.reveal('and the net change is zero', 0);
  if (after(2, 'the net change is zero')) {
    dot(c, peakX - ordinaryLoss * step, 812, 13, C.ink);
    mono(c, 'Net ' + (gains - ordinaryLoss), 547, 898, 39, C.ink);
  }
}
export function summary(c, k) {
  const b = k.beat.beatIndex;
  base(c, 'Circulation  /  Signed report', 'What belongs beside 90 percent?');
  if (b >= 2 || cue(k, 1, 'Open the one miss') > 0) {
    label(c, 'Q100   /   Illustrated renewal record', 111, 321);
    const rows = [
      ['Request', 'May I renew a book another reader reserved?'],
      ['Loan rule', 'The waiting reader has priority.'],
      ['B returned', 'You can keep it for another loan period.'],
    ];
    rows.forEach(([t, v], i) => {
      const y = 388 + 125 * i;
      sheet(c, 106, y, 1700, 105, i === 2 ? C.rose : C.paper);
      label(c, t, 130, y + 53);
      serif(c, v, 599, y + 52, 44, C.ink, { max: 1174 });
    });
    mono(c, 'Renewals   9 / 10    •    Required   8 / 10', 116, 833, 43);
    if (b >= 2)
      note(c, 'Retain the final input, actual answer, frozen scorer and attempt costs.', 110, 922);
    return;
  }
  sheet(c, 102, 307, 1712, 552);
  label(c, 'Assistant B   /   Circulation sample', 147, 375);
  serif(c, '90 of 100 overall', 147, 479, 71);
  if (b >= 1) {
    renewals.forEach((q, i) => {
      const x = 215 + i * 156;
      mono(c, q.id, x, 600, 31, C.fine, { align: 'center' });
      medallion(c, x, 678, q.B, 33);
    });
    mono(c, 'Renewals   9 / 10      Required   8 / 10', 151, 795, 43);
  }
  if (b >= 2) note(c, 'Retain Q100 with its input, actual answer, scorer and attempt cost.');
}
