import { lerp } from './art.mjs';
import {
  source,
  ballots,
  firstPicks,
  grades,
  labelGrades,
  policyCases,
  evidenceAgreement,
  templateReport,
} from './examples.mjs';

export function overlap(a) {
  const { c, beat: b, cue } = a;
  if (b === 1) {
    a.title(
      'Evaluation  /  choose the question',
      'What skill did the test actually sample?',
    );
    const exhibits = [
      ['MMLU', '57 academic subjects', 'Breadth of knowledge'],
      ['GSM8K', 'Multistep arithmetic', 'Grade-school word problems'],
      [
        'Private P-7 cases',
        '42 days ≥ 30 days?',
        'Policy and execution records',
      ],
    ];
    exhibits.forEach(([n, v, scope], i) => {
      const y = 258 + i * 141;
      a.text(n, 70, y, 32, i === 2 ? c.green : c.cyan, { face: 'Serif' });
      a.text(v, 410, y, 32, c.ink);
      a.text(scope, 411, y + 42, 21, c.muted);
      a.line(70, y + 70, 1180, y + 70, c.line);
    });
    return;
  }
  a.title('Benchmark overlap audit', 'What did the search cover?');
  const x = 87,
    y = 263,
    cols = 14,
    rows = 7,
    dx = 46,
    dy = 35;
  const scanned = cue(2, 'fifty thousand', 2.4);
  a.text('Training corpus   /   accessible sample in blue', x, 224, 24, c.cyan);
  for (let i = 0; i < cols * rows; i++) {
    const px = x + (i % cols) * dx,
      py = y + Math.floor(i / cols) * dy;
    a.box(
      px,
      py,
      29,
      20,
      i < Math.round(80 * scanned) ? c.cyan : c.bed,
      c.line,
      2,
    );
    a.line(
      px + 4,
      py + 7,
      px + 22,
      py + 7,
      i < Math.round(80 * scanned) ? c.bg : c.line,
      1,
    );
  }
  a.text('Schematic sample and unsearched documents', x, 560, 20, c.muted);
  const zero = cue(2, 'Zero matches');
  a.mono('Exact question text', 809, 273, 24, c.muted);
  a.text('50,000 docs', 806, 340, 52, c.ink, { face: 'Serif' });
  a.fade(zero, () =>
    a.text('0 matches', 809, 429, 51, c.green, { face: 'Serif' }),
  );
  if (b === 2)
    a.fade(cue(2, 'different wording'), () =>
      a.text('Paraphrases still untested.', 809, 509, 26, c.gold),
    );
  if (b === 3) {
    a.text('Paired retest', 809, 493, 22, c.muted);
    a.text('New numbers, same skill', 809, 538, 27, c.gold);
    a.text('Pin the fresh case and training cutoff.', 85, 631, 28, c.ink, {
      face: 'Serif',
    });
  }
}

