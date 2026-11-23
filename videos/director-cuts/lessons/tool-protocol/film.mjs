import assert from 'node:assert/strict';
import { clockTime } from '../../../films/tool-protocol/fixtures.mjs';
import { shiftReads, validateStatusReply } from '../../../films/tool-protocol/model.mjs';

const [first, second] = shiftReads;
const beats = [
  {
    id: 'the-delivery',
    say: "A clean canary reading just came back from deployments. There's a space for it in the incident report. Would you file it under version eighteen?",
    hold: 1.4,
  },
  {
    id: 'the-exchange',
    say: 'Turn it over. The host found a status tool through its Model Context Protocol client. The model proposed reading version eighteen. The host approved the call, and its client sent request seventy-one. Which number came back?',
    hold: 0.8,
  },
  {
    id: 'the-band',
    say: "Seventy-one. That pairs the reply with the call. The tool finished successfully, and the fields fit its output schema. Now look at the bird's leg. The band shows the release ID from the result. Which release did deployments observe?",
    hold: 1.9,
  },
  {
    id: 'the-empty-page',
    say: "Seventeen. If we filed this here, the report would say eighteen was healthy on the strength of seventeen's reading. The host keeps the reply in the trace.",
    hold: 1.1,
  },
  {
    id: 'a-fresh-read',
    say: 'The host authorizes another read of version eighteen. A fresh reply comes back from deployments. Seventy-two matches the new request. Check the band again.',
    hold: 1.6,
  },
  {
    id: 'into-the-report',
    say: 'Eighteen. Now the host has a reading it can give the model. Deployments saw a clean canary on version eighteen at two twelve.',
    hold: 3.0,
  },
];

const W = 740,
  H = 570;
const navy = '#203247',
  paper = '#f8f2de';
const landed = { x: 1037, y: 199, angle: 0.038, scale: 1.08 };
const filed = { x: 116, y: 322, angle: 0, scale: 1.01 };
const kept = { x: 1090, y: 660, angle: -0.075, scale: 0.98 };
const incoming = { x: 1182, y: -75, angle: 0.16, scale: 1.16 };
const clamp = (n) => Math.max(0, Math.min(1, n));
function ease(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, t) => a + (b - a) * t;
function poseBetween(a, b, t) {
  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    angle: mix(a.angle, b.angle, t),
    scale: mix(a.scale, b.scale, t),
  };
}

function check() {
  assert.deepEqual(
    shiftReads.map((r) => r.requested),
    ['reranker-v18', 'reranker-v18'],
  );
  assert.deepEqual(
    shiftReads.map((r) => r.id),
    [71, 72],
  );
  assert.deepEqual(
    shiftReads.map((r) => r.payload.release_id),
    ['reranker-v17', 'reranker-v18'],
  );
  for (const r of shiftReads) {
    assert.equal(
      r.checks.idMatches && r.checks.complete && r.checks.toolSucceeded && r.checks.schemaValid,
      true,
    );
    assert.equal(r.payload.status, 'canary_clean');
    assert.equal(r.source, 'deployments');
    assert.equal(clockTime(r.observedAt), '02:12');
  }
  assert.deepEqual(
    shiftReads.map((r) => r.checks.identityMatches),
    [false, true],
  );
  assert.deepEqual(
    shiftReads.filter((r) => r.accepted).map((r) => r.id),
    [72],
  );
  const reply = {
    jsonrpc: '2.0',
    id: second.id,
    result: { content: [], structuredContent: second.payload },
  };
  assert.equal(validateStatusReply(reply, first.id, first.requested).admitted, false);
}

function path(c, points, fill, stroke, width = 1) {
  c.beginPath();
  for (const [op, ...args] of points) c[op](...args);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
const M = (x, y) => ['moveTo', x, y];
const L = (x, y) => ['lineTo', x, y];
const Q = (...args) => ['quadraticCurveTo', ...args];
const B = (...args) => ['bezierCurveTo', ...args];
const Z = ['closePath'];
function ellipse(c, x, y, rx, ry, fill, angle = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, 2 * Math.PI);
  c.fillStyle = fill;
  c.fill();
}
function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function text(
  c,
  s,
  x,
  y,
  size,
  { font = 'Sans', weight = 400, color = navy, align = 'left', italic = false } = {},
) {
  c.font = (italic ? 'italic ' : '') + weight + ' ' + size + 'px "Lesson ' + font + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(s, x, y);
}
function wash(c, x0, y0, x1, y1, stops) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([p, color]) => g.addColorStop(p, color));
  return g;
}

