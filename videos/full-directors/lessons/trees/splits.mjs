import {
  C,
  background,
  txt,
  math,
  sub,
  box,
  jewel,
  glass,
  dot,
  line,
  path,
  strip,
  stripX,
  legend,
  cue,
  mix,
  clamp,
  neat,
} from './glass.mjs';
import {
  requests,
  rows,
  ordered,
  stump,
  tree,
  panes,
  pairOrder,
  gini,
  entropy,
  options,
  gain,
  gaps,
  best,
  mean,
  targets,
  squareError,
  validationRows,
  policyCosts,
  stumpBill,
  bill,
} from './model.mjs';

export function opening(g, k) {
  const b = k.beat.beatIndex,
    move = cue(k, 2, 'Slide the seam', 1.8),
    cut = mix(stump.cut, tree.left.cut, move);
  background(
    g,
    'Access requests',
    b === 2 ? 'Who joins the review queue?' : 'Which diamond misses its reviewer?',
  );
  const swept = ordered.filter((q) => q.v > cut && q.v <= stump.cut);
  const planted = cue(k, 0, 'Each jewel is an access request', 1.7);
  const landing = requests.map((q) => ({
    ...q,
    dy: -34 * (1 - clamp(planted * 1.5 - q.v / 10)) ** 2,
  }));
  const lit =
    b === 1 && cue(k, 1, 'Its ambiguity score', 0) === 1
      ? ['R3']
      : move === 1
        ? swept.map((q) => q.id)
        : [];
  strip(g, landing, [{ end: cut, review: false }, { review: true }], {
    focus: lit,
    top: 342,
    h: 316,
  });
  if (b === 1 && lit.length) {
    math(g, 'R3', 120, 816, 47, C.amber);
    txt(g, 'Which circles lie between R3 and the seam?', 264, 816, 42);
  } else if (move === 1) {
    txt(g, 'New in the queue', 120, 819, 38, C.dim);
    swept.forEach((q, i) => {
      const x = 552 + 265 * i;
      jewel(g, x, 819, q.label, 22);
      txt(g, q.id, x + 41, 819, 38);
    });
    txt(g, '2 extra reviews', 1796, 819, 45, C.ink, 'right', 'Serif');
  }
  legend(g, 120, 263);
}

