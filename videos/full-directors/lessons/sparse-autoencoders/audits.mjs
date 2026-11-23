import { drawFieldPlate } from '../../../director-cuts/lessons/sparse-autoencoders/field-plate.mjs';
import {
  C,
  mix,
  fmt,
  pair,
  words,
  numeral,
  heading,
  box,
  line,
  circle,
  arrow,
  alpha,
  ruler,
  plane,
  cue,
  span,
  labelValue,
  subtitle,
} from './drawing.mjs';
import {
  request, bird, recovery, circuit, directEdge, align, alignmentCutoff, highMatches, median, lab, dot,
} from './experiment.mjs';

function lossRuler(c, base, damageLabel = true) {
  const clean = 2,
    rebuilt = 2.4,
    ratio = recovery(base),
    x = (v) => 206 + v * 143,
    y = 542;
  ruler(c, x(0), y, 143, 11, { step: 0.25, major: 1 });
  const mark = (v, name, dy, col) => {
    line(c, x(v), y, x(v), y + dy, col, 5);
    circle(c, x(v), y, 10, col);
    words(c, name, x(v), y + dy + (dy < 0 ? -27 : 35), 38, col, { align: 'center' });
  };
  mark(clean, 'Clean 2', -125, C.blue);
  mark(rebuilt, 'Rebuilt 2.4', 122, C.pink);
  mark(base, 'Ablated ' + fmt(base), -125, C.gold);
  span(c, x(clean), x(base), 325, C.gold);
  span(c, x(clean), x(rebuilt), 730, C.pink);
  if (damageLabel) words(c, 'Substitution adds 0.4', 223, 817, 42, C.pink);
  numeral(
    c,
    '1 − 0.4 / ' + fmt(base - clean) + ' = ' + fmt(100 * ratio) + '%',
    916,
    812,
    50,
    C.green,
  );
}
export function coverage(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) {
    const sparrow = Boolean(cue(k, 1, 'to the sparrow', 0)),
      r = bird(sparrow),
      reading = cue(k, 2, 'it reads zero', 0);
    box(c, 0, 0, 847, 1080, sparrow ? '#d7e5dc' : '#e7ddc5');
    words(c, 'Input token', 100, 117, 36, C.muted);
    heading(c, sparrow ? 'sparrow' : 'robin', 91, 227, 118);
    c.save();
    c.translate(21, 278);
    c.scale(1.36, 1.36);
    drawFieldPlate(c, sparrow);
    c.restore();
    words(c, 'Coordinates in this toy model', 944, 190, 43, C.muted);
    ['bird', 'sparrow'].forEach((s, i) => {
      words(c, s, 1095 + 365 * i, 321, 53, C.ink, { align: 'center', face: 'Serif' });
      numeral(c, r.input[i], 1095 + 365 * i, 445, 111, C.ink, 'center');
    });
    line(c, 923, 529, 1800, 529);
    if (b === 1) {
      words(c, sparrow ? 'Sparrow slot writes' : 'Bird slot writes', 946, 617, 42, C.muted);
      numeral(c, pair(r.rebuilt), 950, 721, 69, C.teal);
    } else {
      words(c, '“Bird” detector', 946, 620, 48, C.ink, { face: 'Serif' });
      numeral(c, 'max(0, 1 − 1)', 948, 726, 60, C.blue);
      if (reading) numeral(c, '= ' + fmt(r.z[0]), 1485, 726, 73, C.pink);
    }
    if (reading) {
      words(c, 'Specialized write', 944, 838, 36, C.teal);
      numeral(c, '√2 × (1/√2, 1/√2) = (1, 1)', 944, 903, 43, C.teal);
    }
    return;
  }
  if (b <= 4) {
    heading(c, 'What fraction of the damage was recovered?');
    const base = cue(k, 3, 'six to ten', 0) ? 10 : 6;
    lossRuler(c, base);
    if (b === 4)
      subtitle(c, 'Compare all three raw losses at the same hook and positions.', 174, 930);
    return;
  }
  heading(c, 'Choose a readout the edit should spare');
  const blue = 1 - cue(k, 5, 'Subtract the blue credential arrow', 1.05),
    s = request(1, blue);
  const p = plane(c, 162, 751, 395, { xmax: 2.7, ymax: 1.1 });
  p.vector([0, 0], s.parts[0], C.blue, 18);
  p.vector(s.parts[0], s.x, C.pink, 18);
  p.point(s.x);
  labelValue(c, 'First coordinate', fmt(s.x[0]), 1280, 315, C.blue);
  labelValue(c, 'Second coordinate', fmt(s.x[1]), 1280, 551, C.pink);
  subtitle(c, 'Same urgent request, same coordinate system', 154, 900);
}
function wire(c, from, to, col = C.muted) {
  arrow(c, ...from, ...to, col, 6);
}
function hookSite(c, k) {
  heading(c, 'Which activation did this dictionary learn?');
  const y = 555;
  line(c, 132, y, 1730, y, C.ink, 11);
  arrow(c, 1610, y, 1784, y, C.ink, 11);
  words(c, 'incoming state', 124, y + 78, 36, C.muted);
  words(c, 'residual stream', 1415, y + 90, 42);
  for (const [x, offset, name, col] of [
    [388, 315, 'Attention', C.teal],
    [1020, 770, 'MLP', C.pink],
  ]) {
    line(c, x, y, x, offset, col, 6);
    line(c, x, offset, x + 335, offset, col, 6);
    wire(c, [x + 335, offset], [x + 335, y + (offset < y ? -29 : 29)], col);
    box(c, x + 33, offset - 47, 266, 94, C.light, col, 12);
    words(c, name, x + 166, offset, 48, col, { align: 'center' });
    circle(c, x + 335, y, 25, C.light, C.ink, 3);
    words(c, '+', x + 335, y, 44, C.ink, { align: 'center' });
  }
  if (cue(k, 1, 'At the join', 0)) words(c, 'routed context', 548, 192, 37, C.teal);
  if (cue(k, 1, 'separate nonlinear update', 0)) words(c, 'branch output', 1176, 899, 38, C.pink);
  if (k.beat.beatIndex === 1)
    subtitle(c, 'Same layer and width. Different training sites.', 124, 834);
}
const circuitNames = ['Credential', 'Urgency', 'Formatting'],
  colors = [C.blue, C.pink, C.teal];
