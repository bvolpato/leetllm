import assert from 'node:assert/strict';

const title = 'Minutes from when?';

const beats = [
  {
    id: 'incoming',
    say: 'Watch the pager as the clock ticks. The assistant just took a minute off the deadline. What did it measure?',
    hold: 1.3,
  },
  {
    id: 'first-page',
    say: 'At nine o’clock the team declared a priority one incident. We gave the assistant that time and this runbook. The team has half an hour to send the first page. That puts it here, at nine thirty.',
    hold: 0.8,
  },
  {
    id: 'short-arc',
    say: 'Read the prompt on the tape. “Give the deadline in minutes.” Start at the minute hand and count around to the red mark. At nine twelve, eighteen is exactly how many minutes are left.',
    hold: 1,
  },
  {
    id: 'move-the-start',
    say: 'The deadline field needs the whole interval. Keep the same incident and the same rule. Add a starting point to the prompt. “From the P one declaration.” Follow that blue line back to nine o’clock.',
    hold: 0.8,
  },
  {
    id: 'read-the-field',
    say: 'Thirty matches this runbook. To find out whether those extra words help, try both prompts on the same unseen incidents. Check each answer against the rule for that incident.',
    hold: 0.8,
  },
  {
    id: 'another-minute',
    say: 'Advance the clock one more minute. Before the reply comes in, which number should change?',
    hold: 2.0,
  },
  {
    id: 'steady',
    say: 'Seventeen minutes left. The blue line still starts at nine. The deadline stays at thirty.',
    hold: 2.5,
  },
];

// IR-7 supplies the interval. The clock times place the original minute-12 fixture on a watch face.
const rule = { id: 'IR-7', declared: 9 * 60, limit: 30 };
const end = rule.declared + rule.limit;
const fromNow = (at) => end - at;
const fromDeclaration = () => end - rule.declared;
const clockLabel = (at) =>
  [Math.floor(at / 60), at % 60].map((n) => String(n).padStart(2, '0')).join(':');
const clamp = (p) => Math.max(0, Math.min(1, p));
const ease = (p) => {
  const t = clamp(p);
  return t * t * (3 - 2 * t);
};
const pi = Math.PI;
const tau = 2 * pi;
const C = {
  ink: '#272737',
  blue: '#363fb2',
  red: '#bf4329',
  lcd: '#2f363c',
  soft: '#696774',
  page: '#f7f2e5',
};

function eventState(clock) {
  const { index, elapsed, reveal } = clock;
  const firstTick = index === 0 ? ease((elapsed - 1.05) / 0.42) : 1;
  const nextTick = index < 5 ? 0 : index === 5 ? ease(reveal('Advance the clock', 0.8)) : 1;
  const minute = rule.declared + 11 + Math.round(firstTick) + Math.round(nextTick);
  const ink = index < 2 ? 0 : index === 2 ? ease(reveal('Start at the minute hand', 1.2)) : 1;
  const edit = index < 3 ? 0 : index === 3 ? ease(reveal('From the P one declaration', 1.1)) : 1;
  const pencilEnter = index === 3 ? ease(reveal('Add a starting point', 0.75)) : 0;
  const gesture = index === 3 ? reveal('Follow that blue line', 3.1) : 0;
  const trace = index < 3 ? 0 : index === 3 ? ease((gesture - 0.22) / 0.59) : 1;
  const awaitingEdit = index === 3 && edit > 0 && trace < 1;
  const awaitingTick = index === 5 && nextTick > 0;
  const value =
    awaitingEdit || awaitingTick ? null : trace === 1 ? fromDeclaration() : fromNow(minute);
  return {
    minute,
    dialMinute: rule.declared + 11 + firstTick + nextTick,
    ink,
    edit,
    trace,
    value,
    pencilEnter,
    gesture,
    redMark: index === 0 ? 0 : index === 1 ? ease(reveal('That puts it here', 0.4)) : 1,
    pullBack: index === 0 ? 0 : index === 1 ? ease(elapsed / 2.1) : 1,
    jolt: index === 0 ? Math.sin(46 * elapsed) * Math.exp(-4.4 * elapsed) * 10 : 0,
    lampOn:
      (index === 0 && (elapsed < 0.55 || (elapsed > 1.25 && elapsed < 1.78))) ||
      (index === 6 && elapsed < 0.55),
  };
}

function box(c, x, y, w, h, r, fill, stroke, weight = 1) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.lineWidth = weight;
    c.strokeStyle = stroke;
    c.stroke();
  }
}

