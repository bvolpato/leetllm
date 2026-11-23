import assert from 'node:assert/strict';
import { VOTING_CASES } from '../../../films/reasoning-search/fixtures.mjs';
import { canonicalAction, canonicalVote } from '../../../films/reasoning-search/construction.mjs';
import {
  field,
  heading,
  rect,
  txt,
  line,
  label,
  badge,
  arrow,
  token,
  disk,
  plate,
  mix,
  ease,
  cue,
  ink,
  paper,
  cream,
  navy,
  mint,
  teal,
  copper,
  pale,
  red,
  muted,
} from './art.mjs';

const act = (x) =>
  ({ merge_release: 'Merge', manual_review: 'Review', abstain: 'Abstain' })[x] ?? 'Rejected';
const replies = [
  'Merge release',
  'merge_release',
  'Auto merge approved change',
  'manual review',
  'force merge immediately',
];
const trialMinimumShare = 0.6;
const repliesPerRelease = VOTING_CASES[0].samples.length;
const minimumVotes = Math.ceil(trialMinimumShare * repliesPerRelease);
const ledger = VOTING_CASES.map((r) => ({
  ...r,
  first: canonicalAction(r.samples[0]),
  vote: canonicalVote(r.samples, trialMinimumShare).decision,
}));
const winners = (key) => ledger.filter((r) => r[key] === r.expected).length;
export function scratch(g, c) {
  const q = (b, p, t = 0) => cue(c, b, p, t),
    b = c.beat.beatIndex;
  field(g, 'panel');
  heading(
    g,
    b === 2 ? 'Two short answers' : 'The next token reads the tape',
    b === 2 ? 'SAME VISIBLE ANSWER' : 'DECODER   /   SUBTRACTION',
    'panel',
  );
  const append = q(1, 'Append that two', 0.55),
    digit = q(1, 'proposes the digit two');
  if (b === 2) {
    label(g, 'TWO RUNS   /   SCHEMATIC', 83, 185, pale);
    for (const [i, n] of [4, 10].entries()) {
      const yy = 270 + i * 175;
      label(g, 'Response ' + (i + 1), 85, yy - 45, pale);
      for (let k = 0; k < n; k++) rect(g, 88 + k * 61, yy, 48, 47, copper, 4);
      arrow(g, 753, yy + 23, 874, yy + 23, mint);
      token(g, 982, yy + 22, '2', 74, paper);
    }
    label(g, 'Illustrative internal work', 87, 596, pale);
    label(g, 'Visible answer', 982, 596, pale, 'center');
    return;
  }
  rect(g, 73, 226, 1115, 118, '#cbbc98', 8);
  for (let x = 88; x < 1175; x += 23) for (const y of [237, 333]) disk(g, x, y, 3, navy);
  for (const [i, str] of ['6', '−', '4', '='].entries())
    token(g, 165 + 150 * i, 286, str, 72, paper);
  if (digit) {
    token(g, mix(1013, 765, ease(append)), mix(494, 286, ease(append)), '2', 72, copper);
  }
  label(g, 'PREFIX IN MEMORY', 80, 198, pale);
  if (append === 1) {
    line(g, 765, 333, 765, 393, mint, 3);
    arrow(g, 765, 393, 557, 450, mint);
    label(g, 'Next pass', 797, 392, mint);
  }
  for (let i = 0; i < 3; i++) {
    rect(
      g,
      225 + 27 * i,
      471 - 17 * i,
      300,
      79,
      ['#34565e', '#4c7375', '#89bdb1'][i],
      8,
      '#aecac0',
      2,
    );
  }
  txt(g, 'Decoder layers', 429, 474, 30, ink, 'center');
  arrow(g, 245, 365, 245, 433, mint);
  arrow(g, 593, 486, 913, 486, mint);
  label(g, b >= 1 ? 'Cached keys and values' : 'One forward pass', 82, 594, pale);
  txt(
    g,
    b === 0
      ? append === 1
        ? '6 − 4 = 2  →  next prediction'
        : 'Write a subtotal into the prefix'
      : b === 1
        ? 'Reuse earlier projections. Process the new token.'
        : b === 2
          ? 'Equal visible lengths can use different compute.'
          : 'Capacity under assumptions · test the trained model',
    80,
    644,
    32,
    cream,
    'left',
    'Serif',
  );
}
function ruled(g, x, y, w, h, title, items, color) {
  rect(g, x + 5, y + 7, w, h, '#6f755533', 5);
  rect(g, x, y, w, h, '#fff9e7', 5, '#c7bba1', 1.5);
  rect(g, x, y, 10, h, color, 3);
  txt(g, title, x + 32, y + 46, 33, ink, 'left', 'Serif');
  items.forEach((t, i) => {
    line(g, x + 30, y + 112 + i * 49, x + w - 26, y + 112 + i * 49, '#cdd0b8', 1);
    txt(g, t, x + 33, y + 93 + i * 49, 22, ink);
  });
}
export function prompts(g, c) {
  const b = c.beat.beatIndex;
  field(g, 'paper');
  if (b <= 1 || b === 4) {
    heading(
      g,
      'Two prompts, one held-out release',
      'FIXED   /   FACTS  ·  POLICY  ·  OUTPUT FIELDS',
    );
    ruled(
      g,
      66,
      200,
      520,
      260,
      b === 1 ? 'Zero-shot instruction' : 'Schema example',
      b === 1
        ? ['Explain each check.', 'Solved examples: 0']
        : ['checks: { … }', 'final_action: …', 'operator_message: …'],
      teal,
    );
    ruled(
      g,
      652,
      200,
      565,
      260,
      'Worked example',
      [
        'Separate run · scan clear = false',
        'The rule needs three passing checks.',
        'final_action: manual_review',
      ],
      red,
    );
    if (b !== 4) return;
    label(g, 'COMPARE ON THE SAME CASES', 70, 518, muted);
    const labels = ['Parse failures', 'Missing fields', 'Action errors', 'Tokens / latency'];
    labels.forEach((s, i) => {
      line(g, 74 + i * 300, 551, 310 + i * 300, 551, i === 1 ? red : teal, 3);
      txt(g, s, 74 + i * 300, 593, 26, ink);
    });
  } else if (b === 2) {
    heading(g, 'Eight worked examples', 'WEI ET AL.   /   GSM8K   /   PALM 540B');
    for (const [i, [s, v]] of [
      ['Direct', 17.9],
      ['Worked steps', 56.9],
    ].entries()) {
      const y = 288 + i * 137;
      txt(g, s, 65, y, 30, ink);
      rect(g, 310, y - 27, 750, 54, '#d6daca', 3);
      rect(g, 310, y - 27, 7.5 * v, 54, i ? teal : muted, 3);
      txt(g, v + '%', 337 + 7.5 * v, y, 32, ink, 'left', 'Mono');
    }
    label(g, 'Held-out math accuracy', 310, 510, muted);
    txt(g, 'Zero-shot variant   “Think step by step.”', 65, 625, 33, ink, 'left', 'Serif');
  } else {
    heading(g, 'The task changes the comparison', 'TWO SEPARATE STUDIES');
    ruled(
      g,
      65,
      220,
      545,
      275,
      'GPQA Diamond',
      ['Non-reasoning models: modest gain', 'Reasoning models: little gain', 'More time spent'],
      teal,
    );
    ruled(
      g,
      665,
      220,
      550,
      275,
      'Pattern-based tasks',
      ['9 datasets · 16 models', 'Direct answers performed better', 'than prompted steps.'],
      red,
    );
  }
}
export function artifacts(g, c) {
  const b = c.beat.beatIndex,
    q = (n, p, t = 0) => cue(c, n, p, t);
  field(g, 'panel');
  if (b === 2 || b === 3) {
    heading(
      g,
      'Where did the output budget go?',
      'OPENAI RESPONSES API   /   800-TOKEN OUTPUT LIMIT',
      'panel',
    );
    const p = q(3, 'Each internal reasoning token', 2.5),
      used = Math.round(800 * p);
    label(g, 'INTERNAL REASONING TOKENS', 83, 239, pale);
    rect(g, 80, 280, 1115, 81, '#0b2129', 8, '#73908c', 2);
    if (used) rect(g, 85, 285, (1105 * used) / 800, 71, copper, 5);
    txt(g, used + ' / 800', 1190, 226, 35, cream, 'right', 'Mono');
    plate(g, 83, 421, 646, 125, '#d1dbce');
    label(g, 'DECISION RECORD', 118, 460, teal);
    txt(g, 'Empty', 118, 505, 33, ink, 'left', 'Serif');
    if (q(3, 'Mark the response incomplete'))
      badge(g, 'Incomplete response', 827, 469, 330, copper);
    if (b === 3)
      label(g, 'OpenAI Responses API reports usage and keeps raw reasoning private.', 83, 627, pale);
  } else if (b >= 4) {
    heading(g, 'An audit of the release', 'OBSERVATIONS AN OPERATOR CAN REPLAY', 'panel');
    const rows = [
      ['Input', 'ci-1481 · all three service flags true'],
      ['Model record', 'Scan clear = false · action = merge'],
      ['Validation', '2 matching values out of 3'],
      ['Outcome', 'Policy permits merge'],
    ];
    rows.forEach(([k, v], i) => {
      const yy = 224 + 91 * i;
      label(g, k, 83, yy, mint, 'left', 23);
      txt(g, v, 371, yy, 29, cream);
      line(g, 83, yy + 37, 1190, yy + 37, '#466468');
    });
    if (b === 5) label(g, 'Intermediate text: restrict access and retention.', 82, 633, copper);
  } else {
    heading(g, 'What can the operator inspect?', null, 'panel');
    const rows = [
      ['Prompted steps', 'Generated explanation'],
      ['Native reasoning', 'Internal token usage'],
      ['Provider summary', 'Description of internal work'],
      ['Decision record', 'Source values and proposed action'],
    ];
    rows.forEach(([k, v], i) => {
      const y = 191 + i * 101,
        selected = b >= 4 ? i === 3 : i === (b === 1 ? 2 : 0);
      rect(g, 75, y - 28, 1130, 66, selected ? '#32595a' : '#19373e', 8);
      label(g, k, 101, y + 5, selected ? mint : pale, 'left', 22);
      txt(g, v, 511, y + 4, 29, cream);
    });
    txt(
      g,
      b >= 4
        ? 'Audit the inputs, checked fields, observations and outcome.'
        : 'An explanation can omit a factor that influenced the answer.',
      76,
      641,
      29,
      cream,
      'left',
      'Serif',
    );
  }
}
export function ballots(g, c) {
  const q = (b, p, t = 0) => cue(c, b, p, t),
    b = c.beat.beatIndex;
  const threshold = q(3, 'eighty percent') ? 0.8 : trialMinimumShare;
  const result = canonicalVote(replies, threshold);
  const counted = q(3, 'Yes'),
    needs = q(2, 'sixty percent support');
  field(g, 'paper');
  heading(g, 'Five replies, five seats', 'FINAL ACTIONS   /   ONE RELEASE REQUEST');
  const shown =
    b > 0 ? 5 : q(1, 'last asks') ? 5 : q(1, 'fourth asks') ? 4 : q(1, 'first three') ? 3 : 0;
  replies.forEach((s, i) => {
    const y = 202 + i * 82;
    rect(g, 70, y - 23, 571, 58, '#fff9e7', 4, '#b7b49f');
    label(g, String(i + 1).padStart(2, '0'), 90, y + 5, muted);
    txt(g, s, 151, y + 6, 25, ink, 'left', 'Mono');
    if (i < shown) {
      arrow(g, 653, y + 6, 708, y + 6, muted);
      const a = canonicalAction(s);
      badge(
        g,
        act(a),
        733,
        y - 16,
        154,
        a === 'merge_release' ? '#a3d1bb' : a ? copper : '#e5b1a4',
      );
    }
  });
  line(g, 925, 178, 925, 610, '#b2b7a4');
  if (needs) {
    label(g, 'MINIMUM', 963, 232);
    txt(g, threshold * 100 + '%', 964, 284, 56, ink, 'left', 'Serif');
    label(g, Math.ceil(5 * threshold) + ' of 5 needed', 963, 343);
  }
  if (counted) {
    txt(g, '3 / ' + result.total, 964, 452, 46, teal, 'left', 'Mono');
    badge(
      g,
      act(result.decision),
      964,
      518,
      225,
      result.decision === 'abstain' ? copper : '#a3d1bb',
    );
  }
  if (b === 4) {
    label(g, 'FINAL ACTION REQUIRED', 70, 636, red, 'left', 17);
    txt(
      g,
      '“Never merge” contains the word merge. It supplies no allowed action.',
      70,
      668,
      22,
      ink,
    );
  } else if (b >= 3) label(g, 'Agreement still needs a policy check.', 71, 656, muted);
}
export function sampleCosts(g, c) {
  const b = c.beat.beatIndex,
    q = (n, p) => cue(c, n, p);
  field(g, 'paper');
  if (b === 2 || b === 3) {
    heading(
      g,
      'Forty paths on a math benchmark',
      'WANG ET AL.   /   PALM   /   SEPARATE EXPERIMENT',
    );
    for (const [i, [k, v]] of [
      ['Greedy CoT', 56.5],
      ['Self-consistency', 74.4],
    ].entries()) {
      const yy = 280 + i * 145;
      txt(g, k, 67, yy, 30);
      rect(g, 370, yy - 22, 740, 44, '#d7dac8', 5);
      rect(g, 370, yy - 22, 7.4 * v, 44, i ? teal : muted, 5);
      txt(g, v + '%', 390 + 7.4 * v, yy, 30, ink, 'left', 'Mono');
    }
    txt(
      g,
      'Vote share and measured accuracy answer different questions.',
      69,
      606,
      31,
      ink,
      'left',
      'Serif',
    );
    return;
  }
  heading(g, 'The five-release trial', 'HANDWRITTEN SAMPLE REPLIES   /   SAME EXPECTED ACTIONS');
  const cols = [70, 365, 779, 1016];
  const voteColumn = `Vote (min ${minimumVotes} of ${repliesPerRelease})`;
  ['Release', 'Five replies', 'Expected', voteColumn].forEach((v, i) =>
    label(g, v.toUpperCase(), cols[i], 179),
  );
  const names = [
    'Clean release',
    'Scan failed',
    'Review missing',
    'Shared mistake',
    'Weak support',
  ];
  ledger.forEach((r, i) => {
    const y = 229 + i * 68,
      hot = (b === 0 && i === 3) || (b === 1 && i === 4);
    if (hot) rect(g, 53, y - 29, 1165, 58, '#ecdbb4', 7);
    txt(g, names[i], cols[0], y, 25);
    r.samples.forEach((v, j) => {
      const a = canonicalAction(v);
      disk(g, cols[1] + j * 67, y, 23, a === 'merge_release' ? teal : a ? navy : '#aa8773');
      txt(
        g,
        a === 'merge_release' ? 'M' : a ? 'R' : '×',
        cols[1] + j * 67,
        y,
        23,
        cream,
        'center',
        'Mono',
      );
    });
    txt(g, act(r.expected), cols[2], y, 24);
    txt(g, act(r.vote), cols[3], y, 24, r.vote === r.expected ? teal : red, 'left', 'Sans', 600);
  });
  label(g, 'M = merge   R = manual review   × = rejected', 70, 574);
  if (q(2, 'two releases right'))
    txt(g, 'First reply   ' + winners('first') + '/5 correct · 5 samples', 70, 642, 28, ink);
  if (q(2, 'three releases right'))
    txt(g, 'Vote   ' + winners('vote') + '/5 correct · 25 samples', 700, 642, 28, teal);
}
function componentLane(g, y, source, check, active) {
  const col = active ? ink : '#9b9b8a';
  txt(g, source, 83, y, 34, col, 'left', 'Serif');
  line(g, 310, y, 476, y, active ? teal : '#a7aa9d', 4);
  disk(g, 494, y, 13, active ? teal : paper, active ? teal : '#a7aa9d', 3);
  if (active) {
    arrow(g, 520, y, 729, y, teal);
    txt(g, check, 760, y, 35, ink, 'left', 'Serif');
  } else {
    txt(g, 'omitted', 542, y, 25, red);
    txt(g, 'No log-schema check', 760, y, 31, red, 'left', 'Serif');
  }
}
export function dependencies(g, c) {
  const b = c.beat.beatIndex,
    q = (n, p) => cue(c, n, p);
  field(g, 'paper');
  if (b < 2) {
    heading(g, 'A list becomes the next input', 'LEAST-TO-MOST   /   COMPONENTS FROM THE DIFF');
    label(g, 'Changed component', 83, 225);
    label(g, 'Derived check', 760, 225);
    componentLane(g, 325, 'Authentication', 'Security check', true);
    componentLane(g, 460, 'Logging', 'Log-schema check', !q(1, 'Drop logging'));
    txt(g, 'Verify the component list before deriving checks.', 82, 619, 32, ink, 'left', 'Serif');
  } else {
    heading(g, 'One report has two parents', 'GRAPH OF THOUGHTS   /   PARALLEL FINDINGS');
    const node = (x, y, w, title, sub) => {
      rect(g, x, y, w, 96, cream, 9, muted, 2);
      txt(g, title, x + 19, y + 31, 25, ink, 'left', 'Serif');
      label(g, sub, x + 19, y + 68, muted, 'left', 16);
    };
    node(61, 318, 209, 'Shared prefix', 'Release facts');
    arrow(g, 272, 344, 361, 263, teal);
    arrow(g, 272, 382, 361, 463, teal);
    node(374, 192, 265, 'Security review', 'Own history');
    node(374, 429, 265, 'Performance review', 'Own history');
    arrow(g, 641, 241, 761, 336, teal);
    arrow(g, 641, 477, 761, 386, teal);
    node(774, 310, 208, 'Report v1', 'Two findings');
    if (q(3, 'ask for a revision')) {
      arrow(g, 982, 356, 1040, 356, red);
      node(1046, 309, 175, 'Report v2', 'Rescore both');
    }
    txt(
      g,
      b === 4 ? 'The join waits for both parents.' : 'Shared prefix, separate continuations.',
      66,
      623,
      32,
      ink,
      'left',
      'Serif',
    );
  }
}
export function checkPrompts() {
  assert.deepEqual(replies.map(canonicalAction), [
    'merge_release',
    'merge_release',
    'merge_release',
    'manual_review',
    null,
  ]);
  assert.deepEqual(
    [
      canonicalVote(replies).share,
      canonicalVote(replies).decision,
      canonicalVote(replies, 0.8).decision,
    ],
    [0.6, 'merge_release', 'abstain'],
  );
  assert.deepEqual(
    ledger.map((r) => r.vote),
    ['merge_release', 'manual_review', 'manual_review', 'merge_release', 'abstain'],
  );
  assert.deepEqual([minimumVotes, repliesPerRelease], [3, 5]);
  assert.ok(ledger.every((r) => r.samples.length === repliesPerRelease));
  assert.deepEqual([winners('first'), winners('vote')], [2, 3]);
  for (const samples of [[], ['force'], ['merge_release', 'manual_review']])
    assert.equal(canonicalVote(samples).decision, 'abstain');
  assert.throws(() => canonicalVote(replies, true));
}
