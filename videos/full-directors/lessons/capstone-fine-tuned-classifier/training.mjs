import { C, beat, cue, mix, vec } from './studio.mjs';
import { timedWordTokens } from '../../../lib/captions.mjs';
import {
  backpropagationStep,
  maskedMean,
  trainHead,
} from '../../../films/capstone-fine-tuned-classifier/model.mjs';
import { softmax } from '../../../films/capstone-fine-tuned-classifier/arithmetic.mjs';
import { TRAINING_TRACE } from '../../../films/capstone-fine-tuned-classifier/fixtures/training-trace.mjs';

export const initial = backpropagationStep({ progress: 0 });
export const frozen = backpropagationStep({ trainEmbeddings: false });
function chip(p, x, y, word, values, col) {
  p.box(x + 6, y + 8, 360, 175, '#567067', 17);
  p.box(x, y, 360, 175, col, 17);
  p.mid(word, x + 180, y + 49, 47, C.page, { face: 'Serif' });
  p.mid(vec(values), x + 180, y + 122, 45, C.page, { face: 'Mono' });
}
export function representation(p, k) {
  p.surface('lab');
  p.title('What survives the mean?');
  const motion = cue(k, 2, 'swapping these tokens', 1.6);
  const swap = Math.max(0, Math.min(1, (motion - 0.25) * 2));
  const lift = Math.min(1, motion * 4, (1 - motion) * 4) * 110;
  chip(p, mix(175, 665, swap), 311 - lift, 'key', initial.original[1], C.teal);
  chip(p, mix(665, 175, swap), 311 + lift, 'disabled', initial.original[2], C.blue);
  p.mid('+', 600, 400, 67);
  if (cue(k, 1, 'That mean')) {
    p.line(174, 610, 1026, 610, C.ink, 5);
    p.mid('2 live words', 600, 682, 59);
    p.txt('=', 1100, 548, 74);
    p.num(vec(initial.h), 1245, 535, 87);
  }
  if (cue(k, 1, 'The two resulting numbers')) {
    p.cap('Head output', 1272, 679);
    p.num(vec(initial.z), 1266, 750, 64);
    p.txt('logits', 1515, 749, 40, C.muted);
  }
  if (beat(k) === 2) p.txt('The same mean reaches the same head in either order.', 180, 899, 47);
}
const softRows = (z) => {
  const maximum = Math.max(...z),
    shift = z.map((v) => v - maximum),
    terms = shift.map((v) => Math.exp(v)),
    den = terms.reduce((a, b) => a + b);
  return { z, shift, terms, den, scores: softmax(z) };
};
export { softRows };
export function scores(p, k) {
  p.surface('lab');
  const b = beat(k);
  let z = initial.z;
  if (b === 3) z = cue(k, 3, 'Logits one and minus one') ? [1, -1] : [-1, 2];
  if (b === 4) z = [1, -1];
  const s = softRows(z),
    first = b === 1,
    showShift = cue(k, 2, 'Its shifted value'),
    showExp = cue(k, 2, 'add both terms'),
    showP = cue(k, 2, 'Subtracting the maximum preserves');
  p.title(first ? 'Two rows in the head' : 'One denominator for both classes');
  if (first) {
    p.txt('Pooled vector', 137, 303, 49);
    p.num(vec(initial.h), 143, 446, 101);
    p.grid(
      714,
      293,
      1090,
      ['Class', 'Weight row', 'Bias', 'Logit'],
      initial.w.map((w, i) => [i ? '1  Review' : '0  Agent', vec(w), 0, initial.z[i]]),
      [0.3, 0.37, 0.14, 0.19],
      { step: 148, size: 52 },
    );
    p.txt('logit = weight row · pooled vector + bias', 137, 798, 59);
    return;
  }
  p.grid(
    108,
    300,
    1698,
    ['Class', 'Logit', 'Shift by max', 'Exponential', 'Score'],
    ['0   Guarded agent', '1   Human review'].map((l, i) => [
      l,
      s.z[i],
      showShift ? s.shift[i] : '·',
      showExp ? s.terms[i].toFixed(3) : '·',
      showP ? s.scores[i].toFixed(3) : '·',
    ]),
    [0.28, 0.13, 0.2, 0.2, 0.19],
    { step: 143, size: 51, accent: b >= 4 ? 1 : -1 },
  );
  if (showExp)
    p.num(
      'Sum of exponentials    ' +
        s.terms.map((t) => t.toFixed(3)).join(' + ') +
        ' = ' +
        s.den.toFixed(3),
      128,
      769,
      44,
    );
  if (b >= 4) {
    p.cap('Softmax output', 126, 916);
    ['[0]   Guarded', '[1]   Human review'].forEach((name, i) => {
      const x = 461 + i * 604;
      p.box(x, 831, 561, 156, i ? C.teal : C.page, 12);
      p.txt(name, x + 28, 873, 34, i ? C.page : C.muted);
      p.num(s.scores[i].toFixed(3), x + 28, 943, 52, i ? C.page : C.ink);
    });
  }
}
export function learning(p, k) {
  p.surface('lab');
  p.title('Training directly on the logits');
  const n = Math.floor(12 * cue(k, 2, 'Watch the urgent score climb', 2.4)),
    s = trainHead(n);
  p.cap('Cross-entropy  /  target = 1', 130, 280);
  p.num('−ln(' + s.p[1].toFixed(3) + ')', 126, 391, 75);
  p.num(s.loss.toFixed(3), 127, 553, 132, C.teal);
  p.txt('loss', 132, 673, 46, C.muted);
  p.grid(
    835,
    295,
    947,
    ['Class', 'Logit', 'Score'],
    ['0   Agent', '1   Review'].map((l, j) => [l, s.z[j].toFixed(3), s.p[j].toFixed(3)]),
    [0.4, 0.3, 0.3],
    { step: 133, size: 48, accent: 1 },
  );
  if (beat(k) >= 2) p.num('z ← z − 0.3 (p − target)', 841, 745, 46);
  p.txt(
    beat(k) === 3
      ? 'Next, trace the error back through the head to the word vectors.'
      : 'Direct logit updates    ' + n,
    132,
    904,
    42,
  );
}
export function gradient(p, k) {
  p.surface('lab');
  const b = beat(k),
    split = cue(k, 4, 'Look at the two equal branches', 0.64);
  const move = cue(k, 4, 'Subtract the scaled gradient', 1.1);
  const s = backpropagationStep({ progress: move });
  if (b >= 5) {
    p.title('One updated head, two representations');
    p.cap('W after the step', 115, 276);
    p.num(s.weights.map((r) => vec(r)).join('   '), 115, 345, 47);
    p.cap('Bias after the step', 1150, 276);
    p.num(vec(s.bias), 1150, 345, 47);
    const seen = [cue(k, 5, 'Keep that frozen result'), cue(k, 6, 'Next we’ll train')];
    p.grid(
      110,
      510,
      1700,
      ['Word vectors', 'Pooled input', 'Review score'],
      [frozen, s].map((g, i) => [
        i ? 'Trainable' : 'Frozen',
        i && b < 6 ? '·' : vec(g.pooled),
        seen[i] ? g.probabilities[1].toFixed(3) : '…',
      ]),
      [0.36, 0.36, 0.28],
      { step: 145, size: 67, accent: b === 6 ? 1 : 0 },
    );
    return;
  }
  p.cap('Backward through the mean', 108, 104);
  p.txt('Human review', 103, 191, 78, C.ink, { face: 'Serif' });
  p.num('target  [0, 1]', 111, 273, 39);
  p.cap('Original logits', 108, 382);
  p.num(vec(initial.z), 112, 450, 68);
  p.txt('Review score   ' + initial.p[1].toFixed(3), 106, 520, 39);
  if (b >= 2) {
    p.txt('Loss   ' + (-Math.log(initial.p[1])).toFixed(3), 106, 584, 50);
    if (cue(k, 2, 'To find what reaches')) p.num('p − y   ' + vec(initial.dz), 106, 672, 40);
  }
  if (b >= 2 && cue(k, 2, 'original head weights')) {
    p.cap('Original head rows', 106, 754);
    p.num(initial.w.map((r) => vec(r)).join('  '), 106, 817, 33);
  }
  const pooled = cue(k, 3, 'The first coordinate');
  p.box(580, 410, 414, 179, C.dark, 18);
  p.mid('Pooled gradient', 787, 458, 38, C.page);
  p.mid(pooled ? vec(initial.dh) : '?', 787, 530, 49, C.page, { face: 'Mono' });
  const tokenRows = [
    ['key', 1, 265],
    ['disabled', 2, 498],
    ['padding', 0, 684],
    ['unused', 3, 866],
  ];
  for (const [name, i, y] of tokenRows) {
    const live = i === 1 || i === 2;
    if (live && split > 0) {
      const dx = 1160 - 994,
        dy = y - 498;
      p.line(994, 498, 994 + dx * split, 498 + dy * split, C.teal, 9);
      if (split === 1) p.mid('½', 1092, 498 + dy * 0.62 + (i === 1 ? -32 : 32), 41, C.teal);
    }
    p.txt(name, 1176, y - 32, 46, live ? C.ink : C.muted, { face: 'Serif' });
    p.num(vec(s.embeddings[i]), 1471, y - 30, 48, live ? C.ink : C.muted);
    if (split === 1)
      p.num('gradient   ' + vec(initial.de[i]), 1178, y + 36, 35, live ? C.teal : C.muted);
    p.line(1175, y + 85, 1800, y + 85, C.rule, 2);
  }
  if (b === 3) p.txt('Two live words contributed to the mean.', 109, 905, 43);
  if (move) p.txt('New vector = original vector − 0.1 × gradient', 109, 915, 41, C.ink, { max: 1010 });
}
export function tiny(p, k) {
  p.surface('lab');
  const b = beat(k);
  const step = Math.floor(80 * cue(k, 3, 'eighty updates', 3.4)),
    t = TRAINING_TRACE[step];
  p.title('Inside one six-ticket CPU run');
  p.cap('Embedding coordinates', 114, 247);
  p.cap('Mask', 1132, 247);
  const names = ['show', 'access', 'policy', 'PAD', 'PAD', 'PAD'];
  t.embeddingRows.forEach((row, j) => {
    const y = 303 + j * 67;
    p.txt(names[j], 110, y + 27, 37);
    row.forEach((v, i) => {
      const x = 292 + i * 100;
      p.box(x, y, 95, 55, t.mask[j] ? (v >= 0 ? '#add6c3' : '#e4c6ad') : '#dddccd', 4);
      p.mid(v.toFixed(2), x + 47, y + 27, 28, C.ink, { face: 'Mono' });
    });
    p.num(Number(t.mask[j]), 1154, y + 27, 36);
  });
  if (b >= 2) {
    p.cap('Mean  /  3 live rows', 111, 802);
    t.pooled.forEach((v, i) => p.mid(v.toFixed(2), 336 + i * 101, 879, 32, C.teal, { face: 'Mono' }));
  }
  p.line(1235, 244, 1235, 923, C.rule);
  p.cap('Adam step', 1310, 258);
  p.num(step + ' / 80', 1303, 342, 65);
  p.cap('Batch loss', 1310, 462);
  p.num(t.loss.toFixed(5), 1303, 542, 61);
  const x = 1311,
    y = 742,
    w = 420,
    h = 150;
  p.line(x, y, x + w, y, C.muted, 3);
  for (let i = 1; i <= step; i++)
    p.line(
      x + (w * (i - 1)) / 80,
      y - h * TRAINING_TRACE[i - 1].loss,
      x + (w * i) / 80,
      y - h * TRAINING_TRACE[i].loss,
      C.teal,
      5,
    );
  if (b >= 4)
    p.txt(
      b === 4 ? 'Logits   6 × 2' : b === 5 ? 'Reload matches' : 'Same unordered mean',
      1303,
      848,
      41,
      C.ink,
      { max: 486 },
    );
  if (b >= 5)
    p.txt('Familiar held-out wording    ·    2 required caught, 2 routine guarded', 110, 968, 39);
}
export function prepareReadout(schedule) {
  const entry = schedule.find(({ beat }) => beat.id === 'c10-b01');
  if (!entry) return;
  // Read the word times directly. Registering new reveal cues would also split the captions.
  const tokens = timedWordTokens(entry.words, entry.beat.say);
  const word = (name) => entry.words[tokens.find(({ value }) => value === name).wordIndex];
  return {
    vectorEnd: word('vector').end,
    dense: word('dense').start,
    relu: word('relu').start,
    dropout: word('dropout').start,
    logitsEnd: word('logits').end,
  };
}

