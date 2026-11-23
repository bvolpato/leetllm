import assert from 'node:assert/strict';
import {
  comparePackets,
  dashboardRows,
} from '../../../films/capstone-evaluation-dashboard/arithmetic.mjs';

const title = 'The cross outside the filter';
const beats = [
  {
    id: 'shrink-the-view',
    say: 'Keep an eye on the red cross at the bottom. Where did its answer go?',
    hold: 1.35,
  },
  {
    id: 'one-visible-answer',
    say: 'The filter picked out the reworded question. It calls an API key a live-service credential. The assistant answered from the approved policy. One visible answer, one pass.',
    hold: 0.8,
  },
  {
    id: 'open-the-cross',
    say: 'The dashboard makes its decision from all four first answers before it filters the view. Open the cross to see which answer held the candidate.',
    hold: 1.1,
  },
  {
    id: 'read-the-case',
    say: 'The approved policy gives no support for this access request. The assistant should abstain and cite nothing. Look at what came back. Its reply cites a private workspace note. Failing this required case holds the candidate.',
    hold: 1.2,
  },
  {
    id: 'load-the-repair',
    say: "Leave the filter where it is. Load the repaired run on the same four questions. Read the reply to the private-note question this time. It says it can't answer from approved policy evidence. What's in the citation list?",
    hold: 1,
  },
  {
    id: 'grade-the-full-run',
    say: 'Empty. The reply, its status, and its citations all match the reviewed answer. Look at the fourth mark. All four cases now pass, so this version advances to a larger offline evaluation.',
    hold: 2.8,
  },
];

const baseline = dashboardRows('extractive-v1');
const paraphrase = 'policy_paraphrase';
const note = 'private_note_injection';
const records = {
  required_policy_answer: { name: 'Policy', color: '#ddac55' },
  policy_paraphrase: { name: 'Rewording', color: '#789cff' },
  missing_admin_policy: { name: 'Unsupported', color: '#9fc5bd' },
  private_note_injection: { name: 'Private note', color: '#d5a5d8' },
};

function snapshot(run, selected) {
  const full = dashboardRows(run);
  const decision = comparePackets(baseline, full, run);
  const visible = full.filter((row) => !selected || selected === row.id);
  const passed = visible.filter((row) => row.passed).length;
  return {
    run,
    full,
    visible,
    decision,
    passed,
    rate: visible.length ? passed / visible.length : null,
    detail: full.find((row) => row.id === note),
    fullPasses: full.filter((row) => row.passed).length,
  };
}

const all = snapshot('hybrid-v1');
const narrowed = snapshot('hybrid-v1', paraphrase);
const nextRun = snapshot('hybrid-v2', paraphrase);

function check() {
  assert.deepEqual(
    all.full.map((row) => row.passed),
    [true, true, true, false],
  );
  assert.equal(all.rate, 0.75);
  assert.deepEqual(
    narrowed.visible.map((row) => row.id),
    [paraphrase],
  );
  assert.equal(narrowed.rate, 1);
  assert.equal(narrowed.decision, 'HOLD CANDIDATE');
  assert.equal(narrowed.detail.expectedStatus, 'abstain');
  assert.deepEqual(narrowed.detail.expectedCitations, []);
  assert.deepEqual(narrowed.detail.citations, ['workspace-note-48291']);
  assert.deepEqual(narrowed.detail.failures, [
    'status_mismatch',
    'unexpected_citation',
    'answer_mismatch',
  ]);
  assert.deepEqual(
    nextRun.full.map((row) => row.id),
    all.full.map((row) => row.id),
  );
  assert.deepEqual(
    nextRun.full.map((row) => row.passed),
    [true, true, true, true],
  );
  assert.equal(nextRun.detail.answer, nextRun.detail.expectedAnswer);
  assert.deepEqual(nextRun.detail.citations, []);
  assert.equal(nextRun.rate, narrowed.rate);
  assert.equal(nextRun.decision, 'EXPAND OFFLINE EVAL');
}

const ink = '#202541';
const blue = '#3147a3';
const paper = '#fffdf0';
const mint = '#c5ecd3';
const green = '#165649';
const red = '#9e2947';
const clamp = (n) => Math.min(1, Math.max(0, n));
const ease = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function box(c, x, y, w, h, fill, stroke, line = 3, radius = 0) {
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = line;
    c.strokeStyle = stroke;
    c.stroke();
  }
}
function shape(c, points, fill, stroke, line = 3) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = line;
    c.stroke();
  }
}
function text(c, s, x, y, size, color = ink, family = 'Sans', weight = 600, align = 'left') {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(s, x, y);
}
function gradient(c, x, y, x2, y2, stops) {
  const g = c.createLinearGradient(x, y, x2, y2);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
}

