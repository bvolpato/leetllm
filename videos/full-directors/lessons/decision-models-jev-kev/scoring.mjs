import {
  ink,
  dark,
  white,
  edge,
  muted,
  soft,
  gold,
  pigments,
  lights,
  text,
  mono,
  serif,
  rect,
  line,
  dot,
  arrow,
  stock,
  heading,
  key,
  names,
  letters,
  opacity,
  cue,
  mix,
  fmt,
  pct,
} from './atlas.mjs';
import {
  z,
  weights,
  sum,
  baseShares,
  gradient,
  update,
  vectors,
  dots,
  pointer,
  scaled,
  transferShares,
  transferGradient,
} from './decisions.mjs';

export function softmaxScene(g, k) {
  stock(g);
  heading(g, 'RUN-842   /   INVENTED LOGITS', 'Which option gets the largest share?');
  const exp = cue(k, 0, 'take the exponential', 0.55);
  const lay = cue(k, 0, 'Lay those lengths end to end', 1.4);
  const divide = cue(k, 1, 'Divide each weight by the same total');
  const total = sum(weights),
    unit = 51,
    left = (960 - unit * total) / 2;
  const top = 183;
  mono(g, 'OPTION', 43, 144, 14, muted);
  mono(g, 'LOGIT', 330, 144, 14, muted);
  opacity(g, exp, () => mono(g, 'WEIGHT  =  exp(logit)     ·     T = 1', 450, 144, 14, muted));
  let prefix = 0;
  for (let i = 0; i < 3; i++) {
    const y = top + i * 64,
      col = pigments[i];
    key(g, i, 41, y);
    text(g, names[i], 83, y, 20, ink);
    mono(g, String(z[i]), 349, y + 1, 23, ink, 'center');
    opacity(g, exp, () => {
      mono(g, fmt(weights[i], 2), 458, y + 1, 22, col);
      rect(g, 539, y - 13, weights[i] * unit, 14, col, 3);
    });
    if (lay > 0) {
      const x = left + prefix * unit + (i - 1) * 32 * (1 - lay),
        yy = 356;
      const w = weights[i] * unit;
      rect(g, x, yy, w, 39, col, 2);
      mono(g, letters[i], x + w / 2, yy + 26, 17, white, 'center');
    }
    prefix += weights[i];
    if (cue(k, 1, "Find the reviewer's B") && i < 2)
      mono(g, i === 0 ? 'MODEL WINNER' : 'REVIEWED TARGET', 82, y + 20, 12, col);
  }
  if (lay >= 1) {
    line(g, left, 411, 960 - left, 411, ink, 1.6);
    for (const x of [left, 960 - left]) line(g, x, 403, x, 416, ink, 2);
    mono(
      g,
      divide
        ? 'p(A) ' +
            pct(baseShares[0]) +
            '    p(B) ' +
            pct(baseShares[1]) +
            '    p(C) ' +
            pct(baseShares[2])
        : '7.39 + 2.72 + 1.00 ≈ ' + fmt(total, 2),
      480,
      451,
      22,
      ink,
      'center',
    );
    if (divide) mono(g, 'Each share = weight / ' + fmt(total, 2), 480, 486, 16, muted, 'center');
  }
}

