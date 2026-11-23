import {
  batch,
  check,
  enjoyTable,
  enjoyVector,
  featureBiasContract,
  middleRows,
  proof,
  sentenceWords,
  shape,
  bias,
} from './examples.mjs';
import {
  arrow,
  background,
  beat,
  brace,
  brass,
  composingStick,
  cue,
  foot,
  frame,
  galley,
  ink,
  line,
  milk,
  mix,
  mono,
  name,
  paper,
  roller,
  row,
  span,
  stock,
  teal,
  text,
} from './typecase.mjs';
import { broadcasts, contracts, reductions, rounding } from './arithmetic.mjs';
import { flattenTranspose, layouts, memory } from './memory.mjs';
import { scores, caller, heads, modelHead } from './attention.mjs';

function opening(c, k) {
  const printWord = cue(k, 1, 'Read the word', 1.55);
  const bringTray = cue(k, 1, 'Each numbered piece', 1.15);
  const slots = cue(k, 1, 'the first two', 0.45);
  const returned = cue(k, 1, 'came back with', 1.2, 'The proof came back with');
  const origin = cue(k, 2, 'belong to Birds', 0.75);
  const requested = cue(k, 2, 'Migrate starts', 0.7);
  const audit = proof(batch, 0, 0, 1);

  if (bringTray > 0) {
    c.save();
    c.globalAlpha = bringTray;
    c.translate(mix(-75, 0, bringTray), 0);
    name(c, 'Sentence 0', 300, 125, 28, milk, 'center');
    galley(c, batch[0], sentenceWords[0], 155, 175, 71, 64);
    composingStick(c, 148, 169, 297, 202);
    if (origin) frame(c, 296, 173, 143, 65, brass);
    if (requested) frame(c, 154, 238, 142, 64, teal);
    c.restore();
  }

  const slipX = mix(317, 564, bringTray);
  paper(c, slipX, 119, 325, 255);
  text(c, 'Requested word', slipX + 22, 148, 17, ink);
  const printEdge = mix(slipX + 12, slipX + 303, printWord);
  c.save();
  c.beginPath();
  c.rect(slipX, 160, printEdge - slipX, 66);
  c.clip();
  name(c, 'migrate', slipX + 22, 191, 48, ink);
  c.restore();
  if (printWord < 1) roller(c, printEdge, 163, 57);
  line(c, slipX + 22, 227, slipX + 303, 227, '#ae9d7c');

  if (slots > 0) {
    c.save();
    c.globalAlpha = slots;
    text(c, 'First two features', slipX + 22, 253, 17, ink);
    const returnEdge = mix(slipX + 40, slipX + 285, returned);
    for (const [i, value] of audit.actual[0].entries()) {
      const center = slipX + 103 + i * 118;
      line(c, center - 36, 342, center + 36, 342, '#897b64', 2);
      c.save();
      c.beginPath();
      c.rect(slipX, 273, returnEdge - slipX, 65);
      c.clip();
      mono(c, value, center, 307, 50, ink, 'center');
      c.restore();
    }
    if (returned > 0 && returned < 1) roller(c, returnEdge, 276, 59);
    c.restore();
  }
  if (origin) span(c, slipX, 206, 451, 206, origin);
  if (requested) brace(c, 156, 391, 141, 'wanted  ' + audit.wanted.join(', '), teal);
}

function address(c, k) {
  const b = beat(k),
    add = cue(k, 1, 'Together they make one batch', 0.8);
  const word = cue(k, 1, 'the token index picks a word', 0.6);
  const digit = cue(k, 1, 'the feature index picks one number', 0.45);
  const xs = [166, 626];
  for (let i = 0; i < 2; i++) {
    if (i === 1 && add === 0) continue;
    c.save();
    if (i === 1) {
      c.globalAlpha = add;
      c.translate(35 * (1 - add), 0);
    }
    name(c, 'Sentence ' + i, xs[i] + 117, 126, 27, milk, 'center');
    galley(c, batch[i], sentenceWords[i], xs[i], 177, 59, 48, i);
    if (i === 0 && word) frame(c, xs[i] - 2, 224, 236, 50);
    if (i === 0 && digit) frame(c, xs[i], 225, 59, 48, teal);
    c.restore();
  }
  if (b < 3) {
    if (cue(k, 2, 'Its shape lists', 0.4)) {
      brace(c, 166, 341, 236, '4 features');
      brace(c, 626, 341, 236, '4 features');
      mono(c, 'B = 2     T = 3     D = 4', 480, 401, 25, milk, 'center');
    }
    foot(c, b === 1 ? 'x[batch, token, feature]' : 'x.shape = (2, 3, 4)     feature axis = −1');
  } else {
    const cast = cue(k, 3, 'All twenty-four values', 0.5) > 0;
    const result = featureBiasContract(shape, bias, cast ? 'float32' : 'int16');
    mono(c, 'shape (2, 3, 4)   PASS', 245, 380, 21, teal, 'center');
    mono(
      c,
      (cast ? 'float32' : 'int16') + '   ' + (result.dtype ? 'PASS' : 'FAIL'),
      710,
      380,
      23,
      result.dtype ? teal : brass,
      'center',
    );
    foot(c, cast ? 'x = x.astype(np.float32)     x[0, 1, 0] = 4' : 'Required dtype    float32');
  }
}

