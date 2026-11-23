import assert from 'node:assert/strict';
import { CREDENTIAL_ROWS } from '../../../films/retrieval-indexing/fixtures.mjs';
import { tokenize } from '../../../films/retrieval-indexing/analysis.mjs';
import { vectorCosine, vectorDot } from '../../../films/retrieval-indexing/vector-search.mjs';
import {
  sparse,
  dense,
  fused,
  reranked,
  jointScores,
} from '../../../films/retrieval-indexing/credential-shortlist.mjs';
import { idNames, lerp } from './studio.mjs';
const pages = {
  d1: 'API key rotation guide. Create a replacement key, deploy it, then revoke the old key.',
  d2: 'Generate a new credential before disabling the previous credential.',
  d3: 'Change a project display name in workspace settings.',
  d4: 'API key quota dashboard. Usage limits reset daily.',
};
const tokens = Object.fromEntries(Object.entries(pages).map(([id, text]) => [id, tokenize(text)]));
const containing = (term) => Object.keys(pages).filter((id) => tokens[id].includes(term));
const weight = (f, k, L = 1) => (f ? ((k + 1) * f) / (f + k * L) : 0);
const repeatExample = { k: 2, counts: [2, 8] };
const lengthAvg = Object.values(tokens).reduce((a, t) => a + t.length, 0) / 4;
const apiScore = (id, term) =>
  Math.log(1 + (4 - containing(term).length + 0.5) / (containing(term).length + 0.5)) *
  weight(
    tokens[id].filter((t) => t === term).length,
    1.2,
    0.25 + (0.75 * tokens[id].length) / lengthAvg,
  );