// Fixed flecks give the cut paper and the ink the same texture on every frame.
function flecks(seed, count) {
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  return Array.from({ length: count }, () => [random(), random(), random()]);
}
const fibers = flecks(45, 1050),
  featherMarks = flecks(31, 108);

function table(c) {
  rect(
    c,
    -400,
    -300,
    2800,
    1800,
    wash(c, 15, 40, 1850, 1040, [
      [0, '#eab79a'],
      [0.57, '#dc997c'],
      [1, '#cc826e'],
    ]),
  );
  c.strokeStyle = '#7d493724';
  c.lineWidth = 1.3;
  c.beginPath();
  for (const [u, v, k] of fibers) {
    const x = u * 2470 - 240,
      y = v * 1390 - 130;
    c.moveTo(x, y);
    c.lineTo(x + 2 + k * 7, y - k * 1.5);
  }
  c.stroke();
}

function page(c, call, cue) {
  // The book lies open just outside the left edge of the rostrum shot.
  c.save();
  c.shadowColor = '#4b372b5a';
  c.shadowBlur = 20;
  c.shadowOffsetY = 10;
  rect(c, -220, 46, 1166, 1095, '#374e72');
  c.restore();
  rect(c, -210, 42, 1144, 1096, '#cabc9d');
  for (let i = 0; i < 4; i++) rect(c, 927 - i * 3, 43 + i, 1.4, 1063, '#fff4d6');
  rect(
    c,
    -210,
    32,
    1131,
    1082,
    wash(c, -25, 0, 908, 920, [
      [0, '#dfddca'],
      [0.1, '#f5efda'],
      [0.85, '#faf3df'],
      [1, '#f0e6d0'],
    ]),
  );
  rect(c, 46, 32, 1.5, 1080, '#bd907b70');
  text(c, 'Incident report', 107, 143, 78, { font: 'Serif' });
  text(c, call.requested, 110, 239, 67, { font: 'Mono' });
  path(c, [M(110, 268), L(858, 268)], null, '#87908c', 1.6);
  const w = W * filed.scale,
    h = H * filed.scale;
  rect(
    c,
    filed.x,
    filed.y,
    w,
    h,
    wash(c, 0, 320, 600, 890, [
      [0, '#e7e4d2'],
      [1, '#eee8d6'],
    ]),
  );
  c.save();
  c.setLineDash([9, 10]);
  c.strokeStyle = '#979c903b';
  c.lineWidth = 2;
  c.strokeRect(filed.x + 15, filed.y + 15, w - 30, h - 30);
  c.restore();
  text(c, 'Request ' + call.id, filed.x + w / 2, 578, 57, {
    font: 'Mono',
    align: 'center',
    color: '#344d64',
  });
  text(c, 'Awaiting observation', filed.x + w / 2, 650, 41, {
    font: 'Serif',
    italic: true,
    align: 'center',
    color: '#5b686b',
  });
  if (cue > 0) rect(c, 319, 594, 338 * cue, 5, '#476a9c');
  text(c, 'get_release_status', filed.x + w / 2, 818, 32, {
    font: 'Mono', align: 'center', color: '#45535d',
  });
}

function corners(c) {
  for (const [x, y, sx, sy] of [
    [filed.x, filed.y, 1, 1],
    [filed.x + W * filed.scale, filed.y, -1, 1],
    [filed.x, filed.y + H * filed.scale, 1, -1],
    [filed.x + W * filed.scale, filed.y + H * filed.scale, -1, -1],
  ]) {
    c.save();
    c.translate(x, y);
    c.scale(sx, sy);
    path(c, [M(-5, -5), L(39, -5), L(-5, 39), Z], '#34485c');
    path(c, [M(-4, 32), L(32, -4)], null, '#acb9bd', 2);
    c.restore();
  }
}

