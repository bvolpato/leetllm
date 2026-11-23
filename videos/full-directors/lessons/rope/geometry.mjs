import {
  absoluteRow,
  dot,
  rotatePair,
  rotateHead,
  softmax,
} from '../../../films/rope/arithmetic.mjs';
import { CLOCK_FREQUENCIES } from '../../../films/rope/fixtures.mjs';
import { pairingTrace } from '../../../films/rope/model.mjs';
import {
  C,
  inks,
  TAU,
  mix,
  fmt,
  vec,
  beat,
  cue,
  box,
  line,
  path,
  disk,
  label,
  num,
  title,
  pairLabel,
  arrow,
  dial,
  instrument,
  strip,
  axis,
  plate,
} from './drawing.mjs';

const unit = [1, 0];
function readout(c, s, v, x, y, col = C.ink) {
  label(c, s, x, y, 35, C.mute);
  num(c, v, x, y + 80, 58, col);
}
function turn(c, t) {
  const p = 4 * cue(t, 2, 'Advance the position slider', 2.6),
    a = 0.5 * p;
  title(c, 'Turn one pair of coordinates');
  dial(c, 540, 544, 313);
  arrow(c, 540, 544, 0, 259, C.rule, 5);
  arrow(c, 540, 544, a, 259, C.q, 13);
  readout(c, 'Position × radians per position', fmt(p, 2) + ' × 0.5', 1030, 318);
  readout(c, 'Angle', fmt(a, 2) + ' rad', 1030, 525, C.q);
  num(c, '[x, y] = ' + vec(rotatePair(unit, a)), 1030, 773, 42);
  if (beat(t) === 3) label(c, 'Length = 1', 1030, 860, 41, C.green);
}
function matrix(c, t) {
  const a = 0.9 * cue(t, 1, 'After rotation', 1.3),
    second = cue(t, 1, 'vertical unit arrow', 0);
  title(c, 'Build a matrix from its columns');
  dial(c, 526, 540, 285);
  arrow(c, 526, 540, a, 234, C.q, 13);
  if (second) arrow(c, 526, 540, a + Math.PI / 2, 234, C.k, 13);
  const col1 = rotatePair(unit, a),
    col2 = rotatePair([0, 1], a);
  for (let j = 0; j < 1 + second; j++) {
    const x = 1110 + j * 374,
      col = j ? C.k : C.q;
    label(c, j ? 'R × [0, 1]' : 'R × [1, 0]', x, 304, 41, col, 'center');
    [col1, col2][j].forEach((v, i) => {
      box(c, x - 149, 367 + i * 124, 298, 115, j ? C.gold : C.qLight);
      num(c, fmt(v), x, 424 + i * 124, 52, C.ink, 'center');
    });
    label(c, j ? '−sin φ, cos φ' : 'cos φ, sin φ', x, 681, 34, col, 'center');
  }
  if (beat(t) === 2) label(c, 'R[x, y] = x × column 1 + y × column 2', 99, 895, 45);
  if (beat(t) === 3) {
    label(c, 'Query at m: use φ = mθ', 99, 895, 45, C.q);
    label(c, 'Key at n: use φ = nθ', 980, 895, 45, C.k);
  }
}
function alignment(c, t) {
  const b = beat(t);
  let qa = 0,
    ka =
      ((cue(t, 1, 'Turn the key a quarter turn', 1.25) + cue(t, 1, 'another quarter turn', 1.25)) *
        Math.PI) /
      2;
  if (b >= 3) {
    const reset = cue(t, 3, 'Bring the key back', 1.1);
    qa = 2.5 * cue(t, 3, 'Rotate the query', 1.4);
    ka = Math.PI * (1 - reset) + 1.5 * cue(t, 3, 'key for position three', 1.4);
  }
  title(c, 'Read a signed projection');
  instrument(c, 532, 524, 302, qa, ka);
  label(c, 'Query', 215, 897, 35, C.q);
  label(c, 'Key', 480, 897, 35, C.k);
  label(c, 'Projection', 686, 897, 35, C.green);
  label(c, 'Unit query × signed projection', 1002, 343, 43);
  const v = Math.cos(ka - qa);
  num(c, fmt(v), 1000, 476, 111, C.green);
  axis(c, 1020, 1730, 682, -1, 1, 1);
  disk(c, 1375 + 355 * v, 682, 15, C.green);
  if (b >= 3) num(c, 'key angle − query angle = ' + fmt(ka - qa, 2), 1002, 839, 35);
}
export function shiftedPair(shift, length = 1) {
  const k = 3 + shift,
    q = 5 + shift,
    f = 0.5;
  const qa = q * f,
    ka = k * f,
    projection = Math.cos(ka - qa);
  return { k, q, qa, ka, length, projection, score: projection * length };
}
function shared(c, t) {
  const s = shiftedPair(
    8 * cue(t, 2, 'Slide them together', 2.65),
    1 + cue(t, 4, 'double the length', 1.3),
  );
  const lengthTrial = cue(t, 4, 'double the length', 0);
  title(
    c,
    lengthTrial ? 'Lengthen the query at the same position' : 'Carry both positions forward',
  );
  axis(c, 200, 1700, 330, 3, 13, 1);
  const x = 200 + (s.k - 3) * 150;
  line(c, x, 286, x + 300, 286, C.green, 5);
  line(c, x, 286, x, 325, C.k, 5);
  line(c, x + 300, 286, x + 300, 325, C.q, 5);
  label(c, 'cats · K', x, 237, 37, C.k, 'center');
  label(c, 'dogs · Q', x + 300, 237, 37, C.q, 'center');
  instrument(c, 570, 682, 248, s.qa, s.ka, { unit: 173, qLength: s.length });
  label(c, 'K projected onto Q', 1002, 486, 35, C.green);
  num(c, fmt(s.projection), 1002, 555, 67, C.green);
  label(c, 'Q length × projection', 1002, 683, 35, C.mute);
  num(c, fmt(s.length, 2) + ' × ' + fmt(s.projection) + ' ≈ ' + fmt(s.score), 1000, 776, 57);
  if (beat(t) >= 3)
    label(
      c,
      lengthTrial
        ? 'Same positions, key and rotation rates'
        : 'Fixed Q, K and rates     R(−m) R(n) = R(n − m)',
      1000,
      889,
      33,
      C.mute,
    );
}
function pairs(c, t) {
  const offset = -2 * cue(t, 3, 'Take those two steps back', 2.1),
    sum = cue(t, 4, 'Add all four contributions', 0),
    scaled = cue(t, 4, 'Divide by', 0);
  title(c, beat(t) < 3 ? 'Which pair will point left?' : 'Measure the four projections');
  label(
    c,
    'Each blue query is the horizontal reference.  Key offset = ' + fmt(offset, 2),
    98,
    227,
    38,
    C.mute,
  );
  const vals = CLOCK_FREQUENCIES.map((f) => Math.cos(offset * f));
  vals.forEach((v, i) => {
    const x = 290 + 445 * i;
    instrument(c, x, 510, 149, 0, offset * CLOCK_FREQUENCIES[i]);
    num(c, CLOCK_FREQUENCIES[i] + ' rad / step', x, 725, 33, inks[i], 'center');
    num(c, fmt(v), x, 811, 54, v < 0 ? C.red : C.green, 'center');
  });
  const total = vals.reduce((a, v) => a + v, 0);
  if (sum)
    num(
      c,
      'sum = ' +
        fmt(total) +
        (scaled ? '      logit ≈ ' + fmt(total) + ' / √8 ≈ ' + fmt(total / Math.sqrt(8)) : ''),
      960,
      937,
      43,
      C.ink,
      'center',
    );
}
export function partialHead() {
  const q = [1, 0, 1, 0, 0.5, 1, -0.5, 2],
    k = [1, 0, 1, 0, 1, -1, 0.5, 1],
    rates = [1, 0.01];
  const rq = rotateHead(q, 5, rates),
    rk = rotateHead(k, 2, rates),
    parts = [
      [0, 2],
      [2, 4],
      [4, 8],
    ].map(([a, b]) => dot(rq.slice(a, b), rk.slice(a, b)));
  return { q, k, rq, rk, parts, total: dot(rq, rk) };
}
function prefix(c, t) {
  const v = partialHead(),
    rotated = cue(t, 2, 'rotate only the configured prefix', 0);
  title(c, 'Four coordinates turn. Four stay fixed.');
  label(c, 'Head width 8     ·     Rotary width 4     ·     rates 1 and 0.01', 98, 214, 38, C.mute);
  const rows = rotated ? [v.rq, v.rk] : [v.q, v.k];
  label(c, 'rotary prefix', 630, 320, 39, C.q, 'center');
  label(c, 'suffix', 1408, 320, 39, C.mute, 'center');
  rows.forEach((row, j) => {
    label(c, j ? 'K₂' : 'Q₅', 102, 438 + j * 124, 56, j ? C.k : C.q);
    row.forEach((z, i) => {
      const x = 254 + i * 192,
        y = 391 + j * 124;
      box(c, x, y, 184, 100, i < 4 ? [C.qLight, C.mint][Math.floor(i / 2)] : C.pale);
      num(c, fmt(z, 2), x + 92, y + 50, 39, C.ink, 'center');
    });
  });
  if (rotated) {
    num(c, 'dot = ' + v.parts.map((p) => fmt(p)).join(' + ') + ' = ' + fmt(v.total), 100, 742, 48);
  }
  if (beat(t) >= 3)
    num(
      c,
      'logit ≈ ' + fmt(v.total) + ' / √8 ≈ ' + fmt(v.total / Math.sqrt(8)),
      100,
      854,
      48,
      C.green,
    );
  if (beat(t) === 4)
    label(c, '(x + iy) × (cos φ + i sin φ) rotates one complex pair.', 102, 945, 34, C.mute);
}
function waveTrace(c, x, y, w, h, range, at, fn, col, marker = at) {
  line(c, x, y, x + w, y, C.rule, 3);
  const steps = Math.max(1, Math.ceil((160 * at) / range)),
    points = Array.from({ length: steps + 1 }, (_, i) => {
      const u = (at * i) / steps;
      return [x + (w * u) / range, y - h * fn(u)];
    });
  path(c, points, col, 5);
  disk(c, x + w * marker / range, y - h * fn(marker), 8, col);
}
function sumWaves(c, t) {
  const d = 14 * cue(t, 2, 'As the distance changes', 4.4),
    fs = [0.5, 0.05],
    functions = fs.map((f) => (x) => Math.cos(x * f));
  const sum = (x) => functions[0](x) + functions[1](x);
  title(c, 'Add the response of each pair');
  const ys = [340, 544, 780],
    fns = [...functions, sum];
  ['Fast pair  ·  0.5', 'Slow pair  ·  0.05', 'Head sum'].forEach((s, i) => {
    label(c, s, 110, ys[i] - 25, 42, i === 2 ? C.green : C.ink);
    num(c, fmt(fns[i](d)), 110, ys[i] + 45, 51, inks[i]);
    waveTrace(c, 585, ys[i], 1140, 65, 14, d, fns[i], inks[i]);
  });
  num(c, 'Continuous distance = ' + fmt(d, 2), 1735, 923, 33, C.mute, 'right');
}
export const layoutExample = {
  adjacent: [4, -1, 7, 3, -2, 8, 6, 9],
  rotaryWidth: 6,
};
export function splitOrder(width, rotaryWidth) {
  const indices = Array.from({ length: width }, (_, i) => i);
  const prefix = indices.slice(0, rotaryWidth);
  return [
    ...prefix.filter((i) => i % 2 === 0),
    ...prefix.filter((i) => i % 2 === 1),
    ...indices.slice(rotaryWidth),
  ];
}
function prefixLayout(c, t) {
  const { adjacent, rotaryWidth } = layoutExample;
  const order = splitOrder(adjacent.length, rotaryWidth);
  const xs = cue(t, 4, 'Gather the x entries', 1.3);
  const ys = cue(t, 4, 'Follow them with the y entries', 1.3);
  const center = (i) => 228 + 208 * i;
  const colors = [C.qLight, C.gold, C.mint];
  function tile(i, column, y) {
    const paired = i < rotaryWidth;
    const name = paired ? (i % 2 ? 'y' : 'x') + Math.floor(i / 2) : 'suffix';
    const x = center(column);
    box(c, x - 83, y, 166, 120, paired ? colors[Math.floor(i / 2)] : C.pale);
    label(c, name, x, y + 30, 31, C.mute, 'center');
    num(c, fmt(adjacent[i], 0), x, y + 82, 49, C.ink, 'center');
  }
  title(c, 'Which entries start the split-half layout?');
  label(c, 'Adjacent layout   ·   rotary width 6', 100, 244, 40);
  adjacent.forEach((_, i) => tile(i, i, 325));
  label(c, 'Split-half layout', 100, 935, 40);
  order.forEach((i, j) => {
    const suffix = i >= rotaryWidth;
    const travel = suffix ? 1 : i % 2 ? ys : xs;
    const from = center(i),
      to = center(j);
    if (travel > 0) {
      const tipX = mix(from, to, travel),
        tipY = mix(448, 752, travel);
      line(c, from, 448, tipX, tipY, suffix ? C.rule : inks[Math.floor(i / 2)], 4);
      disk(c, tipX, tipY, 7, suffix ? C.rule : inks[Math.floor(i / 2)]);
    }
    if (travel === 1) tile(i, j, 756);
    else {
      box(c, to - 83, 756, 166, 120, C.paper, C.rule, 3);
      label(c, '?', to, 816, 46, C.mute, 'center');
    }
  });
  line(c, center(5) + 104, 309, center(5) + 104, 893, C.rule, 3);
}
function pairing(c, t) {
  if (beat(t) >= 3) return prefixLayout(c, t);
  const values = pairingTrace();
  const wrong = cue(t, 2, 'Switching the helper', 0),
    fixed = cue(t, 2, 'Reordering both vectors', 0);
  const q = fixed ? values.permutation.map((i) => values.q[i]) : values.q,
    k = fixed ? values.permutation.map((i) => values.k[i]) : values.k;
  title(c, 'Which coordinates turn together?');
  label(c, 'm = 5     n = 2     ·     frequencies 1 and 0.01', 100, 223, 37, C.mute);
  const groups = wrong ? [0, 1, 0, 1] : [0, 0, 1, 1];
  [q, k].forEach((row, j) => {
    label(c, j ? 'K' : 'Q', 142, 395 + j * 189, 64, j ? C.k : C.q);
    row.forEach((v, i) => {
      const x = 270 + 235 * i,
        y = 317 + 189 * j;
      plate(c, x, y, 200, 146, [C.qLight, C.gold][groups[i]]);
      num(c, v, x + 100, y + 73, 69, C.ink, 'center');
    });
  });
  label(
    c,
    fixed ? 'Converted split halves' : wrong ? 'Unconverted split halves' : 'Adjacent pairs',
    1320,
    345,
    42,
    C.ink,
  );
  readout(
    c,
    'Pair dot-product sum',
    fmt(fixed ? values.converted : wrong ? values.wrong : values.adjacent),
    1320,
    506,
    wrong && !fixed ? C.red : C.green,
  );
  label(c, 'Both norms = √30', 1320, 730, 38, C.mute);
}
const routingRate = 0.55;
const routingStart = 3;
const routingValues = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

