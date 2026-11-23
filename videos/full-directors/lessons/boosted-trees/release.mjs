import {
  APRIL_TREE_TRACE,
  APRIL_SCORED_ROWS,
  MAY_EVIDENCE,
} from '../../../films/boosted-trees/fixtures.mjs';
import { sigmoid, twoFeatureCredits } from '../../../films/boosted-trees/arithmetic.mjs';
import { stored, workload } from './policy.mjs';
import { num, mix, stem } from './studio.mjs';

const game = [0, 2, 1, 5];
export const credit = twoFeatureCredits(game);
export const logits = [-1, 0.42, 0.26];
export const finalLogit = logits.reduce((a, x) => a + x, 0);
export function attribution(v) {
  const { b, c, cue, end, txt, mono, line } = v;
  if (b <= 2) {
    v.heading('One alert   /   attribution', 'What does it mean to give a feature credit?');
    if (b === 1) {
      const columns = [
        ['Gain', 'Loss saved'],
        ['Split count', 'Times used'],
        ['Impurity decrease', 'Weighted reduction'],
      ];
      columns.forEach(([label, unit], i) => {
        const x = 135 + i * 589;
        txt(label, x, 382, 46, c.blue);
        line(x, 449, x + 475, 449, c.grid, 3);
        txt(unit, x, 525, 36);
      });
      v.ticket(
        490,
        704,
        935,
        127,
        'One job’s signed contribution',
        'Needs a local explanation game',
        c.gold,
      );
    } else {
      [
        ['Background', 'Which jobs are typical?'],
        ['Missing feature', 'How is it marginalized?'],
        ['Output', 'Raw score or probability?'],
      ].forEach(([a, s], i) =>
        v.ticket(130 + i * 582, 442, 523, 211, a, s, [c.blue, c.green, c.gold][i]),
      );
      txt('These choices define the values we average.', 135, 818, 43);
    }
    return;
  }
  if (b <= 4) {
    v.heading('Two-feature game   /   raw-score units', 'Add each feature in both orders');
    const X = (z) => 503 + 209 * z;
    [
      [0, 2, 5],
      [0, 1, 5],
    ].forEach((values, i) => {
      const y = 435 + i * 248;
      txt(i ? 'B then A' : 'A then B', 120, y, 45);
      const names = i ? ['B', 'A'] : ['A', 'B'];
      values.slice(1).forEach((to, j) => {
        const from = values[j],
          color = names[j] === 'A' ? c.blue : c.gold;
        v.rect(X(from), y - 29, X(to) - X(from), 57, color);
        mono(names[j] + '  +' + (to - from), (X(from) + X(to)) / 2, y, 37, c.bg, 'center');
      });
      values.forEach((val) => {
        line(X(val), y + 32, X(val), y + 49, c.muted, 3);
        mono(val, X(val), y + 78, 30, c.muted, 'center');
      });
    });
    if (b === 4 && cue(4, 'Base zero'))
      mono(
        'Base ' +
          credit.base +
          '    +    A ' +
          credit.A +
          '    +    B ' +
          credit.B +
          '    =    ' +
          credit.output,
        140,
        926,
        42,
      );
    return;
  }
  if (b <= 6) {
    v.heading('TreeSHAP   /   path-dependent game', 'Carry branch cover along the path');
    const r = [852, 380],
      left = [454, 676],
      right = [1240, 676];
    stem(v, ...r, ...left, c.blue);
    stem(v, ...r, ...right, c.gold);
    v.dot(...r, 27, c.ink);
    txt('Split on A  ·  cover 10', r[0], r[1] - 73, 43, c.ink, 'center');
    [
      [left, 6, c.blue],
      [right, 4, c.gold],
    ].forEach(([[x, y], n, col]) => {
      v.dot(x, y, 24, col);
      mono('cover ' + n, x, y + 80, 45, col, 'center');
    });
    if (b === 5)
      txt(
        'Extend and unwind the path for each feature’s coalition weights.',
        145,
        916,
        37,
        c.muted,
      );
    else mono('O(T L D²)    trees × max leaves × max depth²', 146, 911, 41, c.ink);
    return;
  }
  if (b <= 8) {
    v.heading('Separate raw-logit example', 'Add in log odds, then convert the total');
    const X = (z) => 218 + (z + 1.1) * 1620;
    const subtotal = logits[0] + logits[1];
    line(X(-1), 573, X(finalLogit), 573, c.grid, 3);
    [
      [logits[0], subtotal, '+0.42', c.blue],
      [subtotal, finalLogit, '+0.26', c.gold],
    ].forEach(([a, z, s, col], i) => {
      const y = 490 - i * 78;
      v.rect(X(a), y, X(z) - X(a), 44, col);
      mono(s, (X(a) + X(z)) / 2, y - 47, 44, col, 'center');
      line(X(z), y + 45, X(z), 574, col, 3, [9, 7]);
    });
    [
      [-1, 'Base −1.00'],
      [finalLogit, 'Total −0.32'],
    ].forEach(([z, s]) => mono(s, X(z), 637, 40, c.ink, 'center'));
    if (b === 8 || cue(7, 'The bars add')) {
      v.serif('σ(−0.32)', 549, 810, 64, c.ink);
      mono('→  ' + num(sigmoid(finalLogit)), 1024, 811, 62, c.blue);
    }
    return;
  }
  v.heading('Escalation flag', 'What evidence would establish an intervention effect?');
  v.ticket(138, 360, 654, 150, 'Flag raised', 'Check lineage and freshness', c.gold);
  stem(v, 532, 510, 432, 727, c.grid);
  stem(v, 532, 510, 1272, 727, c.grid);
  v.ticket(187, 716, 498, 137, 'Control', 'Usual handling', c.blue);
  v.ticket(1027, 716, 498, 137, 'Intervention', 'Tested handling', c.green);
  txt('Compare outcomes under controlled assignment.', 166, 945, 37, c.muted);
}
const structure = [
  { trees: 160, nodes: 1100, depth: 2 },
  { trees: 50, nodes: 350, depth: 2 },
];
export const requestTime = (scoring) => 18 + scoring;
export function serving(v) {
  const { c, b, cue, end, txt, mono, line } = v;
  if (b === 1) {
    v.heading(
      'April job 0   /   heartbeat age 4 hours',
      'Follow one score through the selected trees',
    );
    const trace = APRIL_TREE_TRACE,
      progress = cue(1, 'Follow this job', 3);
    const count = Math.floor(progress * trace.stages.length),
      rows = trace.stages.slice(0, count);
    const value = count ? rows.at(-1).raw : trace.initialLogit;
    const { X, Y } = v.axis(
      165,
      809,
      1105,
      450,
      50,
      2.75,
      [0, 10, 20, 30, 40, 50],
      [0, 1, 2],
      String,
      (x) => num(x - 2.5),
    );
    const P = (z) => Y(z + 2.5);
    txt('Running logit', 158, 300, 36, c.muted);
    v.path([[X(0), P(trace.initialLogit)], ...rows.map((r) => [X(r.tree), P(r.raw)])], c.blue, 6);
    v.dot(X(count), P(value), 14, c.gold);
    mono('Tree ' + count, 1386, 430, 48, c.blue);
    mono(num(value, 3), 1386, 554, 65);
    txt('Trees added', 691, 923, 35, c.muted, 'center');
    if (count === 50) {
      txt('Miss score', 1388, 690, 34, c.muted);
      mono(num(sigmoid(value)), 1388, 767, 54, c.gold);
    }
    return;
  }
  if (b <= 3) {
    v.heading('Stored structure   /   depth 2', 'Count the possible comparisons per row');
    const names = ['Trees', 'Nodes', 'Comparisons ≤'];
    names.forEach((s, i) => {
      const y = 370 + i * 188;
      txt(s, 132, y + 33, 44);
      const vals = structure.map((r) => [r.trees, r.nodes, r.trees * r.depth][i]);
      vals.forEach((val, j) => {
        const w = (799 * val) / vals[0];
        v.rect(625, y + j * 64, w, 37, j ? c.blue : c.muted);
        mono(val, 654 + w, y + 19 + j * 64, 32);
      });
    });
    txt('Search model', 628, 938, 33, c.muted);
    txt('Selected model', 1072, 938, 33, c.blue);
    return;
  }
  if (b <= 5) {
    v.heading(
      'Serial request worksheet   /   milliseconds',
      'Which part of the request got faster?',
    );
    const edited = cue(4, 'How much of the whole'),
      answer = cue(5, 'The request now'),
      x = 277,
      unit = 62;
    [2, 1].forEach((score, i) => {
      if (i && !edited) return;
      const y = 420 + i * 230;
      txt(i ? 'Proposed' : 'Before', 96, y + 44, 34, c.muted);
      v.rect(x, y, 18 * unit, 92, c.blue);
      v.rect(x + 18 * unit, y, score * unit, 92, c.gold);
      txt('Feature work  ·  18 ms', x + 42, y + 45, 44, c.bg);
      mono(score, x + (18 + score / 2) * unit, y + 45, 39, c.bg, 'center');
      if (i === 0 || answer) mono(requestTime(score) + ' ms', x + unit * 20 + 35, y + 45, 41);
      else mono('? ms', x + unit * 20 + 35, y + 45, 41, c.gold);
    });
    if (answer) mono('1 / 20 = 5% saved', x, 913, 46, c.gold);
    return;
  }
  v.heading(
    'Serving artifact',
    b === 6
      ? 'A converter produces a new candidate'
      : b === 7
        ? 'Replay the serving contract'
        : 'Pin the loading environment',
  );
  if (b === 6) {
    [
      [150, 'Fitted trees', 'Model and ordered features'],
      [755, 'Treelite', 'Exchange representation'],
      [1356, 'TL2cgen', 'Generated native code'],
    ].forEach(([x, a, s]) => v.ticket(x, 445, 445, 175, a, s, c.blue));
    txt('ONNX is another route for supported estimators.', 152, 803, 42, c.muted);
  } else if (b === 7) {
    [
      ['Scores', 'Especially at the cutoff'],
      ['Routes', 'NaNs and feature order'],
      ['Load test', 'Slices and request latency'],
    ].forEach(([a, s], i) =>
      v.ticket(142 + i * 592, 457, 512, 187, a, s, [c.blue, c.red, c.gold][i]),
    );
  } else {
    [
      ['Loader', 'Trusted source for pickle-style loading'],
      ['Types', 'Inspect supported types with skops'],
      ['Runtime', 'Pin Python, scikit-learn and dependencies'],
    ].forEach(([a, s], i) => {
      const y = 399 + i * 182;
      txt(a, 150, y, 43, c.muted);
      line(447, y, 588, y, c.grid, 4);
      txt(s, 644, y, 44);
    });
  }
}

