import {
  ink,
  dim,
  red,
  teal,
  blue,
  gold,
  paper,
  pale,
  colors,
  fmt,
  vector,
  pct,
  mix,
  type,
  line,
  dot,
  box,
  arrow,
  bench,
  foot,
  slug,
  typeLine,
  tokenValues,
  row,
  strip,
  grid,
  cue,
  afterCue,
  label,
} from './press.mjs';
import {
  INPUT,
  WORDS,
  VOCAB,
  heads,
  headReads,
  headWeights,
  unmaskedRead,
  rotary,
  matchingRows,
  matching,
  matchingShares,
  softmax,
  scaleScores,
  gate,
  plainBudget,
  gatedWidth,
  affine,
  bent,
  constant,
  norm,
  rms,
  perturb,
} from './specimens.mjs';

function positions(c, k) {
  const b = k.beat.beatIndex;
  bench(
    c,
    b < 2
      ? 'Move the token without changing its vector'
      : b === 2
        ? 'What happens past the last position row?'
        : 'Turn both vectors on the same dial',
    'POSITION  /  ORDER AND DISTANCE',
  );
  if (b < 2) {
    const p = cue(k, 0, 'Slide');
    const causal = cue(k, 1, 'A causal mask', 0);
    const rows = unmaskedRead(INPUT);
    label(c, 'Input', 72, 156);
    label(c, 'Permitted sources', 310, 156);
    label(c, 'Output for “the”', 594, 156);
    [0, 1, 2].forEach((i) => {
      const dest = [1, 2, 0][i],
        y = mix(199 + 80 * i, 199 + 80 * dest, p);
      slug(c, 66, y - 17, 166, 49, WORDS[i], i === 2);
      if (i === 2) {
        const count = causal ? 1 : 3;
        for (let j = 0; j < count; j++) dot(c, 338 + j * 65, y + 6, 13, colors[causal ? 2 : j]);
        type(c, vector(causal ? INPUT[2] : rows[2], 2), 585, y + 6, 21, teal, 'Mono');
      }
    });
    foot(
      c,
      causal
        ? 'In the first position a causal query has one legal key. Its read is that key’s value.'
        : 'Unmasked attention permutes its outputs with the input rows when no new position signal is added.',
    );
  } else if (b === 2) {
    for (let i = 0; i < 4; i++) {
      const y = 156 + i * 64;
      row(
        c,
        'position ' + i,
        i === 3 ? ['?', '?', '?', '?'] : [0.05 * i, 0, 0, 0.05 * i],
        y,
        i === 3 ? red : blue,
        { h: 43 },
      );
    }
    foot(
      c,
      'An additive learned table needs an entry for the new position. Longer inputs need evaluation.',
    );
  } else {
    const turn = cue(k, 3, 'rotate by point one', 1.2);
    const shift = 2 * cue(k, 4, 'Move both positions', 1.4),
      q = 4 * turn + shift,
      key = turn + shift;
    const cx = 288,
      cy = 305,
      r = 111;
    c.beginPath();
    c.arc(cx, cy, r, 0, 2 * Math.PI);
    c.strokeStyle = '#b8ae95';
    c.lineWidth = 2;
    c.stroke();
    line(c, cx - r - 12, cy, cx + r + 16, cy, pale);
    line(c, cx, cy - r - 10, cx, cy + r + 10, pale);
    const ray = (pos, color) =>
      arrow(c, cx, cy, cx + r * Math.cos(0.1 * pos), cy - r * Math.sin(0.1 * pos), color, 4);
    ray(q, blue);
    ray(key, teal);
    c.beginPath();
    c.arc(cx, cy, 68, -q * 0.1, -key * 0.1);
    c.strokeStyle = gold;
    c.lineWidth = 5;
    c.stroke();
    type(c, 'query at ' + fmt(q, 1), 499, 198, 26, blue, 'Serif');
    type(c, 'key at ' + fmt(key, 1), 499, 248, 26, teal, 'Serif');
    type(c, 'difference   ' + fmt(0.1 * (q - key), 2) + ' rad', 500, 320, 23, ink, 'Mono');
    type(c, 'dot product  ' + fmt(rotary(q, key), 3), 500, 366, 23, ink, 'Mono');
    foot(
      c,
      'RoPE rotates coordinate pairs. A common shift preserves their relative angle in this example.',
    );
  }
}
function scale(c, k) {
  const b = k.beat.beatIndex;
  bench(
    c,
    b < 3
      ? 'Can equal scores have unequal shares?'
      : b < 5
        ? 'What grows with head width?'
        : b < 7
          ? 'Divide the scores before taking shares'
          : 'Double the length of the stick',
    'ATTENTION  /  SCORE SCALE',
  );
  if (b < 3) {
    const cw = 104,
      ch = 62;
    const diagonalA = cue(k, 1, 'A dotted with itself', 0);
    const shareA = cue(k, 1, 'Row A splits', 0);
    const diagonalB = cue(k, 1, 'B dotted with itself', 0);
    const shareB = cue(k, 1, 'The smaller score', 0);
    const left = 110, right = 628;
    label(c, 'Raw dot products', left, 184);
    label(c, 'Shares within each row', right, 184);
    for (let i = 0; i < 2; i++) {
      for (const x of [left, right])
        type(c, i ? 'B' : 'A', x - 40, 269 + i * ch, 24, ink, 'Serif');
    }
    for (const x of [left, right])
      ['key A', 'key B'].forEach((w, i) =>
        type(c, w, x + cw * (i + 0.5), 223, 17, dim, 'Sans', 'center'),
      );
    grid(
      c,
      left,
      240,
      matching.map((r, i) => r.map((v, j) => (i === j && !(i ? diagonalB : diagonalA) ? '?' : v))),
      {
        cw,
        ch,
        paint: (v, i, j) => (i !== j ? '#c9d9cf' : paper),
      },
    );
    grid(
      c,
      right,
      240,
      matchingShares.map((row, i) => row.map((v) => ((i ? shareB : shareA) ? pct(v) : '?'))),
      { cw, ch, paint: (v, i, j) => (i !== j ? '#c9d9cf' : paper) },
    );
    type(c, 'softmax of raw scores', 454, 275, 19, teal, 'Sans', 'center');
    arrow(c, 342, 298, 566, 298);
    const [a, bRow] = matchingRows;
    type(c, 'A = [' + a.join(', ') + ']     B = [' + bRow.join(', ') + ']', left, 409, 20, ink, 'Mono');
    type(c, 'Both queries can read both keys.', 547, 409, 20, ink);
    foot(
      c,
      b === 2
        ? 'Learned query and key maps change the matching rule. Values determine what the match delivers.'
        : 'A score competes with the other keys seen by the same query.',
    );
  } else if (b < 5) {
    const count = b === 3 ? Math.min(8, 1 + Math.floor(7 * cue(k, 3, 'Add one product', 1.5))) : 8;
    label(c, 'Independent products, each with variance 1', 54, 166);
    const dx = 100;
    for (let i = 0; i < count; i++) {
      box(c, 58 + i * dx, 207, dx - 7, 80, colors[i % 4], 3);
      type(c, '1', 105 + i * dx, 246, 29, paper, 'Mono', 'center');
    }
    type(c, 'Variance of sum   ' + count, 57, 347, 26, ink, 'Mono');
    if (b === 4) type(c, 'Standard deviation   √' + count, 58, 403, 24, teal, 'Mono');
    foot(
      c,
      'Assumptions for this calculation: independent coordinates, zero means and unit variances.',
    );
  } else if (b < 7) {
    const div = 1 + Math.round(70 * cue(k, 5, 'Divide the scores', 1.2)) / 10,
      before = softmax(scaleScores),
      after = softmax(scaleScores.map((v) => v / div));
    type(c, 'Raw scores    ' + vector(scaleScores, 1), 55, 164, 23, ink, 'Mono');
    label(c, 'Unscaled shares', 56, 209);
    strip(c, 56, 229, 840, 43, before, before.map(pct));
    label(c, 'Scores divided by ' + fmt(div, 1), 56, 317);
    strip(c, 56, 337, 840, 52, after, after.map(pct));
    foot(c, 'Head width 64 gives a divisor of 8. Ordering stays fixed while the gaps shrink.');
  } else {
    const n = 3 + Math.round(3 * cue(k, 7, 'go from three tokens to six', 1.2)),
      vals = Array.from({ length: n }, () => Array(n).fill(''));
    label(c, 'Query × key', 98, 166);
    grid(c, 100, 189, vals, { cw: 34, ch: 34, paint: () => blue });
    label(c, 'One projected array', 520, 166);
    grid(
      c,
      521,
      189,
      Array.from({ length: n }, () => Array(4).fill('')),
      { cw: 34, ch: 34, paint: () => teal },
    );
    type(c, n + ' × ' + n + ' = ' + n * n + ' scores', 98, 422, 23, blue, 'Mono');
    type(c, n + ' rows × 4 features', 520, 422, 23, teal, 'Mono');
    foot(c, 'A fused kernel can form the weighted read without storing the entire score grid.');
  }
}
function headSplit(c, k) {
  const b = k.beat.beatIndex;
  const split = cue(k, 1, 'Reshape and transpose', 1.1);
  bench(
    c,
    !split
      ? 'Where would you cut this sheet for three heads?'
      : b < 2
        ? 'Cut along features and keep every token'
        : b < 4
          ? 'What goes into the output map?'
          : 'Which operations can run together?',
    'MULTI-HEAD ATTENTION  /  ONE BATCH',
  );
  if (b < 2) {
    heads.forEach((head, i) => {
      const x = 188 + i * (152 + 80 * split);
      if (split) type(c, 'head ' + (i + 1), x + 75, 167, 19, colors[i], 'Mono', 'center');
      grid(c, x, 197, head, {
        cw: 76,
        ch: 51,
        paint: () => (split ? colors[i] : dim),
        fg: () => paper,
        format: (v) => fmt(v, 1),
      });
    });
    for (let i = 0; i < 3; i++) type(c, 'token ' + i, 57, 222 + i * 51, 19, dim);
    foot(
      c,
      !split
        ? 'Three tokens by six projected features. Find a cut that keeps all three tokens in every head.'
        : '[batch, heads, tokens, head width] = [1, 3, 3, 2]',
    );
  } else if (b < 4) {
    const join = cue(k, 2, 'Concatenate', 2);
    const cellWidth = 104;
    const rowLeft = (960 - 6 * cellWidth) / 2;
    const rowTop = mix(355, 376, join);
    const rowHeight = 48;
    headWeights.forEach((weights, i) => {
      const x = 60 + i * 296;
      label(c, 'Head ' + (i + 1) + ' weights', x, 161);
      grid(c, x, 185, weights, {
        cw: 79,
        ch: 42,
        format: (v) => fmt(v, 2),
        paint: (v, t, j) => (t === 2 ? colors[i] : paper),
        fg: (v, t) => (t === 2 ? paper : ink),
      });
      c.save();
      c.globalAlpha = 1 - join;
      arrow(c, x + 117, 316, x + 117, 346, colors[i]);
      c.restore();
      const left = mix(x + 117 - cellWidth, rowLeft + i * 2 * cellWidth, join);
      box(c, left, rowTop, 2 * cellWidth, rowHeight, colors[i]);
      line(c, left + cellWidth, rowTop, left + cellWidth, rowTop + rowHeight, paper, 2);
      headReads[i].forEach((value, j) => {
        type(c, fmt(value, 3), left + (j + 0.5) * cellWidth, rowTop + rowHeight / 2,
          24, paper, 'Mono', 'center', cellWidth - 8);
      });
    });
    if (join === 1) {
      for (const [edge, inward] of [[rowLeft - 8, 8], [rowLeft + 6 * cellWidth + 8, -8]]) {
        line(c, edge + inward, rowTop - 4, edge, rowTop - 4, ink, 4);
        line(c, edge, rowTop - 6, edge, rowTop + rowHeight + 6, ink, 4);
        line(c, edge, rowTop + rowHeight + 4, edge + inward, rowTop + rowHeight + 4, ink, 4);
      }
    }
    foot(
      c,
      join === 1
        ? 'The output map takes all six features in head order.'
        : 'Each head uses its last row of weights to read two features.',
    );
  } else {
    for (let i = 0; i < 2; i++) {
      const x = 108 + i * 452;
      type(c, 'Block ' + (i + 1), x, 169, 29, ink, 'Serif');
      for (let j = 0; j < 3; j++) {
        const y = 220 + j * 68;
        line(c, x, 310, x + 48, y + 25, dim, 2);
        box(c, x + 48, y, 128, 47, colors[j], 3);
        type(c, 'head ' + (j + 1), x + 112, y + 23, 18, paper, 'Mono', 'center');
        line(c, x + 176, y + 25, x + 223, 310, dim, 2);
      }
    }
    arrow(c, 333, 310, 545, 310, teal, 4);
    type(c, 'block output', 431, 281, 17, teal, 'Sans', 'center');
    foot(c, 'Heads in one block run in parallel. The next block consumes the updated stream.');
  }
}
function variants(c, k) {
  const b = k.beat.beatIndex;
  bench(
    c,
    b < 3
      ? 'Where does the straight line bend?'
      : b < 6
        ? 'Can a gate turn a feature negative?'
        : 'Fit three matrices under one weight budget',
    'FEED-FORWARD BRANCH  /  ONE TOKEN',
  );
  if (b < 3) {
    const at = (x, y) => [367 + 110 * x, 339 - 12 * y];
    line(c, ...at(-2.1, 0), ...at(2.1, 0), dim);
    line(c, ...at(0, -7), ...at(0, 14), dim);
    line(c, ...at(-1.25, affine(-1.25)), ...at(2, affine(2)), blue, 3);
    const show = cue(k, 1, 'put ReLU', 0);
    if (show) {
      line(c, ...at(-1.25, bent(-1.25)), ...at(-0.5, bent(-0.5)), red, 4);
      line(c, ...at(-0.5, bent(-0.5)), ...at(2, bent(2)), red, 3);
    }
    const y = mix(affine(-1), bent(-1), show);
    for (const x of [0, 1, 2]) dot(c, ...at(x, affine(x)), 4, blue);
    dot(c, ...at(-1, y), 8, show ? red : blue);
    type(c, 'Input −1', 630, 192, 28, ink, 'Serif');
    type(c, '2x + 1 = −1', 630, 255, 22, blue, 'Mono');
    type(c, show ? 'ReLU(−1) = 0' : '3h − 2', 630, 302, 22, show ? red : ink, 'Mono');
    const solved = cue(k, 0, 'give minus five');
    type(c, 'Output   ' + (solved ? fmt(y, 1) : '?'), 630, 363, 26, ink, 'Mono');
    foot(
      c,
      'Two affine maps compose to 6x + 1. Clipping the intermediate value introduces a bend.',
    );
  } else if (b < 6) {
    const p = cue(k, 4, 'Multiply plus two', 1.0);
    slug(c, 65, 189, 210, 71, 'up     +2', true);
    slug(c, 65, 310, 210, 71, 'gate     −1');
    arrow(c, 295, 229, 517, 256, teal);
    arrow(c, 295, 344, 517, 296, red);
    type(c, 'SiLU(−1) ≈ ' + fmt(gate(-1), 3), 308, 367, 19, red, 'Mono');
    dot(c, 552, 275, 27, ink);
    type(c, '×', 552, 273, 31, paper, 'Serif', 'center');
    arrow(c, 586, 275, 668, 275);
    type(c, p ? fmt(2 * gate(-1), 3) : '?', 698, 272, 38, teal, 'Mono');
    foot(
      c,
      b === 5
        ? 'This impression uses SwiGLU. Gemma’s GeGLU replaces SiLU with GELU on the gate branch.'
        : 'SwiGLU multiplies the upward feature by the SiLU of a separate projection.',
    );
  } else {
    const extra = cue(k, 7, 'third plate', 0.8),
      p = cue(k, 8, 'Narrow all three matrices', 1.3);
    const h = Math.ceil(mix(48, gatedWidth, p)),
      w = 12 * h * 0.43,
      x = 68,
      limit = x + plainBudget * 0.43;
    type(c, 'Plain FFN', x, 172, 22, ink, 'Serif');
    for (let i = 0; i < 2; i++)
      box(c, x + (i * (limit - x)) / 2, 194, (limit - x) / 2 - 2, 46, colors[i]);
    type(c, 'Gated FFN', x, 267, 22, ink, 'Serif');
    for (let i = 0; i < 3; i++)
      box(c, x + i * w, 294, (w - 2) * (i === 2 ? extra : 1), 59, colors[i]);
    line(c, limit, 155, limit, 370, red, 3);
    type(c, '1,152 weights', limit + 10, 169, 18, red, 'Mono');
    type(c, 'inner width   ' + fmt(h, 0), x, 399, 26, ink, 'Mono');
    foot(
      c,
      p >= 1
        ? 'Bias-free budget   ·   2 × 12 × 48 = 3 × 12 × 32. Each gated lane costs 36 weights.'
        : extra
          ? 'Three matrices share the same budget. How many inner features will fit?'
          : 'Each of two matrices holds 12 × 48 weights. The vertical line marks their combined cost.',
    );
  }
}
function norms(c, k) {
  const b = k.beat.beatIndex;
  bench(
    c,
    b <= 4 ? 'Where do four identical pins land?' : 'Where does the straight path go?',
    'NORMALIZATION  /  CONSTANT INPUT',
  );
  if (b <= 4) {
    row(c, 'one token', constant, 167, gold);
    const ln = cue(k, 0, 'subtracts that mean'),
      rs = cue(k, 3, 'Each output');
    row(c, 'LayerNorm', ln ? norm(constant) : Array(4).fill('?'), 245, blue);
    row(c, 'RMSNorm', rs ? rms(constant).map((v) => v.toFixed(6)) : Array(4).fill('?'), 334, teal);
    foot(
      c,
      b < 3
        ? 'Center the row, divide by √(variance + ε), then apply the learned scale and shift.'
        : 'RMSNorm keeps the numerator at 2. Its divisor is √(4 + ε).',
    );
  } else {
    const post = b === 6 && cue(k, 6, 'post-LayerNorm') > 0.5,
      y = 315;
    slug(c, 59, y - 25, 85, 52, 'x');
    arrow(c, 156, y, 607, y, blue, 4);
    line(c, 200, y, 200, 210, dim);
    line(c, 200, 210, 594, 210, dim);
    arrow(c, 594, 210, 637, y - 19, dim);
    slug(c, 267, 182, 234, 51, post ? 'sublayer' : 'norm → sublayer', true);
    dot(c, 643, y, 25, ink);
    type(c, '+', 643, y, 32, paper, 'Mono', 'center');
    arrow(c, 676, y, 762, y, teal);
    if (post) slug(c, 780, y - 23, 118, 48, 'norm', true);
    else type(c, 'sum', 789, y, 26, ink, 'Serif');
    type(c, post ? 'Post-LN' : 'Pre-LN', 56, 162, 25, teal, 'Serif');
    foot(
      c,
      post
        ? 'Post-LN normalizes the sum. Warmup depends on the model and training recipe.'
        : 'In Pre-LN the direct derivative contributes the identity. The branch derivative also contributes.',
    );
  }
}
function training(c, k) {
  const b = k.beat.beatIndex;
  bench(
    c,
    b < 2
      ? 'Which target belongs to each input?'
      : b < 4
        ? 'What mass does a blocked score receive?'
        : 'Test the whole path with one changed token',
    'TRAINING  /  INFORMATION BOUNDARY',
  );
  if (b < 2) {
    const names = VOCAB.slice(0, 4),
      step = 187;
    label(c, 'Input', 53, 218);
    label(c, 'Target', 53, 354);
    names.forEach((w, i) => slug(c, 146 + i * step, 187, step - 11, 62, w, i === 2));
    names.slice(1).forEach((w, i) => {
      arrow(c, 240 + i * step, 264, 240 + i * step, 309, gold);
      slug(c, 146 + i * step, 325, step - 11, 58, w, true);
    });
    foot(
      c,
      'Shifted labels choose what to predict. The causal mask decides what each input may read.',
    );
  } else if (b < 4) {
    const forbid = afterCue(k, 2, 'negative infinity', { captionStart: 'negative infinity' });
    const all = afterCue(k, 3, 'masking every entry');
    const weightsShown = all
      ? afterCue(k, 3, 'producing NaN', { captionStart: 'producing NaN' })
      : forbid
        ? afterCue(k, 2, 'leaves the legal key with weight one')
        : afterCue(k, 2, 'It takes half the total');
    const scores = [all ? -Infinity : 0, forbid ? -Infinity : 0];
    const max = Math.max(...scores);
    const masses = scores.map((score) => Math.exp(score - max));
    const total = masses[0] + masses[1];
    const massShown = all
      ? weightsShown
      : forbid
        ? afterCue(k, 2, 'removes its mass')
        : afterCue(k, 2, 'gives it exponential mass one');
    const shiftedShown = all && afterCue(k, 3, 'negative infinity minus negative infinity');
    const cells = { h: 41 };
    row(c, 'key', ['current', 'future'], 151, dim, cells);
    row(c, 'score', scores.map((score) => (score === -Infinity ? '−∞' : score)), 207, blue, cells);
    if (all) {
      row(c, 'score − max', shiftedShown ? ['−∞ − (−∞)', '−∞ − (−∞)'] : ['', ''], 263, red, cells);
    }
    row(c, 'exp(score − max)', massShown ? masses : ['', ''], 319, gold, cells);
    row(
      c,
      'manual softmax',
      weightsShown ? masses.map((mass) => mass / total) : ['', ''],
      375,
      all ? red : teal,
      cells,
    );
    type(c, 'Give each real query a legal key. Padded queries need explicit handling.', 47, 431, 18, dim);
  } else {
    const p = cue(k, 4, 'change only the last input', 0),
      d = perturb(2, 4 * p);
    const center = typeLine(c, WORDS, { y: 177, h: 62, selected: 2 });
    label(c, 'Output displacement after the edit', 56, 295);
    tokenValues(c, center, p ? d : Array(3).fill('?'), 321, teal);
    foot(
      c,
      b === 5
        ? 'The changed row responds. The two earlier rows remain fixed.'
        : 'Keep weights and earlier inputs fixed. Disable dropout and recompute the complete block.',
    );
  }
}
export const worksheets = [positions, scale, headSplit, variants, norms, training];
