import { loadImage } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import {
  ink,
  muted,
  blue,
  red,
  teal,
  gold,
  edge,
  names,
  colors,
  sentence,
  lerp,
  fmt,
  pct,
  vec,
  text,
  line,
  dot,
  ring,
  box,
  arrow,
  heading,
  mono,
  label,
  plane,
  sharePair,
  segment,
  matrix,
  grid,
} from './art.mjs';
import { m, gaze, route } from './fixtures.mjs';

export function variance(c, t) {
  const { b, at } = t;
  if (b <= 4 || b >= 10) {
    heading(c, b >= 10 ? 'Scale the spread back down' : 'How wide is a raw dot product?');
    label(c, 'Independent coordinates, each with mean 0 and variance 1', 66, 132);
    if (b === 2 || b === 3) {
      const count = 4;
      for (let i = 0; i < count; i++) {
        const x = 110 + i * 255;
        mono(c, 'q' + ['₁', '₂', '₃', '₄'][i], x + 71, 218, 42, blue, 'center');
        mono(c, '×', x + 71, 263, 26, muted, 'center');
        mono(c, 'k' + ['₁', '₂', '₃', '₄'][i], x + 71, 308, 42, red, 'center');
        line(c, x, 355, x + 149, 355, edge);
        mono(c, 'Var = 1', x + 71, 406, 26, teal, 'center');
        if (i !== count - 1 && b === 3) mono(c, '+', x + 200, 407, 35, muted, 'center');
      }
      if (b === 3)
        mono(c, 'd independent products     Var = d     SD = √d', 600, 535, 32, ink, 'center');
      return;
    }
    const normal = at(10, 'So divide by root'),
      over = b === 11 && at(11, 'dividing by d');
    const rows = [64, 512],
      x = 220,
      u = 32;
    label(
      c,
      over
        ? 'Standard deviation after division by d'
        : normal
          ? 'Standard deviation after division by √d'
          : 'Raw standard deviation',
      x,
      217,
    );
    rows.forEach((d, i) => {
      const y = 318 + i * 134,
        s = Math.sqrt(d) / (over ? d : normal ? Math.sqrt(d) : 1);
      mono(c, 'd = ' + d, 68, y, 25);
      line(c, x, y, x + u * 23, y, edge, 2);
      box(c, x, y - 14, Math.max(1, u * s), 28, i ? blue : teal);
      mono(c, fmt(s, over ? 3 : 2), x + u * s + 12, y, 27, i ? blue : teal);
    });
    if (b === 12) label(c, 'For a trained head, measure the empirical spread on inputs.', x, 554);
    return;
  }
  heading(c, b <= 6 ? 'Softmax responds to gaps' : 'How much can the leading share move?');
  const shift = at(5, 'Add a thousand'),
    gap = at(5, 'a gap of ten');
  let logits = gap ? [10, 0, 0] : [2, 1, 0].map((v) => v + 1000 * shift);
  if (b >= 7) logits = [20 * at(8, 'With a twenty point lead'), 0, 0];
  const weights = m.softmax(logits),
    col = [blue, red, teal];
  label(c, 'Logits', 80, 209);
  matrix(c, [logits], 264, 166, 225, 81, { cols: ['Key 1', 'Key 2', 'Key 3'] });
  label(c, 'Shares', 80, 346);
  segment(c, 264, 307, 675, 76, weights, col);
  if (b <= 6) {
    mono(c, gap ? 'ratio 1 to 2 = exp(10) ≈ 22,026' : 's₁ − s₂ = 1', 270, 468, 36);
    if (gap) label(c, 'Three keys compete in this row.', 270, 532);
  } else {
    const a = weights[0],
      slope = a * (1 - a);
    label(c, 'Sensitivity of share 1 to its own logit', 264, 438);
    mono(
      c,
      'a₁ (1 − a₁)  ≈  ' + (logits[0] === 0 ? fmt(slope) : '4.12 × 10⁻⁹'),
      264,
      509,
      39,
      gold,
    );
    if (b === 9)
      label(c, 'The value path still carries almost the whole upstream gradient.', 264, 578);
  }
}

