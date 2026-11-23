import {
  P,
  colors,
  cue,
  mix,
  text,
  box,
  line,
  dot,
  reading,
  heading,
  strip,
  mark,
  tag,
  rule,
  columnHead,
  ledger,
  pct,
  num,
} from './press.mjs';
import {
  BASE,
  WORDS,
  STATUS_ROW,
  STATUS_IDS,
  softmax,
  repeat,
  keep,
  temper,
  sum,
  ranked,
  raw,
  penalized,
  signRaw,
  signSeen,
  rawSeen,
  center,
  counts,
  charge,
  scoreAfterCount,
  ordered,
  legalExample,
  onlyTwo,
  samplerRow,
  samplerKept,
  seedDraw,
  DRAW_STREAM,
  sample,
} from './model.mjs';

function sign(c, k) {
  const adjusted = repeat(signRaw, signSeen, 1.2),
    t = cue(k, 1, 'Both move down', 0.65),
    b = k.beat.beatIndex;
  heading(c, 'Move each seen ID once', 'History  [0, 0, 1]    /    repetition factor 1.2');
  const px = (v) => 580 + (v + 1) * 249;
  columnHead(c, 'Raw logit above the track', 485, 250);
  signRaw.forEach((v, i) => {
    const y = 355 + i * 135,
      z = mix(v, adjusted[i], t);
    text(c, 'ID ' + i, 94, y, 39, P.ink, 'Mono');
    text(c, ['seen twice', 'seen once', 'unseen'][i], 94, y + 41, 26, P.dim);
    line(c, px(-1), y, px(2.65), y, P.rule, 3);
    line(c, px(0), y - 15, px(0), y + 16, P.dim, 2);
    dot(c, px(v), y, 14, P.rule);
    line(c, px(v), y, px(z), y, P.red, 9);
    dot(c, px(z), y, 16, i < 2 ? P.red : P.blue);
    text(c, num(v), px(v), y - 35, 35, P.ink, 'Mono', 'center');
    if (t === 1 && adjusted[i] !== v)
      text(c, num(adjusted[i]), px(adjusted[i]), y + 56, 35, P.red, 'Mono', 'center');
  });
  text(
    c,
    b === 2
      ? 'Required names can repeat. Check their correctness as well as loops.'
      : 'Seen z > 0: z / 1.2       Seen z < 0: z × 1.2',
    96,
    797,
    32,
    P.dim,
    b === 2 ? 'Sans' : 'Mono',
  );
}
function ordering(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    const after = repeat(rawSeen, [0, 1], 2),
      row = softmax(rawSeen),
      result = softmax(after);
    heading(
      c,
      'Can a penalized token gain probability?',
      'A and B are seen   /   repetition factor 2',
    );
    ledger(
      c,
      ['Token', 'Before → after logit', 'Before probability', 'After probability'],
      rawSeen.map((v, i) => [
        ['A', 'B', 'C'][i],
        num(v) + ' → ' + num(after[i]),
        num(row[i], 5),
        num(result[i], 5),
      ]),
      { x: [96, 400, 880, 1230], y: 344, dy: 125 },
    );
    tag(c, 'A lost one logit unit. Its strongest competitor lost five.', 96, 777);
    return;
  }
  const wrong = repeat(center(raw), [0], 1.2),
    done = cue(k, 0, 'lowers that leader');
  const vals = done ? penalized : raw;
  heading(c, 'When do you subtract the maximum?', 'Only A is seen   /   sign-aware factor 1.2');
  const yy = [326, 530],
    xs = [559, 807, 1055, 1303];
  ['A', 'B', 'C', 'D'].forEach((v, i) => text(c, v, xs[i], 261, 32, P.dim, 'Mono', 'center'));
  [vals, wrong].slice(0, b === 1 ? 2 : 1).forEach((row, j) => {
    const y = yy[j],
      win = ranked(row)[0];
    text(c, j ? 'Center first' : 'Raw scores first', 95, y + 19, 44, P.ink, 'Serif');
    row.forEach((v, i) => {
      text(c, num(v), xs[i], y + 24, 50, i === win ? P.teal : P.ink, 'Mono', 'center');
      if (i === win) line(c, xs[i] - 46, y + 44, xs[i] + 46, y + 44, P.teal, 6);
    });
    text(c, 'mode ' + String.fromCharCode(65 + win), 95, y + 75, 28, P.teal, 'Mono');
  });
  if (b === 1)
    text(
      c,
      'Subtracting a shared offset preserves softmax but can change a sign-aware penalty.',
      96,
      757,
      34,
      P.dim,
    );
}
function count(c, k) {
  const b = k.beat.beatIndex,
    supplied = cue(k, 1, 'Use scores'),
    final = cue(k, 1, 'resulting scores');
  heading(c, 'Count the previous token IDs', 'Deduction = 0.4 × count + 0.2 × 1[count > 0]');
  const history = [0, 1, 0, 0];
  text(c, 'History', 94, 310, 36, P.dim);
  history.forEach((id, i) => {
    const x = 302 + i * 119;
    box(c, x, 263, 96, 74, colors[id]);
    text(c, String.fromCharCode(65 + id), x + 48, 314, 43, P.white, 'Mono', 'center');
  });
  ledger(
    c,
    ['ID', 'Count', 'Start logit', 'Deduction', 'Result'],
    counts.map((n, i) => [
      String.fromCharCode(65 + i),
      n,
      supplied ? num(raw[i]) : '',
      supplied ? num(charge[i]) : '',
      final ? num(scoreAfterCount[i]) : '?',
    ]),
    { x: [96, 343, 601, 927, 1264], y: 464, dy: 89, tones: final ? [P.ink, P.teal, P.ink] : [] },
  );
  if (b === 2)
    tag(
      c,
      'For a combined policy: apply repetition to each distinct ID, then subtract these charges.',
      95,
      793,
    );
}
function order(c, k) {
  const b = k.beat.beatIndex;
  if (b === 4) {
    heading(c, 'Same ranking, new cumulative mass', 'Twelve status tokens   /   top-p = 0.90');
    [1, 1.5].slice(0, cue(k, 4, 'one and a half') ? 2 : 1).forEach((t, i) => {
      const row = temper(STATUS_ROW, t),
        s = keep(row, 'p', 0.9),
        y = 320 + i * 256;
      text(c, 'T = ' + t + '      ' + s.ids.length + ' retained', 95, y - 43, 37, P.ink);
      const ids = ranked(row);
      strip(
        c,
        ids.map((j) => row[j]),
        ids.map((j) => STATUS_IDS[j]),
        { y, h: 82, active: ids.map((j, r) => (s.ids.includes(j) ? r : -1)) },
      );
      line(c, 92 + 1416 * 0.9, y - 13, 92 + 1416 * 0.9, y + 98, P.red, 4);
    });
    return;
  }
  heading(
    c,
    'Which ID carries the mass past 80%?',
    'The same four probabilities enter both filter orders.',
  );
  const names = ['A', 'B', 'C', 'D'],
    top = keep(ordered, 'k', 3),
    cut = cue(k, 0, 'cuts D'),
    stretch = cue(k, 0, 'Stretch those survivors', 1.3);
  const upper = cut
    ? ordered.map((v, i) => (i === 3 ? 0 : mix(v, top.values[i], stretch)))
    : ordered;
  const upDone = cue(k, 1, 'B crosses it'),
    loDone = cue(k, 3, 'C crosses it');
  [
    [upper, upDone, 'Exact k = 3, then top-p'],
    [ordered, loDone, 'Top-p, then exact k = 3'],
  ]
    .slice(0, b >= 2 ? 2 : 1)
    .forEach(([row, done, title], i) => {
      const y = 345 + i * 254,
        s = done ? keep(row, 'p', 0.8) : null;
      text(c, title, 93, y - 48, 37, P.ink, 'Serif');
      strip(c, row, names, { y, h: 80, active: s?.ids });
      if (i === 1 || stretch === 1) mark(c, 92 + 1416 * 0.8, y, '80%', P.red);
      text(
        c,
        (i === 0 && stretch > 0 && stretch < 1 ? 'Rescaling A + B: ' : 'A + B = ') +
          pct(row[0] + row[1], 2) +
          (s ? '     |     keep ' + s.ids.map((j) => names[j]).join(' + ') : ''),
        95,
        y + 139,
        32,
        done ? P.teal : P.dim,
        'Mono',
      );
    });
}
function grammar(c, k) {
  const b = k.beat.beatIndex,
    cut = cue(k, 0, 'Tokens zero and one'),
    empty = cue(k, 0, 'Both are forbidden'),
    reset = cue(k, 1, 'Start again'),
    renorm = cue(k, 1, 'Normalize the legal row'),
    none = cue(k, 2, 'grammar allows nothing');
  const s = keep(legalExample, 'p', 0.8),
    ids = none ? [] : reset ? [2] : empty ? [] : cut ? s.ids : [0, 1, 2];
  const row = renorm ? onlyTwo : legalExample;
  const step = none
    ? 'Grammar allows no IDs'
    : reset
      ? renorm
        ? 'Legal row normalized'
        : 'Grammar first'
      : empty
        ? 'Apply grammar to the nucleus'
        : cut
          ? 'Top-p first'
          : 'Original row';
  heading(
    c,
    step,
    none
      ? 'Reference edition   /   sample_next_token checks eligibility before selection'
      : 'Grammar permits only ID 2   /   inclusive top-p = 0.80',
  );
  columnHead(c, 'Original token', 96, 284);
  columnHead(c, 'Grammar', 576, 284);
  columnHead(c, 'Current pool', 1050, 284);
  legalExample.forEach((v, i) => {
    const y = 380 + i * 125,
      allowed = !none && i === 2,
      alive = ids.includes(i);
    text(c, 'ID ' + i + '   ' + pct(v), 96, y, 43, P.ink, 'Mono');
    text(c, allowed ? 'allowed' : 'forbidden', 580, y, 41, allowed ? P.teal : P.red, 'Serif');
    if (alive) {
      box(c, 1050, y - 34, 270 * row[i], 36, P.teal);
      text(c, pct(row[i]), 1066 + 270 * row[i], y, 35, P.ink, 'Mono');
    } else text(c, '—', 1050, y, 38, P.dim, 'Mono');
  });
  if (!ids.length)
    tag(
      c,
      none
        ? cue(k, 2, 'rejects the row')
          ? 'sample_next_token rejects this row at T = 0 and T = 1.'
          : 'No eligible token before truncation.'
        : b === 0
          ? 'Empty intersection. Where was ID 2 lost?'
          : 'The first filter discarded ID 2.',
      96,
      794,
      P.red,
    );
  else if (b >= 1 && renorm) tag(c, 'Top-p on this row retains ID 2.', 96, 794);
}
function sampler(c, k) {
  const b = k.beat.beatIndex,
    names = STATUS_IDS.slice(0, 4),
    s = samplerKept;
  if (b < 2) {
    heading(
      c,
      b === 0 ? 'Greedy at T = 0' : 'Nucleus sampling at T = 1 and top-p = 0.90',
      'Reference edition   /   penalty-then-sample.py   /   sample_next_token',
    );
    const changed = cue(k, 0, 'It falls'),
      result = cue(k, 0, 'returns in'),
      third = cue(k, 1, 'Add the third word');
    const sorted = b === 1 ? ranked(penalized) : [0, 1, 2, 3];
    ledger(
      c,
      ['Token', 'Raw logit', 'After penalty', b === 1 ? 'Probability' : ''],
      sorted.map((i) => [
        names[i],
        num(raw[i]),
        changed ? num(penalized[i]) : '·',
        b === 1 ? pct(samplerRow[i], 2) : '',
      ]),
      {
        x: [96, 560, 902, 1260],
        y: 327,
        dy: 88,
        tones: sorted.map((i) => (b === 1 && third && !s.ids.includes(i) ? P.dim : P.ink)),
      },
    );
    text(c, 'History  [degraded]     /     repetition factor 1.2', 96, 684, 30, P.dim, 'Mono');
    if (b === 0 && result) reading(c, 'Returned “in”', 96, 789, 59, P.teal);
    if (b === 1)
      tag(
        c,
        third
          ? 'Retain in, degraded and on   ·   mass ' + pct(s.mass, 2)
          : 'First two together   ' + pct(samplerRow[0] + samplerRow[1], 2),
        96,
        771,
      );
    return;
  }
  const vals = s.ids.map((i) => s.values[i]),
    ns = s.ids.map((i) => names[i]),
    chosen = sample(vals, seedDraw),
    said = cue(k, 3, 'lands inside');
  heading(
    c,
    'One draw from the retained row',
    'Python Random(0)   /   rank order   /   normalize over the three survivors',
  );
  strip(c, vals, ns, { y: 360, colorBy: s.ids });
  if (cue(k, 2, 'seed zero')) mark(c, 92 + 1416 * seedDraw, 360, 'u = ' + num(seedDraw, 3), P.red);
  const boundary = vals[0] + vals[1];
  mark(c, 92 + 1416 * boundary, 466, num(boundary, 3), P.dim, false);
  if (said) reading(c, 'Greedy   “in”       Sample   “' + ns[chosen] + '”', 94, 704, 63);
  if (cue(k, 4, 'raises a value error'))
    tag(c, 'sample_next_token raises ValueError for history [−1] or an all-masked row.', 95, 804);
}
function draws(c, k) {
  const b = k.beat.beatIndex,
    s = keep(BASE, 'p', 0.8),
    t = cue(k, 1, 'Repeat the experiment', 7.5);
  const n = cue(k, 0, 'Draw a random number') ? 1 + Math.floor(t * 99) : 0;
  const active = DRAW_STREAM.slice(0, n),
    last = active.at(-1);
  heading(c, 'Where did the draw land?', 'Local fixture   /   seed 19   /   top-p = 0.80');
  strip(c, s.values, WORDS, { y: 325, h: 85 });
  if (last) mark(c, 92 + 1416 * last.uniform, 325, 'u = ' + num(last.uniform, 3), P.red);
  text(
    c,
    last ? 'Draw ' + n + '   →   ' + last.token : 'Waiting for the first draw',
    95,
    516,
    40,
    P.ink,
    'Mono',
  );
  s.ids.forEach((id, i) => {
    const x = 95 + i * 487,
      count = active.filter((d) => d.bin === id).length;
    text(c, WORDS[id], x, 623, 46, colors[id], 'Serif');
    box(c, x, 660, 404, 20, P.ghost);
    if (n) box(c, x, 660, (404 * count) / n, 20, colors[id]);
    line(c, x + 404 * s.values[id], 647, x + 404 * s.values[id], 697, P.ink, 3);
    text(c, n ? count + ' / ' + n + ' draws' : 'No draws yet', x, 748, 34, P.ink, 'Mono');
  });
  if (b >= 1) text(c, 'Vertical ticks show the sampling probabilities.', 97, 836, 27, P.dim);
}
export const processorPainters = {
  c21: sign,
  c22: ordering,
  c23: count,
  c24: order,
  c25: grammar,
  c26: sampler,
  c27: draws,
};