function line(c, points, color, weight) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.strokeStyle = color;
  c.lineWidth = weight;
  c.stroke();
}

function polygon(c, points, color) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, tau);
  c.fillStyle = color;
  c.fill();
}

function text(c, value, x, y, size, color, family = 'Sans', weight = 400, align = 'left') {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.fillText(value, x, y);
}

function gradient(c, x0, y0, x1, y1, stops) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
}

function desktop(c) {
  c.fillStyle = gradient(c, 0, 0, 1680, 1080, [
    [0, '#e1daec'],
    [0.51, '#c3b9d8'],
    [1, '#a29dbb'],
  ]);
  c.fillRect(-400, -400, 2750, 2000);
  // Broad daylight falls across the woven blotter.
  polygon(
    c,
    [
      [-300, -100],
      [700, -100],
      [348, 1080],
      [-400, 1080],
    ],
    '#ffffff0e',
  );
  for (let n = 0; n < 450; n++) {
    const x = (n * 307 + 29) % 1927;
    const y = (n * 619 + Math.floor(n / 8) * 127) % 1087;
    line(
      c,
      [
        [x, y],
        [x + 3 + (n % 8), y - 0.8],
      ],
      '#48405b18',
      1.3,
    );
  }
}

function clockPaper(c) {
  c.save();
  c.translate(1058, 56);
  c.rotate(0.028);
  box(c, 12, 17, 845, 992, 6, '#5c506a48');
  box(c, 4, 10, 845, 988, 6, '#94899b');
  box(c, 2, 5, 845, 988, 6, '#e2d8bc');
  box(
    c,
    0,
    0,
    845,
    985,
    5,
    gradient(c, 0, 0, 780, 770, [
      [0, '#fffcf1'],
      [0.7, C.page],
      [1, '#eae2cf'],
    ]),
  );
  for (let i = 0; i < 13; i++) {
    const x = 55 + i * 61;
    dot(c, x, 25, 7.5, '#776e74');
    c.fillStyle = '#c3b6b2';
    c.fillRect(x - 1.7, 0, 3.4, 22);
  }
  text(c, 'On-call runbook', 68, 113, 42, C.ink, 'Serif');
  text(c, rule.id, 772, 111, 37, C.ink, 'Mono', 400, 'right');
  line(
    c,
    [
      [69, 139],
      [773, 139],
    ],
    '#59535d',
    2.5,
  );
  text(c, 'First page within 30 minutes', 68, 211, 48, C.ink, 'Serif');
  text(c, 'of P1 declaration.', 68, 267, 48, C.ink, 'Serif');
  c.restore();
}