export function patterns(c, t) {
  const { at, b } = t,
    cross = b >= 5,
    causal = b === 4,
    source = cross ? ['les', 'oiseaux', 'chantent'] : ['Birds', 'sing', 'now'];
  const padded = b === 3 || !!at(6, 'block its column');
  if (padded) source.push('PAD');
  const readers = cross ? ['Birds', 'sing'] : ['Birds', 'sing', 'now'];
  heading(
    c,
    cross
      ? 'The decoder reads the source'
      : causal
        ? 'Read the prefix'
        : 'Read a complete sequence',
  );
  label(
    c,
    cross ? 'Encoder supplies keys and values' : 'Keys and values from the same sequence',
    351,
    161,
  );
  const table = readers.map((_, i) =>
    source.map((s, j) => (s === 'PAD' || (causal && j > i) ? '×' : 'T')),
  );
  matrix(c, table, 350, 260, 151, 76, {
    rows: readers,
    cols: source,
    fill: (i, j) => (table[i][j] === '×' ? '#dedad1' : '#abd0c0'),
    color: (i, j) => (table[i][j] === '×' ? muted : teal),
  });
  label(c, cross ? 'Decoder queries' : 'Queries', 135, 207);
  text(
    c,
    cross ? '2 target readers' : causal ? 'Causal self-attention' : 'Bidirectional self-attention',
    350,
    554,
    31,
    ink,
    'Serif',
  );
  if (cross) mono(c, '× ' + source.length + ' source positions', 591, 554, 25);
}
function gazeThreads(c, t) {
  const next = t.at(11, 'Try At dawn birds sing'),
    motion = t.at(11, 'Move the reader', 1.2),
    moved = motion === 1,
    tested = !!t.at(12, 'the largest share goes to At');
  const words = next ? ['At', 'dawn', 'birds', 'sing'] : sentence;
  const reader = next ? 3 : moved ? 4 : 3,
    weights = gaze(words.length, reader);
  const lo = 134,
    hi = 1068,
    xAt = (i) => lo + ((hi - lo) * i) / (words.length - 1);
  heading(c, 'Two heads follow one reader');
  const between = motion > 0 && motion < 1;
  const active = !(next && !tested);
  const rowY = 369;
  words.forEach((s, i) => {
    const x = xAt(i);
    if (i === reader && !between) box(c, x - 64, rowY - 34, 128, 68, '#ebd498');
    text(c, s, x, rowY, 39, i === reader ? ink : muted, 'Serif', 'center', 117);
  });
  const cursor = between ? lerp(xAt(3), xAt(4), motion) : xAt(reader);
  line(c, cursor - 36, rowY + 33, cursor + 36, rowY + 33, gold, 4);
  label(c, 'Query', cursor + 73, rowY + 75, 'center');
  weights.forEach((w, h) => {
    const ix = w.indexOf(Math.max(...w)),
      y = h ? 522 : 181,
      col = h ? red : blue;
    const x = cursor,
      X = between && h === 0 ? lerp(xAt(2), xAt(3), motion) : xAt(ix),
      dy = h ? -1 : 1;
    label(c, 'Head ' + (h + 1), 64, y - 40, 'left', col);
    if (!active) {
      mono(c, '?', 600, y, 38, col, 'center');
      return;
    }
    c.beginPath();
    c.moveTo(x + (h ? 13 : -13), rowY + dy * -38);
    c.bezierCurveTo(x, y - (h ? -50 : 50), X, y - (h ? -50 : 50), X, rowY + dy * -49);
    c.lineWidth = 5;
    c.strokeStyle = col;
    c.stroke();
    dot(c, X, rowY + dy * -49, 7, col);
    if (!between || h === 1)
      text(
        c,
        'Largest share   ' + words[ix] + '   ' + pct(w[ix]),
        600,
        y + (h ? 38 : -36),
        27,
        col,
        'Sans',
        'center',
      );
  });
}
export function heads(c, t) {
  const { b, at } = t;
  if (b >= 10) {
    gazeThreads(c, t);
    return;
  }
  if (b >= 6) {
    heading(c, 'One query-key pair across heads');
    const x = 258,
      width = 764;
    label(c, '512 products per token pair in total', x, 142);
    for (const [r, num] of [1, 8].entries()) {
      const y = 224 + r * 178,
        col = r ? teal : blue;
      text(c, num === 1 ? 'One head' : 'Eight heads', 61, y + 19, 27, ink, 'Serif');
      for (let i = 0; i < num; i++) {
        const xx = x + (i * width) / num;
        box(c, xx, y, width / num - 2, 45, col);
        mono(c, String(512 / num), xx + width / (2 * num), y + 23, 24, '#fff', 'center');
        if (at(8, 'Count the bright cells')) {
          const cell = 9;
          grid(c, 8, 8, xx + 7, y + 65, cell, (a, b) => (a === 4 && b === 0 ? gold : '#c9d5d5'));
          box(c, xx + 7, y + 65 + 4 * cell, cell - 1, cell - 1, '#815000');
        }
      }
    }
    if (at(9, 'If we save'))
      mono(c, '8 × 8 pairs    →    64 scores or 512 scores', 600, 580, 32, ink, 'center');
    return;
  }
  heading(c, b === 5 ? 'Join the two head outputs' : 'How does each head read sing?');
  if (b === 5) {
    const joined = [...m.OUTPUT[1], ...m.HEAD2_OUTPUT];
    label(c, 'Head 1', 223, 183, 'left', blue);
    label(c, 'Head 2', 631, 183, 'left', teal);
    joined.forEach((v, i) => {
      box(c, 207 + 204 * i, 226, 201, 92, i < 2 ? '#dbe5ef' : '#c9e2d9');
      mono(c, fmt(v), 306 + 204 * i, 271, 42, ink, 'center');
    });
    mono(c, 'Concat', 111, 370, 26);
    arrow(c, 403, 375, 547, 375, gold);
    mono(c, '× Wᴼ', 572, 375, 36);
    if (at(5, 'added to the token')) {
      arrow(c, 735, 375, 850, 375, gold);
      mono(c, '+ x', 878, 375, 36);
      label(c, 'Residual state', 856, 441);
    }
    return;
  }
  const second = !!at(3, 'Head two');
  for (let h = 0; h < (second ? 2 : 1); h++) {
    const x = 98 + h * 548,
      w = h ? m.HEAD2_WEIGHTS : m.WEIGHTS[1],
      v = h ? m.HEAD2.V : m.V;
    text(c, 'Head ' + (h + 1), x, 159, 41, h ? teal : blue, 'Serif');
    sharePair(c, w, x, 250, 453, 'Shares for sing');
    matrix(c, v, x + 108, 398, 109, 55, { rows: names, cols: ['Value 1', 'Value 2'] });
    const result = h ? at(4, 'The second') : at(2, 'lands at');
    mono(
      c,
      result ? vec(m.blendOf(w, v), 2) : '[?, ?]',
      x + 222,
      570,
      39,
      result ? ink : muted,
      'center',
    );
  }
}

