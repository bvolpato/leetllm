import assert from 'node:assert/strict';
import { Path2D } from '@napi-rs/canvas';

const title = 'When the queue counter goes quiet';

const beats = [
  {
    id: 'lost-reading',
    say: "Did anybody leave the line at window B? A moment ago the sign said three. The number's gone. All three people are still there.",
    hold: 1.1,
  },
  {
    id: 'two-windows',
    say: 'A model uses these counts to estimate the wait for a ticket. Window A sent a zero. This time, window B has no reading.',
    hold: 0.7,
  },
  {
    id: 'fill',
    say: 'Suppose the model needs a number. We fill the blank with zero. Down here, where the model gets its inputs, can you tell which zero came from a counter?',
    hold: 1.7,
  },
  {
    id: 'keep-the-gap',
    say: 'Look back at the windows. Before filling a blank, record whether the reading was missing. That extra bit is called a missingness indicator. A supplied a reading, so its bit is zero. The blank at B turns its bit on.',
    hold: 1.1,
  },
  {
    id: 'crossing',
    say: 'The woman in yellow has spotted the empty window. Watch the two inputs while she crosses over.',
    hold: 1.45,
  },
  {
    id: 'two-ones',
    say: 'At A, the one counts a person. At B, the one marks a missing reading. We can count the two people still waiting there. Their number never reached the model.',
    hold: 2.55,
  },
];

const crowd = [
  { id: 'program', x: 1308, y: 710, size: 0.88 },
  { id: 'satchel', x: 1468, y: 769, size: 0.99 },
  { id: 'yellow', x: 1647, y: 827, size: 1.07 },
];

function snapshot(crossed, lost) {
  const queues = [[], []];
  for (const person of crowd) {
    const window = crossed && person.id === 'yellow' ? 0 : 1;
    queues[window].push(person.id);
  }
  const readings = queues.map((people, i) => (i === 1 && lost ? null : people.length));
  // Inspect the raw measurement before replacing null with the fill value.
  const inputs = readings.map((count) => [count ?? 0, Number(count === null)]);
  return { queues, readings, inputs };
}

function check() {
  assert.deepEqual(snapshot(false, false).readings, [0, 3]);
  const outage = snapshot(false, true);
  assert.equal(outage.queues[1].length, 3);
  assert.deepEqual(outage.readings, [0, null]);
  assert.deepEqual(
    outage.inputs.map(([count]) => count),
    [0, 0],
  );
  assert.deepEqual(outage.inputs, [
    [0, 0],
    [0, 1],
  ]);
  const final = snapshot(true, true);
  assert.deepEqual(final.queues, [['yellow'], ['program', 'satchel']]);
  assert.deepEqual(final.inputs, [
    [1, 0],
    [0, 1],
  ]);
  assert.deepEqual(snapshot(true, false).inputs, [
    [1, 0],
    [2, 0],
  ]);
  return true;
}

const ink = '#30283b';
const cream = '#fff0c2';
const clamp = (x) => Math.max(0, Math.min(1, x));
function ease(value) {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}
const mix = (a, b, p) => a + (b - a) * p;

function box(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

function oval(g, x, y, rx, ry, color, angle = 0) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  g.fill();
}

function shape(g, d, color, edge, width = 1) {
  const path = new Path2D(d);
  if (color) {
    g.fillStyle = color;
    g.fill(path);
  }
  if (edge) {
    g.lineWidth = width;
    g.strokeStyle = edge;
    g.stroke(path);
  }
}

function line(g, x, y, x2, y2, color, width) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}

function label(g, text, x, y, size, color, family = 'Sans', weight = 600, align = 'center') {
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  g.fillText(text, x, y);
}

function vertical(g, top, bottom, colors) {
  const grad = g.createLinearGradient(0, top, 0, bottom);
  for (const [stop, color] of colors) grad.addColorStop(stop, color);
  return grad;
}