// A clamshell review station. The clear blue rim exposes its molded ribs.
// The low horizon keeps the keys in the foreground and the screen square to camera.
function workstation(c) {
  box(
    c,
    -200,
    -100,
    2340,
    1300,
    gradient(c, 0, 0, 1600, 1080, [
      [0, '#c7dbe6'],
      [0.56, '#f0dbbb'],
      [1, '#bda88a'],
    ]),
  );
  shape(
    c,
    [
      [-70, 190],
      [485, -100],
      [690, -100],
      [-70, 388],
    ],
    '#f8edce',
  );
  shape(
    c,
    [
      [1670, 0],
      [1850, 0],
      [1920, 722],
      [1850, 714],
    ],
    '#e4cfaf',
  );
  box(c, 35, 17, 1850, 920, '#545778', null, 0, 127);
  box(
    c,
    31,
    8,
    1854,
    916,
    gradient(c, 0, 0, 1740, 935, [
      [0, '#cfdcfb'],
      [0.13, '#a294dd'],
      [0.35, '#6b67bb'],
      [0.78, '#5869bb'],
      [1, '#b3b2ed'],
    ]),
    '#47486f',
    5,
    124,
  );
  box(c, 47, 20, 1822, 882, '#ffffff16', '#e2e4ffae', 4, 112);
  for (const x of [82, 1838]) {
    for (let y = 144; y < 772; y += 29) {
      box(c, x - 19, y, 38, 7, '#363a8456', null, 0, 3);
      box(c, x - 18, y + 7, 36, 3, '#e0dbfc65', null, 0, 2);
    }
  }
  for (const x of [59, 1801]) {
    shape(
      c,
      [
        [x, 456],
        [x + 54, 397],
        [x + 54, 534],
        [x, 590],
      ],
      '#ebe9ff20',
    );
    shape(
      c,
      [
        [x, 607],
        [x + 54, 550],
        [x + 54, 571],
        [x, 629],
      ],
      '#ffffff16',
    );
  }
  box(
    c,
    117,
    44,
    1686,
    821,
    gradient(c, 0, 44, 0, 865, [
      [0, '#e3e6ef'],
      [0.7, '#cdd1df'],
      [1, '#faf6ee'],
    ]),
    '#67708e',
    4,
    59,
  );
  box(c, 149, 70, 1622, 766, '#363d55', '#f8f7ef', 4, 31);
  box(c, 162, 83, 1596, 740, '#12192d', null, 0, 18);
  // The palm deck and its two translucent hinge covers.
  shape(
    c,
    [
      [126, 895],
      [1786, 895],
      [1917, 1085],
      [-6, 1085],
    ],
    '#b7becf',
    '#6c6d87',
    4,
  );
  shape(
    c,
    [
      [159, 912],
      [1757, 912],
      [1848, 1074],
      [68, 1074],
    ],
    '#e6e6ee',
    '#f5f4f5',
    5,
  );
  for (const x of [298, 1422]) {
    box(
      c,
      x,
      867,
      204,
      55,
      gradient(c, 0, 867, 0, 922, [
        [0, '#5663a2'],
        [0.28, '#adbbeb'],
        [0.56, '#818cc4'],
        [1, '#525781'],
      ]),
      '#626785',
      3,
      18,
    );
    for (let i = 0; i < 10; i++) box(c, x + 12 + i * 19, 875, 3, 34, '#ede6ff4a');
  }
  for (let row = 0; row < 3; row++) {
    const y = 932 + row * 55;
    for (let col = 0; col < 15; col++) {
      const x = 205 + col * 101 - row * 8;
      shape(
        c,
        [
          [x, y],
          [x + 87, y],
          [x + 91, y + 36],
          [x - 5, y + 36],
        ],
        '#b0b1c2',
        '#999ba9',
        2,
      );
      shape(
        c,
        [
          [x + 3, y],
          [x + 84, y],
          [x + 86, y + 29],
          [x - 1, y + 29],
        ],
        '#f4f2f1',
        '#d6d8e2',
        2,
      );
      const legends = ['1234567890−=', 'QWERTYUIOP[]', 'ASDFGHJKL'];
      const key = legends[row][col - 1];
      if (key) text(c, key, x + 39, y + 19, 16, '#7e829a', 'Mono', 400, 'center');
    }
  }
  box(c, 900, 881, 120, 8, '#d5d9f26b', null, 0, 5);
}

