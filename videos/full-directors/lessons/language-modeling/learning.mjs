import {
  C,
  rect,
  line,
  type,
  tag,
  big,
  token,
  row,
  rail,
  ticks,
  bracket,
  heading,
  cue,
  hatching,
  arrow,
  animal,
  dot,
  sum,
  fixed,
  pct,
} from './drawing.mjs';
import {
  rows,
  catPath,
  comments,
  CORPUS,
  fullVocab,
  following,
  tally,
  fit,
  fittedPrediction,
  localGradientCredit,
  softmax,
} from './examples.mjs';

export function opening(c, k) {
  const commit = cue(k, 2, 'Put sat on the page', 0.62);
  const children = cue(k, 2, 'Only the blue width', 0.75);
  const cut = cue(k, 3, 'Cut the blue strip', 1.1);
  const showPercent = k.beat.beatIndex === 3 && k.reveal('forty-eight percent', 0, { captionStart: false });
  const scored = cue(k, 3, 'Multiply sixty percent', 0.32);
  const w = 800,
    x = 74,
    y = 252;
  const choices = rows['The cat'],
    part = w * choices[0][1];
  heading(c, 'What follows “The cat”?', 'A line of movable type');
  big(c, 'The cat', x, 176, 48);
  c.save();
  c.globalAlpha = commit;
  big(c, 'sat', 245, 176, 48, C.blue);
  c.restore();
  rect(c, 237 + 89 * commit, 150, 3, 53, C.red);
  animal(c, 767, 144, 0.92, 'cat', commit === 1 ? 'sat' : 'stand');
  rail(
    c,
    x,
    y,
    w,
    56,
    choices.map(([t, p]) => [t + '  ' + pct(p), p]),
  );
  ticks(c, x, y + 62, w, 20, 5);
  if (children) {
    line(c, x, 330, x, 357, C.blue, 2);
    line(c, x + part, 330, x + part, 357, C.blue, 2);
    rect(c, x, 354, part, 49, C.blue);
    if (cut) {
      const end = rows['The cat sat'][0][1];
      rect(c, x, 354, part * end, 49, C.teal);
      for (let i = 1; i < 5; i++)
        line(
          c,
          x + (i * part) / 5,
          354,
          x + (i * part) / 5,
          354 + (i === 4 ? 49 : 10) * cut,
          C.cream,
          2,
        );
      if (cut === 1) {
        type(c, 'end', x + (part * end) / 2, 379, 22, C.cream, { align: 'center' });
        type(c, 'beside', x + (part * (1 + end)) / 2, 379, 18, C.cream, { align: 'center' });
      }
    } else
      type(c, 'Where does end meet beside?', x + part / 2, 379, 20, C.cream, { align: 'center' });
    if (showPercent) {
      const label = scored ? pct(choices[0][1]) + ' × ⅘  =  ' + pct(catPath) : pct(catPath);
      bracket(c, x, 414, w * catPath, label);
    }
  }
}

