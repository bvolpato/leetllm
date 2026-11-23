import { IMAGE, KERNEL, ARTICLE_CROP, RIDGE } from '../../../films/convolution/fixtures.mjs';
import { cropForward, patchProjection } from '../../../films/convolution/model.mjs';
import { correlate, poolSnapshot, residualSlice } from '../../../films/convolution/arithmetic.mjs';
import {
  ink,
  teal,
  rust,
  gold,
  sea,
  pale,
  paper,
  white,
  muted,
  steel,
  box,
  line,
  dot,
  arrow,
  mono,
  label,
  heading,
  rule,
  outline,
  grid,
  windowOn,
  mounted,
  panelPhoto,
  cue,
  said,
  crop,
  index,
  total,
  fmt,
  signed,
  blend,
} from './bench.mjs';

export const base = cropForward();
export function reluReadings(t) {
  const clipped = said(t, 5, 'clips the first', 'and keeps the second');
  const passed = said(t, 5, 'and keeps the second', 'Stack affine');
  return [-0.4, 0.4].map((raw, i) => ({
    raw,
    output: (i === 0 ? clipped : passed) ? Math.max(0, raw) : null,
  }));
}
export function forward(g, t) {
  const b = t.beat.beatIndex,
    chosen = said(t, 1, 'The bottom right', 'Save its address');
  if (b === 5) {
    const scale = 261,
      ox = 375,
      oy = 369;
    arrow(g, ox - 204, oy, ox + 204, oy, muted, 2);
    arrow(g, ox, oy + 8, ox, oy - 175, muted, 2);
    label(g, 'raw', ox + 225, oy, 20);
    label(g, 'after ReLU', ox - 8, oy - 195, 21);
    line(g, ox - 159, oy, ox, oy, teal, 4);
    line(g, ox, oy, ox + 155, oy - 155, teal, 4);
    mono(g, '0', ox, oy + 29, 18, muted);
    for (const [i, { raw, output }] of reluReadings(t).entries()) {
      const x = ox + raw * scale;
      const color = raw < 0 ? rust : teal;
      line(g, x, oy, x, oy + 9, color, 3);
      mono(g, fmt(raw), x, oy + 29, 18, color);
      if (output !== null) {
        const y = oy - output * scale;
        if (output > 0) {
          line(g, x, oy - 4, x, y, steel, 1);
          line(g, ox, y, x, y, steel, 1);
          mono(g, fmt(output), ox - 14, y, 18, muted, 'right');
        }
        dot(g, x, y, 8, color);
      }
      const y = 257 + 115 * i;
      mono(g, fmt(raw), 762, y, 34, color);
      arrow(g, 826, y, 897, y, steel);
      mono(g, output === null ? '?' : fmt(output), 979, y, 34, output === null ? muted : color);
    }
    label(g, 'Raw response', 754, 173, 22);
    label(g, 'After ReLU', 977, 173, 22);
    rule(g, 'ReLU(x) = max(0, x). The slope changes at zero.', { y: 521 });
    return;
  }
  heading(g, 'Panel crop', 225, 151);
  mounted(g, ARTICLE_CROP, 92, 202, 66, { font: 20 });
  if (chosen) windowOn(g, 92, 202, 66, ...base.pool.owners[0].input);
  const activated = said(t, 0, 'First apply ReLU', 'All four pass through');
  heading(g, activated ? 'After ReLU' : 'Ridge responses', 561, 151);
  grid(g, activated ? base.activated : base.raw, 473, 247, 88, { font: 22 });
  if (chosen) windowOn(g, 473, 247, 88, ...base.pool.owners[0].input, 1, 1);
  arrow(g, 390, 334, 449, 334);
  arrow(g, 677, 334, 738, 334);
  heading(g, 'Two-class head', 950, 151);
  const rows = [
    ['1.4', '− 0.2'],
    ['−0.9', '+ 0.1'],
  ];
  for (let i = 0; i < 2; i++) {
    const y = 231 + i * 143,
      ready = i ? said(t, 1, 'then add one tenth') : said(t, 1, 'then subtract two tenths', 'The second weight');
    label(g, 'Logit ' + i, 921, y, 22, muted);
    mono(g, rows[i][0] + ' × ' + (chosen ? fmt(base.value) : 'max') + ' ' + rows[i][1], 930, y + 42, 22);
    if (ready) mono(g, fmt(base.logits[i], 4), 930, y + 84, 31, i ? rust : teal);
  }
  const captions = [
    'Which window will set both scores?',
    'Save the address of the maximum on this forward pass.',
    'Raising this pooled feature raises logit 0 and lowers logit 1.',
    'Agreement within 0.000001 checks the fixed-weight arithmetic.',
    '(1,1,4,4)  →  (1,1,2,2)  →  (1,1,1,1)  →  (1,1)  →  (1,2)',
    'Stacking affine layers alone still gives an affine map. ReLU can change the rule.',
  ];
  if (b === 3) {
    label(g, captions[b], 601, 510, 23);
  } else {
    rule(g, captions[b]);
  }
}
function station(g, x, y, title, enabled = true, w = 116) {
  box(g, x - w / 2, y - 25, w, 50, enabled ? sea : pale);
  outline(g, x - w / 2, y - 25, w, 50, enabled ? teal : steel, 1.7);
  label(g, title, x, y, 19);
}
export function residual(g, t) {
  const b = t.beat.beatIndex;
  heading(g, 'Residual branch', 606, 155);
  const stages = ['Conv 3 × 3', 'BatchNorm', 'ReLU', 'Conv 3 × 3', 'BatchNorm'];
  const seq = b < 2 ? 0 : cue(t, 2, 'three-by-three convolution', 3);
  for (let i = 0; i < 5; i++) {
    const x = 235 + i * 137;
    if (i < 4) arrow(g, x + 58, 275, x + 79, 275, steel, 2);
    station(g, x, 275, stages[i], b < 2 || i <= index(seq, 5));
  }
  arrow(g, 107, 275, 174, 275);
  dot(g, 114, 275, 7, ink);
  line(g, 114, 275, 114, 431, ink, 3);
  line(g, 114, 431, 938, 431, ink, 3);
  arrow(g, 938, 431, 938, 313, ink);
  arrow(g, 842, 275, 908, 275);
  dot(g, 938, 275, 28, teal);
  mono(g, '+', 938, 275, 29, white);
  arrow(g, 967, 275, 1009, 275);
  station(g, 1070, 275, 'ReLU', true, 104);
  label(g, 'Saved input', 282, 400, 25);
  if (b === 1) {
    mono(g, 'x = 2', 461, 400, 26);
    if (cue(t, 1, 'minus one')) mono(g, 'F(x) = −1', 760, 218, 26, rust);
    if (said(t, 1, 'sum is one', 'The branch only')) mono(g, '1', 990, 218, 30, teal);
  } else if (b >= 2) {
    const change = b === 3 && cue(t, 3, 'sixteen channels to thirty-two') > 0;
    const projected = b === 3 && cue(t, 3, 'one-by-one projection') > 0;
    mono(g, change ? '16 input channels' : '1 × 16 × 28 × 28', 555, 400, 24, teal);
    mono(g, change ? '1 × 32 × 28 × 28' : '1 × 16 × 28 × 28', 764, 216, 23, muted);
    if (change) {
      if (projected) station(g, 745, 431, '1 × 1 conv', true, 136);
      mono(g, projected ? '32 ch' : '16 ch', 944, 471, 20, projected ? teal : rust);
    }
  }
  const captions = [
    'The shortcut preserves the input until the addition.',
    'The learned branch supplies a change around the input.',
    'Padding 1 and 16 output channels preserve the shape.',
    'To add two tensors element by element, make their shapes agree.',
    'BatchNorm trains with per-channel batch and spatial statistics. Evaluation reuses running estimates.',
    'Every output position receives a branch value and its matching identity value.',
  ];
  rule(g, captions[b], { y: 515 });
}
export function gradientPaths(g, t) {
  const b = t.beat.beatIndex;
  const cancel = b === 2 && cue(t, 2, 'minus one', 0) && !cue(t, 2, 'Now restore', 0);
  const closed = said(t, 2, 'make the sum negative', 'The post-addition ReLU');
  const slope = cancel ? -1 : 0.2,
    gate = closed ? 0 : 1,
    s = residualSlice(slope, 3, gate);
  heading(g, 'Back through the residual sum', 554, 152);
  const path = (y, v, name, color) => {
    line(g, 314, y, 786, y, color, 4);
    label(g, name, 547, y - 42, 23);
    mono(g, signed(v), 544, y + 35, 30, color);
    line(g, 314, y, 224, 330, color, 3);
    line(g, 786, y, 852, 330, color, 3);
    arrow(g, 640, y, 592, y, color, 3);
  };
  path(231, s.branch, 'Branch slope  ' + fmt(slope), rust);
  path(433, s.identity, 'Identity slope  1', teal);
  dot(g, 214, 330, 26, ink);
  mono(g, '+', 214, 330, 28, white);
  arrow(g, 182, 330, 123, 330);
  const answered = cancel ? said(t, 2, 'total is zero', 'Both paths')
    : said(t, 1, 'three point six', 'This derivative');
  mono(g, answered ? fmt(s.total) : '?', 91, 330, 38);
  line(g, 852, 330, 914, 330, ink, 3);
  station(g, 967, 330, closed ? 'Closed' : 'Open', !closed, 96);
  arrow(g, 1101, 330, 1022, 330);
  mono(g, '3', 1119, 330, 34);
  label(g, 'ReLU gate', 963, 401, 21, muted);
  label(
    g,
    closed
      ? 'A closed post-addition gate blocks both backward paths.'
      : cancel
        ? (answered ? 'The two paths meet with equal and opposite gradients.' : 'Add the two signed paths at the input.')
        : 'Open ReLU gate: incoming gradient × (1 + branch slope)',
    600,
    512,
    23,
  );
}
const projection = patchProjection();
export function patches(g, t) {
  const b = t.beat.beatIndex;
  const inspect =
    b < 2
      ? index(cue(t, 0, 'nonoverlapping image patches', 3), 4)
      : b === 2
        ? index(cue(t, 2, 'Four patches', 2), 4)
        : b === 3
          ? index(cue(t, 3, 'next nonoverlapping patch', 2), 4)
          : 0;
  const r = Math.floor(inspect / 2),
    c = inspect % 2;
  heading(g, 'Four nonoverlapping patches', 226, 150);
  mounted(g, projection.image, 89, 204, 70, { print: (v) => Math.round(v * 16) + '/16', font: 15 });
  windowOn(g, 89, 204, 70, 2 * r, 2 * c, 2, 2);
  if (b === 4) {
    heading(g, 'Patches after projection', 835, 151);
    const pos = [
      [716, 239],
      [940, 239],
      [716, 422],
      [940, 422],
    ];
    const far = cue(t, 4, 'opposite corners') > 0;
    for (const [i, [x, y]] of pos.entries()) {
      if (i !== 0 && (far || i < 3)) line(g, pos[0][0], pos[0][1], x, y, i === 3 ? rust : steel, 4);
    }
    for (const [i, [x, y]] of pos.entries()) {
      dot(g, x, y, 40, i === 0 || (i === 3 && far) ? sea : pale);
      mono(g, 'T' + i, x, y, 25);
    }
    rule(g, 'Position embeddings carry the patch addresses into self-attention.', { y: 531 });
  } else if (b === 3) {
    heading(g, 'One row folded into a kernel', 611, 151);
    const fold = cue(t, 3, 'Fold it into two rows', 1.2);
    const cell = 58;
    for (const [j, v] of projection.weights[0].entries()) {
      const x = blend(471 + j * cell, 531 + (j % 2) * cell, fold);
      const y = blend(290, 259 + Math.floor(j / 2) * cell, fold);
      grid(g, [[v]], x, y, cell, { print: signed });
    }
    mono(g, 'bias  ' + fmt(projection.bias[0]), 601, 420, 22);
    arrow(g, 719, 308, 777, 308);
    heading(g, 'Token ' + inspect, 961, 151);
    projection.tokens[inspect].forEach((v, i) => {
      label(g, 'Feature ' + i, 865, 226 + i * 94, 20);
      mono(g, fmt(v, 5), 1028, 226 + i * 94, 25, teal);
    });
    rule(g, 'Matching order and bias give the same three outputs for this patch.');
  } else {
    heading(g, 'Flattened patch', 688, 151);
    grid(g, [projection.patches[inspect]], 491, 226, 96, {
      print: (v) => Math.round(v * 16) + '/16',
      font: 20,
    });
    if (b > 0) {
      arrow(g, 682, 340, 682, 388);
      mono(g, '3 features', 682, 430, 25, teal);
      mono(g, 'T' + inspect, 1003, 274, 44);
    }
    rule(
      g,
      b === 0
        ? 'An RGB patch of side P gives 3 × P² input values.'
        : 'Grayscale example   •   3 × 4 weights + 3 biases   •   kernel 2, stride 2',
      { y: 524 },
    );
  }
}
export const inspectionRun = [
  { where: 'Center', caught: [true, true, true, true, true, true, true, true, true, false] },
  { where: 'Border', caught: [false, false] },
];
export function selection(g, t) {
  const b = t.beat.beatIndex;
  if (b === 0) {
    const entries = [
      ['ViT', 'Patch tokens', 'Large-scale pretraining'],
      ['DeiT', 'Patch tokens', 'ImageNet and teacher distillation'],
      ['ConvNeXt', 'Local convolutions', 'Modernized convolutional design'],
    ];
    entries.forEach(([model, mixer, training], i) => {
      const present = i === 0 || (i === 1 ? cue(t, 0, 'DeiT later') : cue(t, 0, 'ConvNeXt modernized'));
      if (!present) return;
      const y = 204 + i * 118;
      panelPhoto(g, 83, y - 34, 113, 69, i === 1 ? 'border' : 'center');
      label(g, model, 231, y, 32, ink, 'left', 'Serif');
      label(g, mixer, 433, y, 23, muted, 'left');
      label(g, training, 682, y, 22, ink, 'left');
      line(g, 81, y + 56, 1120, y + 56, steel, 1);
    });
    rule(g, 'Reported rankings depend on the training recipe and the task.');
  } else if (b === 1) {
    for (const [i, name] of ['Small central mark', 'Small border mark'].entries()) {
      const x = 116 + i * 526;
      heading(g, name, x + 203, 151);
      panelPhoto(g, x, 210, 403, 209, i ? 'border' : 'center');
      label(g, 'Same held-out photo for each candidate', x + 201, 468, 21);
    }
    rule(g, 'Compare accuracy on each slice and inference time on the target hardware.', { y: 521 });
  } else {
    heading(g, 'One detection attempt per labeled defect', 609, 153);
    inspectionRun.forEach(({ where, caught }, i) => {
      const x = 120,
        y = 207 + i * 153;
      const show = i ? said(t, 2, 'misses both border marks', 'Nine detections overall')
        : said(t, 2, 'catches nine of ten', 'It misses');
      panelPhoto(g, x, y, 126, 78, i ? 'border' : 'center');
      label(g, where, x + 65, y + 101, 20);
      caught.forEach((hit, j) => {
        const cx = 300 + j * 65;
        dot(g, cx, y + 38, 23, show ? (hit ? teal : rust) : steel);
        if (show) {
          if (hit) {
            line(g, cx - 8, y + 37, cx - 2, y + 44, white, 3);
            line(g, cx - 2, y + 44, cx + 10, y + 29, white, 3);
          } else {
            line(g, cx - 7, y + 32, cx + 7, y + 46, white, 3);
            line(g, cx - 7, y + 46, cx + 7, y + 32, white, 3);
          }
        }
      });
      mono(
        g,
        show ? caught.filter(Boolean).length + ' / ' + caught.length : '?',
        1060,
        y + 39,
        28,
        i ? rust : teal,
      );
    });
    const all = inspectionRun.flatMap((row) => row.caught);
    rule(
      g,
      said(t, 2, 'Nine detections overall', 'Before choosing')
        ? 'Toy run   •   ' +
            all.filter(Boolean).length +
            ' / ' +
            all.length +
            ' overall   •   Inspect the border misses before choosing a model.'
        : 'Toy run on 12 defect photos. How many border marks did the model detect?',
    );
  }
}
export const reversed = IMAGE.map((row) => row.map((v) => 1 - v));
export function reverseEdge(g, t) {
  const inv = said(t, 1, 'Reverse the brightness', 'The left column'),
    measured = t.beat.beatIndex > 1 ||
      (t.beat.beatIndex === 1 && t.elapsed >= t.wordCue('minus three').end),
    relu = said(t, 2, 'Replace each negative', 'With this filter');
  const panel = inv ? reversed : IMAGE;
  const raw = correlate(panel, KERNEL),
    out = relu ? raw.map((row) => row.map((v) => Math.max(0, v))) : raw;
  heading(g, 'Panel camera', 210, 155);
  mounted(g, panel, 75, 199, 54, { digits: false });
  windowOn(g, 75, 199, 54, 0, 1);
  heading(g, 'Fixed stencil', 552, 155);
  grid(g, KERNEL, 477, 253, 50, { print: signed, font: 19 });
  if (inv) {
    const patch = crop(panel, 0, 1);
    for (const c of [0, 2]) {
      const count = patch.reduce((sum, row) => sum + row[c], 0);
      mono(g, count + ' × (' + signed(KERNEL[0][c]) + ')', 487 + c * 67, 449, 19, c ? teal : rust);
      windowOn(g, 75, 199, 54, 0, 1 + c, 3, 1, c ? teal : rust);
    }
  }
  arrow(g, 662, 328, 742, 328);
  heading(g, relu ? 'After ReLU' : 'Signed map', 928, 155);
  grid(g, out, 803, 205, 83, { print: signed, show: () => !inv || measured });
  rule(
    g,
    !inv
      ? 'What sign will the boundary have if the two finishes exchange places?'
      : relu
        ? 'The reversed edge has a negative response. ReLU sends zero onward.'
        : measured ? 'Bright on the left and dark on the right gives a negative response.'
        : 'Count the bright pixels in each outlined column. Apply the same weights.',
  );
}
export function exposureState(pixel) {
  const result = cropForward(pixel);
  const back = poolSnapshot(result.activated, { incoming: [[-2]] });
  return { ...result, grad: back.gradient, owner: back.owners[0].input };
}
export function exposure(g, t) {
  const b = t.beat.beatIndex,
    repeat = b >= 4;
  const edited = repeat ? cue(t, 4, 'corner goes from') > 0 : cue(t, 0, 'Darken just the corner') > 0;
  const target = repeat ? 0.02 : 0.01,
    pixel = edited ? target : ARTICLE_CROP[0][0];
  const trial = repeat ? 5 : 1;
  const multiplying = cue(t, trial, 'Multiply', 0);
  const gainPhrase = repeat ? 'eighteen thousandths' : 'twenty-four thousandths';
  const gainKnown = b === trial ? t.reveal('thousandths', 0, { captionStart: gainPhrase }) : b > trial;
  let answer = Number(b > trial);
  if (b === trial) {
    const value = repeat ? 'point eight seven zero' : 'point eight seven six';
    const lastDigit = repeat ? 'zero. Trace' : 'six. Trace';
    const travel = t.wordCue(lastDigit).start - t.wordCue(value).start;
    answer = t.reveal(value, travel);
  }
  const scores = repeat ? (b === 5 ? t.reveal('stay where they started', 0, { captionStart: 'both class scores' }) : b > 5)
    : said(t, 3, 'The first score', 'Now send');
  const backward = repeat ? b === 6 && t.reveal('right. Two nearly', 0, { captionStart: 'Follow minus two' })
    : said(t, 3, 'It goes to the upper left', 'the address saved');
  const winnerBeat = repeat ? 5 : 2;
  const showWinner = b === winnerBeat
    ? t.reveal(repeat ? 'wins' : 'leads', 0, { captionStart: repeat ? 'bottom right still wins' : 'now leads' })
    : b > winnerBeat;
  const saved = repeat ? cue(t, 5, 'so the pooled value', 0) : showWinner;
  const result = exposureState(pixel);
  const oldPixel = ARTICLE_CROP[0][0];
  const weight = RIDGE[0][0];
  const oldResponse = base.raw[0][0];
  const newResponse = result.raw[0][0];
  const gain = (pixel - oldPixel) * weight;
  const [r, c] = showWinner ? result.owner : [0, 0];
  heading(g, repeat ? 'Second exposure' : 'First exposure', 209, 151);
  mounted(g, result.image, 79, 201, 65, { font: 20, mark: (r, c) => (r + c === 0 ? rust : false) });
  if (repeat ? b >= 5 : said(t, 1, 'Only the upper-left window', 'The pixel fell'))
    windowOn(g, 79, 201, 65, r, c, 3, 3, showWinner ? teal : gold);
  heading(g, 'Compare the two windows', 689, 151);
  const left = 468,
    right = 912,
    lo = 0.85,
    hi = 0.88;
  const xpos = (v) => left + ((v - lo) / (hi - lo)) * (right - left);
  const y0 = 285,
    y1 = 397,
    ref = xpos(base.value);
  for (const val of [0.85, 0.86, 0.87, 0.88]) {
    const x = xpos(val);
    line(g, x, 225, x, 432, steel, 1);
    mono(g, val.toFixed(2), x, 202, 18);
  }
  line(g, ref, 222, ref, 397, teal, 2);
  for (const y of [y0, y1]) {
    line(g, left, y, right, y, muted, 1);
  }
  const upperLabel = edited && answer < 1 ? 'Upper left after edit   ?' : 'Upper left';
  box(g, left - 3, y0 - 40, edited && answer < 1 ? 205 : 90, 29, paper);
  label(g, upperLabel, left, y0 - 25, 19, ink, 'left');
  label(g, 'Bottom right', left, y1 - 25, 19, ink, 'left');
  const marker = (v, y, color, caption, hollow = false) => {
    const x = xpos(v);
    dot(g, x, y, 9, color);
    if (hollow) dot(g, x, y, 5, paper);
    const width = caption.length * 13 + 12;
    box(g, x - width / 2, y + 13, width, 30, paper);
    mono(g, caption, x, y + 28, 20, color);
  };
  marker(base.value, y1, teal, base.value.toFixed(3));
  if (answer > 0) {
    const x = xpos(blend(oldResponse, newResponse, answer));
    line(g, xpos(oldResponse), y0, x, y0, rust, 4);
    dot(g, x, y0, 8, rust);
  }
  marker(oldResponse, y0, edited ? muted : rust, (edited ? 'Before  ' : '') + oldResponse.toFixed(3), edited);
  if (answer === 1) marker(newResponse, y0, rust, 'After  ' + newResponse.toFixed(3));
  label(g, 'Map gradient', 1048, 207, 20, ink);
  grid(g, result.grad, 978, 251, 71, { font: 25, show: () => backward });
  if (backward) windowOn(g, 978, 251, 71, ...result.owner, 1, 1, teal);
  mono(g, 'Corner  ' + oldPixel.toFixed(2) + (edited ? ' → ' + pixel.toFixed(2) : ''), 209, 495, 21);
  const equation = multiplying ? '(' + fmt(pixel - oldPixel) + ') × (' + fmt(weight) + ') = ' + (gainKnown ? signed(gain) : '?')
    : 'Aligned corner weight   ' + fmt(weight);
  mono(g, equation, 690, 488, 22, rust);
  const foot = scores
    ? 'Logits  (' + result.logits.map((v) => fmt(v, 4)).join(', ') + ')'
    : saved
      ? 'Saved maximum  ' + fmt(result.value) + '  at (' + result.owner.join(', ') + ')'
      : repeat
        ? 'Where will −2 go on this exposure?'
        : answer === 1 ? 'Compare the new response with the bottom-right reference.'
        : 'Will the corner edit change which window wins?';
  rule(
    g,
    foot + (scores && backward ? '       •       −2 returns to (' + result.owner.join(', ') + ')' : ''),
    { y: 531 },
  );
}
