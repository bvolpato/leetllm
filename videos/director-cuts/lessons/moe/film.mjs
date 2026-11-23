import assert from 'node:assert/strict';
import { CAPACITY_ROUTES } from '../../../films/moe/fixtures.mjs';
import { queueExample } from '../../../films/moe/construction.mjs';

// The selected bits are holes in a backlit dispatch mask. A smoked strip holds out
// light where the fixed-capacity implementation skips an expert assignment.
const token = 4;
const gates = [0.6, 0.4];
const fixed = queueExample(CAPACITY_ROUTES, token, gates);
const full = queueExample(CAPACITY_ROUTES, token, gates, 1, true);
const [hot, spare] = full.terms;
const rowY = (t) => 278 + 72 * t;
const colX = (e) => 397 + 166 * e;
const slotAt = (e, t) => fixed.groups[e].indexOf(t) + 1;
const slotLimitY = (rowY(fixed.groups[hot.expert][fixed.slots - 1]) + rowY(token)) / 2;
const shutterBottom = 845;
const title = 'Mixture of experts: The fifth row';

const beats = [
  {
    id: 'two-apertures',
    say: 'Follow the two lights on the orange row. What comes back to token four when one of them goes dark?',
    hold: 0.9,
  },
  {
    id: 'dispatch-mask',
    say: 'Each row of this mask is one token in a mixture of experts layer. Follow the orange row across. The router picked two feed-forward networks for the same hidden state, experts one and three.',
    hold: 0.8,
  },
  {
    id: 'fifth-in-line',
    say: "Eight tokens chose two experts apiece. That's sixteen assignments. This batch reserves four input slots for each of its four experts. Count down the first column. All four slots are taken by the time our token arrives.",
    hold: 1.0,
  },
  {
    id: 'second-in-line',
    say: "Look across at expert three. Token four is only the second arrival there. This copy fits. In this layer, we skip the overflowing assignment and keep the surviving expert's gate weight.",
    hold: 0.7,
  },
  {
    id: 'one-return',
    say: "Expert three returns the vector zero, three. Take four tenths of that. See how the tip rises? One point two units straight up. That's the expert update that gets added back to token four.",
    hold: 1.1,
  },
  {
    id: 'let-it-run',
    say: "Keep the router's choices. This time, let each expert run every row it receives. Expert one can process all eight. For token four it returns two, zero, with a gate of six tenths. Where will that move the tip?",
    hold: 1.35,
  },
  {
    id: 'the-restored-step',
    say: 'One point two to the right. The contribution from expert three stayed exactly the same. Running that fifth row at expert one restored the horizontal part of the update.',
    hold: 3.0,
  },
];

const clamp = (x) => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const fmt = (n) => String(Number(n.toFixed(2)));
const pair = (v) => '[' + v.map(fmt).join(', ') + ']';
const ink = '#302639';
const orangeInk = '#963c12';

function type(c, str, x, y, size, color, family = 'Sans', align = 'left', weight = 500) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(str, x, y);
}

function line(c, x, y, u, v, color, width = 2) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.stroke();
}

function rounded(c, x, y, w, h, r) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

function gradient(c, x, y, u, v, stops) {
  const g = c.createLinearGradient(x, y, u, v);
  for (const [position, color] of stops) g.addColorStop(position, color);
  return g;
}

function maskEdge(c, dx = 0, dy = 0) {
  const vertices = [
    [122, 151],
    [150, 123],
    [996, 123],
    [1012, 139],
    [1012, 865],
    [990, 887],
    [122, 887],
    [122, 738],
    [138, 726],
    [138, 698],
    [122, 687],
  ];
  c.beginPath();
  vertices.forEach(([x, y], i) => (i ? c.lineTo(x + dx, y + dy) : c.moveTo(x + dx, y + dy)));
  c.closePath();
}

function background(c) {
  c.fillStyle = gradient(c, 0, 0, 1870, 1080, [
    [0, '#ced0de'],
    [0.34, '#eeebf1'],
    [0.68, '#faf4e8'],
    [1, '#d9d4df'],
  ]);
  c.fillRect(0, 0, 1920, 1080);
}

