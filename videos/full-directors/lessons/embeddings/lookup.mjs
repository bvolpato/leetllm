import {
  C,
  arrow,
  axis,
  box,
  dot,
  ground,
  horizontalScale,
  line,
  mono,
  phase,
  pos,
  serif,
  tag,
  text,
  ticketArt,
  book,
} from './drawing.mjs';
import {
  charge,
  clues,
  cos,
  countModel,
  CONTEXT_EVENTS,
  CONTEXT_WORDS,
  CORPUS,
  EMBEDDING_COUNTS,
  fmt,
  scores,
  V,
  vec,
  winner,
} from './geometry.mjs';

export function opening(c, k) {
  ground(c, 'What can search see in “charge”?');
  const crop = phase(k, 2, 'Crop each message', 1.4);
  const merged = phase(k, 2, 'Lay one query arrow', 1.9);
  const showGuide = k.beat.beatIndex === 2 && k.reveal('phone guide', 0, { captionStart: false });
  const showOutlines = phase(k, 3, 'Follow the two outlines', 0.35) > 0;
  const row = scores(charge, clues, cos);
  [0, 1].forEach((i) => {
    if (i === 1 && !phase(k, 1, 'Beside it', 0)) return;
    const x = i ? 1400 : 520;
    ticketArt(c, i, x - 58, 355, 0.9);
    const rest = i ? ' the phone' : ' on the invoice',
      w = pos(635, 251, crop);
    c.save();
    c.translate(x - 320, 609);
    box(c, 0, -52, w, 84, C.light, 4, i ? C.aqua : C.coral, 3);
    c.beginPath();
    c.rect(0, -51, w - 2, 82);
    c.clip();
    serif(c, 'charge', 25, 9, 64);
    text(c, rest, 244, 8, 46, C.muted);
    c.restore();
    if (crop > 0.85) mono(c, 'ID 0   ' + vec(charge), x - 55, 624, 34, C.blue);
  });
  if (k.beat.beatIndex === 0) {
    if (k.reveal('Which guide', 0)) {
      tag(c, 'Available guides', 960, 700, C.muted, 'center');
      book(c, 0, 734, 718, 452, 96);
      book(c, 1, 734, 830, 452, 96);
    }
    return;
  }
  if (showOutlines) {
    const tail = [655, 888];
    clues.forEach(([x, y], i) => {
      const ink = i ? C.aqua : C.coral;
      const tip = [tail[0] + 220 * x, tail[1] - 220 * y];
      line(c, tail, tip, ink, 4, [9, 6]);
      dot(c, tip, 8, ink);
      tag(c, i ? 'Phone guide' : 'Invoice guide', tip[0] + (i ? 19 : -18), tip[1] + 9, ink, i ? 'left' : 'right');
    });
  }
  for (const i of [0, 1]) {
    const x = pos(i ? 1150 : 265, 655, merged),
      y = pos(i ? 885 : 905, 888, merged);
    const end = [x + 425 * charge[0], y - 425 * charge[1]];
    arrow(c, [x, y], end, i ? C.aqua : C.coral, i ? 7 : 19, i ? 30 : 49);
    dot(c, [x, y], i ? 5 : 10, i ? C.aqua : C.coral);
  }
  if (merged === 1) {
    if (showGuide) {
      book(c, winner(row), 1160, 735, 505, 155);
      tag(c, 'Both queries', 643, 950);
      if (showOutlines)
        mono(c, 'Invoice ' + fmt(row[0]) + '   Phone ' + fmt(row[1]), 1106, 944, 34);
    } else serif(c, 'Different first guides?', 1135, 860, 51);
  }
}
const bankWords = ['bank', 'river', 'money'],
  bankRows = bankWords.map((w) => V[w]);
const supportWords = ['charge', 'invoice', 'phone'],
  supportRows = [charge, ...clues];