export function routingState(position) {
  const queryAngle = position * routingRate;
  const keyAngles = [0, 0.8, -0.5].map((angle, i) => angle + i * routingRate);
  const scores = keyAngles.map((angle) => Math.cos(angle - queryAngle));
  const logits = scores.map((score) => score / Math.sqrt(unit.length));
  const weights = softmax(logits);
  const output = routingValues[0].map((_, i) => dot(weights, routingValues.map((v) => v[i])));
  return { queryAngle, keyAngles, scores, logits, weights, output };
}

const startingWeights = routingState(routingStart).weights;

function routing(c, t) {
  const travel = cue(t, 2, 'As our query moves', 2.9);
  const position = Math.round(100 * mix(routingStart, 6, travel)) / 100;
  const { queryAngle, keyAngles, scores, logits, weights, output } = routingState(position);
  const showScores = cue(t, 1, 'Compute the three dot products', 0);
  const showLogits = cue(t, 1, 'divide by the square root of two', 0);
  const showWeights = cue(t, 1, 'then apply softmax across these visible keys', 0);
  const showValues = cue(t, 1, 'Here each value marks', 0);

  title(c, 'Follow each value into the mixture');
  label(
    c,
    `Unit query at ${fmt(position, 2)}    ·    ${routingRate} rad / position`,
    100,
    194,
    39,
    C.mute,
  );
  if (showScores) label(c, 'Dot product', 100, 567, 39, C.mute);
  if (showLogits) label(c, 'Logit (÷ √2)', 100, 627, 39, C.mute);
  if (showWeights) label(c, 'Softmax weight', 100, 687, 39, C.mute);

  const left = 630,
    width = 1070,
    barY = 841;
  let consumed = 0;
  weights.forEach((weight, i) => {
    const x = 480 + i * 540;
    instrument(c, x, 369, 127, queryAngle, keyAngles[i], { project: Boolean(showScores) });
    label(c, 'Key ' + i, x, 521, 38, C.k, 'center');
    if (showScores) num(c, fmt(scores[i]), x, 567, 43, C.green, 'center');
    if (showLogits) num(c, fmt(logits[i]), x, 627, 43, C.ink, 'center');
    if (showWeights) num(c, fmt(weight * 100, 1) + '%', x, 687, 47, inks[i], 'center');
    if (position > routingStart)
      label(c, 'was ' + fmt(startingWeights[i] * 100, 1) + '%', x + 104, 687, 33, C.mute);
    if (!showValues) return;
    const destination = left + width * (consumed + weight / 2);
    consumed += weight;
    line(c, x, 781, destination, barY, inks[i], weight * 52);
    box(c, x - 178, 721, 356, 63, [C.qLight, C.gold, C.mint][i]);
    num(c, 'V' + i + ' ' + vec(routingValues[i], 0), x, 752, 39, C.ink, 'center');
  });
  if (showValues) {
    strip(c, left, barY, width, 56, weights, inks);
    label(c, 'Output', 100, 829, 39);
    num(c, vec(output), 100, 874, 39);
  }
}
const fastRate = 0.5, slowRate = 0.05;
export const fastScore = (gap) => Math.cos(fastRate * gap);
export const slowScore = (gap) => Math.cos(slowRate * gap);
function wrap(c, t) {
  const swept = Math.PI / fastRate * (cue(t, 1, 'swings away', 1.7) + cue(t, 1, 'comes all the way around', 1.8));
  const twelve = cue(t, 2, 'At gap twelve', 0);
  const thirteen = cue(t, 3, 'At gap thirteen', 0);
  const d = thirteen ? 13 : twelve ? 12 : swept;
  const traced = Math.max(swept, d);
  const slow = beat(t) > 1;
  title(c, 'Watch the fast pair come around');
  label(c, 'Fast pair  ·  ' + fastRate + ' rad / position', 99, 219, 40, C.green);
  if (slow) label(c, 'Slow pair  ·  ' + slowRate + ' rad / position', 975, 219, 40, C.k);
  instrument(c, 395, 530, 229, 0, -d * fastRate);
  const plotX = (gap) => 775 + 985 * gap / 14;
  if (twelve) {
    line(c, plotX(d), 311, plotX(d), 690, C.mute, 2, [7, 7]);
    label(c, 'Gap ' + d, plotX(d), 279, 35, C.ink, 'center');
  }
  if (slow) waveTrace(c, 775, 507, 985, 163, 14, traced, slowScore, C.k, d);
  waveTrace(c, 775, 507, 985, 163, 14, traced, fastScore, C.green, d);
  if (thirteen) disk(c, plotX(12), 507 - 163 * fastScore(12), 7, C.paper, C.green, 3);
  line(c, plotX(0), 690, plotX(14), 690, C.rule, 2);
  for (const [offset, name] of [[0, '0'], [TAU, '2π'], [2 * TAU, '4π']]) {
    const x = plotX(offset);
    line(c, x, 690, x, 702, C.rule, 3);
    num(c, name, x, 727, 34, C.mute, 'center');
  }
  label(c, 'Continuous distance (position units)', 1268, 783, 36, C.mute, 'center');
  const operand = d === TAU ? '2π' : d === 2 * TAU ? '4π' : fmt(d, Number.isInteger(d) ? 0 : 2);
  num(c, 'cos(0.5 × ' + operand + ') ≈ ' + fmt(fastScore(d)), 99, 839, 42, C.green);
  if (slow) num(c, 'cos(0.05 × ' + operand + ') ≈ ' + fmt(slowScore(d)), 99, 918, 40, C.k);
  if (twelve) {
    label(c, 'Fast score at integer token gaps', 975, 863, 40);
    num(c, '12: ' + fmt(fastScore(12)) + '     13: ' + (thirteen ? fmt(fastScore(13)) : '?'), 975, 934, 43);
  }
}
export function patchTrial(move, lost) {
  const key = [4 * move, 1 + 7 * move];
  const query = [key[0] + 1, key[1]];
  const offsets = key.map((v, i) => (lost && i === 0 ? 0 : v - query[i]));
  const phases = offsets.map((v) => v * 0.5);
  const score = phases.reduce((total, phase) => total + dot(unit, rotatePair(unit, phase)), 0);
  return { key, query, offsets, phases, score };
}
function spatial(c, t) {
  const b = beat(t),
    move = cue(t, 2, 'Shift both', 1.6),
    lost = cue(t, 3, 'Discard height IDs', 0);
  if (b < 4) {
    title(c, lost ? 'Set both encoded heights to zero' : 'Keep the two patch coordinates');
    const trial = patchTrial(move, lost);
    const px = 112,
      py = 307,
      step = 91;
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 9; j++) {
        box(c, px + j * step, py + i * step, step - 4, step - 4, (i + j) % 2 ? C.pale : '#dde5d9');
      }
    for (let hTick = 0; hTick < 6; hTick++)
      num(c, hTick, px - 20, py + (hTick + 0.47) * step, 27, C.mute, 'right');
    for (let wTick = 0; wTick < 9; wTick++)
      num(c, wTick, px + (wTick + 0.47) * step, py - 32, 27, C.mute, 'center');
    [
      [...trial.key, 'K', C.k],
      [...trial.query, 'Q', C.q],
    ].forEach(([i, j, s, col]) => {
      const x = px + (j + 0.47) * step,
        y = py + (i + 0.47) * step;
      disk(c, x, y, 32, col);
      label(c, s, x, y, 39, C.white, 'center');
    });
    label(c, 'Encoded offsets   ·   key minus query', 1035, 321, 39);
    readout(c, 'Height  /  width', trial.offsets.map((v) => fmt(v, 0)).join('  /  '), 1035, 416);
    if (b >= 2) {
      label(c, 'On each axis, Q and K start at [1, 0].', 1035, 198, 40);
      label(c, 'Rate on each axis = 0.5 rad / step', 1035, 252, 36, C.mute);
    }
    if (cue(t, 2, 'Add the two pair scores', 0)) {
      num(
        c,
        trial.phases.map((v) => 'cos(' + fmt(v, v === 0 ? 0 : 1) + ')').join(' + '),
        1035,
        644,
        48,
      );
      num(c, (lost ? '= ' : '≈ ') + fmt(trial.score), 1035, 740, 65, lost ? C.red : C.green);
    }
    if (lost)
      label(
        c,
        'With height IDs, the score was ' + fmt(patchTrial(move, false).score) + '.',
        1035,
        860,
        37,
        C.mute,
      );
  } else {
    title(c, 'A vertical stride depends on raster width');
    [2, 4].forEach((width, i) => {
      const x = 140 + 770 * i;
      label(c, 'Width ' + width, x, 301, 48);
      for (let r = 0; r < 2; r++)
        for (let j = 0; j < width; j++) {
          box(c, x + j * 142, 370 + r * 141, 134, 134, j === 0 ? (r ? C.qLight : C.gold) : C.pale);
          num(c, r * width + j, x + j * 142 + 67, 438 + r * 141, 48, C.ink, 'center');
        }
      num(c, 'vertical gap = ' + width, x, 728, 41);
    });
    if (b === 5)
      label(
        c,
        'Qwen2.5-VL     text [p, p, p]     image [t, h, w]     ·     processor sets the axes',
        95,
        902,
        38,
      );
  }
}
export const geometryScenes = [
  turn,
  matrix,
  alignment,
  shared,
  pairs,
  prefix,
  sumWaves,
  pairing,
  routing,
  wrap,
  spatial,
];