function polar(cx, cy, r, minute) {
  const a = (minute * tau) / 60 - pi / 2;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arc(c, x, y, r, start, stop, color, w) {
  if (stop <= start) return;
  c.beginPath();
  c.arc(x, y, r, (start * tau) / 60 - pi / 2, (stop * tau) / 60 - pi / 2);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
}

function dial(c, s) {
  c.save();
  c.translate(1058, 56);
  c.rotate(0.028);
  const x = 347,
    y = 563,
    r = 177;
  const m = s.dialMinute % 60;
  text(c, 'Declared  ' + clockLabel(rule.declared), x, 334, 37, C.ink, 'Sans', 600, 'center');
  line(
    c,
    [
      [x, 345],
      [x, 368],
    ],
    '#615866',
    3,
  );
  dot(c, x, y, r + 5, '#d9d1ba');
  dot(c, x, y, r, '#fdfbf1');
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    line(
      c,
      [polar(x, y, r - 4, i), polar(x, y, r - (major ? 21 : 12), i)],
      major ? '#47404a' : '#9b9593',
      major ? 5 : 2,
    );
  }
  for (const [minute, n] of [
    [0, '12'],
    [15, '3'],
    [30, '6'],
    [45, '9'],
  ]) {
    const [tx, ty] = polar(x, y, r - 44, minute);
    text(c, n, tx, ty + 11, 35, C.soft, 'Sans', 600, 'center');
  }
  // The inner wash always measures from now. The blue stroke can acquire a fixed origin.
  if (s.ink > 0) {
    const stop = m + (rule.limit - m) * s.ink;
    c.beginPath();
    c.moveTo(x, y);
    c.arc(x, y, r - 27, (m * tau) / 60 - pi / 2, (stop * tau) / 60 - pi / 2);
    c.closePath();
    c.fillStyle = '#e65c393d';
    c.fill();
    arc(c, x, y, r - 25, m, stop, C.red, 9);
  }
  if (s.trace > 0) {
    const origin = rule.limit * (1 - s.trace);
    arc(c, x, y, r + 12, origin, rule.limit, C.blue, 13);
    dot(c, ...polar(x, y, r + 12, origin), 8, C.blue);
  }
  const hourOnDial = ((s.dialMinute / 60) % 12) * 5;
  const hours = polar(x, y, r * 0.49, hourOnDial);
  const minutes = polar(x, y, r * 0.79, m);
  c.lineCap = 'round';
  line(
    c,
    [
      [x + 1, y + 4],
      [hours[0] + 1, hours[1] + 4],
    ],
    '#706d7160',
    15,
  );
  line(
    c,
    [
      [x + 1, y + 4],
      [minutes[0] + 1, minutes[1] + 4],
    ],
    '#706d7160',
    8,
  );
  line(c, [[x, y], hours], C.ink, 14);
  line(c, [polar(x, y, 17, m + 30), minutes], C.ink, 8);
  dot(c, x, y, 12, C.ink);
  dot(c, x, y, 4, '#f1e6d3');
  c.save();
  c.globalAlpha = s.redMark;
  polygon(
    c,
    [
      [x, y + r + 1],
      [x - 11, y + r + 20],
      [x + 11, y + r + 20],
    ],
    C.red,
  );
  text(c, 'Due  ' + clockLabel(end), x, 811, 41, C.red, 'Sans', 600, 'center');
  c.restore();
  if (s.ink > 0) {
    c.save();
    c.globalAlpha = Math.min(1, s.ink * 2);
    const a = polar(x, y, r - 20, (m + rule.limit) / 2);
    line(c, [a, [552, a[1]], [572, a[1] - 14]], C.red, 2.7);
    text(c, fromNow(s.minute) + ' min', 585, a[1] - 10, 48, C.red, 'Sans', 600);
    text(c, 'left', 585, a[1] + 35, 38, C.red);
    c.restore();
  }
  c.restore();
}

// A fabric wrist loop sits behind the casing and disappears into its molded eyelet.
function wristLoop(c) {
  c.save();
  c.beginPath();
  c.moveTo(54, 265);
  c.bezierCurveTo(-4, 249, -7, 173, -123, 136);
  c.bezierCurveTo(-260, 89, -141, -41, -36, 7);
  c.bezierCurveTo(33, 37, -13, 115, 68, 246);
  c.lineCap = 'round';
  c.strokeStyle = '#5a506a42';
  c.lineWidth = 20;
  c.stroke();
  c.strokeStyle = '#322e59';
  c.lineWidth = 14;
  c.stroke();
  c.setLineDash([2, 5]);
  c.strokeStyle = '#aaa3d8';
  c.lineWidth = 7;
  c.stroke();
  c.restore();
}

const glyph = {
  0: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
};

function digital(c, value) {
  const pitch = 18;
  const digits = value === null ? [] : String(value).split('');
  for (let place = 0; place < 2; place++) {
    const rows = glyph[digits[place]];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        const on = rows?.[row][col] === '1';
        const x = 205 + (place * 6 + col) * pitch;
        const y = 208 + row * pitch;
        c.fillStyle = on ? '#27343a' : '#a9b3b0';
        c.fillRect(x, y, pitch - 1.5, pitch - 1.5);
      }
    }
  }
  if (value === null) {
    for (let i = 0; i < 3; i++) box(c, 252 + 34 * i, 263, 16, 16, 1, C.lcd);
  } else {
    text(c, 'min', 427, 319, 71, C.lcd, 'Mono');
  }
}

