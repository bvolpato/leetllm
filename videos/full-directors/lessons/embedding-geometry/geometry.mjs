import { P, fmt, coord, mix, lerpVector, guideGlyph, vectorPlot } from './drawing.mjs';
import {
  METRICS,
  QUERY,
  PREFIX_DOCS,
  QUANTIZATION_FIXTURE,
} from '../../../films/embedding-geometry/fixtures.mjs';
import {
  dot,
  l2,
  cosine,
  robustUnit,
  quantize,
} from '../../../films/embedding-geometry/arithmetic.mjs';
import { prefixResults } from '../../../films/embedding-geometry/model.mjs';

export const docs = METRICS.map((r) => r.vector),
  colors = [P.green, P.pink],
  names = ['Rotation', 'Audit'];
const units = docs.map(robustUnit);
export function geometryState(ch, d) {
  const { cue } = d;
  let vectors = docs,
    angle = 0,
    unit = 203,
    varyLengths = false;
  if (ch === 4) {
    const factor = 1 + 3 * cue(2, 'Stretch green', 1.25) + 6 * cue(2, 'Carry green', 1.8);
    vectors = [docs[0].map((x) => x * factor), docs[1]];
    unit = 93;
  }
  if (ch === 5) {
    const p = cue(1, 'Watch the two tips', 2.2);
    vectors = [docs[0].map((x) => 10 * x), docs[1]].map((v, i) => lerpVector(v, units[i], p));
    unit = mix(93, 407, cue(2, 'Look closer', 1.1));
  }
  if (ch === 23) {
    angle = (cue(2, 'Turn the ruler', 2.8) * Math.PI) / 2;
    const restore = cue(2, 'Restore the original', 1.8);
    varyLengths = restore > 0;
    const long = restore * (1 - cue(4, 'Slide the guides', 1.8));
    vectors = units.map((v, i) => lerpVector(v, docs[i], long));
    unit = 202;
  }
  const q = [Math.cos(angle), Math.sin(angle)];
  return {
    vectors,
    q,
    unit,
    angle,
    varyLengths,
    metrics: vectors.map((v) => ({ dot: dot(q, v), cos: cosine(q, v), gap: l2(q, v) })),
  };
}
function metricStrip(d, x, y, caption, readings, prec = 3) {
  d.txt(caption, x, y, 21, P.muted);
  readings.forEach((r, i) =>
    d.txt(
      names[i] + '   ' + (r == null ? '…' : fmt(r, prec)),
      x,
      y + 47 + i * 47,
      29,
      colors[i],
      'Mono',
    ),
  );
}
export function geometry(ch, d) {
  const { b, cue, txt, head, fade, line, circle } = d;
  const s = geometryState(ch, d),
    { vectors, q, unit, angle, metrics } = s;
  const title = {
    1: 'How do I rotate an API key?',
    2: 'Read the reach along the query',
    3: b < 3 ? 'Compare the directions' : 'Measure from tip to tip',
    4: 'Stretch the rotation guide',
    5: 'Bring both tips to unit length',
    23: s.varyLengths ? 'Change the guide lengths' : 'Turn the query ruler',
  }[ch];
  let subtitle = '';
  if (ch === 1) subtitle = 'Two eligible guides · example coordinates';
  if (ch === 23)
    subtitle = s.varyLengths ? 'The query stays fixed at [0, 1]' : 'Both guides stay on the unit circle';
  head(title, subtitle);
  const ox = ch === 23 ? 190 : 112,
    oy = ch === 23 ? 590 : 548;
  const gp = vectorPlot(d, {
    origin: [ox, oy],
    unit,
    angle,
    reach: ch === 23 ? Math.min(2.25, 418 / unit) : Math.min(10.6, 1020 / unit),
    ticks: unit > 350 ? 0.05 : 0.1,
    ring: ch === 5 || ch === 23,
  });
  vectors.forEach((v, i) => {
    const col = colors[i],
      tip = gp.pt(v);
    gp.vector(v, col);
    if (ch === 1 && b === 1) {
      const sweep = cue(1, 'How do I rotate', 1.3 + i * 0.45);
      if (sweep > 0 && sweep < 1) circle(...gp.pt(v.map((x) => x * sweep)), 6, P.ink);
    }
    if (ch === 1) {
      const top = tip[1] + (i === 0 ? -51 : -73);
      guideGlyph(d, tip[0] + 12, top, col, i === 1);
      txt(names[i] + ' guide', tip[0] + 73, top + 35, 29, col, 'Serif');
    } else {
      const dy = i === 0 ? (ch === 5 || ch === 23 ? -5 : -19) : -14;
      const offset = ch === 3 && b >= 3 && i === 0 ? -43 : dy;
      txt(names[i], tip[0] + 12, tip[1] + offset, 24, col, 'Serif');
    }
  });
  const qt = gp.pt(q);
  txt(
    'query',
    ch === 23 ? ox - 19 : qt[0] - 7,
    ch === 23 ? oy + 35 : qt[1] + 41,
    22,
    P.query,
    'Sans',
    ch === 23 ? 'right' : 'center',
  );
  circle(ox, oy, 8, P.gold, P.shadow);
  if (ch === 1) {
    const segment = [cue(2, 'rotation guide does'), cue(2, 'From blue to pink')];
    vectors.forEach((v, i) =>
      fade(segment[i], () => {
        const rr = i === 0 ? 109 : 150;
        d.ctx.beginPath();
        d.ctx.arc(ox, oy, rr, -Math.atan2(v[1], v[0]), 0);
        d.ctx.strokeStyle = colors[i];
        d.ctx.lineWidth = 3;
        d.ctx.stroke();
      }),
    );
    if (b === 3) {
      txt('Rotation   [1, 0.2]', 75, 190, 26, P.green, 'Mono');
      txt('Audit      [4, 2]', 75, 236, 26, P.pink, 'Mono');
    }
    if (b > 1)
      metricStrip(
        d,
        857,
        365,
        'Angle from query · degrees',
        segment.map((p, i) =>
          p === 1 ? (Math.atan2(vectors[i][1], vectors[i][0]) * 180) / Math.PI : null,
        ),
        1,
      );
  }
  if (ch === 2) {
    const p = [cue(1, 'dashed line', 0.85), cue(2, 'follow audit', 0.85)];
    vectors.forEach((v, i) => {
      gp.project(v, colors[i], p[i]);
      fade(p[i], () => txt(fmt(v[0]), gp.pt(v)[0], 615, 33, colors[i], 'Mono', 'center'));
    });
    fade(cue(1, 'multiply matching'), () => {
      txt('q = [1, 0]', 75, 171, 26, P.query, 'Mono');
      txt('1 × 1 + 0 × 0.2', 74, 228, 25, P.green, 'Mono');
      fade(cue(2, 'follow audit'), () => txt('1 × 4 + 0 × 2', 74, 275, 25, P.pink, 'Mono'));
    });
    fade(cue(3, 'four to one'), () => txt('4 > 1', 979, 365, 54, P.gold, 'Mono'));
  }
  if (ch === 3) {
    if (b < 3) {
      metricStrip(
        d,
        824,
        370,
        'cos θ = dot / (|q| |d|)',
        metrics.map((m, i) =>
          [cue(1, 'nine eight one'), cue(2, 'eight nine four')][i] === 1 ? m.cos : null,
        ),
      );
    } else {
      vectors.forEach((v, i) =>
        fade(i === 0 ? cue(3, 'Rotation is just') : cue(3, 'To reach audit'), () => {
          line(...qt, ...gp.pt(v), colors[i], 4, [5, 6]);
        }),
      );
      metricStrip(
        d,
        816,
        370,
        'Straight-line gap',
        metrics.map((m, i) => ([cue(3, 'point two'), cue(4, 'six one')][i] === 1 ? m.gap : null)),
        2,
      );
    }
  }
  if (ch === 4) {
    vectors.forEach((v, i) => gp.project(v, colors[i]));
    txt('dot product', 112, 632, 22, P.muted);
    txt('Rotation   ' + fmt(metrics[0].dot, 2), 350, 632, 31, P.green, 'Mono');
    txt('Audit   4', 749, 632, 31, P.pink, 'Mono');
    txt('Scale   ×' + fmt(vectors[0][0]), 80, 167, 31, P.green, 'Mono');
    if (b === 3) txt('Rotation after stretching', 793, 182, 21, P.muted);
    if (b === 3) {
      txt('cos   ' + fmt(metrics[0].cos, 3), 792, 226, 29, P.green, 'Mono');
      txt('gap   ' + fmt(metrics[0].gap, 2), 792, 269, 29, P.green, 'Mono');
    }
  }
  if (ch === 5) {
    if (b >= 2) {
      vectors.forEach((v, i) => line(...qt, ...gp.pt(v), colors[i], 3, [4, 5]));
      txt('|q| = |d| = 1', 748, 209, 29, P.query, 'Mono');
      txt('gap² = 2 − 2(q · d)', 748, 268, 30, P.ink, 'Mono');
      if (b >= 3) {
        txt('Unit dot  /  squared gap', 749, 348, 21, P.muted);
        metrics.forEach((m, i) =>
          fade([cue(3, 'Green has'), cue(3, 'Pink has')][i], () =>
            txt(
              fmt(m.dot, 3) + '    ' + fmt(m.gap ** 2, 3),
              749,
              400 + i * 59,
              34,
              colors[i],
              'Mono',
            ),
          ),
        );
      }
    } else {
      txt('Length', 915, 147, 21, P.muted);
      vectors.forEach((v, i) =>
        txt(fmt(Math.hypot(...v), 3), 915, 193 + 49 * i, 31, colors[i], 'Mono'),
      );
    }
  }
  if (ch === 23) {
    vectors.forEach((v, i) => gp.project(v, colors[i]));
    if (b === 3 || b === 4)
      vectors.forEach((v, i) => line(...qt, ...gp.pt(v), colors[i], 3, [6, 6]));
    const near = b >= 3,
      v = metrics.map((m) => (near ? m.gap : m.dot));
    metricStrip(d, 865, 343, near ? 'Gap from query tip' : 'Projection on unit query', v);
    if (b === 4 && cue(4, 'Slide the guides', 1.8) === 1)
      metricStrip(
        d,
        865,
        509,
        'Unit dot = cosine',
        metrics.map((m) => m.dot),
      );
  }
}
export function normGate(d) {
  const { head, b, cue, txt, line, arrow } = d;
  if (b <= 3) {
    head('Can this row supply a direction?');
    const rows = ['[1e300, 1e300]', '[1e−300, 1e−300]', '[0, 0]', '[]  or  [∞, 1]'];
    txt('Encoder output', 66, 178, 24, P.muted);
    txt('Divide by max |x|', 505, 178, 24, P.muted);
    txt('Unit direction', 923, 178, 24, P.muted);
    rows.forEach((r, i) => {
      const y = 259 + i * 93;
      txt(r, 65, y, 31, i < 2 ? P.ink : P.pink, 'Mono');
      if (i >= 2) {
        d.fade(cue(1, 'Reject and log'), () => {
          line(455, y - 10, 493, y - 10, P.pink, 4);
          txt('reject + log', 520, y, 27, P.pink);
        });
      } else {
        d.fade(cue(2, 'Both rows become'), () => {
          arrow([370, y - 10], [456, y - 10], P.metal);
          txt('[1, 1]', 511, y, 31, P.gold, 'Mono');
        });
        d.fade(cue(3, 'seven zero seven'), () => {
          arrow([760, y - 10], [839, y - 10], P.metal);
          txt(coord(robustUnit([1, 1]), 3), 869, y, 28, P.green, 'Mono');
        });
      }
    });
  } else {
    head('Scale the query against fixed unit guides');
    const mag = 1 + cue(4, 'double the length', 1.35);
    d.arrow([112, 310], [112 + mag * 250, 310], P.query, 9);
    txt('q = ' + coord([mag, 0]), 110, 270, 31, P.query, 'Mono');
    metricStrip(
      d,
      827,
      243,
      'Dot products',
      units.map((v) => dot([mag, 0], v)),
    );
    txt('|d| = 1     q · d = |q| cos θ', 110, 492, 36, P.ink, 'Mono');
    if (b === 5) txt('Normalize q for a cosine threshold.', 110, 555, 28, P.gold);
  }
}
export function prefix(d) {
  const { head, txt, b, box, cue } = d;
  head('Cut after the second coordinate', 'Eligible guides in storage order');
  const cut = cue(3, 'first two coordinates', 0.9),
    width = cut === 1 ? 2 : 4;
  ['Audit', 'Rotation', 'Lifecycle'].forEach((name, i) => {
    const y = 215 + i * 99;
    txt(name, 68, y + 39, 29, i === 0 ? P.pink : i === 1 ? P.green : P.ink, 'Serif');
    PREFIX_DOCS[i].forEach((v, j) =>
      d.fade(j < 2 ? 1 : 1 - cut, () => {
        box(255 + 82 * j, y, 66, 58, v ? P.metal : P.shadow);
        txt(v, 288 + 82 * j, y + 40, 30, P.ink, 'Mono', 'center');
      }),
    );
  });
  const x = 255 + 2 * 82 - 9;
  d.line(x, 178, x, 493, P.gold, 3, [8, 6]);
  txt('prefix', x - 12, 531, 24, P.gold, 'Sans', 'right');
  if (b >= 2) {
    const result = prefixResults(width),
      reveal = width === 4 ? cut === 0 : cue(4, 'Audit takes it') === 1;
    txt('Query', 716, 198, 23, P.muted);
    txt('First guide', 943, 198, 23, P.muted);
    ['Rotation', 'Lifecycle'].forEach((key, i) => {
      txt(key, 716, 295 + i * 79, 29, P.ink, 'Serif');
      txt(
        reveal ? ['Audit', 'Rotation', 'Lifecycle'][result.winners[i]] : '?',
        947,
        295 + i * 79,
        31,
        P.gold,
        'Serif',
      );
    });
    if (reveal)
      txt('Evidence recall   ' + result.recall * 2 + ' / 2', 714, 501, 28, P.green, 'Mono');
  }
}
export const tips = QUANTIZATION_FIXTURE.candidates,
  grid = QUANTIZATION_FIXTURE.step;
