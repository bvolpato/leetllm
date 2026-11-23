import { CHECKPOINTS, RETAINED_CHECKS } from '../../../films/continued-pretraining/fixtures.mjs';
import {
  evaluationSnapshot,
  byteReport,
  chooseCheckpoint,
} from '../../../films/continued-pretraining/model.mjs';
import {
  C,
  base,
  beat,
  cue,
  rect,
  line,
  circle,
  text,
  mono,
  serif,
  chip,
  heading,
  arrow,
  rows,
  sheet,
  rule,
  withAlpha,
} from './studio.mjs';

export function evaluation(g, k) {
  base(g);
  heading(g, 'HELD-OUT DOCUMENTS AND INCIDENTS', 'What can the text score tell us?');
  const v = evaluationSnapshot(2, 1),
    x = (i) => 505 + i * 312;
  const n = 1 + Math.floor(4 * cue(k, 1, 'domain perplexity falls', 2));
  const tasks = 1 + Math.floor(4 * cue(k, 2, 'Score the incidents', 1.5));
  const general = Math.ceil(5 * cue(k, 3, 'Now score general text', 1.4));
  const tracks = [
    {
      name: 'Domain PPL',
      vals: v.domain,
      count: n,
      y: 441,
      map: (p) => 441 - (p - 26) * 6,
      col: C.sea,
    },
    { name: 'Task accuracy', vals: v.tasks, count: tasks, y: 610, map: () => 610, col: C.forest },
    {
      name: 'General PPL',
      vals: v.general,
      count: general,
      y: 817,
      map: (p) => 817 - (p - 19.2) * 13,
      col: C.clay,
    },
  ];
  tracks.forEach(({ name, vals, count, y, map, col }, j) => {
    serif(g, name, 103, y, 47, col);
    for (let i = 0; i < vals.length; i++) {
      const px = x(i);
      line(g, px, 273, px, 864, '#c5c6b630', 2);
      if (i >= count) {
        mono(g, '?', px, y, 33, C.muted, 'center');
        continue;
      }
      const py = map(vals[i]);
      if (i) line(g, x(i - 1), map(vals[i - 1]), px, py, col, 6);
      circle(g, px, py, 11, col);
      mono(g, vals[i] + (j === 1 ? '%' : ''), px, py - 31, 35, col, 'center');
    }
  });
  for (let i = 0; i < 5; i++) mono(g, i ? 'C' + i : 'Base', x(i), 913, 31, C.muted, 'center');
  if (cue(k, 3, 'In this example the last checkpoint'))
    text(
      g,
      'Last checkpoint    Safety 7/10 (needs 9)     Reasoning 6/10 (needs 7)',
      104,
      997,
      39,
      C.ink,
    );
}
export const reports = [byteReport(15, 10, 30), byteReport(18, 20, 30)];
export function bytes(g, k) {
  base(g);
  heading(g, 'TOKENIZER COMPARISON   /   IDENTICAL SCORED BYTES', 'Which unit are we comparing?');
  const perByte = cue(k, 2, 'Now change the divisor'),
    bits = cue(k, 3, 'Divide again'),
    resolved = cue(k, 4, 'Coarse costs less');
  text(g, 'Same text, context and scoring boundaries', 110, 307, 38, C.muted);
  reports.forEach((v, i) => {
    const y = 414 + i * 248,
      x = 455,
      w = 935,
      n = perByte ? v.bytes : v.tokens,
      col = i ? C.clay : C.sea;
    serif(g, i ? 'Fine' : 'Coarse', 111, y + 38, 63, col);
    mono(g, v.nll + ' nats', 113, y + 107, 34, C.muted);
    for (let j = 0; j < n; j++) rect(g, x + (j * w) / n, y, w / n - 4, 66, col, 3);
    text(g, n + (perByte ? ' bytes' : ' tokens'), x, y + 122, 39, col);
    if (perByte) mono(g, 'Token PPL  ' + v.ppl.toFixed(3), x + 935, y + 122, 32, C.muted, 'right');
    const ready = perByte ? !bits || resolved : cue(k, 2, 'Fine wins per token');
    const value = bits ? v.bitsPerByte : perByte ? v.natsPerByte : v.ppl;
    mono(g, ready ? value.toFixed(3) : '?', 1748, y + 57, 63, col, 'right');
    text(
      g,
      bits ? 'bits / byte' : perByte ? 'nats / byte' : 'token PPL',
      1748,
      y + 119,
      34,
      C.muted,
      'Sans',
      'right',
    );
  });
  mono(
    g,
    bits
      ? 'BPB = NLL / (bytes × ln 2)'
      : perByte
        ? 'Nats per byte = NLL / scored bytes'
        : 'PPL = exp(NLL / scored tokens)',
    114,
    960,
    42,
  );
}
export const pooled = (docs) =>
  Math.exp(docs.reduce((s, d) => s + d[0], 0) / docs.reduce((s, d) => s + d[1], 0));
