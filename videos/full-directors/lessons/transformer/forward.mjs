import {
  ink,
  dim,
  red,
  teal,
  blue,
  gold,
  paper,
  colors,
  fmt,
  vector,
  pct,
  mix,
  blend,
  type,
  line,
  dot,
  box,
  arrow,
  bench,
  foot,
  typeLine,
  tokenValues,
  row,
  cue,
  afterCue,
  label,
  signedBars,
  plot,
} from './press.mjs';
import {
  MODEL as m,
  INPUT,
  FEEDBACK as next,
  FEEDBACK_INPUT,
  EMBED,
  VOCAB,
  WORDS,
  WQ,
  WOUT,
  position,
  normStats,
  sum,
  trainingRead,
  perturb,
} from './specimens.mjs';

const features = ['feature 1', 'feature 2', 'feature 3', 'feature 4'];
const last = 2;
function pins(c, cx, y, values, width = 124) {
  line(c, cx - width / 2, y, cx + width / 2, y, dim, 2);
  values.forEach((v, i) => {
    const x = cx - width / 2 + (width * (i + 0.5)) / values.length;
    line(c, x, y, x, y - 35 * v, colors[i], 7);
    dot(c, x, y - 35 * v, 4, colors[i]);
  });
}
function opening(c, k) {
  const b = k.beat.beatIndex;
  bench(c, 'Which row will fill the empty space?', 'COMPOSING STICK  /  THREE TOKENS');
  const lift = cue(k, 1, 'Lift');
  const centers = typeLine(c, WORDS, {
    y: 234,
    h: 83,
    slot: true,
    selected: lift > 0 ? 2 : -1,
    lift: 14 * lift,
  });
  WORDS.forEach((w, i) => {
    type(c, 'position ' + i, centers(i), 186, 18, dim, 'Mono', 'center');
    pins(c, centers(i), 394, INPUT[i]);
  });
  type(c, 'next token', centers(3), 186, 18, dim, 'Mono', 'center');
  if (lift > 0) {
    const end = mix(centers(2), centers(0), lift);
    line(c, end, 342, centers(2), 342, teal, 4);
    for (let i = 0; i < 3; i++)
      if (centers(i) >= end) line(c, centers(i), 333, centers(i), 344, teal, 3);
    arrow(c, centers(2) + 56, 210, centers(3) - 54, 210, teal, 3);
  }
  if (b === 2)
    type(c, '1 block   ·   1 head   ·   fixed weights', 475, 424, 19, teal, 'Mono', 'center');
  foot(
    c,
    b === 0
      ? 'One piece per token. Four features travel with each piece.'
      : 'Position 2 reads the prefix and predicts position 3.',
  );
}
function embedding(c, k) {
  const b = k.beat.beatIndex,
    lookup = cue(k, 0, 'Pull drawer two'),
    p = cue(k, 1, 'Add that position');
  bench(c, 'Set the four pins for “the”', 'TYPE CASE  /  TOKEN ID 2');
  box(c, 45, 153, 254, 277, '#74664f', 4);
  VOCAB.forEach((w, i) => {
    const x = 53 + (i === 2 ? 12 * lookup : 0),
      y = 161 + i * 43;
    box(c, x, y, 235, 38, i === 2 ? '#466d66' : '#dad0b7', 2);
    type(c, fmt(i), x + 18, y + 19, 17, i === 2 ? paper : dim, 'Mono');
    type(c, w, x + 65, y + 18, 24, i === 2 ? paper : ink, 'Serif');
    dot(c, x + 214, y + 18, 5, i === 2 ? '#d8b76a' : '#74654b');
  });
  const opts = { x: 336, w: 573, label: 145, h: 48 };
  row(c, 'embedding', lookup ? EMBED[2] : ['?', '?', '?', '?'], 176, blue, opts);
  if (b > 0) {
    row(c, '+ position 2', position(2), 256, gold, opts);
    row(
      c,
      p >= 1 ? 'input row' : 'sum pending',
      p >= 1 ? INPUT[2] : Array(4).fill('?'),
      350,
      teal,
      opts,
    );
    line(c, 481, 328, 904, 328, ink, 2);
  } else if (lookup) arrow(c, 309, 264, 335, 215, blue);
  foot(
    c,
    b === 2
      ? 'The residual branch keeps this positioned row while attention receives a normalized copy.'
      : 'One token ID selects one embedding. Its position determines the offset.',
  );
}
function normalize(c, k) {
  const s = normStats(INPUT[2]),
    center = cue(k, 0, 'Subtract that mean'),
    scale = cue(k, 1, 'Divide each');
  const vals = blend(blend(INPUT[2], s.centered, center), s.normalized, scale);
  bench(c, 'Move four pins on one ruler', 'NORMALIZATION  /  POSITION 2');
  const ruler = (x) => 475 + 174 * x;
  for (let i = 0; i < 4; i++) {
    const y = 192 + i * 57;
    line(c, 195, y, 763, y, '#b0ab99', 2);
    type(c, features[i], 53, y, 18, dim);
    dot(c, ruler(INPUT[2][i]), y, 5, '#aca99b');
    dot(c, ruler(vals[i]), y, 9, colors[i]);
    type(c, fmt(vals[i], 3), 813, y, 20, ink, 'Mono');
  }
  const mean = sum(vals) / 4;
  line(c, ruler(mean), 171, ruler(mean), 382, gold, 2);
  type(c, 'mean ' + fmt(mean, 3), ruler(mean), 151, 16, gold, 'Mono', 'center');
  for (const v of [-1, 0, 1]) type(c, fmt(v), ruler(v), 405, 16, dim, 'Mono', 'center');
  foot(c, 'Original row   ' + vector(INPUT[2]) + '     ·     ε = 0.00001');
}
function mask(c, k) {
  const b = k.beat.beatIndex;
  bench(
    c,
    b === 0 ? 'Cut a query from four features' : 'Which keys may leave an impression?',
    'ATTENTION HEAD  /  QUERY AT POSITION 2',
  );
  if (b === 0) {
    row(c, 'normalized row', m.N[2], 162, blue);
    row(
      c,
      'query column 1',
      WQ.map((r) => r[0]),
      229,
      gold,
    );
    const q = cue(k, 0, 'multiply each feature');
    row(c, 'products', q ? m.N[2].map((v, i) => v * WQ[i][0]) : Array(4).fill('?'), 296, teal);
    type(c, 'query   ' + (q ? vector(m.Q[2], 3) : '?'), 490, 402, 30, ink, 'Mono', 'center');
    foot(c, 'A separate projection cuts the keys. Each value keeps four normalized features.');
  } else {
    const training = cue(k, 2, 'Switch to training', 0) === 1,
      names = training ? VOCAB.slice(0, 4) : WORDS;
    const center = typeLine(c, names, {
      y: 157,
      h: 48,
      x: 214,
      w: 686,
      selected: 2,
      slot: !training,
    });
    const scaled = cue(k, 1, 'Divide each score', 0);
    const closed = afterCue(k, 3, 'negative infinity', { captionStart: 'negative infinity' });
    const zeroShown = afterCue(k, 3, 'Its exponential becomes zero', { captionStart: 'zero' });
    const massesShown = afterCue(k, 3, 'subtract the largest legal score and exponentiate');
    const denominatorShown = cue(k, 3, 'Divide by the shared total', 0);
    const weightsShown = afterCue(k, 3, 'The three shares become weights that sum to one');
    const scores = training
      ? trainingRead.scores.map((score, i) => (closed ? trainingRead.maskedScores[i] : score))
      : scaled
        ? m.scores[2]
        : m.raw[2];
    const future = center(3);
    const bandWidth = center(1) - center(0);
    if (closed) box(c, future - bandWidth / 2, 232, bandWidth, 176, '#ead0bf', 4);
    label(c, closed ? 'masked score' : scaled ? 'scaled score' : 'dot product', 47, 259, blue);
    tokenValues(c, center, scores.map((score) => (score === -Infinity ? '−∞' : score)), 237, blue);

    if (closed) {
      const masses = trainingRead.masses.map((mass, i) => {
        const visible = i === names.length - 1 ? zeroShown : massesShown;
        return visible ? mass : '';
      });
      const weights = trainingRead.weights.map((weight) => (weightsShown ? pct(weight) : ''));
      label(c, 'exp(score − max)', 47, 319, gold);
      tokenValues(c, center, masses, 297, gold);
      label(c, 'attention weight', 47, 379, teal);
      tokenValues(c, center, weights, 357, teal);
      if (denominatorShown) {
        type(c, 'Total mass ≈ ' + fmt(trainingRead.totalMass, 3), 214, 425, 21, gold, 'Mono');
      }
      if (weightsShown) {
        type(c, 'Weights sum to ' + fmt(sum(trainingRead.weights)), 899, 425, 21, teal, 'Mono', 'right');
      }
    } else {
      type(
        c,
        training ? 'How much of the target may the query read?' : 'One comparison per visible key',
        485,
        375,
        29,
        training ? red : dim,
        'Serif',
        'center',
      );
    }
    foot(
      c,
      training
        ? 'Training text includes the target. Position 2 predicts it.'
        : 'At generation time the fourth token has yet to enter the stick.',
    );
  }
}
function blendDrawing(c, k) {
  const b = k.beat.beatIndex,
    p = cue(k, b, ['Pull the first arrow', 'Multiply its value', 'Place it'][b], 1.1);
  bench(c, 'Where does the weighted read land?', 'DRAFTING BED  /  FEATURES 1 AND 4');
  const at = plot(c, { x: 278, y: 306, scale: 79, minX: -2, maxX: 2.1, minY: -1.65, maxY: 1.9 });
  const points = m.V.map((r) => at(r[0], r[3]));
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = '#d2dace';
  c.fill();
  c.strokeStyle = '#879b8b';
  c.lineWidth = 1.5;
  c.stroke();
  points.forEach(([x, y], i) => {
    dot(c, x, y, 6, colors[i]);
    type(
      c,
      WORDS[i],
      x + (i === 0 ? 4 : -10),
      y + (i === 1 ? 17 : -14),
      19,
      colors[i],
      'Serif',
      i === 0 ? 'left' : 'right',
    );
  });
  let accum = [0, 0, 0, 0];
  for (let i = 0; i <= b; i++) {
    const before = accum;
    accum = before.map((v, j) => v + m.weights[2][i] * m.V[i][j] * (i === b ? p : 1));
    arrow(c, ...at(before[0], before[3]), ...at(accum[0], accum[3]), colors[i], 4);
  }
  dot(c, ...at(accum[0], accum[3]), 5, ink);
  label(c, 'feature 1 →', 360, 331);
  label(c, '↑ feature 4', 270, 147);
  label(c, 'Share of the read', 555, 176);
  WORDS.forEach((name, i) => {
    const y = 216 + i * 42;
    type(c, name, 555, y, 22, colors[i], 'Serif');
    box(c, 658, y - 7, 280 * m.weights[2][i], 14, colors[i]);
    type(c, pct(m.weights[2][i]), 838, y, 18, ink, 'Mono');
  });
  label(c, 'Four accumulated features', 555, 361);
  type(c, vector(accum, 3), 555, 399, 20, ink, 'Mono', 'left', 365);
  foot(
    c,
    'The arrows add tip to tail. Positive shares that sum to one keep the final tip inside the triangle.',
  );
}
function residual(c, k) {
  const b = k.beat.beatIndex,
    p = cue(k, 0, 'Shrink the complete read', 1.1),
    move = cue(k, 1, 'Lay the projected arrow', 1.1);
  bench(c, 'Add the read to the waiting type', 'RESIDUAL ADDITION  /  FEATURES 1 AND 4');
  const center = b ? [335, 240] : [278, 245],
    sc = b ? 1100 : 322;
  const v = m.A[2];
  line(c, 70, center[1], 499, center[1], '#b6ad98', 1);
  line(c, center[0], 161, center[0], 416, '#b6ad98', 1);
  const f = b ? 0.35 * move : mix(1, 0.35, p);
  const end = [center[0] + sc * v[0] * f, center[1] - sc * v[3] * f];
  arrow(c, ...center, ...end, b ? teal : blue, 5);
  dot(c, ...center, 5, ink);
  dot(c, ...end, 5, b ? teal : blue);
  type(c, b ? 'starting state' : 'origin', center[0] + 14, center[1] - 18, 19, dim);
  label(
    c,
    b ? 'Displacement from the original row' : 'Scale factor   ' + fmt(mix(1, 0.35, p), 2),
    59,
    395,
  );
  const vals = b ? m.Y[2] : v.map((x) => x * mix(1, 0.35, p));
  label(c, 'Original row', 525, 161);
  type(c, vector(INPUT[2]), 525, 195, 22, ink, 'Mono');
  if (b) {
    label(c, '+ projected read', 525, 243, blue);
    type(c, vector(m.update[2], 3), 525, 277, 20, blue, 'Mono', 'left', 380);
    line(c, 525, 307, 909, 307, dim, 1.5);
  }
  label(
    c,
    b
      ? move >= 1
        ? 'State after addition'
        : 'Sum pending'
      : p >= 1
        ? 'Projected read'
        : 'Read under projection',
    525,
    b ? 337 : 296,
  );
  type(
    c,
    vector(b && move < 1 ? Array(4).fill('?') : vals, 3),
    525,
    b ? 376 : 337,
    21,
    teal,
    'Mono',
    'left',
    380,
  );
  foot(
    c,
    b
      ? 'Width stays four. The feed-forward branch gets a normalized copy of this sum.'
      : 'This hand-set output projection scales the read. A learned matrix can also mix its coordinates.',
  );
}
function feedForward(c, k) {
  const b = k.beat.beatIndex;
  const p = b < 2 ? cue(k, 1, 'Watch those bars move', 1.2) : 0;
  bench(
    c,
    b === 2 ? 'Bring the update back to four pins'
      : p === 1 ? 'Two hidden features survive'
        : 'Which hidden features will survive?',
    'FEED-FORWARD BRANCH  /  SAME WEIGHTS AT EACH POSITION',
  );
  if (b < 2) {
    const vals = blend(m.pre[2], m.H[2], p);
    label(c, 'Six hidden features', 46, 155);
    signedBars(c, vals, ['1', '2', '3', '4', '1 − 2', '3 − 4'], { unit: 66 });
    foot(
      c,
      b
        ? 'ReLU clips the negative values at zero.'
        : 'The last two hidden features subtract pairs of normalized inputs.',
    );
  } else {
    const p = cue(k, 2, 'Bring that update', 1);
    row(c, 'contextual row', m.Y[2], 172, blue, { d: 3 });
    row(c, '+ FFN update', m.F[2], 244, gold, { d: 3 });
    row(
      c,
      p >= 1 ? 'block output' : 'sum pending',
      p >= 1 ? m.Z[2] : Array(4).fill('?'),
      346,
      teal,
      { d: 3 },
    );
    line(c, 269, 321, 907, 321, ink);
    foot(
      c,
      'Feature 4 update = 0.20 × ' +
        fmt(m.H[2][3], 3) +
        ' + 0.05 × ' +
        fmt(m.H[2][5], 3) +
        ' = ' +
        fmt(m.F[2][3], 3),
    );
  }
}
function causality(c, k) {
  const firstTrial = cue(k, 1, 'Now change the first input', 0) === 1;
  const reset = cue(k, 2, 'Return to our original prefix', 0);
  const index = firstTrial && !reset ? 0 : 2;
  const change = reset
    ? 0
    : 4 * (firstTrial ? cue(k, 2, 'That earlier change', 0) : cue(k, 0, 'Add four', 0));
  const pending = !reset && change === 0;
  const delta = perturb(index, change);
  bench(
    c,
    reset
      ? 'Back to the original prefix'
      : firstTrial
        ? 'Which outputs can a first-token edit reach?'
        : 'Can a later edit travel backward?',
    'CONTROLLED REPRINT  /  SAME WEIGHTS',
  );
  const cx = typeLine(c, WORDS, { y: 182, h: 62, selected: index });
  type(
    c,
    reset
      ? 'feature 1   ' + fmt(INPUT[index][0])
      : (pending ? 'planned edit   ' : 'feature 1   ') +
          fmt(INPUT[index][0]) +
          ' → ' +
          fmt(INPUT[index][0] + 4),
    cx(index),
    155,
    17,
    red,
    'Mono',
    'center',
  );
  WORDS.forEach((_, i) => {
    const x = cx(i);
    dot(c, x, 320, 9, blue);
    if (!pending) {
      line(c, x, 320, x, 320 + delta[i] * 14, red, 4);
      dot(c, x, 320 + delta[i] * 14, 5, red);
    }
    type(c, pending ? '?' : fmt(delta[i], 3), x, 421, 22, delta[i] ? red : teal, 'Mono', 'center');
  });
  label(c, 'Output displacement', 48, 285);
  foot(
    c,
    reset
      ? 'The original last row now goes to the vocabulary head.'
      : pending
        ? 'Predict the displacement of each output after this edit.'
        : firstTrial && change === 4
          ? 'Editing position 0 can change every row that reads it.'
          : 'Compare each four-feature output with its original. Zero means the row stayed fixed.',
  );
}
function vocabulary(c, k) {
  const b = k.beat.beatIndex;
  bench(c, 'Which impression wins the empty space?', 'VOCABULARY HEAD  /  SIX WORDS');
  if (b === 0) {
    row(c, 'final normalized row', m.final[2], 158, teal);
    row(c, 'weights for “result”', WOUT[3], 224, gold);
    row(
      c,
      'products',
      m.final[2].map((v, j) => v * WOUT[3][j]),
      290,
      blue,
    );
    type(c, 'sum   ' + fmt(m.logits[3], 3), 480, 399, 33, ink, 'Serif', 'center');
    foot(c, 'The same final state meets six different output vectors.');
  } else {
    const p = cue(k, 1, 'Divide each weight', 1),
      win = cue(k, 3, 'result');
    label(
      c,
      p >= 1 ? 'Vocabulary probabilities' : 'Exponentials after subtracting the largest logit',
      45,
      158,
    );
    const normal = p >= 1;
    const vals = normal ? m.probs : m.exps;
    const step = 143;
    vals.forEach((v, i) => {
      const x = 59 + i * step,
        h = v * (normal ? 310 : 146);
      box(c, x + 33, 346 - h, 66, h, i === m.choice && win ? teal : '#5e787d', 2);
      type(c, normal ? pct(v) : fmt(v, 3), x + 66, 328 - h, 19, ink, 'Mono', 'center');
      type(c, VOCAB[i], x + 66, 381, 22, ink, 'Serif', 'center');
    });
    line(c, 61, 346, 907, 346, ink);
    if (win) type(c, 'Greedy choice   ' + VOCAB[m.choice], 480, 425, 23, teal, 'Mono', 'center');
    foot(
      c,
      'One denominator across six words   ·   sum of exponential masses = ' + fmt(m.denominator, 3),
    );
  }
}
function feedback(c, k) {
  const b = k.beat.beatIndex;
  bench(c, 'Set the chosen piece and read again', 'DECODING LOOP  /  POSITION 3');
  const written = cue(k, 3, 'now selects value') > 0;
  const centers = typeLine(
    c,
    written ? [...VOCAB.slice(0, 4), VOCAB[next.choice]] : VOCAB.slice(0, 4),
    {
      y: 153,
      h: 51,
      selected: written ? 4 : 3,
      slot: !written,
    },
  );
  if (b < 2) {
    if (b === 0) {
      row(c, 'ID 3 embedding', EMBED[3], 253, blue);
      row(c, 'positioned input', FEEDBACK_INPUT[3], 330, teal);
    } else {
      label(c, 'Share of each key', 56, 249, blue);
      tokenValues(c, centers, next.weights[3].map(pct), 268, blue);
      label(c, 'Mixed value row', 56, 376, teal);
      next.A[3].forEach((v, i) => {
        const x = 268 + i * 164;
        type(c, 'feature ' + (i + 1), x, 349, 17, dim, 'Sans', 'center');
        type(c, fmt(v, 3), x, 392, 25, teal, 'Mono', 'center');
      });
    }
    foot(
      c,
      b
        ? 'The first three block outputs match the shorter prefix exactly.'
        : 'The new piece starts from the embedding of ID 3 and position 3.',
    );
  } else {
    const reveal = cue(k, 3, 'Plot the new final row', 1);
    const at = plot(c, { x: 69, y: 415, scale: 118, minX: 0, maxX: 1.65, minY: 0, maxY: 1.55 });
    line(c, ...at(0, 0), ...at(1.48, 1.48), dim, 2);
    type(c, 'result', 104, 273, 19, blue, 'Serif');
    type(c, 'value', 231, 368, 19, teal, 'Serif');
    type(c, 'feature 3 →', 210, 433, 15, dim);
    type(c, '↑ feature 4', 52, 236, 15, dim);
    dot(c, ...at(m.final[2][2], m.final[2][3]), 6, blue);
    if (reveal) {
      arrow(
        c,
        ...at(m.final[2][2], m.final[2][3]),
        ...at(next.final[3][2], next.final[3][3]),
        teal,
      );
      dot(c, ...at(next.final[3][2], next.final[3][3]), 7, teal);
    }
    type(c, 'result score = 0.5 × f₃ + f₄', 390, 266, 24, blue, 'Mono');
    type(c, 'value score  = 1.5 × f₃', 390, 316, 24, teal, 'Mono');
    type(
      c,
      'New f₃ = ' + fmt(next.final[3][2], 3) + '     f₄ = ' + fmt(next.final[3][3], 3),
      390,
      364,
      20,
      ink,
      'Mono',
    );
    type(
      c,
      written ? 'Next impression    ' + VOCAB[next.choice] : 'Which side of the diagonal?',
      390,
      417,
      27,
      ink,
      'Serif',
    );
    foot(
      c,
      'The diagonal is the tie between result and value. Greedy choice compares all six logits.',
    );
  }
}
export const forward = [
  opening,
  embedding,
  normalize,
  mask,
  blendDrawing,
  residual,
  feedForward,
  causality,
  vocabulary,
  feedback,
];
