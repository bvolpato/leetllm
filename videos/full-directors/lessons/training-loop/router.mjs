import {
  P,
  head,
  txt,
  mono,
  line,
  box,
  dot,
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
  mix,
} from './bench.mjs';
import {
  batch,
  opening,
  tickets,
  lossRows,
  loopMomentum,
  loopMicrobatch,
  epochMean,
  fitHistory,
} from './examples.mjs';

export function outage(c, k) {
  const s = opening(k),
    g = s.gradient,
    b = k.beat.beatIndex + 1;
  const wide = cue(k, 1, 'Our router gives', 1.15);
  if (wide < 1) {
    const zoom = mix(1.85, 1, wide),
      x = mix(114, 48, wide),
      y = mix(174, 41, wide);
    c.save();
    c.translate(x, y);
    c.scale(zoom, zoom);
    ticket(
      c,
      0,
      0,
      400,
      'Checkout is down',
      'urgency +1     severity +1',
      'TICKET A   /   LABELED ESCALATION',
    );
    c.restore();
    return;
  }
  ticket(
    c,
    48,
    41,
    400,
    'Checkout is down',
    'urgency +1     severity +1',
    'TICKET A   /   LABELED ESCALATION',
  );
  txt(c, 'Escalation row', 501, 37, 18, P.dim);
  txt(c, 'urgency', 678, 45, 14, P.dim, { align: 'center' });
  txt(c, 'severity', 796, 45, 14, P.dim, { align: 'center' });
  const cells = [
    ['W.grad', g ? g[1] : null],
    ['W', s.weights[1]],
  ];
  cells.forEach(([name, vals], i) => {
    mono(c, name, 503, 81 + 41 * i, 19, P.white);
    for (let j = 0; j < 2; j++) {
      box(c, 624 + j * 118, 64 + 41 * i, 109, 35, P.ink, 4);
      mono(
        c,
        vals ? fmt(vals[j], 1) : 'None',
        678 + j * 118,
        83 + i * 41,
        19,
        i ? P.teal : P.gold,
        'center',
      );
    }
  });
  plaque(c, 43, 179, 874, 260);
  txt(c, 'Escalation score − standard score', 77, 212, 24, P.ink, { font: 'Serif' });
  mono(
    c,
    s.stepped && !s.rescored
      ? 'before rescore'
      : b === 2 && g
        ? 'previous forward'
        : b === 3
          ? 'rescored after backward'
          : 'latest forward',
    877,
    210,
    16,
    P.pencil,
    'right',
  );
  axis(c, { x: 101, y: 332, w: 758, gap: s.scored.gap });
  txt(c, 'Standard', 81, 408, 24, P.moss, { bold: true });
  mono(c, fmt(s.scored.scores[0], 1), 202, 409, 23);
  txt(c, 'Escalation', 645, 408, 24, P.red, { bold: true });
  mono(c, fmt(s.scored.scores[1], 1), 864, 409, 23, P.ink, 'right');
  txt(c, s.scored.gap ? 'Route → Escalation' : 'Tie → Standard', 480, 411, 20, P.ink, {
    align: 'center',
  });
  const action =
    b === 1
      ? 'Forward on ticket A'
      : b === 2
        ? g
          ? 'Rescore A with the same W'
          : 'Train on A and B'
        : b === 3
          ? 'Same ticket. Same two scores.'
          : s.rescored
            ? 'Forward on ticket A'
            : s.stepped
              ? 'Optimizer step applied'
              : 'optimizer.step()';
  mono(c, action, 480, 246, 18, P.ink, 'center');
}

