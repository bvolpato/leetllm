import { C, mix } from './paint.mjs';
import { print } from './prints.mjs';
import {
  notices,
  libraryText,
  passageIds,
  scores,
  rerank,
  states,
  weights,
  bias,
  sigmoid,
} from './evidence.mjs';

const lines = [
  ['Saturday story time', 'starts at ten.'],
  ['Holiday hours', 'vary by branch.'],
  ['Sunday:', 'the library is closed.'],
];
function poster(p, id, x, y, w, h) {
  p.box(x, y, w, h, C.white);
  print(p.c, id, x + 16, y + 15, w - 32, h * 0.5);
  const mid = x + w / 2;
  lines[id].forEach((s, i) =>
    p.text(s, mid, y + h * (0.69 + 0.15 * i), w * 0.083, C.ink, 'Serif', 'center'),
  );
  p.mono(passageIds[id], mid, y + h * 0.955, w * 0.041, C.muted, 'center');
}
export function joint(p) {
  p.base('Sunday question × hours notice', 'Model input');
  if (p.b === 1) {
    p.title('Two texts, two encodings');
    print(p.c, 2, 105, 302, 610, 310);
    p.words(libraryText[2], 105, 674, 640, 48);
    p.text('Encode before the search', 104, 782, 37, C.blue);
    p.arrow(750, 510, 892, 510, C.muted);
    const bars = (x, y, v, col) => v.forEach((s, i) => p.box(x + i * 56, y - s, 38, s, col));
    bars(966, 550, [78, 135, 62, 112], C.teal);
    p.mono('PASSAGE VECTOR', 949, 623, 29, C.teal);
    if (p.at(1, 'Later it compares')) {
      p.line(1230, 423, 1230, 570, C.faint, 4);
      bars(1292, 550, [82, 110, 58, 105], C.blue);
      p.mono('QUERY VECTOR', 1280, 623, 29, C.blue);
      p.text('Compare at search time', 964, 783, 45, C.ink, 'Serif');
    }
    return;
  }
  p.title('One reading of both texts');
  p.mono('SCHEMATIC WORD GROUPS', 105, 290, 28, C.muted);
  const labels = ['[CLS]', 'open', 'on', 'Sunday', '[SEP]', 'Sunday', 'closed', '[SEP]'];
  const centers = labels.map((_, i) => 193 + i * 218);
  labels.forEach((s, i) => {
    const col = i >= 1 && i <= 3 ? C.sky : i === 5 || i === 6 ? C.mint : C.faint;
    p.box(centers[i] - 97, 447, 194, 118, col);
    p.text(s, centers[i], 524, 46, C.ink, 'Serif', 'center');
  });
  p.text('question', centers[2], 637, 40, C.blue, 'Serif', 'center');
  p.text('passage', mix(centers[5], centers[6], 0.5), 637, 40, C.teal, 'Serif', 'center');
  const arc = (i, j, level, col) => {
    const c = p.c;
    c.beginPath();
    c.moveTo(centers[i], 444);
    c.bezierCurveTo(centers[i], level, centers[j], level, centers[j], 444);
    c.strokeStyle = col;
    c.lineWidth = 7;
    c.stroke();
  };
  if (p.at(3, 'Sunday in the question')) arc(3, 5, 255, C.teal);
  if (p.at(3, 'Open can interact')) arc(1, 6, 206, C.gold);
  if (p.b === 4) {
    p.arrow(centers[0], 575, centers[0], 743, C.blue);
    p.text('Final state at [CLS]', 106, 818, 48, C.blue, 'Serif');
    p.words(
      'A representation of this particular question with this particular passage.',
      640,
      813,
      1125,
      42,
      54,
    );
  }
}
export function scalar(p) {
  p.base('Scoring head', 'Toy weights');
  p.title('From a joint state to one number');
  const [h1, h2] = states[2],
    first = h1 * weights[0],
    next = h2 * weights[1];
  if (p.b < 4) {
    print(p.c, 2, 105, 263, 460, 219);
    p.mono('hours-v7', 106, 541, 36, C.red);
    p.text('Final state', 686, 324, 39, C.muted);
    p.mono('[ ' + h1 + ', ' + h2 + ' ]', 688, 434, 74);
    p.text('Weights', 1214, 324, 39, C.muted);
    p.mono('[ 1, 0.5 ]', 1214, 434, 74);
    const a = p.at(1, 'Two times one', 1.2),
      b = p.at(2, 'One times a half', 1.05),
      sub = p.at(3, 'That final number', 0.85);
    const x0 = 160,
      unit = 495,
      value = first * a + next * b + bias * sub;
    for (let k = 0; k <= 6; k++) {
      const x = x0 + (unit * k) / 2;
      p.line(x, 710, x, 742, C.muted, 3);
      p.mono((k / 2).toFixed(1), x, 795, 31, C.muted, 'center');
    }
    p.line(x0, 725, x0 + unit * 3, 725, C.ink, 5);
    p.box(x0, 695, unit * first * a, 22, C.blue);
    if (b > 0) p.box(x0 + unit * first, 695, unit * next * b, 22, C.teal);
    if (sub > 0) p.line(x0 + unit * (first + next), 684, x0 + unit * value, 684, C.red, 8);
    p.dot(x0 + unit * value, 725, 16, C.ink);
    p.mono(value.toFixed(2), x0 + unit * value, 662, 45, C.ink, 'center');
    const prompt =
      p.b === 2
        ? 'Bias = −0.2     Where does the marker finish?'
        : p.b === 3
          ? sub < 1 ? 'Move 0.2 left from the subtotal.' : 'Logit = 2 × 1 + 1 × 0.5 − 0.2'
          : 'Coordinate × weight';
    p.text(prompt, 116, 921, 43, C.ink, 'Sans');
    if (p.b === 3 && p.at(3, 'Each logit belongs'))
      p.mono('Holiday  0.40     Story time  0.05', 875, 996, 34, C.blue);
  } else {
    ['Passage', 'Logit', 'Sigmoid'].forEach((s, i) =>
      p.text(s, [130, 842, 1330][i], 328, 40, C.muted),
    );
    rerank([0, 1, 2]).forEach((id, i) => {
      const y = 467 + i * 155;
      print(p.c, id, 125, y - 73, 156, 74);
      p.text(notices[id], 320, y, 50, C.ink, 'Serif');
      p.mono(scores[id].toFixed(2), 842, y, 57);
      p.arrow(1060, y - 16, 1217, y - 16, C.faint);
      p.mono(sigmoid(scores[id]).toFixed(3), 1330, y, 57, C.teal);
      p.line(126, y + 40, 1770, y + 40, C.faint, 2);
    });
    p.text('Same order after the sigmoid.', 129, 956, 41, C.teal);
  }
}
export function rank(p) {
  p.base('Library search', 'Packed order');
  p.title('Follow the clock across the cutoff');
  const move = p.at(1, 'Slide the notices', 1.8);
  const order = rerank([0, 1, 2]);
  const step = 575;
  p.box(94, 239, step * 2, 614, C.sky);
  p.box(94 + step * 2, 239, step, 614, '#e9ddc7');
  for (let id = 0; id < 3; id++) {
    p.mono('RANK ' + (id + 1), 115 + step * id, 301, 33, id < 2 ? C.blue : C.muted);
    const x = 107 + step * mix(id, order.indexOf(id), move);
    const y = 329 + id * 170;
    p.sheet(x, y, 541, 150);
    print(p.c, id, x + 12, y + 14, 122, 115);
    p.mono(passageIds[id], x + 151, y + 40, 26, C.muted);
    p.mono(scores[id].toFixed(2), x + 522, y + 40, 29, C.blue, 'right');
    lines[id].forEach((s, n) => p.text(s, x + 151, y + 88 + 39 * n, 37, C.ink, 'Serif'));
  }
  if (p.b === 3) {
    p.mono('RECIPROCAL RANK', 122, 939, 31, C.blue);
    p.text('1 / 3    →    1 / 1', 573, 946, 60, C.ink, 'Serif');
  } else
    p.text(
      p.b === 2 ? 'Candidate recall   1 / 1' : 'Blue window   ·   two prompt slots',
      124,
      939,
      42,
      C.blue,
    );
}
export function reply(p) {
  p.base('Library search', 'Answer trace');
  const askStage = p.b === 1 && p.at(1, 'Which stage first contradicts the source');
  p.title(askStage ? 'Which stage first contradicts the source?' : 'What did the assistant read?');
  poster(p, 2, 108, 278, 640, 530);
  p.mono('RETRIEVED 3   →   PACKED 1', 122, 901, 33, C.blue);
  p.arrow(784, 503, 918, 503, C.muted);
  const received = p.at(1, 'Here’s a possible reply');
  if (received) {
    p.sheet(975, 327, 813, 409);
    p.mono('ASSISTANT REPLY', 1029, 408, 29, C.muted);
    const fix = p.at(2, 'No. The library');
    p.words(
      fix ? 'No. The library is closed on Sunday.' : 'Yes. The library is open on Sunday.',
      1029,
      526,
      710,
      64,
      84,
      C.ink,
    );
    if (fix) p.text('Supported by hours-v7', 980, 841, 42, C.teal);
  }
}