function circuitRows(c, k) {
  const b = k.beat.beatIndex + 1;
  let credential = 0.9,
    format = 0.7;
  if (cue(k, 4, 'Remove the credential feature', 0)) credential = 0;
  if (cue(k, 4, 'Restore that run', 0)) credential = 0.9;
  if (cue(k, 4, 'Now remove formatting', 0)) format = 0;
  const s = circuit(credential, format);
  heading(c, 'Which feature changes this toy score?');
  ['Feature', 'Activation', 'Weight', 'Contribution'].forEach((t, i) =>
    words(c, t, [142, 619, 966, 1330][i], 252, 38, C.muted),
  );
  circuitNames.forEach((n, i) => {
    const y = 360 + 127 * i;
    line(c, 124, y - 51, 1802, y - 51, C.line, 2);
    words(c, n, 142, y, 50, colors[i], { face: 'Serif' });
    numeral(c, fmt(s.input[i]), 657, y, 53, colors[i]);
    numeral(c, '× ' + fmt(s.weights[i]), 924, y, 51);
    numeral(c, fmt(s.writes[i]), 1374, y, 55, colors[i]);
  });
  line(c, 121, 699, 1800, 699, C.ink, 3);
  words(c, 'Score', 143, 794, 57);
  numeral(c, fmt(s.score), 1370, 790, 74);
  if (b === 6)
    subtitle(c, 'For a null result, check edit strength and alternative paths.', 143, 930);
}
const featureColors = [C.blue, C.gold, C.pink];
const featureNames = ['f₁', 'f₂', 'f₃'];
const errorNames = ['e₁', 'e₂', 'e₃'];

