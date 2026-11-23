import {
  P,
  colors,
  cue,
  mix,
  text,
  box,
  line,
  dot,
  heading,
  reading,
  columnHead,
  strip,
  rule,
  mark,
  tag,
  num,
  pct,
  ledger,
} from './press.mjs';
import {
  BASE,
  WORDS,
  STATUS_ROW,
  softmax,
  keep,
  temper,
  entropy,
  sum,
  ranked,
  peaked,
  flat,
  tiedScores,
  exactTie,
  thresholdTie,
  minFloor,
} from './model.mjs';

export function massLine(c, row, names, y, opts = {}) {
  strip(c, row, names, { y, ...opts });
  rule(c, 92, y + (opts.h ?? 105) + 12, 1416);
}
function heat(c, k) {
  const down = cue(k, 1, 'Cool the row', 1.8),
    up = cue(k, 3, 'warm the same', 2.3);
  const t = mix(mix(1, 0.5, down), 2, up);
  const row = temper(BASE, t),
    b = k.beat.beatIndex;
  heading(c, 'The dog …', 'Five possible next words   /   the same draw on every replay');
  const y = 370;
  massLine(c, row, WORDS, y);
  if (cue(k, 0, 'Put a draw')) mark(c, 92 + 1416 * 0.4, y, 'u = 0.40');
  text(c, 'T = ' + t.toFixed(2), 91, 657, 52, P.red, 'Mono');
  text(c, 'Weight = exp(log(p) / T)    for T > 0', 94, 725, 32, P.dim, 'Mono');
  row.forEach((v, i) =>
    text(c, WORDS[i] + ' ' + pct(v, 1), 95 + i * 290, 816, 30, colors[i], 'Sans'),
  );
  if (b === 1 || b === 2 || b === 4)
    reading(c, b === 4 ? 'The dog slept' : 'The dog ran', 654, 671, 65, b === 4 ? P.blue : P.red);
}
function odds(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    heading(c, 'A gap of two logits', 'Odds of A versus B = exp((zA − zB) / T)   for T > 0');
    const stages = [1, 0.5, 1.5],
      n = 1 + cue(k, 0, 'fifty-four') + cue(k, 0, 'three point eight');
    stages.slice(0, n).forEach((t, i) => {
      const x = 95 + i * 490,
        odds = Math.exp(2 / t);
      text(c, 'T = ' + num(t), x, 345, 45, P.dim, 'Mono');
      reading(c, num(odds, 1) + ' : 1', x, 465, 79, P.ink, 436);
      strip(c, [odds / (1 + odds), 1 / (1 + odds)], ['A', 'B'], {
        x,
        y: 546,
        w: 430,
        h: 64,
        numbers: false,
      });
    });
  } else {
    const greedy =
      b === 1 && cue(k, 1, 'deterministic argmax') && !cue(k, 1, 'grows without bound');
    const hot = cue(k, 1, 'grows without bound');
    const row = greedy ? [1, 0, 0, 0] : hot ? [1 / 3, 1 / 3, 1 / 3, 0] : [0.5, 0.5, 0, 0];
    heading(
      c,
      'Two logits tie for first place',
      'Eligible logits: A = 2, B = 2, C = 0    /    D is masked',
    );
    const note = greedy
      ? 'Exact zero  /  lowest-ID argmax'
      : hot
        ? 'Limit as T → ∞'
        : 'Limit as T → 0 from above';
    reading(c, note, 93, 316, 49);
    massLine(c, row, ['A', 'B', 'C', 'D'], 397);
    tag(c, 'Excluded D has zero probability.', 94, 685);
    if (b === 2)
      text(c, 'H = −sum(p × log2(p))   bits per next-token draw', 95, 780, 33, P.dim, 'Mono');
  }
}
function tails(c, k) {
  const cool = cue(k, 2, 'Cool the distribution', 1.6),
    warm = cue(k, 2, 'Now warm', 1.8);
  const t = mix(mix(1, 0.3, cool), 1.5, warm),
    row = temper(STATUS_ROW, t),
    tail = sum(row.slice(4));
  heading(
    c,
    'Eight ways to draw a rare token',
    'Temperature ' + t.toFixed(2) + '   /   scale each token, then add',
  );
  const names = ['degraded', 'in', 'on', 'broken', 'eight others'],
    p = [...row.slice(0, 4), tail];
  p.forEach((v, i) => {
    const y = 278 + 89 * i;
    text(c, names[i], 91, y + 29, 35, P.ink, 'Serif');
    box(c, 342, y, 635 * v, 32, i === 4 ? P.teal : P.blue);
    text(c, pct(v, 2), 357 + 635 * v, y + 27, 28, P.ink, 'Mono');
  });
  columnHead(c, 'Individual rare tokens', 1015, 259);
  row.slice(4).forEach((v, i) => {
    const x = 1015 + (i % 2) * 237,
      y = 300 + Math.floor(i / 2) * 76;
    dot(c, x + 10, y + 14, 8, P.teal);
    text(c, '#' + (i + 4) + '   ' + pct(v, 2), x + 31, y + 24, 25, P.ink, 'Mono');
  });
  if (k.beat.beatIndex === 1)
    text(c, 'Weight = p ^ (1 / T)    for T > 0', 95, 789, 38, P.ink, 'Mono');
  if (cue(k, 3, 'combined the eight tokens first')) {
    const wrong = temper([...STATUS_ROW.slice(0, 4), sum(STATUS_ROW.slice(4))], t);
    text(
      c,
      'If pooled before scaling: ' + pct(wrong[4], 1),
      1000,
      681,
      31,
      P.red,
      'Sans',
      'left',
      516,
    );
  }
  if (k.beat.beatIndex === 4)
    text(
      c,
      'Entropy (bits):   T 0.3   ' +
        num(entropy(temper(STATUS_ROW, 0.3)), 2) +
        '      T 1   ' +
        num(entropy(STATUS_ROW), 2) +
        '      T 1.5   ' +
        num(entropy(row), 2),
      94,
      803,
      35,
      P.ink,
      'Mono',
    );
}
function stability(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    const shifted = cue(k, 0, 'become zero'),
      normalized = cue(k, 0, 'normalized probabilities');
    heading(c, 'Subtract the maximum', 'Eligible logits   /   positive temperature T = 1');
    const logits = [1000, 999],
      centered = logits.map((z) => z - Math.max(...logits)),
      row = softmax(logits);
    ledger(
      c,
      ['Token', 'Logit', 'z − max(z)', 'exp(z − max(z))', 'Probability'],
      logits.map((z, i) => [
        ['A', 'B'][i],
        z,
        shifted ? num(centered[i]) : '',
        shifted ? num(Math.exp(centered[i]), 4) : '',
        normalized ? num(row[i], 4) : '',
      ]),
      { x: [95, 345, 595, 880, 1255], y: 378, dy: 150 },
    );
    if (shifted)
      reading(
        c,
        'Sum of eligible weights = 1 + exp(−1) = ' + num(1 + Math.exp(-1), 4),
        95,
        725,
        48,
      );
  } else {
    const zero = b === 2;
    heading(
      c,
      zero ? 'Check eligibility before argmax at T = 0' : 'Which scores are eligible?',
      'Reference edition   /   penalty-then-sample.py   /   sample_next_token',
    );
    const rows = zero
      ? [
          ['[2, 2, −∞]', 'eligible', 'argmax → ID 0'],
          ['[−∞, −∞]', 'empty', 'reject'],
        ]
      : [
          ['[1000, 999, −∞]', 'mask last ID', 'p = [0.731, 0.269, 0]'],
          ['[NaN, 1] or [+∞, 1]', 'invalid value', 'reject'],
          ['[−∞, −∞]', 'empty', 'reject'],
        ];
    ledger(c, ['Input logits', 'Check', 'Result'], rows, {
      x: [95, 671, 1050],
      y: 365,
      dy: 135,
      sizes: [43, 34, 32],
    });
    if (zero)
      tag(c, 'A strictly positive-temperature processor has a different input contract.', 95, 758);
  }
}
function fixed(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    heading(c, 'Two places in each row', 'Exact k = 2');
    [peaked, flat].forEach((row, i) => {
      const opt = keep(row, 'k', 2),
        y = 322 + i * 289;
      text(
        c,
        (i === 0 ? 'Peaked' : 'Flatter') + '    retained mass ' + pct(opt.mass),
        92,
        y - 37,
        36,
        P.ink,
      );
      strip(
        c,
        row,
        row.map((_, i) => String.fromCharCode(65 + i)),
        { y, h: 90, active: opt.ids },
      );
    });
    return;
  }
  const retained = keep(BASE, 'k', 2),
    selected = cue(k, 0, 'Set aside'),
    t = cue(k, 1, 'Divide each survivor');
  heading(c, 'Two word spaces', 'Exact k = 2   /   stable ID order');
  const vals = selected
    ? BASE.map((v, i) => (retained.ids.includes(i) ? mix(v, retained.values[i], t) : 0))
    : BASE;
  massLine(c, vals, WORDS, 320);
  const total = sum(vals);
  reading(
    c,
    b === 0 && selected ? 'How much mass remains?' : 'Mass on the line   ' + pct(total, 2),
    94,
    632,
    59,
  );
  if (b === 1) text(c, 'ran : slept    45 : 25', 96, 737, 38, P.dim, 'Mono');
}
function ties(c, k) {
  const z = tiedScores,
    exact = exactTie,
    threshold = thresholdTie;
  const exactScan = cue(k, 1, 'Exact count keeps', 0.8),
    thresholdScan = cue(k, 1, 'threshold keeps', 0.8);
  const cutoff = z[exact[0]];
  heading(c, 'One place, three equal leaders', 'k = 1   /   token ID breaks an exact-count tie');
  [exactScan, thresholdScan].forEach((progress, i) => {
    if (progress > 0)
      line(c, 470, 572 + i * 128, mix(470, 1431, progress), 572 + i * 128, P.teal, 3);
  });
  ['ID 0', 'ID 1', 'ID 2', 'ID 3'].forEach((name, i) => {
    const x = 590 + i * 245;
    text(c, name, x, 310, 36, P.dim, 'Mono', 'center');
    text(c, z[i], x, 394, 65, P.ink, 'Serif', 'center');
    [
      [exactScan, exact],
      [thresholdScan, threshold],
    ].forEach(([progress, ids], j) => {
      const y = 523 + j * 128,
        kept = ids.includes(i),
        checked = progress > (i + 0.5) / z.length;
      dot(c, x, y, 37, checked && kept ? P.teal : P.ghost);
      text(
        c,
        checked ? (kept ? '✓' : '×') : '?',
        x,
        y + 12,
        35,
        checked && kept ? P.white : P.dim,
        'Sans',
        'center',
      );
    });
  });
  text(c, 'Raw score', 95, 385, 41, P.ink, 'Serif');
  text(c, 'Exact count', 95, 535, 41, P.ink, 'Serif');
  text(c, 'At least the kth score', 95, 664, 39, P.ink, 'Serif');
  if ((k.beat.beatIndex > 0 || k.reveal('stable ID order', 0, { captionStart: false })))
    text(c, 'Take one in ID order', 96, 569, 28, P.dim, 'Sans');
  if ((k.beat.beatIndex > 0 || k.reveal('threshold filter', 0, { captionStart: false })))
    text(c, 'Compare each score with ' + cutoff, 96, 699, 28, P.dim, 'Sans');
  if (k.beat.beatIndex === 2)
    tag(c, 'Ranking and tie rules choose IDs. Check their meaning on the task.', 96, 231);
}

