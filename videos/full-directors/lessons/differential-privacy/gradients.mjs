import {
  P,
  mix,
  lerpPoint,
  neat,
  pair,
  cue,
  type,
  line,
  rect,
  dot,
  arrow,
  background,
  heading,
  bracket,
  plate,
  graph,
  readout,
} from './instruments.mjs';
import {
  C,
  raw,
  record,
  records,
  other,
  withRecord,
  drawNoise,
  noisy,
  replacement,
  scaledTrace,
  clipVector,
  people,
  samples,
  utilityDiagnostics,
  dimensions,
  coordinateSD,
  learningRate,
  stepDivisor,
  sumNoiseRms,
  stepNoiseRms,
} from './examples.mjs';

export function clipping(c, k) {
  background(c, true);
  const b = k.beat.beatIndex + 1;
  if (b === 4) {
    const exact = Math.SQRT1_2,
      rounded = Number(exact.toFixed(2));
    const altered = cue(k, 4, 'Round each to point seven one'),
      v = altered ? rounded : exact;
    type(c, 'At the rim', 105, 110, 73, P.light, 'left', 'Serif');
    type(c, 'Magnified distance along the 45° ray', 112, 202, 36, P.sky);
    const x = (n) => 270 + (n - 0.997) * 138000,
      y = 510,
      norm = Math.hypot(v, v);
    rect(c, x(0.997), y - 50, x(1) - x(0.997), 100, '#355d59', null, 3);
    line(c, x(0.997), y, x(1.0065), y, P.sky, 4);
    for (let j = 997; j <= 1006; j++) {
      const xx = x(j / 1000);
      line(c, xx, y + 25, xx, y + 53, P.sky, 3);
      type(c, (j / 1000).toFixed(3), xx, y + 92, 26, P.light, 'center', 'Mono');
    }
    line(c, x(1), y - 146, x(1), y + 51, P.gold, 4);
    type(c, 'C = 1', x(1), y - 192, 42, P.gold, 'center');
    dot(c, x(norm), y, 17, P.rose, P.dark, 3);
    type(
      c,
      altered ? '(0.71, 0.71)' : '(1/√2, 1/√2)',
      x(norm) + (altered ? 0 : 28),
      y - 78,
      36,
      P.rose,
      altered ? 'center' : 'left',
      'Mono',
    );
    type(
      c,
      altered ? 'Length ≈ ' + norm.toFixed(4) : 'Length = 1',
      960,
      792,
      57,
      P.light,
      'center',
      'Serif',
    );
    return;
  }
  const clip = cue(k, 3, 'Shrink both coordinates', 1.1);
  const v = lerpPoint(raw, record, clip),
    showRaw = cue(k, 2, 'Record four points');
  type(c, 'Clipping one record', 105, 113, 70, P.light, 'left', 'Serif');
  const s = 138,
    origin = [468, 805],
    pt = graph(c, {
      x: origin[0],
      y: origin[1],
      scale: s,
      xmin: -1.65,
      xmax: 3.75,
      ymin: -1.25,
      ymax: 4.28,
      dark: true,
    });
  dot(c, ...origin, s, null, P.gold, 4);
  arrow(c, origin, pt(records[0]), P.sky, 9);
  if (showRaw) {
    line(c, ...origin, ...pt(raw), '#749095', 3, [9, 12]);
    arrow(c, origin, pt(v), P.rose, 11);
    type(c, '(3, 4)', pt(raw)[0] + 21, pt(raw)[1] - 17, 33, P.rose, 'left', 'Mono');
  }
  readout(c, 1130, 306, 'Record 1  ·  length 0.5', pair(records[0]), P.sky, true);
  if (showRaw) {
    if (clip === 0 || cue(k, 3, 'Any longer gradient')) {
      readout(
        c,
        1130,
        495,
        'Record 4  ·  ' + (clip === 0 ? 'raw' : 'clipped'),
        pair(v.map((n) => Number(n.toFixed(2)))),
        P.rose,
        true,
      );
      type(c, 'Length  ' + neat(Math.hypot(...v), 2), 1130, 637, 36, P.light);
    } else type(c, 'Scale both coordinates together', 1130, 563, 39, P.rose);
  }
  if (b === 2) type(c, 'Where does its ray meet C = 1?', 1125, 773, 38, P.gold, 'left', 'Serif');
  if (b === 3 && cue(k, 3, 'If you clip only')) {
    const x = 1335,
      y = 803;
    line(c, x - 120, y, x + 120, y, P.gold, 5);
    dot(c, x - 120, y, 10, P.rose);
    dot(c, x + 120, y, 10, P.rose);
    type(c, '−C', x - 120, y - 39, 31, P.rose, 'center');
    type(c, '+C', x + 120, y - 39, 31, P.rose, 'center');
    type(c, 'Clipped batch means can be 2C apart', 1060, 881, 34, P.light);
  } else type(c, 'C = 1', origin[0] - s - 15, origin[1] + 112, 31, P.gold, 'right', 'Mono');
}