export function judge(a) {
  const { c, beat: b, cue } = a;
  if (b >= 4) {
    a.title(
      'Judge calibration  /  keep the pair blinded',
      b === 4
        ? 'Change one property at a time.'
        : 'Calibrate against a human judgment.',
    );
    const ys = [275, 408];
    const wide = b === 4 ? cue(4, 'vary length') : 1;
    ys.forEach((y, i) => {
      a.mono(i ? 'B' : 'A', 83, y + 15, 36, c.muted);
      a.box(154, y - 40, 715, 80, c.bed, c.line, 5);
      const count = i ? 1 + Math.round(wide * 2) : 1;
      for (let j = 0; j < count; j++)
        a.line(
          178,
          y - 17 + j * 17,
          178 + (i && j === 2 ? 330 : 535),
          y - 17 + j * 17,
          c.cyan,
          5,
        );
      a.text('No job ran', 906, y + 9, 31, c.ink, { face: 'Serif' });
    });
    a.text(
      b === 4
        ? 'Hold content fixed while length changes.'
        : 'Compare blinded ratings with the job record.',
      83,
      564,
      36,
      c.ink,
      { face: 'Serif' },
    );
    a.text(
      b === 4
        ? 'For family effects, also control quality and style.'
        : 'Chatbot Arena collects human preferences.',
      84,
      619,
      24,
      c.muted,
    );
    return;
  }
  a.title(
    'Judge calibration  /  identical answer pair',
    'Swap the answers. Keep both ballots.',
  );
  const swap = cue(1, 'swap the positions', 1.25);
  a.text('First position', 105, 226, 23, c.muted);
  a.text('Second position', 689, 226, 23, c.muted);
  ['A', 'B'].forEach((name, i) => {
    const x = lerp(83 + i * 587, 83 + (1 - i) * 587, swap);
    const lift = (i ? -1 : 1) * Math.sin(swap * Math.PI) * 62;
    a.box(x, 269 + lift, 516, 125, c.bed, i ? c.violet : c.cyan, 8);
    a.mono(name, x + 25, 345 + lift, 38, i ? c.violet : c.cyan);
    a.text(
      i ? 'Rotation finished.' : 'Eligible. No job ran.',
      x + 92,
      343 + lift,
      32,
      c.ink,
      { face: 'Serif' },
    );
  });
  [cue(1, 'judge picks A'), cue(2, 'picks B')].forEach((t, i) =>
    a.fade(t, () => {
      const x = 84 + i * 586;
      a.text('Ballot ' + (i + 1), x, 481, 20, c.muted);
      a.mono(ballots[i].join('  '), x, 538, 34, c.ink);
      a.text('Chose ' + firstPicks[i], x + 192, 540, 32, c.green, {
        face: 'Serif',
      });
    }),
  );
  a.fade(cue(3, 'first position twice'), () =>
    a.text(
      'First position twice. Two different winners.',
      84,
      627,
      30,
      c.gold,
      { face: 'Serif' },
    ),
  );
}

function gradeRows(a, harness) {
  const { c, beat: b, cue } = a;
  const cols = harness ? [77, 336, 648, 978] : [77, 255, 491, 697, 948];
  const hdr = harness
    ? ['Key age', 'Expected label', 'Scorer grade', 'Agrees?']
    : ['Age', 'Verdict', 'Policy', 'Job claim', 'Grade'];
  hdr.forEach((s, j) => a.text(s, cols[j], 222, 21, c.muted));
  policyCases.forEach((r, i) => {
    const y = 282 + i * 58;
    const shown =
      harness ||
      b >= 3 ||
      (b === 2 && (i < 2 || (i === 2 && cue(2, 'Freeze the fifty-day key'))));
    if (!shown && !harness && b !== 1) return;
    const graded =
      harness ||
      b >= 4 ||
      (b === 3 &&
        (i < 2 ||
          cue(
            3,
            i === 2 ? 'costs it a pass' : i === 3 ? 'ten days old' : 'P-nine',
          ) > 0)) ||
      (b === 2 && i < 2);
    const expected = labelGrades[i] ? 'Pass' : 'Reject',
      grade = grades[i] ? 'Pass' : 'Reject';
    const row = harness
      ? [
          r.age + ' d',
          expected,
          grade,
          grades[i] === labelGrades[i] ? 'Yes' : 'No',
        ]
      : [
          r.age + ' d',
          r.decision === 'eligible' ? 'Eligible' : 'Ineligible',
          r.policy,
          r.action ? 'Started' : 'None',
          graded ? grade : '?',
        ];
    row.forEach((s, j) => {
      const col =
        harness && j === 3
          ? c.green
          : !harness && j === 4
            ? graded
              ? grades[i]
                ? c.green
                : c.red
              : c.muted
            : !harness && j === 3 && r.action
              ? c.red
              : c.ink;
      a.text(s, cols[j], y, 27, col, { face: j === 0 ? 'Mono' : 'Sans' });
    });
    a.line(76, y + 18, 1195, y + 18, c.line);
  });
}