export function geometry(g, k) {
  const b = k.beat.beatIndex;
  background(
    g,
    'Feature space',
    b < 2 ? 'A tree cuts one feature at a time' : 'What happens inside the gap?',
  );
  if (b < 2) {
    const x = (v) => 170 + (v - 0.5) * 205,
      y = (v) => 788 - v * 54;
    for (let i = 0; i <= 9; i++) {
      line(g, 170, y(i), 1093, y(i), C.line, 1);
      if (i % 2 === 0) txt(g, i, 144, y(i), 25, C.dim, 'right', 'Mono');
    }
    for (let i = 1; i <= 5; i++) {
      line(g, x(i), y(0), x(i), y(9), C.line, 1);
      txt(g, i, x(i), 822, 27, C.dim, 'center', 'Mono');
    }
    sub(g, 'Policy support', 165, 255);
    sub(g, 'Ambiguity  →', 1090, 255, 'right');
    const lift = cue(k, 0, 'Lift each request', 1.5),
      diag = cue(k, 0, 'Suppose the true boundary', 0.85);
    if (diag > 0) line(g, x(0.5), y(5.5), x(0.5 + 4.5 * diag), y(5.5 - 4.5 * diag), C.dim, 4);
    const build = cue(k, 1, 'build a staircase', 2) * 5;
    for (let i = 0; i < Math.ceil(build); i++) {
      const a = 0.5 + i * 0.9,
        h = 6 - a,
        p = clamp(build - i);
      path(
        g,
        [
          [x(a), y(h)],
          [x(a + 0.9 * clamp(2 * p)), y(h)],
          [x(a + 0.9 * clamp(2 * p)), y(h - 0.9 * clamp(2 * p - 1))],
        ],
        null,
        C.amber,
        6,
        false,
      );
    }
    requests.forEach((q) => {
      const py = y(mix(0.2, q.support, lift));
      jewel(g, x(q.v), py, q.label, 15);
      txt(g, q.id, x(q.v) + 25, py - 15, 27);
    });
    if (diag) {
      txt(g, 'Diagonal target', 1220, 401, 43, C.dim, 'left', 'Serif');
      math(g, 'a + s = 6', 1220, 468, 38);
    }
    if (build > 0) {
      txt(g, 'Tree approximation', 1220, 619, 43, C.amber, 'left', 'Serif');
      sub(g, 'Each step needs another cut.', 1220, 692);
    }
    return;
  }
  const raw = 2.8,
    squared = raw ** 2,
    toSquared = cue(k, 4, 'left', 0.65),
    showSquaredValue = cue(k, 4, 'seven point eight four', 0) === 1,
    compare = cue(k, 4, 'below the new midpoint', 0) === 1;
  function scale(y, name, lo, hi, value) {
    const x = (v) => 484 + (1156 * (v - lo)) / (hi - lo),
      mid = (hi + lo) / 2;
    txt(g, name, 108, y, 41, C.ink, 'left', 'Serif');
    glass(g, x(lo), y - 17, 578, 34);
    glass(g, x(mid), y - 17, 578, 34, true);
    for (const n of [lo, hi]) {
      dot(g, x(n), y, 14, C.ink);
      math(g, n, x(n), y + 58, 33, C.ink, 'center');
    }
    line(g, x(mid), y - 52, x(mid), y + 28, C.amber, 5);
    txt(g, 'Midpoint ' + mid, x(mid), y + 80, 31, C.amber, 'center');
    return x(value);
  }
  function probe(x, y, label) {
    path(g, [[x - 16, y - 36], [x + 16, y - 36], [x, y - 16]], C.ink);
    if (label) math(g, label, x, y - 76, 42, C.ink, 'center');
  }
  const rawY = 415, squaredY = 699;
  const rawX = scale(rawY, 'Raw value', 1, 4, raw);
  if (cue(k, 2, 'two point eight goes right', 0) === 1) probe(rawX, rawY, neat(raw));
  if (b >= 3) {
    const squaredX = scale(squaredY, 'Squared value', 1, 16, squared);
    if (toSquared > 0)
      probe(mix(rawX, squaredX, toSquared), mix(rawY, squaredY, toSquared),
        showSquaredValue ? neat(squared) : '');
  }
  if (b === 3 || b === 4)
    txt(
      g,
      compare ? '7.84 < 8.5     Left branch' : toSquared > 0 ? 'Left branch' : 'Where does 2.8² land?',
      960,
      581,
      45,
      C.ink,
      'center',
      'Serif',
    );
  if (b === 5) {
    txt(g, 'Rounded to one decimal', 128, 914, 33, C.dim);
    math(g, '1.02,  1.04   →   1.0,  1.0', 576, 914, 38);
    txt(g, 'Gap lost', 1710, 914, 35, C.amber, 'right');
  }
}