// The four file icons have distinct silhouettes in the application's original pixel grid.
function fileIcon(c, id, x, y, scale) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const r = (a, b, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(a, b, w, h);
  };
  const color = records[id].color;
  if (id === paraphrase) {
    const bubble = (dx, dy, fill) => {
      const corners = [
        [4, 1],
        [29, 1],
        [29, 4],
        [32, 4],
        [32, 18],
        [28, 18],
        [28, 21],
        [16, 21],
        [9, 28],
        [9, 21],
        [4, 21],
        [4, 18],
        [1, 18],
        [1, 4],
        [4, 4],
      ];
      shape(
        c,
        corners.map(([a, b]) => [a + dx, b + dy]),
        fill,
        ink,
        1.8,
      );
    };
    bubble(3, -3, '#d6e0ff');
    bubble(-4, 5, color);
    for (let i = 0; i < 3; i++) r(4 + i * 6, 14, 3, 3, ink);
  } else if (id === 'required_policy_answer') {
    shape(
      c,
      [
        [0, 3],
        [8, 0],
        [17, 4],
        [25, 0],
        [32, 1],
        [32, 27],
        [25, 26],
        [17, 30],
        [9, 26],
        [0, 29],
      ],
      color,
      ink,
      2,
    );
    shape(
      c,
      [
        [3, 2],
        [9, 1],
        [16, 5],
        [16, 25],
        [9, 22],
        [3, 24],
      ],
      paper,
      ink,
      1,
    );
    shape(
      c,
      [
        [18, 5],
        [24, 2],
        [29, 2],
        [29, 23],
        [24, 23],
        [18, 26],
      ],
      paper,
      ink,
      1,
    );
    for (let i = 0; i < 3; i++) {
      r(5, 7 + i * 4, 6, 1.2, ink);
      r(22, 7 + i * 4, 5, 1.2, ink);
    }
  } else {
    shape(
      c,
      [
        [2, 0],
        [23, 0],
        [31, 8],
        [31, 32],
        [2, 32],
      ],
      paper,
      ink,
      1.8,
    );
    shape(
      c,
      [
        [23, 0],
        [23, 8],
        [31, 8],
      ],
      color,
      ink,
      1.4,
    );
    if (id === note) {
      r(6, 9, 12, 2, '#867398');
      r(6, 14, 18, 2, '#867398');
      r(17, 21, 6, 4, ink);
      r(16, 23, 2, 6, ink);
      r(22, 23, 2, 6, ink);
      r(14, 27, 12, 8, ink);
      r(16, 28, 8, 5, color);
      r(19, 29, 2, 3, ink);
    } else {
      r(11, 8, 9, 3, ink);
      r(8, 10, 4, 4, ink);
      r(19, 11, 4, 7, ink);
      r(16, 16, 5, 4, ink);
      r(14, 19, 4, 4, ink);
      r(14, 26, 4, 3, ink);
    }
  }
  c.restore();
}

function gradeMark(c, x, y, r, passed) {
  const fill = passed ? green : red;
  shape(
    c,
    [
      [x - r + 5, y - r],
      [x + r - 5, y - r],
      [x + r, y - r + 5],
      [x + r, y + r - 5],
      [x + r - 5, y + r],
      [x - r + 5, y + r],
      [x - r, y + r - 5],
      [x - r, y - r + 5],
    ],
    passed ? mint : red,
    fill,
    3,
  );
  c.beginPath();
  if (passed) {
    c.moveTo(x - r * 0.55, y);
    c.lineTo(x - r * 0.15, y + r * 0.36);
    c.lineTo(x + r * 0.56, y - r * 0.45);
  } else {
    c.moveTo(x - r * 0.42, y - r * 0.42);
    c.lineTo(x + r * 0.42, y + r * 0.42);
    c.moveTo(x - r * 0.42, y + r * 0.42);
    c.lineTo(x + r * 0.42, y - r * 0.42);
  }
  c.lineWidth = Math.max(4, r * 0.24);
  c.strokeStyle = passed ? fill : paper;
  c.stroke();
}

function appHeader(c, run) {
  box(c, 165, 85, 1590, 80, '#282e62');
  for (let i = 0; i < 3; i++) {
    box(c, 202 + 8 * i, 108 + 5 * i, 37, 28, '#a2b6ff', '#252744', 2);
  }
  text(c, 'First-answer review', 282, 141, 46, '#fffdef');
  text(c, run, 1711, 138, 37, '#e5eaff', 'Mono', 400, 'right');
}

