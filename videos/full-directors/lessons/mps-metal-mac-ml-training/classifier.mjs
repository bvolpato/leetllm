import assert from 'node:assert/strict';
import {
  classifierFixture,
  classifierTrainingFixture,
  freshMpsFixture,
  tensorShapeContract,
} from '../../../films/mps-metal-mac-ml-training/arithmetic.mjs';
import { classNames } from '../../../films/mps-metal-mac-ml-training/fixtures.mjs';
import {
  board,
  box,
  chip,
  ticket,
  grid,
  arrow,
  line,
  dot,
  text,
  mono,
  serif,
  note,
  cue,
  print,
  ink,
  muted,
  pale,
  gpu,
  mint,
  cpu,
  gold,
  edge,
  red,
} from './bench.mjs';

const f = classifierFixture(),
  t = classifierTrainingFixture();
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const rerunLosses = f.pooled.map((features, i) => {
  const logits = t.updatedBiases.map((bias, cls) =>
    features.reduce((score, value, j) => score + value * t.updatedWeights[j][cls], bias),
  );
  const top = Math.max(...logits);
  return top - logits[t.labels[i]] + Math.log(sum(logits.map((score) => Math.exp(score - top))));
});
const rerunMean = sum(rerunLosses) / rerunLosses.length;
const lossChanges = rerunLosses.map((loss, i) => loss - t.losses[i]);
const lossChangeLimit = 0.06;
const col = f.input[0].map((row) => row[0]);
const names = ['Refund', 'Password reset', 'Late parcel', 'Double charge'];
export function pooling(c, k) {
  board(c, 'Fold eight positions into one vector', 'REFUND   /   MEAN ALONG DIMENSION 1');
  const advance = cue(k, 1, 'Watch the first column', 2.8),
    count = Math.floor(8 * advance);
  const ready = cue(k, 1, 'Divide by eight') > 0;
  mono(c, 'FEATURE COLUMN', 90, 193, 19, muted);
  grid(c, 85, 236, 16, 8, 514, 257, '#cbd7c8', (i, j) => (j === 0 ? (i < count ? gpu : gold) : null));
  for (let i = 0; i < 8; i++)
    mono(c, col[i].toFixed(3), 669, 253 + i * 31.9, 20, i < count ? gpu : muted, 'center');
  line(c, 716, 238, 716, 488, edge, 2);
  serif(c, 'Column sum', 765, 248, 31);
  mono(c, print(sum(col.slice(0, count)), 3), 764, 315, 54);
  if (ready) {
    mono(c, '÷ 8', 765, 394, 30, muted);
    mono(c, '= ' + f.pooled[0][0].toFixed(3), 765, 463, 43, gpu);
  }
  if (cue(k, 1, 'Each ticket now has one row')) grid(c, 85, 519, 16, 1, 514, 16, gpu);
  cue(k, 1, 'and all four tickets keep their place', 0);
  note(
    c,
    ready ? '(4, 8, 16)    →    mean(dim=1)    →    (4, 16)' : 'Which dimensions survive the mean?',
  );
}
export function score(c, k) {
  board(c, 'Assemble the Billing score', 'REFUND   /   ONE LINEAR OUTPUT');
  const products = t.firstClassContributions;
  const n = Math.floor(16 * cue(k, 1, 'Add each feature', 6.8));
  const sums = [t.firstClassBias];
  for (const p of products) sums.push(sums.at(-1) + p);
  const y = (v) => 384 - v * 2200;
  line(c, 84, y(0), 1122, y(0), edge, 1.8, [5, 6]);
  mono(c, '0', 65, y(0), 17, muted);
  mono(c, 'BIAS', 76, 211, 18, muted);
  mono(c, print(t.firstClassBias, 3), 77, 247, 28);
  let prevX = 92;
  dot(c, prevX, y(sums[0]), 7, ink);
  for (let i = 0; i < 16; i++) {
    const x = 148 + i * 61,
      color = products[i] >= 0 ? gpu : red;
    const complete = i < n;
    line(c, x, 494, x, 504, edge, 2);
    if ([0, 3, 7, 11, 15].includes(i)) mono(c, i + 1, x, 524, 16, muted, 'center');
    if (complete) {
      line(c, prevX, y(sums[i]), x, y(sums[i]), ink, 2);
      line(c, x, y(sums[i]), x, y(sums[i + 1]), color, 8);
      dot(c, x, y(sums[i + 1]), products[i] === 0 ? 8 : 4, products[i] === 0 ? cpu : ink);
    }
    prevX = x;
  }
  mono(c, 'Running sum   ' + print(sums[n], 5), 1100, 216, 27, gpu, 'right');
  const term = Math.max(n, 1) - 1;
  mono(
    c,
    'feature ' +
      (term + 1) +
      '     ' +
      print(f.pooled[0][term], 3) +
      ' × ' +
      print(f.weights[term][0], 3),
    1102,
    261,
    22,
    ink,
    'right',
  );
  if (n === 0) {
    for (let i = 0; i < 16; i++) {
      const x = 148 + i * 61;
      dot(c, x, 469, 6, products[i] > 0 ? gpu : products[i] < 0 ? red : cpu);
    }
    mono(c, 'Sign of each product', 85, 425, 19, muted);
  }
  note(
    c,
    n === 16
      ? 'The two flat steps have zero weight. Billing receives ' + print(sums[n], 5) + '.'
      : 'Each signed product moves the accumulator up or down.',
  );
}
export function routing(c, k) {
  board(c, 'Which queue gets the refund?', 'REFUND   /   THREE CLASS SCORES');
  const lead = cue(k, 0, 'Login just edges ahead');
  const soft = cue(k, 0, 'Softmax turns them', 1.1),
    truth = cue(k, 1, 'training label is Billing', 0.65, 'so the training label is Billing'),
    cost = cue(k, 1, 'negative log', 0.65, 'by taking its negative log');
  const result = t.firstTicket;
  for (let i = 0; i < 3; i++) {
    const y = 212 + 106 * i;
    box(c, 64, y, 1070, 83, lead && i === 2 ? '#dbe9da' : '#e8e6d8', 8);
    serif(c, classNames[i], 86, y + 42, 33);
    mono(c, print(result.logits[i], 5), 284, y + 42, 26);
    box(c, 515, y + 30, 395, 24, '#bdc9bb');
    box(c, 515, y + 30, 395 * result.probabilities[i] * soft, 24, gpu);
    if (soft === 1) mono(c, (100 * result.probabilities[i]).toFixed(1) + '%', 939, y + 42, 28, gpu);
    if (truth && i === 0) text(c, 'label', 1060, y + 42, 19, cpu);
  }
  note(
    c,
    cost
      ? 'Refund loss = −ln(' + result.probabilities[0].toFixed(4) + ') ≈ ' + result.loss.toFixed(4)
      : 'The largest logit selects the route. Softmax gives each class a probability.',
  );
}
export function update(c, k) {
  board(c, 'Follow four tickets through one update', 'TRAINING STEP   /   STOCHASTIC GRADIENT DESCENT');
  const n = Math.floor(4 * cue(k, 0, 'Average the four ticket losses', 1.6));
  const gradient = cue(k, 1, 'Backward computes'),
    step = cue(k, 1, 'optimizer subtracts', 0.8),
    again = cue(k, 1, 'Two losses rise', 0);
  const compare = cue(k, 1, 'Compare the sizes', 0.9);
  cue(k, 1, 'so the average falls', 0);
  const w = t.firstWeightUpdate;
  const rowTop = 197;
  const rowGap = 79;
  const zero = 850;
  const changeScale = 155 / lossChangeLimit;
  mono(c, 'Ticket', 83, 173, 19, muted);
  mono(c, 'First pass', 422, 173, 19, muted, 'right');
  if (again) mono(c, 'Rerun', 561, 173, 19, muted, 'right');
  for (let i = 0; i < 4; i++) {
    const y = rowTop + i * rowGap;
    box(c, 67, y, 510, 63, i < n ? mint : '#e2e3d6', 6);
    serif(c, names[i], 83, y + 32, 25);
    mono(c, t.losses[i].toFixed(4), 422, y + 32, 25, ink, 'right');
    if (again) {
      const up = lossChanges[i] > 0;
      mono(c, (up ? '↑ ' : '↓ ') + rerunLosses[i].toFixed(4), 561, y + 32, 24, up ? red : gpu, 'right');
    }
  }
  line(c, 581, rowTop, 581, 500, edge, 2);
  if (compare > 0) {
    mono(c, 'Loss change', zero, 173, 23, ink, 'center');
    line(c, zero, rowTop, zero, 505, muted, 2);
    mono(c, '0', zero, 525, 21, muted, 'center');
    lossChanges.forEach((change, i) => {
      const y = rowTop + i * rowGap + 32;
      const end = zero + change * changeScale * compare;
      const up = change > 0;
      const color = up ? red : gpu;
      box(c, Math.min(zero, end), y - 15, Math.abs(end - zero), 30, color, 3);
      if (compare === 1) {
        const label = (up ? '+' : '') + print(change, 4);
        mono(c, label, end + (up ? 12 : -12), y, 22, color, up ? 'left' : 'right');
      }
    });
  } else {
    serif(c, 'Billing  /  first weight', 637, 228, 31);
    mono(c, print(step === 1 ? w.after : w.before, 5), 637, 319, 51, gpu);
    if (gradient) mono(c, 'gradient   ' + print(w.gradient, 5), 640, 408, 23);
    if (step) mono(c, 'step size   ' + t.learningRate, 640, 466, 23, muted);
  }
  note(
    c,
    k.beat.beatIndex === 1 && k.elapsed >= k.speechDuration
      ? 'Mean loss     first pass ' + t.loss.toFixed(4) + '     →     rerun ' + rerunMean.toFixed(4)
      : n === 4
        ? 'First-pass mean loss      ' + t.loss.toFixed(4)
        : 'Every ticket contributes to the batch gradient.',
  );
}
export function stepProof(c, k) {
  const b = k.beat.beatIndex,
    shape = tensorShapeContract(4, 8, 16, 3);
  board(
    c,
    b < 2
      ? 'Keep every ticket with its label'
      : b < 4
        ? 'Separate backward from the update'
        : 'Repeat the complete step on the Mac',
    'CLASSIFIER CHECK   /   FOUR LABELED TICKETS',
  );
  if (b < 2) {
    const pooled = cue(k, 0, 'Averaging the eight'),
      scored = cue(k, 0, 'linear layer returns');
    const cols = [
      ['Input', '4 × 8 × 16', 8, 16, 1],
      ['Pooled', '4 × 16', 4, 16, pooled],
      ['Logits', '4 × 3', 4, 3, scored],
    ];
    cols.forEach(([name, sh, r, d, v], i) => {
      const x = 78 + 370 * i;
      serif(c, name, x, 205, 32);
      if (v) {
        if (i === 0)
          for (let j = 3; j > 0; j--) box(c, x + j * 4, 255 - j * 6, 291, 180, '#c4d5c5', 4, '#9bb4a6');
        grid(c, x, 255, d, r, 291, 180, gpu);
        mono(c, sh, x, 485, 28);
      }
      if (i < 2) arrow(c, x + 302, 343, x + 350, 343, muted);
    });
    note(
      c,
      b === 0
        ? 'One input slice is shown. Each of the four tickets keeps its row.'
        : 'Raw input     4 × 8 × 16 × 4 bytes = ' + shape.bytes + ' bytes',
    );
  } else if (b < 4) {
    const w = t.firstWeightUpdate,
      grad = cue(k, 2, 'backward fills', 0.65, 'Watch the weight while backward fills'),
      stepped = cue(k, 2, 'Now the optimizer');
    mono(c, 'labels    [' + t.labels.join(', ') + ']', 78, 215, 25);
    chip(c, 91, 293, 445, 141, '', gpu);
    chip(c, 668, 293, 440, 141, '', ink);
    mono(c, 'gradient buffer', 314, 335, 21, mint, 'center');
    mono(c, grad ? print(w.gradient, 5) : 'empty', 314, 390, 32, pale, 'center');
    mono(c, 'weight', 889, 335, 21, gold, 'center');
    mono(c, print(stepped ? w.after : w.before, 5), 889, 390, 32, pale, 'center');
    if (stepped) arrow(c, 557, 366, 639, 366, gpu);
    note(
      c,
      b === 2
        ? 'backward() fills gradients     •     step() updates the weights'
        : 'Finite loss and changed weights check execution. Score held-out tickets to check quality.',
    );
  } else {
    cue(k, 4, 'and a finite loss', 0);
    ticket(c, 71, 203, 490, 297, { name: 'Mac run record', tag: '', color: mint });
    ['PyTorch release', 'Input shape and dtype', 'Parameter, batch and label devices'].forEach((v, i) =>
      text(c, v, 91, 305 + i * 60, 23),
    );
    serif(c, 'Expected on this example', 607, 230, 29);
    ['4 × 16 vectors', '4 × 3 scores', 'finite loss  /  changed weights'].forEach((v, i) =>
      mono(c, v, 609, 303 + i * 68, 22, gpu),
    );
    note(c, 'Check the actual device fields when the full training step returns.');
  }
}
const initial = freshMpsFixture(),
  corrected = freshMpsFixture(-21);
