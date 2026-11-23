import {
  dependencyModel,
  vocabularyMass,
} from '../../../films/continued-pretraining/model.mjs';
import { CENTROID_INPUTS } from '../../../films/continued-pretraining/fixtures.mjs';
import {
  C,
  base,
  beat,
  cue,
  ease,
  rect,
  line,
  circle,
  text,
  mono,
  serif,
  chip,
  heading,
  arrow,
} from './studio.mjs';
import { pairs } from './field.mjs';

export function gradient(g, k) {
  base(g);
  heading(g, 'RESPONSE LOSS   /   SEPARATE, FIXED HEAD', 'Follow the two lookups');
  const d = dependencyModel(),
    back = cue(k, 3, 'Trace the response gradient', 0.8);
  d.embeddings.forEach((r, i) => {
    const y = 345 + 157 * i;
    chip(g, 'e' + i + '   [' + r.join(', ') + ']', 115, y, 390, 93, i < 2 ? C.pale : C.leaf);
    if (i < 2) {
      arrow(g, 530, y + 46, 785, 492, C.sea);
      if (back)
        arrow(g, 790, 510, 790 + (530 - 790) * back, 510 + (y + 75 - 510) * back, C.clay, 5);
    }
    if (back === 1)
      mono(
        g,
        '∂L  [' + d.inputGradients[i].map((v) => v.toFixed(3)).join(', ') + ']',
        115,
        y + 137,
        27,
        i < 2 ? C.clay : C.muted,
      );
  });
  circle(g, 833, 494, 48, C.sea);
  text(g, '+', 833, 510, 54, C.leaf, 'Sans', 'center');
  mono(g, 'h = [1, 1]', 833, 616, 36, C.ink, 'center');
  arrow(g, 905, 494, 1044, 494);
  d.z.forEach((v, i) => {
    const y = 340 + i * 126;
    chip(g, 'class ' + i + '   logit ' + v, 1080, y, 495, 82, i === 2 ? C.sun : C.leaf);
    if (i === 2) text(g, 'observed', 1600, y + 54, 34, C.clay);
  });
  if (back === 1) serif(g, 'Response loss  ' + d.loss.toFixed(3) + ' nats', 1045, 810, 51, C.clay);
  text(
    g,
    beat(k) >= 4
      ? 'Tying the head would add an output path.'
      : 'Only the response contributes a direct loss term.',
    105,
    972,
    40,
    C.muted,
  );
}

