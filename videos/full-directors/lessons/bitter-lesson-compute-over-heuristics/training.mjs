import assert from 'node:assert/strict';
import { fixedBudgetPlans } from '../../../films/bitter-lesson-compute-over-heuristics/arithmetic.mjs';
import {
  C,
  arrow,
  background,
  cap,
  chip,
  circle,
  clamp,
  cue,
  heading,
  line,
  mono,
  rect,
  smooth,
  tape,
  text,
} from './studio.mjs';

const [first, second] = fixedBudgetPlans();
const firstColumns = first.parameters / 1e9;
const firstRows = first.tokens / 10e9;
const secondColumns = second.parameters / 1e9;
const secondRows = second.tokens / 10e9;
const cellWidth = 42;
const cellHeight = 21.2;

function tileOffset(progress) {
  const turn = 0.6;
  return [
    firstColumns * smooth(progress / turn),
    secondRows * smooth((progress - turn) / (1 - turn)),
  ];
}

function budgetTile(g, x, y, columns, rows, outline) {
  const w = columns * cellWidth;
  const h = rows * cellHeight;
  rect(g, x, y, w, h, '#468694');
  for (let j = 1; j < columns; j++) {
    const xx = x + j * cellWidth;
    line(g, [[xx, y], [xx, y + h]], '#67a3aa', 1.2);
  }
  for (let j = 1; j < rows; j++) {
    const yy = y + j * cellHeight;
    line(g, [[x, yy], [x + w, yy]], '#67a3aa', 1.2);
  }
  line(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], outline, 3);
}

export function training(g, k) {
  const i = k.beat.beatIndex;
  const move = i === 3 ? clamp((k.elapsed - k.wordCue('Seventy billion tokens').end) / 2.2) : 0;
  const showWidth = i > 2 || (i === 2 && k.elapsed >= k.wordCue('fourteen billion parameters').end);
  const x = 143;
  const y = 523;
  const top = y - firstRows * cellHeight;
  const middle = y - secondRows * cellHeight;
  const firstRight = x + firstColumns * cellWidth;
  const secondRight = x + secondColumns * cellWidth;
  background(g, true);
  heading(g, 'Dense training  /  budget geometry', 'How much training text fits?', true);
  for (let j = 0; j <= secondColumns; j++) {
    const xx = x + j * cellWidth;
    line(g, [[xx, y + 6], [xx, 202]], C.grid, 1);
  }
  for (let j = 0; j <= firstRows; j++) {
    const yy = y - j * cellHeight;
    line(g, [[x - 7, yy], [746, yy]], C.grid, 1);
  }
  if (showWidth && move < 1) line(g, [[secondRight, y], [secondRight, 202]], C.brass, 3, [6, 5]);
  if (move === 0) {
    budgetTile(g, x, top, firstColumns, firstRows, C.blue);
  } else {
    line(g, [[x, top], [firstRight, top], [firstRight, y]], C.mist, 2, [6, 6]);
    const [across, down] = tileOffset(move);
    budgetTile(g, x, middle, firstColumns, secondRows, C.blue);
    budgetTile(g, x + across * cellWidth, top + down * cellHeight, firstColumns, secondRows, C.brass);
  }
  line(g, [[x, 190], [x, y], [747, y]], C.white, 2);
  cap(g, 'Training tokens', 62, 174, C.mist);
  cap(g, 'Non-embedding parameters', x, 592, C.mist);
  mono(g, first.tokens / 1e9 + 'B', x - 11, top + 6, 22, C.white, 'right');
  mono(g, first.parameters / 1e9 + 'B', firstRight, y + 33, 24, C.white, 'center');
  if (showWidth)
    mono(g, second.parameters / 1e9 + 'B', secondRight, y + 33, 24, C.brass, 'center');
  if (move === 1) {
    line(g, [[x - 6, middle], [x, middle]], C.white, 2);
    mono(g, second.tokens / 1e9 + 'B', x - 11, middle + 6, 22, C.white, 'right');
  }
  cap(g, 'Estimated training work', 805, 237, C.mist, 15);
  text(g, '6 × N × D', 803, 295, 42, C.white, 'Serif');
  if (i > 1 || (i === 1 && k.elapsed >= k.wordCue('five point eight eight zettaFLOPs').end)) {
    mono(g, '≈ ' + (first.flops / 1e21).toFixed(2), 803, 383, 48, C.brass);
    text(g, 'zettaFLOPs', 805, 424, 28, C.white);
  }
  const showUnit =
    i > 1 ||
    (i === 1 && k.elapsed >= k.wordCue('ten to the twenty-first floating-point operations').end);
  if (showUnit) text(g, '1 zettaFLOP = 10²¹ FLOPs', 804, 474, 19, C.mist, 'Mono');
  if (showWidth && move === 0) text(g, 'Same area. What height?', 804, 539, 25, C.blue, 'Serif');
  if (move === 1)
    mono(g, second.parameters / 1e9 + 'B × ' + second.tokens / 1e9 + 'B', 805, 545, 27, C.blue);
}
const crossEntropy = (ps) => -ps.reduce((sum, p) => sum + Math.log(p), 0) / ps.length;
const probA = [0.5, 0.5],
  probB = [0.25, 0.5];