const query = [1, 0.8, 0];
const rankedVectors = CREDENTIAL_ROWS.map((d) => ({ ...d, score: vectorCosine(query, d.v) })).sort(
  (a, b) => b.score - a.score,
);
function analyzer(p) {
  const { at, c, beat } = p;
  if (beat >= 4) {
    p.title('Keep the part that distinguishes the codes', 'FIELD DESIGN');
    const exact = at(5, 'keyword field');
    p.mono('Source identifier', 100, 322, 34, c.soft);
    p.mono('Analyzed text', 780, 322, 34, c.blue);
    if (exact) p.mono('Keyword field', 1373, 322, 34, c.green);
    ['AUTH_401', 'AUTH_403', 'rotate_api_key()'].forEach((s, i) => {
      const y = 453 + i * 177;
      p.mono(s, 103, y, 52);
      p.arrow(620, y - 19, 719, y - 19, c.rule, 4);
      p.mono(tokenize(s).join(' · '), 776, y, 42, c.blue);
      if (exact) p.mono(s, 1369, y, 44, c.green);
    });
    return;
  }
  p.title('How do I rotate an API key?', 'SEARCH THE DOCUMENTATION');
  const excerpts = [
    ['API key rotation guide.', 'Create a replacement key, deploy it,', 'then revoke the old key.'],
    ['Generate a new credential before', 'disabling the previous credential.'],
    ['Change a project display name', 'in workspace settings.'],
    ['API key quota dashboard.', 'Usage limits reset daily.'],
  ];
  excerpts.forEach((lines, i) => {
    const id = 'd' + (i + 1),
      x = 101 + (i % 2) * 886,
      y = 275 + Math.floor(i / 2) * 287;
    p.strip(x, y, 815, 237);
    p.mono(id, x + 31, y + 59, 36, c.gold);
    lines.forEach((s, j) => p.text(s, x + 124, y + 62 + 52 * j, 39, c.ink, 'Serif'));
  });
  if (at(2, 'question becomes'))
    ['rotate', 'api', 'key'].forEach((s, i) =>
      p.mono(s + ' → ' + (containing(s).join(', ') || 'none'), 101 + i * 580, 925, 39, c.blue),
    );
}
function controls(p) {
  const { c, at, beat } = p;
  if (beat <= 3) {
    p.title('Three mentions of key', 'BM25   /   ROTATION GUIDE');
    p.text('f × (k₁ + 1)', 165, 481, 82, c.ink, 'Serif');
    p.line(125, 526, 651, 526, c.green, 5);
    p.text('f + k₁ × L', 165, 641, 82, c.ink, 'Serif');
    p.mono('L = 1 − b + b × length/average', 115, 825, 36, c.soft);
    p.text('Document', 929, 334, 36, c.soft);
    p.text('api', 1285, 334, 36, c.blue);
    p.text('key', 1488, 334, 36, c.green);
    ['d1', 'd4'].forEach((id, i) => {
      const y = 436 + 214 * i;
      p.mono(id, 925, y, 56);
      ['api', 'key'].forEach((t, j) =>
        p.mono(
          '×' + tokens[id].filter((s) => s === t).length,
          1284 + j * 208,
          y,
          46,
          j ? c.green : c.blue,
        ),
      );
      if (at(3, 'API contributes')) {
        const a = apiScore(id, 'api'),
          b = at(3, 'Together they add') ? apiScore(id, 'key') : 0;
        p.rect(929, y + 51, 340 * a, 31, c.blue);
        if (b) p.rect(929 + 340 * a, y + 51, 340 * b, 31, c.green);
        p.mono((a + b).toFixed(3), 1741, y + 80, 38, c.ink, 'right');
      }
    });
    if (at(2, 'IDF multiplier')) p.mono('× IDF', 706, 540, 41, c.gold);
    return;
  }
  if (beat === 6) {
    const count = Object.keys(pages).length, df = 3;
    const numerator = count - df + 0.5, denominator = df + 0.5;
    const ratio = numerator + ' / ' + denominator;
    const frequency = 'df = ' + df + ' of ' + count;
    p.title('Compare scores under the same convention', 'BM25   /   k₁ = 1.2   /   b = 0.75');
    p.text('Before the positive shift', 121, 371, 49, c.ink, 'Serif');
    p.mono(frequency + '      ln(' + ratio + ') ≈ ' + Math.log(numerator / denominator).toFixed(3), 123, 487, 47, c.blue);
    p.text('With the positive shift', 121, 649, 49, c.ink, 'Serif');
    p.mono(frequency + '      ln(1 + ' + ratio + ') ≈ ' + Math.log1p(numerator / denominator).toFixed(3), 123, 763, 47, c.green);
    if (at(6, 'Lucene ten'))
      p.text(
        'Lucene 10.5.1 also omits the common numerator factor and encodes length norms.',
        120,
        932,
        38,
        c.soft,
      );
    return;
  }
  const example = beat >= 7;
  const k = example ? repeatExample.k : at(5, 'all the way to zero') ? 0 : 1.2;
  p.title('The return on another mention', 'TERM WEIGHT   /   IDF = 1   /   L = 1');
  const x = (f) => 165 + f * 59,
    y = (w) => 784 - w * 160;
  p.line(x(0), y(0), x(21), y(0), c.soft, 4);
  p.line(x(0), y(0), x(0), y(3), c.soft, 4);
  for (let i = 0; i <= 20; i += 5) {
    p.line(x(i), y(0), x(i), y(0) + 15);
    p.mono(i, x(i), y(0) + 56, 32, c.soft, 'center');
  }
  for (let i = 1; i <= 3; i++) p.mono(i, x(0) - 27, y(i) + 12, 32, c.soft, 'right');
  p.mono('mentions', x(20), 885, 31, c.soft, 'right');
  const [first] = repeatExample.counts;
  const firstKnown = at(7, 'At eight mentions');
  const secondKnown = at(7, 'The count quadrupled');
  const lastPoint = !example || secondKnown ? 20 : firstKnown ? first : 0;
  for (let f = 1; f <= lastPoint; f++) {
    p.circle(x(f), y(weight(f, k)), 8, c.green);
    if (f > 1) p.line(x(f - 1), y(weight(f - 1, k)), x(f), y(weight(f, k)), c.green, 3);
  }
  const showLimit = example ? at(8, 'Divide the top') : at(4, 'approaches two point two');
  if (showLimit) p.line(x(0), y(k + 1), x(20), y(k + 1), c.gold, 2);
  p.mono('k₁ = ' + k, 1440, 363, 46, c.gold);
  if (showLimit) p.mono('limit   ' + (k + 1), 1432, 440, 39);
  const freq = example ? repeatExample.counts : [1, 3, 20];
  freq.forEach((f, i) =>
    p.mono(f + '  →  ' + (!example || (f === first ? firstKnown : secondKnown)
      ? weight(f, k).toFixed(3) : '?'), 1430, 554 + i * 80, 34, c.green),
  );
  if (example) {
    const formula = 'w = ' + (k + 1) + 'f / (f + ' + k + ')';
    p.mono(showLimit ? formula + ' = ' + (k + 1) + ' / (1 + ' + k + '/f)    f > 0' : formula, 122, 963, 38, c.blue);
  }
  if (beat === 5)
    p.mono('b = 0   L = 1           b = 1   L = length/average', 122, 963, 35, c.blue);
}
function directions(p) {
  const { at, c, beat } = p;
  p.title(
    beat >= 6
      ? 'Can a new query encoder use these vectors?'
      : beat < 3
        ? 'Index the passages once'
        : 'Which guide points toward the query?',
    'BI-ENCODER   /   ILLUSTRATIVE COORDINATES',
  );
  if (beat < 3 || beat >= 6) {
    const newer = at(6, 'query encoder changes');
    p.text('Stored passage vectors', 102, 320, 43, c.ink, 'Serif');
    CREDENTIAL_ROWS.forEach(({ id, v }, i) => {
      const y = 422 + i * 123;
      p.line(101, y + 35, 1052, y + 35);
      p.mono(id, 102, y, 39, c.gold);
      p.text(idNames[id], 236, y, 40);
      p.mono('[' + v.join(', ') + ']', 1052, y, 37, c.green, 'right');
    });
    p.text('Query encoder', 1202, 321, 44, c.ink, 'Serif');
    p.rect(1202, 382, 563, 306, c.tint);
    p.mono(newer ? 'revision 2' : 'revision 1', 1251, 465, 45, newer ? c.accent : c.blue);
    p.text(newer ? 'Verify compatibility' : 'How do I rotate', 1251, 567, 44);
    p.text(newer ? 'with stored vectors.' : 'an API key?', 1251, 626, 44);
    return;
  }
  const ox = 210,
    oy = 823,
    u = 475;
  for (let t = 0; t <= 1; t += 0.2) {
    p.line(ox + t * u, oy, ox + t * u, oy - u, c.rule, 1);
    p.line(ox, oy - t * u, ox + u + 88, oy - t * u, c.rule, 1);
  }
  p.line(ox, oy, ox + u + 100, oy);
  p.line(ox, oy, ox, oy - u - 65);
  [
    [1, 0.4, 'd1', c.blue],
    [1, 0.8, 'q', c.gold],
    [0.9, 0.9, 'd2', c.green],
  ].forEach(([a, b, id, col], i) => {
    p.arrow(ox, oy, ox + u * a, oy - u * b, col);
    p.mono(id, ox + u * a + [18, 23, -60][i], oy - u * b + [-2, 4, -22][i], 42, col);
  });
  p.mono('Third coordinate = 0', 122, 925, 31, c.soft);
  if (at(5, 'The credential guide')) {
    p.text('Cosine · all three coordinates', 994, 317, 47, c.ink, 'Serif');
    rankedVectors.forEach(({ id, score }, i) => {
      const y = 431 + i * 117;
      p.mono(id, 992, y, 38, c.soft);
      p.rect(1106, y - 29, score * 450, 27, id === 'd2' ? c.green : c.blue);
      p.mono(score.toFixed(3), 1765, y, 43, c.ink, 'right');
    });
  } else {
    p.text('Direction of the question', 996, 454, 53, c.gold, 'Serif');
    p.mono('[1, 0.8, 0]', 998, 540, 48);
    p.text('Compare the two turns at the origin.', 998, 723, 42, c.soft);
  }
}
function magnitude(p) {
  const { at, c, beat } = p;
  const stretch = at(4, 'Stretch B', 0.8),
    bvec = [6 + 2 * stretch, 0, 0],
    a = query;
  p.title('Length can change the winner', 'SAME QUERY   /   q = [1, 0.8, 0]');
  const x = 170,
    y = 706,
    u = 109;
  p.line(x, y, x + 8 * u + 55, y);
  p.line(x, y + 22, x, y - 250);
  for (let i = 0; i <= 8; i++) {
    p.line(x + i * u, y - 9, x + i * u, y + 14);
    p.mono(i, x + i * u, y + 64, 30, c.soft, 'center');
  }
  p.arrow(x, y, x + a[0] * u, y - a[1] * u, c.green, 7);
  p.mono('q = A', x + 40, y - a[1] * u - 36, 37, c.green);
  if (at(3, 'Candidate B')) {
    p.arrow(x, y, x + bvec[0] * u, y, c.gold, 7);
    p.mono('B', x + bvec[0] * u, y - 38, 41, c.gold, 'center');
  }
  p.text('Dot', 1267, 355, 38, c.soft);
  p.text('Cosine', 1570, 355, 38, c.soft);
  [
    [a, 'A'],
    [bvec, 'B'],
  ].forEach(([v, id], i) => {
    if (i && !at(3, 'Candidate B')) return;
    const yy = 475 + 160 * i;
    p.mono(id, 1146, yy, 50, i ? c.gold : c.green);
    p.mono(vectorDot(query, v).toFixed(2), 1265, yy, 48);
    p.mono(vectorCosine(query, v).toFixed(3), 1563, yy, 48);
  });
  p.mono(
    beat <= 2
      ? 'cos(q, A) = (q · A) / (length(q) × length(A))'
      : 'Metric and normalization belong to the encoder contract.',
    115,
    828,
    38,
    c.blue,
  );
}
const ranks = (id, constant) =>
  [sparse, dense].map((list) => {
    const rank = list.indexOf(id) + 1;
    return { rank, v: rank ? 1 / (constant + rank) : 0 };
  });
