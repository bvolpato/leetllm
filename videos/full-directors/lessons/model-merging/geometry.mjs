import { tasks, samples, pathScreen } from '../../../films/model-merging/decisions.mjs';
import { VECTOR_A, VECTOR_B, permutationExample } from '../../../films/model-merging/fixtures.mjs';
import { evaluateNeurons, average } from '../../../films/model-merging/arithmetic.mjs';
import {
  ink,
  paper,
  muted,
  rule,
  code,
  math,
  chat,
  gold,
  colors,
  bright,
  dark,
  pale,
  white,
  pink,
  mix,
  cue,
  text,
  mono,
  title,
  rect,
  box,
  line,
  dash,
  dot,
  polygon,
  arrow,
  screw,
  heading,
  number,
  signed,
  grid,
} from './drawing.mjs';

export const weightsGB = (8e9 * 2) / 1e9;
const addresses = [7, 8, 9, 10, 11, 12, 13, 14];
function cartridge(c, x, y, w, h, name, accent, readAddress) {
  box(c, x, y, w, h, '#28464a', '#6c9188', 8);
  for (let a = 0; a < 40; a++)
    rect(c, x + 24 + (a * (w - 48)) / 40, y + h - 1, (w - 48) / 40 - 3, 11, '#cfad66');
  screw(c, x + 13, y + 13);
  screw(c, x + w - 13, y + 13);
  text(c, name, x + 29, y + 41, 39, accent, 'left', 'Serif');
  mono(c, weightsGB + ' GB', x + w - 25, y + 40, 28, white, 'right');
  const gap = (w - 54) / 8;
  addresses.forEach((address, i) => {
    const hx = x + 27 + i * gap,
      chosen = readAddress && address === 10;
    box(c, hx, y + 77, gap - 6, 47, chosen ? accent : '#12282d', chosen ? white : '#59736c', 3, 2);
    mono(c, address, hx + (gap - 6) / 2, y + 101, 23, chosen ? dark : pale, 'center');
  });
}
export function opening(c, k) {
  const b = k.beat.beatIndex;
  rect(c, 0, 0, 1920, 1080, dark);
  const align = cue(k, 0, 'Follow one address', 0.85),
    loaded = cue(k, 0, 'Slide Code', 1.35);
  const single = cue(k, 1, 'a single image'),
    total = cue(k, 0, 'forty-eight gigabytes');
  text(c, 'Three specialist checkpoints', 95, 112, 72, white, 'left', 'Serif');
  text(c, 'Common starting checkpoint   /   8 billion parameters', 98, 194, 33, pale);
  text(c, 'Parameter addresses', 126, 244, 26, pale);
  const xs = [142, 220, 100];
  for (let i = 0; i < 3; i++) {
    const y = 278 + i * 176,
      x = mix(xs[i] + (1 - loaded) * 90, 124, align);
    cartridge(c, x, y, 625, 139, tasks[i], bright[i], align > 0);
  }
  if (align === 1) {
    line(
      c,
      124 + 27 + (3.5 * (625 - 54)) / 8 - 3,
      401,
      124 + 27 + (3.5 * (625 - 54)) / 8 - 3,
      454,
      '#ffd477',
      3,
    );
    line(
      c,
      124 + 27 + (3.5 * (625 - 54)) / 8 - 3,
      577,
      124 + 27 + (3.5 * (625 - 54)) / 8 - 3,
      630,
      '#ffd477',
      3,
    );
  }
  text(c, total ? '48 GB resident' : '2 bytes per parameter', 126, 862, 49, white, 'left', 'Serif');
  const x = 1024,
    y = 316;
  box(c, x, y, 762, 435, '#2d474b', '#8a9e91', 20, 4);
  for (const u of [x + 19, x + 743]) for (const v of [y + 19, y + 416]) screw(c, u, v);
  for (let i = 0; i < 37; i++)
    line(c, x + 38 + i * 18, y + 48, x + 49 + i * 18, y + 74, '#13282d', 6);
  box(c, x + 47, y + 109, 665, 182, '#102428', '#75918b', 6, 3);
  if (single) cartridge(c, x + 66, y + 122, 625, 139, 'Merged weights', '#ffd477', true);
  else {
    text(c, 'One checkpoint?', x + 376, y + 203, 57, pale, 'center', 'Serif');
  }
  text(
    c,
    single ? 'Candidate server' : 'Candidate weight slot',
    x + 52,
    y + 350,
    48,
    white,
    'left',
    'Serif',
  );
  if (b === 1 && single) text(c, 'Task tests pending', x + 52, 841, 44, '#ffd477');
  if (b >= 2) {
    const avg = cue(k, 2, 'eighty-seven point two');
    text(c, avg ? 'Task mean    87.2%' : 'Example release report', x + 50, 831, 49, '#ffd477');
    if (b === 3) text(c, 'Code  ?      Math  ?      Chat  ?', x + 51, 914, 34, pale);
  }
}
const nets = permutationExample();
export const probeNet = (n) => [-1, 1].map((v) => evaluateNeurons(n, v));
function neuron(c, x, y, wi, wo, col) {
  box(c, x, y, 410, 108, white, col, 49, 4);
  mono(c, signed(wi), x + 58, y + 55, 42, col, 'center');
  arrow(c, x + 111, y + 56, x + 148, y + 56, col, 3);
  text(c, 'ReLU', x + 208, y + 54, 35, ink, 'center');
  arrow(c, x + 267, y + 56, x + 306, y + 56, col, 3);
  mono(c, signed(wo), x + 353, y + 55, 42, col, 'center');
}
export function alignment(c, k) {
  const swap = cue(k, 2, 'swap the two complete neurons', 1.0);
  const bySlot = cue(k, 1, 'Average by slot'),
    answer = cue(k, 2, 'Both outputs'),
    aligned = cue(k, 3, 'The aligned average');
  title(
    c,
    'Which neurons share a slot?',
    'Each chain multiplies by an input weight, keeps the positive part, then multiplies by an output weight.',
  );
  const cols = [105, 694, 1323];
  ['Network A', 'Network B', 'Slot average'].forEach((s, i) => heading(c, s, cols[i], 301));
  const drawNet = (x, n, sw = 0) => {
    n.input.forEach((wi, i) => {
      const y = mix(370 + i * 190, 370 + (1 - i) * 190, sw);
      const excursion = Math.sin(sw * Math.PI),
        scale = 1 - 0.42 * excursion;
      c.save();
      c.translate(x + 205 + (i ? 1 : -1) * excursion * 164, y + 54);
      c.scale(scale, scale);
      neuron(c, -205, -54, wi, n.output[i], wi > 0 ? code : wi < 0 ? math : muted);
      c.restore();
    });
  };
  drawNet(cols[0], nets.a);
  drawNet(cols[1], nets.b, swap);
  if (bySlot && (swap === 0 || aligned)) drawNet(cols[2], aligned ? nets.aligned : nets.naive);
  else {
    dash(c, 1323, 423, 1733, 423);
    dash(c, 1323, 613, 1733, 613);
  }
  const reference = cue(k, 1, 'Both networks return');
  text(c, 'Test inputs    −1, +1', 102, 774, 39, ink);
  if (reference)
    [nets.a, nets.b].forEach((n, i) =>
      mono(c, 'outputs  [' + probeNet(n).join(', ') + ']', cols[i], 862, 37, ink),
    );
  if (answer && (swap === 0 || aligned))
    mono(
      c,
      'outputs  [' + probeNet(aligned ? nets.aligned : nets.naive).join(', ') + ']',
      cols[2],
      862,
      37,
      aligned ? chat : pink,
    );
  if (k.beat.beatIndex === 0)
    text(c, 'Compare the base revision, architecture, tensor names and shapes.', 103, 879, 41, ink);
}
export const uniform = average(VECTOR_A, VECTOR_B);
export function soup(c, k) {
  title(c, 'A midpoint at each address', 'One half of Code and one half of Math');
  const rowDone = [cue(k, 1, 'Halfway is two'), cue(k, 1, 'gives two again')];
  for (let i = 0; i < 2; i++) {
    const y = 377 + i * 267,
      x = (n) => 490 + (n - 1) * 543;
    text(c, 'Weight ' + (i + 1), 100, y, 51, ink, 'left', 'Serif');
    line(c, x(1), y, x(3), y, rule, 7);
    [1, 2, 3].forEach((n) => line(c, x(n), y - 18, x(n), y + 18, muted, 3));
    [
      [VECTOR_A[i], code, 'Code'],
      [VECTOR_B[i], math, 'Math'],
    ].forEach(([v, col, s]) => {
      dot(c, x(v), y, 29, col);
      mono(c, v, x(v), y, 30, white, 'center');
      text(c, s, x(v), y - 66, 36, col, 'center');
    });
    if (rowDone[i]) {
      dot(c, x(uniform[i]), y, 39, chat);
      mono(c, uniform[i], x(uniform[i]), y, 40, white, 'center');
    } else mono(c, '?', x(2), y + 62, 44, muted, 'center');
  }
  if (k.beat.beatIndex === 2)
    text(c, 'Merged weights  [2, 2]     →     evaluate on held-out inputs', 102, 885, 44, ink);
}
export function path(c, k) {
  const mid = cue(k, 1, 'Loss comes back'),
    one = cue(k, 2, 'Loss is point two zero'),
    three = cue(k, 3, 'The three-quarter'),
    low = cue(k, 4, 'second toy path'),
    lowMid = cue(k, 4, 'point zero nine');
  const pass = cue(k, 3, 'Yes'),
    barrier = cue(k, 1, 'point four two five');
  title(
    c,
    'What happens between the endpoints?',
    'Held-out loss by share of Math weights   ·   five possible sample positions',
  );
  const X = (a) => 186 + 1000 * a,
    Y = (l) => 789 - 714 * l;
  [0, 0.15, 0.3, 0.45, 0.6].forEach((l) => {
    line(c, 178, Y(l), 1211, Y(l), l === 0.3 ? gold : rule, l === 0.3 ? 4 : 1);
    mono(c, l.toFixed(2), 152, Y(l), 26, muted, 'right');
  });
  for (const s of samples) {
    line(c, X(s.alpha), 789, X(s.alpha), 807, ink);
    mono(c, s.alpha.toFixed(2), X(s.alpha), 848, 30, muted, 'center');
  }
  dash(c, X(0), Y(samples[0].loss), X(1), Y(samples[4].loss), muted, 3);
  const known = [true, one, mid, three, true],
    focus = low ? 2 : three ? 3 : k.beat.beatIndex >= 2 ? 1 : 2;
  samples.forEach((s, i) => {
    if (known[i]) dot(c, X(s.alpha), Y(s.loss), low ? 12 : 16, low ? muted : code);
    if (lowMid) dot(c, X(s.alpha), Y(s.low), 16, math);
  });
  if (!low) {
    for (const i of [0, 4]) {
      const s = samples[i];
      text(
        c,
        s.loss.toFixed(2) + '  ·  ' + s.score + '%',
        X(s.alpha) + (i ? -8 : 8),
        Y(s.loss) - 38,
        27,
        code,
        i ? 'right' : 'left',
      );
    }
  }
  if (barrier && !low) {
    dash(c, X(0.5), Y(samples[2].chord), X(0.5), Y(samples[2].loss), ink);
    text(c, '+0.425', X(0.5) + 21, Y(0.4), 34, code);
  }
  text(c, 'Screen', 1300, 308, 54, ink, 'left', 'Serif');
  text(c, 'Loss ≤ ' + pathScreen.maxLoss.toFixed(2), 1300, 385, 43, gold);
  text(c, 'Accuracy ≥ ' + pathScreen.minScore + '%', 1300, 447, 43, gold);
  const s = samples[focus],
    ready = low ? lowMid : known[focus];
  heading(c, low ? 'Second path · midpoint' : 'Mixture at ' + s.alpha * 100 + '%', 1300, 562);
  mono(c, 'Loss   ' + (ready ? (low ? s.low : s.loss).toFixed(2) : '?'), 1300, 637, 41, ink);
  mono(c, 'Acc.   ' + (ready && !low ? s.score + '%' : '?'), 1300, 706, 41, ink);
  if (!low && three) text(c, '4 of 5 samples pass', 1300, 811, 42, chat);
  else if (!low && (pass || (focus === 2 && mid && cue(k, 1, 'It fails'))))
    text(c, pass ? 'Quarter mixture passes' : 'Midpoint fails', 1300, 811, 42, pass ? chat : pink);
  if (low) text(c, 'First path', 248, 931, 34, muted);
  if (low) text(c, 'Second path', 589, 931, 34, math);
  if (!low) {
    text(c, 'Code endpoint', 180, 925, 30, code);
    text(c, 'Math endpoint', 1186, 925, 30, math, 'right');
  }
}
export function polarPoint(angle) {
  return [Math.cos(angle), Math.sin(angle)];
}
export const endAngle = Math.PI / 3;
export function interpolation(t, arc) {
  if (arc) return polarPoint(t * endAngle);
  const [x, y] = polarPoint(endAngle);
  return [mix(1, x, t), t * y];
}
export function sphere(c, k) {
  title(c, 'Two routes to a halfway direction', 'Two unit vectors   ·   60° between endpoints');
  const cx = 411,
    cy = 775,
    R = 523,
    pos = ([x, y]) => [cx + R * x, cy - R * y];
  c.beginPath();
  c.arc(cx, cy, R, -Math.PI / 2, 0);
  c.strokeStyle = rule;
  c.lineWidth = 4;
  c.stroke();
  for (const a of [0, endAngle]) {
    const [x, y] = pos(polarPoint(a));
    arrow(c, cx, cy, x, y, muted, 5);
  }
  const p = cue(k, 0, 'Stretch a straight chord', 1.0),
    q = cue(k, 1, 'Follow the arc instead', 1.25);
  const [ax, ay] = pos(interpolation(0, false)),
    [bx, by] = pos(interpolation(1, false));
  if (p) line(c, ax, ay, bx, by, code, 5);
  const chord = interpolation(0.5 * p, false),
    arc = interpolation(0.5 * q, true);
  for (const [v, t, col] of [
    [chord, p, code],
    [arc, q, math],
  ])
    if (t) {
      const [x, y] = pos(v);
      arrow(c, cx, cy, x, y, col, 6);
      dot(c, x, y, 14, col, white, 3);
    }
  if (q) {
    c.beginPath();
    c.arc(cx, cy, R, (-q * endAngle) / 2, 0);
    c.strokeStyle = math;
    c.lineWidth = 6;
    c.stroke();
    const [u, v] = pos(chord);
    dot(c, u, v, 11, code, white, 3);
  }
  dot(c, cx, cy, 13, ink);
  text(c, 'origin', cx - 26, cy + 57, 32, muted);
  heading(c, 'Distance from origin', 1108, 342);
  text(c, 'Linear chord', 1108, 467, 48, code, 'left', 'Serif');
  mono(c, p ? Math.hypot(...chord).toFixed(3) : '?', 1695, 469, 52, code, 'right');
  text(c, 'Spherical arc', 1108, 600, 48, math, 'left', 'Serif');
  mono(c, q ? Math.hypot(...arc).toFixed(3) : '?', 1695, 604, 52, math, 'right');
  if (k.beat.beatIndex === 2) {
    line(c, 1108, 718, 1715, 718, rule);
    text(c, 'Which passes the coding test?', 1108, 790, 41, ink);
  }
}
export const vectorBase = [0, 0],
  vectorEnds = [
    [1, 0],
    [0, 1],
  ],
  vectorScales = [0.8, 0.6];