function transcoder(c, k) {
  const local = k.beat.beatIndex + 1 === 9;
  const allWriters = cue(k, 7, 'Each MLP output', 0.45);
  heading(c, local ? 'Rebuild this prompt’s MLP outputs' : 'Where does each feature write?');
  const trunk = 407;
  arrow(c, 100, trunk, 1814, trunk, C.ink, 8);
  words(c, 'Token embedding', 91, 474, 32, C.muted);
  words(c, 'Logit', 1742, 474, 32, C.muted);

  [390, 940, 1495].forEach((x, layer) => {
    const tap = x - 72, join = x + 44;
    const begin = x - 211, end = x - 116;
    line(c, begin, trunk, begin, 297, C.teal, 4);
    line(c, begin, 297, end, 297, C.teal, 4);
    wire(c, [end, 297], [end, trunk - 10], C.teal);
    circle(c, end, trunk, 7, C.teal);
    words(c, local ? 'fixed attention patterns' : 'attention', (begin + end) / 2, 247, 31, C.teal, { align: 'center' });
    circle(c, tap, trunk, 10, featureColors[layer]);
    words(c, 'Read ' + featureNames[layer], tap + 28, trunk - 50, 33, featureColors[layer]);
    wire(c, [join, 553], [join, trunk + 18], C.ink);
    circle(c, join, trunk, 15, C.light, C.ink, 3);
    words(c, '+', join, trunk - 1, 30, C.ink, { align: 'center' });
    box(c, join - 112, 554, 224, 77, C.light, C.ink, 10);
    words(c, 'MLP ' + (layer + 1), join, 592, 42, C.ink, { align: 'center' });

    // Repeat the source label at each decoder port. Every arrow has its own
    // entry point, including the original error added to a local reconstruction.
    const ports = layer + 1 + Number(local);
    for (let i = 0; i < ports; i++) {
      const isError = i > layer;
      const dx = (i - (layer + 1) / 2) * 99;
      const px = join + dx, dest = join + dx * 0.55;
      const col = isError ? C.green : featureColors[i];
      alpha(c, i === 0 || isError ? 1 : allWriters, () => {
        wire(c, [px, 735], [dest, 633], col);
        if (isError) box(c, px - 34, 737, 68, 58, C.light, col, 4);
        else circle(c, px, 766, 31, col);
        words(c, isError ? errorNames[layer] : featureNames[i], px, 764, 36, isError ? col : C.light, { align: 'center' });
      });
    }
  });
  if (local) {
    words(c, 'Each green term restores the original reconstruction error at its layer.', 106, 855, 33, C.green);
    subtitle(c, 'Fixed attention patterns and normalization denominators come from the original pass.', 106, 925);
  } else {
    subtitle(c, 'Follow f₁ in blue. Each arrow writes a separate decoder vector to one MLP output.', 106, 909);
  }
}