function ticketRow(c, x, y, t, w = 390) {
  strip(c, x, y, w, 37);
  mono(c, '#' + t.id, x + 15, y + 17, 16, P.moss);
  mono(c, '[' + t.x.join(', ') + ']', x + 87, y + 17, 16);
  txt(c, t.target ? '1  Escalate' : '0  Standard', x + w - 14, y + 17, 15, P.red, {
    align: 'right',
  });
}
export function batches(c, k, shuffle = false) {
  head(
    c,
    shuffle ? 'DATA CHECK   /   SHUFFLE' : 'DATA LOADER   /   TICKET IDS',
    shuffle ? 'One permutation for X and y' : 'Keep each label with its feature row',
  );
  const order =
    shuffle && cue(k, 5, 'one shared shuffle') ? [3, 0, 5, 1, 4, 2] : [0, 1, 2, 3, 4, 5];
  const first = shuffle ? 0 : cue(k, 2, 'Follow the ticket IDs', 1),
    tail = shuffle ? 0 : cue(k, 2, 'The final batch', 0.8);
  txt(c, 'Dataset   ·   X [6, 2]     y [6]', 50, 155, 18, P.dim);
  if (!shuffle) {
    txt(c, 'Batch 1   ·   four tickets', 497, 155, 18, P.teal);
    txt(c, 'Batch 2   ·   two tickets', 497, 359, 18, P.gold);
  } else {
    txt(c, 'Decode the ID', 530, 230, 24, P.teal, { bold: true });
    txt(c, 'Column 0  →  Standard', 530, 279, 21, P.white);
    txt(c, 'Column 1  →  Escalation', 530, 317, 21, P.white);
    mono(c, 'X[ i ]  ↔  y[ i ]', 530, 382, 24, P.gold);
  }
  order.forEach((j, i) => {
    const t = i < 4 ? first : tail;
    const y = 178 + i * 47;
    ticketRow(c, mix(50, 499, t), mix(y, i < 4 ? 178 + i * 42 : 378 + (i - 4) * 42, t), tickets[j]);
  });
}
export function contracts(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 5) return batches(c, k, true);
  if (b < 3) {
    const soft = b === 2;
    head(
      c,
      'LOSS FUNCTION   /   TARGET PORT',
      soft ? 'One distribution per ticket' : 'One class index per ticket',
    );
    matrix(c, {
      x: 55,
      y: 215,
      w: 380,
      label: 'Raw logits    [5, 3]',
      headers: ['class 0', 'class 1', 'class 2'],
      rows: [
        [2, -1, 0],
        [0.2, 0.5, 0.8],
        [0, -2, 1],
        [1, 2, 1],
        [0, -1, 3],
      ],
      rowH: 36,
    });
    matrix(c, {
      x: 537,
      y: 215,
      w: soft ? 365 : 172,
      label: soft ? 'Soft targets    float [5, 3]' : 'Hard targets    long [5]',
      headers: soft ? ['p(0)', 'p(1)', 'p(2)'] : ['class index'],
      rows: soft
        ? [
            [0.8, 0.1, 0.1],
            [0.1, 0.2, 0.7],
            [0, 0, 1],
            [0.1, 0.8, 0.1],
            [0, 0.2, 0.8],
          ]
        : [[0], [2], [2], [1], [2]],
      rowH: 36,
    });
    txt(
      c,
      soft
        ? 'Check each row: nonnegative entries, sum 1.'
        : 'Each index selects a column in its own row.',
      56,
      467,
      22,
      P.gold,
    );
  } else {
    const bad = b === 4,
      twice = bad && cue(k, 4, 'feeding softmax probabilities');
    head(
      c,
      'LOSS FUNCTION   /   NUMERICAL PATH',
      bad
        ? twice
          ? 'Probabilities fed back as logits'
          : 'A rounded probability can reach zero'
        : 'Stabilize the exponential',
    );
    plaque(c, 50, 164, 860, 266);
    if (!bad) {
      paperRows(
        c,
        [
          ['Raw scores, target 0', '[2, −1]'],
          ['Subtract the row maximum', '[0, −3]'],
          ['Loss in nats', 'ln(1 + exp(−3)) = ' + lossRows[0].loss.toFixed(6)],
        ],
        88,
        218,
        780,
        68,
      );
    } else if (twice) {
      const p = lossRows[0].p;
      const double = Math.log1p(Math.exp(p[1] - p[0]));
      paperRows(
        c,
        [
          ['Raw logits', '[2, −1]'],
          ['After softmax', '[' + p.map((n) => n.toFixed(3)).join(', ') + ']'],
          ['CE on those values', double.toFixed(3) + ' nats  (raw: 0.049)'],
        ],
        88,
        218,
        780,
        68,
      );
    } else {
      paperRows(
        c,
        [
          ['Extreme logits, target 1', '[0, −1000]'],
          ['Round exp(−1000) to zero', '−log(0) = +∞'],
          ['Stable log-sum-exp loss', '1000 nats'],
        ],
        88,
        218,
        780,
        68,
      );
    }
  }
}
export function scores(c, k) {
  head(c, 'TWO NEW TICKETS   /   CROSS ENTROPY', 'Read the probability at the target');
  for (let i = 0; i < 2; i++) {
    const row = lossRows[i],
      x = 53 + i * 456,
      active = i === 0 || k.beat.beatIndex > 0;
    ticket(
      c,
      x,
      144,
      400,
      i ? 'Failed payment' : 'Password reset',
      'logits  [' + row.logits.join(', ') + ']',
      i ? 'TARGET 1   /   ESCALATION' : 'TARGET 0   /   STANDARD',
    );
    if (active) {
      const scale = 388;
      txt(c, 'Target probability', x, 281, 16, P.dim);
      mono(c, row.p[i].toFixed(3), x + 389, 281, 21, P.white, 'right');
      box(c, x, 306, scale, 30, P.panel, 3);
      box(c, x, 306, scale * row.p[i], 30, i ? P.copper : P.teal, 3);
      txt(c, '−ln p(target)', x, 374, 19, P.dim);
      mono(c, row.loss.toFixed(3) + ' nats', x + 389, 374, 23, P.gold, 'right');
    }
  }
  if (cue(k, 2, 'Both tickets count once'))
    equation(
      c,
      '(' +
        lossRows.map((r) => r.loss.toFixed(3)).join(' + ') +
        ') / 2 ≈ ' +
        ((lossRows[0].loss + lossRows[1].loss) / 2).toFixed(3) +
        ' nats',
      461,
    );
}
export function weights(c, k) {
  const b = k.beat.beatIndex + 1,
    back = cue(k, 3, 'writes that mean'),
    step = cue(k, 4, 'Subtracting a negative'),
    W = step ? batch.updated : batch.weights;
  head(c, 'ROUTER   /   FIRST UPDATE', 'Follow the urgency weight');
  const cols = ['urgency', 'severity'];
  matrix(c, {
    x: 219,
    y: 211,
    w: 293,
    label: 'Weights  W',
    headers: cols,
    rows: W.map((r) => r.map((v) => fmt(v, 1))),
  });
  matrix(c, {
    x: 575,
    y: 211,
    w: 321,
    label: 'Gradient  W.grad',
    headers: cols,
    rows: batch.gradient.map((r) => r.map((v) => (back ? fmt(v, 1) : 'None'))),
  });
  txt(c, 'Standard', 49, 267, 20, P.teal);
  txt(c, 'Escalation', 49, 320, 20, P.copper);
  const eq =
    b === 1
      ? '[+1, +1] → escalate     [−1, −1] → standard'
      : b === 2
        ? 'A: (½ − 1) × 1      B: (½ − 0) × (−1)'
        : b === 3
          ? 'mean(−½, −½) = −½'
          : 'W ← W − 0.2 × W.grad';
  equation(c, eq, 415, false, 23);
  if (b === 1 && cue(k, 1, 'so each costs'))
    mono(c, 'CE = −ln(½) ≈ ' + batch.loss.toFixed(3) + ' nats', 480, 465, 20, P.gold, 'center');
  if (b === 4 && cue(k, 4, 'Its escalation score leads'))
    mono(c, 'A scores   −0.2, +0.2     gap +0.4', 480, 465, 20, P.gold, 'center');
}
function weightRail(c, y, label, m, g, w) {
  txt(c, label, 54, y - 21, 20, P.white, { bold: true });
  mono(c, 'grad ' + g + '    momentum ' + m, 54, y + 15, 17, P.dim);
  const x = 487,
    ww = 365;
  line(c, x, y, x + ww, y, P.dim, 2);
  for (let i = 0; i < 5; i++) {
    const xx = x + (ww * i) / 4;
    line(c, xx, y - 4, xx, y + 6, P.dim);
    mono(c, (0.8 + i * 0.05).toFixed(2), xx, y + 24, 13, P.dim, 'center');
  }
  const xx = x + ((w - 0.8) / 0.2) * ww;
  dot(c, xx, y, 8, P.gold);
  mono(c, w.toFixed(2), xx, y - 25, 20, P.gold, 'center');
}
export function momentum(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 1) {
    const backward = cue(k, 1, 'Backward adds derivatives');
    head(c, backward ? 'STATE INSPECTION   /   AFTER BACKWARD' : 'STATE INSPECTION   /   AFTER CLEARING',
      'Which parameters receive a gradient?');
    matrix(c, {
      x: 85,
      y: 213,
      w: 790,
      label: 'Trainable parameters',
      headers: ['parameter', 'on loss path?', 'W.grad'],
      rows: [
        ['router', 'yes', backward ? '∂L/∂W' : 'None'],
        ['unused head', 'no', 'None'],
      ],
    });
    equation(c, backward ? 'loss.backward()' : 'optimizer.zero_grad(set_to_none=True)', 408, false, 23);
    return;
  }
  if (b === 2) {
    const updated = cue(k, 2, 'as it reads the batch');
    head(c, 'STATE INSPECTION   /   FORWARD', 'BatchNorm updates its running mean');
    matrix(c, {
      x: 85, y: 213, w: 790,
      label: 'Training-mode BatchNorm',
      headers: ['running mean', 'batch mean', 'momentum'],
      rows: [[updated ? 0.4 : 0, 4, 0.1]],
    });
    equation(c, updated ? '0.9 × 0 + 0.1 × 4 = 0.4' : 'new mean = 0.9 × old mean + 0.1 × batch mean', 408, false, 23);
    return;
  }
  const moved = cue(k, 4, 'and its momentum buffer'),
    next = cue(k, 4, 'Make two copies'),
    skip = cue(k, 5, 'It stays'),
    zero = cue(k, 5, 'The buffer now holds'),
    done = cue(k, 6, 'Clearing the gradient');
  head(
    c,
    'SGD   /   MOMENTUM 0.9',
    next ? 'Two copies of the same weight' : 'Create the momentum history',
  );
  if (!next) {
    weightRail(c, 275, 'First step', moved ? '1' : 'empty', '1', moved ? 0.9 : 1);
    equation(c, 'learning rate 0.1    ·    w starts at 1', 418, false, 22);
    return;
  }
  weightRail(
    c,
    244,
    skip ? 'Skipped' : 'Empty gradient',
    '1',
    'None',
    loopMomentum(1, null).weight,
  );
  weightRail(
    c,
    364,
    'Zero gradient',
    zero ? '0.9' : '1',
    '0',
    done ? loopMomentum(1, 0).weight : 0.9,
  );
  mono(
    c,
    done
      ? 'w = 0.9 − 0.1 × 0.9'
      : b === 4
        ? 'Which weight moves?'
        : 'momentum ← 0.9 × previous + grad',
    480,
    457,
    21,
    P.gold,
    'center',
  );
}
export function prepareBufferTiming(schedule) {
  const pass = schedule.find(({ beat }) => beat.id === 'c07-b01');
  if (!pass) return;
  // Read the word endings directly to preserve the existing caption cuts.
  return {
    secondCallEnd: pass.words.find(({ text }) => /^time\b/iu.test(text)).end,
    totalWordStart: pass.phraseStart('four'),
  };
}