function bird(c, band) {
  // A hand-cut colour plate. The observation is the tool payload. Only its ring changes.
  const ochre = '#68552a',
    wingEdge = '#59542b',
    foot = '#6a5042';
  // Perch, bark and two small shoots.
  path(
    c,
    [
      M(-12, 350),
      Q(167, 319, 334, 316),
      Q(522, 314, 720, 255),
      L(720, 268),
      Q(536, 331, 331, 329),
      Q(112, 342, -12, 366),
      Z,
    ],
    '#765e53',
  );
  path(c, [M(0, 351), Q(200, 314, 353, 318), Q(529, 314, 709, 261)], null, '#bc9b76', 4);
  path(
    c,
    [M(460, 314), Q(497, 289, 516, 251), M(572, 294), Q(595, 302, 632, 300)],
    null,
    '#897567',
    4,
  );
  // Tail. The individual tips make the direction of the folded feathers visible.
  path(
    c,
    [
      M(416, 187),
      Q(520, 216, 663, 264),
      Q(667, 269, 647, 272),
      L(659, 280),
      Q(659, 286, 632, 281),
      Q(524, 266, 423, 227),
      Z,
    ],
    '#8d8039',
    wingEdge,
    2,
  );
  path(
    c,
    [M(441, 204), Q(548, 235, 645, 270), M(449, 213), Q(554, 250, 638, 276)],
    null,
    '#c9bf68',
    3,
  );
  // Toes curl around the perch.
  path(
    c,
    [
      M(314, 241),
      Q(303, 267, 306, 313),
      Q(294, 320, 276, 320),
      Q(268, 321, 267, 327),
      M(307, 311),
      Q(322, 309, 328, 317),
      Q(332, 322, 328, 327),
      M(354, 240),
      Q(344, 268, 360, 311),
      Q(371, 311, 377, 319),
      L(375, 323),
      M(358, 311),
      Q(346, 315, 335, 317),
    ],
    null,
    foot,
    6,
  );
  path(
    c,
    [M(312, 252), Q(302, 287, 306, 309), M(350, 249), Q(346, 279, 359, 301)],
    null,
    '#cca283',
    2,
  );
  // Crown through mantle, wing root, flanks and throat.
  const outline = [
    M(148, 111),
    B(151, 74, 171, 49, 210, 44),
    B(250, 37, 279, 58, 300, 89),
    B(324, 110, 363, 119, 405, 148),
    Q(459, 184, 506, 219),
    Q(462, 232, 422, 226),
    B(386, 248, 368, 265, 330, 264),
    Q(323, 275, 319, 265),
    Q(265, 280, 225, 254),
    B(188, 232, 179, 213, 164, 181),
    Q(146, 161, 152, 140),
    Q(143, 127, 148, 111),
    Z,
  ];
  path(
    c,
    outline,
    wash(c, 172, 64, 351, 272, [
      [0, '#fff089'],
      [0.26, '#f8d94f'],
      [0.61, '#eac244'],
      [0.87, '#f5da73'],
      [1, '#f5e7a2'],
    ]),
    ochre,
    2.6,
  );
  // Sparse scallops follow the grain of the breast, stopping at the contour.
  c.save();
  path(c, outline);
  c.clip();
  for (const [u, v, k] of featherMarks) {
    const x = 149 + u * 190,
      y = 114 + v * 150;
    path(
      c,
      [M(x, y), Q(x + 1.5, y + 3, x + 3 + k * 3, y + 4 + k * 3)],
      null,
      k > 0.42 ? '#b99a3c65' : '#fff3adbb',
      1.4 + k,
    );
  }
  c.restore();
  path(
    c,
    [
      M(151, 109),
      Q(173, 83, 202, 83),
      Q(224, 84, 240, 96),
      Q(206, 90, 185, 102),
      Q(166, 113, 151, 127),
      Z,
    ],
    '#f9e989',
  );
  path(c, [M(165, 139), Q(185, 136, 209, 123), Q(201, 144, 171, 151), Z], '#dbb53e');
  // Primary flight feathers overlap toward the shoulder.
  path(
    c,
    [
      M(261, 118),
      Q(296, 97, 351, 127),
      Q(401, 150, 463, 189),
      L(537, 235),
      Q(488, 238, 434, 220),
      Q(345, 202, 286, 168),
      Q(268, 153, 261, 118),
      Z,
    ],
    '#b4a044',
    wingEdge,
    2,
  );
  for (let i = 0; i < 5; i++) {
    const x = 284 + i * 8,
      y = 124 + i * 8,
      tip = 535 - i * 17;
    path(
      c,
      [
        M(x, y),
        Q(370 + i * 4, 143 + i * 10, tip, 232 - i * 1.5),
        Q(tip - 24, 233 - i * 1.5, x + 21, y + 17),
        Z,
      ],
      i % 2 ? '#998837' : '#b5a246',
      '#766e35',
      1.8,
    );
    path(c, [M(x + 14, y + 8), Q(400, 177 + i * 4, tip - 6, 230 - i)], null, '#e5ce68', 2.4);
  }
  path(
    c,
    [
      M(252, 122),
      B(266, 99, 302, 104, 338, 126),
      Q(368, 141, 390, 163),
      Q(374, 164, 361, 158),
      Q(361, 165, 339, 157),
      Q(337, 164, 314, 151),
      Q(310, 158, 294, 146),
      Q(266, 149, 252, 122),
      Z,
    ],
    '#d5ba49',
  );
  for (let i = 0; i < 6; i++)
    path(
      c,
      [M(270 + i * 13, 122 + i * 3), Q(280 + i * 13, 134 + i * 3, 288 + i * 13, 134 + i * 3)],
      null,
      '#a5923c',
      2,
    );
  path(c, [M(152, 109), Q(137, 106, 112, 119), Q(124, 130, 153, 133), Z], '#d0a380', '#594b3a', 2);
  path(c, [M(116, 120), L(150, 121)], null, '#665247', 1.8);
  ellipse(c, 181, 99, 13, 14, '#ccae52');
  ellipse(c, 181, 99, 10.7, 11.7, '#302e2b');
  ellipse(c, 177.7, 95.3, 3.2, 3.5, '#fffaf1');
  // A coloured closed leg ring carries a short, readable version of release_id.
  c.save();
  c.translate(306, 285);
  c.rotate(-0.06);
  path(
    c,
    [M(-25, -11), Q(0, -17, 25, -11), L(25, 12), Q(0, 18, -25, 12), Z],
    wash(c, -25, 0, 26, 0, [
      [0, '#7e6d62'],
      [0.18, '#e1ddce'],
      [0.56, '#f5f0df'],
      [1, '#a49987'],
    ]),
    '#5f5348',
    1.4,
  );
  text(c, band, 0, 7, 19, { font: 'Mono', weight: 700, align: 'center', color: '#27333b' });
  c.restore();
}

