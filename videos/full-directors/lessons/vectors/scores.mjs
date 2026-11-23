import {
  C,
  colors,
  fmt,
  vec,
  cue,
  text,
  mono,
  line,
  rect,
  arrow,
  dot,
  plate,
  chart,
  table,
  label,
  badge,
  foot,
} from './drawing.mjs';
import {
  H,
  WORDS,
  transpose,
  editFirst,
  gram,
  cosine,
  trap,
  AXIS_TRAP,
  dotProduct,
} from './model.mjs';

export function pairs(g, k) {
  const b = k.beat.beatIndex,
    delta = cue(k, 4, 'Apply the edit', 1.1),
    rows = editFirst(H[0], 2, delta);
  const scores = gram(rows),
    old = gram(H[0]),
    turned = cue(k, 0, 'Turn a copy', 0.85);
  const show = cue(k, 1, 'Read across that row'),
    all = cue(k, 1, 'These are raw dot products');
  const known = [cue(k, 1, 'Reset with my'), cue(k, 1, 'Reset with password'), show];
  const resetPair = cue(k, 4, 'The matching entry', 0) === 1;
  const mirror = cue(k, 4, 'The score with my', 0) === 1;
  const myPair = cue(k, 4, 'My has a zero', 0) === 1;
  const self = cue(k, 4, 'Only pairs that read password', 0) === 1;
  function rechecked(i, j) {
    if (i === 0 && j === 2) return resetPair;
    if (i === 2 && j === 0) return mirror;
    if ((i === 1 && j === 2) || (i === 2 && j === 1)) return myPair;
    return i === 2 && j === 2 && self;
  }
  label(g, 'Token vectors', 42, 143);
  table(g, {
    x: 42,
    y: 193,
    w: 293,
    names: WORDS[0],
    rows,
    cols: ['x', 'y'],
    heads: 98,
    rh: 44,
    active: (i, j) => delta > 0 && i === 2 && j === 0,
    tint: () => C.warm,
  });
  if (turned > 0) {
    label(g, 'The same tokens as columns', 43, 353);
    table(g, {
      x: 43,
      y: 389,
      w: 293,
      rows: transpose(rows),
      cols: WORDS[0],
      heads: 26,
      names: ['x', 'y'],
      rh: 23,
      font: 16,
      active: (i, j) => delta > 0 && i === 0 && j === 2,
      tint: () => C.warm,
    });
  }
  const gridTitle = b < 3 ? 'One intersection per ordered pair'
    : resetPair ? 'Saved grid  /  rechecked pairs in color' : 'Saved score grid';
  label(g, gridTitle, 426, 143);
  const displayed = old.map((row, i) => row.map((saved, j) => {
    if (rechecked(i, j)) return scores[i][j];
    return all || (i === 0 && known[j]) ? saved : null;
  }));
  table(g, {
    x: 425,
    y: 199,
    w: 481,
    names: WORDS[0],
    cols: WORDS[0],
    heads: 104,
    rh: 62,
    rows: displayed,
    active: (i, j) =>
      b === 4 ? rechecked(i, j) : b === 2 ? i === j : b === 1 && i === 0,
    tint: (i, j) => (rechecked(i, j) && scores[i][j] !== old[i][j] ? C.warm : C.pale),
  });
  if (b === 4) {
    let direction = 'Follow the edited coordinate in both copies of password.';
    if (self) direction = 'Password paired with itself uses the new coordinate in both factors.';
    else if (myPair) direction = 'The first coordinate of my is zero. Its score with password stays at one half.';
    else if (mirror) direction = 'Exchanging the two words gives the same score.';
    else if (resetPair) direction = 'Reset reads the edited first coordinate of password.';
    foot(g, direction);
    return;
  }
  foot(
    g,
    b < 2
      ? 'One token supplies the row. Its partner supplies the column.'
      : b === 2
        ? 'A raw self-score is the squared length of that token.'
        : 'If password moves, can a cell in reset’s row change?',
  );
}