export function grade(a) {
  const { c, beat: b, cue } = a;
  const focus =
    (b === 2 && cue(2, 'Freeze the fifty-day key') > 0) ||
    (b === 3 && !cue(3, 'next key'));
  if (focus) {
    const row = policyCases[2],
      expected = source.expectedPolicyAnswer(row);
    a.title(
      'Golden case ' + row.key + '  /  50 days · stale · P-7',
      'Compare the claim with the execution log.',
    );
    const actual = [
      row.decision,
      row.policy,
      row.action ? 'Job started' : 'No job',
    ];
    const wanted = [
      expected.decision,
      expected.policy,
      expected.action ? 'Job started' : 'No job',
    ];
    const xs = [85, 695];
    a.text('Saved answer', xs[0], 229, 25, c.muted);
    a.text('Policy and job record', xs[1], 229, 25, c.muted);
    [actual, wanted].forEach((values, k) =>
      values.forEach((value, i) => {
        const y = 304 + i * 91;
        a.line(xs[k], y + 23, xs[k] + 474, y + 23, c.line, 2);
        if (i === 2)
          a.box(xs[k], y - 45, 474, 66, k ? '#d0e5d4' : '#f3d2c9', null, 3);
        a.text(
          value,
          xs[k] + 12,
          y + 1,
          i === 2 ? 39 : 31,
          i === 2 ? (k ? c.green : c.red) : c.ink,
          { face: i === 2 ? 'Serif' : 'Sans' },
        );
      }),
    );
    if (b === 3)
      a.fade(cue(3, 'costs it a pass'), () =>
        a.text(
          'Reject   ·   the verdict is right, the action claim is false.',
          86,
          615,
          32,
          c.red,
          { face: 'Serif' },
        ),
      );
    else
      a.text('Would you pass this answer?', 86, 615, 33, c.gold, {
        face: 'Serif',
      });
    return;
  }
  a.title(
    'Golden cases  /  P-7 · stale keys · minimum 30 d',
    'Which saved answers pass?',
  );
  gradeRows(a, false);
  if (b === 1)
    a.text(
      'Execution records show zero jobs across all five cases.',
      75,
      608,
      29,
      c.ink,
      { face: 'Serif' },
    );
  if (b === 2)
    a.text('Execution log   ·   zero jobs', 75, 605, 32, c.muted, {
      face: 'Serif',
    });
  if (b >= 3)
    a.fade(cue(3, 'Two of the five'), () => {
      a.mono(
        source.fixtureReport().policyCasesPassed + ' / 5 pass',
        75,
        612,
        37,
        c.green,
      );
      a.text(
        cue(4, 'release stays blocked', 0)
          ? 'Release blocked · false claim and no latency measurement'
          : '1 false job claim',
        440,
        609,
        26,
        c.red,
      );
    });
}

function passMark(a, x, y, selected) {
  const { c } = a;
  a.box(x - 26, y - 26, 52, 52, selected ? c.gold : c.green, null, 9);
  a.path([[x - 13, y], [x - 4, y + 9], [x + 14, y - 11]], c.reverse, 6);
}

function candidateReport(a) {
  const { c, cue } = a;
  const report = source.releaseExample.report;
  const pictureOnly = { captionStart: false };
  const select = cue(3, 'one pass twice', 0, pictureOnly);
  const copy = cue(3, 'twice', 1.05, pictureOnly);
  const counted = cue(4, 'Twenty-one passes', 0, pictureOnly);
  const passes = report.policyCasesPassed + counted;
  const blocked = templateReport('4', passes).metrics.verdict === 'BLOCK';

  a.title('New candidate report', 'Can these measurements clear the gate?');
  a.text('Policy cases', 76, 208, 32, c.muted);
  a.text('Reported passes / cases', 675, 208, 32, c.muted);
  a.box(578, 257, 485, 128, c.bed, c.line, 8);

  const columns = 5;
  const selectedIndex = columns * 2 - 1;
  for (let i = 0; i < report.policyCasesTotal; i++) {
    const x = 104 + (i % columns) * 78;
    const y = 266 + Math.floor(i / columns) * 54;
    passMark(a, x, y, select && i === selectedIndex);
    if (copy > 0 && i === selectedIndex) {
      const copyX = lerp(x, 640, copy);
      a.line(x + 26, y, Math.max(x + 26, copyX), y, c.gold, 3);
      passMark(a, copyX, y, true);
    }
  }
  a.mono(copy > 0 && !counted ? '…' : passes, 782, 353, 82, blocked ? c.red : c.ink, 'right');
  a.mono('/ ' + report.policyCasesTotal, 810, 353, 68, c.ink);

  if (!select) {
    a.fade(cue(3, 'clear the metric gate', 0.35), () =>
      a.text('Metric gate passed', 675, 445, 43, c.green, { face: 'Serif' }),
    );
  }
  if (blocked && cue(4, 'blocks the release', 0, { captionStart: 'gate blocks' })) {
    a.text('Release blocked', 675, 438, 44, c.red, { face: 'Serif' });
    a.text('More passes than cases', 675, 474, 30, c.red);
  }

  a.line(76, 475, 1198, 475, c.line);
  a.text('False action claims', 76, 513, 31, c.muted);
  a.mono(report.actionClaims, 76, 563, 42, c.ink);
  a.text('p95 checked decision', 505, 513, 31, c.muted);
  a.mono(report.p95DecisionMs + ' ms', 505, 563, 42, c.ink);
  a.text('Budget', 945, 513, 31, c.muted);
  a.mono('≤ ' + report.budgetMs.toLocaleString('en-US') + ' ms', 945, 563, 32, c.cyan);
}