function plateArt(c, read) {
  const band = read.payload.release_id.split('-').at(-1);
  const g = wash(c, 40, 0, 690, 380, [
    [0, '#d3e5e2'],
    [0.55, '#adcfce'],
    [1, '#83b1b8'],
  ]);
  rect(c, 0, 0, 700, 360, g);
  c.save();
  c.beginPath();
  c.rect(0, 0, 700, 360);
  c.clip();
  // Pale shapes in the background keep the plate readable around the yellow silhouette.
  path(
    c,
    [M(558, -14), Q(625, 89, 702, 108), M(607, 44), Q(654, 25, 688, 0)],
    null,
    '#86aea844',
    5,
  );
  for (let j = 0; j < 5; j++) {
    ellipse(c, 590 + j * 24, 21 + j * 17, 10, 28, '#90b8ac55', -0.65);
    ellipse(c, 600 + j * 23, 30 + j * 16, 22, 8, '#89afa455', -0.33);
  }
  bird(c, band);
  c.restore();
}

function lens(c, read, amount) {
  if (amount <= 0) return;
  const r = 91,
    x = 306 + 52 * (1 - amount),
    y = 285 - 32 * (1 - amount);
  c.save();
  c.globalAlpha *= amount;
  path(c, [M(x + 80, y + 41), L(x + 182, y + 66)], null, '#36474e', 18);
  ellipse(c, x + 3, y + 6, r + 5, r + 5, '#3d4a4c39');
  c.save();
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.clip();
  c.translate(x, y);
  c.scale(2.65, 2.65);
  c.translate(-x, -y);
  plateArt(c, read);
  c.restore();
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.strokeStyle = '#3b4c53';
  c.lineWidth = 7;
  c.stroke();
  c.beginPath();
  c.arc(x, y, r - 4, 3.52, 4.89);
  c.strokeStyle = '#fff9dfce';
  c.lineWidth = 3;
  c.stroke();
  c.restore();
}