function pager(c, s) {
  c.save();
  c.translate(79 + s.jolt, 199);
  c.rotate(-0.058 + s.jolt * 0.00045);
  wristLoop(c);
  // Offset layers give the lower shell a seam and a warm contact shadow.
  for (let i = 5; i >= 1; i--) box(c, 11 + i * 3.7, 18 + i * 5.2, 878, 462, 91, '#4e39441a');
  box(c, 0, 13, 890, 466, 93, '#772f36');
  box(c, 0, 6, 888, 461, 91, '#bb4f37');
  box(
    c,
    0,
    0,
    886,
    460,
    88,
    gradient(c, 150, 0, 726, 452, [
      [0, '#ffd7a1'],
      [0.16, '#ffad70'],
      [0.48, '#fa8d53'],
      [0.86, '#ed7446'],
      [1, '#bc4a37'],
    ]),
    '#a85640',
    3,
  );
  // A faint inner lip and short injection ribs are visible through the apricot plastic.
  box(c, 8, 6, 869, 444, 83, null, '#ffdcac', 2.6);
  box(c, 19, 16, 848, 422, 76, null, '#b951392e', 4);
  for (let i = 0; i < 9; i++) {
    const x = 254 + i * 42;
    line(
      c,
      [
        [x, 16],
        [x - 5, 41],
      ],
      '#be503521',
      5,
    );
  }
  box(c, 10, 213, 43, 82, 20, '#973d38', '#ed8461', 4);
  box(c, 14, 223, 27, 58, 12, '#5b3540');
  line(
    c,
    [
      [-12, 232],
      [20, 249],
      [24, 263],
    ],
    '#3c365c',
    12,
  );
  c.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const sx = 769 + i * 13;
    line(
      c,
      [
        [sx, 42],
        [sx - 9, 63],
      ],
      '#b5563e',
      5,
    );
    line(
      c,
      [
        [sx + 3, 44],
        [sx - 6, 65],
      ],
      '#ffc58d',
      2.5,
    );
  }
  text(c, 'Sample reply', 70, 70, 36, '#653e3a', 'Sans', 600);
  box(c, 66, 93, 739, 265, 38, '#ffcb99');
  box(c, 68, 91, 736, 260, 37, '#a65541');
  box(c, 76, 96, 722, 249, 32, '#37333c');
  box(
    c,
    91,
    109,
    692,
    222,
    22,
    gradient(c, 112, 109, 712, 330, [
      [0, '#b1bab8'],
      [0.16, '#c7cfca'],
      [0.76, '#d6ddd4'],
      [1, '#b9c2bc'],
    ]),
  );
  c.save();
  c.beginPath();
  c.roundRect(91, 109, 692, 222, 22);
  c.clip();
  polygon(
    c,
    [
      [100, 105],
      [373, 105],
      [265, 337],
      [50, 337],
    ],
    '#ffffff12',
  );
  text(c, 'deadline_minutes', 122, 165, 38, C.lcd, 'Mono');
  text(c, clockLabel(s.minute), 753, 165, 39, C.lcd, 'Mono', 400, 'right');
  line(
    c,
    [
      [120, 183],
      [754, 183],
    ],
    '#758180',
    1.6,
  );
  c.translate(0, -8);
  digital(c, s.value);
  c.restore();

  // The two concave keys pick up the same window light as the casing.
  for (const [x, w] of [
    [610, 75],
    [707, 90],
  ]) {
    box(c, x, 378, w, 41, 18, '#b6513d');
    box(
      c,
      x + 1,
      373,
      w - 2,
      38,
      17,
      gradient(c, 0, 372, 0, 414, [
        [0, '#fff3cd'],
        [0.45, '#ffd197'],
        [1, '#efac75'],
      ]),
    );
  }
  polygon(
    c,
    [
      [639, 393],
      [653, 385],
      [653, 401],
    ],
    '#985e4a',
  );
  polygon(
    c,
    [
      [744, 383],
      [759, 391],
      [744, 399],
    ],
    '#985e4a',
  );
  for (let i = 0; i < 6; i++) box(c, 87 + i * 14, 390, 6, 21, 3, '#d67750');
  box(c, 193, 394, 38, 10, 5, s.lampOn ? '#ffebc1' : '#994b3f');
  c.restore();
}

function promptTape(c, s) {
  c.save();
  c.translate(89, 742);
  c.rotate(-0.016);
  const shape = [
    [0, 4],
    [853, 0],
    [848, 12],
    [858, 24],
    [852, 39],
    [857, 59],
    [850, 81],
    [858, 105],
    [849, 124],
    [857, 144],
    [850, 171],
    [4, 179],
    [9, 157],
    [-2, 134],
    [6, 117],
    [-2, 98],
    [4, 80],
    [-3, 56],
    [5, 40],
    [-1, 23],
  ];
  c.save();
  c.translate(4, 6);
  polygon(c, shape, '#6a586b34');
  c.restore();
  polygon(c, shape, '#fff5d7');
  line(
    c,
    [
      [18, 8],
      [831, 5],
    ],
    '#fffcf1',
    3,
  );
  text(c, 'Prompt', 33, 45, 34, '#65596d', 'Sans', 600);
  text(c, 'Give the deadline in minutes' + (s.edit > 0 ? '' : '.'), 32, 103, 45, C.ink, 'Mono');
  if (s.edit > 0) {
    c.save();
    c.beginPath();
    c.rect(31, 113, s.edit * 641, 59);
    c.clip();
    text(c, 'from the P1 declaration.', 33, 157, 44, C.blue, 'Mono');
    c.restore();
  }
  c.restore();
}