export function release(a) {
  const { c, beat: b, cue } = a;
  if (b <= 2) {
    a.title(
      'Harness audit  /  supplied answers',
      'What earned five out of five?',
    );
    gradeRows(a, true);
    a.fade(cue(2, 'matched all five labels'), () =>
      a.text(evidenceAgreement + ' / 5 agreements', 75, 616, 38, c.green, {
        face: 'Serif',
      }),
    );
    a.fade(cue(2, 'Only two'), () =>
      a.text(
        grades.filter(Boolean).length + ' / 5 passing answers',
        655,
        616,
        38,
        c.gold,
        { face: 'Serif' },
      ),
    );
    return;
  }
  if (b <= 4) {
    candidateReport(a);
    return;
  }
  const changed = cue(5, 'switch only the chat template', 0);
  const bundle = source.releaseExample.bundle,
    revision = changed ? '5' : bundle.template;
  const timed = source.releaseExample.report.p95DecisionMs + ' ms';
  const answered = cue(7, 'report is pinned', 0);
  a.title(
    'Release binding  /  p95 time to checked decision',
    answered
      ? 'Evaluate the proposed bundle again.'
      : 'Which exact bundle did the report test?',
  );
  const names = [
    'Weights',
    'Tokenizer',
    'Template',
    'Policy',
    'Runtime',
    'Cases',
  ];
  const values = Object.values(bundle);
  a.text('Evaluated', 68, 301, 24, c.muted);
  a.mono(timed, 68, 335, 26, c.cyan);
  a.text('To serve', 68, 448, 24, c.muted);
  values.forEach((v, i) => {
    const x = 235 + i * 164;
    a.text(names[i], x + 70, 229, 20, c.muted, { align: 'center' });
    a.tile(x, 268, 141, 78, v, c.bed, c.ink, 22);
    const mismatch = i === 2 && revision !== v;
    a.tile(
      x,
      399,
      141,
      78,
      i === 2 ? revision : v,
      mismatch ? c.gold : c.bed,
      mismatch ? c.reverse : c.ink,
      22,
    );
    a.line(
      x + 70,
      348,
      x + 70,
      396,
      mismatch ? c.red : c.line,
      mismatch ? 4 : 2,
    );
  });
  if (templateReport(revision).applies) {
    a.fade(cue(5, 'Every revision matches', 0.25), () =>
      a.text('All six revisions agree.', 76, 580, 38, c.green, { face: 'Serif' }),
    );
  } else if (answered) {
    a.text(
      timed + ' was measured with template ' + bundle.template + '.',
      76,
      580,
      38,
      c.gold,
      { face: 'Serif' },
    );
  }
  if (cue(7, 'compressed copy', 0))
    a.text(
      'Evaluate template 5. Compression also produces a new artifact to test.',
      76,
      632,
      24,
      c.muted,
    );
}