export function descent(g, k) {
  stock(g);
  const transfer = cue(k, 3, 'Try the gradient rule');
  if (transfer) {
    heading(g, 'NEW EXAMPLE   /   REVIEWED TARGET C', 'Which way does the target score move?');
    const q = transferShares;
    q.forEach((p, i) => {
      const x = 45 + i * 302;
      key(g, i, x, 193);
      mono(g, 'p = ' + fmt(p, 1), x + 45, 194, 24);
      rect(g, x, 224, 241, 15, '#d9d9c5', 3);
      rect(g, x, 224, 241 * p, 15, pigments[i], 3);
    });
    mono(g, 'C target = 1', 45, 324, 24, pigments[2]);
    if (cue(k, 3, 'negative point six')) {
      mono(g, fmt(q[2], 1) + ' − 1 = ' + fmt(transferGradient, 1), 45, 383, 35, ink);
      text(g, 'Subtracting a negative raises the logit for C.', 45, 449, 25, ink);
    }
    return;
  }
  const grad = cue(k, 0, 'subtract the target from its probability');
  const step = cue(k, 2, 'Slide the three scores', 1.25);
  const u = update(step);
  heading(
    g,
    'RUN-842   /   ONE STEP ON THREE FREE LOGITS',
    'What does subtracting the gradient do?',
  );
  mono(g, 'OPTION', 38, 156, 14, muted);
  mono(g, 'START GRADIENT', 323, 156, 14, muted);
  mono(g, 'LOGIT NOW', 523, 156, 14, muted);
  mono(g, 'PROBABILITY NOW', 692, 156, 14, muted);
  for (let i = 0; i < 3; i++) {
    const y = 219 + 76 * i;
    key(g, i, 38, y);
    text(g, names[i], 80, y, 19, ink);
    if (i === 1) mono(g, 'REVIEWED', 80, y + 22, 12, pigments[1]);
    if (grad) {
      mono(
        g,
        fmt(baseShares[i]) + ' − ' + (i === 1 ? 1 : 0) + ' = ' + fmt(gradient[i]),
        403,
        y,
        16,
        pigments[i],
        'center',
      );
      const zero = 403,
        x = zero + gradient[i] * 78;
      line(g, zero - 70, y + 18, zero + 70, y + 18, edge, 2);
      line(g, zero, y + 12, zero, y + 24, ink, 1.4);
      line(g, zero, y + 18, x, y + 18, pigments[i], 7);
    }
    mono(g, fmt(u.scores[i]), 530, y, 22, ink);
    const bx = 692,
      bw = 153;
    rect(g, bx, y - 8, bw, 12, edge, 2);
    rect(g, bx, y - 8, bw * u.shares[i], 12, pigments[i], 2);
    line(g, bx + bw * baseShares[i], y - 15, bx + bw * baseShares[i], y + 11, ink, 2);
    mono(g, fmt(u.shares[i]), 914, y + 2, 20, ink, 'right');
  }
  line(g, 40, 410, 920, 410, edge, 1);
  if (cue(k, 0, 'negative natural log'))
    mono(g, 'Loss = −ln p(B) = ' + fmt(u.loss), 40, 454, 21, ink);
  if (k.beat.beatIndex > 0)
    mono(
      g,
      step === 0 ? 'Next: z − ½ × gradient' : 'z − ' + fmt(0.5 * step) + ' × gradient',
      541,
      454,
      21,
      ink,
    );
}
export function pointerScene(g, k) {
  stock(g, true);
  if (k.beat.beatIndex === 0) {
    heading(g, 'KEV   /   SERIALIZED REQUEST', 'Where does the head read a hidden state?', true);
    const marked = cue(k, 0, 'the end of each option', 0.45);
    const encoded = cue(k, 0, 'a hidden vector', 0.6);
    const projections = cue(k, 0, 'a key projection', 0.65);
    for (let i = 0; i < 4; i++) {
      const y = 179 + i * 77,
        col = i === 3 ? gold : lights[i];
      if (i < 3) key(g, i, 40, y, true);
      text(g, i === 3 ? 'Decision position' : names[i], i === 3 ? 40 : 85, y, 21, white);
      opacity(g, marked, () => mono(g, i === 3 ? '◆' : ']', 341, y, 27, col));
      opacity(g, encoded, () => {
        arrow(g, 373, y - 7, 458, y - 7, col, 2);
        mono(g, 'hidden state ' + (i === 3 ? 'd' : letters[i]), 482, y, 20, col);
      });
      opacity(g, projections, () => {
        arrow(g, 676, y - 7, 737, y - 7, col, 2);
        mono(g, i === 3 ? 'query' : 'option key', 759, y, 20, white);
      });
    }
    return;
  }
  const v = cue(k, 0, 'a hidden vector', 0.5),
    q = cue(k, 1, 'The yellow decision vector', 0.6);
  const feet = [
    cue(k, 2, "Drop A's tip", 0.8),
    cue(k, 2, 'B reaches two units', 0.55),
    cue(k, 2, "Drop C's tip", 0.8),
  ];
  const scale = cue(k, 2, 'Divide them by the square root');
  heading(
    g,
    'KEV   /   TWO-DIMENSIONAL IDENTITY PROJECTIONS',
    'How far does each tip reach along the query?',
    true,
  );
  const ox = 104,
    oy = 345,
    unit = 155;
  for (let i = 0; i <= 5; i++)
    line(g, ox + (unit * i) / 2, 133, ox + (unit * i) / 2, oy + 18, '#375151', 1);
  for (let i = 0; i <= 2; i++)
    line(g, ox - 20, oy - (unit * i) / 2, ox + unit * 2.65, oy - (unit * i) / 2, '#375151', 1);
  line(g, ox - 27, oy, ox + 2.65 * unit, oy, soft, 1.5);
  line(g, ox, oy + 22, ox, 143, soft, 1.5);
  for (const n of [0, 1, 2]) mono(g, n, ox + unit * n, oy + 34, 17, soft, 'center');
  mono(g, '1', ox - 25, oy - unit + 6, 16, soft);
  opacity(g, v, () => {
    vectors.forEach(([x, y], i) => {
      const xx = ox + x * unit,
        yy = oy - y * unit;
      arrow(g, ox, oy, xx, yy, lights[i], 4);
      text(
        g,
        letters[i],
        xx + (i === 0 ? 12 : 9),
        yy - (i === 1 ? 15 : 2),
        22,
        lights[i],
        'Sans',
        700,
      );
    });
  });
  opacity(g, q, () => {
    arrow(g, ox, oy, ox + unit, oy, gold, 5, 15);
    mono(g, 'Decision query  [1, 0]', ox, 438, 20, gold);
  });
  feet.forEach((m, i) => {
    if (m <= 0) return;
    const x = ox + unit * vectors[i][0],
      startY = oy - unit * vectors[i][1],
      yy = mix(startY, oy, m);
    line(g, x, startY, x, yy, white, 2, [4, 4]);
    dot(g, x, yy, 7, lights[i]);
    dot(g, x, yy, 3, dark);
    if (i === 1) {
      line(g, ox, oy + 55, x, oy + 55, lights[i], 2);
      line(g, x, oy + 49, x, oy + 59, lights[i], 2);
    }
  });
  const xx = 541;
  mono(g, 'OPTION MARKER', xx, 154, 14, soft);
  for (let i = 0; i < 3; i++) {
    const y = 200 + i * 81;
    key(g, i, xx, y, true);
    text(g, names[i], xx + 42, y, 20, white);
    if (v) mono(g, '[' + vectors[i].join(', ') + ']', xx + 43, y + 30, 17, lights[i]);
    if (feet[i] >= 1)
      mono(g, scale ? fmt(pointer[i]) : String(dots[i]), 905, y + 30, 23, white, 'right');
  }
  if (scale) {
    mono(g, 'logit = dot / √2', xx, 427, 21, gold);
    if (k.beat.beatIndex === 3) mono(g, 'Toy 2  ·  Kev default 256  (Oct 2026)', xx, 463, 15, soft);
  } else if (feet.some((x) => x > 0)) mono(g, 'dot = key · [1, 0]', xx, 430, 21, gold);
}
export function readouts(g, k) {
  stock(g);
  if (k.beat.beatIndex < 3) {
    heading(g, 'KEV   /   SAME POINTER LOGITS', 'Does warmer softmax change the winner?');
    const t = 1 + cue(k, 1, 'Double it now', 0.8),
      state = scaled(t);
    mono(g, 'OPTION', 40, 156, 14, muted);
    mono(g, 'LOGIT / T', 345, 156, 14, muted);
    mono(g, 'OPTION PROBABILITY', 536, 156, 14, muted);
    state.shares.forEach((p, i) => {
      const y = 216 + 65 * i;
      key(g, i, 40, y);
      text(g, names[i], 82, y, 20, ink);
      mono(g, fmt(state.logits[i]), 350, y, 22);
      rect(g, 535, y - 16, 280, 21, edge, 3);
      rect(g, 535, y - 16, 280 * p, 21, pigments[i], 3);
      const tick = 535 + 280 * scaled(1).shares[i];
      line(g, tick, y - 24, tick, y + 12, ink, 2);
      mono(g, pct(p), 914, y + 1, 23, ink, 'right');
    });
    mono(g, 'T = ' + fmt(t, 2), 40, 438, 29, ink);
    text(
      g,
      k.beat.beatIndex === 2
        ? 'Fit T on held-out logits. Check on fresh incidents.'
        : 'Ticks mark the shares at T = 1.',
      265,
      438,
      21,
      muted,
    );
    return;
  }
  const shows = [
    cue(k, 3, 'In Kev'),
    cue(k, 3, 'SemIf freezes'),
    cue(k, 4, 'Tev1 trains'),
    cue(k, 5, 'Jev also'),
  ];
  heading(g, 'PUBLIC READOUTS   /   OCTOBER 2026', 'What produced the returned B?');
  mono(g, 'SYSTEM', 42, 153, 14, muted);
  mono(g, 'SOURCE OF THE DECISION', 231, 153, 14, muted);
  mono(g, 'OUTPUT', 844, 153, 14, muted);
  const rows = [
    ['Kev', 'Dot products of option keys and query', 'Compare marker vectors'],
    ['SemIf', 'Frozen next-position logits for A, B, C', 'Read the three token scores'],
    [
      'Tev1',
      'Generate a letter with the trained LM head',
      'Client maps the token to a typed choice',
    ],
    ['Jev', 'TypeSafe reports parallel sampling and RLCD', 'Internal architecture undisclosed'],
  ];
  rows.forEach(([name, label, op], i) => {
    if (!shows[i]) return;
    const y = 195 + i * 79;
    line(g, 41, y + 50, 917, y + 50, edge);
    serif(g, name, 42, y + 10, 28, ink);
    text(g, label, 231, y, 21, ink);
    mono(g, op, 232, y + 28, 15, muted);
    arrow(g, 777, y + 8, 826, y + 8, pigments[1], 2);
    key(g, 1, 854, y + 14);
  });
}