function traceGrid(c) {
  return graph(c, {
    x: 262,
    y: 875,
    scale: 278,
    xmin: -0.4,
    xmax: 2.55,
    ymin: -0.15,
    ymax: 2.3,
    step: 0.5,
  });
}
function vertex(c, p, color) {
  dot(c, ...p, 8, color, P.light, 2);
}
export function noise(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b >= 5) {
    replace(c, k);
    return;
  }
  if (b === 4) {
    const divided = !!cue(k, 4, 'The blue sum'),
      s = scaledTrace(divided);
    background(c);
    heading(
      c,
      divided ? 'Both endpoints divided by three' : 'The same two endpoints',
      divided
        ? 'Fixed public divisor L = 3   ·   coordinates rounded for display'
        : 'Before division  ·  add/remove neighbors',
    );
    const pt = traceGrid(c);
    arrow(c, pt([0, 0]), pt(s.other), P.blue, 10);
    arrow(c, pt(s.other), pt(s.withRecord), P.teal, 10);
    arrow(c, pt(s.withRecord), pt(s.noisy), P.plum, 8);
    for (const [v, col] of [
      [s.other, P.blue],
      [s.withRecord, P.teal],
      [s.noisy, P.plum],
    ])
      vertex(c, pt(v), col);
    readout(c, 1060, 280, 'Without record 4', pair(s.other), P.blue);
    readout(c, 1060, 452, 'With record 4', pair(s.withRecord), P.teal);
    type(c, 'Endpoint separation', 1060, 641, 30, P.muted);
    rect(c, 1060, 677, 405 * s.distance, 28, P.teal, null, 4);
    type(c, divided ? 'C / 3' : 'C', 1082 + 405 * s.distance, 692, 34, P.teal);
    type(c, 'Coordinate noise SD  ·  example σ = 1.5', 1060, 779, 30, P.muted);
    rect(c, 1060, 815, 405 * s.sd, 28, P.plum, null, 4);
    type(c, divided ? 'σC / 3' : 'σC', 1082 + 405 * s.sd, 830, 34, P.plum);
    return;
  }
  background(c);
  heading(c, 'One record moves the sum', 'Record-level neighbors  ·  add or remove  ·  C = 1');
  const pt = traceGrid(c);
  arrow(c, pt([0, 0]), pt(other), P.blue, 10);
  const add = cue(k, 1, 'Set the tail', 1.1),
    end = lerpPoint(other, withRecord, add);
  if (add) arrow(c, pt(other), pt(end), P.teal, 11);
  vertex(c, pt(other), P.blue);
  readout(c, 1085, 294, 'Without record 4', pair(other), P.blue);
  if (add === 1) {
    vertex(c, pt(withRecord), P.teal);
    readout(c, 1085, 472, 'With record 4', pair(withRecord), P.teal);
    type(c, 'Difference  ' + pair(record) + '    length 1', 1085, 617, 35, P.teal);
  }
  if (b >= 2) {
    const known = cue(k, 2, 'It adds point two'),
      move = cue(k, 3, 'Go right and down', 0.76);
    if (known) type(c, 'One noise draw   ' + pair(drawNoise), 1085, 722, 37, P.plum);
    if (move > 0) arrow(c, pt(withRecord), pt(lerpPoint(withRecord, noisy, move)), P.plum, 10);
    if (move === 1) vertex(c, pt(noisy), P.plum);
    if (cue(k, 3, 'Another draw'))
      type(c, 'Noisy sum   ' + pair(noisy), 1085, 831, 44, P.plum, 'left', 'Serif');
    else if (known && !move)
      type(c, 'Where will the noisy sum land?', 1085, 833, 38, P.ink, 'left', 'Serif');
  }
}
function replace(c, k) {
  background(c);
  const divided = !!cue(k, 6, 'Their separation shrinks'),
    swapped = !!cue(k, 5, 'Replace a record at minus C');
  const s = replacement(divided),
    x = (v) => 959 + 602 * v;
  heading(
    c,
    divided ? 'Same public divisor on both releases' : 'Replace one bounded record',
    divided
      ? 'L = 3    ·    other records sum to zero    ·    C = 1'
      : 'Other records sum to zero    ·    C = 1',
  );
  const axisY = 483;
  for (let i = -3; i <= 3; i++) {
    const xx = x(i / 3);
    line(c, xx, axisY - 17, xx, axisY + 18, P.muted, 2);
    if (i % 3 === 0) type(c, neat(i / 3), xx, axisY + 54, 31, P.muted, 'center', 'Mono');
  }
  line(c, x(-1.22), axisY, x(1.22), axisY, P.line, 3);
  arrow(c, [x(0), axisY - 7], [x(s.left), axisY - 7], P.blue, 12);
  type(
    c,
    divided ? 'Original  −C/3' : 'Original  −C',
    x(s.left),
    axisY - 100,
    37,
    P.blue,
    'center',
  );
  if (swapped) {
    arrow(c, [x(0), axisY - 7], [x(s.right), axisY - 7], P.teal, 12);
    type(
      c,
      divided ? 'Replacement  +C/3' : 'Replacement  +C',
      x(s.right),
      axisY - 100,
      37,
      P.teal,
      'center',
    );
    bracket(
      c,
      x(s.left),
      x(s.right),
      axisY + 113,
      divided ? 'Separation   2C / 3' : 'Separation   2C',
    );
  }
  if (k.beat.beatIndex === 5) {
    const xx = 419,
      ww = 670 * s.sd;
    type(c, 'Coordinate noise SD', 130, 806, 32, P.muted);
    rect(c, xx + 75, 787, ww, 38, P.rose, P.plum, 6);
    type(c, divided ? 'σC / 3' : 'σC', xx + 100 + ww, 807, 42, P.plum, 'left', 'Mono');
    type(c, 'Length relative to sum SD', xx + 75, 874, 29, P.muted);
  }
}
export function sampler(c, k) {
  background(c);
  const b = k.beat.beatIndex + 1;
  if (b === 6) {
    heading(
      c,
      'The accountant must match the run',
      'Article example    ·    Opacus 1.6.0 RDP accountant',
    );
    type(c, 'Record-level Poisson sampling', 146, 349, 46, P.ink, 'left', 'Serif');
    type(c, 'q = 0.01     σ = 1     δ = 0.00001', 145, 427, 38, P.muted, 'left', 'Mono');
    for (const [i, [steps, eps]] of [
      [300, 1.451],
      [600, 1.748],
    ].entries()) {
      if (!cue(k, 6, i ? 'At six hundred steps' : 'For example')) continue;
      const y = 561 + i * 131;
      type(c, steps + ' steps', 145, y, 40, P.ink);
      rect(c, 493, y - 20, eps * 486, 40, i ? P.blue : P.teal, null, 6);
      type(c, 'ε ≈ ' + eps, 530 + eps * 486, y, 37, P.ink, 'left', 'Mono');
    }
    if (cue(k, 6, 'Record the accountant version'))
      type(
        c,
        'Also record C, the neighbor rule, accountant version and covered releases.',
        143,
        902,
        34,
        P.muted,
      );
    return;
  }
  heading(c, 'Customer sampling', 'Each customer has an independent ½ chance on each step.');
  const xs = [569, 827, 1085, 1343];
  people.forEach((n, i) => type(c, n, xs[i], 304, 39, P.ink, 'center', 'Serif'));
  samples.forEach((mask, j) => {
    const y = 453 + j * 181;
    if (j && b < 2) return;
    type(c, 'Step ' + (j + 1), 122, y, 40, P.muted);
    const p = cue(k, j + 1, j ? 'This time only Bao' : 'This time we get', 0.9);
    mask.forEach((v, i) => {
      const done = p >= (i + 1) / 4,
        xx = xs[i];
      dot(c, xx, y, 48, done && v ? P.teal : P.light, done && v ? P.teal : P.line, 3);
      type(
        c,
        done ? (v ? '+' : '−') : '?',
        xx,
        y,
        42,
        done && v ? P.light : P.muted,
        'center',
        'Mono',
      );
    });
    if (p === 1) type(c, mask.reduce((a, b) => a + b) + ' drawn', 1518, y, 36, P.ink);
  });
  type(c, 'Fixed public divisor   L = 2', 122, 805, 42, P.blue, 'left', 'Mono');
  const note =
    b === 3
      ? 'θ ← θ − η (clipped sum + Z) / L'
      : b === 4
        ? 'Could fixed pairs produce step 2?'
        : b === 5 && cue(k, 5, 'A privacy accountant')
          ? 'Step 2 has only Bao. A fixed pair requires two.'
          : '';
  if (note) type(c, note, 124, 906, 43, P.ink, 'left', 'Serif');
}
export function alignment(c, k) {
  background(c, true);
  const b = k.beat.beatIndex + 1;
  const p = cue(k, 1, 'Keep the direction of the offset fixed', 4);
  const length = 0.5 * p,
    state = utilityDiagnostics(length);
  type(c, 'Direction after noise', 105, 112, 73, P.light, 'left', 'Serif');
  if (cue(k, 1, 'The blue arrow is their mean'))
    type(c, 'C = 1     Clipped mean ' + pair(state.signal), 111, 196, 34, P.sky);
  const pt = graph(c, {
    x: 432,
    y: 847,
    scale: 475,
    xmin: -0.6,
    xmax: 1.02,
    ymin: -0.15,
    ymax: 1.24,
    step: 0.25,
    dark: true,
  });
  if (p) arrow(c, pt([0, 0]), pt(state.noisy), '#b2bebb', 7);
  arrow(c, pt([0, 0]), pt(state.signal), P.sky, 11);
  if (p) arrow(c, pt(state.signal), pt(state.noisy), P.rose, 11);
  vertex(c, pt(state.signal), P.blue);
  readout(
    c,
    1030,
    285,
    'Alignment with the clipped mean',
    'cos θ = ' + state.utility.toFixed(3),
    P.light,
    true,
  );
  readout(c, 1030, 489, 'Perpendicular offset length', length.toFixed(2), P.rose, true);
  if (b >= 2) {
    type(
      c,
      'Clipped records   ' + state.clippedCount + ' / ' + state.records.length,
      1030,
      692,
      41,
      P.gold,
    );
    state.records.forEach((v, i) => {
      const long = Math.hypot(...v) > C;
      dot(c, 1050 + i * 95, 753, 16, long ? P.gold : null, long ? P.gold : P.sky, 3);
    });
  }
  if (b === 2 && cue(k, 2, 'The length-five gradient')) {
    const bound = 2;
    const alternative = utilityDiagnostics(0, bound);
    const retained = Math.hypot(...alternative.clipped[2]);
    const lengthLabel = cue(k, 2, 'It would still')
      ? '     Long gradient keeps length ' + neat(retained)
      : '';
    type(c, 'If C = ' + bound + lengthLabel, 1030, 818, 36, P.light);
    if (cue(k, 2, 'For a second gradient')) {
      const count = alternative.clippedCount + ' / ' + alternative.records.length;
      type(c, count + ' clipped     Mean ' + pair(alternative.signal), 1030, 883, 34, P.gold);
    }
  }
  if (b === 3) {
    type(c, 'Evaluate on held-out tasks', 1030, 810, 40, P.light, 'left', 'Serif');
    type(c, 'Accuracy and calibration', 1030, 867, 32, P.sky);
  }
}