export function buffer(c, k) {
  const a = cue(k, 1, 'the buffer holds two'),
    two = cue(k, 1, 'The buffer now holds four'),
    clear = cue(k, 2, 'The buffer is empty'),
    again = cue(k, 3, 'Only this last');
  const timing = k.pictureData;
  const predictTotal =
    k.beat.beatIndex === 0 && timing &&
    k.elapsed >= timing.secondCallEnd && k.elapsed < timing.totalWordStart;
  const n = again ? 1 : clear ? 0 : two || predictTotal ? 2 : a ? 1 : 0;
  head(c, 'AUTOGRAD   /   SAME WEIGHT', 'What is still in w.grad?');
  equation(c, 'w = 1       L = w²       dL/dw = 2', 173, false, 24);
  box(c, 79, 223, 802, 162, P.ink, 12);
  txt(c, 'w.grad', 104, 254, 20, P.dim);
  for (let i = 0; i < n; i++) {
    const travel =
      i === 1 && predictTotal
        ? Math.max(0, 1 - (k.elapsed - timing.secondCallEnd) / 0.55) ** 2
        : 0;
    const x = 117 + i * 253 + travel * 170;
    const y = 287 - travel * 92;
    strip(c, x, y, 231, 66, i ? P.gold : P.teal);
    mono(c, 'backward  +2', x + 115, y + 30, 21, P.ink, 'center');
  }
  const total = predictTotal ? '?' : n ? String(n * 2) : 'None';
  mono(c, total, 846, 325, 34, n ? P.gold : P.dim, 'right');
  mono(
    c,
    again
      ? 'one fresh derivative'
      : clear
        ? 'New window: build w² again'
        : two
          ? 'two calls at the same w'
          : 'w stays at 1',
    480,
    441,
    22,
    P.white,
    'center',
  );
}
function shareResult(k, b, phrase, span = 0) {
  const beat = k.beat.beatIndex + 1;
  if (beat !== b) return Number(beat > b);
  k.reveal(phrase, 0, { captionStart: phrase });
  const elapsed = k.elapsed - k.wordCue(phrase).end;
  return elapsed < 0 ? 0 : span ? Math.min(1, elapsed / span) : 1;
}