function reverse(c, read, idCue) {
  rect(c, 0, 0, W, H, '#f7efd8');
  path(c, [M(29, 97), L(707, 97), M(429, 129), L(429, 468)], null, '#a7aaa2', 2);
  text(c, read.source, 31, 70, 48, { font: 'Serif', italic: true });
  text(c, 'JSON-RPC', 31, 166, 32, { font: 'Mono', color: '#4d6064' });
  text(c, 'Reply ID', 31, 224, 47, { font: 'Serif' });
  text(c, String(read.id), 30, 441, 220, { font: 'Mono', weight: 700 });
  if (idCue > 0) rect(c, 39, 449, 250 * idCue, 6, '#436792');
  // The postage vignette reuses the face printed on the front of this very plate.
  c.save();
  c.translate(505, 132);
  rect(c, 0, 0, 177, 156, '#718c98');
  rect(c, 8, 8, 161, 140, '#adcacb');
  c.beginPath();
  c.rect(13, 13, 151, 130);
  c.clip();
  c.translate(-135, -45);
  c.scale(1.15, 1.15);
  bird(c, read.payload.release_id.split('-').at(-1));
  c.restore();
  for (let i = 0; i < 13; i++) {
    ellipse(c, 505 + i * 14.6, 131, 3.1, 3.1, '#f7efd8');
    ellipse(c, 505 + i * 14.6, 288, 3.1, 3.1, '#f7efd8');
  }
  for (let i = 0; i < 11; i++) {
    ellipse(c, 504, 134 + i * 15.1, 3.1, 3.1, '#f7efd8');
    ellipse(c, 683, 134 + i * 15.1, 3.1, 3.1, '#f7efd8');
  }
  // A postmark records observation time in both views.
  c.save();
  c.translate(550, 342);
  c.rotate(-0.15);
  c.strokeStyle = '#925646';
  c.lineWidth = 3.5;
  c.beginPath();
  c.ellipse(0, 0, 84, 53, 0, 0, 2 * Math.PI);
  c.stroke();
  text(c, clockTime(read.observedAt), 0, 13, 38, {
    font: 'Mono',
    align: 'center',
    color: '#864937',
  });
  for (let i = 0; i < 3; i++)
    path(
      c,
      [
        M(85, -14 + i * 13),
        Q(103, -23 + i * 13, 124, -13 + i * 13),
        Q(138, -7 + i * 13, 147, -12 + i * 13),
      ],
      null,
      '#995e4d99',
      2,
    );
  c.restore();
  text(c, read.checks.complete ? 'complete' : 'pending', 31, 525, 35, { font: 'Mono' });
  text(c, read.checks.toolSucceeded ? 'isError  false' : 'isError  true', W - 26, 525, 32, {
    font: 'Mono',
    align: 'right',
  });
}