export function tokens(c, k) {
  heading(c, 'Which word is hidden?', 'Recorded sentence');
  const open = cue(k, 1, 'Lift the cover', 0.85),
    id = cue(k, 0, 'numerical ID', 0.5);
  for (const [i, word] of ['The', 'cat', 'sat'].entries()) {
    const x = 105 + i * 251;
    token(c, word, x, 235, 211, { h: 83, size: 48, fill: i === 2 ? C.mint : C.cream });
    if (id)
      type(c, 'ID ' + [12, 31, 8][i], x + 105, 358, 25, C.muted, { face: 'Mono', align: 'center' });
  }
  rect(c, 605, 222 - 72 * open, 213, 159 * (1 - open), C.blue);
  if (open === 0) type(c, 'under cover', 711, 301, 25, C.cream, { align: 'center' });
  bracket(c, 105, 391, 462, 'visible prefix', C.blue);
  if (open === 1) bracket(c, 607, 391, 211, 'observed target');
}
export function counts(c, k) {
  heading(c, 'Which words followed cat?', 'Corpus of three observations');
  const hits = ['First', 'Second', 'Third'].map((q) => cue(k, 0, q, 0.5));
  const n = hits.filter((t) => t === 1).length,
    b = k.beat.beatIndex;
  const smooth = cue(k, 2, 'Add one to every count', 0.7) === 1;
  const verbs = ['sat', 'slept', 'ate'],
    counts = tally(following(CORPUS.slice(0, n), ['cat']), verbs);
  const entries = tally(following(CORPUS.slice(0, n), ['cat']), verbs, Number(smooth));
  tag(c, 'Record', 55, 163);
  tag(c, smooth ? 'Counts with one added to every bin' : 'Counters collected', 486, 163);
  for (let i = 0; i < 3; i++) {
    const y = 216 + i * 84;
    type(c, n > i ? CORPUS[i] : '· · ·', 55, y, 31, n > i ? C.ink : C.line, { face: 'Serif' });
    line(c, 55, y + 31, 385, y + 31);
    type(c, verbs[i], 470, y, 25, C.ink, { face: 'Serif' });
    for (let j = 0; j < entries[i]; j++)
      dot(c, 587 + j * 36, y, 13, j < counts[i] ? C.blue : C.gold);
    if (b > 0) type(c, entries[i] + ' / ' + sum(entries), 830, y, 23, C.teal, { face: 'Mono' });
  }
  if (smooth) type(c, 'Each gold counter is one pseudo-count.', 486, 465, 20, C.muted);
}
export function vocabulary(c, k) {
  const b = k.beat.beatIndex,
    added = cue(k, 4, 'function returns exception', 0.5) === 1;
  const records = added ? [...comments, 'function returns exception'] : comments;
  const smoothing = b === 2 || b === 3,
    full = b === 3;
  const vocab = full ? fullVocab : fullVocab.slice(0, 4);
  const counts = tally(following(records, ['returns']), vocab);
  const adjusted = counts.map((n) => n + Number(smoothing));
  heading(c, 'How large is the denominator?', 'Counting code comments');
  tag(c, 'Observed comments', 43, 159);
  records.forEach((s, i) => {
    const y = 202 + i * 37;
    type(c, s, 44, y, 19, i === 6 ? C.red : C.ink, { face: 'Mono' });
    line(c, 44, y + 21, 344, y + 21);
  });
  tag(
    c,
    full ? 'Ten eligible outputs' : smoothing ? 'Four eligible outputs' : 'Successors of returns',
    409,
    159,
  );
  vocab.forEach((s, i) => {
    const x = 410 + Math.floor(i / 5) * 253,
      y = 205 + (full ? 43 : 54) * (i % 5);
    type(c, s, x, y, full ? 17 : 22, C.ink, { face: 'Serif' });
    for (let j = 0; j < adjusted[i]; j++)
      dot(c, x + 113 + j * (full ? 15 : 21), y, full ? 5.8 : 8, j < counts[i] ? C.blue : C.gold);
  });
  const total = sum(adjusted),
    ix = vocab.indexOf('exception');
  line(c, 410, 396, 914, 396);
  if (b === 0) big(c, '6 observed transitions', 410, 418, 28);
  else if (b === 1) type(c, 'P(exception) = 0    ·    −ln(0) = ∞', 410, 418, 23, C.red);
  else
    type(c, 'P(exception)  =  ' + adjusted[ix] + ' / ' + total, 410, 418, 28, C.teal, {
      face: 'Mono',
    });
}
export function sparse(c, k) {
  const b = k.beat.beatIndex;
  const title = ['What follows each recorded prefix?', 'How many four-token tuples are possible?'];
  heading(c, title[b] ?? 'What follows “error returns”?', 'Looking up a history');
  if (b === 1) {
    tag(c, 'Four-token tuples', 55, 174);
    for (let i = 0; i < 4; i++) {
      token(c, '50,000', 62 + 217 * i, 224, 165, { size: 32 });
      if (i < 3) type(c, '×', 245 + 217 * i, 254, 27);
    }
    big(c, '6.25 × 10¹⁸ possible tuples', 62, 357, 40);
    type(c, 'A sparse table keeps observed entries.', 63, 415, 24, C.muted);
    return;
  }
  const back = cue(k, 2, 'Back off one word', 0.65);
  const cases =
    b === 0
      ? [
          ['function', 'returns'],
          ['test', 'returns'],
        ]
      : [['error', 'returns'], ['returns']];
  cases.forEach((prefix, i) => {
    const x = 62 + i * 460;
    tag(c, b === 0 ? 'Observed prefix' : i ? 'Shorter history' : 'Longer history', x, 180);
    big(c, prefix.join(' '), x, 230, 37);
    line(c, x, 265, x + 362, 265);
    const words = following(comments, prefix);
    if (i === 1 && b >= 2 && !back) return;
    if (!words.length) type(c, 'No matching comments', x, 323, 23, C.red);
    else {
      for (const [j, t] of [...new Set(words)].entries()) {
        const ct = words.filter((w) => w === t).length;
        type(c, t, x, 311 + j * 49, 24);
        for (let u = 0; u < ct; u++) dot(c, x + 150 + u * 28, 311 + j * 49, 9, C.teal);
      }
    }
  });
  if (b >= 2 && back) arrow(c, 415, 232, 498, 232, C.red);
}
export function adjective(c, k) {
  const swap = cue(k, 1, 'Replace tired with hungry', 0.6),
    hungry = swap >= 0.5;
  const adjective = hungry ? 'hungry' : 'tired',
    h = hungry ? 2 : -2,
    weights = [0, -1, 1],
    scores = weights.map((w) => h * w),
    p = softmax(scores);
  const known = cue(k, 0, 'Multiply the tired embedding', 0.6);
  heading(c, 'The same cat, a different prediction', 'A shared three-verb head');
  big(c, 'The ' + adjective + ' cat', 55, 199, 44);
  animal(c, 718, 141, 1.1, 'cat', hungry ? 'stand' : 'slept');
  tag(c, 'Adjective embedding', 57, 279);
  type(c, String(h), 255, 279, 29, C.blue, { face: 'Mono' });
  ['sat', 'slept', 'ate'].forEach((w, i) => {
    const x = 58 + i * 294;
    type(c, w, x, 331, 28, C.ink, { face: 'Serif' });
    if (known) {
      type(c, h + ' × ' + weights[i] + ' = ' + scores[i], x, 373, 22, C.muted, { face: 'Mono' });
      rect(c, x, 410, 245, 20, C.faint);
      rect(c, x, 410, 245 * p[i], 20, i === p.indexOf(Math.max(...p)) ? C.teal : C.blue);
      type(c, pct(p[i]), x + 245, 386, 25, C.ink, { align: 'right' });
    }
  });
}
export function neural(c, k) {
  const b = k.beat.beatIndex,
    swap = cue(k, 4, 'Swap function for test') > 0.5,
    first = swap ? 'test' : 'function';
  const prediction = fittedPrediction([first, 'returns']);
  heading(c, 'Two words feed one shared map', 'Fitted neural n-gram');
  if (b <= 1) {
    [first, 'returns'].forEach((word, i) => {
      big(c, word, 52, 202 + i * 89, 30);
      fit.embeddings[fit.vocab.indexOf(word)].forEach((v, j) => {
        const x = 220 + j * 66;
        rect(c, x, 180 + i * 89, 60, 43, v < 0 ? C.rose : C.mint);
        type(c, fixed(v, 2), x + 30, 202 + i * 89, 15, C.ink, { face: 'Mono', align: 'center' });
      });
    });
    tag(c, 'Shared output map', 672, 160);
    for (let i = 0; i < 12; i++)
      for (let j = 0; j < 8; j++)
        rect(c, 687 + j * 17, 187 + i * 12, 14, 10, fit.weights[i][j] < 0 ? C.plum : C.teal);
    bracket(c, 222, 338, 389, '2 × 6 features');
    bracket(c, 685, 341, 135, '12 × 8');
    if (b === 1) big(c, '48 embedding values + 96 weights + 8 biases = 152', 52, 449, 29);
  } else if (b === 2) {
    tag(c, 'Weighted contributions to value', 52, 169);
    const terms = [...prediction.valueTerms, prediction.valueBias];
    const end = Math.max(0, Math.min(13, Math.floor(cue(k, 2, 'multiply each', 3) * 13)));
    let v = 0;
    terms.forEach((t, i) => {
      const x = 55 + i * 62,
        y = 396 - v * 23,
        h = -t * 23;
      if (i < end) {
        rect(c, x, Math.min(y, y + h), 44, Math.max(1, Math.abs(h)), t >= 0 ? C.teal : C.red);
        line(c, x + 44, y + h, x + 62, y + h);
        v += t;
      }
      type(c, i === 12 ? 'bias' : String(i + 1), x + 21, 428, 15, C.muted, { align: 'center' });
    });
    if (end === 13) type(c, 'value logit   ' + fixed(v, 3), 595, 172, 25, C.teal);
  } else {
    big(c, first + ' returns', 52, 180, 35);
    tag(c, 'Eight logits enter softmax', 51, 235);
    fit.vocab.forEach((word, i) => {
      const x = 52 + (i % 4) * 217,
        y = 284 + Math.floor(i / 4) * 96;
      type(c, word, x, y, 21, C.ink, { face: 'Serif' });
      type(c, fixed(prediction.logits[i], 3), x + 109, y, 16, C.muted, { face: 'Mono' });
      rect(c, x, y + 20, 188, 14, C.faint);
      rect(c, x, y + 20, 188 * prediction.probabilities[i], 14, C.teal);
      type(c, (prediction.probabilities[i] * 100).toFixed(2) + '%', x, y + 52, 16, C.teal);
    });
  }
}
export function gradient(c, k) {
  const b = k.beat.beatIndex,
    g = localGradientCredit();
  const title = b < 3 ? 'Which score should training raise?'
    : b < 5 ? 'What gradient reaches each weight?'
    : b === 5 ? 'What gradient reaches the first feature?'
    : 'Where do the embedding gradients go?';
  heading(c, title, b < 6 ? 'Credit for one observed C' : 'Embedding gradients in the eight-output model');
  if (b <= 2) {
    const minus = cue(k, 1, 'subtract one', 0.9);
    const label = minus === 0 ? 'Model probability  ·  recorded token C'
      : minus < 1 ? 'Subtracting the target indicator for C'
      : 'Logit gradient  ·  probability minus target indicator';
    tag(c, label, 58, 175);
    const X = (v) => 507 + v * 390;
    [-1, -0.5, 0, 0.5, 1].forEach((v) => {
      line(c, X(v), 213, X(v), 402, C.line);
      type(c, String(v), X(v), 420, 17, C.muted, { align: 'center' });
    });
    g.probabilities.forEach((p, i) => {
      const y = 254 + i * 68,
        v = p - (i === 2 ? minus : 0);
      type(c, 'ABC'[i], 60, y, 26, C.ink, { weight: 700 });
      line(c, X(0), y, X(v), y, i === 2 ? C.blue : C.teal, 7);
      dot(c, X(v), y, 11, i === 2 ? C.blue : C.teal);
      type(c, fixed(v, 1), X(v) + 16, y - 16, 18, C.ink, { face: 'Mono' });
    });
  } else if (b < 5) {
    tag(c, 'Features', 46, 169);
    tag(c, 'Gradient at each output', 278, 169);
    g.residual.forEach((v, i) =>
      type(c, 'ABC'[i] + '   ' + fixed(v, 1), 280 + i * 198, 217, 23, C.teal),
    );
    g.input.forEach((x, i) => {
      const y = 282 + i * 78;
      token(c, String(x), 54, y - 22, 89, { h: 43, fill: C.sand });
      g.weightGradients[i].forEach((v, j) => {
        if (b > 3 || j === 2)
          type(
            c,
            x + ' × ' + fixed(g.residual[j], 1) + ' = ' + fixed(v, 1),
            215 + j * 211,
            y,
            18,
            j === 2 ? C.blue : C.ink,
            { face: 'Mono' },
          );
      });
    });
  } else if (b === 5) {
    const weights = g.weights[0];
    const terms = weights.map((w, j) => w * g.residual[j]);
    const multiplied = cue(k, b, 'Multiply down each column', 0);
    const added = cue(k, b, 'minus point three nine', 0);
    tag(c, 'Output', 55, 166);
    type(c, 'Output gradient', 55, 219, 22, C.teal);
    type(c, 'Forward weight', 55, 282, 22, C.blue);
    type(c, 'from feature 1', 55, 310, 17, C.muted);
    weights.forEach((w, j) => {
      const x = 315 + 203 * j;
      tag(c, 'ABC'[j], x - 5, 166);
      type(c, fixed(g.residual[j], 1), x, 219, 25, C.teal, { align: 'center', face: 'Mono' });
      token(c, fixed(w, 1), x - 64, 259, 128, { h: 49, fill: C.sand, face: 'Mono' });
      if (multiplied) {
        line(c, x - 61, 329, x + 61, 329);
        type(c, fixed(terms[j]), x, 368, 25, C.ink, { align: 'center', face: 'Mono' });
      }
    });
    if (multiplied) type(c, 'Contribution', 55, 368, 22);
    if (added) {
      const sumText = terms.map((term, i) => i === 0 ? fixed(term)
        : (term < 0 ? ' − ' : ' + ') + fixed(Math.abs(term))).join('');
      type(c, 'Feature 1 gradient', 55, 453, 23, C.blue);
      type(c, sumText + ' = ' + fixed(g.inputGradient[0]), 274, 453, 27, C.blue, { face: 'Mono' });
    }
  } else {
    big(c, 'function  returns', 54, 185, 34);
    for (let i = 0; i < 12; i++) rect(c, 58 + i * 68, 250, 59, 38, i < 6 ? C.blue : C.teal);
    bracket(c, 58, 299, 399, 'gradient for function', C.blue);
    bracket(c, 466, 299, 399, 'gradient for returns');
    type(
      c,
      b === 6
        ? 'Accumulate each lookup into its embedding row.'
        : 'Sum six examples, divide by six, then update with η = 0.4.',
      58,
      418,
      26,
    );
  }
}
export function conflict(c, k) {
  const b = k.beat.beatIndex,
    more = b >= 2,
    observed = more ? ['value', 'value', 'exception'] : ['result', 'error'];
  const p = more ? 2 / 3 : 0.5;
  heading(c, 'Two endings share one prefix', 'The empirical loss floor');
  big(c, more ? 'function returns' : 'test returns', 55, 187, 35);
  observed.forEach((w, i) =>
    token(c, w, 55, 232 + i * 60, 220, { h: 45, fill: w === observed[0] ? C.mint : C.rose }),
  );
  const left = 392,
    top = 190,
    w = 462,
    h = 193,
    loss = (q) => -(p * Math.log(q) + (1 - p) * Math.log(1 - q));
  tag(c, 'Mean loss at this prefix (nats)', left, 153);
  for (const q of [0, 0.5, 1])
    type(c, String(q), left + w * q, top + h + 14, 14, C.muted, { align: 'center' });
  for (const n of [0, 1, 2])
    type(c, String(n), left - 14, top + h - (h * n) / 2.4, 14, C.muted, { align: 'right' });
  line(c, left, top + h, left + w, top + h, C.muted);
  line(c, left, top, left, top + h, C.muted);
  c.beginPath();
  for (let i = 1; i < 100; i++) {
    const value = Math.min(2.4, loss(i / 100)),
      x = left + (w * i) / 100,
      y = top + h - (h * value) / 2.4;
    if (i === 1) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.lineWidth = 3;
  c.strokeStyle = C.blue;
  c.stroke();
  const y = top + h - (h * loss(p)) / 2.4;
  if (cue(k, more ? 2 : 0, more ? 'two thirds versus one third' : 'one half each') === 1) {
    dot(c, left + w * p, y, 8, C.red);
    type(c, fixed(loss(p), 3) + ' nats', left + w * p, y - 24, 20, C.red, { align: 'center' });
  }
  type(c, 'P(' + observed[0] + ')', left + w / 2, 424, 20, C.muted, { align: 'center' });
  if (b === 1) {
    type(c, 'Six records  ·  nats per target', 55, 380, 18, C.muted);
    type(c, '(2 × ln 2) / 6  ≈  0.231', 55, 410, 23, C.teal);
  }
  if (b >= 3)
    type(c, 'Predicting value misses one of three.', 55, 421, 19, C.teal);
}
