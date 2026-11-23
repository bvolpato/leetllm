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
  dot,
  arrow,
  table,
  label,
  badge,
  foot,
  unit,
} from './drawing.mjs';
import {
  H,
  P,
  WORDS,
  projected,
  project,
  pool,
  editFirst,
  transpose,
  linearBias,
  add,
  FRESH_H,
  inspect,
  cases,
} from './model.mjs';

const mask3 = [true, true, true, false],
  mask4 = [true, true, true, true];
function fractions(n) {
  const f = [
    [2 / 3, '2/3'],
    [5 / 6, '5/6'],
    [0.5, '1/2'],
    [0.75, '3/4'],
    [0.625, '5/8'],
    [0.25, '1/4'],
  ];
  return f.find(([v]) => Math.abs(v - n) < 1e-10)?.[1] || fmt(n);
}
// Equal cuts divide the whole strip. The colored first share is one pooled coordinate.
function dividingRule(
  g,
  x,
  y,
  w,
  values,
  count,
  max,
  { share = true, old = null, title = 'Sum divided into equal shares' } = {},
) {
  label(g, title, x, y);
  values.forEach((v, j) => {
    const yy = y + 52 + j * 65,
      start = x + 37,
      span = (w * v) / max;
    mono(g, 'f' + j, x, yy + 2, 15, C.muted);
    rect(g, start, yy - 11, w, 24, '#e0e2d2', null, 2);
    if (span > 0) {
      rect(g, start, yy - 11, span, 24, '#bdc7b4', C.muted, 2);
      if (share && count > 0) {
        rect(g, start, yy - 11, span / count, 24, colors[j], null, 1);
        for (let i = 1; i < count; i++)
          line(
            g,
            start + (i * span) / count,
            yy - 13,
            start + (i * span) / count,
            yy + 15,
            C.ink,
            1.5,
          );
      }
    }
    if (old) {
      const mark = start + (w * old[j]) / max;
      line(g, mark, yy - 18, mark, yy + 18, C.ink, 2);
    }
    mono(g, share ? (count ? fractions(v / count) : 'n/a') : fmt(v), x + w + 53, yy + 1, 23, C.ink);
  });
}
function maskTab(g, x, y, flag) {
  rect(g, x, y, 20, 20, flag ? C.teal : C.light, C.teal, 2);
  if (flag) {
    line(g, x + 4, y + 10, x + 8, y + 14, C.white, 2.2);
    line(g, x + 8, y + 14, x + 16, y + 5, C.white, 2.2);
  }
}
function slots(
  g,
  { x = 44, y = 193, w = 357, rows, names, mask, selected = -1, cols, showMask = true },
) {
  const offset = showMask ? 34 : 0;
  if (showMask) text(g, 'use', x + 10, y - 17, 14, C.muted, 'center');
  table(g, {
    x: x + offset,
    y,
    w: w - offset,
    rows,
    names,
    cols,
    heads: 80,
    rh: 45,
    active: (i) => i === selected,
    tint: () => C.warm,
    font: 20,
  });
  if (showMask) rows.forEach((_, i) => maskTab(g, x, y + i * 45 + 12, mask[i]));
}
function captions(k, beat, ...phrases) {
  if (k.beat.beatIndex === beat)
    for (const phrase of phrases) k.reveal(phrase, 0);
}

export function pooling(g, k) {
  captions(k, 0, 'In NumPy', 'removes the token positions');
  captions(k, 2, 'the model needs', 'or interactions');
  const b = k.beat.beatIndex;
  const reordered = cue(k, 2, 'Password now comes first', 0) === 1;
  const seq = reordered ? [2, 0, 1] : [0, 1, 2],
    rows = seq.map((i) => projected[0][i]);
  const included = ['Projected reset is', 'My is', 'Password is'].map((s) => cue(k, 1, s) > 0);
  const current = pool(rows, included),
    divided = cue(k, 1, 'One share measures', 0.4) > 0;
  label(g, 'Projected token rows', 46, 148);
  slots(g, {
    rows,
    names: seq.map((i) => WORDS[0][i]),
    mask: included,
    cols: ['x', 'y', 'average'],
    showMask: b > 0,
  });
  dividingRule(g, 478, 148, 316, current.sum, current.count, 1.5, {
    share: divided,
    title: divided ? 'One share of the sum' : 'Sum of selected rows',
  });
  if (divided) mono(g, 'mean(axis=1)   ' + vec(current.mean), 481, 406, 19, C.teal);
  if (b < 2) {
    text(g, 'Sum token rows feature by feature.', 46, 387, 19, C.ink);
    text(g, 'Each prompt keeps its own summary.', 46, 412, 19, C.ink);
  } else foot(g, reordered
    ? 'The order changed. Each sum and its three equal shares held steady.'
    : 'Watch the row names as you compare the three shares.');
}