const artBase = new URL('../../../assets/papers/attention-is-all-you-need-v7/', import.meta.url);
const [eq, fig, title] = await Promise.all(
  ['equation-1.png', 'figure-2.png', 'title.png'].map((name) =>
    loadImage(fileURLToPath(new URL(name, artBase))),
  ),
);
const figRegions = {
  scores: [158, 509, 190, 66],
  scale: [183, 420, 140, 67],
  mask: [148, 333, 210, 66],
  softmax: [157, 247, 192, 68],
  mix: [225, 160, 203, 69],
  projections: [871, 471, 458, 107],
  core: [871, 308, 462, 143],
  h: [1268, 351, 111, 94],
  concat: [1004, 218, 153, 66],
  output: [1018, 111, 130, 71],
};
export function paperScene(c, t) {
  const { b, at } = t;
  box(c, 0, 0, 1200, 675, '#fff');
  label(c, 'Vaswani et al.   ·   Attention Is All You Need   ·   2017', 65, 54);
  if (b <= 3) {
    c.drawImage(title, 147, 109, 905, 133);
    const x = 116,
      y = 277,
      s = 0.82;
    c.drawImage(eq, x, y, eq.width * s, eq.height * s);
    if (b >= 2) {
      const reg = at(3, 'Multiplying those shares')
        ? [1073, 90, 65, 75]
        : at(2, 'Softmax runs')
          ? [644, 92, 224, 66]
          : at(2, 'denominator')
            ? [900, 135, 143, 76]
            : [890, 42, 155, 78];
      box(c, x + reg[0] * s, y + reg[1] * s, reg[2] * s, reg[3] * s, null, gold, 3);
    }
    mono(
      c,
      b === 3 ? 'sing   [0.42, 0.58] × V  ≈  [1.42, 1.58]' : 'Equation 1   ·   unmasked attention',
      600,
      549,
      29,
      ink,
      'center',
    );
    return;
  }
  const group = b < 6 ? 'left' : 'right';
  const crop = group === 'left' ? [80, 92, 423, 646] : [780, 63, 633, 676];
  const [sx, sy, sw, sh] = crop,
    s = 0.75,
    x = 135,
    y = 107;
  c.drawImage(fig, sx, sy, sw, sh, x, y, sw * s, sh * s);
  let reg = 'scores',
    description = 'Q and K form scores';
  if (at(4, 'Scale divides')) {
    reg = 'scale';
    description = 'Scale by the key width’s square root';
  }
  if (at(4, 'optional mask')) {
    reg = 'mask';
    description = 'Exclude blocked keys';
  }
  if (at(4, 'softmax forms')) {
    reg = 'softmax';
    description = 'Normalize each query row';
  }
  if (at(5, 'V joins')) {
    reg = 'mix';
    description = 'Weight and add the values';
  }
  if (b >= 6) {
    reg = 'projections';
    description = 'Separate projections for each head';
  }
  if (at(7, 'Each head then runs')) {
    reg = 'core';
    description = 'Score, normalize, mix';
  }
  if (b === 8) {
    reg = 'h';
    description = 'h copies of the attention head';
  }
  if (b === 9) {
    reg = 'concat';
    description = 'Join the head outputs';
  }
  if (at(9, 'last Linear')) {
    reg = 'output';
    description = 'Project the joined vector';
  }
  const [rx, ry, rw, rh] = figRegions[reg];
  box(c, x + (rx - sx) * s, y + (ry - sy) * s, rw * s, rh * s, null, gold, 3);
  label(c, 'FIGURE 2   /   ' + (group === 'left' ? 'SCALED DOT-PRODUCT' : 'MULTI-HEAD'), 644, 204);
  text(c, description, 644, 296, 36, ink, 'Serif', 'left', 495);
  if (group === 'left')
    mono(
      c,
      reg === 'mix'
        ? 'A × V'
        : reg === 'scores'
          ? 'Q × Kᵀ'
          : reg === 'scale'
            ? 'S / √dₖ'
            : reg === 'mask'
              ? 'blocked → −∞'
              : 'row sum = 1',
      645,
      383,
      39,
      teal,
    );
  else if (reg === 'projections' || reg === 'core') {
    ['Q', 'K', 'V'].forEach((role, i) => {
      const x = 645 + 164 * i;
      const factors = role + ' W';
      text(c, factors, x, 384, 43, teal, 'Serif');
      const scriptX = x + c.measureText(factors).width + 2;
      text(c, role, scriptX, 363, 24, teal, 'Serif');
      text(c, 'i', scriptX, 401, 23, teal, 'Serif');
    });
  } else
    mono(
      c,
      reg === 'h'
        ? 'h = 2 in our example'
        : reg === 'output'
          ? 'Concat × Wᴼ'
          : '[head 1 | head 2]',
      645,
      383,
      30,
      teal,
    );
  if (at(9, 'residual addition')) label(c, 'The surrounding block adds the residual.', 645, 483);
}