export function impurity(g, k) {
  const b = k.beat.beatIndex,
    s = 56,
    ox = 218,
    oy = 350;
  background(
    g,
    'Label pairs',
    b === 4 ? 'How does entropy compare with Gini?' : 'How often do two draws disagree?',
  );
  const showRow = cue(k, 0, 'The first pick chooses a row', 0.5) > 0;
  const showColumn = cue(k, 0, 'The second chooses a column', 0.5) > 0;
  const first = cue(k, 0, 'R1 with R3 counts', 0.5),
    reverse = cue(k, 1, 'R3 with R1 counts too', 0.5);
  const fill = cue(k, 1, 'Thirty-two of the sixty-four', 1.3);
  const n = Number(first === 1) + Number(reverse === 1) + Math.floor(30 * fill);
  const lit = new Set(pairOrder.slice(0, n).map((p) => p.join(',')));
  sub(g, 'Second draw  →', ox, 253);
  for (let i = 0; i < 8; i++) {
    txt(
      g,
      requests[i].id,
      ox + s * (i + 0.5),
      oy - 36,
      26,
      requests[i].label ? C.amber : C.blue,
      'center',
    );
    txt(
      g,
      requests[i].id,
      ox - 31,
      oy + s * (i + 0.5),
      26,
      requests[i].label ? C.amber : C.blue,
      'right',
    );
    for (let j = 0; j < 8; j++) {
      const hit = lit.has(i + ',' + j);
      const guide = b === 0 && ((showRow && i === 0) || (showColumn && j === 2));
      box(
        g,
        ox + j * s + 2,
        oy + i * s + 2,
        s - 4,
        s - 4,
        hit ? '#c0995f' : C.slate,
        hit ? '#f0ca88' : guide ? C.blue : C.line,
        2,
      );
    }
  }
  txt(g, 'First draw ↓', 96, 833, 27, C.dim);
  math(g, n + ' lit / 64', ox + 520, 253, 38, C.ink, 'right');
  if (b < 2) {
    const pair = n < 2 ? [showRow ? 0 : null, showColumn ? 2 : null] : [2, 0];
    txt(
      g,
      n === 32 ? 'Different labels' : 'One ordered pair',
      948,
      370,
      48,
      C.ink,
      'left',
      'Serif',
    );
    pair.forEach((id, i) => {
      const x = 1080 + i * 374;
      if (id === null) dot(g, x, 566, 50, C.slate, C.line, 3);
      else jewel(g, x, 566, rows[id][2], 50);
      txt(g, id === null ? 'Draw ' + (i + 1) : requests[id].id, x, 674, 41, C.ink, 'center');
    });
    txt(g, 'then', 1265, 565, 32, C.dim, 'center');
    if (n === 32) math(g, '32 / 64 = 0.50', 945, 825, 42, C.amber);
    return;
  }
  const x = (p) => 925 + p * 808,
    y = (v) => 760 - v * 380;
  const ent = b === 4,
    active = b === 3 ? 1 - cue(k, 3, 'An even split', 1) : 0;
  const p = 0.5 * (1 - active);
  [0, 0.5, 1].forEach((v) => {
    line(g, x(0), y(v), x(1), y(v), C.line, 2);
    math(g, neat(v), x(0) - 24, y(v), 24, C.dim, 'right');
  });
  const drawCurve = (f, col, pct) => {
    const pts = [];
    for (let i = 0; i <= Math.max(1, Math.round(100 * pct)); i++) {
      let p = i / 100;
      pts.push([x(p), y(f(p))]);
    }
    path(g, pts, null, col, 6, false);
  };
  drawCurve(gini, C.blue, 1);
  if (ent) drawCurve(entropy, C.amber, cue(k, 4, 'entropy in bits', 1.05));
  dot(g, x(p), y(gini(p)), 12, C.blue);
  const peak = ent && cue(k, 4, 'Those different curves', 0) === 1;
  if (peak) dot(g, x(0.5), y(1), 12, C.amber);
  txt(g, 'Gini', x(0.5) + 27, y(0.5) + 27, 29, C.blue);
  if (ent && cue(k, 4, 'entropy in bits', 0.5) === 1)
    txt(g, 'Entropy (bits)', x(0.5) + 30, y(1) - 24, 29, C.amber);
  [0, 0.5, 1].forEach((v) => math(g, neat(v), x(v), 804, 26, C.dim, 'center'));
  sub(g, 'Review share →', x(1), 350, 'right');
  math(g, ent ? 'H = −Σ p log₂ p' : 'G = 1 − p² − (1 − p)²', x(0.5), 305, 36, C.ink, 'center');
}