function lane(p, label, ids, x, y, w, col) {
  p.text(label, x, y, 40, col, 'Serif');
  ids.forEach((id, i) => {
    const yy = y + 41 + i * 96;
    p.rect(x, yy, w, 76, id === 'd2' ? p.c.green : p.c.tint);
    p.mono(i + 1 + '   ' + id, x + 25, yy + 51, 38, id === 'd2' ? p.c.bg : p.c.ink);
  });
}
function votes(p) {
  const { c, at } = p,
    zero = at(6, 'set the constant to zero'),
    k = zero ? 0 : 60;
  const rows = fused(k),
    cut = at(5, 'falls below'),
    wide = at(5, 'widen the shortlist') && !at(6, 'Go back to two slots'),
    depth = wide ? 3 : 2;
  p.title('Follow passage two through the count', 'RECIPROCAL RANK FUSION');
  lane(p, 'Word search', sparse, 101, 304, 340, c.blue);
  lane(p, 'Dense search', dense, 502, 304, 340, c.green);
  if (!at(3, 'The rotation guide')) {
    p.strip(975, 331, 807, 418);
    p.mono('d2', 1022, 420, 66, c.green);
    p.text('Credential guide', 1191, 416, 52, c.ink, 'Serif');
    p.line(1022, 463, 1714, 463);
    p.mono('Word     absent', 1022, 536, 37, c.blue);
    p.mono('Dense    rank 1', 1022, 610, 37, c.green);
    if (at(2, 'One over sixty-one')) p.mono('0 + 1/(60 + 1) = 1/61', 1022, 699, 44, c.gold);
    else if (at(1, 'constant to sixty')) p.mono('1 / (k + rank)     k = 60', 1022, 699, 40, c.gold);
  } else {
    p.mono('k = ' + k, 974, 303, 36, c.gold);
    rows.forEach(([id, val], i) => {
      const yy = 347 + i * 146;
      const [a, b] = ranks(id, k);
      p.line(974, yy, 1800, yy);
      p.mono(id, 974, yy + 76, 44, id === 'd2' ? c.green : c.ink);
      if (id === 'd4' && !at(3, 'The quota page')) return;
      p.mono((a.rank ? '1/' + (k + a.rank) : '0') + ' + 1/' + (k + b.rank), 1114, yy + 66, 38);
      p.mono(val.toFixed(5), 1783, yy + 67, 36, c.gold, 'right');
      const scale = k ? 11600 : 245;
      if (a.v) p.rect(1116, yy + 91, a.v * scale, 17, c.blue);
      p.rect(1116 + a.v * scale, yy + 91, b.v * scale, 17, c.green);
    });
    if (cut) {
      const yy = 347 + depth * 146;
      p.line(964, yy, 1807, yy, c.accent, 6);
      p.mono(
        'Admit ' +
          depth +
          '    ' +
          rows
            .slice(0, depth)
            .map(([id]) => id)
            .join('   '),
        971,
        905,
        38,
        c.accent,
      );
    }
  }
}
const scaleScore = (v, values) =>
  (v - Math.min(...values)) / (Math.max(...values) - Math.min(...values));
