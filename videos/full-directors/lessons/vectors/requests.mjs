import {
  C,
  colors,
  vec,
  fmt,
  cue,
  text,
  mono,
  rect,
  dot,
  line,
  arrow,
  plate,
  table,
  badge,
  label,
  ruler,
  foot,
  unit,
  mix,
} from './drawing.mjs';
import {
  REQUEST_X,
  REQUEST_W,
  latency,
  update,
  scale,
  project,
  featureBias,
  rowBias,
  offset,
  transpose,
} from './model.mjs';

const names = ['A', 'B', 'C'],
  fields = ['prompt blocks', 'queue seconds'],
  cols = ['seconds', 'priority'];
const rates = transpose(REQUEST_W)[0];
function ticket(g, x, y, w, h, id, values, fieldNames = fields) {
  rect(g, x + 2, y + 4, w, h, '#cecbb6', null, 4);
  rect(g, x, y, w, h, C.light, C.muted, 4);
  rect(g, x, y, 8, h, C.teal);
  for (let yy = y + 10; yy < y + h; yy += 12) dot(g, x + 19, yy, 2.2, C.grid);
  text(g, 'Request ' + id, x + 34, y + 25, 23, C.ink, 'left', 'Serif', 600);
  line(g, x + 32, y + 45, x + w - 12, y + 45, C.grid, 1, [3, 3]);
  values.forEach((v, i) => {
    const xx = x + 34 + ((w - 40) / 2) * i;
    mono(g, fmt(v), xx, y + 78, 32, colors[i]);
    text(g, fieldNames[i], xx, y + 107, 15, C.muted);
  });
}
export function gradient(g, k) {
  const b = k.beat.beatIndex,
    w = [2, 2],
    slope = [4, 2],
    rate = 0.1,
    target = update(w, slope, rate);
  if (b === 0) {
    ticket(g, 52, 159, 360, 160, 'B', REQUEST_X[1]);
    label(g, 'Coefficient units', 499, 165);
    text(g, 'seconds / prompt block', 499, 222, 24, C.blue);
    text(g, 'seconds / queue second', 499, 281, 24, C.brass);
    foot(g, 'The first input counts hundreds of tokens. The second measures time.');
    return;
  }
  const scaled = cue(k, 1, 'That gives changes');
  const firstMove = cue(k, 2, 'one point six', 0.35, 'The updated weights');
  const secondMove = cue(k, 2, 'one point eight', 0.35, false);
  const settings = [mix(w[0], target[0], firstMove), mix(w[1], target[1], secondMove)];
  label(g, 'Weight settings', 56, 147);
  label(g, 'Loss slope', 583, 147);
  label(g, 'Step size × slope', 733, 147);
  settings.forEach((value, i) => {
    const y = 211 + i * 96,
      x = 169;
    text(g, i ? 'queue' : 'prompt', 56, y, 21, colors[i]);
    ruler(g, x, y + 12, 326, 2.5, { step: 0.25, labelEvery: 2 });
    const px = x + (326 * value) / 2.5;
    rect(g, px - 9, y - 13, 18, 30, colors[i], null, 3);
    dot(g, px, y + 2, 3, C.light);
    mono(g, fmt(slope[i]), 617, y, 29, colors[i]);
    mono(
      g,
      scaled ? fmt(rate) + ' × ' + fmt(slope[i]) + ' = ' + fmt(rate * slope[i]) : '·',
      741,
      y,
      19,
      colors[i],
    );
  });
  const stops = [firstMove, secondMove].map((move, i) => move === 1 ? fmt(target[i]) : '·');
  const readout = 'initial w   ' + vec(w) + (b >= 2 ? '     updated w   ' + vec(stops) : '');
  mono(g, readout, 56, 392, 25, C.teal);
  if (b < 3) foot(g, 'Subtract each step from its matching weight.');
  else text(g, 'Features, weights and slopes each have shape (2,). A scalar array has shape ().',
    56, 428, 20, C.ink);
}
export function requestDot(g, k) {
  const b = k.beat.beatIndex,
    swapped =
      cue(k, 2, 'Swap only the feature positions') > 0 &&
      cue(k, 3, 'Restoring the named order') === 0;
  const row = swapped ? [...REQUEST_X[1]].reverse() : REQUEST_X[1],
    parts = row.map((v, i) => v * rates[i]),
    total = project(row, REQUEST_W)[0];
  const amounts =
    b < 2
      ? [
          cue(k, 1, 'contributes four seconds', 0.65, 'For the prompt'),
          cue(k, 1, 'contributes one', 0.65, 'For the queue'),
        ]
      : swapped
        ? [0, 0]
        : [1, 1];
  const wrong = swapped && cue(k, 3, 'four seconds', 0, 'It reports four seconds') === 1;
  if (wrong) amounts.fill(1);
  ticket(g, 46, 148, 364, 141, 'B', row, swapped ? [...fields].reverse() : fields);
  const charge = ['s / prompt block', 's / queue second'];
  label(g, 'Multipliers stay in position', 484, 152);
  charge.forEach((s, i) => {
    const y = 203 + i * 52;
    mono(g, 'slot ' + i, 485, y, 16, C.muted);
    text(g, '× ' + fmt(rates[i]) + ' ' + s, 575, y, 21, colors[i]);
  });
  const start = 94,
    width = 669,
    max = 8;
  ruler(g, start, 388, width, max, { step: 0.5, labelEvery: 2 });
  let x = start;
  parts.forEach((v, i) => {
    const w = (v * amounts[i] * width) / max;
    rect(g, x, 350, w, 33, colors[i], null, 2);
    if (w > 38) mono(g, fmt(v) + ' s', x + w / 2, 367, 18, C.white, 'center');
    x += w;
  });
  if (amounts.every((v) => v === 1))
    mono(g, fmt(total) + ' s', 802, 368, 36, swapped ? C.red : C.teal);
  foot(
    g,
    swapped && !wrong
      ? 'The client reversed the fields. What time will these multipliers produce?'
      : wrong
        ? 'The queue value is being charged at the prompt rate.'
        : 'B sent 200 tokens and waited one second.',
  );
}
function requestId(g, i, x, y, selected) {
  rect(g, x - 15, y - 15, 30, 30, selected ? C.teal : C.light, C.teal, 4);
  mono(g, names[i], x, y, 23, selected ? C.white : C.ink, 'center');
}
export function batch(g, k) {
  const calls = ['A gives two seconds', 'B gives five', 'C gives seven'];
  const results = calls.map((s) => cue(k, 1, s, 0.4));
  const countKnown = cue(k, 1, 'The result has three', 0) === 1;
  const current = countKnown ? -1 : results.findLastIndex((p) => p > 0);
  const stacked = cue(k, 2, 'In a drawing', 1.7);
  const column = cue(k, 2, 'Give it a second axis', 0) === 1;
  const reshape = cue(k, 2, 'Give it a second axis', 4.25);
  const travel = unit((reshape - 0.5) * 2);
  // Separate the rows before aligning their columns so every value stays visible.
  const spreadRows = unit(travel * 2);
  const alignColumn = unit(travel * 2 - 1);
  const shapeKnown = cue(k, 2, 'three by one', 0, 'and the output keeps that axis') === 1;
  label(g, 'Requests  /  (3, 2)', 47, 151);
  table(g, {
    x: 47, y: 199, w: 333, rows: REQUEST_X, cols: fields, heads: 54, rh: 57,
    active: (i) => i === current,
  });
  names.forEach((_, i) => requestId(g, i, 74, 227 + 57 * i, i === current));
  label(g, column ? 'Weights  /  (2, 1)' : 'Weights  /  (2,)', 418, 151);
  if (column)
    table(g, {
      x: 428,
      y: 201,
      w: 125,
      rows: rates.map((x) => [x]),
      names: ['prompt', 'queue'],
      heads: 68,
      rh: 44,
    });
  else {
    // A single pair of brackets still encloses the same two entries as they move.
    const x = 487, y = 243;
    const halfWidth = mix(42, 25, stacked);
    const halfHeight = mix(20, 47, stacked);
    for (const side of [-1, 1]) {
      const edge = x + side * halfWidth;
      line(g, edge, y - halfHeight, edge, y + halfHeight, C.teal, 3);
      for (const end of [-1, 1])
        line(g, edge, y + end * halfHeight, edge - side * 8, y + end * halfHeight, C.teal, 3);
    }
    rates.forEach((v, i) => mono(g, fmt(v),
      x + (2 * i - 1) * 18 * (1 - stacked), y + (2 * i - 1) * 22 * stacked,
      26, C.teal, 'center'));
  }
  label(
    g,
    shapeKnown ? 'Predictions  /  (3, 1)' : countKnown && !column ? 'Predictions  /  (3,)' : 'Predictions',
    636,
    151,
  );
  if (results[0] === 0) {
    rect(g, 637, 222, 280, 67, C.light, C.grid, 3);
    text(g, 'How many values?', 777, 255, 22, C.ink, 'center');
  } else latency.forEach(([seconds], i) => {
    if (results[i] === 0) return;
    const x = mix(638 + i * 94, 735, alignColumn);
    const y = mix(255, 227 + 57 * i, spreadRows);
    const selected = i === current;
    rect(g, x, y - 24, 89, 48, selected ? C.pale : C.light, C.grid, 3);
    requestId(g, i, x + 22, y, selected);
    mono(g, results[i] === 1 ? fmt(seconds) : '·', x + 63, y, 28, C.teal, 'center');
  });
  if (shapeKnown) text(g, 'seconds', 798, 185, 17, C.muted, 'center');
  if (current >= 0) {
    const products = REQUEST_X[current].map((v, j) => fmt(v) + ' × ' + fmt(rates[j]));
    const answer = results[current] === 1 ? fmt(latency[current][0]) + ' s' : '·';
    requestId(g, current, 301, 408, true);
    mono(g, products.join(' + ') + ' = ' + answer, 333, 408, 25, C.ink);
  }
  arrow(g, 573, 255, 619, 255, C.teal);
  foot(
    g,
    results[0] === 0
      ? 'How many predictions survive the sum over features?'
      : shapeKnown
        ? 'An explicit weight column gives the result a trailing axis of length one.'
        : column
          ? 'The weights now form one column.'
          : stacked > 0
            ? 'The two weights still share one axis.'
            : 'One dot product returns one time estimate for its request.',
  );
}
export function multiple(g, k) {
  const b = k.beat.beatIndex,
    second = cue(k, 1, 'select the next column', 0.65, 'while we select the next column') > 0;
  const doneTime = cue(k, 1, 'Its time column gives five seconds', 1.05) === 1,
    donePriority = cue(k, 1, "Together that's one point nine", 0.95) === 1;
  const complete = cue(k, 2, 'Read the pairs', 1.1);
  label(g, 'Requests', 37, 143);
  label(g, 'Coefficients', 339, 143);
  label(g, 'Read across one request', 649, 143);
  table(g, {
    x: 37,
    y: 195,
    w: 247,
    rows: REQUEST_X,
    names,
    cols: fields,
    heads: 43,
    rh: 49,
    active: (i) => b > 0 && i === 1,
  });
  table(g, {
    x: 334,
    y: 195,
    w: 258,
    rows: REQUEST_W,
    names: ['prompt', 'queue'],
    cols,
    heads: 75,
    rh: 49,
    active: (i, j) => b > 0 && j === Number(second),
    tint: () => C.warm,
  });
  table(g, {
    x: 644,
    y: 195,
    w: 278,
    rows: latency.map((r, i) =>
      r.map((v, j) =>
        i === 1 ? ((j ? donePriority : doneTime) ? v : null) : complete === 1 ? v : null,
      ),
    ),
    names,
    cols,
    heads: 42,
    rh: 49,
    active: (i, j) => i === 1 && j === Number(second),
    tint: () => C.pale,
  });
  mono(g, '@', 308, 246, 25, C.muted, 'center');
  mono(g, '=', 620, 246, 26, C.muted, 'center');
  if (b > 0) {
    const j = Number(second),
      pairs = REQUEST_X[1].map((v, i) => fmt(v) + ' × ' + fmt(REQUEST_W[i][j]));
    mono(
      g,
      'B   ' +
        pairs.join(' + ') +
        ((j ? donePriority : doneTime) ? ' = ' + fmt(latency[1][j]) : ''),
      480,
      393,
      25,
      C.teal,
      'center',
    );
  }
  foot(g, 'One row fixes the request. One column fixes the quantity we predict.');
}
export function shape(g, k) {
  const b = k.beat.beatIndex,
    rank = cue(k, 3, 'copy A', 0.65, 'Now copy A'),
    fixed = cue(k, 2, 'Put the two-feature matrix back') > 0;
  const copied = REQUEST_X.map(() => REQUEST_X[0]);
  label(g, rank ? 'Three copies of request A' : 'Requests  /  (3, 2)', 51, 150);
  table(g, {
    x: 51,
    y: 201,
    w: 373,
    rows: rank ? copied : REQUEST_X,
    names,
    cols: fields,
    heads: 66,
    rh: 49,
    active: (i) => rank > 0 || i === 1,
  });
  if (rank > 0) {
    label(g, 'Row directions', 512, 154);
    const x = 582,
      y = 260;
    for (let i = 0; i < 3; i++) arrow(g, x, y + i * 12, x + 194, y + i * 12, colors[i], 3);
    mono(g, 'ndim = ' + 2, 517, 353, 22, C.teal);
    if (cue(k, 3, 'rank of one', 0.65, 'That gives this matrix') === 1) mono(g, 'rank = ' + 1, 718, 353, 22, C.teal);
    foot(
      g,
      b === 4
        ? 'Three parallel copies supply one independent direction.'
        : 'Storage order leaves the two axes and the row directions intact.',
    );
    return 'How many independent directions do these rows span?';
  } else {
    const bad = [...REQUEST_W, [1, 0]],
      rows = fixed ? REQUEST_W : bad;
    label(g, 'Weight rows  /  (' + rows.length + ', 2)', 524, 150);
    table(g, {
      x: 524,
      y: 201,
      w: 377,
      rows,
      names: ['prompt', 'queue', 'load'],
      cols,
      heads: 98,
      rh: 49,
      active: (i) => !fixed && i === 2,
      tint: () => C.rose,
    });
    if (!fixed && b > 0) {
      line(g, 467, 323, 519, 323, C.red, 2, [5, 3]);
      text(g, '?', 466, 323, 23, C.red, 'right');
    }
    mono(
      g,
      fixed ? 'B   ' + vec(REQUEST_X[1]) + '  →  ' + fmt(latency[1][0]) + ' s' : '(3, 2) @ (3, 2)',
      480,
      395,
      25,
      fixed ? C.teal : C.ink,
      'center',
    );
    foot(
      g,
      fixed
        ? 'Two measured features now match two weight rows.'
        : 'Which input could supply a load reading?',
    );
  }
}
export function broadcast(g, k) {
  const b = k.beat.beatIndex;
  const focusTime = cue(k, 4, 'Both priorities', 0) === 1;
  const colsMoved = [cue(k, 0, 'Send the first offset', 0.85), cue(k, 0, 'Send the second', 0.85)];
  const rowsMoved = ['A gets', 'B gets', 'C gets'].map((s) => cue(k, 2, s, 0.65));
  for (let side = 0; side < 2; side++) {
    const x = 42 + 468 * side,
      xx = x + (side ? 37 : 0),
      w = side ? 336 : 373;
    label(g, side ? 'Offset per request  /  (3, 1)' : 'Offset per output  /  (2,)', x, 139);
    const vals = latency.map((r, i) =>
      r.map((v, j) =>
        (side ? rowsMoved[i] : colsMoved[j]) === 1 ? offset(i, j, Boolean(side)) : v,
      ),
    );
    table(g, {
      x: xx,
      y: 234,
      w,
      rows: vals,
      names,
      cols,
      heads: 50,
      rh: 48,
      active: (i, j) => (focusTime ? i === 1 && j === 0 : side ? rowsMoved[i] > 0 : colsMoved[j] > 0),
      tint: () => (side ? C.warm : C.pale),
    });
    if (side && b >= 2) {
      rowBias.forEach((v, i) => {
        const yy = 257 + 48 * i;
        mono(g, fmt(v), x + 28, yy, 15, C.brass, 'right');
        const progress = rowsMoved[i];
        if (progress > 0) {
          const start = xx + 50,
            end = start + (w - 54) * progress;
          arrow(g, start, yy + 16, end, yy + 16, C.brass, 2);
        }
      });
    }
    if (!side) {
      featureBias.forEach((v, j) => {
        const px = x + 50 + ((w - 50) * (j + 0.5)) / 2;
        mono(g, (v > 0 ? '+' : '') + fmt(v), px, 174, 18, C.teal, 'center');
        arrow(g, px, 188, px, 201, C.teal, 2);
        const edge = x + 50 + ((w - 50) * j) / 2 + 5;
        if (colsMoved[j] > 0) arrow(g, edge, 234, edge, 234 + 139 * colsMoved[j], C.teal, 2.2);
      });
    }
  }
  if (focusTime)
    mono(
      g,
      'B time   ' + fmt(offset(1, 0, false)) + ' s     /     ' + fmt(offset(1, 0, true)) + ' s',
      480,
      408,
      24,
      C.ink,
      'center',
    );
  if (b >= 5)
    text(g, 'Align trailing axes. A size of one can repeat along its matching axis.',
      480, 433, 20, C.ink, 'center');
  else text(g, 'Both outputs have shape (3, 2). Compare the same cell in each.',
    480, 433, 20, C.ink, 'center');
}