function durationPlot(g, preds) {
  const x = (i) => 330 + i * 324,
    y = (v) => 810 - v * 7.5;
  [0, 15, 30, 45, 60].forEach((t) => {
    line(g, 196, y(t), 1134, y(t), C.line, 2);
    math(g, t, 174, y(t), 25, C.dim, 'right');
  });
  sub(g, 'Handling minutes', 184, 275);
  targets.forEach((v, i) => {
    const a = x(i);
    line(g, a, y(v), a, y(preds[i]), C.rose, 9);
    line(g, a - 36, y(v), a + 36, y(v), C.amber, 7);
    dot(g, a, y(preds[i]), 13, C.ink);
    txt(g, 'Request ' + (i + 1), a, 867, 31, C.dim, 'center');
  });
}
export function criteria(g, k) {
  const b = k.beat.beatIndex;
  background(
    g,
    b < 4 ? 'Classification splits' : 'Regression splits',
    b < 4 ? 'Which cut leaves purer groups?' : 'Which split saves squared error?',
  );
  if (b < 4) {
    txt(g, '24 training rows   ·   12 reviews, 12 routine', 120, 260, 33, C.dim);
    const gi = cue(k, 2, 'It removes one eighth', 0.65) > 0,
      ent = cue(k, 3, 'by about two thousandths', 0.7) > 0;
    options.forEach((part, i) => {
      const x = 120 + i * 900;
      txt(g, 'Cut ' + (i ? 'B' : 'A'), x, 355, 47, C.ink, 'left', 'Serif');
      let offset = 0;
      part.forEach(([r, n], j) => {
        const groupX = x + offset * 32,
          w = n * 32;
        box(g, groupX, 419, w - 4, 126, C.slate, C.edge, 2);
        for (let a = 0; a < n; a++) jewel(g, groupX + (a + 0.5) * 32, 480, a >= n - r, 12);
        math(g, r + '/' + n, groupX + w / 2, 593, 33, C.ink, 'center');
        offset += n;
      });
      if (b >= 1)
        txt(
          g,
          'Child weights   ' + part.map((p) => p[1] + '/24').join('  and  '),
          x,
          664,
          31,
          C.dim,
        );
      if (gi)
        math(
          g,
          'Gini gain      ' + gain(part, gini).toFixed(4),
          x,
          763,
          37,
          i === 1 ? C.blue : C.ink,
        );
      if (ent)
        math(
          g,
          'Entropy gain   ' + gain(part, entropy).toFixed(4),
          x,
          838,
          37,
          i === 0 ? C.amber : C.ink,
        );
    });
    legend(g, 120, 308);
    return;
  }
  const split = cue(k, 4, 'Split off the sixty-minute request', 0.55) === 1,
    p = split ? [15, 15, 60] : [30, 30, 30];
  durationPlot(g, p);
  txt(g, 'Leaf predictions', 1225, 325, 39, C.dim, 'left', 'Serif');
  math(g, p.join('   '), 1225, 404, 44);
  txt(g, 'Squared errors', 1225, 515, 39, C.dim, 'left', 'Serif');
  math(g, targets.map((v, i) => (v - p[i]) ** 2).join('   '), 1225, 590, 42);
  sub(g, 'Mean squared error', 1225, 684);
  math(g, neat(squareError(targets, p)) + ' min²', 1225, 749, 47, C.amber);
  if (b >= 5) txt(g, 'Reduction   450 min²', 1225, 809, 38, C.blue);
}