function chinagraph(c, s) {
  if (s.pencilEnter <= 0 || s.gesture === 1) return;
  const lift = ease(s.gesture / 0.22);
  const exit = ease((s.gesture - 0.81) / 0.19);
  // Follow the new ink across the tape, lift to the due mark, then trace the clock backward.
  const tapeX = 31 + s.edit * 641;
  const tipX = 89 + Math.cos(-0.016) * tapeX - Math.sin(-0.016) * 157;
  const tipY = 742 + Math.sin(-0.016) * tapeX + Math.cos(-0.016) * 157;
  const origin = rule.limit * (1 - s.trace);
  const [px, py] = polar(347, 563, 189, origin);
  const pageX = 1058 + px * Math.cos(0.028) - py * Math.sin(0.028);
  const pageY = 56 + px * Math.sin(0.028) + py * Math.cos(0.028);
  const x = tipX + (pageX - tipX) * lift + exit * 640;
  const y =
    tipY +
    (pageY - tipY) * lift -
    72 * Math.sin(pi * lift) +
    (1 - s.pencilEnter) * 330 -
    exit * 580;
  c.save();
  c.translate(x, y);
  c.rotate(0.72 * (1 - lift) + ((origin * tau) / 60 - pi / 2) * 0.31 * lift);
  polygon(
    c,
    [
      [5, 8],
      [44, -8],
      [338, -8],
      [348, 3],
      [347, 21],
      [43, 25],
    ],
    '#3c324d37',
  );
  polygon(
    c,
    [
      [0, 0],
      [41, -15],
      [325, -15],
      [337, -8],
      [337, 9],
      [325, 16],
      [41, 15],
    ],
    '#5d5ba7',
  );
  polygon(
    c,
    [
      [39, -15],
      [324, -15],
      [334, -8],
      [41, -5],
    ],
    '#a69fec',
  );
  polygon(
    c,
    [
      [41, 6],
      [336, 4],
      [335, 12],
      [325, 16],
      [40, 15],
    ],
    '#32346a',
  );
  polygon(
    c,
    [
      [0, 0],
      [40, -15],
      [46, -7],
      [39, -2],
      [45, 7],
      [40, 15],
    ],
    '#f3d5a7',
  );
  polygon(
    c,
    [
      [0, 0],
      [12, -4],
      [13, 4],
    ],
    C.blue,
  );
  for (let i = 0; i < 3; i++)
    line(
      c,
      [
        [295 + i * 6, -12],
        [295 + i * 6, 13],
      ],
      '#d0c9eb',
      1.8,
    );
  c.restore();
}

function draw(c, clock) {
  const s = eventState(clock);
  c.save();
  const zoom = 1 + 0.86 * (1 - s.pullBack);
  const centerX = 525 + (960 - 525) * s.pullBack;
  const centerY = 408 + (540 - 408) * s.pullBack;
  c.translate(960, 540);
  c.scale(zoom, zoom);
  c.translate(-centerX, -centerY);
  desktop(c);
  clockPaper(c);
  dial(c, s);
  promptTape(c, s);
  pager(c, s);
  chinagraph(c, s);
  c.restore();
}

function check() {
  assert.equal(clockLabel(end), '09:30');
  assert.deepEqual(
    [11, 12, 13].map((n) => fromNow(rule.declared + n)),
    [19, 18, 17],
  );
  assert.equal(fromDeclaration(), 30);
  const sample = (index, elapsed, reveal) => eventState({ index, elapsed, reveal });
  assert.equal(sample(0, 0, () => 0).value, 19);
  assert.equal(sample(0, 2, () => 1).value, 18);
  assert.equal(
    sample(3, 10, (phrase) => (phrase === 'Follow that blue line' ? 0.5 : 1)).value,
    null,
  );
  for (const [index, minute, value] of [
    [4, 12, 30],
    [5, 13, null],
    [6, 13, 30],
  ]) {
    const frame = sample(index, 8, () => 1);
    assert.equal(frame.minute, rule.declared + minute);
    assert.equal(frame.value, value);
  }
  assert.equal(fromNow(end), 0);
  return true;
}

export default { title, beats, draw, check };