const fits = [
  ['Kaplan', 0.73, 0.27],
  ['Hoffmann · envelope', 0.5, 0.5],
  ['Hoffmann · IsoFLOP', 0.49, 0.51],
  ['Hoffmann · loss fit', 0.46, 0.54],
];
function lossBench(g, k, i) {
  const leaked = i === 3 && cue(k, 3, 'slip into training', 0.95) === 1;
  const clean = i === 3 && cue(k, 3, 'Put that example aside', 0.8) === 1;
  const trainingX = 65,
    heldX = 650;
  cap(g, 'Training corpus', trainingX, 192, C.mist);
  cap(g, 'Held-out text', heldX, 192, C.mist);
  line(
    g,
    [
      [587, 182],
      [587, 492],
    ],
    C.mist,
    2,
    [5, 6],
  );
  tape(g, trainingX, 224, 466, 68);
  mono(g, 'Rain fell before dawn.', trainingX + 20, 268, 24, C.ink);
  const phrase = clean ? 'The tide was low.' : 'The lamp went out.';
  if (leaked) {
    tape(g, trainingX, 314, 466, 68, '#ffd9b3');
    mono(g, 'The lamp went out.', trainingX + 20, 359, 24, C.ink);
  }
  tape(g, heldX, 224, 466, 68, leaked && !clean ? '#ffd9b3' : C.paper);
  mono(g, phrase, heldX + 19, 268, 24, C.ink);
  if (i === 3) {
    if (leaked && !clean) {
      arrow(g, 648, 332, 542, 352, C.orange);
      cap(g, 'Same passage on both sides', 650, 369, C.orange);
      mono(g, 'P(out)   0.50  →  0.99', 650, 427, 23, C.white);
      mono(
        g,
        'Loss     ' + crossEntropy([0.5]).toFixed(2) + '  →  ' + crossEntropy([0.99]).toFixed(2),
        650,
        465,
        23,
        C.brass,
      );
    }
    text(
      g,
      clean ? 'Compare on a separate passage.' : 'Was this passage seen during training?',
      67,
      570,
      36,
      C.white,
      'Serif',
    );
  } else if (i === 2) {
    cap(g, 'Same training budget', heldX, 333, C.mist);
    const columns = [heldX + 150, heldX + 268, heldX + 407];
    cap(g, 'Run', heldX, 381, C.mist);
    for (const [j, label] of ['P(went)', 'P(out)', 'Mean loss'].entries())
      text(g, label, columns[j], 381, 23, C.white, 'Sans', 600, 'center');
    line(g, [[heldX, 395], [heldX + 466, 395]], C.grid, 2);
    for (const [j, [run, probabilities]] of [['A', probA], ['B', probB]].entries()) {
      const y = 431 + 46 * j;
      mono(g, run, heldX, y, 26, C.white);
      for (const [col, p] of probabilities.entries())
        mono(g, p.toFixed(2), columns[col], y, 26, C.white, 'center');
      mono(g, crossEntropy(probabilities).toFixed(2), columns[2], y, 26, C.brass, 'center');
    }
    text(g, 'At a fixed budget, compare mean held-out loss.', 64, 571, 34, C.white, 'Serif');
  } else {
    const show = cue(k, 1, 'each got probability', 0.4) > 0;
    cap(g, 'Run A  /  actual next tokens', heldX, 338, C.mist);
    if (show)
      for (let j = 0; j < 2; j++) {
        chip(g, ['went', 'out'][j], heldX + j * 221, 359, 114, C.blue, C.deep);
        mono(g, probA[j].toFixed(2), heldX + 123 + j * 221, 385, 20, C.white);
      }
    if (cue(k, 1, 'about point six nine', 0.6) > 0) {
      mono(g, '−ln(0.5) ≈ ' + crossEntropy(probA).toFixed(2), heldX, 461, 27, C.brass);
    }
    text(g, 'Average the costs of the actual next tokens.', 64, 571, 34, C.white, 'Serif');
  }
}
export function allocation(g, k) {
  const i = k.beat.beatIndex;
  background(g, true);
  if (i === 0) {
    heading(g, 'Training work  /  dense projections', 'Where does the six come from?', true);
    const backward = cue(k, 0, 'The backward pass', 1.25);
    cap(g, 'Forward pass', 77, 240, C.blue);
    cap(g, 'Backward pass', 464, 240, C.mint);
    for (let j = 0; j < 6; j++) {
      const x = 74 + j * 181;
      rect(g, x, 269, 151, 130, j < 2 ? C.blue : j - 2 < backward * 4 ? C.mint : C.grid, 5);
      mono(g, 'N', x + 75, 353, 55, j < 2 || j - 2 < backward * 4 ? C.deep : C.mist, 'center');
    }
    mono(g, '≈ 2N', 75, 460, 31, C.blue);
    if (backward === 1) mono(g, '+ 4N  =  6N FLOPs per training token', 442, 460, 31, C.mint);
    text(
      g,
      'Non-embedding weights. Long-context attention can add substantial work.',
      71,
      573,
      25,
      C.white,
      'Serif',
    );
  } else if (i <= 3) {
    heading(
      g,
      'Training experiments  /  evaluation',
      i === 3
        ? 'Was the answer already in training?'
        : 'How much probability went to the observed text?',
      true,
    );
    lossBench(g, k, i);
  } else if (i < 6) {
    heading(g, 'Published scaling fits', 'How does a larger budget divide?', true);
    const count = i === 4 ? 1 : 4;
    cap(g, 'Fit from training runs', 65, 204, C.mist);
    cap(g, 'Growth exponent', 486, 204, C.mist);
    for (let j = 0; j < count; j++) {
      const [name, a, b] = fits[j],
        y = 233 + j * 76,
        w = 613;
      text(g, name, 65, y + 33, 26, C.white, 'Serif');
      rect(g, 486, y, w * a, 46, C.blue);
      rect(g, 486 + w * a, y, w * b, 46, C.mint);
      mono(g, 'N   ' + a.toFixed(2), 486 + (w * a) / 2, y + 30, 19, C.deep, 'center');
      mono(g, 'D   ' + b.toFixed(2), 486 + w * (a + b / 2), y + 30, 19, C.deep, 'center');
    }
    if (i === 4) {
      const [, a, b] = fits[0],
        multiple = 4;
      text(g, 'If training compute grows fourfold', 65, 381, 32, C.white, 'Serif');
      mono(g, 'Parameter count   × ' + (multiple ** a).toFixed(2), 66, 434, 24, C.blue);
      mono(g, 'Training tokens   × ' + (multiple ** b).toFixed(2), 66, 478, 24, C.mint);
    }
    text(g, 'N = parameters     D = tokens', 65, 585, 23, C.brass, 'Mono');
    text(
      g,
      i === 4 ? 'Kaplan et al.  /  2020' : 'Hoffmann et al.  /  2022  /  over 400 models',
      485,
      582,
      22,
      C.mist,
    );
  } else {
    heading(
      g,
      'Training allocation  /  published runs',
      i === 6 ? 'Compare Chinchilla with Gopher' : 'What objective will the deployed model face?',
      true,
    );
    cap(g, 'Model', 62, 222, C.mist);
    cap(g, 'Parameters  /  billions', 290, 222, C.blue);
    cap(g, 'Training tokens  /  billions', 745, 222, C.mint);
    for (const [j, [name, parameters, tokens]] of [
      ['Chinchilla', 70, 1400],
      ['Gopher', 280, 300],
    ].entries()) {
      const y = 265 + j * 108;
      text(g, name, 62, y + 38, 31, C.white, 'Serif');
      rect(g, 290, y, parameters * 1.11, 48, C.blue);
      mono(g, parameters, 290 + parameters * 1.11 + 12, y + 34, 24, C.white);
      rect(g, 745, y, tokens * 0.2, 48, C.mint);
      mono(g, tokens, 745 + tokens * 0.2 + 12, y + 34, 24, C.white);
    }
    if (i === 6) {
      text(
        g,
        'At roughly the same training compute, Chinchilla did better on the reported tasks.',
        63,
        544,
        27,
        C.white,
        'Serif',
      );
    } else {
      mono(g, '1,400 ÷ 70 = 20 tokens per parameter', 62, 515, 29, C.brass);
      text(
        g,
        'Llama 3 compared quality at a fixed inference budget.',
        62,
        581,
        29,
        C.white,
        'Serif',
      );
    }
  }
}
export function checkTraining() {
  assert.equal(first.flops / 1e21, 5.88);
  assert.equal(second.flops, first.flops);
  assert.equal(second.tokens, 70e9);
  assert.equal(2 * firstColumns, secondColumns);
  assert.equal(2 * secondRows, firstRows);
  assert.deepEqual(tileOffset(0), [0, 0]);
  assert.deepEqual(tileOffset(1), [firstColumns, secondRows]);
  for (const progress of [0.25, 0.5, 0.75]) {
    const [across, down] = tileOffset(progress);
    assert(down === 0 || across === firstColumns);
  }
  assert.equal(crossEntropy(probA).toFixed(2), '0.69');
  assert.equal(crossEntropy(probB).toFixed(2), '1.04');
  for (const [, a, b] of fits) assert.equal(a + b, 1);
}