function plate(c) {
  c.save();
  c.shadowColor = 'rgba(50,30,62,.38)';
  c.shadowBlur = 27;
  c.shadowOffsetX = 7;
  c.shadowOffsetY = 16;
  maskEdge(c, 0, 4);
  c.fillStyle = '#514459';
  c.fill();
  c.restore();

  c.save();
  maskEdge(c);
  c.clip();
  c.fillStyle = gradient(c, 240, 130, 936, 900, [
    [0, '#433547'],
    [0.25, '#3c2d40'],
    [0.49, '#514055'],
    [0.74, '#392c40'],
    [1, '#594a5b'],
  ]);
  c.fillRect(120, 120, 900, 776);
  // A grazing reflection gives the two sides of the cut mask different finishes.
  c.fillStyle = gradient(c, 160, 200, 958, 570, [
    [0, '#b7a9bd13'],
    [0.38, '#e9d9ef04'],
    [0.6, '#251a3504'],
    [0.74, '#d7c1d422'],
    [0.87, '#f8e4dd09'],
    [1, '#34253a00'],
  ]);
  c.fillRect(120, 120, 900, 776);
  for (let i = 0; i < 97; i++) {
    const x = 110 + ((i * 317) % 950);
    const y = 130 + ((i * 131) % 777);
    line(c, x, y, x + 21 + (i % 41), y - 1, '#f2dfeb0b', 1);
  }
  const y = rowY(token);
  c.fillStyle = gradient(c, 128, y, 1008, y, [
    [0, '#ce653e'],
    [0.15, '#b24f2a'],
    [0.72, '#a54b2e'],
    [1, '#ac5d3d'],
  ]);
  c.fillRect(120, y - 31, 897, 62);
  line(c, 120, y - 31, 1012, y - 31, '#f297618f', 2);
  line(c, 120, y + 31, 1012, y + 31, '#23142480', 2);
  c.restore();

  maskEdge(c);
  c.lineWidth = 2;
  c.strokeStyle = '#8b7d90';
  c.stroke();
  type(c, 'Dispatch mask', 175, 166, 35, '#fff4e9', 'Sans', 'left', 600);
  type(c, 'Token', 175, 224, 31, '#e0d0da');
  fixed.groups.forEach((_, e) =>
    type(c, 'E' + (e + 1), colX(e), 222, 40, '#f2e5e1', 'Mono', 'center', 600),
  );
  line(c, 175, 247, 955, 247, '#b8a7b34a');
  fixed.groups[hot.expert].forEach((t) => {
    type(
      c,
      't' + t,
      180,
      rowY(t),
      38,
      t === token ? '#fff2d7' : '#c9bccb',
      'Mono',
      'left',
      t === token ? 700 : 500,
    );
  });
}

function aperture(c, x, y, focused) {
  rounded(c, x - 50, y - 23, 100, 46, 16);
  c.fillStyle = '#a99ba6';
  c.fill();
  rounded(c, x - 49, y - 24, 98, 45, 15);
  c.fillStyle = '#201826';
  c.fill();
  c.save();
  c.shadowBlur = focused ? 12 : 4;
  c.shadowColor = focused ? '#ffa340' : '#e6d7b8';
  rounded(c, x - 44, y - 17, 88, 34, 11);
  c.fillStyle = gradient(
    c,
    x,
    y - 17,
    x + 10,
    y + 17,
    focused
      ? [
          [0, '#ffb95b'],
          [0.35, '#ffe1a1'],
          [1, '#fff3d5'],
        ]
      : [
          [0, '#d2c1ab'],
          [0.45, '#f3e3cd'],
          [1, '#eee6db'],
        ],
  );
  c.fill();
  c.restore();
}

function drawHoles(c) {
  for (let t = 0; t < CAPACITY_ROUTES.length; t++) {
    for (let e = 0; e < fixed.groups.length; e++) {
      const x = colX(e),
        y = rowY(t);
      if (slotAt(e, t)) aperture(c, x, y, t === token);
      else line(c, x - 9, y, x + 9, y, t === token ? '#e7a687' : '#aa97ad70', 2);
    }
  }
}

function drawShutter(c, closed) {
  if (closed <= 0) return;
  const x = colX(hot.expert) - 62;
  const top = mix(shutterBottom, slotLimitY, closed);
  const h = shutterBottom - top;
  c.save();
  c.beginPath();
  c.rect(x, top, 124, h);
  c.clip();
  c.fillStyle = gradient(c, x, 0, x + 124, 0, [
    [0, '#2e2337fb'],
    [0.06, '#514254fb'],
    [0.15, '#3b3043fb'],
    [0.74, '#392f43fa'],
    [0.95, '#554857fc'],
    [1, '#85768b'],
  ]);
  c.fillRect(x, top, 124, h);
  for (let y = top - 120; y < shutterBottom; y += 11) {
    line(c, x, y, x + 124, y + 58, '#ece0f015', 1.5);
  }
  // The outline remains legible through the holdout. It records a selected
  // assignment even after the light that denotes execution is blocked.
  for (const t of fixed.groups[hot.expert].slice(fixed.slots)) {
    rounded(c, x + 18, rowY(t) - 17, 88, 34, 11);
    c.strokeStyle = t === token ? '#df9a72' : '#8b7a90';
    c.lineWidth = t === token ? 3 : 2;
    c.stroke();
  }
  line(c, x, top + 2, x + 124, top + 2, '#f0d5b5', 4);
  c.restore();
}