export function nucleusCut(
  c,
  row,
  names,
  {
    threshold = 0.8,
    answer = false,
    norm = false,
    y = 375,
    subtitle = '',
    count = null,
    footer = true,
  } = {},
) {
  const kept = keep(row, 'p', threshold);
  const ids = count === null ? (answer ? kept.ids : null) : kept.ids.slice(0, count);
  if (subtitle) text(c, subtitle, 92, y - 122, 35, P.dim);
  strip(c, row, names, { y, active: ids });
  mark(c, 92 + 1416 * threshold, y, pct(threshold) + ' target', P.red);
  rule(c, 92, y + 116, 1416);
  if (ids?.length) {
    const mass = sum(ids.map((i) => row[i])),
      end = 92 + 1416 * mass;
    line(c, 92, y + 178, end, y + 178, P.teal, 6);
    line(c, end, y + 167, end, y + 187, P.teal, 4);
    text(c, 'Retained ' + pct(mass, 2), 92, y + 228, 32, P.teal, 'Mono');
  }
  if (norm) {
    text(c, 'Draw from the survivors', 92, y + 302, 32, P.ink);
    strip(c, kept.values, names, { y: y + 325, h: 72 });
  } else if (footer && answer) {
    const last = kept.ids.at(-1);
    reading(c, 'Last whole word: ' + names[last], 92, y + 340, 53);
  }
}
function nucleus(c, k) {
  const hot = cue(k, 2, 'temperature two', 1.3),
    row = temper(BASE, mix(1, 2, hot)),
    b = k.beat.beatIndex;
  const ans = b === 2 ? !!cue(k, 2, 'Barked has to join') : !!cue(k, 1, 'Played takes');
  heading(
    c,
    'Where can the cut fall?',
    'Nucleus sampling   /   highest probability first   /   T = ' + num(mix(1, 2, hot), 2),
  );
  nucleusCut(c, row, WORDS, {
    answer: ans,
    norm: b === 1 && !!cue(k, 1, 'Divide the survivors'),
    y: 328,
  });
  if (b === 0) {
    const first = cue(k, 0, 'Ran ends'),
      second = cue(k, 0, 'Add slept');
    const end = second ? BASE[0] + BASE[1] : first ? BASE[0] : 0;
    if (end) {
      const xx = 92 + 1416 * end;
      line(c, 92, 520, xx, 520, P.teal, 6);
      line(c, xx, 510, xx, 532, P.teal, 5);
      reading(c, (second ? 'ran + slept' : 'ran') + '   ' + pct(end), 93, 628, 54);
    }
  }
}
function adaptive(c, k) {
  const b = k.beat.beatIndex;
  let kind = null,
    param = 0;
  if (cue(k, 1, 'Exact top-k')) {
    kind = 'k';
    param = 3;
  }
  if (cue(k, 1, 'Inclusive top-p')) {
    kind = 'p';
    param = 0.9;
  }
  if (cue(k, 2, 'Min-p point one')) {
    kind = 'min';
    param = 0.1;
  }
  heading(
    c,
    'Same rule, different shapes',
    kind
      ? {
          k: 'Exact count   k = 3',
          p: 'Cumulative mass   p = 0.90',
          min: 'Relative floor   ρ = 0.10',
        }[kind]
      : 'Ranked candidate probabilities',
  );
  [peaked, flat].forEach((row, i) => {
    const y = 311 + i * 257,
      s = kind ? keep(row, kind, param) : null;
    text(c, i === 0 ? 'Peaked' : 'Flatter', 94, y - 30, 38, P.ink, 'Serif');
    strip(
      c,
      row,
      row.map((_, j) => String.fromCharCode(65 + j)),
      { y, h: 90, active: s?.ids },
    );
    if (s)
      text(
        c,
        s.ids.length +
          ' retained   ·   mass ' +
          pct(s.mass) +
          (kind === 'min' ? '   ·   floor ' + pct(row[0] * param, 2) : ''),
        93,
        y + 141,
        30,
        P.teal,
        'Mono',
      );
  });
  text(
    c,
    'The ten narrow slices on the flatter row belong to ten separate IDs.',
    93,
    819,
    30,
    P.dim,
  );
}
function relative(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    heading(
      c,
      'A floor that follows the leader',
      'Min-p keeps positive p ≥ ρ × max(p)    /    ρ = 0.10',
    );
    [0.8, 0.05].forEach((v, i) => {
      const y = 328 + i * 237;
      line(c, 120, y + 63, 1475, y + 63, P.rule, 3);
      box(c, 120, y, 1350 * v, 62, P.blue);
      text(c, 'peak ' + pct(v), 122, y - 32, 32, P.ink, 'Mono');
      mark(c, 120 + 1350 * v * 0.1, y + 65, 'floor ' + pct(v * 0.1), P.red, false);
    });
  } else if (b === 1) {
    const t = mix(1, 2, cue(k, 1, 'After temperature two', 1.8)),
      z = [0, -2, -4],
      floor = minFloor(t, 0.1);
    const boundary = z.at(-1);
    const rounded = num(floor, 2);
    const floorLabel = rounded === num(boundary) && floor !== boundary
      ? 'floor ' + (floor > boundary ? '>' : '<') + ' ' + num(boundary)
      : 'floor ' + (floor === boundary ? '= ' : '≈ ') + rounded;
    const coord = (z) => 145 + (z + 5) * 250;
    heading(
      c,
      'Which logits clear the floor?',
      'ρ = 0.10   /   T > 0   /   floor = max(z) + T × ln(ρ)',
    );
    line(c, coord(-5), 480, coord(0.3), 480, P.dim, 3);
    z.forEach((v, i) => {
      dot(c, coord(v), 480, 24, v >= floor ? P.teal : P.rule);
      text(c, 'ID ' + i, coord(v), 407, 34, P.ink, 'Mono', 'center');
      text(c, num(v), coord(v), 552, 39, P.ink, 'Mono', 'center');
    });
    line(c, coord(floor), 427, coord(floor), 504, P.red, 5);
    text(c, floorLabel, coord(floor), 650, 37, P.red, 'Mono', 'center');
    reading(
      c,
      'T = ' + num(t, 2) + '     ' + z.filter((v) => v >= floor).length + ' of 3 eligible',
      95,
      782,
      48,
    );
  } else {
    heading(c, 'Eight equal logits', 'Each eligible token has probability ⅛');
    const row = Array(8).fill(0.125),
      names = row.map((_, i) => String.fromCharCode(65 + i));
    [
      ['min', 0.1, 'Min-p 0.10'],
      ['p', 0.75, 'Top-p 0.75'],
    ].forEach(([kind, val, label], i) => {
      const kept = keep(row, kind, val),
        y = 310 + i * 243;
      text(c, label + '   /   ' + kept.ids.length + ' retained', 94, y - 36, 38, P.ink);
      strip(c, row, names, { y, active: kept.ids });
    });
  }
}
function experiment(c, k) {
  const b = k.beat.beatIndex;
  heading(
    c,
    b ? 'Give each policy the same trial' : 'What did the studies compare?',
    b
      ? 'Paired, held-out prompts   /   separate scores for quality and diversity'
      : 'Min-p as a proposed sampling policy',
  );
  if (b === 0) {
    reading(c, 'Nguyen et al.', 95, 337, 56);
    text(c, 'Peak-relative threshold for the high-temperature tail', 96, 400, 39, P.blue);
    if (cue(k, 0, 'later critical reanalysis')) {
      reading(c, 'Schaeffer et al.', 95, 565, 56);
      text(c, 'No reliable gain over the baselines they evaluated', 96, 628, 39, P.red);
    }
  } else {
    const rows = [
      ['Prompt 01', 'same prompt', 'same prompt'],
      ['Model revision', 'same revision', 'same revision'],
      ['Tuning and judges', 'matched', 'matched'],
    ];
    ledger(c, ['Controlled input', 'Top-p', 'Min-p'], rows, {
      x: [95, 671, 1080],
      y: 344,
      dy: 114,
    });
    if (cue(k, 1, 'Score quality'))
      tag(c, 'Score both sets of outputs and report the uncertainty.', 96, 787);
  }
}
export const samplingPainters = {
  c11: heat,
  c12: odds,
  c13: tails,
  c14: stability,
  c15: fixed,
  c16: ties,
  c17: nucleus,
  c18: adaptive,
  c19: relative,
  c20: experiment,
};