function microbatchFraction(value) {
  for (const denominator of [1, 2, 3, 4]) {
    const numerator = value * denominator;
    if (Number.isInteger(numerator)) {
      return denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;
    }
  }
  throw new RangeError(`Unexpected microbatch fraction ${value}`);
}

export function shares(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b >= 7) {
    const final = b === 8;
    head(
      c,
      'ACCUMULATION WINDOW',
      final ? 'One scale across the window' : 'Same parameters for both chunks',
    );
    const steps = final
      ? ['scale · backward', 'scale · backward', 'unscale once', 'clip · step']
      : ['forward A+B', 'backward A+B', 'forward C', 'backward C'];
    steps.forEach((s, i) => {
      let x = 48 + i * 220;
      strip(c, x, 224, 204, 95, i < 2 ? P.teal : P.paper);
      txt(c, s, x + 102, 267, 18, P.ink, { align: 'center' });
    });
    line(c, 50, 333, final ? 473 : 477, 333, P.gold, 3);
    txt(
      c,
      final ? 'Fixed loss scale' : 'DDP no_sync() around forward and backward',
      54,
      366,
      21,
      P.gold,
    );
    txt(
      c,
      final ? 'Match the schedule on every rank.' : 'Final backward synchronizes the gradients.',
      54,
      422,
      22,
      P.white,
    );
    return;
  }
  head(c, 'MICROBATCHES   /   ONE UPDATE', 'How much of the loss belongs to C?');
  const showABGradient = shareResult(k, 2, 'either A or B on its own gives a gradient of a half'),
    showCGradient = shareResult(k, 2, 'C gives one'),
    showCShare = shareResult(k, 3, 'C gets half'),
    showABShares = shareResult(k, 3, 'A and B share the other half, one quarter each'),
    showChunkTotal = shareResult(k, 3, 'That makes the gradient three quarters'),
    showCContribution = shareResult(k, 3, 'C alone contributed one half to that total'),
    reweight = shareResult(k, 3, 'The first chunk gets two thirds and C gets one third', 0.26),
    showRowTotal = shareResult(k, 4, 'The gradient becomes two thirds'),
    showSeverity = shareResult(k, 4, 'Severity stays at a half in both runs');
  const chunkWeights = loopMicrobatch(true),
    rowWeights = loopMicrobatch(false),
    colors = [P.teal, P.copper];
  txt(c, 'Standard route · urgency gradient', 55, 134, 19, P.white);
  mono(c, 'W = 0', 903, 134, 19, P.dim, 'right');
  const cards = [
    { id: 'A', x: 67, features: '[+1, +1]', chunk: 0, showGradient: showABGradient },
    { id: 'B', x: 272, features: '[−1, −1]', chunk: 0, showGradient: showABGradient },
    { id: 'C', x: 698, features: '[+2, +1]', chunk: 1, showGradient: showCGradient },
  ];
  for (const { id, x, features, chunk, showGradient } of cards) {
    strip(c, x, 155, 194, 87);
    box(c, x, 155, 194, 5, colors[chunk]);
    txt(c, `Ticket ${id}`, x + 15, 176, 22, P.ink, { font: 'Serif' });
    mono(c, features, x + 15, 203, 19);
    if (showGradient)
      mono(c, 'grad +' + microbatchFraction(chunkWeights.means[chunk][0]), x + 15, 225, 18);
  }
  const barX = 55, barW = 850;
  for (const [i, left, right] of [[0, 67, 466], [1, 698, 892]]) {
    line(c, left, 252, right, 252, colors[i], 2);
    txt(c, `Chunk ${i + 1}`, (left + right) / 2, 268, 17, colors[i], { align: 'center' });
  }
  const moving = reweight > 0 && reweight < 1;
  txt(c, 'Weights in the total loss', barX, 299, 20, P.white);
  if (cue(k, 2, 'If we weight the two chunk means equally')) {
    const rule = moving ? 'Reweight by ticket' : reweight ? 'Equal ticket weights' : 'Equal chunk weights';
    txt(c, rule, 905, 299, 18, P.dim, {
      align: 'right',
    });
  }
  box(c, barX, 315, barW, 43, P.panel, 4);
  if (!showCShare) {
    mono(c, '?', 480, 337, 25, P.dim, 'center');
    return;
  }

  const current = reweight === 1 ? rowWeights : chunkWeights;
  const firstShare = mix(chunkWeights.factors[0], rowWeights.factors[0], reweight);
  const lastShare = mix(chunkWeights.factors[1], rowWeights.factors[1], reweight);
  const shares = showABShares ? [firstShare / 2, firstShare / 2, lastShare] : [firstShare, lastShare];
  const labels = showABShares ? ['A', 'B', 'C'] : ['A + B', 'C'];
  let x = barX;
  shares.forEach((share, i) => {
    const w = barW * share;
    const label = labels[i] + (!moving && (showABShares || i === 1) ? '  ' + microbatchFraction(share) : '');
    box(c, x + 1, 315, w - 2, 43, colors[Number(labels[i] === 'C')], 3);
    mono(c, label, x + w / 2, 337, 23, P.ink, 'center');
    x += w;
  });
  if (!showABShares || moving) return;

  txt(c, 'Share × chunk mean gradient', 55, 380, 18, P.dim);
  current.factors.forEach((factor, i) => {
    const term = microbatchFraction(factor) + ' × ' + microbatchFraction(current.means[i][0]);
    mono(c, term, 142 + i * 241, 412, 26, colors[i], 'center');
  });
  mono(c, '+', 262, 412, 25, P.white, 'center');
  const showTotal = reweight ? showRowTotal : showChunkTotal;
  mono(c, '=', 504, 412, 25, P.white, 'center');
  mono(c, showTotal ? microbatchFraction(current.gradient[0]) : '?', 565, 412, 26, P.gold, 'center');
  if (reweight === 1)
    mono(c, `${microbatchFraction(chunkWeights.gradient[0])} with equal chunks`, 904, 412, 17, P.dim, 'right');

  if (b <= 4 && (reweight ? showRowTotal : showCContribution))
    txt(c, `C contributes ${microbatchFraction(current.contributions[1][0])}`, 383, 446, 18, P.copper, {
      align: 'center',
    });
  if (b === 4 && showSeverity)
    txt(c, `Severity stays at ${microbatchFraction(current.gradient[1])}`, 904, 446, 18, P.dim, {
      align: 'right',
    });
  if (b === 5) txt(c, 'Scale each loss before backward.', 55, 446, 18, P.dim);
  if (b === 6)
    txt(c, 'Use the effective denominator for weighted or ignored targets.', 55, 446, 18, P.dim);
}
export function epoch(c, k) {
  head(c, 'LOSS ACCOUNTING   /   SIX TICKETS', 'Give each row one vote', true);
  const vals = [0.2, 0.2, 0.2, 0.2, 0.5, 0.5],
    res = cue(k, 2, 'Equal weight for each'),
    batchMean = finish(k, 2);
  vals.forEach((v, i) => {
    const x = 56 + i * 142;
    box(c, x, 196, 127, 122, i < 4 ? P.moss : P.red, 3);
    txt(c, 'Ticket ' + (i + 1), x + 63, 224, 16, P.white, { align: 'center' });
    mono(c, v.toFixed(2), x + 63, 277, 32, P.white, 'center');
  });
  const correct = cue(k, 2, 'Now weight by row count');
  const equalBatch = cue(k, 2, 'Each ticket in the last batch');
  if (equalBatch) {
    vals.forEach((v, i) =>
      mono(
        c,
        correct ? 'weight 1/6' : i < 4 ? 'weight 1/8' : 'weight 1/4',
        119 + i * 142,
        300,
        14,
        P.white,
        'center',
      ),
    );
  }
  mono(c, '4 rows × 0.20', 328, 351, 20, P.ink, 'center');
  mono(c, '2 rows × 0.50', 758, 351, 20, P.ink, 'center');
  equation(
    c,
    res
      ? '(0.80 + 1.00) ÷ 6 = ' + epochMean([0.2, 0.5], [4, 2]).toFixed(2)
      : equalBatch
        ? correct
          ? '(4 × 0.20 + 2 × 0.50) ÷ 6'
          : 'Equal batch weights give the last tickets twice the weight.'
        : 'Which tickets gain weight if you average the two means?',
    421,
    true,
    res ? 26 : 20,
  );
  if (batchMean) mono(c, 'Equal batch weights: (0.20 + 0.50) ÷ 2 = 0.35', 480, 471, 18, P.red, 'center');
}
export function fit(c, k) {
  head(c, 'ISOLATION TEST   /   FIXED TRAINING BATCH', 'Can the loop memorize eight tickets?');
  const n = Math.round(120 * cue(k, 2, 'As SGD changes', 5.0)),
    s = fitHistory[n];
  const g = { x: 65, y: 203, w: 470, h: 182, xMax: 120, yMin: 0, yMax: 0.7 };
  txt(c, 'Mean loss on all eight tickets', 65, 165, 17, P.dim);
  plotGrid(c, g, [0, 0.2, 0.4, 0.6]);
  trace(c, fitHistory, n, 'loss', g, P.teal);
  txt(c, 'SGD updates', 298, 433, 17, P.dim, { align: 'center' });
  const x = 594;
  txt(c, 'Predicted route', x, 166, 19, P.white);
  s.predictions.forEach((p, i) => {
    const xx = x + (i % 4) * 69,
      yy = 203 + Math.floor(i / 4) * 78;
    box(c, xx, yy, 61, 63, p.correct ? P.teal : P.copper, 3);
    mono(c, '#' + (i + 1), xx + 30, yy + 17, 13, P.ink, 'center');
    txt(c, p.prediction ? 'Esc' : 'Std', xx + 30, yy + 43, 18, P.ink, { align: 'center' });
  });
  mono(c, s.correct + '/8 correct', x, 391, 22, P.gold);
  mono(c, 'loss ' + s.loss.toFixed(4), x, 430, 19, P.white);
}
