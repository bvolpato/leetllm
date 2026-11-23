import assert from 'node:assert/strict';
import { preferenceProbability } from '../../../films/benchmark-audits/arithmetic.mjs';
import {
  C,
  base,
  line,
  fill,
  path,
  dot,
  sheet,
  letter,
  mono,
  serif,
  label,
  medallion,
  arrow,
  mix,
  cue,
  note,
  reading,
  ticks,
} from './art.mjs';

const oldLoan = (item) => (item === 'textbook' ? 28 : 21);
const newLoan = (item) => (item === 'new release' ? 7 : 21);
const loans = [
  ['new release', 7],
  ['ordinary book', 21],
  ['textbook', 28],
];
const pointsPerBallot = 1;
const splitCredit = pointsPerBallot / 2;
const ballots = [
  ['A wins', pointsPerBallot, 'The tie adds'],
  ['A wins', pointsPerBallot, 'The tie adds'],
  ['Tie', splitCredit, 'The vote against both answers'],
  ['Both bad', splitCredit, 'A won two'],
];
const audited = { total: 500, sub: 138, issues: 82 };
const sumCredit = ballots.reduce((s, [, v]) => s + v, 0);
const availableCredit = ballots.length * pointsPerBallot;
const mathWork = { coefficient: 3, rhs: 12, finalAnswer: 4 };
const { coefficient, rhs, finalAnswer } = mathWork;
const intermediate = rhs - coefficient;
const satisfiesEquation = (x) => coefficient * x === rhs;
export function checkSuites() {
  assert.equal(intermediate, 9);
  assert.equal(satisfiesEquation(intermediate), false);
  assert.equal(satisfiesEquation(finalAnswer), true);
  assert.deepEqual(
    loans.map(([id, n]) => [oldLoan(id) === n, newLoan(id) === n]),
    [
      [false, true],
      [true, true],
      [true, false],
    ],
  );
  assert.equal(((audited.issues / audited.sub) * 100).toFixed(1), '59.4');
  assert.equal(preferenceProbability(0), 0.5);
  assert.ok(Math.abs(preferenceProbability(400) - 10 / 11) < 1e-10);
  assert.deepEqual(ballots.map(([, points]) => points), [1, 1, 0.5, 0.5]);
  assert.equal(sumCredit / availableCredit, 0.75);
}
export function knowledge(c, k) {
  const b = k.beat.beatIndex;
  base(
    c,
    'Public benchmarks  /  Answer form',
    b < 3 ? 'What does a correct choice measure?' : 'Which question set supplied the score?',
  );
  if (b === 1) {
    const paired = cue(k, 1, 'Rerun both models') > 0;
    ['Model', 'Pinned items', 'Scoring protocol', 'Score'].forEach((v, i) =>
      label(c, v, [120, 438, 850, 1540][i], 338),
    );
    [
      ['A', 'Choice probabilities', '81%'],
      ['B', 'Generated letters', '85%'],
    ].forEach(([m, parser, v], i) => {
      const y = 418 + i * 173;
      sheet(c, 101, y, 1718, 127);
      mono(c, m, 123, y + 64, 50);
      letter(c, 'Same questions', 438, y + 64, 39);
      letter(c, paired ? 'Choice probabilities' : parser, 850, y + 64, 39);
      mono(c, paired ? 'Rerun' : v, 1540, y + 64, 42, paired ? C.cold : C.ink);
    });
    note(
      c,
      paired
        ? 'Run both models under the pinned protocol. Record the new scores.'
        : 'Two changes could explain the four-point difference.',
    );
    return;
  }
  if (b < 3) {
    const count = b < 2 ? 4 : 10;
    label(
      c,
      b < 2 ? 'MMLU   /   57 subjects' : 'MMLU-Pro   /   example with ten choices',
      115,
      331,
    );
    const start = 134,
      spacing = 151;
    for (let i = 0; i < count; i++) {
      const x = start + i * spacing;
      sheet(c, x, 414, 132, 158, i === 2 ? C.pale : C.paper);
      serif(c, String.fromCharCode(65 + i), x + 66, 485, 65, C.ink, { align: 'center' });
      if (i === 2) line(c, x + 29, 542, x + 104, 542, C.pass, 5);
    }
    mono(
      c,
      '1 correct / ' + count + ' choices  =  ' + 100 / count + '% expected under uniform guessing',
      122,
      684,
      44,
    );
    if (b > 0)
      note(
        c,
        b === 1
          ? 'Choice-token probabilities and parsed answer letters use different scoring paths.'
          : 'Record the reasoning prompt and which output the scorer reads.',
      );
    return;
  }
  const sets = [
    ['Extended', 546],
    ['Main', 448],
    ['Diamond', 198],
  ];
  sets.forEach(([t, n], i) => {
    const y = 355 + i * 147;
    label(c, t, 110, y);
    fill(c, 440, y - 22, n * 1.96, 65, [C.cold, C.pass, C.plum][i]);
    mono(c, n, 467 + n * 1.96, y + 11, 45);
  });
  note(
    c,
    b === 3
      ? 'GPQA filters its expert questions using validator results.'
      : '34% on Extended was the non-expert result in the original study. HELM can run custom policy cases.',
  );
}
export function mathSuite(c, k) {
  const b = k.beat.beatIndex;
  const titles = [
    'Where does the number come from?',
    'Which part of a solution earned credit?',
    'Which edition did they run?',
    'What happened between versions?',
    'What does the blue square do?',
    'Which split did the system see?',
  ];
  base(c, 'Public benchmarks  /  Math and reasoning', titles[b]);
  if (b === 0) {
    sheet(c, 101, 334, 855, 478);
    label(c, 'GSM8K   /   reference solution', 140, 398);
    serif(c, 'There are six shelves.', 142, 506, 48);
    serif(c, 'Four books fit on each.', 142, 586, 48);
    mono(c, '#### 24', 143, 702, 54, C.cold);
    arrow(c, 990, 580, 1115, 580);
    reading(c, 1165, 412, 'Parser output', ['Extract 24', 'Compare with key'], 610);
    note(c, 'About 8,500 problems. The harness defines which model-output formats it accepts.');
  } else if (b === 1) {
    const gradeFinal = cue(k, 1, 'The final answer passes', 0);
    const gradeStep = cue(k, 1, 'The derivation fails', 0);
    sheet(c, 101, 334, 855, 478);
    label(c, 'MATH   /   Candidate submission', 140, 398);
    mono(c, coefficient + 'x = ' + rhs, 142, 496, 52);
    mono(c, 'x = ' + rhs + ' − ' + coefficient, 142, 594, 52, gradeStep ? C.fail : C.ink);
    line(c, 142, 654, 899, 654);
    mono(c, 'Final answer: ' + finalAnswer, 143, 724, 50, C.cold);
    arrow(c, 986, 575, 1098, 575);
    label(c, 'Two scoring contracts', 1140, 398);
    letter(c, 'Check the final answer', 1140, 477, 43);
    letter(c, 'Check the derivation', 1140, 659, 43);
    if (gradeFinal) {
      medallion(c, 1750, 477, satisfiesEquation(finalAnswer));
      mono(c, coefficient + ' × ' + finalAnswer + ' = ' + rhs, 1140, 551, 41, C.pass);
    }
    if (gradeStep) {
      medallion(c, 1750, 659, satisfiesEquation(intermediate));
      mono(c, coefficient + ' × ' + intermediate + ' = ' + coefficient * intermediate + ' ≠ ' + rhs, 1140, 736, 41, C.fail);
    }
    note(c, '12,500 competition problems. Record tool access and which scoring contract ran.');
  } else if (b < 4) {
    const cards =
      b === 2
        ? [
            ['April 2025', 'HLE public set', '2,500 questions'],
            ['October 2025', 'HLE Rolling', 'New edition'],
            ['September 2026', 'HLE Diamond', 'Named subset'],
          ]
        : [
            ['Earlier version', 'FrontierMath', 'Tiers 1–4'],
            ['June 12, 2026', 'Version 2', 'Errors addressed'],
            ['Matched rerun', 'Both models', 'On version 2'],
          ];
    line(c, 190, 533, 1690, 533, C.cold, 6);
    cards.forEach(([date, t, detail], i) => {
      const x = 110 + i * 580;
      dot(c, x + 65, 533, 17, C.gold);
      label(c, date, x, 431);
      serif(c, t, x, 645, 49);
      letter(c, detail, x, 715, 37, C.fine);
    });
    note(
      c,
      b === 2
        ? 'Keep the private holdout separate from the published set.'
        : 'The release notes report corrections affecting 42% of problems.',
    );
  } else {
    const stages = [
      ['Example input', 1, 1],
      ['Example output', 1, 1],
      ['New input', 0, 2],
      ['Prediction', 0, 2],
    ];
    const reveal = cue(k, 4, 'extends to the right', 1);
    stages.forEach(([t, r, col], j) => {
      const x = 112 + j * 438;
      label(c, t, x, 357);
      for (let a = 0; a < 3; a++)
        for (let z = 0; z < 4; z++) {
          const on =
            a === r &&
            (z === col ||
              (j === 1 && z > col) ||
              (j === 3 && reveal > 0 && z <= col + Math.ceil(reveal * (3 - col)) && z >= col));
          fill(
            c,
            x + z * 76,
            442 + a * 76,
            72,
            72,
            j === 3 && !reveal ? C.shade : on ? '#3777aa' : C.paper,
          );
        }
    });
    note(
      c,
      b === 4
        ? 'Infer the transformation, then apply it to the new input.'
        : 'ARC-AGI-2   /   Public, semi-private and private splits have different exposure histories.',
    );
  }
}
export function harness(c, k) {
  const b = k.beat.beatIndex;
  base(
    c,
    'Public benchmarks  /  Patch harness',
    b < 2 ? 'What does the harness execute?' : 'Which loans did the patch repair?',
  );
  if (b < 2) {
    reading(c, 116, 350, 'HumanEval', [
      '164 Python problems',
      'Submit a function',
      'Execute its tests',
    ]);
    reading(
      c,
      979,
      350,
      'SWE-bench',
      ['2,294 issues in 12 repositories', 'Apply a patch', 'Execute selected repository tests'],
      818,
    );
    line(c, 931, 324, 931, 757);
    note(c, 'A result inherits the scope of the executed tests.');
    return;
  }
  const patched = cue(k, 4, 'Apply this patch') > 0;
  ['Loan class', 'Expected', 'Function returns', 'Executed by harness'].forEach((t, i) =>
    label(c, t, [115, 615, 1000, 1450][i], 334),
  );
  loans.forEach(([id, want], i) => {
    const y = 435 + i * 144;
    const omitted = i === 2;
    sheet(c, 95, y - 51, 1726, 111, omitted ? C.shade : C.paper);
    serif(c, id, 115, y + 4, 43);
    mono(c, want + ' days', 615, y + 4, 37);
    const shown = !omitted || b >= 6;
    const got = (patched ? newLoan : oldLoan)(id);
    if (shown) {
      mono(c, got + ' days', 1000, y + 4, 37);
      medallion(c, 1266, y + 4, got === want, 22);
    } else mono(c, '?', 1000, y + 4, 43);
    letter(c, omitted ? 'Omitted' : 'Selected', 1460, y + 4, 38, omitted ? C.fine : C.cold);
  });
  if (patched && b < 7) {
    fill(c, 98, 837, 1720, 84, C.cold);
    mono(c, 'Patched function    return 7 if item == "new release" else 21', 125, 880, 36, C.paper);
  } else
    note(
      c,
      b === 7
        ? 'Count model and tool calls, timeouts, elapsed time and cost across all attempts.'
        : 'The repair must fix new releases and preserve the ordinary loan.',
    );
}
export function benchmarkAudit(c, k) {
  const b = k.beat.beatIndex,
    isPro = b === 2;
  base(
    c,
    'Public benchmarks  /  Verifier audit',
    isPro ? 'What did the second audit examine?' : 'Which tasks did the audit actually cover?',
  );
  if (isPro) {
    sheet(c, 105, 334, 1720, 443);
    label(c, 'July 2026   /   SWE-bench Pro audit', 150, 399);
    serif(c, '731 public tasks', 149, 504, 69);
    fill(c, 151, 611, 1500, 70, C.steel);
    fill(c, 151, 611, 450, 70, C.fail);
    mono(c, 'About 30% estimated broken', 151, 729, 39);
    note(c, 'OpenAI retracted its earlier recommendation of Pro.', 100, 843);
    return;
  }

  const after = (phrase) => {
    if (b > 0) return true;
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart: false }) === 1;
  };
  const selected = after('one hundred thirty-eight');
  const enlarged = cue(k, 0, 'Enlarge that selected band', 0.9);
  const percentPhrase = 'fifty-nine point four percent';
  const percentProgress = b === 0
    ? k.reveal(percentPhrase, k.wordCue(percentPhrase).end - k.wordCue(percentPhrase).start, {
        captionStart: false,
      })
    : 1;
  const reportedCount = after('eighty-two of the audited tasks');
  const outsideVerdict = after('no verdict from that audit');
  const x = 115;
  const w = 1640;
  const split = (w * audited.sub) / audited.total;
  const issuesWidth = (w * audited.issues) / audited.sub;

  label(c, 'SWE-bench Verified   /   ' + audited.total + ' human-reviewed tasks', x, 317);
  fill(c, x, 362, w, 100, C.shade);
  if (selected) {
    fill(c, x, 362, split, 100, C.cold);
    mono(c, audited.sub + ' selected', x + 22, 413, 40, C.paper);
  }
  if (outsideVerdict)
    mono(c, audited.total - audited.sub + ' outside this audit', x + split + 38, 413, 38);

  if (enlarged > 0) {
    const expanded = mix(split, w, enlarged);
    const lowerY = mix(462, 602, enlarged);
    path(
      c,
      [[x, 462], [x, lowerY], [x + expanded, lowerY], [x + split, 462]],
      C.steel,
    );
    fill(c, x, lowerY, expanded, 105, C.pale);
    if (enlarged === 1)
      label(c, 'Audit denominator   /   ' + audited.sub + ' selected tasks', x + 22, lowerY - 30);
    if (percentProgress > 0)
      fill(c, x, lowerY, issuesWidth * percentProgress, 105, C.fail);
    if (percentProgress === 1) {
      const rate = ((audited.issues / audited.sub) * 100).toFixed(1);
      const result = reportedCount
        ? audited.issues + ' / ' + audited.sub + '  ≈  ' + rate + '%'
        : rate + '%';
      mono(c, result, x + 23, lowerY + 53, 49, C.paper);
    }
    if (reportedCount) {
      mono(c, audited.sub - audited.issues + ' other audited tasks', x + issuesWidth + 34, lowerY + 53, 36);
      label(c, 'Material issues identified within the selected ' + audited.sub, x, lowerY + 153);
    }
  }
  note(
    c,
    b === 0
      ? 'February 2026   /   Selected because o3 solved them inconsistently or missed them.'
      : b === 1
        ? 'Reproduction of some published fixes raised an exposure concern.'
        : 'Inspect the verifier, then repeat on reviewed private cases.',
    100,
    843,
  );
}
export function preference(c, k) {
  const b = k.beat.beatIndex;
  base(
    c,
    'Arena  /  Anonymous comparisons',
    b < 3 ? 'What does the rating difference predict?'
      : cue(k, 3, 'What share of the four points', 0) ? 'What share of the four points did A earn?'
      : 'How Arena scores a ballot',
  );
  if (b < 3) {
    const x0 = 167,
      w = 1020,
      y0 = 790,
      h = 413;
    const X = (d) => x0 + ((d + 500) * w) / 1000,
      Y = (p) => y0 - h * p;
    ticks(c, x0, x0 + w, y0, -500, 500, 250, (v) => v);
    for (const v of [0, 0.5, 1]) {
      line(c, x0, Y(v), x0 + w, Y(v), C.line, 2);
      mono(c, v.toFixed(1), x0 - 20, Y(v), 26, C.fine, { align: 'right' });
    }
    const curve = [];
    for (let d = -500; d <= 500; d += 10) curve.push([X(d), Y(preferenceProbability(d))]);
    path(c, curve, null, C.pass, 9);
    const delta = 400 * cue(k, 2, 'Move A four hundred points ahead', 1.3),
      p = preferenceProbability(delta);
    dot(c, X(delta), Y(p), 19, C.gold);
    dot(c, X(delta), Y(p), 8, C.ink);
    label(c, 'A rating minus B rating', 459, 892);
    label(c, 'Fitted preference score', 1284, 418);
    serif(c, (p * 100).toFixed(1) + '%', 1279, 536, 84);
    mono(c, 'Δ = ' + Math.round(delta), 1285, 642, 45);
    if (b > 0) mono(c, '1 / (1 + 10^(−Δ/400))', 1250, 731, 30);
    return;
  }
  letter(c, 'Outright win  ·  ' + pointsPerBallot + ' point to the winner', 119, 301, 39, C.cold);
  letter(c, 'Tie or both bad  ·  ' + splitCredit + ' to each model', 979, 301, 39, C.cold);
  ballots.forEach(([t, v, answerCue], i) => {
    const x = 119 + i * 430;
    sheet(c, x, 369, 385, 331);
    label(c, 'Vote ' + (i + 1), x + 30, 422);
    serif(c, t, x + 30, 514, 54);
    if (cue(k, 4, answerCue, 0)) mono(c, '+' + v, x + 30, 625, 55, C.pass);
  });
  if (cue(k, 5, 'The ratings fit', 0))
    mono(c, sumCredit + ' / ' + availableCredit + '   =   ' + (100 * sumCredit / availableCredit) + '% of vote credit', 120, 811, 53);
  if (b === 6) note(c, 'Check the claims against their sources. Keep uncertainty with the rating.');
}
