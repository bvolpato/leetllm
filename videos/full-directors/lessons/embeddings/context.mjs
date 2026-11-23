import {
  C,
  arrow,
  axis,
  box,
  dot,
  ground,
  line,
  mono,
  phase,
  spoken,
  pos,
  serif,
  tag,
  text,
} from './drawing.mjs';
import {
  charge,
  clues,
  contextPath,
  cos,
  dot as product,
  FINANCE,
  fmt,
  layers,
  length,
  maskedMean,
  mix,
  names,
  plus,
  readMask,
  RIVER,
  scale,
  scores,
  V,
  vec,
  weighted,
  weights,
  winner,
} from './geometry.mjs';

export function stretch(c, k) {
  ground(c, 'One angle, two ways to score it');
  const b = k.beat.beatIndex;
  const doubled = phase(k, 3, 'Stretch the diagonal', 1.4);
  const shortened = phase(k, 3, 'shorten it to unit length', 1.4);
  const current = scale([1, 1], pos(1 + doubled, 1 / Math.sqrt(2), shortened));
  const u = [1, 0],
    pt = axis(c, [192, 828], 269, [-0.15, 2.48], [-0.12, 2.17], 0.5);
  const tip = pt(current),
    projected = pt([current[0], 0]);
  line(c, tip, projected, C.coral, 4, [11, 10]);
  arrow(c, pt([0, 0]), pt(u), C.blue, 10);
  arrow(c, pt([0, 0]), tip, C.coral, 10);
  c.beginPath();
  c.arc(192, 828, 91, -Math.PI / 4, 0);
  c.lineWidth = 4;
  c.strokeStyle = C.gold;
  c.stroke();
  mono(c, 'u', 448, 884, 34, C.blue);
  mono(c, 'v', tip[0] + 19, tip[1] - 15, 34, C.coral);
  mono(c, 'u = [1, 0]', 982, 288, 48, C.blue);
  mono(c, 'v = ' + vec(current), 982, 372, 48, C.coral);
  line(c, [982, 415], [1803, 415], C.grid);
  tag(c, 'Dot product', 982, 493);
  mono(c, fmt(product(u, current)), 982, 585, 78);
  if (b >= 1) {
    tag(c, 'Cosine · dot divided by both lengths', 982, 684);
    mono(c, fmt(product(u, current)) + ' / (1 × ' + fmt(length(current)) + ')', 982, 753, 42);
    mono(c, '≈ ' + fmt(cos(u, current)), 982, 845, 69, C.aqua);
  }
  if (b >= 3) text(c, 'Unit directions: parallel 1, perpendicular 0, opposite −1.', 103, 966, 38);
}
function bankAxes(c) {
  const pt = axis(c, [174, 807], 575, [-0.08, 1.22], [-0.08, 1.03], 0.25);
  tag(c, 'toward river', 105, 201, C.aqua);
  tag(c, 'toward money', 749, 900, C.coral, 'center');
  return pt;
}
function chain(c, pt, rows, shares, times, color) {
  const path = contextPath(rows, shares);
  rows.forEach((_, i) => {
    if (times[i] <= 0) return;
    const from = path[i],
      to = mix(from, path[i + 1], times[i]);
    arrow(c, pt(from), pt(to), color, 9, 21);
    dot(c, pt(from), 5, color);
  });
}
export function bankMix(c, k) {
  ground(c, 'Construct the state at bank');
  const pt = bankAxes(c);
  const half = phase(k, 1, 'Lay down half', 0.9),
    river = phase(k, 1, 'add four tenths', 1);
  const water = phase(k, 1, 'then one tenth', 0.7),
    money = phase(k, 1, 'add half of money', 0.9);
  const restart = phase(k, 1, 'start again from half', 0.9);
  const move = phase(k, 2, 'Follow each copy', 1.55);
  const rows = [V.bank, V.river, V.water],
    shares = [0.5, 0.4, 0.1];
  chain(c, pt, rows, shares, [half, river, water], C.aqua);
  chain(c, pt, [V.bank, V.money], [0.5, 0.5], [restart, money], C.coral);
  const stored = pt(V.bank);
  for (const [target, color] of [
    [RIVER, C.aqua],
    [FINANCE, C.coral],
  ]) {
    const q = pt(mix(V.bank, target, move));
    if (move > 0) {
      line(c, stored, q, color, 3, [8, 7]);
      dot(c, q, 13, color);
    }
  }
  dot(c, stored, 12, C.light, C.blue, 5);
  if (k.beat.beatIndex === 2) {
    tag(c, 'One position in a Transformer', 989, 250);
    serif(c, 'Allowed positions', 989, 365, 54);
    const labels = ['bank', 'river', 'water'];
    labels.forEach((label, i) => {
      const x = 991 + i * 257;
      box(c, x, 411, 218, 77, i === 0 ? C.sky : C.sea, 5);
      text(c, label, x + 109, 463, 40, i === 0 ? C.blue : C.aqua, 'Sans', 'center');
      arrow(c, [x + 109, 499], [1265 + i * 30, 582], C.muted, 4, 15);
    });
    mono(c, 'Attention mixes value vectors', 988, 654, 38);
    arrow(c, [1312, 690], [1312, 754], C.muted, 5, 16);
    serif(c, 'Feed-forward at bank', 989, 845, 52, C.blue);
    return;
  }
  tag(c, 'Word', 942, 229);
  tag(c, 'Stored row', 1115, 229);
  tag(c, 'Weight', 1392, 229);
  tag(c, 'Step at full length', 1550, 229);
  const construction = (title, labels, shares, times, top, ink) => {
    serif(c, title, 940, top, 46, ink);
    labels.forEach((word, i) => {
      const y = top + 70 + 62 * i;
      const row = V[word];
      text(c, word, 942, y, 39);
      mono(c, vec(row), 1115, y, 35);
      mono(c, '× ' + fmt(shares[i]), 1384, y, 35);
      if (times[i] === 1) mono(c, vec(scale(row, shares[i])), 1547, y, 35, ink);
    });
    if (times.at(-1) === 1) {
      const y = top + 83 + 62 * labels.length;
      line(c, [1114, y - 44], [1832, y - 44], C.grid);
      tag(c, 'Tip', 1445, y, ink);
      mono(c, vec(weighted(labels.map((w) => V[w]), shares)), 1547, y, 38, ink);
    }
  };
  construction('Water reaches the river bank', ['bank', 'river', 'water'], shares, [half, river, water], 321, C.aqua);
  if (phase(k, 1, 'For the deposit sentence', 0) === 1)
    construction('Deposit money at the bank', ['bank', 'money'], [0.5, 0.5], [restart, money], 689, C.coral);
}
export function midpoint(c, k) {
  ground(c, 'Which ticket changes guide at the crease?');
  const pt = axis(c, [175, 828], 560, [-0.08, 1.29], [-0.08, 1.09], 0.25);
  const out = [phase(k, 3, 'Move the invoice copy', 1.25), phase(k, 4, 'Move the phone copy', 1.25)];
  const strip = phase(k, 2, 'Stretch a strip', 1);
  clues.forEach((clue, i) => {
    const color = i ? C.aqua : C.coral;
    const q = mix(charge, clue, 0.5 * out[i]),
      qp = pt(q);
    line(c, pt([0, 0]), pt(clue), color, 3, [7, 8]);
    dot(c, pt(clue), 10, color);
    tag(c, names[i], pt(clue)[0] + 17, pt(clue)[1] + (i ? 37 : -14), color);
    if (strip > 0) {
      line(c, pt(charge), pt(mix(charge, clue, strip)), i ? C.sea : C.rose, 21);
      line(c, pt(charge), pt(mix(charge, clue, strip)), color, 2, [6, 9]);
    }
    if (out[i] > 0) {
      arrow(c, pt([0, 0]), qp, color, 7, 21);
      const start = pt(charge),
        end = pt(clue),
        norm = Math.hypot(end[0] - start[0], end[1] - start[1]);
      const dx = (19 * (end[1] - start[1])) / norm,
        dy = (19 * (start[0] - end[0])) / norm;
      line(c, [qp[0] - dx, qp[1] - dy], [qp[0] + dx, qp[1] + dy], color, 4);
      dot(c, qp, 10, C.light, color, 4);
    }
    const y = 278 + 329 * i,
      row = scores(q, clues, cos);
    serif(c, i ? 'charge the phone' : 'charge on the invoice', 961, y, 59, color);
    mono(c, 'Query   ' + vec(q), 965, y + 69, 41);
    const trialDone = i
      ? phase(k, 4, 'The query was already', 0.2)
      : phase(k, 3, 'Its cosine rose', 0.2);
    if (out[i] === 0 || trialDone > 0) {
      mono(c, 'Invoice ' + fmt(row[0]) + '     Phone ' + fmt(row[1]), 965, y + 136, 36);
      if (k.beat.beatIndex !== 1)
        text(
          c,
          'Opens ' + names[winner(row)].toLowerCase() + ' guide',
          966,
          y + 201,
          39,
          color,
          'Sans',
          'left',
          600,
        );
    }
    if (!i) line(c, [965, y + 245], [1817, y + 245], C.grid);
  });
  dot(c, pt(charge), 13, C.light, C.blue, 5);
  mono(c, 'Stored  ' + vec(charge), 185, 947, 36, C.blue);
}
export function elmo(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    ground(c, 'Make the three ELMo layers the same width');
    const ys = [352, 528, 705],
      width = 450;
    ['Character input', 'Context layer 1', 'Context layer 2'].forEach((s, i) => {
      serif(c, s, 93, ys[i] + 55, 51);
      const first = i ? '512 forward' : '512 from spelling';
      const second = i ? '512 backward' : '512 copied';
      box(c, 578, ys[i] - 10, width, 97, C.sea, 5, C.aqua);
      text(c, first, 578 + width / 2, ys[i] + 52, 37, C.aqua, 'Sans', 'center');
      if (i || phase(k, 2, 'duplicates that vector', 0.6) > 0) {
        box(c, 1029, ys[i] - 10, width, 97, C.sky, 5, C.blue);
        text(c, second, 1029 + width / 2, ys[i] + 52, 37, C.blue, 'Sans', 'center');
        mono(c, '1024', 1554, ys[i] + 53, 46);
      }
    });
    text(c, 'Separate forward and backward LSTM weights', 99, 907, 44);
    return;
  }
  if (k.beat.id === 'c15-b06') {
    ground(c, 'What can a masked-word encoder read?');
    serif(c, 'She checked the', 119, 509, 77);
    box(c, 777, 413, 335, 134, C.sky, 8, C.blue, 3);
    mono(c, '[MASK]', 945, 500, 58, C.blue, 'center');
    serif(c, 'on the invoice.', 1160, 509, 77);
    arrow(c, [351, 628], [812, 628], C.aqua, 8);
    arrow(c, [1523, 628], [1080, 628], C.coral, 8);
    if (k.reveal('predicting the originals', 0.55) > 0)
      serif(c, 'charge', 950, 796, 82, C.blue, 'center');
    return;
  }
  ground(c, 'Hold the layer weights. Change the token.');
  const change = phase(k, 5, 'Switch to the second', 0) === 1 ? 1 : 0;
  const gamma = 1 + phase(k, 3, 'With gamma equal to two', 0.8);
  const rows = layers[change],
    sum = weighted(rows, weights),
    output = scale(sum, gamma);
  const answer = k.beat.id === 'c15-transfer-answer';
  const solved = (cue) => !change || (answer && k.reveal(cue, 0) === 1);
  const productCues = ['The second product', 'The third product', 'Sum the products'];
  tag(c, 'Task weight', 106, 275);
  tag(c, 'State at token ' + (change ? 'B' : 'A'), 435, 275);
  tag(c, 'Contribution', 879, 275);
  rows.forEach((v, i) => {
    const y = 353 + i * 120;
    box(c, 103, y - 16, 267, 25, C.faint, 9);
    box(c, 103, y - 16, 267 * weights[i], 25, C.aqua, 9);
    mono(c, weights[i], 107, y + 61, 36, C.aqua);
    mono(c, vec(v), 441, y + 37, 48);
    mono(c, solved(productCues[i]) ? vec(scale(v, weights[i])) : '?', 881, y + 37, 44, C.blue);
  });
  line(c, [863, 692], [1292, 692], C.muted);
  mono(c, solved('Double both coordinates') ? vec(sum) : '?', 880, 769, 48, C.blue);
  tag(c, 'Output', 1390, 439);
  mono(c, 'γ = ' + fmt(gamma, 2), 1390, 522, 50);
  mono(c, solved('The task weights choose') ? vec(output) : '?', 1390, 635, 52, C.coral);
  text(c, 'The same three weights apply at every position.', 109, 899, 46);
}
const windows = [
  { label: 'Encoder at charge', causal: false, position: 0 },
  { label: 'Causal at charge', causal: true, position: 0 },
  { label: 'Causal at last word', causal: true, position: 2 },
];
export function visibility(c, k) {
  ground(c, 'Who can read the word to the right of charge?');
  const edit = phase(k, 3, 'Replace phone with invoice', 0.8);
  const pinned = spoken(k, 4, 'at charge stays pinned');
  const mayChange = spoken(k, 4, 'They may change');
  const original = ['charge', 'the', 'phone'],
    tokens = ['charge', 'the', edit > 0.5 ? 'invoice' : 'phone'];
  const xs = [698, 982, 1266],
    w = 227;
  tokens.forEach((s, i) => {
    const x = xs[i];
    if (i === 2 && edit > 0) box(c, x - 12, 218, w + 24, 100, C.rose, 5);
    serif(c, s, x + w / 2, 286, 55, i === 2 ? C.coral : C.ink, 'center');
  });
  for (let i = 0; i < 3; i++) {
    if (i === 2 && k.beat.beatIndex === 0) continue;
    const y = 385 + 155 * i,
      state = windows[i],
      seen = readMask(state.causal, state.position, tokens);
    text(c, state.label, 90, y + 65, 44, C.ink);
    for (let j = 0; j < 3; j++) {
      const x = xs[j],
        allowed = j < seen.length;
      box(c, x, y, w, 97, allowed ? C.light : C.steel, 4, allowed ? C.grid : C.steel, 3);
      if (allowed) serif(c, tokens[j], x + w / 2, y + 65, 45, j === 2 ? C.coral : C.blue, 'center');
      else
        for (let a = 0; a < 4; a++)
          line(c, [x + 13, y + 17 + a * 21], [x + w - 13, y + 17 + a * 21], '#608080', 3);
    }
    const fixed = seen.join(' ') === readMask(state.causal, state.position, original).join(' ');
    if (fixed ? pinned : mayChange) {
      tag(c, fixed ? 'Pinned' : 'May change', 1545, y + 58, fixed ? C.blue : C.coral);
      if (fixed) {
        box(c, 1520, y + 37, 11, 20, C.blue, 3);
        dot(c, [1525, y + 34], 9, C.blue);
      }
    }
  }
  text(
    c,
    k.beat.beatIndex >= 2
      ? 'Same model weights, positions and earlier IDs'
      : 'Open windows show permitted inputs.',
    92,
    854,
    39,
    C.muted,
  );
}
export function neighbors(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    ground(c, 'Which unit will the task compare?');
    tag(c, 'Illustrative token split', 99, 294);
    const parts = ['un', 'plug', 'the', 'phone'];
    parts.forEach((p, i) => {
      box(c, 101 + i * 409, 359, 380, 142, i < 2 ? C.sky : C.light, 6, C.grid, 2);
      serif(c, p, 289 + i * 409, 452, 67, C.ink, 'center');
    });
    const scopes = [
      ['one piece', 1],
      ['one word', 2],
      ['whole message', 4],
    ];
    scopes.forEach(([label, n], i) => {
      const y = 602 + i * 128,
        x1 = 107,
        x2 = 99 + n * 409 - 32;
      line(c, [x1, y], [x2, y], C.blue, 5);
      line(c, [x1, y - 16], [x1, y + 1], C.blue, 5);
      line(c, [x2, y - 16], [x2, y + 1], C.blue, 5);
      text(c, label, x1, y + 51, 37);
    });
    return;
  }
  ground(c, 'Which clue does each bank occurrence face?');
  const pt = bankAxes(c);
  const states = [RIVER, FINANCE],
    ink = [C.aqua, C.coral];
  const row = pt(V.bank);
  arrow(c, pt([0, 0]), row, C.blue, 5);
  dot(c, row, 10, C.light, C.blue, 4);
  states.forEach((v, i) => {
    const p = pt(v);
    line(c, row, p, ink[i], 4, [7, 6]);
    arrow(c, pt([0, 0]), p, ink[i], 8);
    const y = 376 + i * 262;
    serif(c, i ? 'Deposit occurrence' : 'River occurrence', 969, y, 57, ink[i]);
    const on = i
      ? phase(k, 1, 'Now compare the deposit occurrence', 0.4)
      : phase(k, 1, 'compare bank with river', 0.4);
    if (on > 0)
      mono(c, 'river ' + fmt(cos(v, V.river)) + '    money ' + fmt(cos(v, V.money)), 969, y + 82, 41);
  });
  if (b === 1) mono(c, 'Both lookups   E[0] = ' + vec(V.bank), 968, 906, 37, C.blue);
}
export function pooling(c, k) {
  if (k.beat.beatIndex === 5) {
    ground(c, 'How many tickets show a relevant guide in the first two?');
    const ranks = [1, 2, 5],
      tickets = ['Charge on invoice', 'Charge the phone', 'Change billing address'];
    const visible = 2,
      hits = ranks.filter((rank) => rank <= visible).length;
    const showCount = k.reveal('Two out of three', 0);
    const showMetric = k.reveal('mean recall at two', 0, { captionStart: 'That is mean recall' });
    tag(c, 'Labeled test ticket', 95, 270);
    tag(c, 'Rank of the relevant guide', 822, 270);
    tickets.forEach((name, i) => {
      const y = 390 + i * 146;
      serif(c, name, 95, y, 50);
      for (let j = 1; j <= 5; j++) {
        const x = 829 + (j - 1) * 165,
          hit = j === ranks[i];
        box(c, x, y - 60, 123, 83, hit ? C.sea : C.faint, 5, hit ? C.aqua : C.grid);
        mono(c, j, x + 61, y - 4, 46, hit ? C.aqua : C.muted, 'center');
      }
    });
    line(c, [1133, 302], [1133, 755], C.coral, 4, [10, 8]);
    tag(c, 'Screen ends at rank 2', 1133, 804, C.coral, 'center');
    if (showCount) {
      const count = hits + ' / ' + ranks.length;
      mono(c, showMetric ? count + ' = mean recall@' + visible : count, 98, 924, 52, C.aqua);
    }
    return;
  }
  ground(c, 'Which rows count toward a message mean?');
  const b = k.beat.beatIndex,
    pad = phase(k, 3, 'Append a fourth row', 0.85);
  const values = [V.bank, V.river, V.water],
    mask = [1, 1, 1];
  if (pad > 0) {
    values.push([1, 1]);
    mask.push(0);
  }
  const valid = mask.reduce((s, x) => s + x, 0),
    mean = maskedMean(values, mask);
  const sum = values.reduce((s, v, i) => plus(s, scale(v, mask[i])), [0, 0]);
  tag(c, 'Stored row', 111, 274);
  tag(c, 'Validity', 538, 274);
  tag(c, 'Admitted row', 808, 274);
  values.forEach((v, i) => {
    const y = 330 + i * 117,
      x = i === 3 ? pos(45, 101, pad) : 101;
    box(c, x, y, 345, 86, C.light, 5, C.grid);
    mono(c, vec(v), x + 36, y + 57, 42);
    line(c, [x + 352, y + 43], [554, y + 43], C.grid, 3);
    box(c, 554, y - 4, 102, 93, mask[i] ? C.sea : C.steel, 4);
    mono(c, mask[i], 606, y + 58, 50, mask[i] ? C.aqua : C.light, 'center');
    if (mask[i]) {
      arrow(c, [666, y + 43], [789, y + 43], C.aqua, 6, 16);
      mono(c, vec(v), 812, y + 57, 40, C.aqua);
    } else text(c, 'Padding excluded', 809, y + 54, 36, C.muted);
  });
  tag(c, 'Sum of admitted rows', 1210, 352);
  if (phase(k, 1, 'The sum is', 0.35) > 0) mono(c, vec(sum), 1210, 445, 57, C.blue);
  line(c, [1199, 476], [1717, 476], C.muted, 4);
  mono(c, valid + ' valid rows', 1210, 554, 45);
  if (phase(k, 1, 'That gives', 0.35) > 0) mono(c, vec(mean), 1210, 672, 55, C.aqua);
  if (b === 3)
    mono(c, 'Wrong divisor:  ' + vec(sum) + ' / 4 = ' + vec(scale(sum, 0.25)), 104, 916, 41, C.coral);
  if (b === 1) text(c, 'Another trained summary can use a designated token.', 106, 920, 39);
  if (b >= 4) text(c, 'Held-out tickets → pooled query → ranked guides → recall at k', 106, 916, 43);
}