export const scaledVectors = vectorEnds.map((end, i) =>
  end.map((v, j) => (v - vectorBase[j]) * vectorScales[i]),
);
export const vectorSum = vectorBase.map((v, j) => v + scaledVectors[0][j] + scaledVectors[1][j]);
export function vector(c, k) {
  title(
    c,
    'Build the displacement from the base',
    'Each axis measures one parameter in this toy checkpoint.',
  );
  const ox = 230,
    oy = 843,
    S = 542;
  grid(c, ox, oy - S, S, S, S / 10);
  arrow(c, ox, oy, ox + S + 80, oy, muted, 3);
  arrow(c, ox, oy, ox, oy - S - 60, muted, 3);
  text(c, 'w₁', ox + S + 92, oy, 37);
  text(c, 'w₂', ox + 28, oy - S - 44, 37);
  const a = cue(k, 0, 'Code moved'),
    b = cue(k, 0, 'Math moved');
  if (a) arrow(c, ox, oy, ox + S, oy, code, 9);
  if (b) arrow(c, ox, oy, ox, oy - S, math, 9);
  const scaleA = cue(k, 1, 'eight tenths'),
    scaleB = cue(k, 1, 'six tenths'),
    shift = cue(k, 2, 'Eight tenths across', 0.9);
  if (scaleA) {
    arrow(c, ox, oy - 7, ox + scaledVectors[0][0] * S, oy - 7, bright[0], 8);
    dot(c, ox + scaledVectors[0][0] * S, oy - 7, 13, code);
  }
  if (scaleB) {
    const x = ox + shift * scaledVectors[0][0] * S;
    arrow(c, x, oy, x, oy - scaledVectors[1][1] * S, math, 8);
    dot(c, x, oy - scaledVectors[1][1] * S, 13, math);
  }
  text(c, 'Base (0, 0)', ox, 918, 36);
  heading(c, 'Checkpoint − base', 1031, 333);
  mono(c, 'Code   (1, 0) − (0, 0)', 1031, 423, 41, code);
  mono(c, 'Math   (0, 1) − (0, 0)', 1031, 514, 41, math);
  if (scaleA) mono(c, '0.8 × (1, 0)', 1031, 642, 43, code);
  if (scaleB) mono(c, '0.6 × (0, 1)', 1031, 719, 43, math);
  if (shift === 1)
    text(c, 'Merged   (' + vectorSum.join(', ') + ')', 1031, 855, 56, chat, 'left', 'Serif');
}