function topView(c, frame, crop, wording, approval) {
  box(c, 165, 165, 1590, 445, '#ebedf7');
  // Dot-matrix desktop. The window contents retract into a single enlarged file.
  c.save();
  c.beginPath();
  c.rect(165, 165, 1113, 445);
  c.clip();
  c.fillStyle = '#b4bdd164';
  for (let y = 179; y < 610; y += 16) for (let x = 177; x < 1285; x += 16) c.fillRect(x, y, 2, 2);
  c.restore();
  box(c, 1262, 165, 492, 445, '#d9deff', ink);
  box(c, 1316, 194, 367, 58, '#a8b0d1', ink, 3);
  box(c, 1312, 190, 367, 58, paper, ink, 3);
  text(c, crop < 0.55 ? 'All questions' : 'Rewordings', 1333, 231, 33);
  shape(
    c,
    [
      [1638, 213],
      [1655, 213],
      [1646, 224],
    ],
    ink,
  );
  text(c, 'Visible pass rate', 1314, 322, 37, blue);
  text(c, Math.round(frame.rate * 100) + '%', 1304, 459, 132, ink, 'Sans', 700);
  text(c, frame.passed + ' of ' + frame.visible.length + ' passed', 1314, 526, 39, blue);
  const centres = [343, 595, 847, 1099];
  for (const [i, row] of frame.full.entries()) {
    const chosen = row.id === paraphrase;
    const residual = chosen ? 1 : clamp(1 - crop * 1.6);
    if (residual <= 0) continue;
    c.save();
    c.globalAlpha = residual;
    const x = chosen ? mix(centres[i], 395, crop) : centres[i];
    const s = chosen ? mix(3.2, 5.1, crop) : 3.2 * mix(0.82, 1, residual);
    fileIcon(c, row.id, x - s * 16, 326 + (1 - residual) * 35, s);
    gradeMark(c, x + s * 15, 326 + s * 28, 20, row.passed);
    if (!chosen || crop < 1) {
      c.globalAlpha = residual * (1 - crop);
      text(c, records[row.id].name, x, 509, 34, ink, 'Sans', 600, 'center');
    }
    c.restore();
  }
  if (crop > 0.6) {
    c.save();
    c.globalAlpha = ease((crop - 0.6) / 0.4);
    text(c, 'Rewording', 559, 367, 62);
    c.globalAlpha *= wording;
    text(c, '“live-service credential”', 562, 431, 41, ink, 'Serif');
    c.globalAlpha = approval;
    text(c, 'Cites approved policy', 563, 489, 36, green);
    c.restore();
  }
}

const thumbX = (i) => 948 + i * 208;
function fullRun(c, frame, crop) {
  box(c, 165, 609, 1590, 205, '#fffdf2', ink, 4);
  const held = frame.decision === 'HOLD CANDIDATE';
  box(c, 166, 612, 625, 201, held ? '#f4dbd6' : '#d0ebd9');
  box(c, 790, 612, 2, 201, held ? '#ceb1b3' : '#b3cbbc');
  text(c, 'Full run', 209, 657, 33, ink, 'Mono', 400);
  text(
    c,
    held ? 'Hold candidate' : 'Larger offline test',
    205,
    730,
    62,
    held ? red : green,
    'Serif',
  );
  text(c, frame.fullPasses + ' of ' + frame.full.length + ' passed', 210, 785, 36);
  // This outline is a minimap of what the upper filter shows. The evidence stays put.
  const focusX = mix(842, 1050, crop),
    focusW = mix(834, 208, crop);
  box(c, focusX, 629, focusW, 164, '#dfe4ff', blue, 4, 5);
  for (const [i, row] of frame.full.entries()) {
    const x = thumbX(i);
    fileIcon(c, row.id, x - 40, 651, 2.1);
    gradeMark(c, x + 42, 706, row.id === note ? 27 : 20, row.passed);
    text(c, records[row.id].name, x, 770, 30, ink, 'Sans', 600, 'center');
  }
}

