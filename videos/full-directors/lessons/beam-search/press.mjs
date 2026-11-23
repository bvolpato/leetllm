import { ink, muted, brass, colors, fmt, pct, sum, lerp } from './studio.mjs';
import {
  POLICY_LOGITS as logits,
  POLICY_TOKENS as words,
  base,
  stablePolicy,
  penalize,
  replay,
  sample,
  hallArrivals,
  hallKept,
  hallExits,
  hallRow,
  hallPrefixes,
  greedyFirst,
  greedyLast,
} from './examples.mjs';

const scoreWord = words[logits.indexOf(Math.max(...logits))];
const drawWord = words[sample(base.probabilities, 0.75)];
export function opening(s) {
  const { b, word, label, tile, slot, strip, row, guide, line, rect } = s;
  label('Key rotation', 115, 96);
  s.key(1710, 110, 0.75);
  word('The first step is', 110, 248, 98);
  slot(850, 175, 605, 142);
  const lift = s.ramp(2, 'Revoke', 0.75);
  if (lift > 0) tile(lerp(1250, 850, lift), lerp(530, 175, lift), 605, 142, drawWord, colors[1], 80);
  if (b >= 3) label('Weighted draw', 853, 137, 31);
  if (b <= 2) {
    strip(base.probabilities, words, 116, 555, 1688, 155, { pin: 0.75, pinText: 'draw  0.75' });
    label('Uniform draw along one unit', 116, 810, 39);
    line(1793, 732, 1793, 779, muted, 3);
    line(1742, 779, 1793, 779, muted, 3);
    label('quota', 1717, 780, 32, muted, 'right');
  } else {
    label('Raw model scores', 116, 413, 36);
    row(words, 116, 480, 1690, 100);
    logits.forEach((v, i) => s.mono(fmt(v), 318 + i * 422.5, 664, 61, ink, 'center'));
    label('Highest score', 116, 819, 41);
    if (s.on(4, 'Create wins')) tile(570, 755, 420, 115, scoreWord, colors[0], 66);
    else slot(570, 755, 420, 115);
    if (b === 5) {
      rect(69, 373, 1778, 368, '#f4ead4');
      guide(['create', 'deploy', 'revoke'], 543);
      line(112, 690, 1799, 690, muted, 2);
    }
  }
}
function hallComparison(s) {
  if (s.on(5, 'A transformer')) {
    const products = s.on(5, 'For the window exit');
    s.head('Transformer example', 'The same exits can have different probabilities');
    s.label('Prefix and path probability', 110, 331, 34);
    s.label('Next token', 893, 331, 34);
    s.label('Conditional', 1300, 331, 34, muted, 'center');
    if (products) s.label('Path probability', 1640, 331, 34, muted, 'center');
    hallPrefixes.forEach((route, i) => {
      const y = 496 + i * 284;
      s.tile(112, y - 55, 503, 111, route.via + ' → hall', colors[i], 57);
      s.mono(fmt(route.probability), 363, y + 100, 44, ink, 'center');
      hallExits.forEach((exit, j) => {
        const yy = y + (j ? 61 : -61);
        s.line(621, y, 879, yy, muted, 4);
        s.tile(884, yy - 42, 270, 84, exit, '#e9dcbf', 47);
        s.mono(fmt(route.next[j]), 1300, yy, 48, ink, 'center');
        if (products) s.mono(fmt(route.probability * route.next[j]), 1640, yy, 50, ink, 'center');
      });
    });
    return;
  }
  const kept = s.on(5, 'Keep the foyer route');
  s.head('Viterbi   /   finite-state model', 'Which route should Viterbi keep?');
  s.label('Probability of reaching the hall', 110, 333, 36);
  s.label('Final move from the hall', 1190, 333, 36);
  hallArrivals.forEach((route, i) => {
    const y = 467 + i * 284;
    const discarded = kept && route !== hallKept;
    s.line(547, y, 822, 606, discarded ? '#a2a597' : ink, discarded ? 4 : 6, discarded ? [12, 10] : []);
    s.tile(111, y - 55, 425, 111, 'via ' + route.via, discarded ? '#d3ceba' : colors[i], 60);
    s.mono(fmt(route.probability), 323, y + 108, 47, ink, 'center');
    if (kept) s.label(discarded ? 'dropped' : 'kept', 489, y + 108, 37, muted, 'center');
  });
  hallExits.forEach((exit, i) => {
    const y = 465 + i * 284;
    s.line(1060, 606, 1484, y, ink, 5);
    s.mono(fmt(hallRow[i]), 1250, i ? 736 : 474, 46, ink, 'center');
    s.route(exit, 1572, y, 0.65);
    s.word(exit, 1670, y, 49);
  });
  s.tile(814, 551, 253, 110, 'hall', brass, 61);
  if (s.on(5, 'Through the door')) {
    const totals = hallArrivals.map(route => route.via + '  ' + fmt(route.probability * hallRow[0]));
    s.label('Path through the door', 110, 943, 38);
    s.mono(totals.join('      '), 589, 943, 46);
  }
}
export function space(s) {
  const { b, head, line, circle, label } = s;
  if (b === 5) return hallComparison(s);
  head('Continuation tree', 'One prefix, one next-token row');
  const x = [170, 565, 1020, 1560],
    groups = [1, 3, 9, 27];
  function y(d, i) {
    return 318 + ((i + 0.5) * 565) / groups[d];
  }
  const depth = b >= 3 ? 3 : 2;
  const drawn = b === 6 ? 1 + Math.floor(2 * s.ramp(6, 'draw one conditional token', 1.8)) : depth;
  for (let d = 1; d <= depth; d++)
    for (let j = 0; j < groups[d]; j++) {
      const active = d <= drawn && [0, 1, 4, 13][d] === j;
      line(x[d - 1], y(d - 1, Math.floor(j / 3)), x[d], y(d, j), active ? ink : '#afb5a5', active ? 7 : 2);
      circle(x[d], y(d, j), active ? 12 : 6, active ? '#9c542d' : muted);
    }
  circle(x[0], y(0, 0), 14, ink);
  if (b < 3 || b === 6) {
    label('p₁', 355, 555, 36);
    label('p₂ | prefix', 710, 555, 36);
  }
  const annotation = [
    'P(path) = P(first) × P(next | first) × …',
    'log P(path) = sum of conditional log probabilities',
    '1 prompt     →     3     →     9     →     27 paths',
    '32,000 choices at each of 100 positions     32,000¹⁰⁰ ≈ 3.27 × 10⁴⁵⁰',
    '',
    'Draw at each fork. Multiply the probabilities on the selected path.',
  ][b - 1];
  label(annotation, 105, 946, 39);
}
function columns(s, headers, stages) {
  const start = 495,
    pitch = 1290 / headers.length;
  headers.forEach((w, i) => s.tile(start + i * pitch, 307, pitch - 16, 87, w, colors[i], 46));
  stages.forEach(([name, vals], j) => {
    const y = 477 + j * 117;
    s.label(name, 106, y, 35);
    s.line(106, y + 51, 1807, y + 51, '#abb19d', 2);
    vals.forEach((v, i) =>
      s.mono(
        typeof v === 'number' ? fmt(v) : v,
        start + (i + 0.48) * pitch,
        y,
        49,
        ink,
        'center',
        pitch - 20,
      ),
    );
  });
}
export function softmax(s) {
  s.head('Softmax', 'How much of the strip does each word own?');
  const stages = [['Raw logit', logits]];
  if (s.on(2, 'Subtract three')) stages.push(['Subtract max', base.shifted]);
  if (s.on(2, 'Now exponentiate')) stages.push(['Weight', base.weights]);
  if (s.on(3, 'Divide each weight')) stages.push(['Weight ÷ ' + fmt(base.total), base.probabilities]);
  columns(s, words, stages);
  if (s.b >= 3)
    s.strip(base.probabilities, words, 485, 918, 1300, 56, s.b === 4 ? { pin: 0.75 } : undefined);
}
export function limits(s) {
  const { b, on } = s;
  if (b < 3) {
    s.head('Floating point', 'A common shift keeps the shares');
    const z = [1000, 999, 998],
      m = stablePolicy(z);
    const stages = [['Raw logit', z]];
    if (on(1, 'Direct exponentiation')) stages.push(['exp(raw)', ['∞', '∞', '∞']]);
    if (on(1, 'Subtracting the maximum')) stages.push(['Shift by −1000', m.shifted]);
    if (on(1, 'produce about')) stages.push(['Probability', m.probabilities]);
    columns(s, words.slice(0, 3), stages);
  } else if (b === 3) {
    s.head('Floating point', 'Two routes from a logit gap of −1000');
    const tiny = stablePolicy([0, -1000]);
    columns(
      s,
      ['largest', 'distant'],
      [
        ['Shifted logit', tiny.shifted],
        ['Probability', tiny.probabilities],
        ['log(rounded p)', ['0', '−∞']],
        ['Direct log-softmax', tiny.logProbabilities],
      ],
    );
  } else {
    s.head('Mask check', 'Does any candidate have positive weight?');
    columns(s, words.slice(0, 3), [
      ['Mask', ['−∞', '−∞', '−∞']],
      ['Weight', [0, 0, 0]],
    ]);
    s.word('Empty row', 105, 804, 73);
    s.label('Reject before drawing', 780, 804, 55);
  }
}
export function greedy(s) {
  const append = s.on(1, 'Append that token'),
    stop = s.on(3, 'The period wins');
  s.head('Greedy decoding', stop ? 'The decoder has used both score rows' : 'Append a word. Read the new row.');
  s.word('The first rotation step is', 100, 367, 67);
  if (append) s.tile(970, 309, 430, 112, greedyLast.prefix[0], colors[0], 64);
  else s.slot(970, 309, 430, 112);
  if (stop) s.tile(1420, 309, 108, 112, greedyLast.prefix[1], colors[1], 74);
  const { labels, logits: zs } = append ? greedyLast : greedyFirst;
  s.label(append ? 'Scores after “create”' : 'Scores after the prompt', 110, 516, 36);
  s.row(labels.map(w => w === 'period' ? 'period (.)' : w), 110, 597, 1685, 108);
  zs.forEach((z, i) => s.mono(fmt(z), 110 + ((i + 0.5) * 1685) / zs.length, 782, 64, ink, 'center'));
  if (stop)
    s.label(
      s.b === 4
        ? 'Cached attention state belongs to this prefix.'
        : 'The period adds punctuation. The example ends after two tokens.',
      110,
      909,
      40,
    );
}
export function penalty(s) {
  const { b, on } = s;
  s.head('Repetition penalty', 'Move each seen score once');
  const neg = on(3, 'Negative one becomes'),
    positive = on(2, 'Divide its positive score');
  const lines = [
    ['create   ·   seen', 3, positive ? penalize(3, 1.2) : 3],
    ['deploy   ·   unseen', 2.8, 2.8],
  ];
  if (b >= 3) lines.push(['seen negative', -1, neg ? penalize(-1, 1.2) : -1]);
  if (b >= 4) lines.push(['seen zero', 0, 0]);
  const sx = (z) => 625 + (z + 1.5) * 238;
  lines.forEach(([name, old, z], i) => {
    const y = 398 + i * 144;
    s.label(name, 110, y, 39);
    s.line(625, y, 1780, y, '#a1a695', 3);
    if (old !== z) {
      s.circle(sx(old), y, 15, '#b6b6a4');
      s.line(sx(old), y, sx(z), y, '#8f562f', 8);
    }
    s.circle(sx(z), y, 19, ink);
    s.mono(fmt(z), sx(z), y - 43, 39, ink, 'center');
  });
  s.label(positive ? 'Highest score   deploy  2.8' : 'Highest score   create  3', 110, 932, 42);
}
export function temperature(s) {
  const { b, on } = s,
    t = b === 1 ? 0.5 : 2;
  const limits = b >= 4,
    hot = b === 5;
  const p = limits
    ? hot
      ? [1 / 3, 1 / 3, 1 / 3, 0]
      : [0.5, 0.5, 0, 0]
    : stablePolicy(logits, t).probabilities;
  s.head('Temperature', limits ? 'Two equal maxima and one mask' : 'Change the gaps before softmax');
  const names = limits ? ['A', 'B', 'C', 'mask'] : words;
  const sub = limits ? ['2', '2', '0', '−∞'] : logits.map((v) => fmt(v / t));
  s.label(limits ? 'Raw logits' : 'Logits ÷ ' + fmt(t), 112, 348, 37);
  names.forEach((w, i) => {
    let x = 513 + i * 310;
    s.label(w, x, 340, 36, muted, 'center');
    s.mono(sub[i], x, 418, 53, ink, 'center');
  });
  s.strip(p, names, 110, 590, 1690, 108);
  const foot = limits
    ? hot
      ? 'T → ∞       finite tokens share the strip equally'
      : 'T → 0⁺       A and B split the strip. First-index greedy picks A.'
    : 'T = ' + fmt(t) + '       H = ' + fmt(stablePolicy(logits, t).entropy) + ' nats';
  s.mono(foot, 110, 826, 42, ink, 'left', 1680);
  if (b === 3) s.label('H = −Σ p log p     ·     zero-mass terms contribute zero', 110, 911, 35);
}
export function stream(s) {
  s.head('Sampler replay', 'Two impressions from the same seed');
  const n = s.b > 1 ? 8 : Math.floor(8 * s.ramp(1, 'Seed seven twice', 2.5));
  for (let lane = 0; lane < 2; lane++) {
    const y = 368 + lane * 202;
    s.label('Run ' + (lane + 1) + '   ·   seed 7', 110, y - 39);
    replay.forEach((u, i) => {
      const x = 110 + i * 211;
      if (i < n) {
        const v = sample(base.probabilities, u);
        s.tile(x, y, 198, 112, words[v], colors[v], 46);
      } else s.slot(x, y, 198, 112);
    });
  }
  if (s.b === 2) s.label('For generated text, append the draw before rescoring the prefix.', 110, 879, 43);
  if (s.b >= 3) {
    const swap = s.on(3, 'a near tie');
    s.mono(
      swap
        ? 'Build II    A 1.0000001    B 0.9999999    → A'
        : 'Build I     A 0.9999999    B 1.0000001    → B',
      110,
      844,
      43,
    );
  }
  if (s.b === 4)
    s.label(
      'Replay record    model · tokenizer · prompt · seed · settings · runtime · stop reason',
      110,
      932,
      34,
    );
}