function directAttribution(c, k) {
  const original = directEdge(2, 0.5);
  const nudged = cue(k, 11, 'Add one unit', 0) && !cue(k, 11, 'Return to two', 0);
  const edge = nudged ? directEdge(original.source + 1, original.selfWeight) : original;
  const answer = cue(k, 11, 'Three units', 0);
  heading(c, 'What does the first feature contribute to the third?');
  words(c, 'One token position  ·  one residual coordinate  ·  unit decoder, value, output and target projections',
    98, 202, 34, C.muted);

  const stream = 495;
  box(c, 95, 432, 275, 125, C.light, C.blue, 10);
  words(c, 'Source activation', 232, 461, 31, C.blue, { align: 'center' });
  numeral(c, nudged ? '2 → ' + fmt(edge.source) : 'z₁ = ' + fmt(edge.source), 232, 518, 46, C.ink, 'center');
  arrow(c, 371, stream, 1492, stream, C.blue, 9);
  words(c, 'MLP 1 write', 228, 599, 31, C.muted, { align: 'center' });
  const skipLabel = nudged ? 'Residual  ' + fmt(original.skip) + ' → ' + fmt(edge.skip)
    : answer ? 'Residual carries ' + fmt(edge.skip) : 'Residual stream';
  words(c, skipLabel, 677, 555, 35, C.blue, { align: 'center' });

  // The residual and the changing value rejoin before the next MLP reads.
  const fork = 422, sum = 894, vy = 329;
  line(c, fork, stream, fork, vy, C.teal, 7);
  line(c, fork, vy, sum, vy, C.teal, 7);
  wire(c, [sum, vy], [sum, stream - 21], C.teal);
  box(c, 481, vy - 38, 346, 76, C.light, C.teal, 10);
  const valueLabel = answer ? fmt(edge.source) + ' × ' + fmt(edge.selfWeight) + ' = ' + fmt(edge.viaValue)
    : 'Value × ' + fmt(edge.selfWeight);
  words(c, valueLabel, 654, vy, 38, C.teal, { align: 'center' });
  if (nudged) words(c, 'Value path  ' + fmt(original.viaValue) + ' → ' + fmt(edge.viaValue), 654, vy + 83,
    31, C.teal, { align: 'center' });
  words(c, 'fixed attention patterns', 654, 261, 32, C.teal, { align: 'center' });
  circle(c, fork, stream, 8, C.blue);
  circle(c, sum, stream, 18, C.light, C.teal, 4);
  words(c, '+', sum, stream - 1, 37, C.teal, { align: 'center' });

  // The forward model adds the intervening MLP output at this join.
  // Its derivative is stopped for the selected direct edge.
  const read = 965, merge = 1365, my = 672;
  circle(c, read, stream, 7, C.muted);
  line(c, read, stream, read, my, C.muted, 4);
  wire(c, [read, my], [1000, my], C.muted);
  box(c, 1003, my - 38, 232, 76, C.light, C.muted, 10);
  words(c, 'f₂ → MLP 2', 1119, my, 37, C.muted, { align: 'center' });
  line(c, 1235, my, 1298, my, C.muted, 4);
  line(c, 1300, my - 19, 1300, my + 19, C.pink, 7);
  line(c, 1311, my, merge, my, C.muted, 4, [8, 7]);
  line(c, merge, my, merge, stream + 21, C.muted, 4, [8, 7]);
  circle(c, merge, stream, 18, C.light, C.blue, 4);
  words(c, '+', merge, stream - 1, 37, C.blue, { align: 'center' });
  words(c, 'Stop the gradient through this output', 1169, 755, 32, C.pink, { align: 'center' });

  box(c, 1496, 423, 334, 147, C.light, C.blue, 10);
  words(c, 'Target pre-activation', 1663, 462, 31, C.blue, { align: 'center' });
  const change = edge.contribution - original.contribution;
  numeral(c, nudged ? 'Δa₃ = ' + fmt(change) : 'a₃', 1663, 523, nudged ? 44 : 55, C.ink, 'center');
  let formula = 'z₁ × ∂a₃/∂z₁ = ?';
  if (nudged) formula = 'Δa₃ / Δz₁ = ' + fmt(change) + ' / 1 = ' + fmt(edge.gain);
  else if (answer) formula = 'z₁ × ∂a₃/∂z₁ = ' + fmt(edge.source) + ' × ' + fmt(edge.gain) + ' = ' + fmt(edge.contribution);
  numeral(c, formula, 102, 846, 49, C.ink);
  subtitle(c, 'Hold attention patterns, normalization denominators, errors and the intervening MLP output fixed.', 102, 928);
}
export function hooks(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) hookSite(c, k);
  else if (b <= 6) circuitRows(c, k);
  else if (b <= 9) transcoder(c, k);
  else directAttribution(c, k);
}
function alignment(c, k) {
  const b = k.beat.beatIndex + 1;
  const show = cue(k, 4, 'Reveal the trained dots', 1);
  const said = (phrase) => b === 4 && k.elapsed >= k.wordCue(phrase).end;
  const counted = said('Two finish there');
  const x = (i) => 194 + 45 * i,
    y = (v) => 807 - (v - 0.6) * 1140;
  heading(c, b === 2 ? 'Did the learned columns find the original directions?' : 'How many directions finish at or above 0.9?');
  words(c, 'Best absolute cosine per generating direction', 119, 226, 39, C.muted);
  [0.6, 0.7, 0.8, 0.9, 1].forEach((n) => {
    line(
      c,
      165,
      y(n),
      1270,
      y(n),
      n === 0.9 ? C.gold : C.line,
      n === 0.9 ? 4 : 2,
      n === 0.9 ? [8, 8] : [],
    );
    numeral(c, fmt(n), 134, y(n), 28, C.muted, 'right');
  });
  align[0].forEach((v, i) => {
    circle(c, x(i) - 5, y(v), 9, C.light, C.ink, 3);
    alpha(c, show, () => {
      const endX = x(i) - 5 + 11 * show;
      const endY = y(v + (align[1][i] - v) * show);
      line(c, x(i) - 5, y(v), endX, endY, C.teal, 2);
      circle(c, endX, endY, 8, C.teal);
    });
  });
  words(c, '○  At initialization', 171, 849, 38);
  if (show) words(c, '●  After training', 615, 849, 38, C.teal);
  labelValue(
    c,
    'Training MSE',
    b === 2 && !cue(k, 2, 'After training', 0) ? '1.426' : '1.426 → 0.128',
    1330,
    312,
    C.ink,
    49,
  );
  if (b >= 3) {
    labelValue(c, 'Held-out support', '19.5 / 64', 1330, 438, C.blue, 49);
    subtitle(c, 'Generator used 2–4.', 1330, 554);
    subtitle(c, 'Held-out FVU = 0.169', 1330, 623);
  }
  if (said('point seven nine nine')) {
    labelValue(
      c,
      'Median |cosine|',
      align.map((a) => median(a).toFixed(3)).join(' → '),
      1330,
      787,
      C.teal,
      47,
    );
  }
  if (counted) {
    words(c, highMatches.length + ' of ' + align[1].length + ' finish ≥ ' + fmt(alignmentCutoff),
      1330, 705, 38, C.teal);
    for (const { i, alreadyHigh } of highMatches) {
      const phrase = alreadyHigh ? 'and stays above it' : 'just clears the line';
      if (!said(phrase)) continue;
      const top = y(Math.max(align[0][i], align[1][i]));
      const reason = alreadyHigh ? 'already above' : 'crosses';
      words(c, '#' + (i + 1) + ' ' + reason, x(i), top - 38, 30, C.teal, { align: 'center' });
      words(c, align[0][i].toFixed(3) + ' → ' + align[1][i].toFixed(3), x(i), top - 68, 27,
        C.teal, { align: 'center' });
    }
  }
}
export function training(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 1) {
    heading(c, 'The CPU experiment has known ingredients');
    const centers = [
      [355, 497],
      [915, 497],
      [1515, 497],
    ];
    [24, 8, 64].forEach((n, i) => {
      const [cx, cy] = centers[i],
        cols = i === 0 ? 6 : 8,
        rows = Math.ceil(n / cols),
        s = i === 1 ? 40 : 36;
      for (let j = 0; j < n; j++) {
        const x = cx + ((j % cols) - (cols - 1) / 2) * s,
          y = cy + (Math.floor(j / cols) - (rows - 1) / 2) * s;
        if (i === 0) {
          const sel = [2, 11, 17].includes(j);
          circle(c, x, y, sel ? 15 : 10, sel ? C.blue : C.faint, C.blue, 2);
        } else
          box(c, x - 13, y - 13, 26, 26, i === 1 ? C.teal : C.light, i === 1 ? null : C.pink, 3);
      }
    });
    wire(c, [530, 494], [686, 494]);
    wire(c, [1108, 494], [1274, 494]);
    ['24 source directions', '8 coordinates', '64 SAE slots'].forEach((t, i) =>
      words(c, t, centers[i][0], 735, 42, C.ink, { align: 'center' }),
    );
    subtitle(
      c,
      'Mix 2–4 at a time. Train an uncentered ReLU encoder and normalize decoder columns.',
      108,
      902,
    );
    return;
  }
  if (b <= 4) {
    alignment(c, k);
    return;
  }
  if (b === 5) {
    heading(c, 'Which way does a positive coefficient write?');
    const x = 740,
      y = 428,
      u = 452;
    circle(c, x, y, 10, C.ink);
    arrow(c, x, y, x + u, y, C.blue, 18);
    words(c, 'true direction', x + u / 2, y - 60, 44, C.blue, { align: 'center' });
    arrow(c, x, y + 117, x - u, y + 117, C.pink, 18);
    words(c, 'learned column', x - u / 2, y + 185, 44, C.pink, { align: 'center' });
    labelValue(c, 'Signed cosine', '−1', 1370, 319, C.pink);
    labelValue(c, 'Absolute cosine', '1', 1370, 542, C.teal);
    subtitle(c, 'An absolute match can hide a sign error in a nonnegative code.', 145, 898);
    return;
  }
  if (b === 6) {
    heading(c, 'Does one feature index transfer between runs?');
    words(c, 'Narrow dictionary', 152, 329, 47, C.ink, { face: 'Serif' });
    words(c, 'Wider dictionary', 1195, 329, 47, C.ink, { face: 'Serif' });
    circle(c, 415, 559, 80, C.blue);
    words(c, 'bird', 415, 556, 48, C.light, { align: 'center' });
    [
      [1260, 484, 'sparrow'],
      [1480, 673, 'robin'],
    ].forEach(([x, y, name]) => {
      arrow(c, 521, 559, x - 115, y, C.muted, 6);
      circle(c, x, y, 96, C.teal);
      words(c, name, x, y, 42, C.light, { align: 'center' });
    });
    subtitle(
      c,
      'Compare matched directions, triggering contexts and edit effects across seeds.',
      111,
      905,
    );
    return;
  }
  if (b <= 8) {
    heading(c, 'The baseline sets the denominator');
    const base = cue(k, 8, 'to ten', 0) ? 10 : 6;
    lossRuler(c, base);
    subtitle(
      c,
      b === 8
        ? 'If ablated loss equals clean loss, this fraction is undefined.'
        : 'Same hook and token positions for all three measured losses.',
      146,
      927,
    );
    return;
  }
  heading(c, 'How much storage does one hook need?');
  for (let j = 10; j >= 0; j--) {
    const x = 112 + 13 * j,
      y = 582 - 18 * j;
    box(c, x, y, 625, 161, '#e3ebdf', C.green, 4);
    for (let m = 1; m < 16; m++) line(c, x + m * 39, y + 8, x + m * 39, y + 153, '#b8c9b7', 2);
  }
  words(c, 'One row per activation', 118, 813, 40);
  labelValue(c, 'Float32 vectors', lab.vectors.toLocaleString('en-US'), 1040, 260);
  numeral(c, '× ' + lab.width + ' values × ' + lab.bytes + ' bytes', 1040, 477, 47);
  const gb = (lab.vectors * lab.width * lab.bytes) / 2 ** 30;
  alpha(c, cue(k, 9, 'three point zero five'), () => {
    numeral(c, '≈ ' + fmt(gb) + ' GiB', 1040, 644, 79, C.green);
  });
  subtitle(c, 'Activation storage only', 1040, 817);
}
function auditPrompt(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) {
    heading(
      c,
      b === 1 ? 'Where did the word “credential” come from?' : 'A description can suggest a test',
    );
    words(c, 'Activation at the hook', 131, 361, 42, C.muted);
    [0.2, 0.7, 0.35, 0.9, 0.5, 0.34, 0.62, 0.22].forEach((v, i) =>
      box(c, 135 + i * 53, 645 - v * 250, 34, v * 250, C.blue, null, 4),
    );
    wire(c, [612, 519], [786, 519]);
    box(c, 816, 380, 887, 278, C.light, C.line, 18);
    words(
      c,
      b === 1 ? '“credential”' : '“a request to reset a password”',
      1260,
      516,
      b === 1 ? 88 : 57,
      C.ink,
      { face: 'Serif', align: 'center' },
    );
    subtitle(
      c,
      b === 1
        ? 'Compare explanation and reconstruction scores with a randomized model.'
        : 'Test the predicted behavior on held-out activations.',
      125,
      857,
    );
    return;
  }
  heading(
    c,
    b === 3 ? 'Which requests does this label cover?' : 'What would count as a behavioral change?',
  );
  const prompts =
    b === 3
      ? ['Reset my password.', 'Réinitialisez mon mot de passe.', 'RESET MY PASSWORD.']
      : ['Reset my own password.', 'Reset another person’s password without permission.'];
  prompts.forEach((s, i) => {
    const y = 345 + i * (b === 3 ? 151 : 243);
    line(c, 125, y + 77, 1794, y + 77, C.line);
    words(c, s, 143, y, b === 3 ? 59 : 48, C.ink, { face: 'Serif' });
    if (b === 4)
      words(c, i ? 'Correct denial' : 'Successful reset', 1760, y + 56, 34, i ? C.pink : C.green, {
        align: 'right',
      });
  });
  subtitle(
    c,
    b === 3
      ? 'Sample strong, weak and silent feature readings.'
      : 'Score these two outcomes separately at matched hooks and token positions.',
    124,
    914,
  );
}
export function finale(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b < 5) {
    auditPrompt(c, k);
    return;
  }
  const residual = 0.1 * cue(k, 6, 'Add it back', 0);
  const credential =
    Math.round(
      50 *
        (1 - cue(k, 8, 'Remove blue', 1.2) + cue(k, 9, 'Restore the original activations', 1.15)),
    ) / 50;
  const urgency = Math.round(20 * (1 - cue(k, 10, 'Take away pink', 1.25))) / 20;
  const rows = [0, 1].map((u) => request(u, credential, urgency, residual));
  const gap = rows[1].score - rows[0].score,
    x = 671,
    u = 275;
  heading(c, 'Which contribution explains the gap?');
  numeral(c, 'S = x₁ + 2x₂', 1270, 126, 48);
  const action =
    b < 6
      ? 'Reconstructed arrows'
      : b <= 7
        ? 'Original activations'
        : b === 8
          ? 'Subtract credential'
          : b === 9
            ? 'Restore both originals'
            : b === 10
              ? 'Subtract urgency'
              : 'Urgency removed from both originals';
  words(c, action, 97, 244, 42, C.muted);
  rows.forEach(({ parts, x: act, score }, i) => {
    const y = 416 + i * 273;
    words(c, 'Reset my password', 99, y - 23, 50, C.ink, { face: 'Serif' });
    if (i) words(c, 'now', 99, y + 42, 47, C.pink, { face: 'Serif' });
    numeral(c, pair(act), 99, y + (i ? 107 : 53), 37, C.muted);
    ruler(c, x, y + 28, u, 4, { major: 1, step: 0.2 });
    if (b >= 8) {
      const original = request(i, 1, 1, 0.1).score;
      line(c, x + original * u, y - 51, x + original * u, y + 22, C.muted, 3, [7, 7]);
    }
    let pos = x;
    parts.forEach((v, j) => {
      const w = dot(v, [1, 2]) * u;
      if (w > 0) box(c, pos, y - 24, w, 43, [C.blue, C.pink, C.green][j]);
      pos += w;
    });
    line(c, pos, y - 40, pos, y + 28, C.ink, 4);
    circle(c, pos, y - 45, 8, C.ink);
    numeral(c, fmt(score, 2), pos, y - 84, 51, C.ink, 'center');
  });
  words(c, 'credential', 117, 916, 36, C.blue);
  words(c, 'urgency', 346, 916, 36, C.pink);
  words(c, 'residual', 542, 916, 36, C.green);
  numeral(c, 'urgent − plain = ' + fmt(gap), 1024, 905, 51, C.ink);
}
