import {
  C,
  arrow,
  box,
  clamp,
  cue,
  dot,
  f,
  graph,
  head,
  line,
  mix,
  mono,
  txt,
} from './drawing.mjs';

export function clip(g, cap) {
  const scale = Math.min(1, cap / Math.hypot(...g));
  return {
    norm: g.map((v) => v * scale),
    coordinate: g.map((v) => Math.max(-cap, Math.min(cap, v))),
  };
}
export const initialScale = (fanIn, fanOut) => ({ xavier: 2 / (fanIn + fanOut), he: 2 / fanIn });
export function reluSample(gain) {
  const sample = [-4, -3, -2, -1, 1, 2, 3, 4].map((v) => v * Math.sqrt(gain / 7.5));
  const relu = sample.map((v) => Math.max(0, v));
  const meanSquare = (row) => row.reduce((sum, v) => sum + v * v, 0) / row.length;
  return { sample, relu, inputMoment: meanSquare(sample), moment: meanSquare(relu) };
}
function deep(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    head(
      c,
      'One gradient crosses five layers',
      'Start at 1 and multiply by the local factor at each crossing',
    );
    const progress = [cue(k, 0, 'Each layer halves', 2.1), cue(k, 0, 'Now let every layer', 2.1)];
    [0.5, 1.5].forEach((factor, r) => {
      const y = 233 + 139 * r;
      mono(c, '× ' + f(factor), 54, y, 22, r ? C.hot : C.blue);
      // The band is proportional to signal magnitude in each row.
      const amplitude = 6,
        x0 = 162;
      box(c, x0 - 15, y - amplitude, 15, 2 * amplitude, r ? '#d9997e' : '#70a8b9');
      mono(c, '1', x0 - 8, y + 41, 16, C.muted, 'center');
      for (let i = 0; i < 5; i++) {
        const start = x0 + i * 139,
          end = start + 139;
        const t = clamp(progress[r] * 5 - i);
        line(c, end, y - 49, end, y + 49, C.rule);
        if (!t) continue;
        const v = factor ** i,
          w = factor ** (i + 1),
          to = mix(start, end, t),
          width = mix(v, w, t) * amplitude;
        c.fillStyle = r ? '#d9997e' : '#70a8b9';
        c.beginPath();
        c.moveTo(start, y - v * amplitude);
        c.lineTo(to, y - width);
        c.lineTo(to, y + width);
        c.lineTo(start, y + v * amplitude);
        c.closePath();
        c.fill();
        if (t === 1) mono(c, f(w, 3), end, y + 62, 15, r ? C.hot : C.blue, 'center');
      }
    });
  } else {
    head(
      c,
      'Shorten a finite gradient',
      'One vector, two coordinates    /    maximum Euclidean length 5',
    );
    const origin = [167, 409],
      unit = 27;
    const point = (v) => [origin[0] + unit * v[0], origin[1] - unit * v[1]];
    const g = [6, 8],
      cap = 5,
      out = clip(g, cap);
    for (const n of [0, 2, 4, 6, 8]) {
      line(c, ...point([n, 0]), ...point([n, 9]), C.rule, 1);
      line(c, ...point([0, n]), ...point([9, n]), C.rule, 1);
    }
    line(c, ...origin, ...point([9, 0]), C.muted, 2);
    line(c, ...origin, ...point([0, 9]), C.muted, 2);
    for (const n of [0, 5, 8]) {
      mono(c, n, point([n, 0])[0], 431, 14, C.muted, 'center');
      if (n) mono(c, n, 151, point([0, n])[1], 14, C.muted, 'right');
    }
    c.beginPath();
    c.arc(...origin, cap * unit, -Math.PI / 2, 0);
    c.strokeStyle = C.green;
    c.lineWidth = 2;
    c.stroke();
    arrow(c, ...origin, ...point(g), C.muted, 3);
    const norm = cue(k, 2, 'Bring it halfway', 1.4),
      coord = cue(k, 2, 'Now try capping', 1.25);
    if (norm) {
      const v = g.map((a, i) => mix(a, out.norm[i], norm));
      arrow(c, ...origin, ...point(v), C.blue, 4);
      dot(c, ...point(v), 5, C.blue);
    }
    if (coord) {
      const v = g.map((a, i) => mix(a, out.coordinate[i], coord));
      arrow(c, ...origin, ...point(v), C.hot, 3);
      dot(c, ...point(v), 5, C.hot);
    }
    mono(c, 'g = (6, 8)     length 10', 495, 194, 22, C.muted);
    if (norm === 1) mono(c, 'norm cap     (3, 4)', 495, 275, 23, C.blue);
    if (coord === 1) mono(c, 'value cap    (5, 5)', 495, 338, 23, C.hot);
    if (b === 3) txt(c, 'Accumulate → unscale → clip → step', 495, 423, 21, C.ink);
  }
}
function init(c, k) {
  const b = k.beat.beatIndex;
  if (b <= 1) {
    head(
      c,
      'Build one preactivation',
      '256 independent, centered terms    /    each input has variance 1',
    );
    const grow = cue(k, 0, 'Each input brings', 2.3),
      scale = cue(k, 1, 'Scaling the weight variance', 1.4);
    const count = Math.round(256 * grow);
    for (let i = 0; i < 256; i++) {
      const x = 84 + (i % 16) * 16,
        y = 147 + Math.floor(i / 16) * 15;
      dot(c, x, y, i < count ? mix(5.5, 2.4, scale) : 2, i < count ? C.blue : C.rule);
    }
    arrow(c, 363, 259, 484, 259, C.muted);
    txt(c, 'Variance of the sum', 526, 191, 26, C.ink, 'left', 'Serif');
    mono(
      c,
      f(count) + ' × ' + (scale === 1 ? '1/256' : f(mix(1, 1 / 256, scale), 3)),
      526,
      261,
      26,
      C.blue,
    );
    mono(c, '= ' + f(count * mix(1, 1 / 256, scale), 2), 526, 329, 34, C.ink);
    if (scale === 1) txt(c, 'More inputs, smaller initial weights.', 526, 406, 18, C.muted);
  } else if (b <= 4) {
    head(c, 'Balance the incoming and outgoing widths', 'Gain-one Xavier initialization');
    const groups = [
      { x: 170, n: 8, name: '128 inputs' },
      { x: 431, n: 4, name: '64 outputs' },
    ];
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 4; j++) line(c, 170, 169 + i * 27, 431, 190 + j * 47, C.rule, 1.2);
    groups.forEach(({ x, n, name }, col) => {
      for (let i = 0; i < n; i++)
        dot(c, x, col ? 190 + i * 47 : 169 + i * 27, 8, col ? C.green : C.blue);
      txt(c, name, x, 408, 20, col ? C.green : C.blue, 'center');
    });
    mono(c, 'Var(w) = 2 / (in + out)', 540, 179, 20);
    if (cue(k, 3, 'Its normal standard') > 0) {
      mono(c, '= 1/' + f(1 / initialScale(128, 64).xavier), 540, 237, 32, C.blue);
      mono(c, 'normal σ = √(1/96)', 540, 307, 19, C.muted);
    }
    if (cue(k, 3, 'For a symmetric uniform') > 0) {
      const a = Math.sqrt(6 / 192);
      line(c, 551, 383, 855, 383, C.muted, 2);
      box(c, 613, 348, 179, 34, '#b6d0c0', C.green);
      mono(c, '−' + f(a, 3), 613, 409, 15, C.muted, 'center');
      mono(c, '+' + f(a, 3), 792, 409, 15, C.muted, 'center');
      txt(c, 'uniform support', 702, 446, 17, C.muted, 'center');
    }
  } else {
    head(c, 'What passes through ReLU?', 'Eight symmetric signal samples on a fixed scale');
    const gate = cue(k, 5, 'Follow the negative inputs', 1.1),
      wide = cue(k, 5, 'Watch the same inputs widen', 1.5);
    const values = reluSample(mix(1, 2, wide));
    const X = (v) => 289 + 93 * v;
    for (let r = 0; r < 2; r++) {
      const y = 216 + 140 * r;
      line(c, X(-2.4), y, X(2.4), y, C.muted, 2);
      line(c, X(0), y - 45, X(0), y + 15, C.rule);
      const label = r === 0 ? 'Input z' : gate === 1 ? 'Output h = max(0, z)' : 'Tracing each input to max(0, z)';
      txt(c, label, 70, y - 62, 19, C.muted);
      const stack = new Map();
      values.sample.forEach((v, i) => {
        const val = r ? mix(v, values.relu[i], gate) : v;
        const key = val.toFixed(3),
          n = stack.get(key) ?? 0;
        stack.set(key, n + 1);
        dot(c, X(val), y - 9 - n * 15, 6.5, v < 0 ? C.hot : C.blue);
      });
    }
    txt(c, 'Average of the squares', 552, 151, 24, C.ink, 'left', 'Serif');
    const widening = wide > 0 && wide < 1;
    mono(c, widening ? 'Widening input…' : 'E[z²] = ' + f(values.inputMoment), 552, 210, 24, C.blue);
    if (gate === 1 && !widening) {
      const readMoment = wide === 0
        ? cue(k, 5, 'He initialization doubles', 0) === 1
        : cue(k, 5, 'That is the second moment', 0) === 1;
      mono(c, 'E[h²] = ' + (readMoment ? f(values.moment) : '?'), 552, 290, 27, C.green);
    }
    if (wide === 1) mono(c, 'He variance = 2 / fan-in', 552, 344, 20, C.ink);
    if (b === 6) {
      txt(c, 'Var(h) = E[h²] − E[h]²', 552, 395, 20, C.muted);
      if (cue(k, 6, 'one over sixty-four', 1) === 1)
        mono(c, 'fan-in 128 → 1/' + f(1 / initialScale(128, 64).he), 552, 444, 20, C.green);
    }
  }
}
export const signalScenes = [deep, init];