// All three patrons face the window. Their feet share the ticket hall's perspective.
function patron(g, person, walk, seconds) {
  const moving = person.id === 'yellow';
  const x = moving ? mix(person.x, 514, walk) : person.x;
  const y = moving ? mix(person.y, 723, walk) + 40 * Math.sin(walk * Math.PI) : person.y;
  const size = moving ? mix(person.size, 0.94, walk) : person.size;
  const stride = moving
    ? Math.sin(walk * Math.PI * 18) * Math.min(1, walk * 24, (1 - walk) * 24)
    : 0;
  const dark = person.id === 'program';
  const bag = person.id === 'satchel';
  const coat = dark ? '#484a77' : bag ? '#4b7978' : '#f5c34e';
  const shade = dark ? '#383355' : bag ? '#2c5157' : '#c78334';
  const skin = dark ? '#a96851' : bag ? '#dfa084' : '#a55e42';
  const hair = dark ? '#302737' : bag ? '#603d35' : '#382933';

  g.save();
  g.translate(x, y);
  g.scale(size, size);
  shape(g, 'M-35 -3 Q-2 -11 31 -6 L123 14 Q107 26 75 22 Z', '#79526849');
  g.translate(0, -Math.abs(stride) * 3);

  for (const [i, hip] of [-15, 16].entries()) {
    const dx = (i ? 1 : -1) * stride * 30;
    const ankle = hip + dx;
    const knee = hip + dx * 0.34 - Math.abs(stride) * 8;
    const height = i ? -4 : -1;
    shape(
      g,
      `M${hip - 12} -102 L${hip + 14} -101 L${knee + 9} -48 L${ankle + 8} ${height - 9} L${ankle - 5} ${height - 8} L${knee - 11} -45 Z`,
      i ? '#373448' : '#27283a',
    );
    shape(
      g,
      `M${ankle - 6} ${height - 14} L${ankle + 9} ${height - 13} L${ankle + 11} ${height - 1} Q${ankle + 1} ${height + 3} ${ankle - 25} ${height + 1} Q${ankle - 30} ${height - 6} ${ankle - 14} ${height - 9} Z`,
      ink,
    );
    line(g, ankle - 23, height + 1, ankle + 10, height, '#e2ba90', 2);
  }

  const breath = Math.sin(seconds * 1.7 + person.x) * 0.85;
  g.translate(0, breath);
  if (moving) {
    shape(g, 'M-22 -185 Q-1 -198 22 -182 L37 -145 L50 -85 Q22 -64 -44 -79 L-34 -126 Z', coat);
    shape(g, 'M19 -183 Q34 -164 36 -142 L50 -85 L29 -79 L14 -131 Z', shade);
    shape(g, 'M-23 -177 L-32 -122 L-41 -83 M-13 -173 L-16 -118', null, '#9c6c38', 2.8);
    shape(g, 'M-18 -184 L-5 -169 L3 -183 L-2 -191 Z', cream);
    shape(g, 'M21 -171 Q36 -161 23 -132 L2 -111 L-9 -120 L7 -144 Z', '#e3a13a');
    shape(g, 'M-7 -122 Q-19 -119 -18 -111 Q-13 -101 -2 -110 L4 -117 Z', skin);
    shape(g, 'M13 -183 Q3 -155 -22 -119', null, '#714344', 5);
    shape(g, 'M-34 -126 L-9 -120 L-14 -98 Q-28 -96 -42 -104 Z', '#a34e47');
  } else if (bag) {
    shape(g, 'M-21 -184 Q0 -197 23 -179 Q34 -160 35 -122 L38 -87 Q7 -77 -35 -88 L-28 -144 Z', coat);
    shape(g, 'M16 -180 Q31 -172 29 -149 L18 -114 L5 -115 L12 -149 Z', shade);
    shape(g, 'M-19 -184 L-28 -160 L-10 -168 L0 -184 Z', '#9cb6a0');
    shape(g, 'M17 -176 L-19 -111', null, '#523b39', 6);
    shape(g, 'M-35 -121 Q-15 -122 5 -110 L0 -82 Q-20 -79 -40 -91 Z', '#bf7354');
    shape(g, 'M-34 -120 L4 -111 L-3 -99 L-36 -107 Z', '#d79065');
    shape(g, 'M5 -119 Q-1 -110 4 -105 Q15 -102 19 -115 Z', skin);
  } else {
    shape(g, 'M-23 -185 Q-2 -194 20 -179 Q32 -164 36 -133 L40 -83 L-36 -83 L-29 -149 Z', coat);
    shape(g, 'M20 -179 L30 -151 L38 -84 L17 -84 L10 -143 Z', shade);
    shape(
      g,
      'M-21 -185 Q-6 -174 8 -181 L6 -170 Q-4 -164 -17 -173 L-25 -145 L-37 -148 Z',
      '#e88370',
    );
    shape(g, 'M-56 -162 L-39 -171 L-21 -150 L-36 -141 Z', '#fcdfb1');
    line(g, -50, -160, -38, -165, '#d38455', 3);
    shape(
      g,
      'M12 -164 Q25 -159 14 -136 Q4 -118 -11 -124 L-39 -143 L-31 -154 L-8 -141 Z',
      '#595b86',
    );
    oval(g, -37, -149, 7, 8, skin);
  }

  shape(g, 'M-15 -206 L4 -205 L8 -183 Q-4 -174 -17 -183 Z', skin);
  shape(
    g,
    'M-22 -232 Q-12 -246 6 -238 Q22 -233 19 -216 Q17 -204 6 -197 L-4 -192 Q-19 -186 -21 -202 L-29 -204 L-24 -214 Z',
    skin,
  );
  if (moving) {
    shape(
      g,
      'M-24 -221 Q-28 -243 -9 -247 Q9 -255 19 -242 Q31 -227 16 -207 L6 -203 Q-3 -215 -4 -227 L-18 -221 Z',
      hair,
    );
    oval(g, 19, -239, 13, 14, hair);
    shape(g, 'M-24 -227 Q-2 -246 14 -232', null, '#e8a547', 4);
    oval(g, 1, -210, 3.3, 4.5, '#eac187');
  } else if (bag) {
    shape(
      g,
      'M-25 -223 Q-21 -243 -3 -243 Q17 -242 20 -221 L17 -205 L5 -202 L1 -217 L-9 -222 Z',
      hair,
    );
    shape(g, 'M-27 -225 Q-26 -248 -6 -252 Q19 -254 22 -229 L19 -220 Z', '#ae4b41');
    shape(g, 'M-27 -230 Q1 -228 22 -222 L21 -216 L-28 -223 Z', '#d6714c');
    shape(g, 'M-23 -204 Q-13 -201 -9 -202 Q-3 -204 3 -209 L1 -198 Q-11 -184 -20 -196 Z', hair);
  } else {
    for (const [hx, hy, r] of [
      [-17, -233, 11],
      [-6, -241, 12],
      [7, -239, 11],
      [16, -230, 11],
      [18, -217, 10],
      [11, -208, 7],
    ])
      oval(g, hx, hy, r, r, hair);
  }
  oval(g, -20, -213, 1.6, 1.8, ink);
  g.restore();
}

