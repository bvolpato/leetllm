import {
  C,
  stage,
  text,
  mono,
  serif,
  rect,
  line,
  dot,
  poly,
  paper,
  header,
  table,
  stamp,
  tag,
  screw,
  fixed,
  share,
} from './art.mjs';
import {
  rewardEnsemble,
  screen,
  SUPPORT_SCREEN,
  sum,
  staticAccuracy,
  freshAccuracy,
  freshFloor,
  sourceCheck,
  dotProduct,
  readout,
  scores,
  weights,
  rankScores,
  fits,
  CONTROLLED_PAIRS,
  scorePair,
  traces,
} from './examples.mjs';
export function ensemble(g, { beat, cue }) {
  stage(g, true);
  const same = cue(5, 'all three scorers assign five'),
    v = same ? SUPPORT_SCREEN.memberScores : [2, 4, 6],
    e = rewardEnsemble(v);
  header(
    g,
    'ALIGNED SCORERS   /   ONE ANSWER',
    same ? 'Can three scorers share the same mistake?' : 'How much do the three scores disagree?',
  );
  const X = (n) => 82 + n * 129,
    y = 256;
  line(g, X(0), y, X(6.3), y, C.muted, 2);
  for (let i = 0; i < 7; i++) {
    line(g, X(i), y - 7, X(i), y + 7, C.muted, 2);
    mono(g, i, X(i), y + 32, 18, C.muted, { align: 'center' });
  }
  v.forEach((value, i) => {
    const yy = y - 34 - (same ? i * 28 : 0);
    line(g, X(value), yy, X(value), y, C.edge);
    dot(g, X(value), yy, 8, [C.teal, '#846ca2', C.red][i]);
    mono(g, 's' + (i + 1) + ' = ' + value, X(value) - 14, yy - 8, 19, C.ink, { align: 'right' });
  });
  const mean = cue(1, 'mean is four'),
    sd = cue(2, 'sample standard deviation'),
    agg = cue(3, 'returns two');
  if (mean) mono(g, 'Mean  ' + e.mean, 55, 353, 25);
  if (sd) mono(g, 'Sample SD  ' + e.sd, 316, 353, 25);
  if (agg) mono(g, 'Mean − SD  ' + e.aggregate, 603, 353, 25, C.teal);
  if (beat === 2) mono(g, 's = √( Σ(x − mean)² / (K − 1) ) = √(8 / 2)', 55, 430, 22, C.muted);
  if (beat === 3 || beat === 4)
    text(g, 'λ = 1. Check the disagreement signal on the actual generator.', 56, 432, 23, C.muted);
  if (same) {
    paper(g, 54, 388, 852, 74, C.coral);
    serif(g, 'Three identical scores for a reply with an invented citation.', 71, 435, 26, C.ink, {
      width: 812,
    });
  }
}
export function benchmark(g, { beat, cue, clock }) {
  stage(g, true);
  if (beat <= 2) {
    header(g, 'REWARDBENCH 2   /   ORDINARY CASE', 'How many answers can win this case?');
    ['A', 'B', 'C', 'D'].forEach((v, i) => {
      const x = 58 + i * 217;
      paper(g, x, 166, 188, 117, i === 1 && cue(1, 'one winner') ? C.aqua : C.page);
      serif(g, v, x + 94, 244, 48, C.ink, { align: 'center' });
    });
    if (cue(1, 'twenty-five percent'))
      mono(g, 'Uniform guess: 1 / 4 = 25%    ·    ties use a separate metric', 55, 346, 21, C.teal);
    text(
      g,
      'Factuality, precise instruction following, math, safety, focus, ties',
      55,
      400,
      23,
      C.ink,
      { width: 853 },
    );
    mono(g, 'Original RewardBench: chat, hard chat, safety, reasoning', 55, 453, 18, C.muted);
  } else if (beat === 3) {
    header(g, 'REWARDBENCH 2 STUDY   /   TULU 3 8B SFT', 'Keep the generator beside the benchmark');
    for (let i = 0; i < 16; i++) {
      const x = 60 + (i % 8) * 104,
        y = 164 + Math.floor(i / 8) * 73;
      paper(g, x, y, 91, 54);
      mono(g, String(i + 1).padStart(2, '0'), x + 45, y + 36, 23, C.ink, { align: 'center' });
    }
    mono(g, 'Best of 16', 58, 355, 28, C.teal);
    if (cue(3, 'Pearson')) mono(g, 'Pearson r = 0.87', 477, 355, 28, C.teal);
    text(
      g,
      'PPO results also depend on initialization and prompt distribution.',
      57,
      437,
      24,
      C.muted,
      { width: 845 },
    );
  } else {
    header(g, 'PAIR ACCURACY   /   EXERCISE THRESHOLD', 'Do the fresh, reviewed pairs clear the floor?');
    const X = (v) => 71 + 790 * v;
    const measuredGap = cue(5, 'Hold the trial');
    for (const [i, v] of [staticAccuracy, freshAccuracy].entries()) {
      const y = 206 + 107 * i;
      text(g, i ? 'Fresh policy outputs · human-reviewed pairs' : 'Static held-out pairs', 65, y - 17, 24);
      rect(g, 71, y, 790, 29, C.faint);
      rect(g, 71, y, 790 * v, 29, i && measuredGap ? '#c87e70' : '#74ad9e');
      mono(g, share(v), X(v) - 5, y + 22, 19, C.ink, { align: 'right' });
    }
    line(g, X(freshFloor), 173, X(freshFloor), 367, C.ink, 3);
    mono(g, share(freshFloor) + ' floor', X(freshFloor), 393, 20, C.ink, { align: 'center' });
    if (measuredGap) {
      const start = X(freshAccuracy), end = X(freshFloor);
      line(g, start, 349, start, 363, C.red, 2);
      line(g, start, 356, end, 356, C.red, 2);
      line(g, end, 349, end, 363, C.red, 2);
      mono(g, Math.round(100 * (freshFloor - freshAccuracy)) + ' percentage points short', 895, 452, 22, C.red, { align: 'right' });
    }
    if (beat === 5 && clock.elapsed >= clock.speechDuration && freshAccuracy < freshFloor)
      stamp(g, 'HOLD TRIAL', 61, 419, 201, C.red);
  }
}
export function signals(g, { beat, cue }) {
  stage(g);
  if (beat <= 2) {
    header(
      g,
      'OUTCOME REWARD   /   THREE SAMPLED ANSWERS',
      'One terminal score per completed response',
      true,
    );
    const vals = [2, 4, 6],
      mean = sum(vals) / vals.length;
    vals.forEach((v, i) => {
      const x = 54 + i * 292;
      paper(g, x, 164, 268, 183);
      mono(g, 'ROLLOUT ' + (i + 1), x + 16, 194, 17, C.muted);
      serif(g, v, x + 134, 271, 60, C.ink, { align: 'center' });
      if (cue(1, 'relative rewards'))
        mono(g, 'r − mean = ' + (v - mean), x + 134, 322, 18, C.teal, { align: 'center' });
    });
    if (cue(1, 'Best-of-N')) stamp(g, 'BEST OF 3', 669, 367, 177, C.aqua);
    mono(g, 'PPO: learned value baseline     GRPO: within-prompt group', 55, 461, 19, C.gray);
  } else if (beat === 3) {
    header(g, 'PROCESS JUDGMENT   /   FIXED GENERATOR', 'Find the first arithmetic error', true);
    const found = cue(3, 'erroneous step');
    table(g, {
      columns: [
        ['Step', 0],
        ['Reasoning', 0.17],
        ['Review', 0.66],
      ],
      rows: [
        ['1', '2 + 3 = 5', 'Valid'],
        ['2', '5 × 2 = 11', found ? 'Error: expected 10' : '?'],
        ['3', 'Therefore, 11', found ? 'Uses step 2' : '?'],
      ],
      headingColor: C.gray,
      ink: C.light,
      colors: [C.light, found ? C.coral : C.light, C.light],
    });
    mono(g, 'Lightman et al.   /   best-of-N on MATH', 55, 435, 20, C.aqua);
  } else if (beat === 4) {
    header(
      g,
      'GENERATIVE JUDGE   /   SAME TWO ANSWERS',
      'What happens if you swap their positions?',
      true,
    );
    for (const [i, a] of ['Answer A  ·  Answer B', 'Answer B  ·  Answer A'].entries()) {
      const y = 166 + i * 122;
      paper(g, 57, y, 518, 81);
      serif(g, a, 80, y + 51, 30);
      const seen = cue(4, i ? 'it picks B' : 'it picks A');
      mono(g, seen ? '→   picks ' + (i ? 'B' : 'A') : '→   verdict ?', 617, y + 52, 25, C.accent);
    }
    text(g, 'Compare verdicts by answer identity after swapping order.', 58, 439, 24, C.light);
  } else if (beat === 5) {
    header(g, 'EXECUTABLE VERIFIER', 'Which input exposes the faulty addition?', true);
    mono(g, 'def add(a, b): return 5', 56, 176, 28, C.cream);
    const ready = [cue(5, 'visible test passes'), cue(5, 'hidden test expects eight')];
    table(g, {
      y: 235,
      columns: [
        ['Input', 0],
        ['Returned', 0.32],
        ['Expected', 0.56],
        ['Check', 0.8],
      ],
      rows: [
        [2, 3],
        [4, 4],
      ].map(([a, b], i) => {
        const v = sourceCheck(a, b);
        return [
          a + ' + ' + b,
          ready[i] ? v.got : '?',
          v.want,
          ready[i] ? (v.passes ? 'Pass' : 'Fail') : '?',
        ];
      }),
      headingColor: C.gray,
      ink: C.light,
      lineHeight: 70,
    });
    mono(g, 'Passing one example checks only that input.', 56, 445, 23, C.aqua);
  } else dpo(g);
}
function dpo(g) {
  header(
    g,
    'BASIC OFFLINE DPO   /   STRICT PREFERENCE PAIRS',
    'Which model receives the update?',
    true,
  );
  paper(g, 54, 159, 851, 210);
  mono(g, 'PREFERENCE: A > B', 76, 195, 18, C.teal);
  text(g, 'A', 74, 252, 29);
  mono(g, 'log π(A | x) − log πref(A | x)', 157, 250, 25);
  text(g, 'B', 74, 322, 29);
  mono(g, 'log π(B | x) − log πref(B | x)', 157, 320, 25);
  mono(g, 'Compare log-ratios   →   update the writer', 55, 433, 25, C.aqua);
}
export function artifact(g, { beat, cue }) {
  stage(g, true);
  if (beat <= 2) {
    header(
      g,
      'TRAINER FRAGMENT   /   PREPARED DATA',
      'Which steps have to happen before training?',
    );
    table(g, {
      columns: [
        ['Source', 0],
        ['Input', 0.33],
        ['What it supplies', 0.66],
      ],
      rows: [
        ['TRL 1.13', 'Train / eval pairs', 'One-label classifier'],
        ['TRL 1.17.1', 'Candidate text', 'Length + format rules'],
        ['CPU fit', 'Two features', 'Checked arithmetic'],
      ],
    });
    mono(g, 'Group prompts before passing the splits to the trainer.', 54, 440, 22, C.teal);
  } else if (beat <= 4) {
    header(
      g,
      'RELOAD PROBE   /   SAME HELD-OUT INPUT',
      'What changes when the score head is missing?',
    );
    const omit = cue(4, 'Omit the trained head') && !cue(4, 'Restore the trained head'),
      v = readout(false).vector,
      w = omit ? [0, 0] : weights;
    [
      'Base revision',
      'LoRA adapter',
      omit ? 'Substitute head' : 'Trained head',
      'Input template',
    ].forEach((s, i) => {
      const x = 51 + i * 218;
      paper(g, x, 161, 204, 88, i === 2 ? (omit ? C.coral : C.aqua) : C.page);
      serif(g, s, x + 11, 213, 23, C.ink, { width: 180 });
    });
    mono(g, 'h = [' + v.join(', ') + ']      w = [' + w.join(', ') + ']', 56, 321, 27);
    const pending = omit && !cue(4, 'Its score falls');
    mono(
      g,
      'Saved score 4       Reloaded score ' + (pending ? '?' : dotProduct(v, w)),
      56,
      390,
      27,
      omit ? C.red : C.teal,
    );
    mono(g, 'Keep the tokenizer, split, revision and training settings.', 56, 450, 19, C.muted);
  } else {
    header(
      g,
      'TRAINING DIAGNOSTICS',
      beat === 5
        ? 'What evidence would explain stalled accuracy?'
        : 'When should you stop the trial?',
    );
    if (beat === 5) {
      table(g, {
        columns: [
          ['Observed', 0],
          ['Inspect', 0.49],
        ],
        rows: [
          ['Loss falls, held-out accuracy stalls', 'Labels, overlap, held-out loss'],
          ['Easy pairs grow more confident', 'Margins, calibration, task slices'],
          ['Raw scores drift', 'Midpoint and margin separately'],
        ],
      });
    } else {
      table(g, {
        columns: [
          ['Trial signal', 0],
          ['Observation', 0.47],
        ],
        rows: [
          ['Learned proxy reward', 'Rising'],
          ['Independent quality check', 'Deteriorating'],
        ],
      });
      if (cue(6, 'stop the trial')) stamp(g, 'STOP AND KEEP OUTPUTS', 54, 382, 329, C.red);
    }
  }
}
function book(g, fail) {
  // The visible right-hand contents are the entire contents of this edition.
  poly(
    g,
    [
      [485, 161],
      [510, 145],
      [875, 133],
      [909, 149],
      [910, 418],
      [513, 433],
      [487, 441],
    ],
    '#47597b',
  );
  poly(
    g,
    [
      [496, 150],
      [517, 143],
      [890, 136],
      [896, 402],
      [515, 420],
      [496, 431],
    ],
    '#d1b69c',
  );
  poly(
    g,
    [
      [496, 143],
      [514, 138],
      [886, 130],
      [892, 392],
      [516, 410],
      [496, 424],
    ],
    C.page,
  );
  line(g, 513, 146, 516, 404, '#c0a48e', 3);
  mono(g, 'SUPPORT GUIDE  ·  CURRENT EDITION', 535, 174, 15, C.teal, { width: 337 });
  serif(g, 'Complete contents', 533, 215, 31);
  ['Access requests', 'Ticket review', 'Renewals'].forEach((v, i) => {
    mono(g, '§' + SUPPORT_SCREEN.sections[i], 537, 259 + i * 47, 21, C.teal);
    serif(g, v, 594, 259 + i * 47, 23);
  });
  if (fail) stamp(g, '§4 ABSENT', 694, 352, 151, C.red);
}
export function support(g, { cue }) {
  stage(g);
  header(g, 'SUPPORT TRIAL   /   FRESH INDEPENDENT REVIEWS', 'Would you start the trial?', true);
  const result = screen(SUPPORT_SCREEN),
    n = SUPPORT_SCREEN.agreements.length;
  mono(g, 'Pair agreement   ·   floor ' + share(SUPPORT_SCREEN.floor), 51, 165, 20, C.light);
  SUPPORT_SCREEN.agreements.forEach((a, i) => {
    const x = 51 + (i % 8) * 50,
      y = 191 + Math.floor(i / 8) * 48;
    rect(g, x, y, 40, 36, a ? C.aqua : C.coral, 3);
    mono(g, i + 1, x + 20, y + 25, 17, C.ink, { align: 'center' });
  });
  text(g, result.count + ' agree    ' + (n - result.count) + ' disagree', 52, 358, 21, C.light);
  const calc = cue(3, 'seventy-five percent'),
    pairFail = cue(3, 'pair screen fails'),
    sourceFail = cue(3, 'edition ends at section three');
  if (calc) mono(g, result.count + '/' + n + ' = ' + share(result.p), 53, 397, 24, C.accent);
  if (pairFail && !result.pass) stamp(g, 'BELOW FLOOR', 243, 370, 183, C.coral);
  book(g, sourceFail && !result.sourcePass);
  mono(
    g,
    'Reply cites §' +
      SUPPORT_SCREEN.citedSection +
      '    ·    scores ' +
      SUPPORT_SCREEN.memberScores.join(' / '),
    490,
    458,
    18,
    C.light,
  );
  if (cue(3, 'score stays five'))
    mono(g, 'Mean − SD = ' + result.ensemble.aggregate, 52, 451, 20, C.light);
  if (cue(4, 'Hold the trial')) tag(g, 'HOLD TRIAL', 52, 473, { width: 170, color: C.coral });
}
function replayState(s) {
  const { cue, beat } = s;
  const revised = Boolean(cue(6, 'reset the ticket'));
  const step = revised
    ? cue(7, 'At step three')
      ? 3
      : cue(7, 'Then the reviewer approves')
        ? 2
        : cue(7, 'First the assistant holds')
          ? 1
          : 0
    : cue(3, 'The reviewer approves at step two')
      ? 2
      : cue(3, 'D grants access at step one')
        ? 1
        : 0;
  const history = traces[Number(revised)];
  const current = step
    ? history[step - 1]
    : { approved: false, granted: false, grantNow: false, passes: true };
  return {
    revised,
    step,
    history,
    current,
    oldFail: Boolean(cue(5, 'At step one both conditions are false')),
    passed: Boolean(cue(7, 'A two passes')) && step === 3 && history.every((r) => r.passes),
  };
}
function mechanism(g, approved, granted) {
  paper(g, 55, 157, 395, 164);
  mono(g, 'P7-42   /   REVIEWER APPROVAL', 73, 190, 16, C.muted);
  line(g, 75, 271, 421, 271, C.muted, 1.4);
  if (approved) stamp(g, 'APPROVED', 113, 213, 208, C.teal);
  else mono(g, 'pending', 78, 301, 17, C.muted);
  rect(g, 496, 154, 405, 168, '#171c33', 13);
  for (const x of [510, 887]) for (const yy of [168, 306]) screw(g, x, yy);
  mono(g, 'ADMIN ACCESS', 526, 191, 18, C.gray);
  rect(g, 530, 216, 137, 56, '#393e59', 28);
  dot(g, granted ? 637 : 560, 244, 22, granted ? C.aqua : C.gray);
  mono(g, granted ? 'GRANTED' : 'BLOCKED', 688, 255, 25, granted ? C.aqua : C.cream);
}
export function finalTrial(g, s) {
  const { beat, cue } = s;
  stage(g);
  if (beat === 1) {
    header(
      g,
      'ONE WRITER   /   THREE COMPLETED REPLIES',
      'Which reply will best-of-three return?',
      true,
    );
    const showPick = cue(1, 'A wins best of three');
    const winner = rankScores.indexOf(Math.max(...rankScores));
    table(g, {
      columns: [
        ['Reply', 0],
        ['Action', 0.19],
        ['Reward score', 0.69],
        ['Pick', 0.84],
      ],
      rows: ['Ask for a ticket and wait', 'Grant immediately', 'Longer review-first reply'].map(
        (v, i) => [
          'ABC'[i],
          v,
          fixed(rankScores[i], 1),
          showPick && i === winner ? 'ABC'[i] : '',
        ],
      ),
      headingColor: C.gray,
      ink: C.light,
    });
    if (cue(1, 'PPO can use'))
      mono(g, 'PPO  /  terminal reward → policy update', 54, 438, 22, C.aqua);
    return;
  }
  if (beat === 2) {
    dpo(g);
    return;
  }
  const r = replayState(s);
  header(
    g,
    'MIGRATION DRY RUN   /   GRANT REQUIRES PRIOR APPROVAL',
    r.revised
      ? 'A2   “Hold until approval. Then grant.”'
      : 'D   “Admin enabled now. I’ll request approval afterward.”',
    true,
  );
  mechanism(g, r.current.approved, r.current.granted);
  const done = r.revised
    ? ['Hold access', 'Record approval', 'Grant access']
    : ['Grant access', 'Record approval', ''];
  for (let i = 0; i < 3; i++) {
    const x = 58 + i * 294;
    line(g, x, 348, x + 250, 348, i < r.step ? C.aqua : '#70748c', 2);
    mono(g, '0' + (i + 1), x, 377, 17, C.gray);
    text(g, i < r.step ? done[i] : '…', x + 40, 379, 22, i < r.step ? C.light : C.gray, {
      width: 221,
    });
  }
  if (!r.revised) {
    const scale = cue(3, 'Scale both weights to one'),
      w = fits[0].weights.map((v) => (scale ? v / fits[0].weights[0] : v)),
      out = scorePair(w, CONTROLLED_PAIRS[0]);
    if (cue(3, 'Our fitted head'))
      mono(
        g,
        'Weights [' + w.map((v) => fixed(v, scale ? 0 : 2)).join(', ') + ']',
        55,
        435,
        21,
        C.accent,
      );
    if (cue(3, 'A earns one point')) mono(g, 'A = ' + out[0], 410, 435, 23, C.light);
    if (cue(4, 'D earns two')) mono(g, 'D = ' + out[1], 609, 435, 23, C.light);
    if (r.oldFail)
      mono(g, 'STEP 1 FAILED    grant = yes   ·   approved then = no', 54, 483, 20, C.coral);
  } else {
    mono(g, 'D archive   ·   step 1 grant with approval pending   ·   FAIL', 55, 429, 18, C.coral);
    if (r.passed)
      mono(
        g,
        'A2 passes all 3 steps. Test the scorer on fresh reversed-length pairs.',
        55,
        477,
        20,
        C.aqua,
        { width: 845 },
      );
    else if (!r.step) text(g, 'At which step can A2 grant access?', 55, 479, 23, C.cream);
    else
      mono(
        g,
        'A2   ·   ' +
          (r.current.passes ? 'rule preserved' : 'rule failed') +
          ' through step ' +
          r.step,
        55,
        477,
        20,
        C.aqua,
      );
  }
}
export { replayState };
