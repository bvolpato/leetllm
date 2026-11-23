import assert from 'node:assert/strict';
import { EVENTS } from '../../../films/observability-monitoring-llm-systems/fixtures.mjs';

// The on-call pager and the request viewer read the same reviewed window.
const windowRows = EVENTS.map(({ id, served, unsafe, total }) => ({
  id, status: 200, served, unsafe, total,
}));
const violations = windowRows.filter((row) => row.served && row.unsafe === true);
const reviewed = windowRows.filter((row) => typeof row.unsafe === 'boolean');
const examples = ['205', '202'].map((id) => ({
  ...windowRows.find((row) => row.id === id),
  policyVersion: 17,
  signatory: null,
  draft: 'Approved.',
}));
const received = (example) => example.served ? example.draft : null;
// End times of the three sibling spans in the original replay of request 205.
const replay = { retrieval: 90, draft: 380, delivery: examples[0].total };

const beats = [
  {
    id: 'incoming-page',
    say: 'There goes the pager. Look at the request log. All six calls to the deploy assistant came back two hundred OK. What set it off?',
    hold: 1.0,
  },
  {
    id: 'open-the-example',
    say: 'This team pages when an engineer receives approval to deploy without a sign-off. Those numbers on the pager are request IDs. Open two oh five.',
    hold: 0.7,
  },
  {
    id: 'unsigned',
    say: 'Someone asked, “Can I deploy?” Start where the assistant looked for the answer. Here’s the release record it retrieved. Who signed off?',
    hold: 1.1,
  },
  {
    id: 'in-the-draft',
    say: 'That line is empty. Now advance to the model’s draft. “Approved.” There’s the first mistake. The serving gate can still withhold that draft.',
    hold: 0.8,
  },
  {
    id: 'in-the-reply',
    say: 'Fifty milliseconds left in this trace. Watch what shows up on the engineer’s screen when the clock stops.',
    hold: 1.5,
  },
  {
    id: 'same-draft',
    say: 'The gate let the approval through. Bring up two oh two beside it. Same release record, same word in the draft. Watch where this one stops.',
    hold: 1.2,
  },
  {
    id: 'review-the-delivery',
    say: 'Two oh two kept the bad draft inside the service. A reviewer checks what each engineer received against the release record and attaches the verdict to the request ID.',
    hold: 0.7,
  },
  {
    id: 'back-at-the-desk',
    say: 'Look back at the six reviewed requests. Two delivered unsupported approvals. Either highlighted row takes the on-call engineer straight to a reply that triggered the page.',
    hold: 2.2,
  },
];

function check() {
  assert.equal(new Set(windowRows.map((row) => row.id)).size, 6);
  assert.equal(reviewed.length, windowRows.length);
  assert.equal(windowRows.every((row) => row.status === 200), true);
  assert.deepEqual(violations.map((row) => row.id), ['205', '206']);
  assert.equal(violations.length / reviewed.length, 2 / 6);
  for (const example of examples) {
    const foundUnsupportedApproval = received(example) === 'Approved.' && example.signatory === null;
    assert.equal(foundUnsupportedApproval, example.unsafe);
  }
  assert.deepEqual([replay.retrieval, replay.draft, replay.delivery], [90, 380, 430]);
  assert.equal(replay.delivery - replay.draft, 50);
  assert.deepEqual(examples.map(received), ['Approved.', null]);
  assert.equal(examples[0].draft, examples[1].draft);
  return true;
}

const clamp = (t) => Math.min(1, Math.max(0, t));
const ease = (t) => { const n = clamp(t); return n * n * (3 - 2 * n); };
const mix = (a, b, t) => a + (b - a) * t;
const ink = '#202846';
const subdued = '#505b74';
const green = '#006d5d';
const warning = '#9e3328';
const lcd = '#f1f2ec';

function box(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}
function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function oval(ctx, x, y, rx, ry, fill) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
}
function word(ctx, value, x, y, size, color = ink, face = 'Sans', weight = 400) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${face}"`;
  ctx.fillText(String(value), x, y);
}
function gradient(ctx, x1, y1, x2, y2, stops) {
  const paint = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(([offset, color]) => paint.addColorStop(offset, color));
  return paint;
}