export function padding(g, k) {
  captions(k, 1, 'even though those positions');
  captions(k, 2, 'and divide by the count');
  const b = k.beat.beatIndex;
  const padded = cue(k, 1, 'Append two zero rows') > 0,
    masked = cue(k, 2, 'Select with where') > 0;
  const restored = cue(k, 4, "Once you've excluded padding", 0) === 1;
  const shuffle = cue(k, 4, 'shuffling the same real vectors', 0.7);
  const swapped = shuffle === 1;
  captions(k, 4, 'still gives the same mean');
  const empty = !restored && cue(k, 4, 'Clear every bit') > 0;
  const real = [[1, 0], [0, 1]];
  const selected = swapped ? real.toReversed() : real;
  const rows = padded ? [...selected, [0, 0], [0, 0]] : selected;
  const valid = rows.map((_, i) => !empty && (!masked || i < 2));
  const result = pool(rows, valid);
  const showCount = !padded || cue(k, 1, 'The sum never moved', 0) === 1;
  const quarters = cue(k, 1, 'An ordinary mean counted', 0) === 1;
  const share = !empty && (!padded || (masked ? b >= 3 : quarters));
  label(
    g,
    masked ? 'Boolean mask  /  select whole rows' : 'Positions included in the ordinary mean',
    44,
    147,
  );
  slots(g, {
    rows,
    names: [swapped ? 'token 1' : 'token 0', swapped ? 'token 0' : 'token 1', 'padding', 'padding'],
    mask: valid,
    cols: ['x', 'y'],
  });
  if (shuffle > 0) {
    const top = 215,
      bottom = 260,
      travel = (bottom - top) * shuffle;
    arrow(g, 421, top, 421, top + travel, C.blue, 2.5);
    arrow(g, 450, bottom, 450, bottom - travel, C.brass, 2.5);
  }
  dividingRule(g, 476, 151, 322, result.sum, result.count, 1, {
    share,
    old: pool(real, [true, true]).mean,
    title: share ? 'Equal shares of the coordinate sums' : 'Coordinate sums  /  marks at the original mean',
  });
  if (empty) badge(g, 'count = 0    stop before division', 478, 354, C.red);
  else mono(g, 'sum ' + vec(result.sum) + (showCount ? '   ÷   ' + result.count : ''), 476, 361, 24, C.teal);
  foot(
    g,
    empty
      ? 'Require a matching boolean mask and a positive count of real tokens.'
      : restored
        ? swapped
          ? 'Only the token order changed. The mean is still [1/2, 1/2].'
          : 'Keep the two real tokens selected before swapping them.'
        : !padded
        ? 'Two more positions will hold zeros. What will the ordinary mean do?'
        : masked
          ? 'mask[:, :, None] applies each token bit across the feature axis.'
          : quarters
            ? 'Each colored quarter reaches halfway to the original mean.'
            : showCount
              ? 'Four positions count toward the mean. Each coordinate sum is still one.'
              : 'The two zero rows leave both coordinate sums at one.',
  );
}

