import {
  ink,
  muted,
  brass,
  blue,
  teal,
  rust,
  paper,
  grid,
  num,
  vector,
  cue,
  text,
  mono,
  rect,
  line,
  path,
  circle,
  arrow,
  title,
  rule,
  gaugeBlock,
  socket,
  row,
} from './instrument.mjs';
import { start, depthStep, writeGrowth, heldOut, deep, q, keyRows, score, shares } from './experiments.mjs';

export function depth(c, k) {
  const i = k.beat.beatIndex;
  if (i === 0) {
    title(
      c,
      'Which gradient does the bound cover?',
      'Xiong et al.    ·    simplified initialization with uniform attention',
    );
    for (let j = 0; j < 8; j++) {
      const xx = 135 + j * 119;
      if (j === 4) {
        mono(c, '···', xx + 44, 553, 39, muted, 'center');
        continue;
      }
      rect(c, xx, 485, 88, 138, j === 7 ? brass : '#b3c9c6');
      line(c, xx + 12, 520, xx + 76, 520, paper, 3);
      line(c, xx + 12, 560, xx + 76, 560, paper, 3);
      if (j < 7) arrow(c, xx + 89, 553, xx + 115, 553, muted, 3);
    }
    text(c, 'Earlier blocks', 135, 682, 38, muted);
    text(c, 'Last FFN', 1010, 682, 38, brass, 'center');
    text(c, 'Second weight matrix', 1310, 350, 40, ink, 'center');
    line(c, 1000, 478, 1240, 392, brass, 4);
    mono(c, 'Post-LN  O(d √ln d)', 1190, 546, 35, ink);
    if (cue(k, 1, 'Pre-LN upper bound')) mono(c, 'Pre-LN   O(d √(ln d / L))', 1190, 681, 35, teal);
    text(c, 'Upper bounds at initialization. Here d is width and L is depth.', 103, 934, 38, muted);
    return;
  }
  if (i <= 2) {
    const rate = Number((0.01 - 0.009 * cue(k, 2, 'a tenfold smaller early rate', 1.3)).toFixed(4));
    title(
      c,
      'Shrink the early update',
      'Illustrative gradient descent    ·    update norm = learning rate × gradient norm',
    );
    mono(c, 'Learning rate   ' + num(rate, 4), 105, 293, 49, blue);
    const updates = depthStep(rate);
    for (let j = 0; j < 2; j++) {
      const y = 458 + 219 * j,
        g = j ? 8 : 1;
      text(c, j ? 'Top block' : 'Lower block', 106, y, 42, ink);
      mono(c, 'gradient ' + g, 107, y + 66, 34, muted);
      const w = 12500 * updates[j];
      rect(c, 539, y - 28, 12500 * g * 0.01, 72, '#d8ddd0');
      rect(c, 539, y - 28, w, 72, j ? brass : blue);
      mono(c, num(updates[j], 4), 1632, y + 8, 49, j ? brass : blue);
    }
    text(c, 'Compare gradient norms and actual optimizer updates through warmup.', 109, 930, 38, muted);
    return;
  }
  if (i <= 4) {
    const showSD = cue(k, 4, 'each write has unit variance', 1.9);
    title(
      c,
      'Eight writes, two growth models',
      'The aligned example measures length. The uncorrelated example measures standard deviation.',
    );
    const px = (n) => 208 + n * 133,
      py = (n) => 846 - n * 60;
    for (const v of [0, 3, 6, 9]) {
      line(c, 195, py(v), 1283, py(v), grid, 2);
      mono(c, v, 166, py(v), 30, muted, 'right');
    }
    for (let n = 0; n <= 8; n++) {
      const a = writeGrowth(n),
        prev = writeGrowth(n - 1);
      if (n) line(c, px(n - 1), py(prev.aligned), px(n), py(a.aligned), blue, 7);
      circle(c, px(n), py(a.aligned), 9, blue);
      if (n <= 8 * showSD && showSD > 0) {
        if (n) line(c, px(n - 1), py(prev.sd), px(n), py(a.sd), teal, 6);
        circle(c, px(n), py(a.sd), 9, teal);
      }
      mono(c, n, px(n), 891, 27, muted, 'center');
    }
    text(c, 'Writes', 752, 962, 36, muted, 'center');
    text(c, 'Aligned units', 1356, 300, 39, blue);
    mono(c, '1 + 8 = 9', 1356, 376, 42, blue);
    if (showSD > 0) {
      text(c, 'Uncorrelated writes', 1356, 547, 37, teal);
      text(c, 'Start variance 1', 1356, 623, 33, ink);
      text(c, 'Each write adds 1', 1356, 679, 33, ink);
      if (showSD === 1) mono(c, 'SD = √9 = 3', 1356, 759, 40, teal);
    }
    return;
  }
  const bypass = cue(k, 6, 'bypass that block') > 0,
    a = heldOut(false),
    b = heldOut(bypass);
  title(
    c,
    'Does the late write change a decision?',
    'Illustrative held-out examples    ·    the sign of each margin gives the prediction',
  );
  row(c, 'Correct sign', ['+', '−', '+', '+'], 318, { x: 682, dx: 300 });
  row(c, 'With the late block', a.margins, 505, { x: 682, dx: 300 });
  row(c, bypass ? 'Block bypassed' : 'Repeat with block', b.margins, 688, {
    x: 682,
    dx: 300,
    hot: bypass ? 2 : -1,
  });
  if (bypass) {
    line(c, 1226, 737, 1344, 737, rust, 5);
    text(c, 'sign flips', 1283, 793, 35, rust, 'center');
  }
  mono(
    c,
    'Correct with block    ' + a.correct + ' / 4          trial    ' + b.correct + ' / 4',
    109,
    932,
    41,
    teal,
  );
}
export function deepNorm(c, k) {
  const init = k.beat.beatIndex === 1,
    train = cue(k, 3, 'trained branch writes two') > 0;
  const landed = cue(k, 4, 'Add the full two') > 0,
    waiting = train && !landed;
  const d = deep(train);
  if (init) {
    title(
      c,
      'Where beta enters the weights',
      'Decoder only    ·    N = 16    ·    β = (8N)⁻¹⁄⁴ ≈ ' + num(d.beta, 3),
    );
    const groups = [
      ['Query', 1],
      ['Key', 1],
      ['Value', d.beta],
      ['Output', d.beta],
      ['FFN in', d.beta],
      ['FFN out', d.beta],
    ];
    for (const [j, [name, gain]] of groups.entries()) {
      const xx = 211 + j * 298,
        y = 411;
      text(c, name, xx, y - 88, 41, ink, 'center');
      for (let r = 0; r < 3; r++)
        for (let h = 0; h < 3; h++) {
          const left = xx - 74 + h * 52,
            top = y + r * 52;
          rect(c, left, top, 48, 48, '#d9e2d5');
          const amp = (r + h) % 2 === 0 ? 0.83 : 0.5;
          rect(c, left + 4, top + 24, 39 * gain * amp, 6, gain === 1 ? blue : brass);
        }
      mono(c, num(gain, 3), xx, y + 255, 44, gain === 1 ? blue : brass, 'center');
    }
    text(c, 'Initialization gain on each matrix', 960, 829, 53, ink, 'center', 'Serif');
    return;
  }
  title(
    c,
    'The forward sum in DeepNorm',
    'Decoder only    ·    16 layers    ·    α = (2N)¹⁄⁴ ≈ ' + num(d.alpha, 3),
  );
  const phys = cue(k, 1, 'multiplies the skip input by alpha') > 0;
  text(
    c,
    waiting ? 'First coordinate   ·   trained write ready to add' : 'First coordinate',
    108,
    275,
    38,
    muted,
  );
  const startX = 140,
    unit = 266,
    y = 472;
  const skip = phys ? d.skip[0] : start[0],
    branch = d.branch[0];
  gaugeBlock(c, startX, y, skip * unit, 105, blue, '#84a8c1', num(skip, 3));
  if (phys)
    gaugeBlock(
      c,
      startX + skip * unit,
      y - (waiting ? 104 : 0),
      unit * branch,
      105,
      brass,
      '#dca570',
      num(branch, 1),
    );
  rule(c, startX, y + 108, 5 * unit, 0, 5, 0.25, 4);
  text(c, phys ? 'Skip × α' : 'Skip input', startX, y - 77, 44, blue);
  if (phys && !waiting) text(c, 'Branch write', startX + skip * unit + 5, y - 77, 40, brass);
  if (waiting) text(c, 'Does the sum get 2 or β × 2?', 106, 825, 54, ink, 'left', 'Serif');
  if (phys && !waiting) {
    mono(c, 'Full sum       ' + vector(d.sum, 2), 106, 787, 40, ink);
    mono(c, 'LayerNorm      ' + vector(d.output, 3), 106, 896, 40, teal);
  }
}
export function peri(c, k) {
  const i = k.beat.beatIndex;
  if (i < 2) {
    const showOut = cue(k, 1, 'The other controls') > 0;
    title(c, 'Two norms inside one branch', 'The blue skip goes directly to the addition.');
    const yy = 591,
      xx = [206, 558, 903, 1246, 1640];
    path(
      c,
      [
        [xx[0], yy],
        [xx[0], 341],
        [xx[4], 341],
        [xx[4], yy],
      ],
      null,
      blue,
      7,
      false,
    );
    text(c, 'unchanged skip', 882, 290, 43, blue, 'center');
    for (let j = 0; j < 4; j++) arrow(c, xx[j] + 80, yy, xx[j + 1] - 94, yy, ink, 5);
    socket(c, 'x', xx[0], yy, 112, blue);
    socket(c, 'Norm in', xx[1], yy, 175, teal);
    socket(c, 'F', xx[2], yy, 117, ink);
    if (showOut) socket(c, 'Norm out', xx[3], yy, 190, brass);
    else line(c, xx[3] - 100, yy, xx[3] + 85, yy, ink, 5);
    circle(c, xx[4], yy, 47, paper, blue, 6);
    text(c, '+', xx[4], yy, 59, blue, 'center');
    text(c, 'branch read', xx[1], yy + 114, 37, teal, 'center');
    if (showOut) text(c, 'branch write', xx[3], yy + 114, 37, brass, 'center');
    if (i === 1) text(c, 'Full Peri-LN also normalizes the embeddings and final output.', 108, 913, 43, ink);
    return;
  }
  if (i < 4) {
    const scoreValue = 1000 + 800 * cue(k, 3, 'Add eight hundred', 1.2),
      prob = shares([scoreValue, scoreValue]);
    title(c, 'Two keys split a query', 'Attention uses the difference between the two scores.');
    const x0 = 167,
      w = 1586,
      y = 577;
    for (let j = 0; j < 2; j++) {
      const xx = x0 + w * (0.25 + 0.5 * j),
        col = j ? brass : blue;
      text(c, 'Key ' + (j ? 'B' : 'A'), xx, 323, 47, col, 'center', 'Serif');
      mono(c, num(scoreValue, 1), xx, 430, 81, col, 'center');
      rect(c, x0 + j * w * 0.5, y, w * prob[j], 93, col);
      mono(c, num(100 * prob[j]) + '%', xx, y + 46, 50, paper, 'center');
    }
    text(
      c,
      i === 3 ? 'Residual and feed-forward writes have separate normalization paths.' : 'Score gap   0',
      960,
      823,
      50,
      ink,
      'center',
    );
    return;
  }
  const compare = cue(k, 6, 'one opposite key') > 0;
  title(
    c,
    'How sharp can bounded scores be?',
    'Four features    ·    unit RMS    ·    no affine gain    ·    scores divided by √4',
  );
  row(c, 'Query', q, 320, { x: 680, dx: 285 });
  row(c, 'Aligned key', keyRows[0], 460, { x: 680, dx: 285 });
  if (compare) row(c, 'Opposite key', keyRows[1], 578, { x: 680, dx: 285, color: brass });
  const ready = cue(k, 5, 'Their dot product is bounded') > 0;
  if (ready) mono(c, '|q · k| ≤ 2 × 2 = 4         |score| ≤ 4 / 2 = 2', 108, 712, 43, ink);
  if (compare) {
    const scores = keyRows.map(score),
      p = shares(scores);
    mono(c, 'Scores   ' + vector(scores) + '       attention', 108, 830, 40);
    rect(c, 955, 797, 775 * p[0], 70, blue);
    rect(c, 955 + 775 * p[0], 797, 775 * p[1], 70, brass);
    mono(c, num(100 * p[0], 1) + '%', 1317, 832, 44, paper, 'center');
    text(c, 'Learned gains can change this bound.', 109, 948, 36, muted);
  }
}