// World coordinates stay fixed as the shot travels from the pager to the trace.
const wide = { x: 960, y: 537, scale: 1 };
const onPager = { x: 1515, y: 555, scale: 2.12 };
const onScreen = { x: 654, y: 475, scale: 1.44 };
function travel(a, b, p) {
  return { x: mix(a.x, b.x, p), y: mix(a.y, b.y, p), scale: mix(a.scale, b.scale, p) };
}
function camera(clock) {
  if (clock.index === 0) return travel(onPager, wide, ease(clock.reveal('Look at the request log', 1.9)));
  if (clock.index === 1) return travel(wide, onScreen, ease(clock.reveal('Open two oh five', 1.5)));
  if (clock.index === 7) return travel(onScreen, wide, ease(clock.reveal('Either highlighted row', 2.2)));
  return onScreen;
}

function desk(ctx) {
  ctx.fillStyle = gradient(ctx, 20, 1000, 1650, 0, [
    [0, '#35477f'], [0.5, '#4e6eb7'], [0.83, '#7194d1'], [1, '#829acf'],
  ]);
  ctx.fillRect(-1100, -1000, 4200, 3400);
  // Fine flecks in the blue linoleum are fixed to the desk through both camera moves.
  let state = 419;
  const noise = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  for (let i = 0; i < 1150; i++) {
    const x = noise() * 2400 - 100, y = noise() * 1370 - 90;
    ctx.fillStyle = i % 3 ? '#e5e3d62a' : '#192a653b';
    ctx.fillRect(x, y, 1 + noise() * 3.3, 1 + noise() * 1.8);
  }
  ctx.save();
  ctx.transform(1, 0, -0.49, 1, 0, 0);
  for (const x of [1600, 1740, 1880, 2020, 2160, 2300]) {
    ctx.fillStyle = gradient(ctx, x, 0, x + 78, 0, [[0, '#21367200'], [0.18, '#283c7226'], [0.8, '#293d7226'], [1, '#21367200']]);
    ctx.fillRect(x, -900, 78, 2600);
  }
  ctx.restore();
}

function lanyard(ctx, wiggle) {
  ctx.save();
  ctx.lineCap = 'round';
  const cord = (dx, dy, width, color) => {
    ctx.beginPath();
    ctx.moveTo(1764 + wiggle, 382);
    ctx.bezierCurveTo(1780 + dx, 306 + dy, 1830 + dx, 307 + dy, 1862 + dx, 276 + dy);
    ctx.bezierCurveTo(1935 + dx, 212 + dy, 1912 + dx, 109 + dy, 1845 + dx, 127 + dy);
    ctx.bezierCurveTo(1740 + dx, 158 + dy, 1895 + dx, 318 + dy, 1740 + wiggle, 397);
    ctx.lineWidth = width; ctx.strokeStyle = color; ctx.stroke();
  };
  cord(10, 13, 12, '#2d42784d');
  cord(0, 0, 12, '#242c4a');
  cord(-1, -2, 5, '#726f87');
  ctx.setLineDash([2, 6]); cord(-2, -2, 4, '#d5c9be');
  ctx.restore();
}