export function normalized(g, k) {
  const b = k.beat.beatIndex,
    double = cue(k, 0, 'Double the vector', 1);
  const right = cue(k, 2, 'Rotate the arrow', 1.1),
    left = cue(k, 2, 'Turn it to face left', 1.1),
    shrink = cue(k, 2, 'shrink it to the origin', 1.2, 'Now shrink it');
  const angle = Math.PI / 4 + (Math.PI / 4) * right + (Math.PI / 2) * left;
  const len = Math.hypot(...H[0][2]) * (1 + double) * (1 - shrink);
  const v = [Math.cos(angle) * len, Math.sin(angle) * len],
    ref = [1, 0],
    cos = cosine(v, ref),
    raw = dotProduct(v, ref);
  const q = chart(g, {
    x: 40,
    w: 463,
    ox: 268,
    oy: 355,
    scale: 115,
    minX: -1.5,
    maxX: 1.5,
    minY: 0,
    maxY: 1.5,
    xlabel: 'horizontal reference',
    ylabel: 'vertical feature',
  });
  q.arrow([0, 0], ref, C.muted, 2);
  q.line(v, [v[0], 0], C.brass, 2, [4, 4]);
  q.arrow([0, 0], v, C.blue, 5);
  dot(g, ...q.p(...v), 4, C.blue);
  const [x, y] = q.p(0, 0);
  line(g, x, y + 25, q.p(...v)[0], y + 25, C.brass, 5);
  label(g, 'Read against reset  [1, 0]', 541, 147);
  const reads = [
    ['Length', fmt(len)],
    ['Dot product', fmt(raw)],
    ['Cosine', b === 0 ? '·' : cos === null ? 'undefined' : fmt(cos)],
  ];
  reads.forEach(([s, val], i) => {
    const yy = 214 + i * 66;
    text(g, s, 544, yy, 20, C.muted);
    mono(g, val, 902, yy, 29, colors[i], 'right');
    line(g, 544, yy + 25, 902, yy + 25, C.grid);
  });
  if (b === 1) {
    if (cue(k, 1, 'Normalizing every token') > 0) {
      const self = H[0].map((row) => cosine(row, row));
      mono(g, 'unit self-scores   ' + vec(self), 544, 401, 19, C.teal);
    } else mono(g, 'cosine = dot / (|a| × |b|)', 544, 401, 19, C.teal);
  }
  foot(
    g,
    b === 0
      ? 'The ochre shadow measures the raw dot product with a unit horizontal vector.'
      : b === 1
        ? 'Doubling the arrow changes its shadow. The angle stays at 45°.'
        : cos === null
          ? 'Zero length stops the division.'
          : 'Follow the shadow through zero and onto the negative axis.',
  );
}

export function transposeTrap(g, k) {
  const b = k.beat.beatIndex;
  const edited = cue(k, 3, 'change the first zero to one', 0.65, 'In prompt one') > 0 && cue(k, 6, 'Undo the edit') === 0;
  const repaired = cue(k, 5, 'Swap just the token and feature axes') > 0;
  const expected = dotProduct(AXIS_TRAP[0][1], AXIS_TRAP[0][1]);
  const data = trap(edited, repaired);
  const showExpected = cue(k, 1, 'Keep that expected self-score') > 0;
  const showColumn = cue(k, 1, 'Trace the ochre column') > 0;
  const showResult = repaired
    ? cue(k, 5, 'one half', 0, 'Its self-score') === 1
    : edited
      ? cue(k, 4, 'quarters', 0, 'The score jumps') === 1
      : b > 2 || (b === 2 && k.elapsed >= k.speechDuration);
  [0, 1].forEach((p) => {
    const x = 50 + p * 460;
    label(g, 'Prompt ' + p, x, 139);
    table(g, {
      x,
      y: 188,
      w: 388,
      names: ['token 0', 'token 1'],
      cols: ['feature 0', 'feature 1'],
      heads: 103,
      rh: 48,
      rows: data.h[p],
      active: (i, j) => (p === 0 ? i === 1 : !repaired && showColumn && j === 0),
      tint: () => (p === 0 ? C.pale : C.warm),
    });
  });
  if (b >= 6) {
    data.grids.forEach((grid, p) => {
      const x = 50 + p * 460;
      table(g, {
        x,
        y: 333,
        w: 388,
        names: ['token 0', 'token 1'],
        cols: ['score with 0', 'score with 1'],
        rows: grid,
        heads: 103,
        rh: 43,
        active: (i, j) => (p === 1 ? i === 0 && j === 0 : i === 1 && j === 1),
        tint: () => (p ? C.warm : C.pale),
      });
    });
  } else {
    if (showExpected)
      mono(g, 'Expected self-score   ' + fmt(expected), repaired ? 510 : 50, 315, 21, C.teal);
    if (showResult)
      mono(
        g,
        'diagonal   ' + vec([data.grids[0][0][0], data.grids[0][1][1]]),
        480,
        422,
        18,
        C.teal,
        'center',
      );
    if (showColumn) {
      const x = repaired ? 245 : 706;
      line(g, x, 285, x, 298, repaired ? C.teal : C.brass, 2);
      text(
        g,
        repaired ? 'Both operands from prompt 0' : 'Right operand from prompt 1',
        x,
        315,
        17,
        repaired ? C.teal : C.brass,
        'center',
      );
      const terms = AXIS_TRAP[0][1].map((v, i) => fmt(v) + ' × ' + fmt(data.right[i]));
      mono(
        g,
        terms.join('  +  ') + '  =  ' + (showResult ? fmt(data.grids[0][1][1]) : '?'),
        480,
        388,
        32,
        repaired ? C.teal : C.ink,
        'center',
      );
    } else mono(g, 'prompt 0   /   token 1 × token 1', 480, 381, 26, C.teal, 'center');
  }
  if (b === 0) foot(g, 'Predict the self-score of the blue row.');
  else if (repaired)
    mono(g, 'H @ H.swapaxes(-1, -2)  ·  Pair within each prompt', 50, 116, 18, C.teal);
  else {
    text(g, 'H.T reverses all axes on the right.', 49, 422, 18, C.ink);
    text(g, 'Shape still (2, 2, 2)', 910, 422, 18, C.ink, 'right');
  }
}