function place(source) {
  return [...source];
}
function readCopy(values) {
  const total = sum(values),
    mean = total / values.length;
  const logits = initial.weights.map((w, i) => (w === 0 ? 0 : w * mean + initial.biases[i]));
  return { total, mean, logits, winner: logits.indexOf(Math.max(...logits)) };
}
export function finalState(k) {
  const original = initial.positions;
  const discard = cue(k, 0, 'This line discards');
  const temporary = cue(k, 0, 'Watch the copy fill', 1.4) * (1 - discard);
  const bound = cue(k, 2, 'Assign the returned placed tensor', 1.4);
  const edit = cue(k, 5, 'Six becomes minus twenty-one', 0.7);
  const exchange = cue(k, 7, 'Place the updated source', 1.6);
  const source = edit === 1 ? corrected.positions : original;
  const copy = exchange === 1 ? place(source) : place(original);
  return { source, copy, temporary, bound, edit, exchange, read: readCopy(copy) };
}
export function practice(c, k) {
  const b = k.beat.beatIndex,
    s = finalState(k),
    m = s.read;
  board(
    c,
    b < 2
      ? 'What does the name batch still point to?'
      : b < 5
        ? 'Route the first ticket'
        : b < 7
          ? 'Which copy carries the correction?'
          : 'Run the reader over the new copy',
    'TRANSFER EXERCISE   /   THREE TICKETS · SIX POSITIONS · EIGHT FEATURES',
  );
  const x = 74,
    w = 600,
    cell = 81;
  function tape(y, label, values, color, visible = 1) {
    box(c, x, y, w, 123, '#c4c6b7', 8);
    text(c, label, x + 15, y + 24, 19, ink, 'Mono');
    for (let i = 0; i < 6; i++) {
      const filled = (i + 1) / 6 <= visible;
      box(c, x + 16 + i * (cell + 14), y + 47, cell, 60, filled ? color : '#9ea99e', 4);
      if (filled)
        mono(c, print(values[i]), x + 16 + i * (cell + 14) + cell / 2, y + 78, 31, ink, 'center');
    }
  }
  const cpuAnswer = cue(k, 2, 'The discarded copy', 0);
  tape(198, cpuAnswer && s.bound < 1 ? 'source   /   CPU     ← batch' : 'source   /   CPU', s.source, gold);
  tape(
    366,
    s.bound === 1
      ? 'MPS copy ' + (s.exchange === 1 ? '2' : '1') + '     ← batch'
      : s.temporary
        ? 'temporary MPS tensor'
        : 'MPS destination',
    s.copy,
    mint,
    s.bound === 1 ? 1 : Math.max(s.temporary, s.bound),
  );
  if (s.exchange > 0 && s.exchange < 1) {
    const pos = x + 16 + 560 * s.exchange;
    line(c, pos, 408, pos, 475, gpu, 4);
  }
  const firstPass = cue(k, 3, 'Its six positions sum', 1.75);
  const stalePass = cue(k, 6, 'Follow the name batch', 1.5);
  const lastPass = cue(k, 7, 'Follow that new copy', 1.65);
  const scan = b < 5 ? firstPass : b === 5 ? 0 : b === 6 ? stalePass : lastPass;
  const sumReady = b < 5 ? cue(k, 3, 'Its mean', 0)
    : b === 6 ? cue(k, 6, 'The mean', 0) : b >= 7 && cue(k, 7, 'so their mean', 0);
  if (scan > 0) {
    const pos = x + 16 + cell / 2 + 5 * (cell + 14) * scan;
    line(c, x + 16 + cell / 2, 486, pos, 486, gpu, 3);
    c.beginPath();
    c.moveTo(pos, 469);
    c.lineTo(pos - 9, 484);
    c.lineTo(pos + 9, 484);
    c.closePath();
    c.fillStyle = gpu;
    c.fill();
    const readCount = Math.min(6, 1 + Math.floor(5 * scan));
    const subtotal = sum(s.copy.slice(0, readCount));
    mono(
      c,
      scan < 1 ? 'Reading position ' + readCount + '     sum ' + print(subtotal)
        : sumReady ? 'Read sum   ' + print(subtotal) + '    /    6 positions' : 'Read 6 of 6 positions',
      x + 12,
      520,
      20,
      gpu,
    );
  }
  const weights = cue(k, 3, 'Look at the weight', 0);
  cue(k, 3, 'and Login reverses its sign', 0);
  const mean = b < 5 ? weights
    : b === 6 ? cue(k, 6, 'The scores are', 0) : b >= 7 && cue(k, 7, 'The weights are unchanged', 0);
  const result = (beat, phrase, captionStart = phrase) => {
    if (b !== beat) return b > beat;
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart }) === 1;
  };
  const scoreBeat = b < 5 ? 4 : b < 7 ? 6 : 7;
  const firstScore = b < 7 ? 'The scores are three point five' : 'The scores are minus one';
  const scorePhrases = [
    firstScore,
    'zero',
    b < 7 ? 'minus three point five' : 'and one',
  ];
  const lamp = b < 5 ? result(4, 'Billing takes the ticket')
    : b === 6 ? result(6, 'Billing gets the ticket again')
      : b >= 7 && result(7, 'Login takes the ticket');
  if (mean && scan === 1)
    mono(c, 'Mean   ' + print(m.mean, Number.isInteger(m.mean) ? 0 : 1), 716, 215, 26);
  for (let i = 0; i < 3; i++) {
    const y = 261 + i * 80,
      lit = lamp && m.winner === i;
    box(c, 708, y, 420, 64, lit ? gold : '#e4e3d6', 7);
    serif(c, classNames[i], 723, y + 32, 27);
    if (weights) mono(c, '× ' + print(initial.weights[i]), 870, y + 32, 21, muted);
    if (result(scoreBeat, scorePhrases[i], firstScore)) {
      const z = 988,
        delta = m.logits[i] * 13;
      line(c, z, y + 13, z, y + 50, muted, 1.5);
      if (delta) box(c, Math.min(z, z + delta), y + 24, Math.abs(delta), 16, delta > 0 ? gpu : red, 2);
      else dot(c, z, y + 32, 4, ink);
      mono(
        c,
        print(m.logits[i], Number.isInteger(m.logits[i]) ? 0 : 1),
        1105,
        y + 32,
        28,
        ink,
        'right',
      );
    }
  }
  let msg = cue(k, 0, 'This line discards', 0)
    ? 'batch.to("mps")     •     return value discarded'
    : 'batch.to("mps")';
  if (b >= 2 && s.bound > 0) {
    msg = 'batch = source.to("mps")     •     (3, 6, 8)';
    if (cue(k, 2, 'three by eight', 0, false)) msg += ' → (3, 8)';
    if (cue(k, 2, 'three by three', 0, 'and the classifier returns')) msg += ' → (3, 3)';
  }
  if (b === 5 || b === 6) msg = 'scores = model(batch.mean(dim=1))';
  if (b >= 7) msg = 'batch = source.to("mps")      →      score the new batch';
  note(c, msg);
}
export function checkClassifier() {
  assert.equal(print(sum(col), 3), '1.168');
  assert.equal(print(sum(col) / 8, 3), '0.146');
  assert(Math.abs(sum(t.firstClassContributions) + t.firstClassBias - f.logits[0][0]) < 1e-12);
  assert.equal(t.firstClassContributions.filter((v) => v === 0).length, 2);
  assert.equal(t.firstTicket.probabilities.indexOf(Math.max(...t.firstTicket.probabilities)), 2);
  assert(Math.abs(-Math.log(t.firstTicket.probabilities[0]) - t.firstTicket.loss) < 1e-12);
  assert.equal(sum(t.losses) / 4, t.loss);
  assert.deepEqual(rerunLosses.map((n) => n.toFixed(4)), ['1.0789', '1.0819', '1.1313', '1.0978']);
  assert.deepEqual(
    lossChanges.map((n) => print(n, 4)),
    ['−0.0312', '0.0276', '0.0132', '−0.0586'],
  );
  assert(lossChanges.every((n) => Math.abs(n) <= lossChangeLimit));
  assert(Math.abs(sum(lossChanges) / lossChanges.length - (rerunMean - t.loss)) < 1e-12);
  assert(Math.abs(rerunMean - t.lossAfter) < 1e-12);
  const w = t.firstWeightUpdate;
  assert.equal(w.before - t.learningRate * w.gradient, w.after);
  assert(t.lossAfter < t.loss);
  const source = place(initial.positions),
    old = place(source);
  source[5] = -21;
  assert.deepEqual(readCopy(old).logits, [3.5, 0, -3.5]);
  assert.deepEqual(readCopy(place(source)).logits, [-1, 0, 1]);
}