function slotNumbers(c, expert, count, limit, shutter) {
  const tokens = fixed.groups[expert].slice(0, limit);
  tokens.forEach((t, i) => {
    c.save();
    c.globalAlpha = clamp(count - i);
    const blocked = expert === hot.expert && rowY(t) >= mix(shutterBottom, slotLimitY, shutter);
    type(
      c,
      String(slotAt(expert, t)),
      colX(expert),
      rowY(t),
      30,
      blocked ? '#ffe2cb' : '#422f37',
      'Mono',
      'center',
      700,
    );
    c.restore();
  });
}

const origin = [1216, 808];
const unit = 290;
const plotX = (x) => origin[0] + x * unit;
const plotY = (y) => origin[1] - y * unit;

function arrow(c, x0, y0, x1, y1, color, p) {
  if (p <= 0) return;
  const x = mix(x0, x1, p),
    y = mix(y0, y1, p);
  const angle = Math.atan2(y - y0, x - x0);
  const head = Math.min(30, Math.hypot(x - x0, y - y0) / 2);
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  line(c, -Math.hypot(x - x0, y - y0), 0, -head + 2, 0, color, 11);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-head, -head * 0.45);
  c.lineTo(-head, head * 0.45);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.restore();
}

function graph(c, s) {
  c.save();
  c.globalAlpha = s.plot;
  const [x0, y0] = origin;
  const [ax, ay] = full.output.map((v, i) => (i ? plotY(v) : plotX(v)));
  const by = plotY(fixed.output[1]);
  type(c, 'Expert update', 1130, 185, 63, ink, 'Serif');
  type(c, 't4', 1730, 185, 48, orangeInk, 'Mono', 'right', 600);
  line(c, 1130, 228, 1752, 228, '#a597a3', 2);
  for (const v of [0.4, 0.8, 1.2, 1.6]) {
    line(c, plotX(v), plotY(1.65), plotX(v), y0, '#5a496516', 2);
    line(c, x0, plotY(v), plotX(1.65), plotY(v), '#5a496516', 2);
  }
  line(c, x0 - 18, y0, plotX(1.7), y0, '#796d7b', 3);
  line(c, x0, y0 + 18, x0, plotY(1.7), '#796d7b', 3);
  type(c, 'x', plotX(1.78), y0, 36, ink, 'Mono');
  type(c, 'y', x0 + 17, plotY(1.62), 32, ink, 'Mono');
  type(c, '0', x0 - 16, y0 + 23, 29, ink, 'Mono', 'right');
  type(c, '1.2', ax, y0 + 35, 27, '#685967', 'Mono', 'center');
  type(c, '1.2', x0 - 16, ay, 27, '#685967', 'Mono', 'right');

  if (s.expertValue > 0) {
    c.save();
    c.globalAlpha *= s.expertValue;
    const term = s.hotResult ? hot : spare;
    const annotation =
      s.horizontal === 1
        ? pair(fixed.output) + ' + ' + pair(hot.vector.map((v) => v * hot.gate))
        : 'E' + (term.expert + 1) + '   ' + fmt(term.gate) + ' × ' + pair(term.vector);
    type(
      c,
      annotation,
      1132,
      276,
      s.horizontal === 1 ? 41 : 47,
      s.hotResult ? ink : orangeInk,
      'Mono',
    );
    c.restore();
  }
  const up = s.vertical;
  const right = s.horizontal;
  arrow(c, x0, y0, x0, by, orangeInk, up);
  if (up === 1) {
    type(c, 'E3', x0 + 27, (by + y0) / 2, 33, orangeInk, 'Mono');
    c.beginPath();
    c.arc(x0, by, 8, 0, 2 * Math.PI);
    c.fillStyle = '#fff3dc';
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = orangeInk;
    c.stroke();
  }
  arrow(c, x0, by, ax, ay, ink, right);
  if (right > 0) {
    line(c, x0, y0, mix(x0, ax, right), by, '#766078', 3);
    if (right === 1) {
      type(c, 'E1', (x0 + ax) / 2, by - 32, 33, ink, 'Mono', 'center');
      c.beginPath();
      c.arc(ax, ay, 7, 0, 2 * Math.PI);
      c.fillStyle = ink;
      c.fill();
    }
  }
  if (up === 1 && right === 0) type(c, pair(fixed.output), x0 + 24, by - 33, 43, orangeInk, 'Mono');
  if (right === 1) type(c, pair(full.output), ax + 8, ay - 46, 43, ink, 'Mono', 'left', 600);
  c.restore();
}