export function quantGrid(d) {
  const { head, txt, cue, box, line, circle } = d;
  head('Which grid point will store these tips?', 'Grid step ' + fmt(grid) + '  ·  q = [1, 0]');
  const [cx, cy] = quantize(tips[0], grid);
  const pitch = 210;
  const X = (v) => 375 + ((v - cx) / grid) * pitch,
    Y = (v) => 390 - ((v - cy) / grid) * pitch;
  const show = cue(2, 'cell around');
  d.fade(show, () => box(X(cx - grid / 2), Y(cy + grid / 2), pitch, pitch, '#293c36', P.gold, 0));
  for (const offset of [-grid, 0, grid]) {
    const x = cx + offset, y = cy + offset;
    line(X(x), Y(cy + grid), X(x), Y(cy - grid), P.metal);
    line(X(cx - grid), Y(y), X(cx + grid), Y(y), P.metal);
    txt(fmt(x), X(x), Y(cy - grid) + 39, 22, P.muted, 'Mono', 'center');
    txt(fmt(y), X(cx - grid) - 22, Y(y) + 7, 22, P.muted, 'Mono', 'right');
    for (const dy of [-grid, 0, grid]) circle(X(x), Y(cy + dy), 4, P.muted);
  }
  const snap = cue(3, 'Move each tip', 1.3),
    p = tips.map((v) => lerpVector(v, quantize(v, grid), snap));
  tips.forEach((v, i) => {
    const z = p[i],
      col = colors[i];
    line(X(v[0]), Y(v[1]), X(z[0]), Y(z[1]), col, 2, [4, 6]);
    circle(X(v[0]), Y(v[1]), 6, P.dark, col);
    circle(X(z[0]), Y(z[1]), i === 0 ? 11 : 6, col);
    txt(['C', 'D'][i], X(v[0]) - 19, Y(v[1]) + 7, 22, col, 'Mono', 'right');
    txt(['C', 'D'][i] + '   ' + coord(z, 3), 754, 269 + i * 145, 34, col, 'Mono');
    txt('cos   ' + cosine(QUERY, z).toFixed(4), 754, 320 + i * 145, 30, P.ink, 'Mono');
  });
  if (snap === 1) txt('One stored point', 753, 570, 36, P.gold, 'Serif');
}