function serviceWindow(g, x, name, reading, signal) {
  g.save();
  g.translate(x, 0);
  // Two reveals of the masonry around the curved glass give the facade depth.
  shape(g, 'M-271 611 V420 Q-271 269 0 266 Q271 269 271 420 V611 Z', '#c66c59');
  shape(g, 'M-259 602 V424 Q-259 287 0 281 Q259 286 259 424 V602 Z', '#ffcd99');
  shape(g, 'M-244 593 V427 Q-244 300 0 297 Q244 300 244 427 V593 Z', '#5f4a52');
  const pane = 'M-228 583 V431 Q-228 319 0 315 Q228 319 228 431 V583 Z';
  g.save();
  g.clip(new Path2D(pane));
  box(
    g,
    -232,
    312,
    464,
    280,
    vertical(g, 312, 592, [
      [0, '#316872'],
      [0.65, '#76a99c'],
      [1, '#c9bb99'],
    ]),
  );
  for (let i = 0; i < 3; i++) {
    shape(g, `M${-240 + i * 195} 310 h25 l-150 300 h-25 Z`, '#c5e6c72c');
    shape(g, `M${-202 + i * 195} 310 h4 l-150 300 h-4 Z`, '#d9ead143');
  }
  line(g, -94, 313, -94, 586, '#477578', 7);
  line(g, 96, 313, 96, 586, '#477578', 7);
  // The half-round speaking port and pass-through tray belong to the glass.
  g.beginPath();
  g.arc(0, 565, 43, Math.PI, 2 * Math.PI);
  g.strokeStyle = '#e7c8a6';
  g.lineWidth = 5;
  g.stroke();
  box(g, -79, 568, 158, 9, '#55525a');
  g.restore();
  box(g, -265, 584, 530, 12, '#413749');
  shape(g, 'M-280 596 H279 L253 613 H-259 Z', '#ffdbac');
  box(g, -259, 613, 512, 11, '#ad6550');

  const screen = reading === null ? '#3e3640' : '#273442';
  box(g, -167, 381, 334, 112, '#446365');
  box(g, -170, 373, 334, 112, '#eac197');
  box(g, -162, 380, 318, 96, screen);
  box(g, -159, 383, 86, 90, '#3d4a51');
  label(g, name, -117, 429, 64, cream, 'Serif', 500);
  label(g, 'Count', -15, 427, 37, '#e5e4ce');
  g.save();
  g.globalAlpha *= signal;
  label(
    g,
    reading === null ? '–' : String(reading),
    94,
    430,
    83,
    reading === null ? '#f3b59e' : '#fbebba',
    'Sans',
    600,
  );
  g.restore();
  g.restore();
}