function rack(c, labels, rows, selected, shift = 0, multipliers = false) {
  tag(c, 'ID', 102, 269);
  tag(c, 'Token', 233, 269);
  tag(c, 'Stored coordinates', 498, 269);
  for (let j = 0; j < rows.length; j++) {
    const y = 305 + j * 117,
      x = 90 + (j === selected ? shift : 0);
    box(c, x + 3, y + 8, 719, 91, C.grid, 5);
    box(c, x, y, 719, 91, j === selected ? C.sky : C.light, 5, j === selected ? C.blue : C.grid, 2);
    mono(c, j, x + 37, y + 59, 42, C.muted);
    serif(c, labels[j], x + 139, y + 60, 49);
    mono(c, vec(rows[j]), x + 403, y + 60, 39, C.blue);
    if (multipliers)
      mono(c, j === selected ? '× 1' : '× 0', 867, y + 61, 40, j === selected ? C.blue : C.muted);
  }
}
export function lookup(c, k) {
  ground(c, 'One address in the embedding table');
  const bank = phase(k, 1, 'Bank is ID zero', 0.8);
  rack(c, bankWords, bankRows, bank > 0.02 ? 0 : -1, bank * 40);
  const pt = axis(c, [1110, 690], 397, [-0.15, 1.22], [-0.13, 1.12], 0.25);
  if (k.beat.beatIndex >= 1) {
    dot(c, pt(V.money), 11, C.coral);
    text(c, 'money', 1560, 657, 31, C.coral);
    dot(c, pt(V.river), 11, C.aqua);
    text(c, 'river', 1185, 303, 31, C.aqua);
  }
  if (bank > 0) {
    c.save();
    c.globalAlpha = bank;
    arrow(c, pt([0, 0]), pt(V.bank), C.blue);
    mono(c, 'bank  ' + vec(V.bank), 1320, 463, 32, C.blue);
    c.restore();
  }
  serif(c, 'river bank', 101, 815, 58, C.aqua);
  serif(c, 'bank deposit', 101, 918, 58, C.coral);
  if (bank === 1) {
    mono(c, '→  E[0]  →  ' + vec(V.bank), 510, 813, 43, C.blue);
    mono(c, '→  E[0]  →  ' + vec(V.bank), 510, 915, 43, C.blue);
  }
  if (phase(k, 3, 'Freeze the table', 0.4) > 0.1) {
    box(c, 103, 673, 690, 58, C.sky, 5);
    tag(c, 'Table frozen for both lookups', 128, 711, C.blue);
  }
}
export function selection(c, k) {
  const b = k.beat.beatIndex,
    support = phase(k, 3, 'Back in the support vocabulary', 0.4) > 0.5;
  const labels = support ? supportWords : bankWords,
    rows = support ? supportRows : bankRows;
  ground(c, 'What does the one in a one-hot row select?');
  const move = phase(k, 2, 'Slide that row out', 1);
  rack(c, labels, rows, 0, 40 * move, true);
  tag(c, support ? 'Support vocabulary' : 'Three-row example', 1114, 273);
  mono(c, '[1, 0, 0] × E', 1114, 385, 62, C.ink);
  line(c, [1114, 421], [1777, 421], C.muted);
  if (move > 0) {
    tag(c, 'Gather row 0', 1114, 505, C.blue);
    serif(c, labels[0], 1114, 615, 82, C.blue);
    mono(c, vec(rows[0]), 1114, 704, 55, C.blue);
  }
  if (b === 1 && phase(k, 2, 'fifty thousand IDs', 1) > 0.1)
    mono(c, '50,000 × 768 = 38,400,000 values', 103, 842, 48);
  else if (b === 3) {
    serif(c, 'charge   +   able', 104, 824, 63);
    text(c, 'Two pieces can select two static rows.', 104, 913, 41, C.muted);
  } else {
    tag(c, 'Table shape', 102, 791);
    mono(c, 'vocabulary size × feature width', 102, 869, 47);
  }
}
export function concordance(c, k) {
  ground(c, 'Which words fall inside the bank window?');
  const cues = [
    [1, 'Put that pair'],
    [2, 'Count water'],
    [2, 'then river'],
    [2, 'count money'],
    [2, 'count deposit'],
    [2, 'then money again'],
  ];
  const phases = cues.map(([b, s]) => phase(k, b, s, 0.6));
  const n = phases.filter((v) => v >= 1).length;
  const active = CONTEXT_EVENTS[Math.min(n, 5)];
  tag(c, 'Window radius 4', 90, 258);
  tag(c, 'Pairs with bank', 1270, 258);
  CORPUS.forEach((sentence, idx) => {
    const y = 332 + idx * 117,
      current = idx === active.sentenceIndex && n < 6;
    if (current) box(c, 80, y - 52, 1105, 87, C.light, 4, C.grid);
    let x = 112;
    sentence.split(' ').forEach((word, j) => {
      const event = CONTEXT_EVENTS.findIndex((e) => e.sentenceIndex === idx && e.token === j);
      const ink =
        word.toLowerCase() === 'bank' ? C.blue : event >= 0 && phases[event] > 0 ? C.aqua : C.ink;
      serif(c, word, x, y + 12, 49, ink);
      const w = c.measureText(word).width;
      if (event >= 0 && phases[event] > 0)
        line(c, [x, y + 29], [x + w * phases[event], y + 29], ink, 5);
      x += w + 15;
    });
  });
  CONTEXT_WORDS.forEach((w, j) => {
    const y = 341 + j * 112;
    text(c, w, 1267, y, 44);
    const events = CONTEXT_EVENTS.map((e, i) => (e.column === j ? phases[i] : 0)).filter((v) => v > 0);
    for (let z = 0; z < 2; z++) {
      dot(c, [1565 + z * 78, y - 15], 25, C.faint, C.grid);
      if (events[z] === 1) dot(c, [1565 + z * 78, y - 15], 24, C.aqua);
    }
    mono(c, events.filter((v) => v === 1).length, 1784, y, 42, C.aqua);
  });
  if (n === 6) {
    mono(c, 'bank  →  [2, 1, 2, 1]', 105, 861, 61, C.blue);
    text(c, 'Six observed pairs', 1266, 859, 45, C.aqua);
  }
}
const words = ['apple', 'pear', 'river', 'lake'],
  contexts = ['fruit', 'sweet', 'water', 'shore'];