const words = ['Retry', 'policy', ':', 'Use', 'jitter', 'on', 'retries'];
export const targets = (response) => words.map((_, i) => i >= (response ? 3 : 1));
export function shift(g, k) {
  base(g);
  heading(g, 'CAUSAL LANGUAGE MODEL', 'Read here. Predict one place to the right.');
  const response = cue(k, 3, 'A response-only mask'),
    mask = targets(response);
  const x = (i) => 104 + i * 247;
  words.forEach((w, i) => {
    chip(g, w, x(i), 349, 220, 102, C.pale);
    if (i < 6) arrow(g, x(i) + 117, 461, x(i + 1) + 82, 571, mask[i + 1] ? C.sea : C.rule, 5);
    if (i > 0) chip(g, mask[i] ? w : 'skip', x(i), 588, 220, 92, mask[i] ? C.sun : C.leaf);
  });
  text(g, 'Input', 100, 322, 32, C.sea);
  text(g, 'Target', 100, 647, 32, C.clay);
  serif(g, mask.filter(Boolean).length + ' scored targets', 104, 823, 70);
  if (beat(k) > 1) mono(g, 'PPL = exp(Σ NLL / scored targets)    count > 0', 105, 944, 36, C.sea);
}
const vocab = [
  'timeout',
  'retry',
  'client',
  'should',
  'with',
  'backoff',
  'AUTH',
  'fires',
  'the',
  ' ',
].sort((a, b) => b.length - a.length);
export function split(text, vocabulary = vocab) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const v = vocabulary.find((w) => text.startsWith(w, i)) ?? text[i];
    out.push(v);
    i += v.length;
  }
  return out;
}
export function fertility(g, k) {
  base(g);
  const b = beat(k);
  if (b === 2) {
    heading(g, 'CONTEXT COST   /   FIXED MODEL WIDTH', 'Measure the whole tokenized sequence');
    return pairs(g, cue(k, 2, 'If a whole sequence triples'));
  }
  heading(g, 'LONGEST MATCH   /   TOY VOCABULARY', 'The tokenizer reads AUTH_TIMEOUT');
  serif(g, 'timeout', 132, 399, 78);
  chip(g, split('timeout')[0], 700, 317, 340, 100, C.pale);
  mono(g, 'AUTH_TIMEOUT', 130, 600, 75, C.ink);
  const parts = split('AUTH_TIMEOUT'),
    reveal = cue(k, 1, 'it recognizes AUTH', 2.1);
  parts.forEach((p, i) => {
    if (reveal * parts.length > i) chip(g, p, 127 + i * 185, 682, 168, 106, i ? C.sun : C.pale);
  });
  if (reveal === 1)
    text(
      g,
      '1 piece for timeout     /     ' + parts.length + ' for AUTH_TIMEOUT',
      127,
      892,
      52,
      C.sea,
    );
}
const spelling = 'authtimeout';
const oldPieces = ['auth', 'time', 'out', 'retry', 'jitter'];
export function extensionEncoding(extended = false) {
  const pieces = extended ? [...oldPieces, spelling] : oldPieces;
  const longestFirst = [...pieces].sort((a, b) => b.length - a.length);
  return split(spelling, longestFirst).map((piece) => ({ piece, id: pieces.indexOf(piece) }));
}
const oldEncoding = extensionEncoding();
const [newToken] = extensionEncoding(true);
const inputRows = oldEncoding.map(({ id }) => CENTROID_INPUTS[id]);
export const newInputRow = inputRows[0].map((_, i) =>
  inputRows.reduce((sum, row) => sum + row[i], 0) / inputRows.length,
);

// Joshi et al. (2026), tables 1 and 2. Loss and task accuracy come from separate comparisons.
export const hindiStudy = {
  lengthWeighted: { initialLoss: 7.216, lossAt50: 2.818 },
  selected: { initialLoss: 7.256, lossAt50: 2.722, accuracyAt500: 57.01 },
  meanAll: { accuracyAt500: 32.00 },
};

function initializerStudy(g, k) {
  heading(g, 'JOSHI ET AL. (2026)   /   NEMOTRON   /   HINDI VOCABULARY',
    'Would you choose the same initializer after training?');
  const { lengthWeighted, selected, meanAll } = hindiStudy;
  const probed = cue(k, 5, 'After fifty training steps');
  text(g, 'Two initialization methods', 111, 328, 36, C.muted);
  text(g, 'Loss at step 0', 1140, 328, 36, C.muted, 'Sans', 'center');
  text(g, 'Held-out loss at step 50', 1573, 328, 36, C.muted, 'Sans', 'center');
  line(g, 104, 350, 1814, 350);
  for (const [i, [method, detail, values]] of [
    ['Weight by character count', 'Use subword length for both averages.', lengthWeighted],
    ['Average input subwords equally', 'Hindi input norms · Length-weighted output', selected],
  ].entries()) {
    const y = 384 + 155 * i;
    serif(g, method, 112, y + 46, 56);
    text(g, detail, 113, y + 96, 34, C.muted, 'Sans', 'left', 835);
    chip(g, values.initialLoss.toFixed(3), 998, y, 280, 95,
      values.initialLoss === Math.min(lengthWeighted.initialLoss, selected.initialLoss) ? C.pale : C.leaf, C.ink, 48);
    chip(g, probed ? values.lossAt50.toFixed(3) : '?', 1433, y, 280, 95,
      probed && values.lossAt50 === Math.min(lengthWeighted.lossAt50, selected.lossAt50) ? C.pale : C.leaf, C.ink, 48);
  }
  text(g, 'Lower loss is better.', 111, 729, 34, C.sea);
  if (cue(k, 5, 'The researchers tested that method')) {
    line(g, 104, 776, 1814, 776, C.rule, 3);
    text(g, 'MILU-Hindi   /   Accuracy at step 500', 111, 843, 41, C.sea);
    const methodScore = cue(k, 5, 'about fifty-seven percent') ? selected.accuracyAt500.toFixed(2) + '%' : '?';
    const baselineScore = cue(k, 5, 'thirty-two percent') ? meanAll.accuracyAt500.toFixed(2) + '%' : '?';
    text(g, 'Selected initializer', 111, 955, 47);
    chip(g, methodScore, 557, 882, 286, 100, C.pale, C.ink, 46);
    text(g, 'Mean-all baseline', 963, 955, 47);
    chip(g, baselineScore, 1423, 882, 286, 100, C.leaf, C.ink, 46);
  }
}