export function guards(g, k) {
  const b = k.beat.beatIndex;
  const stages = ['rectangular numbers', 'axis count', 'input width', 'nonempty', 'project'];
  const i = cue(k, 1, 'Now try the valid batch')
    ? 4
    : cue(k, 1, 'Check for an empty axis')
      ? 3
      : b >= 1
        ? 2
        : cue(k, 0, 'This next input lost')
          ? 1
          : 0;
  captions(k, 2, 'and verify', 'in the latency example');
  const local = cue(k, 2, 'change one input token', 0.65, 'One way is to change') > 0;
  const input = i === 4 && local ? [editFirst(H[0], 2, 1), H[1]] : cases[i].input;
  const map = cases[i].map,
    verdict = inspect(input, map);
  label(g, 'Input at the gate', 52, 142);
  const v = [
    ['token 0    [1, 0]', 'token 1    [0.5,  ?]'],
    ['hidden    (3, 2)', 'map       (2, 3)'],
    ['hidden    (1, 1, 3)', 'map       (2, 3)'],
    ['hidden    (1, 1, 2)', 'map       (2, 0)'],
    ['hidden    (2, 3, 2)', 'map       (2, 3)'],
  ][i];
  v.forEach((s, j) => mono(g, s, 52, 207 + j * 49, 23, j ? C.brass : C.blue));
  if (i === 4) {
    const selected = input[0][2];
    mono(g, vec(selected) + ' → ' + vec(project(selected)), 51, 350, 20, C.teal);
  }
  label(g, 'Projection checks', 506, 141);
  const stop = stages.indexOf(verdict);
  stages.forEach((s, j) => {
    const yy = 182 + j * 48,
      ok = j < stop || stop === 4;
    if (j < 4) line(g, 528, yy, 528, yy + 48, C.grid, 3);
    dot(g, 528, yy, 10, ok ? C.teal : j === stop ? C.red : C.paper, C.muted);
    if (ok) {
      line(g, 523, yy, 527, yy + 4, C.white, 1.6);
      line(g, 527, yy + 4, 534, yy - 5, C.white, 1.6);
    }
    text(g, s, 550, yy, 20, j <= stop ? C.ink : C.muted);
    if (j === stop && !ok) badge(g, 'stop', 804, yy - 17, C.red);
  });
  if (i === 2) {
    text(g, 'Last hidden width must match', 52, 323, 20, C.ink);
    text(g, 'the first projection width.', 52, 349, 20, C.ink);
  } else foot(
    g,
    [
      'The second token is missing a coordinate.',
      'Hidden states require batch, token and feature axes.',
      '',
      'This exercise requires at least one output feature.',
      local
        ? 'Change password under a fixed map. Its neighbors keep their saved rows.'
        : 'All guards pass. Multiply once per token.',
    ][i],
  );
}