function pictureHouse(g, state, walk, seconds, signal) {
  box(
    g,
    -500,
    -350,
    2920,
    790,
    vertical(g, -130, 226, [
      [0, '#9aacc4'],
      [1, '#efc7a6'],
    ]),
  );
  // The canopy casts one shadow over both windows.
  box(
    g,
    -500,
    180,
    2920,
    516,
    vertical(g, 180, 689, [
      [0, '#be7267'],
      [0.36, '#e9a185'],
      [1, '#f1bb91'],
    ]),
  );
  for (let y = 299; y < 675; y += 73) {
    line(g, -290, y, 2220, y, '#d48e73', 2);
    for (let x = -230 + (((y - 299) / 73) % 2) * 122; x < 2220; x += 244)
      line(g, x, y, x, y + 72, '#da947a', 2);
  }
  for (let x of [-87, 960, 2007]) {
    box(g, x - 50, 225, 100, 468, '#d08972');
    box(g, x - 44, 225, 71, 468, '#f5c69c');
    for (let n = -22; n <= 16; n += 13) box(g, x + n, 248, 4, 415, '#dfa382');
  }
  box(g, -400, 658, 2720, 26, '#bd705b');
  box(g, -400, 676, 2720, 13, '#875656');
  for (const [i, x] of [493, 1427].entries())
    serviceWindow(g, x, i ? 'B' : 'A', state.readings[i], i === 1 ? signal : 1);
  // The splayed blue returns at each edge keep the footprint legible during the pullback.
  for (const x of [-259, 2179]) {
    box(g, x - 103, 225, 206, 450, '#2e4e5b');
    box(g, x - 90, 253, 180, 389, '#538080');
    shape(g, `M${x - 75} 269 h105 l-91 231 h-14 Z`, '#81a499');
    box(g, x - 6, 251, 9, 399, '#2e4e5b');
  }
  shape(g, 'M-315 59 L-176 24 H2096 L2235 59 L2187 187 L2103 224 H-181 L-267 187 Z', '#ab6059');
  shape(g, 'M-315 59 L-176 24 H2096 L2235 59 Z', '#fee7b7');
  box(
    g,
    -314,
    57,
    2548,
    114,
    vertical(g, 57, 171, [
      [0, '#fff1c5'],
      [0.55, '#ffe6ae'],
      [1, '#edc58f'],
    ]),
  );
  for (const x of [-300, 1392]) {
    for (let i = 0; i < 3; i++) {
      const a = x < 0 ? -300 : x + i * 37;
      const b = x < 0 ? 528 - i * 37 : 2231;
      box(g, a, 92 + i * 14, b - a, 4, '#c67661');
    }
  }
  label(g, 'T I C K E T S', 960, 113, 71, '#894c4d', 'Sans', 700);
  box(g, -324, 166, 2568, 10, '#965758');
  box(g, -319, 177, 2558, 7, '#f7be89');
  shape(g, 'M-313 184 H2233 L2104 229 H-184 Z', '#995758');
  for (let i = -4; i <= 22; i++) {
    const x = 40 + i * 94;
    oval(g, x, 202, 11, 5, '#f9d99d');
    oval(g, x, 201, 6, 3, '#fff1c1');
  }
  shape(g, 'M-182 229 H2104 L2092 243 H-173 Z', '#c57d69');

  box(
    g,
    -460,
    689,
    2840,
    248,
    vertical(g, 689, 925, [
      [0, '#ddad99'],
      [0.65, '#d7a99b'],
      [1, '#c59389'],
    ]),
  );
  for (let i = -8; i <= 14; i++)
    line(g, 960 + (i - 3) * 193, 689, 960 + (i - 3) * 353, 943, '#bc8c83', 2);
  for (const y of [718, 765, 836, 926]) line(g, -440, y, 2350, y, '#be8e83', 2);
  for (let i = 0; i < 210; i++) {
    const x = ((i * 359) % 2491) - 265,
      y = 692 + ((i * 67) % 229);
    line(g, x, y, x + 3 + (i % 7), y - 1, '#f1c6ac80', 2.4);
  }
  shape(g, 'M-400 689 H2340 V716 L-400 737 Z', '#7a5b6c23');
  // Paint on the floor marks the two queues. It stays put when the patron moves.
  for (const x of [493, 1427]) {
    shape(g, `M${x - 129} 708 h120 l16 5 h-138 Z`, '#f6dbb7');
    shape(g, `M${x - 94} 788 h176 l19 6 h-197 Z`, '#f6dbb7');
  }
  for (const person of crowd) patron(g, person, walk, seconds);
  box(g, -500, 924, 2920, 13, '#956660');
  box(g, -500, 924, 2920, 4, '#f3c4a6');
}