const wordScores = [1, 2, 4];
const extendedWordScores = [...wordScores, 100];
const blend = { id: 'P', raw: 4, dense: 0.8, wordWeight: 0.25 };
const wordFraction = (v, scores) => [v - Math.min(...scores), Math.max(...scores) - Math.min(...scores)].join('/');
const blendedScore = () =>
  blend.wordWeight * scaleScore(blend.raw, extendedWordScores) + (1 - blend.wordWeight) * blend.dense;
function scale(p) {
  const { at, c, beat } = p;
  if (beat <= 2) {
    p.title('What does one unit measure?', 'TWO SEARCH LANES');
    p.text('Cosine', 115, 390, 66, c.green, 'Serif');
    p.line(544, 370, 1709, 370, c.green, 6);
    [-1, 0, 1].forEach((v, i) => {
      p.circle(544 + i * 582, 370, 14, c.green);
      p.mono(v, 544 + i * 582, 460, 43, c.ink, 'center');
    });
    p.text('BM25', 115, 709, 66, c.blue, 'Serif');
    p.text('Sum of matching term weights', 544, 699, 51);
    p.mono('IDF × f(k₁ + 1)/(f + k₁L)', 544, 789, 45, c.blue);
    return;
  }
  if (beat >= 6) {
    const fraction = wordFraction(blend.raw, extendedWordScores);
    const denseWeight = 1 - blend.wordWeight;
    const denseKnown = at(6, 'Give the word score');
    const weightsKnown = at(6, 'What score will');
    const sumKnown = at(7, 'Most of the score');
    p.title('What score enters the combined ranking?', 'NORMALIZED SCORE BLENDING');
    p.text('Passage', 113, 381, 38, c.soft);
    p.text('Word lane', 445, 381, 48, c.blue, 'Serif');
    p.text('Dense lane', 1050, 381, 48, c.green, 'Serif');
    p.line(113, 417, 1788, 417);
    p.tag(blend.id, 113, 466, 157);
    p.mono(fraction, 445, 528, 64, c.blue);
    p.mono(denseKnown ? blend.dense.toFixed(2) : '?', 1050, 528, 64, c.green);
    if (weightsKnown) {
      p.mono('weight  ' + blend.wordWeight, 445, 624, 38, c.blue);
      p.mono('weight  ' + denseWeight, 1050, 624, 38, c.green);
      p.line(113, 705, 1788, 705);
      p.text('Fused score for ' + blend.id, 116, 755, 46, c.ink, 'Serif');
      p.mono(blend.wordWeight + ' × (' + fraction + ') + ' + denseWeight + ' × ' + blend.dense.toFixed(2)
        + (sumKnown ? ' ≈ ' + blendedScore().toFixed(3) : ' = ?'), 115, 828, 53, c.gold);
    }
    return;
  }
  const arrive = at(4, 'fourth candidate'),
    answer = at(5, 'The raw score stayed'),
    values = arrive ? extendedWordScores : wordScores,
    known = arrive ? at(5, 'The numerator is still') : at(3, 'Keep the passage');
  p.title('Follow passage P on the word-score scale', 'MIN–MAX NORMALIZATION');
  values.forEach((v, i) => {
    const tracked = v === blend.raw;
    p.strip(113 + i * 338, 290, 256, 144, tracked ? c.gold : c.tint);
    p.mono(tracked ? blend.id + ' · ' + v : v, 241 + i * 338, 386, 62, tracked ? c.bg : c.ink, 'center');
  });
  const lo = 153,
    hi = 1739,
    y = 659;
  p.line(lo, y, hi, y, c.soft, 5);
  [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
    const x = lerp(lo, hi, v);
    p.line(x, y - 12, x, y + 16);
    p.mono(v, x, y + 78, 36, c.soft, 'center');
  });
  if (known) {
    const s = scaleScore(blend.raw, values),
      x = lerp(lo, hi, s);
    p.circle(x, y, 22, c.gold);
    p.mono(blend.id, x, y - 48, 53, c.gold, 'center');
    if (!arrive || answer)
      p.mono('(' + blend.raw + ' − 1) / (' + Math.max(...values) + ' − 1) = ' +
        wordFraction(blend.raw, values) + (arrive ? ' ≈ ' : ' = ') + s.toFixed(3), 115, 912, 48);
  } else if (arrive) p.text('Where does four land?', 117, 905, 54, c.gold, 'Serif');
}
const jointWords = [
  '[CLS]',
  'rotate',
  'API',
  'key',
  '[SEP]',
  'create',
  'replacement',
  'key',
  'revoke',
  'old',
  'key',
  '[SEP]',
];
const jointInput = (trim) => (trim ? jointWords.slice(0, 8).concat('[SEP]') : jointWords);
function pairs(p) {
  const { at, c, beat } = p;
  if (beat >= 5) {
    const depth = at(7, 'Widen the fused shortlist') ? 3 : 2,
      scored = depth === 2 || at(7, 'It scores');
    const sorted = at(5, 'Give those pairs') ? (scored ? reranked(depth) : reranked(2)) : [];
    p.title('Score the pairs that arrive', 'CROSS-ENCODER   /   EXAMPLE SCORES');
    lane(
      p,
      'Fused input',
      fused()
        .slice(0, depth)
        .map(([id]) => id),
      105,
      329,
      478,
      c.gold,
    );
    p.arrow(636, 556, 845, 556, c.rule);
    p.text('Query + passage', 917, 328, 43, c.soft, 'Serif');
    sorted.forEach((id, i) => {
      const y = 415 + i * 141;
      p.tag(id, 915, y, 137, id === 'd2');
      p.text(idNames[id], 1097, y + 50, 41);
      p.mono(jointScores[id].toFixed(2), 1744, y + 50, 47, id === 'd2' ? c.green : c.ink, 'right');
    });
    return;
  }
  const trim = at(3, 'shorten the input budget'),
    words = jointInput(trim);
  p.title('Read the query and passage together', 'BERT PAIR   /   d1');
  let x = 104;
  const centers = {};
  words.forEach((s, i) => {
    const w = s.length * 16 + 46;
    p.rect(x, 294, w, 88, s.startsWith('[') ? c.tint : i < 4 ? c.blue : c.green);
    p.mono(s, x + w / 2, 351, 29, s.startsWith('[') ? c.ink : c.bg, 'center');
    centers[i] = x + w / 2;
    x += w + 5;
  });
  if (beat < 3) {
    if (at(2, 'can attend')) {
      const a = centers[1],
        b = centers[8];
      p.line(a, 390, a, 508, c.blue, 4);
      p.line(a, 508, b, 508, c.blue, 4);
      p.arrow(b, 508, b, 392, c.blue, 4);
      p.line(b, 397, b, 615, c.green, 4);
      p.line(b, 615, a + 20, 615, c.green, 4);
      p.arrow(a + 20, 615, a + 20, 398, c.green, 4);
    }
    if (at(2, 'scoring head')) p.text('[CLS] → pair score', 112, 815, 60, c.gold, 'Serif');
  } else {
    const n = words.length;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        p.rect(120 + 35 * j, 483 + 35 * i, 30, 30, i < 5 === j < 5 ? c.blue : c.green);
    p.mono(n + ' × ' + n + ' = ' + n * n, 780, 634, 79, c.gold);
    p.text('Attention entries in one head', 782, 737, 45);
    if (trim) p.text('Removed     revoke   old   key', 783, 860, 43, c.accent);
  }
}
const runs = [
  ['Rotate a key', ['d1', 'd2'], ['d1', 'd4', 'd2']],
  ['Replace a credential', ['d2'], ['d3', 'd4', 'd2']],
  ['Check the quota', ['d4'], ['d4', 'd1', 'd2']],
];
function metrics(row, k) {
  const [, gold, ids] = row,
    r = ids.slice(0, k),
    n = r.filter((id) => gold.includes(id)).length,
    rank = r.findIndex((id) => gold.includes(id)) + 1;
  return {
    hit: Number(n > 0),
    recall: n / gold.length,
    fraction: n + '/' + gold.length,
    rr: rank ? 1 / rank : 0,
    rank,
  };
}
const dcg = (grades) => grades.reduce((s, g, i) => s + (2 ** g - 1) / Math.log2(i + 2), 0);
function evaluation(p) {
  const { at, c, beat } = p;
  if (beat >= 7) {
    const grades = [3, 1, 2],
      ideal = [...grades].sort((a, b) => b - a);
    p.title('Give earlier evidence more weight', 'GRADED JUDGMENTS   /   TOP THREE');
    ['Rank', 'Grade', 'Gain', 'Discounted gain'].forEach((s, i) =>
      p.text(s, [121, 428, 791, 1175][i], 337, 37, c.soft),
    );
    grades.forEach((g, i) => {
      const y = 454 + i * 124,
        gain = 2 ** g - 1;
      p.line(120, y + 31, 1749, y + 31);
      [
        i + 1,
        g,
        at(7, 'Convert each grade') ? gain : '',
        at(7, 'Discount each gain') ? (gain / Math.log2(i + 2)).toFixed(3) : '',
      ].forEach((s, j) => p.mono(s, [121, 428, 791, 1175][j], y, 49, j > 1 ? c.green : c.ink));
    });
    if (at(8, 'ideal order'))
      p.mono(
        'Ideal  3, 2, 1       nDCG@3  = ' +
          dcg(grades).toFixed(3) +
          ' / ' +
          dcg(ideal).toFixed(3) +
          ' ≈ ' +
          (dcg(grades) / dcg(ideal)).toFixed(3),
        117,
        904,
        40,
        c.gold,
      );
    return;
  }
  const rr = beat >= 5,
    k = at(5, 'Extend the cutoff') && !at(6, 'Pull the cutoff back') ? 3 : 2;
  p.title(
    rr ? 'How far to the first useful page?' : 'How much evidence is inside the cut?',
    'THREE JUDGED QUERIES',
  );
  [
    'Question',
    'Useful IDs',
    'Returned order',
    rr ? 'First rank' : 'Hit',
    rr ? 'Reciprocal' : 'Recall',
  ].forEach((s, i) => p.text(s, [99, 547, 828, 1394, 1629][i], 324, 35, c.soft));
  runs.forEach((row, i) => {
    const [q, gold, ids] = row,
      y = 400 + i * 146,
      m = metrics(row, k);
    p.line(99, y + 106, 1783, y + 106);
    p.text(q, 99, y + 53, 39, c.ink, 'Serif');
    p.mono(gold.join(', '), 546, y + 53, 38);
    ids.forEach((id, j) => p.tag(id, 828 + 150 * j, y, 118, gold.includes(id) && j < k));
    if (at(3, ['We recovered half', 'That row gets zero', 'quota question gets'][i])) {
      p.mono(rr ? m.rank || 'none' : m.hit, 1410, y + 53, 45);
      p.mono(rr ? (m.rank ? '1/' + m.rank : '0') : m.fraction, 1644, y + 53, 44, c.green);
    }
  });
  const cut = 810 + 150 * k;
  p.line(cut, 364, cut, 812, c.gold, 5);
  p.mono('K = ' + k, cut, 867, 35, c.gold, 'center');
  if (rr && at(6, 'mean reciprocal rank'))
    p.mono(
      'MRR@' + k + '    ' + (k === 2 ? '(1 + 0 + 1)/3 = 2/3' : '(1 + 1/3 + 1)/3 = 7/9'),
      104,
      956,
      40,
    );
  else if (!rr && at(4, 'average the three'))
    p.mono('Hit rate = 2/3       Macro recall = (1/2 + 0 + 1)/3 = 1/2', 104, 956, 40);
}
export const manualScenes = [
  analyzer,
  controls,
  directions,
  magnitude,
  votes,
  scale,
  pairs,
  evaluation,
];
export function checkManual() {
  assert.deepEqual(containing('api'), sparse);
  assert.deepEqual(containing('rotate'), []);
  assert.deepEqual(tokenize('AUTH_401'), tokenize('AUTH_403'));
  assert.equal(lengthAvg, 8);
  assert.equal((apiScore('d1', 'key') + apiScore('d1', 'api')).toFixed(3), '1.609');
  assert.deepEqual(repeatExample.counts.map((f) => weight(f, repeatExample.k)), [1.5, 2.4]);
  assert.equal(repeatExample.k + 1, 3);
  assert.equal(weight(20, 0), 1);
  assert.deepEqual(
    rankedVectors.map((d) => d.id),
    ['d2', 'd1', 'd4', 'd3'],
  );
  assert.equal(vectorCosine(query, [0, 0, 0]), null);
  for (const k of [60, 0])
    for (const [id, val] of fused(k))
      assert.equal(
        val,
        ranks(id, k).reduce((sum, row) => sum + row.v, 0),
      );
  assert.deepEqual(
    ranks('d2', 60).map((r) => r.v),
    [0, 1 / 61],
  );
  assert.deepEqual(
    fused(0).map(([id]) => id),
    ['d1', 'd2', 'd4'],
  );
  assert.equal(scaleScore(blend.raw, wordScores), 1);
  assert.equal(scaleScore(blend.raw, extendedWordScores), 3 / 99);
  assert.equal(wordFraction(blend.raw, extendedWordScores), '3/99');
  assert.equal(blendedScore().toFixed(3), '0.608');
  assert.equal(jointInput(true).length ** 2, 81);
  assert.equal(jointInput(false).length ** 2, 144);
  assert.deepEqual(reranked(3), ['d2', 'd1', 'd4']);
  assert.deepEqual(
    runs.map((r) => metrics(r, 2).recall),
    [0.5, 0, 1],
  );
  assert.deepEqual(
    runs.map((r) => metrics(r, 3).rr),
    [1, 1 / 3, 1],
  );
}
