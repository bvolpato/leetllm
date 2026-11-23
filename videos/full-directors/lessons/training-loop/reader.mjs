import {
  P,
  head,
  txt,
  mono,
  line,
  box,
  dot,
  poly,
  plaque,
  strip,
  ticket,
  axis,
  fmt,
  equation,
  matrix,
  paperRows,
  plotGrid,
  trace,
  cue,
  finish,
} from './bench.mjs';
import {
  batch,
  forward,
  nextUpdate,
  savedWeights,
  ending,
  LOOP_BIGRAM as language,
  trainingChars,
  successors,
  successorCounts,
  entropy,
} from './examples.mjs';

export function compile(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 2) {
    const w = cue(k, 2, 'Their scores change together') ? 2 : 1;
    head(c, 'CAPTURE CHECK   /   BACKEND = EAGER', 'Two forwards read one weight');
    plaque(c, 76, 179, 250, 170);
    txt(c, 'Shared scalar W', 103, 222, 20, P.pencil);
    mono(c, w, 198, 291, 46, P.ink, 'center');
    for (const [i, s] of ['eager module', 'compiled wrapper'].entries()) {
      const yy = 204 + i * 131;
      line(c, 327, 265, 498, yy, P.teal, 3);
      txt(c, s, 528, yy - 13, 21, P.white);
      mono(c, '3 × ' + w + ' = ' + 3 * w, 529, yy + 27, 22, P.gold);
    }
    mono(c, 'x = 3     ·     fullgraph=True', 480, 436, 21, P.dim, 'center');
    return;
  }
  const full = b === 4 || cue(k, 3, 'Full graph raises');
  head(
    c,
    'TORCH.COMPILE',
    b === 1 ? 'Capture regions, then generate kernels' : 'What happens at a graph break?',
  );
  const items =
    b === 1
      ? [
          ['Eager', 'verify outputs'],
          ['Dynamo', 'capture regions'],
          ['Inductor', 'generate kernels'],
        ]
      : [
          ['Region A', 'tensor ops'],
          ['Python break', full ? 'raise' : 'run in Python'],
          ['Region B', full ? 'unreached' : 'resume capture'],
        ];
  items.forEach(([a, s], i) => {
    const x = 47 + i * 303;
    const color = i === 1 && b > 1 ? P.copper : full && i === 2 ? P.dim : P.paper;
    strip(c, x, 208, 251, 119, color);
    txt(c, a, x + 21, 243, 24, P.ink, { font: 'Serif' });
    mono(c, s, x + 21, 288, 17, P.ink);
    if (i !== 2 && !(full && i === 1)) {
      line(c, x + 253, 264, x + 296, 264, P.dim, 2);
      poly(
        c,
        [
          [x + 297, 264],
          [x + 284, 258],
          [x + 284, 270],
        ],
        P.dim,
      );
    }
  });
  const bottom =
    b === 1
      ? 'Warm up before timing repeated steps.'
      : b === 4
        ? 'Check compiled backward autocast policy for this version.'
        : full
          ? 'fullgraph=True'
          : 'fullgraph=False';
  txt(c, bottom, 480, 411, 22, P.gold, { align: 'center' });
}
export function bigram(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b < 3) {
    const step = cue(k, 2, 'Gradient descent raises');
    head(c, 'NEXT CHARACTER   /   ONE OBSERVED PAIR', 'A single pair writes to a single row');
    ['t', 'h', 'e'].forEach((v, i) => {
      const x = 62 + i * 84;
      strip(c, x, 180, 69, 89, i === 0 ? P.teal : i === 1 ? P.gold : P.paper);
      mono(c, v, x + 35, 222, 42, P.ink, 'center');
    });
    txt(c, 'current t    →    target h', 63, 308, 19, P.white);
    txt(c, 'Next pair: h → e', 64, 369, 18, P.dim);
    const v = language.chars.length;
    matrix(c, {
      x: 414,
      y: 198,
      w: 483,
      label: 'Logits    ·    selected columns',
      headers: ['input', 'h', 'e', 'other'],
      rows: [
        ['t', step ? fmt(1 - 1 / v, 3) : 0, step ? fmt(-1 / v, 3) : 0, step ? fmt(-1 / v, 3) : 0],
        ['h', 0, 0, 0],
        ['e', 0, 0, 0],
      ],
      highlight: 0,
      rowH: 43,
    });
    mono(
      c,
      step ? 'Single-pair SGD, learning rate 1' : '21 possible successors per row',
      480,
      452,
      20,
      P.gold,
      'center',
    );
    return;
  }
  if (b === 3 || b === 4) {
    const chars = b === 3 ? language.chars : trainingChars;
    const v = chars.length;
    head(
      c,
      'VOCABULARY   /   ZERO LOGIT TABLE',
      b === 3 ? 'Count the symbols in both texts' : 'Count the training symbols only',
    );
    const side = 183,
      cw = side / v;
    const inputRow = chars.indexOf('t');
    mono(c, 'input t', 76, 181 + (inputRow + 0.5) * cw, 15, P.gold, 'right');
    txt(c, 'Possible successors →', 86, 158, 17, P.dim);
    for (let row = 0; row < v; row++)
      for (let col = 0; col < v; col++)
        box(c, 86 + col * cw, 181 + row * cw, cw - 1, cw - 1, row === inputRow ? P.gold : P.teal);
    txt(c, 'One row per input character', 326, 203, 22, P.white);
    mono(c, v + ' × ' + v + ' = ' + v * v + ' parameters', 326, 252, 24, P.gold);
    mono(c, 'p(target) = 1 / ' + v, 326, 302, 22, P.white);
    mono(c, '−ln(1/' + v + ') ≈ ' + Math.log(v).toFixed(3) + ' nats', 326, 354, 22, P.white);
    txt(
      c,
      b === 3
        ? 'Plain Python    ·    full-batch gradient descent'
        : 'PyTorch    ·    AdamW, weight decay 0',
      480,
      443,
      18,
      P.dim,
      { align: 'center' },
    );
    return;
  }
  head(c, 'ADAMW   /   PER-COORDINATE STATE', 'Each logit keeps two running estimates');
  plaque(c, 46, 177, 868, 257);
  paperRows(
    c,
    [
      ['First moment', 'm ← β₁m + (1−β₁)g'],
      ['Second moment', 'v ← β₂v + (1−β₂)g²'],
      ['Bias-corrected update', '−α × m̂ / (√v̂ + ε)'],
    ],
    83,
    230,
    793,
    66,
  );
  txt(c, 'Decoupled weight decay is zero in this run.', 480, 477, 18, P.white, { align: 'center' });
}
export function floor(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b < 4) {
    const resolved = cue(k, 2, 'Those are their observed'),
      solo = b === 3;
    head(
      c,
      'BIGRAM   /   REPEATED INPUT',
      solo
        ? 'One successor can take almost all the mass'
        : 'Four observations share one prediction',
      true,
    );
    const letters = solo ? successors.map(() => 'A') : successors;
    const [countA, countB] = successorCounts;
    const total = successors.length;
    const shareA = countA + '/' + total, shareB = countB + '/' + total;
    letters.forEach((s, i) => {
      const x = 58 + i * 217;
      box(c, x, 173, 182, 94, s === 'A' ? P.moss : P.red, 3);
      mono(c, 'x → ' + s, x + 91, 220, 29, P.white, 'center');
      if (b === 2 && cue(k, 2, s === 'A' ? 'Each A contributes' : 'The B contributes'))
        mono(c, '−ln(' + (s === 'A' ? shareA : shareB) + ')', x + 91, 290, 21, P.ink, 'center');
    });
    const summary = solo
      ? finish(k, 3) ? 'P(A) → 1      mean loss → 0' : 'All four successors are A'
      : resolved
        ? 'P(A) = ' + shareA + '           P(B) = ' + shareB
        : 'How should this row split its probability?';
    equation(c, summary, 342, true, 26);
    if (b === 2 && cue(k, 2, 'Add the four costs')) {
      const formula = '−[' + countA + ' ln(' + shareA + ') + ln(' + shareB + ')] / ' + total;
      const answer = finish(k, 2) ? ' ≈ ' + entropy(successorCounts).toFixed(3) + ' nats' : '';
      mono(c, formula + answer, 178, 421, 24);
    }
    return;
  }
  head(c, 'LANGUAGE MODEL   /   TRAINING SET', 'Compare the whole-set loss with its floor');
  const floor = language.floor,
    last = language.history.at(-1).train,
    shown = finish(k, 4);
  const x = 216,
    w = 659,
    px = (n) => x + ((n - 1) / 0.04) * w;
  ['Empirical floor', 'Plain Python', 'PyTorch'].forEach((s, i) => {
    const v = [floor, last, 1.019][i],
      y = 212 + i * 76;
    txt(c, s, 54, y, 18, P.white);
    line(c, x, y, x + w, y, P.edge, 2);
    if ((i === 0 && cue(k, 4, 'The two training runs')) || shown) {
      const xx = px(v);
      dot(c, xx, y, 8, i ? P.teal : P.gold);
      mono(c, v.toFixed(3), xx, y - 23, 18, i ? P.teal : P.gold, 'center');
    }
  });
  mono(c, '1.00', x, 418, 15, P.dim, 'center');
  mono(c, '1.04 nats / pair', x + w, 418, 15, P.dim, 'right');
  if (b === 5)
    txt(c, 'Score all 108 pairs at fixed weights.', 480, 473, 20, P.gold, { align: 'center' });
}
export function selection(c, k) {
  const b = k.beat.beatIndex + 1,
    chosen = cue(k, 3, 'Its mean validation');
  head(
    c,
    'CHECKPOINT SELECTION   /   75 VALIDATION PAIRS',
    'Which step has lower validation loss?',
  );
  const n = Math.round(
    111 * cue(k, 1, 'Watch them fall', 1.7) + 889 * cue(k, 1, 'Keep training', 2.0),
  );
  const g = { x: 72, y: 196, w: 540, h: 194, xMax: 1000, yMin: 0.9, yMax: 3.15 };
  txt(c, 'Mean loss   ·   nats / pair', 72, 158, 18, P.dim);
  plotGrid(c, g, [1, 2, 3]);
  trace(c, language.history, n, 'train', g, P.cyan);
  const point = trace(c, language.history, n, 'validation', g, P.pink);
  [language.bestStep, 1000]
    .filter((i) => i <= n)
    .forEach((i) =>
      dot(c, ...point(i), chosen && i === 111 ? 7 : 5, chosen && i === 111 ? P.gold : P.pink),
    );
  txt(c, 'Validation', 665, 186, 22, P.pink, { bold: true });
  [111, 1000].forEach((i, j) => {
    mono(c, 'step ' + i, 665, 237 + j * 81, 16, P.dim);
    mono(
      c,
      n >= i ? language.history[i].validation.toFixed(3) : '·',
      666,
      269 + j * 81,
      26,
      chosen && i === 111 ? P.gold : P.white,
    );
  });
  txt(c, 'Training', 69, 450, 16, P.cyan);
  txt(c, 'Validation', 169, 450, 16, P.pink);
  if (b < 5)
    txt(
      c,
      chosen ? 'Copy step 111' : b === 2 ? 'Which copy?' : 'Optimizer updates',
      667,
      420,
      20,
      P.gold,
    );
  if ((b === 3 && cue(k, 3, 'never occurred')) || b === 4)
    mono(c, 'Unseen pairs: 24 / 75', 666, 466, 16, P.dim);
  if (b >= 5) {
    strip(c, 310, 438, 606, 58, P.paper);
    mono(
      c,
      b === 5
        ? '111  “theac. ure se leusthe thesd …”'
        : 'Use a separate test set for the final score.',
      332,
      463,
      17,
      P.ink,
    );
  }
}
export function receipt(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 1) {
    head(c, 'CHECKPOINT RECEIPT', 'What does column 1 mean?', true);
    strip(c, 51, 159, 856, 291, '#fff8e9');
    paperRows(
      c,
      [
        ['incident-router.pt', 'architecture + optimizer settings'],
        ['Feature order', 'urgency, severity'],
        ['Output map', '0 standard  /  1 escalation'],
        ['Selection record', 'split IDs, both curves, metric'],
      ],
      82,
      204,
      793,
      62,
    );
    return;
  }
  if (b === 2) {
    const locked = cue(k, 2, 'freeze its weights');
    head(c, 'MEASUREMENT   /   KEEP THE SPLIT FIXED', 'Which weights scored each batch?');
    ['Training epoch', 'Saved checkpoint'].forEach((s, i) => {
      txt(c, s, 51, 223 + i * 113, 21, P.white);
      for (let j = 0; j < 3; j++) {
        const x = 291 + j * 203;
        strip(c, x, 191 + i * 113, 177, 74, i ? P.paper : P.teal);
        mono(
          c,
          i ? (locked ? 'saved W' : '·') : 'W' + j,
          x + 88,
          224 + i * 113,
          22,
          P.ink,
          'center',
        );
      }
    });
    txt(c, 'Keep a document and its duplicates in one split.', 480, 444, 21, P.gold, {
      align: 'center',
    });
    return;
  }
  const next = cue(k, 3, 'To check that training resumes');
  head(c, 'RELOAD CHECK', next ? 'Replay the next update' : 'Replay the same forward');
  const stepped = cue(k, 3, 'Compare every updated weight');
  const copies = [batch.updated, savedWeights];
  if (next) {
    matrix(c, {
      x: 66,
      y: 210,
      w: 829,
      label: stepped
        ? 'Weights after step 2  ·  rounded to three places'
        : 'Step 1 restored   ·   A and B ready',
      headers: ['copy', 'standard weights', 'escalation weights'],
      rows: copies.map((w, i) => [
        i ? 'Reloaded' : 'Uninterrupted',
        ...(stepped ? nextUpdate(w) : w).map((row) => row.map((v) => fmt(v, 3)).join('  ')),
      ]),
    });
  } else {
    matrix(c, {
      x: 66,
      y: 210,
      w: 829,
      label: 'Ticket A   ·   forward after step 1',
      headers: ['copy', 'standard', 'escalation'],
      rows: copies.map((w, i) => [
        i ? 'Reloaded' : 'Uninterrupted',
        ...forward(w, [1, 1]).scores.map((v) => fmt(v, 1)),
      ]),
    });
  }
  txt(
    c,
    next
      ? stepped
        ? 'The updated weights match in both copies.'
        : 'Same next batch and SGD learning rate.'
      : 'Compare both logits before taking another step.',
    480,
    429,
    20,
    P.gold,
    { align: 'center' },
  );
}
export function audit(c, k) {
  const b = k.beat.beatIndex + 1,
    dirty = b >= 2,
    after = cue(k, 2, 'After backward it reads'),
    step = cue(k, 1, 'pushed the weights');
  head(c, 'DEBUGGER   /   URGENCY COLUMN', 'Read the buffer on both sides of backward');
  const rows = dirty
    ? [['Standard', '−1', after ? '−0.5' : '·', after ? '+0.5' : '·']]
    : [
        ['Standard', 'empty', '+0.5', step ? '−0.1' : '·'],
        ['Escalation', 'empty', '−0.5', step ? '+0.1' : '·'],
      ];
  matrix(c, {
    x: 59,
    y: 222,
    w: 841,
    label: dirty ? 'Old buffer retained' : 'Clean two-ticket batch',
    headers: ['route', 'before', 'after', dirty ? 'after − before' : 'W after step'],
    rows,
  });
  if (dirty)
    equation(
      c,
      cue(k, 3, 'Compare the weight') ? 'SGD reads −0.5   →   W becomes +0.1' : 'Which entry does the optimizer use?',
      395,
      false,
      23,
    );
  else
    mono(c, 'grad → stored derivative      W → updated parameter', 480, 417, 20, P.dim, 'center');
}
export function heldOut(c, k) {
  const s = ending(k),
    b = k.beat.beatIndex + 1;
  ticket(
    c,
    48,
    32,
    402,
    'Held-out outage',
    'urgency +1.5      severity +1',
    'LABEL   /   ESCALATION',
  );
  txt(
    c,
    s.replay ? 'Replay   ·   clear before backward' : 'Run 1   ·   keep old buffer',
    505,
    51,
    21,
    P.white,
    { bold: true },
  );
  mono(c, 'Train: A + B     SGD: 0.2', 505, 87, 17, P.dim);
  txt(c, 'Both runs start with W = 0.', 505, 117, 17, P.dim);
  const cols = ['Route', 'Before backward', 'A + B add', 'Current .grad', 'Current W'];
  const asPair = (row) => (row ? row.map((v) => fmt(v, 1)).join('  ') : 'None');
  const showFresh = cue(k, 2, 'With a learning rate');
  matrix(c, {
    x: 46,
    y: 180,
    w: 868,
    label: s.replay ? (s.cleared ? 'Cleared window' : 'Original state restored') : 'Stale window',
    headers: cols,
    rows: ['Standard', 'Escalation'].map((name, i) => [
      name,
      asPair(s.before?.[i]),
      showFresh ? asPair(batch.gradient[i]) : '·',
      asPair(s.grad?.[i]),
      asPair(s.weights[i]),
    ]),
    rowH: 39,
  });
  const prob = s.replay ? cue(k, 8, 'For two classes') : finish(k, 5);
  if (s.scored && (b === 4 || b === 7)) {
    const i = s.scored.gap > 0 ? 1 : 0,
      w = s.weights[i];
    mono(
      c,
      (i ? 'Escalation' : 'Standard') +
        '   ' +
        fmt(w[0], 1) +
        ' × 1.5 + (' +
        fmt(w[1], 1) +
        ' × 1) = ' +
        fmt(s.scored.scores[i], 2),
      55,
      316,
      16,
      P.dim,
    );
  } else if (s.scored && prob) {
    mono(c, 'P(escalate) = 1 / (1 + exp(−gap))', 55, 316, 16, P.dim);
  } else mono(c, 'Gap = escalation score − standard score', 55, 316, 16, P.dim);
  if (s.scored)
    mono(
      c,
      fmt(s.scored.scores[1], 2) + ' − (' + fmt(s.scored.scores[0], 2) + ')',
      906,
      316,
      16,
      P.white,
      'right',
    );
  axis(c, {
    x: 92,
    y: 411,
    w: 776,
    range: 0.6,
    gap: s.scored?.gap ?? null,
    old: s.old?.gap ?? null,
    dark: true,
  });
  if (s.old)
    txt(c, 'Run 1', 93 + ((s.old.gap + 0.6) / 1.2) * 776, 462, 15, P.dim, { align: 'center' });
  if (s.scored) {
    const col = s.scored.gap > 0 ? P.teal : P.copper;
    txt(
      c,
      'Route → ' +
        s.scored.route +
        (prob ? '     P(escalate) ' + Math.round(s.scored.p * 100) + '%' : ''),
      480,
      480,
      22,
      col,
      { align: 'center', bold: true },
    );
  } else txt(c, 'Where will this ticket land?', 480, 480, 21, P.gold, { align: 'center' });
  if (b === 9)
    mono(
      c,
      'Set accuracy = correctly routed tickets / total labeled tickets',
      480,
      516,
      15,
      P.dim,
      'center',
    );
}