function indexing(c, k) {
  const b = beat(k);
  if (b === 4) {
    name(c, 'Token position 1', 285, 122, 27, milk, 'center');
    for (let i = 0; i < 2; i++) {
      const y = 165 + i * 115;
      name(c, 'Sentence ' + i, 58, y + 26, 22);
      row(c, middleRows[i], 176, y, 55, 59, stock[i * 3 + 1]);
      text(c, sentenceWords[i][1], 176, y + 80, 17, stock[i * 3 + 1]);
    }
    arrow(c, 427, 252, 76);
    const p = cue(k, 4, 'Read down the result', 0.8);
    paper(c, 530, 133, 326, 234);
    text(c, 'x[:, 1, :]', 552, 160, 20, ink, 'left', 'Mono');
    c.save();
    c.globalAlpha = p;
    middleRows.forEach((r, i) => row(c, r, 577, 192 + i * 67, 55, 55, stock[3 * i + 1]));
    c.restore();
    foot(c, 'x[:, 1, :]     (batch, feature) = (2, 4)');
    return;
  }
  name(c, 'Sentence 1', 257, 130, 26, milk, 'center');
  galley(c, batch[1], sentenceWords[1], 146, 173, 57, 54, 1);
  const selected = cue(k, 1, 'A colon retains', 0.6);
  if (selected) frame(c, 143, 225, 233, 57);
  arrow(c, 403, 251, 64);
  const table = b === 3 && cue(k, 3, 'The slice keeps', 0.5) > 0;
  paper(c, 489, 123, 410, 237);
  mono(c, b === 1 ? 'x[1, 1, :]' : 'x[1, 1:2, :]', 514, 157, 23, ink);
  const pending = b === 2 || (b === 3 && !table);
  if (!pending && selected) row(c, table ? enjoyTable[0] : enjoyVector, 545, 202, 75, 61, stock[4]);
  if (pending) {
    mono(c, '[  ?  ]', 692, 236, 33, ink, 'center');
    text(c, 'Slice from 1 up to 2', 692, 316, 18, ink, 'center');
  } else if (selected) {
    if (table) frame(c, 540, 193, 311, 78, ink);
    mono(c, table ? '(1, 4)   one token row' : '(4,)   four features', 691, 316, 21, ink, 'center');
  }
  foot(
    c,
    b === 3 && cue(k, 3, 'Add an axis', 0.3) > 0
      ? 'v[None, :]  →  (1, 4)       v[:, None]  →  (4, 1)'
      : b === 3
        ? 'The slice retains one token row.'
        : b === 2
          ? 'What survives a one-word slice?'
          : 'Integer indices select and remove their axes.',
  );
}

const chapters = [
  opening,
  address,
  indexing,
  broadcasts,
  contracts,
  reductions,
  rounding,
  layouts,
  memory,
  scores,
  caller,
  heads,
];
export default {
  title: 'Keep Tensor Values Attached to Their Words',
  check,
  draw(c, k) {
    let painter = chapters[k.beat.chapterIndex];
    let title = k.beat.chapterTitle;
    if (painter === memory && beat(k) === 7) {
      painter = flattenTranspose;
      title = 'Which source positions does the transpose read?';
    } else if (
      painter === heads &&
      beat(k) === 11 &&
      cue(k, 11, 'With seven hundred', 0) &&
      !cue(k, 11, 'In the CUDA lesson', 0)
    ) {
      painter = modelHead;
      title = 'Which features belong to this head?';
    }
    c.save();
    c.scale(2, 2);
    background(c, title);
    painter(c, k);
    c.restore();
  },
};
