import assert from 'node:assert/strict';
import { checkExpression, voteFixture } from '../../../films/reasoning-search/arithmetic.mjs';
import { COMPLETE_B_TREE } from '../../../films/reasoning-search/fixtures.mjs';
import { STRATEGY_RECEIPTS } from '../../../films/reasoning-search/fixtures.mjs';
import {
  chooseReasoningStrategy,
  reasoningDecision,
} from '../../../films/reasoning-search/arithmetic.mjs';
import {
  field,
  heading,
  txt,
  label,
  line,
  rect,
  disk,
  badge,
  arrow,
  plate,
  token,
  cue,
  ink,
  navy,
  cream,
  paper,
  teal,
  mint,
  pale,
  red,
  pink,
  copper,
  muted,
} from './art.mjs';

function chip(g, x, y, title, changed) {
  for (let i = 0; i < 7; i++)
    for (const side of [0, 1]) {
      const dx = x + 19 + i * 24;
      line(g, dx, y + side * 164, dx, y + (side ? 178 : -14), copper, 6);
    }
  rect(g, x, y, 188, 164, '#132b31', 13, '#a2b9ac', 2);
  disk(g, x + 16, y + 16, 4, pale);
  txt(g, title, x + 94, y + 55, 28, cream, 'center', 'Serif');
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 3; j++)
      rect(
        g,
        x + 43 + i * 28,
        y + 88 + j * 16,
        18,
        8,
        changed && (i + j) % 2 ? copper : (i + j) % 3 ? teal : pale,
        2,
      );
}
export function training(g, c) {
  const b = c.beat.beatIndex,
    q = (n, p) => cue(c, n, p);
  field(g, 'panel');
  if (b === 2) {
    heading(
      g,
      'A checker supplies the reward',
      'ILLUSTRATIVE BINARY REWARDS   /   USE ALL FOUR INPUTS',
      'panel',
    );
    const samples = [voteFixture().samples[0].tree, COMPLETE_B_TREE];
    for (const [i, t] of samples.entries()) {
      const yy = 258 + i * 166;
      const result = checkExpression(t);
      txt(g, i ? '(6 − 4) × (5 + 7)' : '6 × 4', 77, yy, 32, cream, 'left', 'Mono');
      label(
        g,
        'Returns ' + result.result + '   ·   ' + result.leaves.length + ' inputs',
        78,
        yy + 54,
        pale,
      );
      if (q(3, 'That score can serve as a reward'))
        badge(g, 'Reward ' + Number(result.valid), 549, yy - 23, 174, result.valid ? mint : copper);
    }
    if (q(3, 'uses rewards for sampled outputs')) {
      arrow(g, 748, 346, 919, 346, mint);
      chip(g, 952, 265, 'Weights′', true);
    }
    return;
  }
  if (b >= 4) {
    heading(
      g,
      'Spend the same compute budget',
      'SNELL ET AL.   /   MATH   /   TUNED PALM 2 MODELS',
      'panel',
    );
    label(g, 'SMALLER MODEL', 82, 220, pale);
    chip(g, 135, 295, 'Model', false);
    arrow(g, 350, 380, 444, 380, mint);
    txt(g, 'Revise', 480, 340, 35, cream, 'left', 'Serif');
    txt(g, 'or search + verify', 480, 402, 29, cream, 'left', 'Serif');
    line(g, 749, 220, 749, 540, '#78918d', 2);
    label(g, 'LARGER MODEL', 829, 219, pale);
    chip(g, 876, 295, '~14× size', false);
    txt(
      g,
      b === 5
        ? 'The smaller model sometimes won. Difficulty changed the result.'
        : 'Compare training and inference together.',
      77,
      616,
      32,
      cream,
      'left',
      'Serif',
    );
    return;
  }
  heading(g, 'Where does learning change the system?', null, 'panel');
  label(g, 'PROMPT EXAMPLE', 76, 191, pale);
  label(g, 'TRAIN ON SCORED OUTPUTS', 681, 191, pale);
  plate(g, 73, 255, 225, 189, paper);
  label(g, 'Example', 101, 291, teal);
  txt(g, '6 − 4 = 2', 100, 355, 28, ink, 'left', 'Mono');
  arrow(g, 315, 350, 362, 350, mint);
  chip(g, 382, 270, 'Weights', false);
  const trained = q(1, 'Train on scored solutions');
  if (trained) {
    chip(g, 959, 270, 'Weights′', true);
    label(g, 'Sample', 677, 273, pale);
    label(g, 'Verify', 677, 341, pale);
    label(g, 'Reward', 677, 410, copper);
    arrow(g, 807, 405, 934, 363, copper);
  }
  txt(g, 'New context', 79, 515, 33, mint, 'left', 'Serif');
  if (trained) txt(g, 'Parameter update', 678, 515, 33, copper, 'left', 'Serif');
  const notes = [
    'o1: reinforcement learning   ·   R1-Zero: RL without prior SFT',
    'R1: supervised training and reinforcement learning',
    'GRPO uses rewards across a group of sampled outputs.',
    'Verified rewards and supervised solutions can both teach a procedure.',
  ];
  txt(g, notes[b], 78, 625, 26, cream);
}
const candidate = (x) => (x <= 3 ? 2 * x : 0);
export function verifier(g, c) {
  const q = (n, p) => cue(c, n, p),
    b = c.beat.beatIndex;
  field(g, 'panel');
  if (b < 3) {
    heading(g, 'A three-case test fixture', 'SPECIFICATION   /   RETURN TWICE THE INPUT', 'panel');
    txt(g, 'candidate(x) = 2x if x ≤ 3 else 0', 74, 196, 34, copper, 'left', 'Mono');
    const fourth = q(2, 'Zero'),
      tested = q(1, 'It gets two');
    for (const [i, x] of [1, 2, 3, 4].entries()) {
      const xx = 78 + i * 300,
        show = x === 4 ? fourth : tested;
      plate(g, xx, 263, 234, 238, x === 4 ? '#f1dab2' : '#d8e2d6');
      label(g, x === 4 ? 'HELD OUT' : 'TEST SUITE', xx + 26, 298, muted);
      txt(g, 'x = ' + x, xx + 117, 349, 33, ink, 'center', 'Mono');
      line(g, xx + 25, 391, xx + 208, 391, '#899c90');
      txt(
        g,
        show ? candidate(x) : '?',
        xx + 117,
        448,
        46,
        show && candidate(x) !== 2 * x ? red : teal,
        'center',
        'Serif',
      );
    }
    if (tested) txt(g, 'Suite reward   3 / 3', 74, 583, 33, mint, 'left', 'Serif');
    if (fourth) txt(g, 'Expected 8 · observed 0', 1189, 583, 33, pink, 'right', 'Serif');
    if (b === 2)
      label(g, 'A separate evaluation can test agreement with a false claim.', 74, 648, pale);
  } else {
    heading(g, 'Three different observations', 'RELEASE EVALUATION', 'panel');
    const rows = [
      ['Convincing explanation', 'Compare its fields with the service.'],
      ['Longer reasoning', 'Measure action errors and token use.'],
      ['Output budget spent', 'Mark an empty record incomplete.'],
    ];
    rows.forEach(([s, v], i) => {
      const y = 253 + i * 126;
      rect(g, 72, y - 40, 1134, 86, i === 2 && b === 4 ? '#385958' : '#1e3e45', 8);
      txt(g, s, 96, y, 28, copper, 'left', 'Serif');
      arrow(g, 482, y, 553, y, mint);
      txt(g, v, 589, y, 29, cream);
    });
  }
}
const extraReceipts = [
  { strategy: 'pair', calls: 2, p95_ms: 830, accuracy: 0.92 },
  { strategy: 'vote', calls: 5, p95_ms: 680, accuracy: 0.96 },
];
const names = {
  direct: 'Direct',
  single_trace: 'Single trace',
  vote_5: 'Vote five',
  tree_search: 'Tree search',
};
export function gate(g, c) {
  const q = (n, p) => cue(c, n, p),
    b = c.beat.beatIndex;
  if (b >= 8) {
    const winner = chooseReasoningStrategy(extraReceipts, 0.9, 900),
      decided = q(10, 'Choose the pair');
    field(g, 'paper');
    heading(
      g,
      'Two strategies clear both limits',
      'NEW CASE   /   AT LEAST 90% CORRECT   /   p95 AT MOST 900 ms',
    );
    for (const [i, r] of extraReceipts.entries()) {
      const y = 261 + i * 177;
      rect(
        g,
        75,
        y - 52,
        1125,
        127,
        decided && r === winner ? '#c1ddc3' : cream,
        11,
        decided && r === winner ? teal : '#b8b99e',
        2,
      );
      txt(g, i ? 'Vote' : 'Pair', 110, y, 43, ink, 'left', 'Serif');
      label(g, r.accuracy * 100 + '% correct', 379, y, muted, 'left', 25);
      label(g, r.p95_ms + ' ms', 687, y, muted, 'left', 25);
      txt(g, r.calls + ' calls', 1001, y, 34, teal);
    }
    txt(
      g,
      decided
        ? 'Pair meets both limits with two calls.'
        : 'Which eligible strategy uses fewer calls?',
      76,
      625,
      33,
      ink,
      'left',
      'Serif',
    );
    return;
  }
  const cap = q(5, 'one hundred milliseconds') ? 100 : 900;
  const eligible = chooseReasoningStrategy(STRATEGY_RECEIPTS, 0.9, cap);
  const answered = cap === 900 ? q(3, 'Vote five') : q(6, 'None');
  field(g, 'paper');
  heading(g, 'Which strategy fits?', 'ILLUSTRATIVE MEASUREMENTS   /   SAME TASK');
  const x = (n) => 126 + n * 0.494,
    y = (a) => 536 - (a - 0.7) * 1040;
  const right = x(2010),
    top = y(1),
    floor = y(0.9);
  rect(g, x(0), top, x(cap) - x(0), floor - top, '#b8d9be');
  for (const v of [0.7, 0.8, 0.9, 1]) {
    line(g, x(0), y(v), right, y(v), v === 0.9 ? teal : '#adb9a9', v === 0.9 ? 3 : 1);
    label(g, Math.round(v * 100) + '%', 102, y(v), muted, 'right', 16);
  }
  line(g, x(cap), top - 14, x(cap), y(0.7), red, 3);
  label(g, 'Deadline ' + cap + ' ms', x(cap) + 9, top - 33, red, 'left', 18);
  for (const v of [0, 500, 1000, 1500, 2000]) label(g, v, x(v), 565, muted, 'center', 16);
  for (const r of STRATEGY_RECEIPTS) {
    const xx = x(r.p95_ms),
      yy = y(r.accuracy),
      selected = answered && eligible === r;
    if (selected) disk(g, xx, yy, 17, '#c2d9b9', teal, 2);
    disk(g, xx, yy, 8, selected ? teal : navy);
    const leftSide = r.strategy === 'tree_search' || r.strategy === 'vote_5',
      dx = leftSide ? -16 : 15,
      al = leftSide ? 'right' : 'left';
    txt(g, names[r.strategy], xx + dx, yy - 15, 23, ink, al, 'Sans', 600);
    label(
      g,
      Math.round(r.accuracy * 100) + '% · ' + r.p95_ms + ' ms',
      xx + dx,
      yy + 13,
      muted,
      al,
      16,
    );
  }
  label(g, 'p95 latency (ms)', 1119, 601, muted, 'right', 18);
  if (answered) {
    const res = eligible
      ? names[eligible.strategy] + '   ·   ' + eligible.calls + ' calls'
      : 'No eligible strategy';
    txt(g, res, 74, 644, 36, eligible ? teal : red, 'left', 'Serif');
  }
  if (b >= 6)
    label(
      g,
      'Check finite values and a positive integer call count.',
      1200,
      658,
      muted,
      'right',
      17,
    );
}
const facts = { tests_passed: true, security_scan_clear: true, reviewer_approved: true };
export function choosing(g, c) {
  const b = c.beat.beatIndex;
  field(g, 'paper');
  if (b === 0 && cue(c, 1, 'A short factual question')) {
    const dependent = cue(c, 1, 'To derive checks');
    heading(
      g,
      dependent ? 'Pass a verified list forward' : 'Look up one fact',
      dependent ? 'TWO DEPENDENT QUESTIONS' : 'ONE RESPONSE',
    );
    txt(
      g,
      dependent ? 'Which components changed?' : 'Which version is deployed?',
      74,
      289,
      44,
      ink,
      'left',
      'Serif',
    );
    badge(g, dependent ? 'Authentication + logging' : 'Version 17', 74, 367, 389, '#b6d9c3');
    if (dependent) {
      arrow(g, 491, 388, 627, 388, teal);
      txt(g, 'Which checks follow?', 658, 387, 38, ink, 'left', 'Serif');
    }
    return;
  }
  if (b === 0) {
    heading(g, 'Start with the task’s inputs', 'STRUCTURED RELEASE FACTS');
    const words = ['Tests pass', 'Scan clear', 'Review approved'];
    words.forEach((v, i) => {
      const y = 240 + i * 117;
      txt(g, v, 76, y, 32, ink, 'left', 'Serif');
      badge(g, String(Object.values(facts)[i]), 405, y - 22, 115, '#bfdbc3');
      line(g, 526, y, 646, y, teal, 3);
    });
    line(g, 646, 240, 646, 474, teal, 3);
    arrow(g, 646, 357, 766, 357, teal);
    rect(g, 785, 300, 350, 117, cream, 12, teal, 2);
    label(g, 'ALL THREE TRUE', 819, 330, muted);
    txt(
      g,
      reasoningDecision(facts) === 'merge_release' ? 'Merge' : 'Manual review',
      819,
      378,
      41,
      teal,
      'left',
      'Serif',
    );
    txt(g, 'A deterministic rule owns this action.', 79, 620, 34, ink, 'left', 'Serif');
  } else if (b === 1) {
    heading(g, 'What can you verify?', 'TWO DIFFERENT CONTROLLERS');
    for (const [i, v] of ['M', 'M', 'R', 'M', '×'].entries())
      token(g, 105 + i * 83, 288, v, 59, i === 4 ? '#dfb9a7' : '#bddac5');
    arrow(g, 487, 288, 576, 288, teal);
    txt(g, 'Vote on a canonical answer', 610, 289, 32, ink, 'left', 'Serif');
    token(g, 118, 478, '6', 59);
    arrow(g, 167, 470, 285, 418, teal);
    arrow(g, 167, 485, 285, 537, teal);
    label(g, '6 × 4', 305, 413);
    label(g, '6 − 4', 305, 542);
    txt(g, 'Search legal continuations', 610, 474, 32, ink, 'left', 'Serif');
  } else {
    heading(g, 'Use the same evaluator', 'HELD-OUT REQUESTS');
    const metrics = [
      ['Correctness', 'Does the action match policy?'],
      ['Abstention', 'How often is there no answer?'],
      ['Generation cost', 'How many tokens and calls?'],
      ['Latency', 'How long did the user wait?'],
    ];
    metrics.forEach(([k, v], i) => {
      const y = 219 + 97 * i;
      line(g, 71, y + 43, 1208, y + 43, '#bdc4b5');
      label(g, k, 78, y, teal, 'left', 23);
      txt(g, v, 530, y, 31, ink, 'left', 'Serif');
    });
  }
}
export function checkEvaluation() {
  assert.deepEqual([1, 2, 3, 4].map(candidate), [2, 4, 6, 0]);
  assert.equal(reasoningDecision(facts), 'merge_release');
  assert.equal(chooseReasoningStrategy(STRATEGY_RECEIPTS, 0.9, 900), STRATEGY_RECEIPTS[2]);
  assert.equal(chooseReasoningStrategy(STRATEGY_RECEIPTS, 0.9, 100), null);
  assert.equal(chooseReasoningStrategy(extraReceipts), extraReceipts[0]);
  const pair = { strategy: 'pair', accuracy: 0.93, p95_ms: 800, calls: 2 };
  assert.equal(chooseReasoningStrategy([...STRATEGY_RECEIPTS, pair]), pair);
  for (const row of [
    { ...pair, calls: true },
    { ...pair, accuracy: Infinity },
    { ...pair, p95_ms: -1 },
    { ...pair, strategy: '' },
  ])
    assert.equal(chooseReasoningStrategy([row]), null);
}