export const documents = [
  [60, 20],
  [160, 40],
];
export const lanes = [
  [
    [840, 240],
    [720, 240],
  ],
  [
    [540, 200],
    [548, 200],
  ],
];
export function corpusPpl(g, k) {
  base(g);
  const lanesOn = cue(k, 3, 'Apply the pooled rule separately');
  if (lanesOn) {
    heading(g, 'FIXED TOKENIZER    /    MATCHED SCORING', 'Score each evaluation lane separately');
    rows(
      g,
      ['Held-out lane', 'Base NLL / count', 'Adapted NLL / count', 'PPL before → after'],
      lanes.map(([a, b], i) => [
        i ? 'General text' : 'Domain text',
        a.join(' / '),
        b.join(' / '),
        pooled([a]).toFixed(2) + ' → ' + pooled([b]).toFixed(2),
      ]),
      { widths: [0.22, 0.24, 0.27, 0.27], dy: 163 },
    );
    text(g, 'The domain lane improves. The general lane gets more expensive.', 110, 857, 45, C.sea);
    if (beat(k) === 4)
      text(g, 'Task transfer requires a held-out task comparison.', 110, 948, 40, C.muted);
    return;
  }
  heading(
    g,
    'FIXED TOKENIZER    /    TWO EVALUATION DOCUMENTS',
    'Pool the losses before taking the exponential',
  );
  documents.forEach(([loss, n], i) => {
    const x = 115 + i * 913;
    sheet(g, x, 325, 791, 285);
    serif(g, 'Document ' + (i + 1), x + 41, 407, 55);
    mono(g, loss + ' nats  /  ' + n + ' targets', x + 42, 518, 42, C.sea);
  });
  const merged = cue(k, 2, 'The pooled mean');
  if (merged) mono(g, '(60 + 160) / (20 + 40) = 220 / 60', 112, 740, 55);
  if (cue(k, 2, 'Exponentiate once'))
    serif(g, 'Corpus PPL   ' + pooled(documents).toFixed(1), 113, 871, 79, C.sea);
  if (cue(k, 3, 'We’d get about'))
    text(
      g,
      'Mean of the two document PPLs   ' +
        (documents.reduce((s, d) => s + pooled([d]), 0) / 2).toFixed(1),
      112,
      970,
      41,
      C.clay,
    );
}
export function abilities(g, k) {
  base(g);
  const b = beat(k);
  if (b === 4) {
    heading(g, 'ACCURACY REGRESSION', 'Specify the unit of the budget');
    const pos = rule(g, 204, 591, 1476, 60, 75, [60, 65, 68, 70, 75], 'Accuracy (%)');
    arrow(g, pos(70), 515, pos(68), 515, C.clay, 10);
    serif(g, '70% → 68%', 110, 376, 88);
    mono(g, '2 percentage points', 112, 875, 48, C.clay);
    mono(g, '2 / 70 ≈ 2.86% relative', 1810, 875, 48, C.sea, 'right');
    return;
  }
  heading(g, 'RETAINED ABILITIES   /   IDENTICAL CASE IDS', 'Which suite falls below its minimum?');
  const index = Math.round(4 * cue(k, 1, 'By the end', 1.4));
  const suites = [
    ['Safety', RETAINED_CHECKS.safety, 9],
    ['Reasoning', RETAINED_CHECKS.reasoning, 7],
  ];
  suites.forEach(([name, history, min], j) => {
    const y = 343 + j * 244,
      values = history[index],
      n = values.filter(Boolean).length;
    serif(g, name, 110, y + 63, 57);
    values.forEach((ok, i) => {
      const x = 471 + i * 112;
      chip(
        g,
        (j ? 'R' : 'S') + (i + 1),
        x,
        y,
        96,
        90,
        ok ? C.pale : C.rose,
        ok ? C.sea : C.clay,
        34,
      );
      if (!ok) line(g, x + 10, y + 80, x + 84, y + 10, C.clay, 4);
    });
    mono(g, n + '/10', 1789, y + 60, 51, n < min ? C.clay : C.sea, 'right');
    text(g, 'Minimum ' + min + ' of 10', 471, y + 149, 35, C.muted);
  });
  text(
    g,
    (index ? 'Checkpoint ' + index : 'Base checkpoint') + '   /   Same ten cases within each suite',
    110,
    917,
    41,
    C.muted,
  );
}