export function search(g, k) {
  const b = k.beat.beatIndex;
  background(
    g,
    'Fitting a stump',
    b === 4 ? 'Test the other feature' : 'Which gap buys the most agreement?',
  );
  if (b === 4) {
    const both = [gaps(0), gaps(1)],
      shown = cue(k, 4, 'Keep the ambiguity cut', 0.5) === 1;
    both.forEach((series, i) => {
      const x = 147 + i * 870,
        y = 731;
      txt(g, i ? 'Policy support' : 'Ambiguity', x, 315, 45, C.ink, 'left', 'Serif');
      const winner = best(rows, [i]);
      series.forEach((s, j) => {
        const a = x + j * 108,
          h = s.gain * 950,
          win = Math.abs(s.cut - winner.cut) < 1e-8;
        box(g, a, y - h, 64, Math.max(2, h), win ? C.amber : C.faint);
        math(g, neat(s.cut), a + 32, y + 42, 23, C.ink, 'center');
      });
      sub(g, 'Candidate midpoint', x, 834);
      if (shown) math(g, 'Best gain   ' + winner.gain.toFixed(3), x, 915, 39, i ? C.dim : C.amber);
    });
    return;
  }
  const index = b === 0 ? Math.round(cue(k, 0, 'Try one midpoint', 3) * 6) : 4;
  const candidate = gaps(0)[index],
    cut = candidate.cut;
  strip(
    g,
    requests,
    [
      { end: cut, label: 'Left', review: false },
      { label: 'Right', review: false },
    ],
    { top: 318, h: 258 },
  );
  const groups = [candidate.left, candidate.right],
    details = cue(k, 2, 'Gini impurity', 0.4) > 0;
  groups.forEach((group, i) => {
    const x = 155 + i * 855,
      yes = group.filter((r) => r[2]).length;
    txt(g, (i ? 'Right' : 'Left') + ' leaf', x, 653, 36, C.dim, 'left', 'Serif');
    math(g, yes + ' / ' + group.length + ' review', x, 708, 39);
    if (details) math(g, 'Gini   ' + gini(yes / group.length).toFixed(2), x, 763, 33, C.blue);
  });
  if (b === 3)
    math(
      g,
      '0.50 − (5/8 × 0.32 + 3/8 × 0) = ' + candidate.gain.toFixed(2),
      960,
      812,
      43,
      C.amber,
      'center',
    );
}

export function depth(g, k) {
  const b = k.beat.beatIndex,
    d =
      1 +
      Number(cue(k, 0, 'A cut at one point seven five', 0.55) === 1) +
      Number(cue(k, 0, 'Another at two point four', 0.55) === 1);
  const entries = policyCosts(tree),
    showV8 = cue(k, 3, 'Now try V8', 0.4) > 0,
    active = showV8 ? entries[7] : entries[1],
    showTotals = b === 4;
  background(
    g,
    'Testing depth',
    b < 2
      ? 'Cut inside the left branch'
      : showTotals
        ? 'Which tree costs less on the eight later requests?'
        : 'Where does ' + active.id + ' go?',
  );
  strip(g, requests, panes(tree, d), {
    top: 317,
    h: 258,
    focus: d === 3 ? ['R3'] : [],
    showValues: false,
  });
  if (b < 2) {
    if (d === 3) {
      const x = stripX(2);
      line(g, x, 582, x, 677, C.amber, 3);
      txt(g, 'R3 alone taught this region', x, 734, 42, C.amber, 'center', 'Serif');
    }
    legend(g, 120, 263);
    return;
  }
  const out = showV8
      ? cue(k, 3, 'V8 actually needed review', 0.9) === 1
      : cue(k, 3, "That's an eighteen-dollar extra review", 0.1) > 0;
  const routed = showV8
    ? cue(k, 3, 'goes through automatically', 0.6) === 1
    : cue(k, 3, 'Turn the jewel over', 0.02) > 0;
  const x = stripX(active.row[0]);
  line(g, x, 581, x, 685, C.ink, 3);
  jewel(g, x, 720, out ? active.row[2] : null, 35);
  math(g, active.id + '  ·  ' + active.row[0], x, 797, 31, C.ink, 'center');
  if (showTotals) {
    const total = bill(entries).total;
    txt(g, 'Later requests', 1200, 690, 41, C.dim, 'left', 'Serif');
    math(g, 'Deep tree   $' + total, 1200, 768, 38, C.amber);
    math(g, 'Stump       $' + stumpBill(0.5, 120).total, 1200, 817, 38);
    txt(g, 'V2   $18 extra review      +      V8   $120 miss', 120, 812, 34, C.ink);
  } else {
    txt(
      g,
      routed ? (active.review ? 'Add review' : 'Usual checks') : 'Which route?',
      1230,
      716,
      50,
      C.ink,
      'left',
      'Serif',
    );
    if (out)
      txt(
        g,
        active.review ? 'Routine  ·  $18 extra review' : 'Needed review  ·  $120 miss',
        1230,
        795,
        34,
        C.amber,
      );
    sub(g, 'Routing cutoff   0.50', 120, 813);
  }
}