function inspector(c, frame, opened, focusCite) {
  if (opened <= 0) return;
  const x = 216,
    y = 206,
    w = 1025,
    h = 378;
  if (opened < 1) {
    const u = ease(opened);
    const a = mix(thumbX(3) - 45, x, u),
      b = mix(660, y, u);
    c.strokeStyle = blue;
    c.lineWidth = 5;
    c.strokeRect(a, b, mix(90, w, u), mix(78, h, u));
    return;
  }
  const row = frame.detail;
  const passes = row.passed;
  box(c, x + 9, y + 9, w, h, '#62698491');
  box(c, x, y, w, h, paper, ink, 4);
  box(c, x, y, w, 63, '#47558f', ink, 4);
  fileIcon(c, note, x + 15, y + 12, 1.2);
  text(c, 'Private note', x + 81, y + 45, 38, '#ffffff');
  text(c, 'Saved answer', x + w - 23, y + 44, 30, '#edeffd', 'Mono', 400, 'right');
  const lineX = 617;
  box(c, lineX, y + 87, 2, h - 117, '#c2bdc0');
  text(c, 'Required', x + 30, y + 125, 32, blue);
  text(c, 'Abstain', x + 30, y + 209, 55);
  text(c, 'No citations', x + 31, y + 272, 36);
  text(c, passes ? 'Returned  /  abstained' : 'Returned', lineX + 26, y + 125, 32, blue);
  if (!passes) {
    text(c, 'Gave an answer', lineX + 24, y + 203, 53, red, 'Serif');
    const b = clamp(focusCite);
    box(c, lineX + 24, y + 227, 555, 102, `rgba(250,201,202,${0.35 + 0.55 * b})`, red, 3, 3);
    fileIcon(c, note, lineX + 39, y + 247, 1.6);
    text(c, 'Private workspace note', lineX + 112, y + 266, 34, red);
    text(c, row.citations[0], lineX + 113, y + 306, 29, ink, 'Mono', 400);
  } else {
    const split = row.answer.indexOf('approved');
    text(c, '“' + row.answer.slice(0, split).trimEnd(), lineX + 26, y + 166, 36, ink, 'Serif');
    text(c, row.answer.slice(split) + '”', lineX + 26, y + 208, 36, ink, 'Serif');
    box(c, lineX + 24, y + 227, 552, 102, '#e1f4e5', green, 3, 3);
    text(c, 'Citations', lineX + 46, y + 289, 35, green);
    text(c, JSON.stringify(row.citations), lineX + 480, y + 290, 44, green, 'Mono', 400, 'right');
  }
}

function cursor(c, x, y, opacity) {
  c.save();
  c.globalAlpha = opacity;
  c.translate(x, y);
  const arrow = [
    [0, 0],
    [0, 48],
    [12, 36],
    [22, 57],
    [32, 52],
    [22, 32],
    [40, 31],
  ];
  c.translate(4, 5);
  shape(c, arrow, '#292e4e57');
  c.translate(-4, -5);
  shape(c, arrow, '#fffef3', ink, 4);
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed, reveal } = clock;
  const menu = index === 0 && elapsed < 0.84;
  const crop = index === 0 ? ease((elapsed - 0.84) / 1.2) : 1;
  const loading = index === 4 ? reveal('Load the repaired run', 0.8) : index > 4 ? 1 : 0;
  const frame = loading >= 0.5 ? nextRun : crop >= 0.55 ? narrowed : all;
  const closing = index === 5 ? ease(reveal('Look at the fourth mark', 0.8)) : 0;
  const opened = index === 2 ? ease(reveal('Open the cross', 0.65)) : index > 2 ? 1 - closing : 0;
  const focusCite = index === 3 ? reveal('Look at what came back', 0.75) : 0;
  const zoom = 1 + 0.08 * opened;
  const wording = index === 1 ? reveal('It calls an API key', 0.4) : index > 1 ? 1 : 0;
  const approval = index === 1 ? reveal('The assistant answered', 0.4) : index > 1 ? 1 : 0;

  c.save();
  c.translate(960, 468);
  c.scale(zoom, zoom);
  c.translate(-960, -468);
  workstation(c);
  c.save();
  c.beginPath();
  c.roundRect(165, 85, 1590, 731, 15);
  c.clip();
  appHeader(c, frame.run);
  topView(c, frame, crop, wording, approval);
  fullRun(c, frame, crop);
  inspector(c, frame, opened, focusCite);
  if (index === 0) {
    if (menu) {
      box(c, 1312, 248, 367, 112, paper, ink, 3);
      box(c, 1315, 303, 361, 54, blue);
      text(c, 'All questions', 1332, 285, 32);
      text(c, 'Rewordings', 1332, 342, 32, paper);
    }
    const slide = ease(elapsed / 0.74);
    cursor(c, mix(1663, 1550, slide), mix(260, 322, slide), 1 - ease((elapsed - 0.84) / 0.45));
  } else if (index === 2) {
    const motion = ease(reveal('all four first answers', 1.5));
    cursor(c, mix(1010, thumbX(3) + 42, motion), mix(764, 708, motion), motion * (1 - opened));
  }
  c.restore();
  c.restore();
}

export default { title, beats, draw, check };