export function gradientState(t) {
  const { at } = t;
  const a =
    at(1, 'Raise the Birds logit', 1) -
    at(3, 'Put the score back', 0.8) +
    at(4, 'Raise its logit', 1) -
    at(5, 'Give Birds its old logit', 1);
  const merged = at(3, 'Now give both sources', 1) - at(7, 'Bring back', 1);
  const values = m.V.map((v) => v.map((n, i) => lerp(n, [3, -1][i], merged)));
  const blocked = !!at(7, 'block Birds') && !at(8, 'Let Birds back in');
  const sing =
    at(7, 'Raise the sing logit', 1) * (1 - at(8, 'Let Birds back in')) +
    4 * at(8, 'Now add four', 1.3);
  return route(a, sing, values, blocked);
}
export function gradient(c, t) {
  const { b, at } = t,
    state = gradientState(t);
  heading(c, 'Change the route and follow the point');
  const p = plane(c, 131, 385, 124, 0, 3, -1, 2);
  line(c, ...p(state.values[0]), ...p(state.values[1]), muted, 2, [5, 4]);
  state.values.forEach((v, i) => ring(c, ...p(v), i ? 12 : 18, colors[i], 4));
  const asking = b === 4;
  if (!asking) dot(c, ...p(state.out), 7, '#c58a12');
  label(c, 'Value coordinates', 139, 567);
  label(c, 'Dropout off', 69, 124);
  names.forEach((name, i) => {
    const y = 204 + i * 67;
    text(c, name, 623, y, 30, colors[i], 'Serif');
    mono(c, state.logits[i] === -Infinity ? '−∞' : fmt(state.logits[i]), 814, y, 29, colors[i]);
    mono(c, vec(state.values[i], 2), 927, y, 26);
  });
  label(c, 'logit', 815, 151);
  label(c, 'value', 930, 151);
  sharePair(c, state.shares, 636, 360, 464, 'Weights for sing');
  mono(c, 'o = ' + (asking ? '[?, ?]' : vec(state.out, 2)), 634, 488, 34, gold);
  if (b === 2 || b === 3 || b === 6 || b === 7 || b === 9) {
    mono(c, '∂o/∂sᴮ = aᴮ (vᴮ − o)', 634, 556, 26);
    mono(c, '= ' + vec(state.slope, 2), 634, 598, 27, teal);
  }
}