function traceReadout(p, progress) {
  const corners = [
    [218, 707],
    [218, 834],
    [1170, 834],
    [1170, 380],
    [1224, 380],
  ];
  const length = corners
    .slice(1)
    .reduce((sum, [x, y], i) => sum + Math.hypot(x - corners[i][0], y - corners[i][1]), 0);
  let remaining = length * progress;
  for (let i = 1; i < corners.length && remaining > 0; i++) {
    const [x, y] = corners[i - 1];
    const [u, v] = corners[i];
    const segment = Math.hypot(u - x, v - y);
    const t = Math.min(1, remaining / segment);
    p.line(x, y, mix(x, u, t), mix(y, v, t), C.blue, 8);
    remaining -= segment;
  }
}

export function encoder(p, k) {
  p.surface('lab');
  const b = beat(k);
  if (b === 3) {
    p.title('Keep the task fixed when you change the encoder');
    p.grid(
      118,
      298,
      1682,
      ['Candidate', 'Starting representation', 'Evidence on this gate'],
      [
        ['Word-feature baseline', 'Word / bigram TF-IDF', 'Six fitted scores'],
        ['Tiny encoder', 'Random word vectors', 'Six fitted scores'],
        ['DistilBERT', 'Pretrained contextual vectors', 'Training run needed'],
        ['DeBERTa-v3', 'Disentangled attention', 'Alternative candidate'],
      ],
      [0.28, 0.38, 0.34],
      { step: 117, size: 45 },
    );
    p.txt(
      'DeBERTa-v3 pretraining uses replaced-token detection and gradient-disentangled embedding sharing.',
      122,
      925,
      37,
      C.ink,
      { max: 1650 },
    );
    return;
  }
  const causal = b === 2 && cue(k, 2, 'A causal decoder') && !cue(k, 2, 'Full encoder fine-tuning');
  if (causal) {
    p.title('A final token sees the admitted prefix');
    const tokens = ['restore', 'my', 'key', 'during', 'freeze'];
    tokens.forEach((s, i) => {
      const x = 147 + i * 335;
      p.box(x, 412, 286, 109, i === 4 ? C.teal : C.page, 10);
      p.mid(s, x + 143, 467, 50, i === 4 ? C.page : C.ink);
      if (i < 4) {
        p.line(x + 143, 521, x + 143, 586 + i * 42, C.rule, 3);
        p.line(x + 143, 586 + i * 42, 1629, 586 + i * 42, C.rule, 3);
      }
    });
    p.line(1629, 521, 1629, 807, C.teal, 7);
    p.dot(1629, 807, 13, C.teal);
    p.txt('Read the final-token vector for classification', 655, 885, 53);
    return;
  }
  const freeze = !!cue(k, 2, 'Freeze the encoder');
  const readout = b === 1;
  const times = k.pictureData;
  const selected = readout && k.elapsed >= times.vectorEnd;
  p.title(
    readout
      ? 'Which token vector goes to the DistilBERT head?'
      : 'DistilBERT reads the whole admitted ticket',
  );
  const names = ['[CLS]', 'restore', 'my', 'key', '[SEP]'];
  names.forEach((n, i) => {
    const x = 145 + i * 200;
    if (selected && i === 0) p.box(x - 4, 250, 154, 80, C.blue, 9);
    p.mid(n, x + 73, 290, 40, selected && i === 0 ? C.page : C.ink);
    p.line(x + 73, 338, x + 73, 742, C.rule, 2);
    if (readout) p.dot(x + 73, 742, 7, selected && i === 0 ? C.blue : C.muted);
  });
  for (let i = 0; i < 6; i++) {
    p.box(121, 353 + 61 * i, 1010, 49, freeze ? '#687771' : i % 2 ? C.teal : C.dark, 7);
    p.mid('Transformer ' + (i + 1) + (freeze ? '   ·   frozen' : ''), 628, 378 + 61 * i, 32, C.page);
  }
  if (selected) {
    const progress =
      k.elapsed >= times.dense
        ? 1
        : (k.elapsed - times.vectorEnd) / (times.dense - times.vectorEnd);
    traceReadout(p, progress);
    p.txt('First-token vector', 251, 787, 49, C.blue);
  } else if (!readout) {
    p.line(218, 711, 218, 798, C.blue, 6);
    p.dot(218, 798, 10, C.blue);
    p.txt('First-token vector', 251, 798, 49);
  }
  p.cap('Classification head', 1230, 267);
  const head = ['Dense', 'ReLU', 'Dropout', 'Two logits'];
  const starts = readout && [times.dense, times.relu, times.dropout, times.logitsEnd];
  head.forEach((s, i) => {
    if (readout && k.elapsed < starts[i]) return;
    if (readout && i > 0) p.line(1478, 314 + i * 104, 1478, 342 + i * 104, C.blue, 8);
    p.box(1224, 342 + i * 104, 509, 76, i === 3 ? C.dark : C.page, 10);
    p.mid(s, 1478, 380 + i * 104, 42, i === 3 ? C.page : C.ink);
  });
  const note =
    b === 1
      ? '6 encoder layers   ·   512 model positions'
      : freeze
        ? 'Encoder fixed   /   train the classification head'
        : 'Full fine-tuning   /   gradients can update all six layers';
  p.txt(note, 127, 939, 42, C.ink, { max: 1670 });
}
