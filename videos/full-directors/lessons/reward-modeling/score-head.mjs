import {
  C,
  stage,
  mono,
  serif,
  text,
  header,
  line,
  rect,
  dot,
  poly,
  paper,
  table,
  fixed,
  share,
  lerp,
} from './art.mjs';
import {
  weights,
  hidden,
  scores,
  pads,
  readout,
  candidateForecast,
  sigmoid,
  stablePairLoss,
  lossSettings,
  marginTarget,
  weakFits,
  tally,
  sharedStep,
} from './examples.mjs';

export function head(g, { beat, cue }) {
  stage(g, true);
  if (beat < 3) {
    header(g, 'CAUSAL DECODER   /   SUPPLIED TOKENS', 'Which position has read the whole reply?');
    const n = beat === 2 ? 3 : Math.min(3, 1 + Math.floor(2 * cue(1, 'as the answer arrives', 1)));
    const words = ['Request', 'a ticket.', 'Wait.'];
    words.forEach((v, i) => {
      const x = 57 + 275 * i;
      paper(g, x, 184, 246, 90, i < n ? C.aqua : C.faint);
      serif(g, i < n ? v : '…', x + 123, 241, 32, C.ink, { align: 'center' });
    });
    const k = n - 1,
      x = 57 + 275 * k + 123;
    line(g, 179, 304, x, 304, C.teal, 4);
    line(g, x, 274, x, 304, C.teal, 3);
    mono(g, 'Read through position ' + k, 56, 363, 24);
    if (cue(2, 'Select that representation'))
      mono(g, 'Final real token  →  h(A) = [2, 0.8]', 56, 432, 27, C.teal);
  } else {
    const i = beat - 3,
      v = hidden[i],
      id = 'AB'[i],
      p = v.map((x, j) => x * weights[j]);
    header(g, 'ONE SHARED HEAD   /   TWO INVENTED COMPONENTS', 'Score for reply ' + id);
    const first = cue(beat, i ? 'The first product' : 'The first component'),
      second = cue(beat, i ? 'the second is' : 'The second contributes'),
      total = cue(beat, i ? 'Their sum' : 'Add the products');
    table(g, {
      columns: [
        ['Component', 0],
        ['Hidden value', 0.29],
        ['Weight', 0.55],
        ['Product', 0.77],
      ],
      rows: v.map((x, j) => [
        'h' + (j + 1),
        x,
        weights[j],
        (j ? second : first) ? fixed(p[j], 1) : '…',
      ]),
      lineHeight: 76,
    });
    if (total)
      mono(
        g,
        'r(' + id + ') = ' + fixed(p[0], 1) + ' + ' + fixed(p[1], 1) + ' = ' + fixed(scores[i], 1),
        57,
        401,
        30,
        C.teal,
      );
    if (i) mono(g, 'A used these same weights: r(A) = 1.8', 57, 454, 20, C.muted);
  }
}
export function padding(g, { beat, cue }) {
  stage(g);
  if (beat <= 3) {
    const swap = cue(2, 'slide the padding', 1.45),
      end = swap === 1,
      between = swap > 0 && !end;
    const read = readout(end),
      scoreKnown = cue(2, 'One plus three gives four');
    header(g, 'READOUT   /   ATTENTION MASK', 'Follow the last real token', true);
    const x = (i) => 72 + 289 * i;
    const dx = lerp(0, 289, swap);
    const xx = [x(0) + dx, x(1) + dx, x(2) - 2 * dx];
    const yy = [229, 229, 229 - 114 * Math.sin(Math.PI * swap)];
    pads.forEach((t, i) => {
      const X = xx[i],
        Y = yy[i];
      paper(g, X, Y, 234, 93, i === 1 ? C.aqua : i === 2 ? C.lilac : C.cream);
      mono(g, t.name + '  /  mask ' + t.mask, X + 14, Y + 30, 17);
      mono(g, '[' + t.v.join(', ') + ']', X + 14, Y + 74, 28);
    });
    [0, 1, 2].forEach((i) =>
      mono(g, 'index ' + i, x(i) + 117, 350, 16, C.gray, { align: 'center' }),
    );
    const headX = xx[1] + 117;
    line(g, headX, 353, headX, 375, C.aqua, 3);
    poly(
      g,
      [
        [headX, 323],
        [headX - 7, 335],
        [headX + 7, 335],
      ],
      C.aqua,
    );
    rect(g, headX - 110, 374, 220, 49, '#161d36', 7);
    mono(g, 'HEAD  [0.5, 1]', headX, 405, 19, C.aqua, { align: 'center' });
    mono(
      g,
      between ? 'Moving padding' : (end ? 'Left' : 'Right') + ' padding',
      58,
      152,
      18,
      C.gray,
    );
    mono(
      g,
      scoreKnown ? '[2, 3] · [0.5, 1] = ' + read.score : '[2, 3] · [0.5, 1] = ?',
      58,
      464,
      25,
      C.light,
    );
    if (beat === 3 && cue(3, 'rejects an empty sequence'))
      mono(g, '[0,0,0] → reject', 889, 462, 18, C.coral, { align: 'right' });
  } else if (beat === 4) {
    header(g, 'CAUSAL ATTENTION', 'A scoring token can also read the entire answer', true);
    ['Request', 'a ticket.', 'Wait.', 'SCORE'].forEach((v, i) => {
      const x = 64 + 219 * i;
      paper(g, x, 194, 187, 83, i === 3 ? C.aqua : C.page);
      mono(g, v, x + 93, 246, 23, C.ink, { align: 'center' });
      line(g, x + 93, 280, x + 93, 331, C.aqua, 2);
      dot(g, x + 93, 331, 5, C.aqua);
    });
    line(g, 157, 331, 814, 331, C.aqua, 3);
    mono(g, 'Visible to SCORE: 0, 1, 2 and itself (the diagonal)', 62, 410, 21, C.light);
  } else {
    header(g, 'SCORER ARTIFACT', 'Keep the trained projection with its backbone', true);
    const names = ['Base revision', 'LoRA adapters', 'Scalar head', 'Tokenizer + template'];
    names.forEach((v, i) => {
      const x = 53 + 222 * i;
      paper(g, x, 185, 206, 124, i === 2 ? C.aqua : C.page);
      mono(g, ['BASE', 'ADAPTER', 'WEIGHTS', 'INPUT'][i], x + 14, 218, 16, C.teal);
      serif(g, v, x + 14, 270, 23, C.ink, { width: 178 });
    });
    if (beat === 5) {
      mono(g, 'r = w · h + b', 57, 379, 29, C.light);
      mono(g, '(w·hA + b) − (w·hB + b) = w·(hA − hB)    ∂L/∂b = 0', 57, 441, 22, C.aqua);
    } else {
      mono(g, 'Save → reload → replay held-out inputs', 57, 382, 26, C.light);
      mono(g, 'Compare scores and pair margins', 57, 442, 22, C.aqua);
    }
  }
}
function curve(
  g,
  { x = 420, y = 153, w = 438, h = 215, f, min = -4, max = 4, yMax = 1, point, color = C.teal },
) {
  const X = (v) => x + (w * (v - min)) / (max - min),
    Y = (v) => y + h * (1 - v / yMax);
  line(g, x, y, x, y + h, C.muted);
  line(g, x, y + h, x + w, y + h, C.muted);
  mono(g, 'Δ', x + w + 24, y + h + 7, 18, C.muted);
  for (const v of [0, yMax === 1 ? 1 : 4])
    mono(g, v, x - 11, Y(v) + 6, 16, C.muted, { align: 'right' });
  for (const v of [min, 0, max]) {
    line(g, X(v), y + h, X(v), y + h + 5, C.muted, 1);
    mono(g, v, X(v), y + h + 24, 17, C.muted, { align: 'center' });
  }
  g.beginPath();
  for (let i = 0; i <= 100; i++) {
    const v = min + ((max - min) * i) / 100;
    const xx = X(v),
      yy = Y(f(v));
    if (i) g.lineTo(xx, yy);
    else g.moveTo(xx, yy);
  }
  g.strokeStyle = color;
  g.lineWidth = 3;
  g.stroke();
  line(g, X(point), Y(f(point)), X(point), y + h, C.edge, 1.4);
  dot(g, X(point), Y(f(point)), 8, color);
}
export function probability(g, { beat, cue }) {
  stage(g, true);
  header(g, 'BRADLEY–TERRY   /   FIXED ANSWERS A AND B', 'How much of the preference goes to A?');
  const equal = beat === 3 && cue(3, 'Equal scores') && !cue(3, 'Bring A back'),
    pair = [equal ? scores[1] : scores[0], scores[1]],
    { gap, p } = candidateForecast(pair);
  const strengths = pair.map(Math.exp);
  ['A', 'B'].forEach((v, i) => {
    const y = 181 + i * 98;
    mono(g, v, 54, y + 20, 28, C.teal);
    serif(g, 'r = ' + fixed(pair[i], 1), 101, y + 20, 31);
    if (beat >= 2) mono(g, 'exp(r) = ' + fixed(strengths[i]), 103, y + 56, 20, C.muted);
  });
  const ready = cue(1, 'leaves a margin');
  if (ready) mono(g, 'Δ = ' + fixed(gap, 1), 55, 418, 32, C.teal);
  if (beat >= 2) {
    curve(g, { f: sigmoid, point: gap });
    mono(g, 'p(A) = σ(Δ) = ' + fixed(p, 4), 419, 445, 24, C.teal);
    mono(g, 'p(A)', 419, 140, 17, C.muted);
    if (cue(2, 'Divide the chosen answer'))
      mono(
        g,
        fixed(strengths[0]) +
          ' / (' +
          fixed(strengths[0]) +
          ' + ' +
          fixed(strengths[1]) +
          ') ≈ ' +
          fixed(p, 2),
        54,
        465,
        19,
        C.muted,
      );
    if (cue(3, 'Three reviewers pick A')) mono(g, 'Votes: A  A  A  B', 419, 481, 18, C.muted);
  } else {
    line(g, 398, 264, 857, 264, C.muted, 2);
    const map = (v) => 398 + v * 215;
    pair.forEach((v, i) => {
      dot(g, map(v), 264, 9, i ? C.red : C.teal);
      mono(g, (i ? 'B' : 'A') + ' ' + fixed(v, 1), map(v), 233, 21, i ? C.red : C.teal, {
        align: 'center',
      });
    });
    mono(g, 'chosen − rejected', 413, 347, 24);
  }
}
export function loss(g, { beat, cue }) {
  stage(g, true);
  header(g, 'OBSERVED OUTCOME   /   A WON', 'What does the observed win cost?');
  const idx =
    beat === 2 && !cue(2, 'minus two') ? 0 : beat === 3 && !cue(3, 'plus two') ? 1 : beat - 1;
  const d = lossSettings[idx],
    p = sigmoid(d),
    l = stablePairLoss(d);
  mono(g, 'MARGIN', 54, 196, 17, C.muted);
  serif(g, fixed(d, 1), 50, 266, 70, C.ink);
  mono(g, 'p(A) = ' + share(p), 54, 335, 26, C.teal);
  mono(g, 'Δ = r(A) − r(B)', 54, 406, 20, C.muted);
  mono(g, '−ln p(A)', 420, 145, 18, C.muted);
  curve(g, { f: stablePairLoss, point: d, yMax: 4.05, color: C.red });
  mono(g, 'Loss = −ln(' + fixed(p, 4) + ') ≈ ' + fixed(l), 420, 447, 22, C.red);
}
export function stable(g, { beat, cue }) {
  stage(g, true);
  if (beat <= 2) {
    header(g, 'STRICT WIN   /   NATURAL LOG', 'Evaluate the loss at both extremes');
    mono(g, 'L = max(−Δ, 0) + log1p(exp(−|Δ|))', 54, 173, 30, C.teal);
    const known = cue(2, 'minus one thousand'),
      pos = cue(2, 'plus one thousand');
    table(g, {
      y: 225,
      columns: [
        ['Δ', 0],
        ['max(−Δ,0)', 0.23],
        ['−|Δ|', 0.53],
        ['Loss', 0.78],
      ],
      rows: [-1000, 1000].map((d, i) => [
        d,
        Math.max(-d, 0),
        -Math.abs(d),
        (i ? pos : known) ? stablePairLoss(d) : '?',
      ]),
      lineHeight: 75,
    });
    mono(g, 'Winner label    ·    exponent ≤ 0 for every Δ', 52, 449, 19, C.muted);
  } else if (beat < 6) {
    header(g, 'RATING MARGIN   /   m = 1', 'How far apart must the scores be?');
    const target = cue(5, 'three point one nine seven'),
      d = target ? marginTarget(1, 0.9) : 1,
      e = d - 1;
    mono(g, 'Effective logit = Δ − m', 55, 169, 26);
    const X = (v) => 83 + v * 193;
    line(g, X(0), 269, X(4), 269, C.muted, 3);
    for (let v = 0; v <= 4; v++) {
      line(g, X(v), 258, X(v), 282, C.muted, 2);
      mono(g, v, X(v), 311, 18, C.muted, { align: 'center' });
    }
    dot(g, X(d), 269, 10, C.teal);
    mono(g, 'Δ = ' + fixed(d, target ? 3 : 1), X(d), 239, 22, C.teal, { align: 'center' });
    mono(g, 'p = σ(' + fixed(e, 3) + ') = ' + fixed(sigmoid(e)), 54, 374, 26, C.teal);
    if (beat === 3) mono(g, 'L = ln 2      dL/dΔ = −0.5 at Δ = m', 56, 438, 23);
    else mono(g, 'For 0 < ρ < 1:    Δ = m + ln(ρ / (1 − ρ))', 56, 438, 22);
    if (cue(5, 'Llama Two'))
      mono(g, 'Llama 2   weakest rating: m = 0', 55, 478, 18, C.muted);
    if (cue(5, 'Llama Three'))
      mono(g, 'Llama 3   dropped the margin', 537, 478, 18, C.muted);
  } else {
    header(g, 'WEAK PREFERENCE   /   SAME TRAINING PAIRS', 'Which fit predicts the held-out votes better?');
    const trial = cue(6, 'Fit a second scorer');
    const control = cue(6, 'Compare their forecasts');
    const forecasts = cue(6, 'Three reviewers');
    const votes = cue(6, 'Count the loss');
    const miss = cue(6, 'Count the loss');
    const means = [cue(6, 'The second averages'), cue(6, 'Which margin')];
    const choosing = cue(6, 'The zero-margin fit');
    const done = cue(6, 'Repeat the comparison');
    mono(g, 'ONE HELD-OUT PAIR', 55, 166, 17, C.muted);
    if (votes) tally.forEach((aWon, i) => {
      const x = 285 + i * 84;
      paper(g, x, 137, 65, 46, aWon ? C.aqua : C.lilac);
      mono(g, aWon ? 'A' : 'B', x + 32, 169, 23, C.ink, { align: 'center' });
    });
    table(g, {
      y: 238,
      columns: [['Training margin', 0], ['Forecast p(A)', 0.25], ['Loss on A', 0.49], ['Loss on B', 0.67], ['Mean loss', 0.85]],
      rows: weakFits.map((fit, i) => [
        (i ? control : trial) ? 'm = ' + fit.margin : '…',
        forecasts ? share(fit.p) : '…',
        miss ? fixed(fit.lossA, 3) : '…',
        miss ? fixed(fit.lossB, 3) : '…',
        means[i] ? fixed(fit.meanLoss, 3) : '…',
      ]),
      lineHeight: 65,
    });
    if (miss) mono(g, 'Mean = (3 × loss on A + loss on B) / 4, using unrounded losses', 53, 423, 19, C.muted);
    if (choosing && !done) line(g, 778, 378, 898, 378, C.teal, 3);
    if (done) {
      const winner = weakFits[0].meanLoss < weakFits[1].meanLoss ? weakFits[0] : weakFits[1];
      mono(g, 'Lower mean loss on these four votes: m = ' + winner.margin, 53, 466, 23, C.teal);
    }
  }
}
function sharedGradient(g, clock) {
  header(g, 'SHARED WEIGHT   /   r = w × h', 'How does one weight move both scores?', true);
  const heard = (phrase) => clock.elapsed + 1e-9 >= clock.wordCue(phrase).end;
  const { initialWeight, learningRate, features, before, grad, next, a, b } = sharedStep;
  const after = [a, b];
  const changes = after.map((score, i) => score - before[i]);
  const motion = clock.wordCue('Both scores fall, but the rejected falls farther');
  const progress = clock.reveal('Both scores fall', motion.end - motion.start, {
    captionStart: 'Both scores fall',
  });
  const featuresKnown = heard('the rejected feature is two');
  const scoresKnown = heard('scores minus one and minus two');
  const marginGrows = heard('Their margin improves');
  const fmt = (value, digits) => fixed(value, digits).replace('-', '−');

  paper(g, 51, 132, 858, 235);
  mono(g, 'Change from starting score', 226, 166, 22, C.ink);
  mono(g, 'Before → after', 685, 166, 22, C.ink);
  const tick = 0.02;
  const tickCount = Math.ceil(-Math.min(...changes) / tick);
  const X = (change) => 616 + (change / (tickCount * tick)) * 372;
  for (let i = 0; i <= tickCount; i++) {
    const change = -i * tick;
    const x = X(change);
    line(g, x, 183, x, 322, i === 0 ? C.muted : C.edge, i === 0 ? 2 : 1);
    mono(g, i === 0 ? '0' : fmt(change, 2), x, 351, 18, C.muted, { align: 'center' });
  }

  const rowY = [215, 295];
  ['Chosen', 'Rejected'].forEach((label, i) => {
    const y = rowY[i];
    const color = i ? C.red : C.teal;
    text(g, label, 76, y + 3, 24, color);
    if (featuresKnown) mono(g, 'h = ' + features[i], 76, y + 26, 19, C.muted);
    if (scoresKnown) {
      const startX = X(0);
      const endX = X(changes[i] * progress);
      if (progress > 0) line(g, startX, y, endX, y, color, 7);
      dot(g, endX, y, 8, color);
      const score = fmt(before[i], 0) + (progress === 1 ? ' → ≈' + fmt(after[i], 3) : '');
      mono(g, score, 663, y + 8, 22, color);
    }
  });
  if (marginGrows) {
    const [chosenEnd, rejectedEnd] = changes.map(X);
    const bracketY = (rowY[0] + rowY[1]) / 2 + 8;
    line(g, chosenEnd, rowY[0] + 11, chosenEnd, bracketY, C.muted);
    line(g, rejectedEnd, rowY[1] - 11, rejectedEnd, bracketY, C.muted);
    line(g, rejectedEnd, bracketY, chosenEnd, bracketY, C.muted);
    mono(g, 'Extra drop', (chosenEnd + rejectedEnd) / 2, bracketY - 8, 20, C.ink, {
      align: 'center',
    });
  }

  if (heard('one shared weight, minus one')) {
    const updated = heard('minus one point zero two seven');
    const weight = updated ? '≈ ' + fmt(next, 3) : '= ' + fmt(initialWeight, 0);
    mono(g, 'w ' + weight, 55, 409, 24, C.light);
  }
  if (heard('zero point two six nine'))
    mono(g, '∂L/∂w at w = ' + fmt(initialWeight, 0) + '  ≈ ' + fixed(grad, 3), 322, 409, 21, C.light);
  if (heard('learning rate zero point one'))
    mono(g, 'η = ' + fixed(learningRate, 1), 775, 409, 21, C.light);
  if (heard('a positive margin of one')) {
    const margin = fixed(before[0] - before[1], 0);
    const label = marginGrows
      ? 'Margin rA − rB   ' + margin + ' → ≈' + fixed(a - b, 3)
      : 'Starting margin rA − rB = ' + margin;
    mono(g, label, 55, 455, 27, C.aqua);
  }
}