function plate(c, read, pose, zoom, idCue = 0, turn = 0) {
  c.save();
  c.translate(pose.x, pose.y);
  c.rotate(pose.angle);
  c.scale(pose.scale, pose.scale);
  if (turn > 0 && turn < 1) {
    c.translate(W / 2, -48 * Math.sin(Math.PI * turn));
    c.transform(
      Math.max(0.006, Math.abs(Math.cos(turn * Math.PI))),
      0.05 * Math.sin(turn * Math.PI),
      0,
      1,
      0,
      0,
    );
    c.translate(-W / 2, 0);
  }
  c.save();
  c.shadowColor = '#5a392c70';
  c.shadowBlur = 18;
  c.shadowOffsetY = 12;
  rect(c, 0, 0, W, H, paper);
  c.restore();
  if (turn >= 0.5) {
    reverse(c, read, idCue);
    c.restore();
    return;
  }
  rect(c, 0, 0, W, 66, '#2f4355');
  text(c, 'Reply ' + read.id, 23, 46, 37, { font: 'Mono', weight: 700, color: '#fff4d5' });
  text(c, read.source + '  /  ' + clockTime(read.observedAt), W - 20, 44, 29, {
    font: 'Mono',
    color: '#f0eddb',
    align: 'right',
  });
  if (idCue > 0) rect(c, 24, 54, 180 * idCue, 4, '#fcd56c');
  c.save();
  c.translate(20, 80);
  plateArt(c, read);
  lens(c, read, zoom);
  c.restore();
  path(c, [M(20, 452), L(720, 452)], null, '#8c9b97', 1.5);
  text(c, 'release_id', 24, 490, 25, { font: 'Mono', color: '#51626a' });
  text(c, 'status', 401, 490, 25, { font: 'Mono', color: '#51626a' });
  text(c, read.payload.release_id, 24, 539, 38, { font: 'Mono' });
  text(c, read.payload.status, 401, 539, 38, { font: 'Mono' });
  c.restore();
}

function traceSleeve(c) {
  c.save();
  c.translate(0, -23);
  c.rotate(-0.025);
  path(
    c,
    [
      M(1006, 930),
      L(1314, 930),
      Q(1355, 949, 1391, 949),
      L(1450, 949),
      Q(1479, 949, 1517, 930),
      L(1980, 930),
      L(1980, 1240),
      L(1006, 1240),
      Z,
    ],
    '#b5c6cf',
    '#697c8a',
    2.2,
  );
  path(c, [M(1007, 938), L(1281, 938), M(1542, 938), L(1981, 938)], null, '#d9e1df', 2);
  text(c, 'Call trace', 1045, 1000, 41, { font: 'Serif', italic: true });
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed, reveal } = clock;
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const pair =
    index === 1
      ? ease(reveal('sent request seventy-one', 0.7))
      : index === 2
        ? 1 - ease(reveal('the fields fit', 0.85))
        : 0;
  const turn =
    index === 1
      ? ease(reveal('Turn it over', 1.1))
      : index === 2
        ? 1 - ease(reveal('the fields fit', 1.1))
        : 0;
  const inspectFirst =
    index === 2
      ? ease(reveal("look at the bird's leg", 0.9))
      : index === 3
        ? 1 - ease(reveal('keeps the reply', 0.6))
        : 0;
  const stash = index === 3 ? ease(reveal('keeps the reply', 1.25)) : Number(index > 3);
  const secondArrival = index === 4 ? ease(reveal('A fresh reply', 1.05)) : Number(index > 4);
  const inspectSecond =
    index === 4 ? ease(reveal('Check the band', 0.8)) : index === 5 ? 1 - ease(elapsed / 1.0) : 0;
  const insert = index === 5 && second.accepted ? ease((elapsed - 0.55) / 1.65) : 0;
  const finish = index === 5 ? ease(reveal('Deployments saw', 2.5)) : 0;
  c.translate(130 * finish, -42 * finish);
  c.scale(1 + 0.17 * finish, 1 + 0.17 * finish);
  table(c);
  const activeRead = index >= 4 ? second : first;
  page(c, activeRead, pair);
  const arrived = index === 0 ? ease(elapsed / 1.65) : 1;
  const firstPose = poseBetween(poseBetween(incoming, landed, arrived), kept, stash);
  plate(c, first, firstPose, inspectFirst, pair, turn);
  traceSleeve(c);
  if (index >= 4 && secondArrival > 0) {
    const entry = poseBetween({ ...incoming, y: -585 }, landed, secondArrival);
    const pos = poseBetween(entry, filed, insert);
    pos.y -= 100 * Math.sin(insert * Math.PI);
    pos.angle -= 0.055 * Math.sin(insert * Math.PI);
    plate(c, second, pos, inspectSecond);
  }
  corners(c);
  c.restore();
}

export default { title: 'Which canary did the tool observe?', beats, draw, check };