export function tables(g, k) {
  base(g);
  const b = beat(k),
    add = cue(k, 2, 'Add the new row');
  if (b === 5) return initializerStudy(g, k);
  if (b === 1) {
    heading(g, 'SECOND TOY TOKENIZER   /   LONGEST MATCH', 'How does it read authtimeout?');
    text(g, 'Old vocabulary', 110, 339, 40, C.muted);
    oldPieces.forEach((p, id) => chip(g, id + '   ' + p, 110 + 345 * id, 390, 310, 98, C.leaf));
    mono(g, spelling, 110, 706, 68);
    arrow(g, 615, 685, 749, 685);
    if (cue(k, 1, 'It reads auth')) {
      oldEncoding.forEach(({ piece, id }, i) => {
        const x = 795 + 344 * i;
        chip(g, piece, x, 625, 310, 113, C.pale, C.ink, 48);
        mono(g, 'ID ' + id, x + 155, 819, 42, C.sea, 'center');
      });
    } else {
      text(g, 'Which IDs come out?', 808, 705, 58, C.sea);
    }
    return;
  }
  if (b === 2) {
    const ids = oldEncoding.map(({ id }) => id).join(', ');
    heading(g, 'SECOND TOY TOKENIZER   /   ' + spelling, 'Read a new ID and predict it');
    ['Input embeddings', 'Output head'].forEach((name, j) => {
      const x = 145 + j * 906;
      serif(g, name, x, 354, 56);
      for (let i = 0; i < (add ? 6 : 5); i++) {
        mono(g, 'ID ' + i, x, 428 + i * 72, 29);
        for (let c = 0; c < 8; c++)
          rect(g, x + 116 + c * 72, 391 + i * 72, 64, 54, i === 5 ? C.gold : j ? C.clay : C.sea, 4);
      }
      mono(g, (add ? 6 : 5) + ' rows × 8', x, 925, 39, j ? C.clay : C.sea);
    });
    mono(g, 'Old encoding [' + ids + ']' + (add ? '     Extended encoding [' + newToken.id + ']' : ''),
      145, 1010, 36, C.muted);
    return;
  }
  heading(g, 'INPUT TABLE   /   ' + spelling + '   /   OLD IDs [' + oldEncoding.map(t => t.id).join(', ') + ']',
    'Average the same column in three rows');
  const vals = [...inputRows, newInputRow],
    names = [...oldEncoding.map(({ piece, id }) => id + '   ' + piece), newToken.id + '   new'];
  const show = cue(k, 3, 'In each column');
  vals.forEach((r, i) => {
    const y = 359 + i * 120 + (i === 3 ? 36 : 0);
    serif(g, names[i], 104, y + 54, 49);
    r.forEach((v, j) =>
      chip(
        g,
        i === 3 && !show ? '?' : v.toFixed(3),
        355 + j * 180,
        y,
        159,
        83,
        i === 3 ? C.sun : C.pale,
        C.ink,
        35,
      ),
    );
  });
  line(g, 96, 705, 1815, 705, C.rule, 3);
  text(
    g,
    b >= 4
      ? 'Initialize the separate output head and evaluate the trained model.'
      : 'Each new coordinate is the mean of the three values above it.',
    106,
    962,
    41,
    C.sea,
  );
}
export function equalMass(n, oldCount) {
  return { masses: Array(n).fill(1), sum: n, loss: Math.log(n), increase: Math.log(n / oldCount) };
}
export function mass(g, k) {
  base(g);
  heading(g, 'FIXED HIDDEN VECTOR   /   ALL LOGITS ZERO',
    'How much probability stays with the old word?');
  const b = beat(k);
  const transfer = cue(k, 4, 'Starting with three unit masses');
  const oldCount = transfer ? 3 : 2;
  const resultBeat = transfer ? 5 : 3;
  const added = ease(transfer
    ? cue(k, 5, 'Add the fourth unit mass', 0.45)
    : cue(k, 3, 'gains a third unit mass', 0.45));
  const before = transfer ? equalMass(3, 3) : vocabularyMass(false);
  const after = transfer ? equalMass(4, 3) : vocabularyMass(true);
  function heard(phrase) {
    return b > resultBeat ||
      (b === resultBeat && k.elapsed >= k.wordCue(phrase).end);
  }
  const probability = heard(transfer ? 'one quarter' : 'one third');
  const loss = heard(transfer ? 'new loss, log four' : 'one point zero nine nine');
  const increase = heard(transfer ? 'natural log of four thirds' : 'zero point four zero five');

  text(g, 'Softmax mass     exp(0) = 1 per row', 110, 331, 41, C.muted);
  const slot = 206, left = 111, width = 4 * slot, radius = 72;
  rect(g, left, 648, width, 35, C.leaf, 4);
  for (let i = 0; i < 4; i++) {
    const x = left + slot * i + slot / 2;
    const color = i === 0 ? C.sea : i === 1 ? C.gold : C.clay;
    const scale = i < oldCount ? 1 : i === oldCount ? added : 0;
    if (i === oldCount && b >= 2) {
      circle(g, x, 476, radius, C.rule);
      circle(g, x, 476, radius - 3, C.paper);
    }
    if (scale > 0) {
      circle(g, x, 476, radius * scale, color);
      if (scale === 1) mono(g, '1', x, 506, 76, C.leaf, 'center');
      rect(g, left + slot * i, 648, (slot - 3) * scale, 35, color, 4);
    }
    if (i < oldCount || (i === oldCount && (b >= 2 || added > 0)))
      text(g, i === 0 ? 'Old target' : 'Row ' + i, x, 599, 36,
        i === 0 ? C.sea : C.ink, 'Sans', 'center');
  }
  mono(g, 'Z = ' + (added === 1 ? after.sum : before.sum), left, 761, 56);
  text(g, 'Old target still contributes one unit.', left, 831, 40, C.sea);

  line(g, 988, 298, 988, 829, C.rule, 3);
  serif(g, 'P(old target)', 1071, 371, 63);
  mono(g, '1 / ' + before.sum, 1071, 505, 87, C.sea);
  mono(g, 'NLL   ' + before.loss.toFixed(3) + ' nats', 1071, 628, 36);
  text(g, 'Before', 1071, 413, 36, C.muted);
  if (b >= 2) {
    text(g, 'After one more row', 1450, 413, 34, C.clay);
    mono(g, '1 / ' + (probability ? after.sum : '?'), 1450, 505, 87, C.sea);
    mono(g, loss ? after.loss.toFixed(3) + ' nats' : '?', 1450, 628, 36);
    const change = increase
      ? 'Δ = ln(' + after.sum + '/' + before.sum + ') = ' + after.increase.toFixed(3)
      : 'Δ = ?';
    mono(g, change, 1071, 761, 42, C.clay);
  }
}
