import {
  C,
  base,
  card,
  rect,
  line,
  type,
  pen,
  mono,
  mid,
  stamp,
  circle,
  heading,
  phase,
  ease,
  sheet,
  row,
  steps,
  poly,
} from './atelier.mjs';
import { candidateGate } from '../../../films/agent-evaluation/model.mjs';
export const surfaces = [
  ['SWE-bench', 'Repository patch', 'Repository tests', 'test'],
  ['WebArena', 'Browser task', 'Answer, URL or page state', 'web'],
  ['OSWorld', 'Desktop action', 'File, setting or app data', 'file'],
  ['GAIA', 'Question answering', 'Normalized reference answer', 'answer'],
  ['Terminal-Bench', 'Terminal task', 'Task verifier + resource limits', 'term'],
  ['Tau-Bench', 'User interaction', 'Final database changes', 'db'],
  ['AgentBench', 'Multiple environments', 'Environment-specific score', 'env'],
];
function artifact(c, style, x, y) {
  const w = 463,
    h = 252;
  if (style === 'db') {
    for (let i = 2; i >= 0; i--) {
      const Y = y + i * 66;
      rect(c, x, Y, w, 99, C.green);
      c.fillStyle = i === 0 ? C.light : C.sea;
      c.beginPath();
      c.ellipse(x + w / 2, Y, w / 2, 37, 0, 0, Math.PI * 2);
      c.fill();
    }
    mid(c, 'hold-17   /   B7', x + w / 2, y + 140, 44, C.sheet);
    return;
  }
  if (style === 'file' || style === 'env') {
    poly(
      c,
      [
        [x, y + 26],
        [x + 129, y + 26],
        [x + 175, y + 65],
        [x + w, y + 65],
        [x + w, y + h],
        [x, y + h],
      ],
      C.wood,
    );
    rect(c, x + 34, y + 7, w - 73, h - 47, C.sheet);
    rect(c, x, y + 99, w, h - 68, C.gold, 6);
    mid(c, style === 'file' ? 'saved file' : 'task state', x + w / 2, y + 200, 46);
    return;
  }
  rect(c, x, y, w, h, C.ink, 8);
  rect(c, x + 14, y + 50, w - 28, h - 65, style === 'term' ? C.night : C.sheet, 3);
  for (let i = 0; i < 3; i++) circle(c, x + 23 + i * 20, y + 25, 5, C.gold);
  if (style === 'test') {
    mono(c, 'patch.diff', x + 40, y + 113, 34);
    mono(c, 'tests pass', x + 40, y + 194, 39, C.green);
  }
  if (style === 'web') {
    pen(c, 'River Stories', x + 34, y + 130, 43);
    mono(c, '/catalog/B7', x + 33, y + 193, 28);
  }
  if (style === 'answer') {
    mono(c, 'reference   3', x + 30, y + 130, 36);
    mono(c, 'answer      3', x + 30, y + 195, 36, C.green);
  }
  if (style === 'term') {
    mono(c, '$ task', x + 38, y + 123, 38, C.sheet);
    mono(c, 'file matches', x + 38, y + 193, 35, C.light);
  }
}
export function benchmarks(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  if (b <= 3) {
    const i =
      b === 0
        ? phase(k, 0, 'WebArena')
          ? 1
          : 0
        : b === 1
          ? 2
          : b === 2
            ? phase(k, 2, 'Tau-Bench')
              ? 5
              : phase(k, 2, 'Terminal-Bench')
                ? 4
                : 3
            : phase(k, 3, 'AgentBench')
              ? 6
              : 5;
    const [name, surface, verifier, kind] = surfaces[i];
    heading(c, 'BENCHMARK SPECIMEN', name);
    artifact(c, kind, 231, 434);
    sheet(c, 868, 305, 911, 485, 'What the verifier observes');
    row(c, 'Task', surface, 909, 481, 828);
    pen(c, verifier, 910, 614, 47, C.green, 818);
    const details = [
      'Patched repository and its tests',
      'Some answer checks use a model judge',
      'Original main suite: Ubuntu',
      'Number, string or ordered list',
      'Pinned task and time limit',
      'Compare with the goal state',
      'Record the individual environment',
    ];
    mono(c, details[i], 909, 717, 29, C.muted, 818);
    if (i === 5 && b === 3) stamp(c, 'Required confirmation is missing', 117, 853, C.red);
    return;
  }
  heading(
    c,
    'COMPARABLE RESULTS',
    b === 6 ? 'Name the desktop suite precisely' : 'Pin the complete experiment',
  );
  if (b === 4) {
    const records = [
      ['Environment', 'Task IDs, split, image and permissions'],
      ['Model snapshot', 'Exact model ID and revision'],
      ['Agent scaffold', 'Prompt, tools, action loop, stop rule'],
      ['Measurement', 'Harness and scorer revisions, budgets'],
      ['Repetition', 'Trial count, simulator, date'],
    ];
    sheet(c, 146, 305, 1614, 565, 'Configuration kept with the score');
    records.forEach(([a, v], i) => {
      mono(c, a, 206, 458 + i * 86, 35);
      pen(c, v, 745, 464 + i * 86, 45, C.ink, 940);
    });
    return;
  }
  const names =
    b === 6 ? ['OSWorld', 'OSWorld-Verified'] : ['Terminal-Bench 2.1', 'Terminal-Bench 4.0'];
  [0, 1].forEach((i) => {
    const x = 128 + i * 881;
    sheet(c, x, 373, 788, 390, names[i]);
    pen(c, i ? 'Different task suite' : 'Recorded trial set', x + 37, 568, 49);
    mono(
      c,
      i ? 'Run the frozen candidate' : 'Preserve original result',
      x + 37,
      681,
      32,
      i ? C.green : C.muted,
    );
  });
  mono(
    c,
    b === 6
      ? 'Record which suite supplied each result.'
      : 'Article catalog snapshot   /   October 2026',
    139,
    887,
    32,
  );
}
function folder(c, x, y, w, label, color) {
  poly(
    c,
    [
      [x, y + 20],
      [x + w * 0.37, y + 20],
      [x + w * 0.45, y + 50],
      [x + w, y + 50],
      [x + w, y + 182],
      [x, y + 182],
    ],
    color,
  );
  type(c, label, x + 19, y + 132, 40, C.sheet, 'Sans', 'left', 600, w - 38);
}
export function harness(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  if (b === 0) {
    heading(c, 'NEXT TRIAL   /   CLEAN CONTAINER', 'What survived the restart?');
    const restore = phase(k, 0, 'Restore the remote database'),
      clear = phase(k, 0, 'Clear remembered');
    sheet(c, 111, 325, 802, 447, 'Disposable container');
    row(c, 'Process', 'new', 150, 482, 725);
    row(c, 'Cache', clear ? 'empty' : 'B8 lookup', 150, 583, 725);
    row(c, 'Permission', clear ? 'expired' : 'old permit', 150, 688, 725);
    sheet(c, 997, 325, 807, 447, 'Remote library');
    row(c, 'Saved hold', restore ? 'none' : 'hold-17', 1038, 503, 724);
    row(c, 'Snapshot', restore ? 'v2' : 'v3', 1038, 625, 724);
    return;
  }
  if (b === 1) {
    heading(c, 'HARNESS LIFECYCLE', 'Control the run from outside');
    steps(c, ['Freeze task', 'Restore', 'Bound run', 'Score', 'Tear down'], { y: 421 });
    mono(
      c,
      'Configured isolation   /   Firecracker microVM or gVisor application kernel',
      110,
      795,
      33,
      C.muted,
      1698,
    );
    return;
  }
  const outside =
    b === 4
      ? ease(phase(k, 4, 'Move the reference', 1.05))
      : b === 2
        ? ease(phase(k, 2, 'Move reference answers', 1.05))
        : 1;
  heading(
    c,
    'SCORER INTEGRITY',
    b >= 4 ? 'Does the candidate have access?' : 'Keep the scoring materials independent',
  );
  rect(c, 112, 333, 825, 473, C.rose, 8);
  rect(c, 969, 333, 830, 473, C.light, 8);
  pen(c, 'Candidate mount', 148, 414, 54);
  pen(c, 'Harness storage', 1007, 414, 54);
  const X = 260 + 860 * outside;
  folder(c, X, 454, 492, 'Reference answers', C.wood);
  if (b < 4 && phase(k, 2, 'verifier’s dependencies'))
    mono(c, 'Verifier dependencies + results', 1009, 746, 31, C.green, 741);
  if (b === 4) {
    if (outside === 0) mono(c, '/agent/gold/answers', 149, 458, 29, C.red);
    if (outside === 1) mono(c, '/harness/gold/answers', 1008, 458, 29, C.green);
    if (outside === 0) stamp(c, 'Layout fails', 150, 693, C.red, 706);
    if (outside === 1) stamp(c, 'Path layout passes', 1007, 693, C.green, 710);
    mono(c, 'Lexical path check   /   symbolic links unresolved', 120, 917, 34);
  }
  if (b === 3 || b === 5) stamp(c, 'Test actual access as the candidate', 119, 868, C.ink, 1250);
}
export const required = ['Lookup', 'Open review', 'Verify'];
export function repairedVariant(mode = 'valid') {
  const cost = { valid: 0.061, reverse: 0.061, expensive: 0.09, invalid: NaN, original: 0.041 }[
    mode
  ];
  const calls =
    mode === 'original'
      ? ['Lookup', 'Promote', 'Verify']
      : mode === 'reverse'
        ? [...required].reverse()
        : [...required];
  const final = mode === 'original' ? 'model_promoted' : 'security_review_opened';
  const okOrder = calls.length === required.length && calls.every((v, i) => v === required[i]),
    okCost = Number.isFinite(cost) && cost >= 0 && cost <= 0.08;
  return {
    cost,
    calls,
    final,
    okOrder,
    okCost,
    passed: okOrder && okCost && final === 'security_review_opened',
  };
}
const evaluation = [
  { name: 'promote-221', cost: 0.032, passed: true, critical: false },
  { name: 'appeal-009', cost: 0.038, passed: true, critical: false },
  { name: 'attack-014', cost: 0.041, passed: repairedVariant('original').passed, critical: true },
];
export const suite = {
  runs: evaluation.length,
  passes: evaluation.filter((r) => r.passed).length,
  critical: evaluation.filter((r) => r.critical).length,
  allThree: 1 / 3,
  cpst: evaluation.reduce((n, r) => n + r.cost, 0) / evaluation.filter((r) => r.passed).length,
};
export function release(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  if (b === 0 || b === 4) {
    heading(
      c,
      'CANDIDATE REPORT',
      b === 0 ? 'Attach the evidence to its producer' : 'Trace each claim to its source',
    );
    sheet(c, 150, 310, 1630, 549, 'promotion-agent-v7    /    promotion-eval-v5');
    const lines =
      b === 0
        ? [
            ['Identity', 'Model snapshot, prompt, tools and suite'],
            ['Exposure', 'Development cases and untouched tasks'],
            ['Results', 'Outcomes, permits, grouped repeats, cost and p95'],
            ['Diagnostics', 'Judge calibration and failure trace IDs'],
          ]
        : [
            ['Outcome', 'Independent state read'],
            ['Authority', 'Matching host permit before dispatch'],
            ['Reliability', 'Workload sample and repeated task IDs'],
            ['Release holdout', 'Task exposure history'],
          ];
    lines.forEach(([l, v], i) => {
      mono(c, l, 197, 470 + i * 101, 32);
      pen(c, v, 668, 476 + i * 101, 42, C.ink, 1030);
    });
    return;
  }
  if (b === 1) {
    const nan = phase(k, 1, 'rate is NaN'),
      bool = phase(k, 1, 'A Boolean') && !phase(k, 1, 'Rates must be finite');
    const data = {
      ...suite,
      ...(bool ? { critical: true } : {}),
      ...(nan ? { allThree: NaN } : {}),
    };
    const result = candidateGate(data);
    heading(c, 'REPORT VALIDATION', 'Validate values before comparing them');
    sheet(c, 171, 333, 1553, 483, 'Input to the release gate');
    row(c, 'Critical failure count', String(data.critical), 214, 514, 1449, bool ? C.red : C.ink);
    row(c, 'All-three rate', nan ? 'NaN' : '1 / 3', 214, 618, 1449, nan ? C.red : C.ink);
    stamp(
      c,
      result.valid ? 'Inputs in range' : 'Invalid evidence',
      213,
      691,
      result.valid ? C.green : C.red,
      860,
    );
    return;
  }
  heading(c, 'PROMOTION SUITE   /   LOCAL POLICY', 'Would this report clear all four gates?');
  const gate = candidateGate(suite),
    scored = phase(k, 2, 'Two of three episodes'),
    repeats = phase(k, 3, 'One of three tasks'),
    cost = phase(k, 3, 'five point five five');
  if (b === 2 && phase(k, 2, 'Read across the rows')) {
    const descriptions = [
      'Promotion request created',
      'Release review opened',
      'Forbidden promotion',
    ];
    evaluation.forEach((r, i) => {
      const y = 397 + 143 * i;
      card(c, 128, y - 69, 1642, 111, C.sheet);
      mono(c, r.name, 165, y, 38);
      pen(
        c,
        descriptions[i],
        584,
        y,
        47,
        i === 2 && phase(k, 2, 'bypasses approval') ? C.red : C.ink,
        813,
      );
      mono(c, (r.cost * 100).toFixed(1) + '¢', 1526, y, 40);
    });
    if (scored) mono(c, suite.passes + ' of ' + suite.runs + ' pass', 139, 889, 39, C.ink);
    if (phase(k, 2, 'bypasses approval')) stamp(c, '1 critical failure', 935, 829, C.red);
    return;
  }
  const cols = [
    ['Regression passes', '3 / 3 required', suite.passes + ' / ' + suite.runs, scored],
    ['Critical failures', '0 allowed', String(suite.critical), phase(k, 2, 'bypasses approval')],
    ['All-three reliability', '≥ 0.95', '1 / 3', repeats],
    ['Cost per success', '≤ 8¢', (suite.cpst * 100).toFixed(2) + '¢', cost],
  ];
  cols.forEach(([l, goal, v, show], i) => {
    const y = 356 + i * 126;
    card(c, 115, y - 55, 1674, 102, C.sheet);
    pen(c, l, 153, y + 15, 43);
    mono(c, goal, 764, y + 14, 35);
    if (show) {
      type(c, v, 1251, y + 14, 43, C.ink, 'Mono');
      mid(c, gate.checks[i] ? 'Pass' : 'Fail', 1649, y + 14, 43, gate.checks[i] ? C.green : C.red);
    }
  });
  if (phase(k, 3, 'block release')) stamp(c, 'Release blocked', 116, 867, C.red);
  if (cost) mono(c, '11.1¢ spent  /  2 successful runs', 840, 917, 34);
}
export function repair(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  if (b <= 1) {
    const mode =
      b === 0
        ? phase(k, 0, 'reverse its required actions')
          ? 'reverse'
          : phase(k, 0, 'opens a security review')
            ? 'valid'
            : 'original'
        : phase(k, 1, 'cost of NaN')
          ? 'invalid'
          : phase(k, 1, 'raise the cost')
            ? 'expensive'
            : 'valid';
    const f = repairedVariant(mode);
    heading(c, 'REGRESSION   /   ATTACK-014', 'Run the same scorer after each change');
    steps(c, f.calls, {
      y: 323,
      colors: [C.sheet, mode === 'original' ? C.rose : C.sheet, C.sheet],
    });
    row(c, 'Final state', f.final, 130, 634, 1000);
    row(
      c,
      'Row cost',
      Number.isNaN(f.cost) ? 'NaN' : (f.cost * 100).toFixed(1) + '¢',
      130,
      750,
      1000,
      f.okCost ? C.green : C.red,
    );
    stamp(
      c,
      f.passed
        ? 'Record passes'
        : mode === 'original'
          ? 'Forbidden promotion'
          : !f.okOrder
            ? 'Wrong action order'
            : 'Cost outside contract',
      1200,
      598,
      f.passed ? C.green : C.red,
      600,
    );
    mono(
      c,
      'Budget ≤ 8¢    /    regression rows passing: ' + (2 + Number(f.passed)) + ' of 3',
      131,
      888,
      33,
    );
    return;
  }
  heading(
    c,
    'EVIDENCE ORIGIN',
    b === 2 ? 'How many new agent trials?' : 'Collect evidence on untouched episodes',
  );
  sheet(c, 141, 349, 771, 420, 'Regression fixture');
  row(c, 'Record', 'attack-014', 180, 527, 688);
  row(c, 'Producer', 'edited by hand', 180, 650, 688);
  sheet(c, 1001, 349, 772, 420, 'Untouched trials');
  if (phase(k, 2, 'number is zero')) {
    pen(c, '0', 1047, 638, 147, C.red);
    mono(c, b === 2 ? 'new observations' : 'awaiting fresh runs', 1196, 618, 32, C.ink, 525);
  }
  if (b === 3)
    mono(
      c,
      'Freeze candidate   /   clean state   /   declared budget   /   retain every outcome',
      132,
      913,
      32,
      C.muted,
      1650,
    );
}