export function validateRows(data) {
  for (const { domain, general, task } of data) {
    if (
      ![domain, general, task].every(Number.isFinite) ||
      domain < 1 ||
      general < 1 ||
      task < 0 ||
      task > 100
    )
      throw new RangeError('Invalid checkpoint metrics');
  }
}
export function ledger(
  g,
  k,
  { rows: data, base: basePpl, budget, domain, showCeiling, visible, gated, ranked },
) {
  const x = 461,
    w = 760,
    top = 350,
    step = data.length === 3 ? 151 : 127;
  validateRows(data);
  const pos = (v) => x + (w * (v - domain[0])) / (domain[1] - domain[0]);
  const limit = basePpl + budget,
    winner = chooseCheckpoint(data, basePpl, budget);
  text(g, 'Checkpoint', 109, 294, 33, C.muted);
  text(g, 'General perplexity', x, 294, 33, C.muted);
  text(g, 'Task accuracy', 1435, 294, 33, C.muted, 'Sans', 'center');
  text(g, 'Domain PPL', 1702, 294, 33, C.muted, 'Sans', 'center');
  if (showCeiling) {
    const cx = pos(limit);
    rect(g, cx, top - 20, pos(domain[1]) - cx, step * (data.length - 1) + 117, '#e5bfab62');
    line(g, cx, top - 32, cx, top + step * (data.length - 1) + 98, C.clay, 5);
    mono(
      g,
      '≤ ' + Number(limit.toFixed(1)),
      cx,
      top + step * (data.length - 1) + 152,
      39,
      C.clay,
      'center',
    );
  }
  data.forEach((r, i) => {
    if (i >= visible) return;
    const y = top + 65 + i * step,
      fail = gated && r.general > limit + 1e-10,
      win = ranked && r === data.find((v) => v.label === winner.label),
      color = fail ? C.clay : win ? C.forest : C.ink;
    if (win) rect(g, 94, y - 69, 1714, 104, '#77b59b32', 8);
    serif(g, r.label, 115, y + 9, 53, color);
    line(g, x, y, x + w, y, C.rule, 2);
    circle(g, pos(r.general), y, 14, color);
    mono(g, r.general.toFixed(1), pos(r.general), y - 26, 32, color, 'center');
    if (fail) {
      line(g, pos(r.general) - 17, y - 17, pos(r.general) + 17, y + 17, C.paper, 4);
      line(g, pos(r.general) - 17, y + 17, pos(r.general) + 17, y - 17, C.paper, 4);
    }
    mono(g, r.task + '%', 1435, y + 10, 48, color, 'center');
    mono(g, r.domain.toFixed(1), 1702, y + 10, 48, color, 'center');
  });
  if (ranked) serif(g, 'Selected   ' + winner.label, 110, 973, 56, C.forest);
  else if (gated) text(g, 'Rank the eligible task scores.', 110, 971, 43, C.sea);
}
export function selection(g, k) {
  base(g);
  const b = beat(k);
  if (b >= 5) {
    heading(g, 'RESERVED EVALUATION   /   CPT 4k', 'Open the unused incident set');
    const ready = cue(k, 5, 'fourteen of twenty');
    for (let i = 0; i < 20; i++) {
      const x = 119 + (i % 10) * 101,
        y = 375 + Math.floor(i / 10) * 104;
      chip(
        g,
        ready ? (i < 14 ? '' : '×') : '?',
        x,
        y,
        86,
        83,
        ready ? (i < 14 ? C.pale : C.rose) : C.leaf,
        C.ink,
      );
      if (ready && i < 14) {
        line(g, x + 20, y + 43, x + 36, y + 60, C.forest, 6);
        line(g, x + 36, y + 60, x + 64, y + 25, C.forest, 6);
      }
    }
    serif(g, ready ? '14 of 20 correct' : '20 reserved incidents', 122, 718, 73, C.sea);
    if (cue(k, 5, 'On the reserved general text')) {
      text(g, 'Reserved general PPL', 1252, 375, 38, C.muted);
      mono(g, '19.1 → 20.0', 1250, 495, 62);
      mono(g, 'Rise  +0.9', 1250, 594, 45, C.sea);
    }
    if (b === 6)
      text(
        g,
        'Save weights, tokenizer, corpus hash, token counts and evaluation protocol.',
        115,
        918,
        39,
        C.muted,
      );
    return;
  }
  heading(g, 'CHECKPOINT SELECTION   /   GENERAL-TEXT BUDGET', 'How far can adaptation go?');
  const ceiling = cue(k, 1, 'Put the ceiling'),
    visible = 1 + 3 * cue(k, 2, 'Here are the three training checkpoints');
  ledger(g, k, {
    rows: CHECKPOINTS,
    base: 19.2,
    budget: 1.5,
    domain: [19, 24.5],
    showCeiling: ceiling,
    visible,
    gated: cue(k, 3, 'Twelve thousand steps is too far'),
    ranked: cue(k, 4, 'Keep the four-thousand-step checkpoint'),
  });
  if (b === 1) mono(g, 'Base 19.2   +   allowed rise 1.5', 112, 967, 42);
}
export function frontier(g, k) {
  base(g);
  const b = beat(k);
  if (b >= 4) {
    heading(g, 'STOPPING RULE   /   SAME 500 INCIDENTS', 'What did one changed answer buy?');
    const changed = cue(k, 4, 'one more answer turns correct');
    for (let i = 0; i < 500; i++) {
      const x = 112 + (i % 50) * 33,
        y = 346 + Math.floor(i / 50) * 32;
      rect(g, x, y, 24, 24, i === 499 && changed ? C.sea : '#cccdbd', 3);
    }
    serif(g, changed ? '1 / 500 = 0.2 percentage points' : '500 binary cases', 110, 823, 71, C.sea);
    text(
      g,
      'Apply the declared gain, patience and regression limits. Confirm on reserved cases.',
      110,
      949,
      38,
      C.muted,
    );
    return;
  }
  heading(g, 'FOUR SAVED CHECKPOINTS', 'Domain gain trades against general regression');
  const x = (d) => 262 + 75 * d,
    y = (v) => 815 - 85 * v;
  [0, 1.5, 3, 5].forEach((v) => {
    line(g, 262, y(v), 1610, y(v), v === 1.5 ? C.clay : C.rule, v === 1.5 ? 5 : 2);
    mono(g, v, 222, y(v) + 10, 30, C.muted, 'right');
  });
  text(g, 'General PPL rise', 112, 305, 31, C.clay);
  [0, 5, 10, 15].forEach((d) => mono(g, d, x(d), 872, 31, C.muted, 'center'));
  text(g, 'Domain PPL drop', 965, 941, 39, C.sea, 'Sans', 'center');
  const frontier = cue(k, 2, 'To dominate a dot');
  if (frontier) {
    const r = CHECKPOINTS[2],
      corner = x(42 - r.domain),
      level = y(r.general - 19.2);
    rect(g, corner, level, 1610 - corner, 815 - level, '#2675662c');
    line(g, corner, level, 1610, level, C.sea, 3);
    line(g, corner, level, corner, 815, C.sea, 3);
    text(
      g,
      'Shaded region: at least 4k’s domain gain, at most its general rise.',
      108,
      1015,
      36,
      C.sea,
    );
  }
  CHECKPOINTS.forEach((r, i) => {
    const px = x(42 - r.domain),
      py = y(r.general - 19.2);
    circle(g, px, py, 15, i === 3 ? C.clay : C.sea);
    mono(g, r.label, px + 24, py + (i === 3 ? 10 : -15), 31);
  });
  text(g, '1.5 limit', 1633, y(1.5) + 9, 30, C.clay);
}