function matrix(c, x, y, rows, cols, cell, fill, edge) {
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++)
      rect(c, x + cell * j, y + cell * i, cell - 5, cell - 5, fill, edge, 3);
}
export function coordinates(c, k) {
  background(c);
  const b = k.beat.beatIndex + 1;
  if (b <= 2) {
    heading(c, 'One independent draw per coordinate', 'Gaussian noise on the clipped sum');
    for (let i = 0; i < 8; i++) {
      const x = 142 + i * 207;
      rect(c, x, 358, 174, 174, P.light, P.line, 9);
      const sd = 25,
        mid = x + 87,
        base = 478;
      c.beginPath();
      for (let j = -68; j <= 68; j += 2) {
        const yy = base - 72 * Math.exp(-0.5 * (j / sd) ** 2);
        if (j === -68) c.moveTo(mid + j, yy);
        else c.lineTo(mid + j, yy);
      }
      c.strokeStyle = P.plum;
      c.lineWidth = 4;
      c.stroke();
      line(c, mid - 66, base, mid + 66, base, P.muted, 2);
      type(c, 'z' + (i + 1), mid, 570, 32, P.muted, 'center', 'Mono');
    }
    if (cue(k, 1, 'Add the expected'))
      type(c, 'Expected squared length of the sum noise = d (σC)²', 130, 671, 48, P.ink, 'left', 'Serif');
    if (cue(k, 1, 'Taking the square root'))
      type(c, 'RMS length of the sum noise = σC √d', 130, 775, 54, P.plum, 'left', 'Serif');
    if (cue(k, 2, 'The gradient signal'))
      type(c, 'RMS length of the step noise = η σC √d / L', 130, 875, 54, P.plum, 'left', 'Serif');
    return;
  }
  if (b <= 4) {
    heading(
      c,
      'The length of the noise vector',
      'Equal coordinate SD = ' + coordinateSD + '     ·     L = ' + stepDivisor + '     ·     η = ' + learningRate,
    );
    const reveal = cue(k, 3, 'Its root mean square length'),
      large = dimensions[1],
      max = 992;
    dimensions.forEach((d, i) => {
      const y = 383 + i * 201;
      type(c, i ? 'Full weights' : 'Adapter', 125, y, 46, P.ink, 'left', 'Serif');
      type(c, i ? '7 billion coordinates' : '5 million coordinates', 127, y + 62, 30, P.muted);
      if (reveal) {
        const w = (max * sumNoiseRms(d)) / sumNoiseRms(large);
        rect(c, 664, y - 18, w, 43, i ? P.plum : P.blue, null, 4);
        type(
          c,
          'Sum noise RMS  ' + sumNoiseRms(d).toFixed(2),
          665,
          y + 66,
          34,
          i ? P.plum : P.blue,
          'left',
          'Mono',
        );
        if (cue(k, 4, i ? 'The ratio stays' : 'For the full model'))
          type(
            c,
            'Step noise RMS  ' + stepNoiseRms(d).toFixed(2),
            1200,
            y + 66,
            34,
            i ? P.plum : P.blue,
            'left',
            'Mono',
          );
      }
    });
    if (b === 4 || k.elapsed >= k.speechDuration)
      type(
        c,
        'Noise RMS ratio = √1400 ≈ ' + (sumNoiseRms(large) / sumNoiseRms(dimensions[0])).toFixed(2),
        127,
        824,
        54,
        P.ink,
        'left',
        'Serif',
      );
    return;
  }
  if (b <= 6) {
    heading(
      c,
      'Which training data changes between neighbors?',
      'Alice’s tickets also occurred in non-private pretraining.',
    );
    for (const [i, s] of ['With Alice in fine-tuning', 'Without Alice in fine-tuning'].entries()) {
      const y = 369 + i * 248;
      type(c, s, 115, y + 34, 38, P.ink, 'left', 'Serif');
      matrix(c, 692, y - 43, 4, 4, 39, P.soft, P.muted);
      type(c, 'Same frozen base', 886, y + 33, 34, P.muted);
      arrow(c, [1206, y + 33], [1330, y + 33], P.muted, 5);
      matrix(c, 1411, y - 12, 1, 4, 44, i ? P.light : P.sky, P.blue);
      type(c, i ? 'Adapter on D′' : 'Adapter on D', 1407, y + 84, 30, P.blue);
    }
    type(
      c,
      b === 5
        ? 'Compare incremental adapter training with the base fixed.'
        : 'A promise about pretraining also needs its own analysis.',
      120,
      882,
      44,
      P.ink,
      'left',
      'Serif',
    );
    return;
  }
  heading(c, 'A rank-one adapter', 'W = W₀ + (α / r) BA');
  matrix(c, 190, 345, 4, 4, 91, P.soft, P.muted);
  type(c, 'Frozen W₀', 190, 787, 38, P.muted);
  if (cue(k, 7, 'A rank-one update')) {
    type(c, '+', 655, 519, 78, P.ink, 'center');
    type(c, 'α / r', 844, 519, 48, P.ink, 'center', 'Mono');
    matrix(c, 1038, 345, 4, 1, 91, P.sky, P.blue);
    type(c, '×', 1235, 514, 64, P.ink, 'center');
    matrix(c, 1353, 477, 1, 4, 91, P.jade, P.teal);
    type(c, 'B   4 × 1', 1027, 787, 36, P.blue);
    type(c, 'A   1 × 4', 1370, 787, 36, P.teal);
  }
  if (b >= 8)
    type(
      c,
      b === 8
        ? '8 trainable entries  ·  clip the joint gradient over A and B'
        : 'The product BA still acts on all four input coordinates.',
      123,
      908,
      41,
      P.ink,
      'left',
      'Serif',
    );
}
