import {
  C,
  arrow,
  box,
  dot,
  ground,
  horizontalScale,
  line,
  mono,
  phase,
  serif,
  tag,
  text,
} from './drawing.mjs';
import {
  buckets,
  fmt,
  gloveResidual,
  grams,
  ids,
  NEGATIVE_OUTPUTS,
  negativeSamplingState,
  readNeighbors,
  readSentence,
  scale,
  shiftedCell,
  subwordComposition,
  vec,
} from './geometry.mjs';

export function trainingWindow(c, k) {
  const b = k.beat.beatIndex,
    skip = phase(k, 2, 'Reverse the arrows', 0) === 1;
  ground(c, skip ? 'Skip-gram predicts neighbors' : 'CBOW predicts a missing word');
  const xs = [285, 620, 965, 1305, 1645],
    y = 497;
  box(c, 90, 394, 1353, 167, C.light, 12, C.muted, 3);
  readSentence.forEach((w, i) => {
    const blank = i === 1 && phase(k, 2, 'Read fills the gap', 0) === 0;
    serif(c, blank ? '_____' : w, xs[i], y, 66, i === 1 ? C.blue : i === 4 ? C.muted : C.ink, 'center');
    mono(c, ['−1', '0', '+1', '+2', '+3'][i], xs[i], 343, 34, C.muted, 'center');
  });
  readNeighbors.forEach((w, i) => {
    const xx = xs[readSentence.indexOf(w)],
      source = skip ? xs[1] : xx,
      target = skip ? xx : xs[1];
    const height = 128 + Math.abs(target - source) * 0.11;
    c.save();
    c.strokeStyle = C.aqua;
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(source, 551);
    c.bezierCurveTo(source, 551 + height, target, 551 + height, target, 551);
    c.stroke();
    c.restore();
    arrow(c, [target, 589], [target, 546], C.aqua, 7, 29);
  });
  if (b === 0) serif(c, 'Which word fits the gap?', 962, 830, 60, C.blue, 'center');
  else if (skip && b < 3) {
    readNeighbors.forEach((w, i) => mono(c, '(read, ' + w + ')', 110 + i * 546, 825, 42));
    if (b === 2) text(c, 'night is three positions from read', 1125, 923, 34, C.muted);
  } else if (b >= 3) {
    tag(c, 'Train on a pair', 97, 754);
    mono(c, 'input(read) · output(stories)', 97, 826, 40, C.aqua);
    tag(c, 'Compare two words', 1092, 754);
    mono(c, 'cos(input(read), input(write))', 1092, 826, 36, C.blue);
  }
}
const stages = ['observed', 'noise 1', 'noise 2'];
export function trainingStep(c, k) {
  const b = k.beat.beatIndex;
  ground(c, 'Take one downhill step with the center row');
  const step = phase(k, 8, 'Take the step', 1.15);
  const model = negativeSamplingState(step);
  tag(c, 'Center input', 93, 244);
  mono(c, vec(model.updated), 375, 250, 49, C.blue);
  tag(c, 'Output rows stay fixed', 1125, 244);
  const cols = [100, 405, 747, 1020, 1394],
    ys = [442, 550, 658];
  const headers = ['Training draw', 'Output row', 'Dot score', 'Loss slope', 'Slope × row'];
  if (b >= 7) {
    headers[2] = 'Initial score';
    headers[3] = 'Initial slope';
  }
  headers.forEach((h, i) => tag(c, h, cols[i], 350));
  const noise = phase(k, 1, 'Now draw two noise rows', 0.55) > 0;
  for (let i = 0; i < 3; i++) {
    if (i > 0 && !noise) continue;
    const y = ys[i],
      color = i === 0 ? C.aqua : C.coral;
    line(c, [91, y + 37], [1820, y + 37], C.grid);
    text(c, stages[i], cols[0], y, 44, color);
    mono(c, vec(NEGATIVE_OUTPUTS[i]), cols[1], y, 40);
    // These slopes and scores define the gradient at the original center.
    mono(c, fmt(model.scores[i]), cols[2], y, 40);
    if (b >= 4) {
      mono(c, fmt(model.coefficients[i]), cols[3], y, 40, color);
      mono(c, vec(scale(NEGATIVE_OUTPUTS[i], model.coefficients[i])), cols[4], y, 37, color);
    }
  }
  if (b <= 1) {
    serif(
      c,
      b === 0 ? 'One observed neighbor, two noise draws' : 'A repeated draw contributes twice',
      98,
      837,
      58,
    );
    if (b === 1) mono(c, 'P(noise = w) ∝ frequency(w) ^ 0.75', 100, 920, 36, C.muted);
  } else if (b <= 3) {
    mono(c, b === 2 ? 'observed loss = −ln σ(score)' : 'noise loss = −ln σ(−score)', 99, 809, 49);
    text(
      c,
      b === 2
        ? 'At score 0, the sigmoid is ½.'
        : 'Total loss adds the observed term and every noise term.',
      99,
      898,
      39,
      C.muted,
    );
  } else if (b < 7) {
    mono(c, 'slope = σ(score) − label', 99, 805, 47);
    if (b >= 5) mono(c, 'gradient  ' + vec(model.gradient), 100, 903, 52, C.blue);
  } else {
    tag(c, 'Updated positive score', 100, 789);
    tag(c, 'Total loss', 966, 789);
    mono(c, fmt(model.scores[0]) + ' → ' + fmt(model.positiveScore), 101, 889, 68, C.aqua);
    mono(c, fmt(model.lossBefore) + ' → ' + fmt(model.loss), 966, 889, 68, C.coral);
    tag(c, 'Step from center ' + vec(model.center), 971, 944);
  }
}
export function draws(c, k) {
  const four = phase(k, 3, 'Make four draws', 1.2),
    water = phase(k, 4, 'Now take apple with water', 0.35) > 0.05;
  const factor = 1 + Math.round(3 * four),
    model = shiftedCell(factor, water ? 2 : 0);
  ground(c, 'How many noise draws compete with this observation?');
  serif(c, water ? 'apple × water' : 'apple × fruit', 98, 298, 74);
  mono(c, 'k = ' + fmt(factor, 1), 1305, 298, 57, C.blue);
  const x = 486,
    w = 1170,
    scaleX = (n) => x + (w * n) / 18;
  tag(c, 'Observed pairs', 100, 441, C.aqua);
  tag(c, 'Expected noise', 100, 603, C.coral);
  [
    [model.observed, C.aqua],
    [model.noise, C.coral],
  ].forEach(([n, ink], i) => {
    const y = 388 + i * 164;
    box(c, x, y, w, 78, C.faint, 3);
    if (n > 0) box(c, x, y, scaleX(n) - x, 78, ink, 3);
    mono(c, fmt(n, 2), 1710, y + 58, 44, ink);
  });
  horizontalScale(c, x, 682, w, 18, 1, 2);
  if (k.beat.beatIndex > 0) {
    const out = model.observed ? fmt(model.optimum) : '−∞';
    mono(c, 'ln(observed / expected noise)   ' + out, 100, 857, 54, C.ink);
    if (k.beat.beatIndex === 4)
      text(c, 'Free pair score; finite vectors must fit many pairs together.', 102, 935, 37, C.muted);
  }
}
export function residual(c, k) {
  ground(c, 'Fit the log count on a shared ruler');
  const b = k.beat.beatIndex,
    scoreOn = phase(k, 2, 'Set every yellow mark', 0.6);
  const targetOn = phase(k, 3, 'The blue dot', 0.6);
  const data = [3, 30, 300].map((n) => gloveResidual(n));
  tag(c, 'Observed count', 99, 279);
  tag(c, 'Natural log', 491, 279);
  if (b >= 4) tag(c, 'Count weight', 1477, 279);
  for (let i = 0; i < data.length; i++) {
    const d = data[i],
      y = 398 + i * 158,
      xx = (n) => 490 + n * 142;
    serif(c, String(d.count), 100, y + 18, 69);
    line(c, [xx(0), y], [xx(6), y], C.muted, 4);
    for (let j = 0; j <= 6; j++) line(c, [xx(j), y - 10], [xx(j), y + 12], C.grid, 3);
    if (scoreOn > 0) box(c, xx(d.score) - 6, y - 35, 12, 70 * scoreOn, C.gold);
    if (targetOn > 0) {
      line(c, [xx(d.target), y + 22], [xx(d.score), y + 22], C.coral, 6);
      dot(c, [xx(d.target), y], 12, C.blue);
      mono(c, fmt(d.target), xx(d.target), y + 74, 30, C.blue, 'center');
    }
    if (b >= 4) {
      box(c, 1477, y - 9, 293, 20, C.faint, 5);
      box(c, 1477, y - 9, 293 * d.weight, 20, C.aqua, 5);
      mono(c, fmt(d.weight), 1477, y + 62, 34, C.aqua);
    }
  }
  if (b >= 3) mono(c, 'Count 3    (ln 30 − ln 3)²  ≈  ' + fmt(data[0].squared), 100, 892, 48);
  else if (b > 0) {
    dot(c, [132, 876], 12, C.gold);
    text(c, 'Model score = dot product + word bias + context bias', 170, 893, 42);
  } else text(c, 'A neighbor two places away adds ½ to a window count.', 99, 894, 42);
}
export function spelling(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    ground(c, 'Which three-character pieces can played reuse?');
    const steps = ['across both spellings', 'one position at a time', 'After the y', 'One more step', 'The final step'];
    const index = steps.filter((cue) => phase(k, 1, cue, 0) === 1).length;
    const shared = grams('play').filter((piece, j) => piece === grams('played')[j]);
    ['play', 'played'].forEach((word, i) => {
      const pieces = grams(word),
        letters = ('<' + word + '>').split(''),
        y = 333 + i * 250,
        x = 285,
        w = 100;
      const window = Math.min(index, pieces.length - 1);
      const common = shared.includes(pieces[window]);
      box(c, x + window * w - 8, y - 79, w * 3 + 8, 111, common || !i ? C.sea : C.rose, 7, common || !i ? C.aqua : C.coral, 4);
      letters.forEach((letter, j) => mono(c, letter, x + (j + 0.5) * w, y, 65, C.ink, 'center'));
      pieces.forEach((piece, j) => {
        const visitedMatch = j <= index && shared.includes(piece);
        const left = x + j * 145;
        mono(c, piece, left, y + 110, 40, visitedMatch ? C.aqua : C.muted);
        if (visitedMatch) line(c, [left, y + 123], [left + 77, y + 123], C.aqua, 4);
      });
    });
    tag(c, 'Boundary marks are part of each spelling.', 285, 853);
    return;
  }
  ground(c, 'Count every returned bucket occurrence');
  const m = subwordComposition(ids, buckets);
  tag(c, 'Unknown spelling · toy bucket sequence', 100, 274);
  m.ids.forEach((id, i) => {
    const deal = phase(k, 3, 'Deal one row', 1.4);
    const dealt = Math.min(1, Math.max(0, 3 * deal - i));
    if (dealt === 0 && b === 2) return;
    const x = 100 + i * 420,
      col = id === 0 ? C.sea : C.rose;
    c.save();
    c.translate(0, -58 * (1 - dealt));
    box(c, x + 7, 355, 375, 192, C.grid, 6);
    box(c, x, 345, 375, 190, col, 6, id === 0 ? C.aqua : C.coral, 3);
    tag(c, 'Bucket ' + id, x + 30, 402);
    mono(c, vec(buckets[id]), x + 30, 499, 56);
    if (i < 2) text(c, '+', x + 382, 460, 49);
    c.restore();
  });
  if (b >= 4) {
    serif(c, 'Sum', 1451, 376, 51);
    if (phase(k, 5, 'The paper uses', 0) === 1) mono(c, vec(m.sum), 1450, 478, 63, C.aqua);
    line(c, [99, 620], [1808, 620], C.muted);
    if (phase(k, 5, 'The word-vector API', 0) === 1) {
      tag(c, 'Word-vector API', 99, 717);
      const reduced = b > 4 || k.elapsed >= k.speechDuration;
      const fractions = m.sum.map((n) => fmt(n) + '/' + m.ids.length).join(', ');
      mono(c, vec(m.sum) + ' / ' + m.ids.length + ' = ' + (reduced ? '[' + fractions + ']' : '?'), 99, 817, 48);
    }
    if (b >= 5) {
      tag(c, 'Subword storage', 1152, 712);
      mono(c, '.bin   whole model', 1152, 784, 39, C.blue);
      mono(c, '.vec   known rows', 1152, 850, 39, C.muted);
    }
  } else
    text(
      c,
      b === 2
        ? 'IDs   0, 0, 1'
        : 'Unknown word: use its bucket rows. A known word also has a whole-word row.',
      101,
      763,
      b === 2 ? 56 : 40,
    );
}