export const probes = [0, 96].map((id) => APRIL_SCORED_ROWS.find((r) => r.id === id));
export function queue(inclusive) {
  return probes.filter((r) => (inclusive ? r.score >= stored : r.score > stored));
}
export function rank(rows) {
  return [...rows].sort((a, b) => b.score - a.score);
}
function parity(v) {
  const { b, c, cue, txt, mono, line } = v;
  const strict = cue(5, 'Switch the comparison') && !cue(5, 'Replay both jobs');
  const eligible = queue(!strict);
  v.heading(
    'April parity probes   /   identical scores and cutoff',
    'Which tickets reach the operator?',
  );
  txt('Candidate score', 135, 306, 36, c.muted);
  const Y = (p) => 714 - (p - stored) * 6580;
  line(130, Y(stored), 1048, Y(stored), c.gold, 6);
  [
    [probes[0], 390],
    [probes[1], 765],
  ].forEach(([job, x]) => {
    const y = Y(job.score);
    v.dot(x, y, 16, c.blue);
    txt('Job ' + job.id, x, y - 63, 43, c.ink, 'center');
    mono(job.id === 96 ? 'exact tie' : '≈ ' + num(job.score, 6), x, y + 66, 32, c.blue, 'center');
  });
  mono('Cutoff  ' + stored, 135, 864, 38, c.gold);
  line(1110, 298, 1110, 887, c.grid, 3);
  txt('Operator queue', 1190, 321, 46);
  mono('score ' + (strict ? '>' : '≥') + ' cutoff', 1190, 413, 43, c.gold);
  eligible.forEach((r, i) =>
    v.ticket(
      1190,
      492 + i * 143,
      526,
      110,
      'Job ' + r.id,
      r.id ? 'priority · at cutoff' : 'above cutoff',
      c.blue,
    ),
  );
  if (b === 4 && cue(4, 'A serving change'))
    txt('Proposed comparison    >', 1188, 857, 35, c.muted);
  else
    txt(
      eligible.length + (eligible.length === 1 ? ' qualifying ticket' : ' qualifying tickets'),
      1189,
      856,
      36,
      c.ink,
    );
}
function slot(v) {
  const { c, cue, txt } = v;
  v.heading('April   /   one available review slot', 'Which qualifying job has the higher score?');
  const t = cue(9, 'The cutoff put', 0.9);
  const eligible = queue(true);
  const winner = rank(eligible)[0];
  const x = 1180,
    y = 527,
    w = 484,
    h = 136;
  v.path(
    [
      [x - 25, y - 20],
      [x + w + 25, y - 20],
      [x + w + 25, y + h + 20],
      [x - 25, y + h + 20],
      [x - 25, y - 20],
    ],
    c.gold,
    5,
  );
  txt('Review slot', x, y - 85, 46, c.gold);
  eligible.forEach((r, i) => {
    const p = r === winner ? t : 0;
    const waiting = t > 0 && r !== winner;
    v.ticket(
      mix(193, x, p),
      mix(400 + i * 250, y, p),
      w,
      h,
      'Job ' + r.id,
      'score  ' + num(r.score, 6),
      waiting ? c.muted : c.blue,
    );
    if (waiting) txt('Next in queue', 192, 851, 38, c.muted);
  });
}
export function release(v) {
  const { c, b, cue, txt, mono, rect, line } = v;
  if (b <= 3) {
    v.heading(
      'Release receipt   /   operational checks pending',
      b === 3 ? 'Bind the policy to the serving contract' : 'What does the checksum identify?',
    );
    if (b === 3) {
      [
        ['Feature contract', 'Meaning, unit, arrival, missing rule'],
        ['Serving schema', 'Name, type, range and shape'],
        ['Candidate', 'Model digest + policy + slice results'],
      ].forEach(([a, s], i) =>
        v.ticket(122 + i * 587, 425, 532, 191, a, s, [c.blue, c.gold, c.green][i]),
      );
      return;
    }
    v.ticket(120, 335, 789, 414, 'Evaluation receipt', 'f0088a0e1691…', c.gold);
    txt('50 trees   ·   May cost 584', 170, 551, 35);
    mono('t = ' + stored, 172, 598, 31, c.muted);
    txt('Illustrative model bytes', 1044, 375, 41);
    const changed = cue(2, 'The receipt stays');
    ['3A', changed ? '91' : '90', '6B', '01'].forEach((b, i) => {
      const x = 1054 + i * 169;
      rect(x, 484, 142, 127, i === 1 && changed ? c.red : c.paper);
      mono(b, x + 71, 548, 49, i === 1 && changed ? c.bg : c.ink, 'center');
    });
    if (b === 2) {
      line(1051, 683, 1693, 683, c.grid, 3);
      txt('Model digest missing', 1051, 755, 42, c.red);
    }
    txt('Receipt SHA-256 prefix', 129, 824, 35, c.gold);
    return;
  }
  if (b <= 5) {
    parity(v);
    return;
  }
  if (b <= 7) {
    v.heading(
      'Shadow traffic',
      b === 6
        ? 'Observe the copy while the live job continues'
        : 'Join the shadow score to the later outcome',
    );
    v.ticket(126, 443, 353, 153, 'Request', 'Feature snapshot', c.blue);
    stem(v, 511, 513, 889, 365, c.blue);
    stem(v, 511, 513, 889, 699, c.gold);
    v.ticket(887, 290, 508, 145, 'Live scheduler', 'Owns the action', c.blue);
    v.ticket(887, 624, 508, 150, 'Shadow scorer', 'Logs the score', c.gold);
    if (b === 7) {
      v.ticket(1481, 624, 340, 150, 'Outcome', 'After deadline', c.green);
      txt('Match by job ID', 1041, 888, 40, c.green);
    } else
      txt(
        'Separate resources and access. Time the full request and rehearse rollback.',
        132,
        921,
        36,
        c.muted,
      );
    return;
  }
  if (b === 8 && !cue(8, 'Both April tickets')) {
    v.heading('May workload', 'Does the operator have enough capacity?');
    const r = cue(8, 'leaving a hundred') ? MAY_EVIDENCE[0] : MAY_EVIDENCE[1];
    workload(v, r, false);
    return;
  }
  slot(v);
}