function output(g, x, name, reading, input, fill, flags) {
  g.save();
  g.translate(x, 0);
  // This is the perspective cut below the pavement. Each wire stays under its window.
  box(g, -3, 939, 6, 42, '#98bab0');
  oval(g, 0, 979, 7, 7, '#c1d1bb');
  label(g, name, -248, 1081, 56, '#a2b6ad', 'Serif', 500);
  line(g, -203, 1016, -203, 1138, '#6a8280', 2);
  const left = mix(24, -78, flags);
  label(g, 'Count', left, 1020, 47, '#f0e8d4');
  const digit = reading === null && fill < 0.5 ? '–' : input[0];
  const flip = reading === null ? Math.abs(Math.cos(Math.PI * fill)) : 1;
  g.save();
  g.translate(left, 1100);
  g.scale(1, Math.max(0.06, flip));
  label(g, String(digit), 0, 0, 99, cream, 'Mono', 500);
  g.restore();
  if (flags > 0) {
    g.globalAlpha = flags;
    line(g, 37, 1010, 37, 1142, '#688180', 2);
    label(g, 'Missing', 169, 1020, 47, '#f0e8d4');
    label(g, String(input[1]), 169, 1100, 99, input[1] ? '#ffae91' : '#b5caba', 'Mono', 500);
  }
  g.restore();
}

function draw(g, clock) {
  const { index, elapsed, seconds } = clock;
  const loss = index > 0 || elapsed >= 1.68;
  const signal =
    index > 0
      ? 1
      : loss
        ? ease((elapsed - 1.68) / 0.27)
        : (1 - ease((elapsed - 1.1) / 0.46)) *
          (1 - 0.55 * Math.max(0, 1 - Math.abs(elapsed - 0.32) / 0.14));
  const revealModel = index === 1 ? ease(elapsed / 2.05) : Number(index > 1);
  const fill = index === 2 ? ease(clock.reveal('We fill the blank', 0.72)) : Number(index > 2);
  const flags = index === 3 ? ease(clock.reveal('record whether', 1.05)) : Number(index > 3);
  const walk = index === 4 ? ease(clock.reveal('has spotted', 4.3)) : Number(index > 4);
  const state = snapshot(walk >= 0.985, loss);
  const scale = mix(1.13, 1.015, revealModel);
  box(g, 0, 0, 1920, 1080, '#273b46');
  g.save();
  g.translate(960, mix(43, -272, revealModel));
  g.scale(scale, scale);
  g.translate(-960, 0);
  pictureHouse(g, state, walk, seconds, signal);

  box(
    g,
    -500,
    937,
    2920,
    647,
    vertical(g, 937, 1378, [
      [0, '#304852'],
      [1, '#223541'],
    ]),
  );
  for (const [i, x] of [493, 1427].entries()) {
    output(g, x, i ? 'B' : 'A', state.readings[i], state.inputs[i], fill, flags);
  }
  label(g, 'Model inputs', 960, 978, 43, '#d7e1cd', 'Sans', 600);
  g.restore();
}

export default { title, beats, draw, check };