const glyphs = {
  '2': ['11110','00001','00001','00110','01000','10000','11111'],
  U: ['10001','10001','10001','10001','10001','10001','01110'],
  N: ['10001','11001','11001','10101','10011','10011','10001'],
  S: ['01111','10000','10000','01110','00001','00001','11110'],
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  F: ['11111','10000','10000','11110','10000','10000','10000'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
};
function dotMatrix(ctx, value, x, y, cell) {
  for (const letter of value) {
    const pixels = glyphs[letter];
    if (pixels) pixels.forEach((row, j) => [...row].forEach((bit, i) => {
      ctx.fillStyle = bit === '1' ? '#283445' : '#4555660c';
      ctx.fillRect(x + i * cell, y + j * cell, cell - 0.65, cell - 0.65);
    }));
    x += (pixels ? 6 : 3) * cell;
  }
}

function pager(ctx, clock) {
  const t = clock.seconds;
  const pulse = t < 1.55 ? Math.pow(Math.sin(Math.PI * clamp((t + 0.25) / 1.8)), 2) : 0;
  const shake = pulse * Math.sin(t * 41);
  lanyard(ctx, shake * 6);
  ctx.save();
  ctx.translate(1524 + shake * 9, 570 - Math.abs(shake) * 4);
  ctx.rotate(-0.128 + 0.015 * shake);
  // The case casts a harder contact shadow under its near edge.
  ctx.save();
  ctx.shadowColor = '#14264a70'; ctx.shadowBlur = 25; ctx.shadowOffsetX = 17; ctx.shadowOffsetY = 28;
  box(ctx, -305, -177, 610, 370, 68, '#84422f');
  ctx.restore();
  box(ctx, -309, -184, 617, 383, 69, '#913d2f');
  box(ctx, -310, -190, 618, 375, 68, gradient(ctx, -280, -175, 252, 175, [
    [0, '#ffcc9a'], [0.05, '#ff9c63'], [0.43, '#f88053'], [0.85, '#e86845'], [1, '#c74e35'],
  ]));
  box(ctx, -297, -179, 591, 351, 59, gradient(ctx, -220, -160, 160, 145, [[0, '#ff975e'], [1, '#ef714d']]));
  // Raised bumper ends and a lanyard eyelet.
  for (let i = 0; i < 6; i++) {
    box(ctx, -299 + i % 2, -70 + i * 24, 11, 12, 5, '#c2593a');
    box(ctx, 281, -60 + i * 24, 11, 12, 5, '#f88e5b');
  }
  oval(ctx, 249, -151, 13, 9, '#ac543b');
  oval(ctx, 251, -152, 9, 6, '#323958');
  word(ctx, 'ON CALL', -248, -132, 20, '#6b372c', 'Mono', 700);
  box(ctx, 192, -152, 34, 13, 6, '#a24028');
  box(ctx, 196, -150, 26, 8, 4, pulse > 0.18 ? '#ffeea0' : '#ffab66');
  box(ctx, -265, -112, 527, 208, 24, '#ffab7b');
  box(ctx, -265, -117, 527, 210, 24, '#a64934');
  box(ctx, -251, -103, 499, 181, 14, '#40424b');
  box(ctx, -243, -96, 483, 166, 8, gradient(ctx, -240, -92, 230, 65, [[0, '#bfc7bd'], [0.3, '#d3dcc8'], [1, '#e0e0ca']]));
  word(ctx, '09:12', -219, -58, 24, '#43504f', 'Mono');
  // Antenna bars are part of the faceplate, not a second status indicator.
  for (let i = 0; i < 4; i++) box(ctx, 168 + i * 9, -64 - i * 4, 5, 6 + i * 4, 1, '#485753');
  dotMatrix(ctx, violations.length + ' UNSAFE', -215, -41, 8.2);
  word(ctx, violations.map((r) => '#' + r.id).join('   '), -215, 52, 25, '#354140', 'Mono');
  for (let i = 0; i < 5; i++) box(ctx, -237 + i * 15, 120, 6, 32, 3, '#ac503c');
  box(ctx, 178, 114, 64, 42, 19, '#c8593e');
  box(ctx, 178, 110, 63, 40, 19, '#535468');
  ctx.beginPath(); ctx.moveTo(204, 121); ctx.lineTo(218, 130); ctx.lineTo(204, 139); ctx.fillStyle = '#eee3cd'; ctx.fill();
  ctx.restore();
}

function log(ctx, joined) {
  word(ctx, 'Deploy assistant', 46, 72, 51, ink, 'Sans', 700);
  word(ctx, '09:12', 936, 66, 29, subdued, 'Mono');
  line(ctx, 42, 103, 1075, 103, '#acb2c0', 2);
  word(ctx, 'Request', 50, 151, 30, subdued);
  word(ctx, 'HTTP', 333, 151, 30, subdued);
  if (joined) word(ctx, 'Reviewed outcome', 631, 151, 30, subdued);
  for (const [i, row] of windowRows.entries()) {
    const y = 217 + 64 * i;
    if (joined && row.unsafe) box(ctx, 34, y - 43, 1041, 61, 5, '#f5d9c9');
    word(ctx, '#' + row.id, 50, y, 41, ink, 'Mono');
    oval(ctx, 346, y - 13, 9, 9, green);
    word(ctx, row.status + ' OK', 378, y, 38, green, 'Mono');
    if (joined) word(ctx, row.unsafe ? 'Unsafe delivery' : row.served ? 'Supported' : 'Withheld', 631, y, 38, row.unsafe ? warning : subdued, 'Sans', row.unsafe ? 700 : 400);
  }
}

function traceColumn(ctx, x, example, record, draft, travelP, reviewP) {
  word(ctx, '#' + example.id, x, 207, 42, ink, 'Mono', 700);
  if (record > 0) {
    ctx.save(); ctx.globalAlpha = record;
    line(ctx, x + 5, 284, x + 16, 295, '#717b8b', 2.5);
    line(ctx, x + 16, 284, x + 5, 295, '#717b8b', 2.5);
    line(ctx, x + 24, 298, x + 218, 298, '#6a7389', 2);
    word(ctx, 'Unsigned', x + 2, 333, 30, subdued);
    ctx.restore();
  }
  if (draft > 0) {
    ctx.save(); ctx.globalAlpha = draft;
    word(ctx, example.draft, x, 419, 49, ink, 'Serif');
    ctx.restore();
  }
  if (travelP > 0) {
    if (received(example)) {
      const y = mix(419, 537, ease(travelP));
      box(ctx, x - 12, y - 54, 264, 71, 13, '#f8d9c1');
      word(ctx, received(example), x, y, 49, warning, 'Serif');
    } else {
      // The duplicate runs into the closed gate. The draft stays readable above it.
      ctx.save();
      ctx.beginPath(); ctx.rect(x - 12, 437, 270, 40); ctx.clip();
      const y = mix(419, 541, ease(travelP));
      box(ctx, x - 12, y - 54, 264, 71, 13, '#e0e6e9');
      word(ctx, example.draft, x, y, 49, ink, 'Serif');
      ctx.restore();
      line(ctx, x - 9, 478, x + 229, 478, '#607287', 4);
      ctx.save();
      ctx.globalAlpha = ease((travelP - 0.7) / 0.3);
      word(ctx, 'Withheld', x, 536, 39, subdued);
      ctx.restore();
    }
  }
  if (reviewP > 0 && example.unsafe) {
    ctx.save(); ctx.globalAlpha = reviewP;
    word(ctx, 'Unsafe delivery', x, 587, 27, warning, 'Sans', 700);
    ctx.restore();
  }
}

function trace(ctx, clock) {
  const { index } = clock;
  const state = (beatIndex, phrase, span) => index > beatIndex ? 1 : index === beatIndex ? clock.reveal(phrase, span) : 0;
  const record = state(2, 'Here’s the release record', 0.65);
  const draft = state(3, 'Now advance', 0.85);
  const delivery = state(4, 'Watch what shows up', 1.5);
  const compare = state(5, 'Bring up two oh two', 0.85);
  const withheld = state(5, 'Watch where', 1.35);
  const verdict = state(6, 'attaches the verdict', 0.7);
  word(ctx, 'Trace replay', 43, 54, 28, subdued, 'Mono');
  word(ctx, 'Can I deploy?', 42, 124, 59, ink, 'Serif');
  if (compare < 1) {
    // The playhead stops at the recorded end of each operation.
    const ms = Math.round(replay.retrieval * record + (replay.draft - replay.retrieval) * draft + (replay.delivery - replay.draft) * delivery);
    const start = 665, width = 398;
    const tick = start + width * ms / replay.delivery;
    ctx.save(); ctx.globalAlpha = 1 - compare;
    word(ctx, '#' + examples[0].id, start, 73, 25, subdued, 'Mono');
    ctx.textAlign = 'right'; word(ctx, ms + ' ms', start + width, 76, 33, ink, 'Mono');
    ctx.textAlign = 'left';
    box(ctx, start, 96, width, 9, 4, '#c7cbd0');
    if (ms > 0) box(ctx, start, 96, tick - start, 9, 4, '#576db2');
    for (const t of [replay.retrieval, replay.draft]) {
      const x = start + width * t / replay.delivery;
      line(ctx, x, 93, x, 109, lcd, 4);
    }
    oval(ctx, tick, 100, 7, 13, '#394e91');
    ctx.restore();
  }
  line(ctx, 42, 150, 1075, 150, '#acb2c0', 2);
  const labels = [
    ['Policy v' + examples[0].policyVersion, 298, record],
    ['Model draft', 418, draft],
    ['Engineer saw', 535, delivery],
  ];
  for (const [label, y, shown] of labels) {
    oval(ctx, 61, y - 13, 8, 8, shown ? '#4862a1' : '#b2b8c2');
    word(ctx, label, 86, y, 35, shown ? ink : subdued);
  }
  line(ctx, 61, 300, 61, 387, '#97a5be', 3);
  line(ctx, 61, 424, 61, 505, '#97a5be', 3);
  traceColumn(ctx, 390, examples[0], record, draft, delivery, verdict);
  if (compare > 0) {
    ctx.save();
    ctx.globalAlpha = compare;
    ctx.translate((1 - ease(compare)) * 60, 0);
    line(ctx, 714, 176, 714, 555, '#b7bfcb', 2);
    traceColumn(ctx, 760, examples[1], 1, 1, withheld, 0);
    ctx.restore();
  }
}

function screen(ctx, clock) {
  const open = clock.index === 1 ? ease(clock.reveal('Open two oh five', 0.9)) : Number(clock.index > 1);
  const back = clock.index === 7 ? ease(clock.reveal('Look back', 0.9)) : 0;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(0, 0, 1118, 617, 7); ctx.clip();
  ctx.fillStyle = lcd; ctx.fillRect(0, 0, 1118, 617);
  if (open < 1 || back > 0) log(ctx, back > 0);
  const amount = open * (1 - back);
  if (amount > 0) {
    ctx.save();
    ctx.translate(1118 * (1 - amount), 0);
    ctx.fillStyle = lcd; ctx.fillRect(0, 0, 1118, 617);
    trace(ctx, clock);
    ctx.restore();
  }
  ctx.restore();
}

function laptop(ctx, clock) {
  ctx.save();
  ctx.translate(49, 77); ctx.rotate(-0.022);
  ctx.save();
  ctx.shadowColor = '#1c2c5266'; ctx.shadowBlur = 28; ctx.shadowOffsetX = 20; ctx.shadowOffsetY = 22;
  box(ctx, 0, 0, 1220, 770, 47, '#566173'); ctx.restore();
  box(ctx, 0, 0, 1220, 767, 46, gradient(ctx, 0, 0, 1220, 765, [[0, '#e6dccc'], [0.55, '#d3c7be'], [1, '#9e97a0']]));
  box(ctx, 10, 10, 1200, 735, 39, '#c7c2b9');
  box(ctx, 34, 41, 1152, 657, 21, '#9c9ba4');
  box(ctx, 43, 49, 1134, 636, 15, '#343747');
  ctx.save(); ctx.translate(51, 58); screen(ctx, clock); ctx.restore();
  oval(ctx, 611, 25, 6, 6, '#4b505b');
  for (const x of [151, 939]) {
    box(ctx, x, 723, 154, 38, 9, '#5e5c69');
    box(ctx, x + 3, 722, 148, 23, 8, '#a5a0a4');
  }
  box(ctx, -53, 765, 1326, 475, 36, gradient(ctx, 18, 770, 1030, 1170, [[0, '#d9d0c1'], [0.65, '#b2aeb3'], [1, '#a7a2a8']]));
  box(ctx, 17, 799, 1186, 274, 16, '#6e6e80');
  const keys = ['1234567890-=', 'QWERTYUIOP[]', 'ASDFGHJKL', 'ZXCVBNM'];
  keys.forEach((row, j) => {
    const offset = [0, 10, 37, 80][j];
    [...row].forEach((label, i) => {
      const x = 39 + offset + i * 95, y = 815 + j * 62;
      box(ctx, x, y + 4, 83, 53, 8, '#656574');
      box(ctx, x, y, 83, 51, 8, '#e2dcd2');
      word(ctx, label, x + 12, y + 30, 22, '#636071', 'Mono');
    });
  });
  ctx.restore();
}

function draw(ctx, clock) {
  ctx.save();
  ctx.fillStyle = '#536fad'; ctx.fillRect(0, 0, 1920, 1080);
  const view = camera(clock);
  ctx.translate(960, 540); ctx.scale(view.scale, view.scale); ctx.translate(-view.x, -view.y);
  desk(ctx);
  laptop(ctx, clock);
  pager(ctx, clock);
  ctx.restore();
}

export default { title: 'The Page at 09:12', beats, draw, check };
