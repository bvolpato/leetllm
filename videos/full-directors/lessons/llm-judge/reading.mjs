import {
  C,
  box,
  line,
  dot,
  txt,
  cap,
  wrap,
  sheet,
  rule,
  heading,
  cue,
  beat,
  clip,
  arrow,
  label,
  checkMark,
} from './studio.mjs';
import {
  candidates,
  structured,
  fieldMatches,
  searchMatches,
  policy,
  anchors,
  edges,
  cleanPairs,
  duplicatePairs,
  escapedPairs,
  readMembers,
  decodedPairs,
  claims,
} from './specimens.mjs';

const preview = (id) => candidates[id].split(' ').slice(0, 3).join(' ');
export { preview };
export function opening(g, k) {
  const open = cue(k, 2, 'Unfold both replies', 1.05);
  const chosen = cue(k, 3, 'picks the checklist');
  cap(g, 'MAYA   /   PAYMENT SERVICE', 110, 112, C.dim, 30);
  const crossed = cue(k, 1, 'Payment latency', 1.6);
  const t = 0.58 + 0.42 * crossed;
  line(g, 106, 254, 1803, 254);
  const x0 = 1325,
    y0 = 179,
    span = 445;
  // The pager plots an illustrative rising latency beside the threshold that triggered it.
  cap(g, '500 ms threshold', x0, 110, C.gold, 24);
  line(g, x0, y0 - 15, x0 + span, y0 - 15, C.gold, 2);
  const trace = [
    [0, 31],
    [0.18, 25],
    [0.31, 31],
    [0.46, 19],
    [0.58, 22],
    [0.71, 8],
    [0.83, -6],
    [1, -42],
  ];
  let lastY = trace[0][1];
  g.beginPath();
  g.moveTo(x0, y0 + trace[0][1]);
  for (let j = 1; j < trace.length; j++) {
    const [a, ya] = trace[j - 1],
      [z, yz] = trace[j],
      u = Math.max(0, Math.min(1, (t - a) / (z - a)));
    if (t >= a) {
      lastY = ya + u * (yz - ya);
      g.lineTo(x0 + span * (a + u * (z - a)), y0 + lastY);
    }
  }
  g.strokeStyle = C.mint;
  g.lineWidth = 5;
  g.stroke();
  txt(
    g,
    lastY < -15 ? 'Rollback threshold crossed' : 'Payment latency',
    104,
    212,
    78,
    C.white,
    'Serif',
  );
  ['compact', 'stepwise'].forEach((id, i) => {
    const x = 105 + i * 880,
      y = 361,
      w = 824,
      h = 258 + 227 * open;
    const stock = i ? C.gold : C.milk;
    box(g, x - 8, y - 15, w + 16, 24, C.deep, 9);
    sheet(g, x, y, w, h, stock);
    cap(g, id.toUpperCase(), x + 64, y + 66, C.ink, 29);
    line(g, x + 62, y + 88, x + w - 34, y + 88, '#00000040');
    txt(g, preview(id), x + 66, y + 176, i ? 49 : 65, C.ink, 'Serif');
    if (open > 0)
      clip(g, x + 43, y + 200, w - 49, (h - 209) * open, () => {
        const rest = candidates[id].split(' ').slice(3).join(' ');
        if (!i) wrap(g, rest, x + 66, y + 247, w - 122, 43, C.ink, 57);
        else {
          txt(g, 'its rollback threshold. Next:', x + 66, y + 247, 43, C.ink, 'Serif');
          txt(g, '1. Stop the rollout.', x + 66, y + 323, 48, C.ink, 'Serif');
          txt(g, '2. Run the DEP-27 rollback procedure.', x + 66, y + 391, 37, C.ink, 'Serif');
        }
      });
    line(g, x + 44, y + h - 24, x + w - 25, y + h - 24, '#00000045');
    if (chosen && i) label(g, 'Judge’s clarity pick', x + 50, y + h + 28, C.gold);
  });
  if (!open && beat(k) === 1)
    txt(g, 'Which preview gives Maya an action?', 110, 777, 54, C.white, 'Serif');
}
export function fields(g, k) {
  const b = beat(k),
    known = cue(k, 1, 'Both match'),
    hit = cue(k, 3, 'Both pass'),
    neg = cue(k, 3, 'reverse');
  heading(g, 'Policy comparator  /  ' + policy.version, 'Which part did the check read?');
  rule(g, 'ALLOWED FIELD     action = run_rollback', 110, 304, 1690);
  structured.forEach((r, i) => {
    const y = 385 + i * 237;
    sheet(g, 108, y, 1694, 185, i ? C.pulp : C.milk);
    cap(g, '0' + (i + 1), 162, y + 61, C.ink);
    txt(g, r.action, 250, y + 82, 44, C.ink, 'Mono');
    if (known && fieldMatches(r)) checkMark(g, 653, y + 68, C.ink);
    line(g, 722, y + 18, 722, y + 165, '#00000038', 2);
    if (b >= 2) txt(g, r.prose, 766, y + 87, 52, C.ink, 'Serif');
    if (hit && searchMatches(r)) cap(g, '“rollback” found', 769, y + 146, C.ink);
    if (neg && i) {
      g.font = '400 52px "Lesson Serif"';
      line(g, 766, y + 101, 766 + g.measureText('Do not').width, y + 101, '#a64139', 7);
    }
  });
  if (b >= 4) label(g, 'Contradiction    →    policy review', 869, 874, C.coral);
}
function anchorStrip(g, x, y, w, a) {
  sheet(g, x, y, w, 125, [C.pulp, C.milk, C.gold][a.level]);
  txt(g, a.level, x + 68, y + 89, 66, C.ink, 'Mono');
  txt(g, a.description.replace(';', ','), x + 165, y + 55, 35, C.ink, 'Sans');
  txt(g, a.example, x + 165, y + 102, 34, C.ink, 'Serif');
}
export function formats(g, k) {
  const b = beat(k);
  if (b < 3) {
    heading(g, 'Pointwise  /  one reply', 'What does a score of two buy?');
    anchors.forEach((a, i) => anchorStrip(g, 150, 306 + i * 159, 1530, a));
    if (b === 2) label(g, 'N replies   ×   1 judgment each   =   N calls', 150, 838, C.blue);
    return;
  }
  if (b <= 5) {
    const baseline = cue(k, 4, 'A fixed baseline'),
      swaps = cue(k, 4, 'thirty calls'),
      more = cue(k, 5, 'eight hundred');
    const selected = baseline ? edges.filter(([a]) => a === 0) : edges;
    const nodes = Array.from({ length: 6 }, (_, i) => [
      580 + 305 * Math.sin((i * Math.PI) / 3),
      565 - 271 * Math.cos((i * Math.PI) / 3),
    ]);
    heading(
      g,
      'Pairwise  /  six revisions',
      baseline ? 'Pair each alternative with the baseline' : 'Count each distinct pair once',
    );
    selected.forEach(([a, z]) => line(g, ...nodes[a], ...nodes[z], baseline ? C.gold : C.gray, 4));
    nodes.forEach(([x, y], i) => {
      dot(g, x, y, 46, baseline && i === 0 ? C.gold : C.pulp);
      txt(g, i + 1, x, y + 16, 44, C.ink, 'Mono', 'center');
    });
    const count = selected.length,
      calls = count * 2;
    rule(g, baseline ? 'FIXED BASELINE' : 'ALL PAIRS', 1060, 342, 700);
    txt(g, baseline ? 'N − 1' : 'N(N − 1) / 2', 1055, 452, 69, C.white, 'Serif');
    txt(
      g,
      cue(k, 3, 'fifteen unordered pairs') ? count + ' pairs' : 'How many pairs?',
      1060,
      572,
      66,
      C.gold,
      'Serif',
    );
    if (swaps) txt(g, '2 orders   →   ' + calls + ' calls', 1060, 668, 45, C.white);
    if (b === 5) {
      const tokens = more ? 800 : 200;
      cap(g, tokens + ' tokens × ' + calls + ' calls', 1060, 789);
      txt(g, (tokens * calls).toLocaleString('en-US') + ' input tokens', 1060, 860, 48, C.blue);
    }
    return;
  }
  if (b === 6) {
    heading(g, 'Preference cycle', 'Can these three votes rank the replies?');
    const points = [
      [965, 365],
      [1315, 755],
      [610, 755],
    ];
    points.forEach(([x, y], i) => {
      const [xx, yy] = points[(i + 1) % 3],
        a = Math.atan2(yy - y, xx - x);
      arrow(
        g,
        x + 69 * Math.cos(a),
        y + 69 * Math.sin(a),
        xx - 78 * Math.cos(a),
        yy - 78 * Math.sin(a),
        C.gold,
      );
      dot(g, x, y, 61, C.pulp);
      txt(g, ['A', 'B', 'C'][i], x, y + 20, 59, C.ink, 'Mono', 'center');
    });
    cap(g, 'Arrow points from preferred reply to rival', 540, 916);
    return;
  }
  heading(
    g,
    b === 7 ? 'Reference-guided evaluation' : 'JudgeLM  /  teacher and source',
    b === 7
      ? 'Which condition does the reference establish?'
      : 'What did the judge learn to match?',
  );
  sheet(g, 121, 326, 830, 423, C.milk);
  cap(g, 'SOURCE   /   DEPLOYMENT POLICY', 188, 400, C.ink);
  wrap(g, 'Incident-commander approval is required before deployment.', 188, 496, 700, 51);
  sheet(g, 982, 430, 807, 370, C.gold);
  cap(g, b === 7 ? 'CANDIDATE PARAPHRASE' : 'EVALUATION TARGET', 1050, 504, C.ink);
  wrap(
    g,
    b === 7
      ? 'Deployments need the commander’s permission.'
      : 'Teacher preference on the same replies.',
    1050,
    601,
    664,
    50,
  );
  txt(
    g,
    b === 7 ? '“permission” means “approval” here' : 'Check factual support against the policy.',
    120,
    907,
    48,
    C.mint,
    'Serif',
  );
}
export function rubric(g, k) {
  const b = beat(k);
  heading(g, 'DEP-27  /  clarity rubric', 'What would earn each level?');
  sheet(g, 105, 312, 726, 540, C.milk);
  cap(g, 'AFTER THE THRESHOLD IS CROSSED', 167, 391, C.ink, 25);
  const elements = ['Stop the rollout.', 'Run the rollback', 'procedure.'];
  elements.forEach((s, i) => txt(g, s, 175, 496 + 74 * i, 57, C.ink, 'Serif'));
  line(g, 168, 707, 760, 707, '#00000044');
  cap(g, 'Policy before preference', 167, 777, C.ink);
  if (b === 1) {
    cap(g, 'SAME ACTIONS IN BOTH REPLIES', 906, 389);
    ['compact', 'stepwise'].forEach((id, i) => {
      sheet(g, 906, 439 + 160 * i, 886, 128, i ? C.gold : C.pulp);
      cap(g, id, 970, 487 + 160 * i, C.ink, 25);
      txt(
        g,
        i
          ? '1. Stop the rollout.    2. Run the rollback.'
          : 'Stop the rollout and run the rollback.',
        970,
        537 + 160 * i,
        35,
        C.ink,
        'Serif',
      );
    });
  } else anchors.forEach((a, i) => anchorStrip(g, 875, 318 + i * 155, 925, a));
  if (b >= 3)
    cap(
      g,
      'Case record    DEP-27  /  exact replies  /  rubric v1  /  judge settings',
      111,
      934,
      C.mint,
    );
}
export function receipts(g, k) {
  const b = beat(k),
    dup = cue(k, 3, 'another verdict') && b <= 7,
    escaped = dup && b >= 5;
  const pairs = escaped ? escapedPairs : dup ? duplicatePairs : cleanPairs;
  const rejected = dup && cue(k, 4, 'rejects the duplicate');
  heading(
    g,
    'Receipt reader  /  DEP-27',
    b >= 8 ? 'Does the reason describe reply B?' : 'Which vote survives the decoder?',
  );
  sheet(g, 100, 316, 905, 508, C.milk);
  cap(g, 'RAW RECEIPT', 169, 395, C.ink);
  const rows = [
    '{',
    ...pairs.map(
      ([key, val], i) =>
        '  "' + key + '": ' + JSON.stringify(val) + (i === pairs.length - 1 ? '' : ','),
    ),
    '}',
  ];
  rows.forEach((s, i) => txt(g, s, 162, 484 + i * 65, s.length > 32 ? 28 : 37, C.ink, 'Mono'));
  if (b >= 8) {
    sheet(g, 1040, 395, 767, 422, C.gold);
    cap(g, 'B   /   STEPWISE', 1100, 472, C.ink);
    wrap(g, candidates.stepwise.split('. ')[0] + '.', 1100, 560, 650, 49);
    if (cue(k, 8, 'misquotes')) label(g, 'Opens with the condition', 1099, 713, C.coral);
  } else if (dup) {
    rule(g, 'DEFAULT DICTIONARY', 1060, 376, 718);
    txt(
      g,
      cue(k, 4, 'Python keeps B')
        ? 'verdict = ' + Object.fromEntries(decodedPairs(pairs)).verdict
        : 'verdict = ?',
      1060,
      481,
      51,
      C.gold,
      'Mono',
    );
    rule(g, 'STRICT READER', 1060, 605, 718);
    txt(
      g,
      rejected ? readMembers(pairs) : 'Count this vote?',
      1060,
      704,
      50,
      rejected ? C.coral : C.white,
      'Serif',
    );
    if (rejected) cap(g, 'raw receipt retained  /  0 votes', 1060, 783, C.dim, 28);
  } else {
    rule(g, 'ALLOWED VERDICTS', 1060, 388, 717);
    txt(g, 'A    B    tie    review', 1060, 480, 50, C.gold, 'Serif');
    wrap(g, 'Evidence must contain a nonblank observation.', 1060, 599, 677, 44, C.white, 59);
    if (cue(k, 2, 'passes the shape check'))
      label(g, 'Shape accepted    ' + readMembers(pairs), 1060, 752, C.mint);
  }
  if (b === 6 || b === 7)
    cap(
      g,
      b === 6
        ? 'Also reject invalid numbers, malformed JSON and non-text input.'
        : 'Track refusals, truncation and transport errors separately.',
      110,
      921,
    );
  if (b === 9) cap(g, 'Host binds case, evidence, rubric and configuration.', 110, 921, C.mint);
}
export function policyClaims(g, k) {
  const b = beat(k),
    small = cue(k, 4, 'called every claim supported');
  heading(
    g,
    'Recorded article run  /  sampling and thinking off',
    'Does the approval claim follow?',
  );
  cap(
    g,
    'POLICY    Before deployment, get commander approval and link a rollback plan.',
    111,
    290,
    C.gold,
    30,
  );
  const model = small ? 'Qwen3-0.6B' : 'Qwen3-1.7B';
  cap(g, 'CLAIM', 135, 385);
  cap(g, 'HUMAN KEY', 989, 385);
  cap(g, model, 1435, 385);
  claims.forEach(([claim, key, pred], i) => {
    const y = 456 + i * 60,
      answer = small ? 'supported' : pred;
    const known =
      small ||
      (key === pred
        ? b >= 2
        : i === 3
          ? cue(k, 3, 'marked it supported')
          : cue(k, 3, 'approved two requirements'));
    if (known && key !== answer) box(g, 110, y - 42, 1660, 55, '#5d4545', 5);
    txt(g, claim, 136, y, 36, C.white);
    txt(g, key, 990, y, 34, C.dim);
    txt(g, known ? answer : '·', 1435, y, 36, known && answer !== key ? C.coral : C.mint);
  });
  if (b === 3 && cue(k, 3, 'approval is required'))
    txt(
      g,
      'Reason on row 4: “approval is required before deployment.”',
      120,
      951,
      42,
      C.gold,
      'Serif',
    );
}