function scene(clock) {
  const { index, elapsed } = clock;
  const cue = (beat, phrase, span) =>
    index < beat ? 0 : index > beat ? 1 : ease(clock.reveal(phrase, span));
  const openView = cue(1, 'Each row', 1.8);
  const sideView = cue(3, 'This copy fits', 1.65);
  const reopening = cue(5, 'This time', 1.6);
  const close = ease((elapsed - 0.6) / 1.1);
  const count = cue(2, 'Count down', 1.6);
  const spareCount = cue(3, 'Look across', 0.8);
  const nextValue = cue(5, 'For token four', 0.7);
  // Let the viewer predict the second coordinate during the question, then play
  // the step in the pause that follows, before it is named in the final beat.
  const horizontal = index < 5 ? 0 : index > 5 ? 1 : ease((elapsed - clock.speechDuration) / 0.96);
  return {
    zoom: mix(mix(1.73, 1.22, openView), 1, sideView),
    panX: mix(mix(-18, 270, openView), 0, sideView),
    panY: mix(mix(-420, -89, openView), 0, sideView),
    closed: (index === 0 ? close : 1) * (1 - reopening),
    count,
    spareCount,
    reopening,
    scan: cue(1, 'Follow the orange row across', 2.3),
    label: cue(2, "That's sixteen assignments", 0.6),
    limitLabel: cue(2, 'four input slots', 0.5),
    plot: sideView,
    hotResult: nextValue > 0,
    expertValue: index < 5 ? cue(4, 'Expert three returns', 0.5) : nextValue || 1 - reopening,
    vertical: cue(4, 'Take four tenths', 1.1),
    horizontal,
  };
}

function draw(c, clock) {
  background(c);
  const s = scene(clock);
  c.save();
  c.translate(s.panX, s.panY);
  c.scale(s.zoom, s.zoom);
  plate(c);
  drawHoles(c);
  drawShutter(c, s.closed);
  if (s.scan > 0 && s.scan < 1) {
    const head = mix(170, 995, s.scan),
      y = rowY(token);
    c.save();
    c.globalAlpha = Math.sin(Math.PI * s.scan) * 0.75;
    c.fillStyle = gradient(c, head - 145, 0, head, 0, [
      [0, '#ffd7a500'],
      [1, '#ffdaab'],
    ]);
    c.fillRect(head - 145, y + 23, 145, 3);
    c.restore();
  }
  slotNumbers(c, hot.expert, 5 * s.count, 5, s.closed);
  slotNumbers(c, spare.expert, 2 * s.spareCount, 2, s.closed);

  if (s.label > 0) {
    c.save();
    c.globalAlpha = s.label;
    type(
      c,
      CAPACITY_ROUTES.length + ' × 2 = ' + fixed.assignments + ' routes',
      177,
      849,
      30,
      '#eadde5',
      'Mono',
    );
    c.globalAlpha *= s.limitLabel * (s.reopening === 1 ? 1 : 1 - s.reopening);
    const limit = s.reopening >= 1 ? 'All rows run' : fixed.slots + ' slots per expert';
    type(c, limit, 954, 851, 30, '#eadde5', 'Sans', 'right');
    c.restore();
  }
  if (s.plot > 0) graph(c, s);
  c.restore();
}

function check() {
  assert.equal(fixed.assignments, 16);
  assert.equal(fixed.slots, 4);
  assert.deepEqual(
    fixed.groups.map((rows) => rows.length),
    [8, 3, 3, 2],
  );
  assert.deepEqual(CAPACITY_ROUTES[token], [0, 2]);
  assert.deepEqual(
    fixed.terms.map((t) => [t.slot, t.runs]),
    [
      [5, false],
      [2, true],
    ],
  );
  assert.equal(fixed.totalOverflow, 4);
  assert.deepEqual(
    full.terms.map((t) => t.runs),
    [true, true],
  );
  assert.deepEqual(
    fixed.terms.map((t) => t.gate),
    full.terms.map((t) => t.gate),
  );
  const coords = (v) => v.map((n) => Number(n.toFixed(6)));
  assert.deepEqual(coords(fixed.output), [0, 1.2]);
  assert.deepEqual(coords(full.output), [1.2, 1.2]);
  assert.deepEqual(coords(full.output.map((v, i) => v - fixed.output[i])), [1.2, 0]);
  for (const [t, row] of CAPACITY_ROUTES.entries()) {
    assert.equal(row.length, 2);
    assert.equal(new Set(row).size, 2);
    for (const e of row) {
      const slot = slotAt(e, t);
      assert.ok(slot > 0);
      assert.equal(slot > fixed.slots, e === hot.expert && rowY(t) > slotLimitY);
    }
  }
  return true;
}

export default { title, beats, draw, check };
