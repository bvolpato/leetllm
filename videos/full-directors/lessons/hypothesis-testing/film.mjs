import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';
import { usefulLiftDecision } from '../../../films/hypothesis-testing/arithmetic.mjs';
import {
  taskRows,
  holdoutRows,
  developmentBootstrap,
  holdoutBootstrap,
  macroTaskScores,
  macroTaskInterval,
} from '../../../films/hypothesis-testing/fixtures.mjs';
import {
  P,
  bi,
  base,
  rect,
  line,
  dot,
  label,
  title,
  ticket,
  mark,
  note,
  cue,
  meter,
  interval,
  points,
  pct,
  total,
  smooth,
  lerp,
} from './art.mjs';
import { opening, pairs, identity, forty, checkPairs, tally } from './pairs.mjs';
import { nullModel, tailScene, drawingRules, power, search, checkInference } from './inference.mjs';
import { variance, bootstrap, intervalLimits, liftGauge, checkIntervals } from './intervals.mjs';
import { triples, targets, bias, macro, protocol, checkAttempts } from './attempts.mjs';
const minimum = 0.02;
const reports = [
  { name: 'A', budget: 1, score: 0.58 },
  { name: 'B', budget: 5, score: 0.64 },
];
const practice = [[0.01, 0.14], [0.02, 0.14], [-0.08, -0.01], developmentBootstrap.interval];
const decisions = {
  'positive-size-unestablished': 'Positive gain. Useful size unresolved.',
  regression: 'The range supports a regression.',
  inconclusive: 'The range crosses zero.',
  'clears-useful-lift': 'The range clears the minimum.',
};
function report(c, k) {
  const b = bi(k);
  if (b === 0) {
    const spread = cue(k, 0, 'Count the attempts', 1.2);
    reports.forEach((r, i) => {
      const y = 394 + i * 238;
      title(c, r.name, 157, y + 70, 79);
      title(c, pct(r.score, 0), 308, y + 68, 77, i ? P.teal : P.ink);
      for (let j = 0; j < r.budget; j++) {
        const x = 721 + lerp(j * 21, j * 201, smooth(spread));
        ticket(c, x, y, 179, 131, P.white);
        if (spread > 0.9 || j === r.budget - 1)
          label(
            c,
            spread > 0.9 ? 'try ' + (j + 1) : r.budget + ' ' + (r.budget === 1 ? 'try' : 'tries'),
            x + 88,
            y + 64,
            32,
            P.ink,
            'center',
          );
      }
    });
    note(c, 'Can these scores support a model lift?', spread === 1 ? '1 try vs. 5 tries' : '');
  } else if (b <= 3) {
    const mean = total(macroTaskScores) / macroTaskScores.length;
    const scopes = [
      [
        'Paired, one attempt',
        '40 shared tasks',
        points(tally(taskRows).lift) + ' points',
        developmentBootstrap.interval.map((pointsVal) => points(pointsVal)).join(' to ') +
          ' points',
      ],
      [
        'B only, five attempts',
        '4 separate pools',
        pct(mean),
        macroTaskInterval.map((v) => pct(v, 0)).join(' to '),
      ],
    ];
    for (const [i, [heading, unit, score, range]] of scopes.entries()) {
      if (i && b === 1) continue;
      const x = 151 + i * 852;
      ticket(c, x, 348, 768, 416, i ? P.white : P.sea);
      title(c, heading, x + 43, 423, 51);
      label(c, unit, x + 43, 508, 30);
      line(c, x + 38, 554, x + 730, 554, P.line, 2, [7, 6]);
      title(c, score, x + 40, 623, 69, P.teal);
      label(c, 'interval  ' + range, x + 43, 709, 29);
    }
    note(
      c,
      b === 3
        ? 'Attach the settings, cutoffs and resampling unit.'
        : 'Only the paired report estimates B minus A.',
    );
  } else if (b === 4) {
    const end = cue(k, 4, 'B has run out of time', 0.8),
      applied = cue(k, 4, 'Dropping this row', 0) > 0;
    label(c, 'NEW RETRY TASK   /   one attempt each', 163, 329, 28);
    ticket(c, 160, 397, 1590, 328);
    label(c, 'A', 244, 474, 36);
    mark(c, 326, 580, true, 49);
    title(c, 'Passed', 434, 581, 57);
    label(c, 'B', 845, 474, 36);
    mark(c, 929, 580, end && applied ? 0 : null, 49);
    title(c, end ? 'Timeout' : 'Running', 1027, 581, 57);
    if (applied) label(c, 'B−A = −1', 1490, 581, 41, P.rust, 'center');
    note(c, 'The declared policy keeps this task in the denominator.');
  } else {
    const ix =
      b === 5
        ? cue(k, 5, 'Move just the low end', 1.5) === 1
          ? 1
          : 0
        : cue(k, 6, 'If the range crosses zero', 0.5) > 0
          ? 3
          : cue(k, 6, 'entire range sits below zero', 0.5) > 0
            ? 2
            : 1;
    const range = practice[ix],
      at = meter(c);
    const verdictCues = [
      [5, 'Every value is positive', 3],
      [6, 'Our rule says strictly above two', 2.15],
      [6, 'entire range sits below zero', 3],
      [6, 'If the range crosses zero', 2.6],
    ];
    const decided = cue(k, ...verdictCues[ix]) === 1;
    label(c, 'Possible paired lift interval', 164, 313, 32);
    interval(c, at, 542, range, null, ix === 2 ? P.rust : P.teal);
    if (decided) note(c, decisions[usefulLiftDecision(range, minimum)], 'HOLD');
    else note(c, 'Compare the low end with the minimum.');
  }
}
function holdoutNote(c, left, right) {
  c.save();
  c.translate(0, -50);
  note(c, left, right);
  c.restore();
}
function holdout(c, k) {
  const b = bi(k),
    d = tally(holdoutRows);
  if (b === 0) {
    const q = cue(k, 0, 'four hundred fresh matched tasks', 2.0);
    const read = cue(k, 0, 'Fifty-two favor B', 1.2);
    label(c, 'HOLDOUT   /   one mark per fresh paired task', 152, 320, 30);
    const count = Math.max(1, Math.ceil(q * holdoutRows.length));
    holdoutRows.forEach((r, i) => {
      const x = 162 + (i % 40) * 39.8,
        y = 408 + Math.floor(i / 40) * 36.8;
      const clr =
        read && i < Math.ceil(400 * read)
          ? r.difference > 0
            ? P.teal
            : r.difference < 0
              ? P.rust
              : P.line
          : P.line;
      rect(c, x, y, 30, 25, i < count ? clr : P.faint, 3);
    });
    if (read === 1) {
      label(c, d.winB + ' B only', 173, 799, 33, P.teal);
      label(c, d.winA + ' A only', 634, 799, 33, P.rust);
      label(c, d.ties + ' tied', 1115, 799, 33);
    }
    holdoutNote(c, 'The chosen model is frozen before the holdout opens.', count + ' / 400 pairs');
  } else {
    const at = meter(c, { y: 713, threshold: null, axis: null });
    label(c, 'Same rule on two separate samples', 165, 314, 31);
    label(c, 'B − A   /   percentage points', 1744, 314, 27, P.slate, 'right');
    line(c, at(minimum), 407, at(minimum), 713, P.gold, 4, [10, 7]);
    label(c, 'minimum  +2', at(minimum), 371, 29, P.gold, 'center');
    label(c, 'Development', 167, 400, 30);
    interval(c, at, 467, developmentBootstrap.interval, tally(taskRows).lift, P.slate);
    label(c, 'Holdout', 167, 569, 30);
    const point = cue(k, 1, 'Resample whole pairs', 0) > 0,
      op = cue(k, 1, 'Look at the fresh interval', 1.2);
    if (point) dot(c, at(d.lift), 612, 16, P.teal);
    if (op > 0)
      interval(
        c,
        at,
        612,
        holdoutBootstrap.interval.map((v) => lerp(d.lift, v, smooth(op))),
        d.lift,
        P.teal,
        op === 1,
      );
    if (!point) title(c, '(52 − 12) / 400', 1200, 657, 41);
    const verdict =
      cue(k, 2, 'for this one-attempt protocol', 0.35) === 1 &&
      usefulLiftDecision(holdoutBootstrap.interval, minimum) === 'clears-useful-lift';
    holdoutNote(
      c,
      verdict
        ? 'The fresh lower endpoint exceeds the original minimum.'
        : 'Apply the rule to the fresh interval.',
      verdict ? 'SWITCH TO B' : point ? 'observed lift   ' + points(d.lift) + ' pts' : '',
    );
  }
}
const scenes = [
  ['Matched tasks', 'Would one more pass make you switch?', opening],
  ['Matched tasks', 'Keep the two answers on one ticket', pairs],
  ['Matched tasks', 'Which results belong together?', identity],
  ['Matched tasks', 'Open the full forty-task run', forty],
  ['The sign test', 'Give each disagreement a fair direction', nullModel],
  ['The sign test', 'Which patterns are at least as favorable?', tailScene],
  [
    'The sign test',
    (k) => bi(k) < 6 ? 'What did the drawing rule hold fixed?' : 'How did the study decision compare with the truth?',
    drawingRules,
  ],
  ['Study design', 'How often does the rejection gate open?', power],
  [
    'Study design',
    (k) => bi(k) < 2 ? 'What if a team tests twenty variants?' : 'What if we stop at the first crossing?',
    search,
  ],
  ['Precision', 'What changes when the prompts match?', variance],
  ['Precision', 'Resample the pair intact', bootstrap],
  ['Precision', 'Can the interval method miss?', intervalLimits],
  ['The switch decision', 'Would you switch on the development results?', liftGauge],
  ['Attempt budget', 'Choose three positions from ten', triples],
  ['Attempt budget', 'Which attempt gets the credit?', targets],
  ['Attempt budget', 'What changes after a failed draw?', bias],
  ['Attempt budget', 'Give each task one vote', macro],
  ['Evaluation protocol', 'Which changes alter the experiment?', protocol],
  [
    'Benchmark review',
    (k) => bi(k) >= 5 ? 'Does this interval clear the minimum?' : 'Can you subtract these scores?',
    report,
  ],
  ['The switch decision', 'Would you switch on fresh evidence?', holdout],
];
function draw(c, k) {
  const [section, heading, painter] = scenes[k.beat.chapterIndex];
  base(c, k, section, typeof heading === 'function' ? heading(k) : heading);
  painter(c, k);
}
function check() {
  checkPairs();
  checkInference();
  checkIntervals();
  checkAttempts();
  assert.notEqual(reports[0].budget, reports[1].budget);
  assert.deepEqual(
    practice.map((r) => usefulLiftDecision(r, minimum)),
    ['positive-size-unestablished', 'positive-size-unestablished', 'regression', 'inconclusive'],
  );
  assert.deepEqual(holdoutBootstrap.interval, [0.0625, 0.1375]);
  assert.equal(usefulLiftDecision(holdoutBootstrap.interval, minimum), 'clears-useful-lift');
  return true;
}
export default { title: 'Would You Switch the Coding Assistant?', draw, check, preparePicture: prepareCaptions };