export function linear(g, k) {
  captions(k, 2, 'the third output');
  const b = k.beat.beatIndex,
    stored = cue(k, 0, 'stores the transposed coefficients', 0.65, 'The library stores') > 0;
  const biased = cue(k, 1, 'bias has three entries') > 0 && b < 2;
  const p = stored ? transpose(P) : P;
  label(g, stored ? 'Linear.weight  /  (output, input)' : 'Our map P  /  (input, output)', 45, 148);
  table(g, {
    x: 45,
    y: 200,
    w: 362,
    rows: p,
    names: p.map((_, i) => (stored ? 'out ' : 'in ') + i),
    cols: stored ? ['in 0', 'in 1'] : ['out 0', 'out 1', 'out 2'],
    heads: 79,
    rh: 47,
    active: (i, j) => (stored ? i === 2 : j === 2),
    tint: () => C.warm,
  });
  label(g, b === 0 ? 'Multiply with weight.T' : 'Prompt 0  /  projected tokens', 483, 148);
  if (b === 0) {
    const actual = stored ? transpose(p) : P;
    table(g, {
      x: 480,
      y: 200,
      w: 409,
      rows: actual,
      names: ['x', 'y'],
      cols: ['out 0', 'out 1', 'out 2'],
      heads: 58,
      rh: 47,
      active: (i, j) => j === 2,
      tint: () => C.warm,
    });
    mono(g, 'input @ weight.T + bias', 478, 369, 23, C.teal);
  } else {
    const bias = biased ? linearBias : [0, 0, 0];
    table(g, {
      x: 477,
      y: 200,
      w: 425,
      rows: projected[0].map((v) => add(v, bias)),
      names: WORDS[0],
      cols: ['out 0', 'out 1', 'out 2'],
      heads: 91,
      rh: 48,
      active: (i, j) => biased || j === 2,
    });
    mono(g, 'bias   ' + vec(bias), 481, 385, 23, C.teal);
  }
  text(
    g,
    b === 2
      ? 'With bias off, out 2 is half of (out 0 + out 1).'
      : 'Linear(2, 3) keeps the leading axes and replaces the last width.',
    480, 427, 20, C.ink, 'center',
  );
}
export function finalPractice(g, k) {
  captions(k, 1, 'contributed a whole copy');
  captions(k, 6, 'and which tokens count toward a summary');
  const b = k.beat.beatIndex,
    set = cue(k, 0, 'Increase only the third real token') > 0;
  const h = editFirst(FRESH_H, 2, Number(set)),
    shapeKnown = cue(k, 1, 'four by three', 0, 'The stored output shape') === 1,
    answer = cue(k, 1, 'one point five', 0, 'The third real token') === 1;
  const rows = (answer ? h : FRESH_H).map((v) => project(v));
  const fourth = cue(k, 5, 'Count the fourth token') > 0,
    mask = fourth ? mask4 : mask3;
  const vals = pool(rows, mask),
    old = pool(rows, mask3),
    showFirst = cue(k, 3, 'five sixths', 0, 'The summary is') === 1;
  const showLast = cue(k, 5, 'five eighths', 0, 'The mean is now') === 1;
  if (b < 2) {
    label(g, 'One prompt  /  input pairs', 43, 143);
    slots(g, {
      x: 43,
      w: 365,
      rows: h,
      names: ['slot 0', 'slot 1', 'slot 2', 'pad'],
      mask: mask3,
      cols: ['x', 'y'],
      showMask: false,
      selected: set ? 2 : -1,
    });
    label(g, answer ? 'Updated projection' : 'Saved projection', 472, 143);
    slots(g, {
      x: 472,
      w: 435,
      rows,
      names: ['slot 0', 'slot 1', 'slot 2', 'pad'],
      mask: mask3,
      cols: ['x', 'y', 'average'],
      showMask: false,
      selected: answer ? 2 : -1,
    });
    if (shapeKnown) {
      const shape = 'shape (1, 4, 3)';
      mono(g, answer ? shape + '     change ' + vec(P[0]) : shape, 480, 410, 24, C.teal, 'center');
    }
    foot(
      g,
      answer
        ? 'One extra unit of x adds the first matrix row.'
        : 'Only one input changes. Which saved outputs need new values?',
    );
  } else {
    label(g, 'Saved projections  /  counted slots', 43, 144);
    slots(g, {
      x: 43,
      w: 385,
      rows,
      names: ['slot 0', 'slot 1', 'slot 2', b >= 4 ? 'zero token' : 'pad'],
      mask,
      cols: ['x', 'y', 'average'],
    });
    const previous = b >= 4 && !fourth;
    const countKnown = cue(k, 3, 'three valid tokens', 0, 'Divide by the three') === 1;
    if (previous) text(g, 'Previous selection  /  count ' + vals.count, 84, 399, 17, C.muted);
    else mono(g, 'count   ' + (countKnown ? vals.count : '?'), 83, 398, 22, C.teal);
    const share = showFirst && (!fourth || showLast);
    dividingRule(g, 476, 144, 308, vals.sum, vals.count, 3, {
      share,
      old: fourth ? old.mean : null,
      title: previous
        ? 'Previous three-token mean'
        : share
          ? (fourth ? 'One quarter of each sum' : 'One third of each sum')
          : 'Coordinate totals',
    });
    if (share)
      mono(g, 'mean    [' + vals.mean.map(fractions).join(', ') + ']', 482, 397, 23, C.teal);
    let caption = 'Which count should divide these coordinate totals?';
    if (previous) {
      text(g, 'Can the previous mean be reused?', 482, 427, 19, C.ink);
      return;
    }
    else if (share) caption = fourth
      ? 'Each colored quarter ends before the old one-third mark.'
      : 'Each colored length is one third of its coordinate sum.';
    else if (fourth) caption = 'The bars show the totals. The black marks show the previous three-token mean.';
    else if (countKnown) caption = 'The bars show the totals for the checked rows.';
    foot(g, caption);
  }
}