function matrix(c, values, x, y, cellW, cellH, precision, focus = false) {
  for (let j = 0; j < 4; j++) tag(c, contexts[j], x + (j + 0.5) * cellW, y - 21, C.muted, 'center');
  for (let i = 0; i < 4; i++) {
    serif(c, words[i], x - 27, y + (i + 0.65) * cellH, 38, C.ink, 'right');
    for (let j = 0; j < 4; j++) {
      const v = values[i][j],
        color = i < 2 ? C.sea : C.rose;
      box(
        c,
        x + j * cellW + 2,
        y + i * cellH + 2,
        cellW - 4,
        cellH - 4,
        v ? color : C.faint,
        4,
        focus && i === 0 && j === 0 ? C.ink : undefined,
        4,
      );
      mono(
        c,
        fmt(v, precision),
        x + (j + 0.5) * cellW,
        y + (i + 0.65) * cellH,
        precision ? 30 : 46,
        v ? C.ink : C.muted,
        'center',
      );
    }
  }
}
export function chance(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0 && phase(k, 1, 'larger, constructed table', 0.15) === 0) {
    ground(c, 'Shared neighbors of apple and pear');
    serif(c, 'the apple tastes sweet', 157, 442, 85);
    serif(c, 'the pear tastes sweet', 157, 626, 85);
    text(c, 'Both targets share tastes and sweet within two positions.', 160, 813, 46, C.aqua);
    return;
  }
  ground(c, b === 0 ? 'Fruit and water words have different neighbors' : 'Eight observed pairs. How many by chance?');
  matrix(c, EMBEDDING_COUNTS, 245, 349, 138, 94, 0, b > 0);
  mono(c, countModel.total + ' pairs', 252, 810, 42, C.muted);
  tag(c, 'Constructed count table', 245, 239);
  if (b === 0) {
    serif(c, 'Fruit words', 1040, 470, 70, C.aqua);
    serif(c, 'Water words', 1040, 641, 70, C.coral);
    return;
  }
  tag(c, 'apple × fruit', 1000, 268, C.aqua);
  const expected = countModel.expected[0][0],
    seen = EMBEDDING_COUNTS[0][0];
  mono(c, 'row ' + countModel.rows[0] + ' × column ' + countModel.cols[0], 1000, 384, 45);
  mono(c, '──────────────', 1000, 418, 43);
  mono(c, countModel.total + ' total', 1165, 482, 43);
  const px = horizontalScale(c, 995, 654, 703, 10, 1, 2);
  dot(c, [px(seen), 654], 13, C.aqua);
  tag(c, 'observed', px(seen), 612, C.aqua, 'center');
  if (phase(k, 3, 'Stack the eight', 0.45) > 0) {
    dot(c, [px(expected), 654], 15, C.coral);
    tag(c, 'expected', px(expected), 612, C.coral, 'center');
    if (phase(k, 3, 'Take the natural log', 0) === 1) {
      const solved = b > 2 || k.elapsed >= k.speechDuration;
      mono(c, 'ln(8 / ' + fmt(expected, 2) + ') ≈ ' + (solved ? fmt(countModel.ppmi[0][0]) : '?'), 985, 806, 42);
    }
  }
  if (b === 3) text(c, 'Empty cell → 0     Negative log ratio → 0', 205, 929, 39, C.muted);
  if (b === 4) {
    serif(c, 'hot room    /    cold room', 208, 932, 50);
    text(c, 'Shared context, opposite meanings', 1040, 929, 38, C.muted);
  }
}
export function compression(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'Fold four context columns into two coordinates');
  tag(c, 'PPMI by word and context', 216, 263);
  matrix(c, countModel.ppmi, 214, 342, 151, 92, 3);
  const strengths = countModel.singular;
  if (b === 0) {
    mono(c, 'U  Σ  V^T', 1060, 440, 92);
    text(c, 'Keep the two strongest directions.', 1026, 565, 43);
    mono(c, 'word factor   U₂ √Σ₂', 1028, 689, 42, C.blue);
    return;
  }
  mono(c, 'U₂ √Σ₂   ·   (V₂ √Σ₂)^T', 218, 832, 42);
  const flip = phase(k, 4, 'Flip one axis', 0.08) === 1 ? -1 : 1;
  const pt = axis(c, [1355, 648], 273, [-1.17, 1.17], [-0.52, 1.18], 0.5);
  countModel.vectors.forEach((v, i) => {
    const value = [v[0] * flip, v[1]],
      p = pt(value);
    arrow(c, pt([0, 0]), p, i < 2 ? C.aqua : C.coral, i % 2 === 0 ? 13 : 5);
    dot(c, p, i % 2 === 0 ? 9 : 5, i < 2 ? C.aqua : C.coral);
  });
  text(c, 'apple · pear', 1352, 376, 35, C.aqua, 'Sans', 'center');
  text(c, 'river · lake', 1355 + flip * 229, 722, 34, C.coral, 'Sans', 'center');
  tag(c, 'Retained strengths', 1048, 254);
  mono(c, strengths.map((v) => fmt(v)).join('    '), 1048, 317, 44);
  if (b >= 2) {
    mono(
      c,
      'apple · pear    cosine ' + fmt(cos(countModel.vectors[0], countModel.vectors[1])),
      1000,
      850,
      35,
    );
    mono(
      c,
      'apple · river   cosine ' + fmt(cos(countModel.vectors[0], countModel.vectors[2])),
      1000,
      909,
      35,
    );
  }
}