export function gradient(g, { beat, cue, clock }) {
  stage(g);
  if (beat === 3) {
    sharedGradient(g, clock);
    return;
  }
  header(g, 'INDEPENDENT SCORE COORDINATES', 'Which way does descent move the two scores?', true);
  const d = beat === 1 ? 1.1 : -2,
    size = 1 - sigmoid(d),
    move = cue(2, 'illustrative output-space step', 1);
  // The two-output example takes a unit step in each independent coordinate.
  const a = beat === 1 ? 1.8 : 1 + move * size,
    b = beat === 1 ? 0.7 : 3 - move * size;
  paper(g, 51, 153, 858, 242);
  const X = (v) => 96 + v * 234;
  [
    ['Chosen', a, C.teal],
    ['Rejected', b, C.red],
  ].forEach(([label, v, col], i) => {
    const y = 218 + i * 104;
    line(g, 85, y, 880, y, C.edge, 2);
    dot(g, X(v), y, 10, col);
    mono(g, label + '   ' + fixed(v), X(v), y - 20, 21, col, {
      align: X(v) > 680 ? 'right' : 'left',
    });
  });
  mono(g, '∂L/∂rA = σ(Δ) − 1     ∂L/∂rB = 1 − σ(Δ)', 53, 437, 22, C.light);
  if (beat === 2)
    mono(
      g,
      'Initial |gradient| = ' + fixed(size, 3) + '    Current gap = ' + fixed(a - b),
      54,
      479,
      19,
      C.aqua,
    );
}
