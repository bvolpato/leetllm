import assert from 'node:assert/strict';
import { request } from '../../../films/first-ai-app-end-to-end/fixtures.mjs';
import { createApp } from '../../../films/first-ai-app-end-to-end/model.mjs';

const beats = [
  {
    id: 'lost-reply',
    say: 'Luna clicks to check whether her service key is due for rotation. Watch the spot where the answer should appear.',
    hold: 1.15,
  },
  {
    id: 'under-the-window',
    say: "The connection dropped. From this page, Luna can't tell how far her request got. Slide the window aside. We can read the server's file.",
    hold: 0.85,
  },
  {
    id: 'saved-before-sending',
    say: "There's her first trace. Open it. Forty-five days old, and marked stale in the account record. Under policy P-seven a stale key qualifies at thirty days. The server checked the provider's answer against those facts and saved eligible before sending the reply.",
    hold: 0.95,
  },
  {
    id: 'same-report',
    say: 'Luna leaves the report exactly as she typed it. If she clicks again, will the app fetch that first answer?',
    hold: 1.7,
  },
  {
    id: 'one-more-row',
    say: "Watch the space under the first trace. There's a new row. The server calls the provider again and checks the answer for this second attempt.",
    hold: 0.85,
  },
  {
    id: 'which-trace',
    say: 'This reply reaches Luna. Match its trace to the file. She has the answer from her second check. The first answer is still one row up. To recover it, Luna would need an authorized lookup for that trace.',
    hold: 2.75,
  },
];

// Run both clicks through the lesson fixture. The browser loses only the first reply.
const app = createApp();
function submitReport() {
  const start = app.journal.length;
  const reply = app.check(request);
  const states = Object.fromEntries(app.journal.slice(start).map((frame) => [frame.event, frame]));
  return { reply, states };
}
const first = submitReport();
const second = submitReport();
const saved = 'completed saved';
const running = 'running saved';
const invoked = 'provider invoked';
const firstRecord = first.states[saved].trace;
const policy = first.states['candidate checked'].candidate;
// These are the two IDs the downloadable FastAPI app issued for the same two submissions.
const traceIds = new Map([
  [first.reply.body.trace_id, '3bc20ca134454efead946c26d653a440'],
  [second.reply.body.trace_id, '22b03a3f76c745cc89e3c88ceb0e9763'],
]);
const shortId = (id) => traceIds.get(id).slice(0, 5) + '…';

function check() {
  const rows = second.states[saved].rows;
  assert.deepEqual(
    rows.map((row) => row.id),
    ['T-001', 'T-002'],
  );
  assert.notEqual(shortId(rows[0].id), shortId(rows[1].id));
  for (const id of traceIds.values()) assert.match(id, /^[a-f0-9]{32}$/);
  assert.equal(rows[0].report_fingerprint, rows[1].report_fingerprint);
  assert.deepEqual(rows[0], firstRecord);
  assert.equal(firstRecord.facts.credential_age_days, 45);
  assert.equal(firstRecord.facts.key_stale, true);
  assert.equal(policy.rotation_window_days, 30);
  assert.deepEqual(policy.source_line_ids, ['P-7']);
  for (const run of [first, second]) {
    const started = run.states[running];
    assert.equal(started.trace.status, 'running');
    assert.equal(started.trace.result, null);
    assert.equal(run.states[invoked].providerCalls, started.providerCalls + 1);
    assert.equal(run.states[saved].trace.result.decision, 'eligible');
    assert.equal(run.reply.body.trace_id, run.states[saved].trace.id);
    assert.equal(run.reply.body.status, 'completed');
    assert.ok(
      Object.keys(run.states).indexOf(saved) < Object.keys(run.states).indexOf('response returned'),
    );
  }
  assert.equal(second.states[invoked].providerCalls, 2);
}

const ink = '#2e254a';
const violet = '#4b38aa';
const gold = '#f8ca64';
const paper = '#fff7e5';
const mint = '#b9f3ca';
const forest = '#164d3e';
const w = 770;
const dbX = 964;
const dbY = 176;
const browserLeft = 158;
const browserY = 183;

const clamp = (t) => Math.max(0, Math.min(1, t));
const smooth = (t) => ((t = clamp(t)), t * t * (3 - 2 * t));
const mix = (a, b, t) => a + (b - a) * t;

function box(c, x, y, width, height, fill, edge, radius = 0, weight = 3) {
  c.beginPath();
  if (radius) c.roundRect(x, y, width, height, radius);
  else c.rect(x, y, width, height);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = weight;
    c.stroke();
  }
}

function path(c, points, color) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

function gradient(c, y1, y2, stops) {
  const g = c.createLinearGradient(0, y1, 0, y2);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
}

function label(c, value, x, y, size, color = ink, font = 'Sans', weight = 400) {
  c.font = weight + ' ' + size + 'px "Lesson ' + font + '"';
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillStyle = color;
  c.fillText(value, x, y);
}

// A small indexed sprite stays sharp as the camera moves between the two windows.
const key = [
  '.....ooooooo....................',
  '...ooHHHHHHHoo..................',
  '..oHHHHHHHHHHHo.................',
  '.oHYYoooYYYYYYYo................',
  '.oHYo...oYYYYYYooooooooooooooo..',
  'oHYYo...oYYYYYYHHHHHHHHHHHHHHHo.',
  'oHYYYo.oYYYYYYYYYYYYYYYYYYYYYYYo',
  'oHYYYYoYYYYYYYYYYYYYYYYYYYYYYYSo',
  '.oHYYYYYYYYYYYSSSSSSooooYooYYYSo',
  '.oHYYYYYYYYYYSSoSSSSo..oSo.oSSSo',
  '..oSYYYYYYYSSSo.ooooo..ooo..ooo.',
  '...ooSSSSSSSoo..................',
  '.....ooooooo....................',
];
const keyColors = { o: ink, H: '#fff2a7', Y: gold, S: '#ec944c' };

function keyArt(c, x, y) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.12);
  const unit = 6.6;
  for (let row = 0; row < key.length; row++) {
    for (let col = 0; col < key[row].length; col++) {
      const color = keyColors[key[row][col]];
      if (color) {
        c.fillStyle = color;
        c.fillRect(col * unit, row * unit, unit + 0.6, unit + 0.6);
      }
    }
  }
  c.restore();
}

function desktop(c) {
  box(
    c,
    0,
    0,
    1920,
    1080,
    gradient(c, 0, 1080, [
      [0, '#f9dcae'],
      [0.78, '#f6bf91'],
      [1, '#a25f70'],
    ]),
  );
  // The front lip and low foot give the screen a fixed place on Luna's desk.
  path(
    c,
    [
      [680, 870],
      [1222, 870],
      [1275, 990],
      [626, 990],
    ],
    '#877da5',
  );
  box(c, 569, 978, 780, 38, '#66607e', null, 20);
  box(c, 578, 973, 762, 27, '#b3a0d1', '#9c89b7', 14);
  box(c, 49, 16, 1822, 924, '#706086', null, 69);
  box(
    c,
    39,
    7,
    1832,
    919,
    gradient(c, 4, 928, [
      [0, '#ece3ff'],
      [0.09, '#cbbdec'],
      [0.75, '#b6a2cf'],
      [1, '#a896bb'],
    ]),
    '#625471',
    66,
    5,
  );
  box(c, 65, 28, 1781, 812, '#a999bd', '#e6ddf3', 48, 4);
  box(c, 84, 47, 1742, 780, '#30293f', '#62516f', 38, 6);
  c.save();
  c.beginPath();
  c.roundRect(96, 58, 1718, 756, 30);
  c.clip();
  box(
    c,
    96,
    58,
    1718,
    756,
    gradient(c, 58, 790, [
      [0, '#7765bb'],
      [0.49, '#ba99c5'],
      [1, '#efb49a'],
    ]),
  );
  // Dithered dusk wallpaper is painted on the desktop, behind both applications.
  c.fillStyle = '#f4c7a0';
  c.beginPath();
  c.arc(460, 290, 111, 0, 2 * Math.PI);
  c.fill();
  c.fillStyle = '#bd9bb8';
  for (let j = 0; j < 7; j++) c.fillRect(341, 300 + j * 15, 238, 2 + j * 0.8);
  path(
    c,
    [
      [96, 642],
      [212, 608],
      [323, 572],
      [372, 557],
      [437, 574],
      [515, 515],
      [606, 465],
      [686, 445],
      [773, 489],
      [854, 471],
      [963, 420],
      [1179, 525],
      [1310, 510],
      [1535, 596],
      [1814, 530],
      [1814, 814],
      [96, 814],
    ],
    '#a18bb9',
  );
  path(
    c,
    [
      [96, 697],
      [284, 635],
      [446, 661],
      [622, 597],
      [740, 579],
      [861, 598],
      [989, 566],
      [1091, 520],
      [1194, 495],
      [1336, 561],
      [1487, 589],
      [1608, 555],
      [1814, 631],
      [1814, 814],
      [96, 814],
    ],
    '#7a74a5',
  );
  path(
    c,
    [
      [96, 751],
      [302, 722],
      [438, 701],
      [598, 724],
      [780, 677],
      [938, 631],
      [1057, 642],
      [1216, 608],
      [1377, 663],
      [1489, 629],
      [1676, 660],
      [1814, 620],
      [1814, 814],
      [96, 814],
    ],
    '#5c6590',
  );
  c.restore();
  // Diffuse daylight on translucent plastic, a speaker grille and a power light.
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 37; i++) {
      const x = 113 + i * 7.8;
      const y = 867 + j * 7;
      box(c, x, y, 3.4, 3.4, '#8a799c');
    }
  }
  box(c, 1739, 868, 15, 7, '#eeffe2', '#89799d', 3, 1.5);
  // A little of the keyboard enters the bottom of the wide shot.
  path(
    c,
    [
      [549, 1024],
      [1395, 1024],
      [1455, 1080],
      [488, 1080],
    ],
    '#a18fae',
  );
  path(
    c,
    [
      [553, 1021],
      [1390, 1021],
      [1447, 1072],
      [498, 1072],
    ],
    '#d9ccdf',
  );
  for (let j = 0; j < 2; j++)
    for (let i = 0; i < 16; i++) {
      const x = 559 + i * 51 - j * 11;
      const y = 1028 + j * 19;
      path(
        c,
        [
          [x, y],
          [x + 45, y],
          [x + 47, y + 13],
          [x - 4, y + 13],
        ],
        '#f1e8eb',
      );
    }
}

function chrome(c, x, y, height, title, active, body) {
  box(c, x + 8, y + 9, w, height, '#493b618c', null, 7);
  box(c, x, y, w, height, body, ink, 6, 4);
  box(c, x + 3, y + 3, w - 6, 66, active ? violet : '#675679');
  box(c, x + 21, y + 23, 24, 24, null, '#e7dbfa', 1, 3);
  box(c, x + 21, y + 27, 24, 3, '#e7dbfa');
  label(c, title, x + 64, y + 48, 36, '#fffbf3', 'Sans', 600);
  for (const dy of [24, 34, 44]) box(c, x + w - 82, y + dy, 56, 3, '#d9cbe6');
}

function browser(c, x, page, press, seconds, matched) {
  c.save();
  c.translate(x, browserY);
  chrome(c, 0, 0, 550, 'Luna’s browser', true, paper);
  box(c, 4, 70, w - 8, 150, '#f8ddae');
  keyArt(c, 40, 111);
  label(c, 'Rotation check', 285, 140, 53, ink, 'Serif');
  label(c, request.account_id, 288, 188, 32, '#625264', 'Mono');
  label(c, request.credential_report, 34, 283, 42, ink);
  const disabled = page === 'waiting';
  const offset = press * 5;
  if (!disabled) box(c, 37, 315, 299, 72, ink, null, 3);
  box(
    c,
    32 + offset,
    309 + offset,
    299,
    72,
    disabled ? '#e2dcd0' : '#d8cdf9',
    disabled ? '#bbb0ad' : ink,
    3,
    3.5,
  );
  label(c, 'Check policy', 60 + offset, 358 + offset, 39, disabled ? '#857985' : ink, 'Sans', 600);
  box(c, 4, 410, w - 8, 2, '#d4c5ba');
  if (page === 'waiting') {
    const cycle = Math.floor(seconds * 3.2) % 4;
    for (let i = 0; i < 4; i++) box(c, 36 + i * 16, 453, 12, 32, i === cycle ? violet : '#c7bbdc');
    label(c, 'Checking policy…', 130, 482, 46, '#594e73');
  } else if (page === 'lost') {
    box(c, 35, 439, 51, 51, '#f5a98a', ink, 4, 3);
    label(c, '!', 52, 478, 39, ink, 'Mono', 600);
    label(c, 'Request unavailable.', 109, 482, 48, '#783321', 'Sans', 600);
  } else if (page === 'received') {
    label(c, 'Eligible under ' + policy.source_line_ids[0] + '.', 34, 467, 49, forest, 'Sans', 600);
    box(c, 31, 483, 327, 54, matched ? mint : '#e1eddc', null, 2);
    label(c, 'Trace ' + shortId(second.reply.body.trace_id), 41, 522, 40, forest, 'Mono');
  } else {
    label(c, 'Ready.', 35, 482, 46, '#655c72');
  }
  c.restore();
}

function file(c, frame, detail, showRule, insert, matched) {
  c.save();
  c.translate(dbX, dbY);
  chrome(c, 0, 0, 548, 'Server inspector', false, '#fcfaef');
  label(c, 'Saved attempts', 30, 141, 57, ink, 'Serif');
  label(c, 'SQLite', 587, 138, 34, '#625264', 'Mono');
  box(c, 3, 164, w - 6, 58, '#e6e3da');
  label(c, 'Trace', 37, 206, 32, '#4f4958', 'Mono');
  label(c, 'Last saved', 364, 206, 32, '#4f4958', 'Mono');
  for (const [i, row] of frame.rows.entries()) {
    const y = 226 + i * 101;
    c.save();
    if (i === 1) {
      c.beginPath();
      c.rect(4, y, w - 8, 101 * insert);
      c.clip();
    }
    const completed = row.status === 'completed';
    box(c, 4, y, w - 8, 96, i === 1 && matched ? mint : '#fcfaef');
    box(c, 32, y + 22, 11, 45, completed ? '#438672' : gold);
    label(c, shortId(row.id), 62, y + 66, 48, ink, 'Mono');
    label(
      c,
      completed ? row.result.decision : 'running…',
      364,
      y + 66,
      50,
      completed ? forest : '#715b3f',
      completed ? 'Sans' : 'Serif',
      completed ? 600 : 400,
    );
    box(c, 25, y + 96, w - 50, 2, '#d8d7cb');
    c.restore();
  }
  if (detail > 0) {
    c.save();
    c.beginPath();
    c.rect(5, 323, w - 10, (77 + 77 * showRule) * detail);
    c.clip();
    box(c, 29, 323, w - 58, 151, '#e8eee1');
    box(c, 29, 323, 7, 151, '#438672');
    label(c, 'Account record', 51, 368, 30, '#536756');
    label(
      c,
      firstRecord.facts.credential_age_days + ' days old · stale',
      294,
      368,
      39,
      ink,
      'Sans',
      600,
    );
    label(c, 'P-7 minimum', 51, 436, 30, '#536756');
    label(c, policy.rotation_window_days + ' days if stale', 294, 436, 39, ink);
    c.restore();
  }
  box(c, 4, 484, w - 8, 60, '#e7e2ef');
  label(c, 'Provider calls', 30, 526, 36, '#544762', 'Mono');
  label(c, String(frame.providerCalls), 366, 529, 43, ink, 'Mono');
  c.restore();
}

function cursor(c, x, y, press) {
  c.save();
  c.translate(x, y);
  c.scale(1 - 0.08 * press, 1 - 0.08 * press);
  const shape = [
    [0, 0],
    [0, 46],
    [12, 35],
    [22, 56],
    [32, 51],
    [22, 31],
    [40, 30],
  ];
  c.translate(2, 3);
  path(c, shape, '#2e254a66');
  c.translate(-2, -3);
  path(c, shape, '#fffcf3');
  c.strokeStyle = ink;
  c.lineWidth = 4;
  c.lineJoin = 'round';
  c.stroke();
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed, seconds, reveal } = clock;
  const cue = (phrase, span) => smooth(reveal(phrase, span));
  const slide = index > 1 ? 1 : index === 1 ? cue('Slide the window aside', 1.35) : 0;
  const browserX = mix(dbX - 7, browserLeft, slide);
  const inspect = index === 2 ? cue('Open it', 1.25) : index === 3 ? 1 - smooth(elapsed / 1.25) : 0;
  const payoff = index === 5 ? cue('Match its trace', 1.05) : 0;
  const zoom = mix(1.48, 1, slide) + 0.56 * inspect + 0.13 * payoff;
  const focusX = mix(1280, 960, slide) + 350 * inspect;
  const focusY = mix(477, 540, slide) - 78 * inspect - 45 * payoff;
  let frame = first.states[saved];
  let page = 'lost',
    detail = 0,
    showRule = 0,
    insert = 1,
    matched = false;
  let press = 0;
  const button = [browserX + 272, browserY + 351];
  const handle = [browserX + 460, browserY + 39];
  const firstRow = [dbX + 592, dbY + 276];
  let mouse = button;
  if (index === 0) {
    press = 1 - smooth((elapsed - 0.13) / 0.42);
    page = elapsed < 0.14 ? 'ready' : cue('Watch the spot', 0.8) < 1 ? 'waiting' : 'lost';
  } else if (index === 1) {
    const grab = cue('how far her request got', 1.05);
    mouse = [mix(button[0], handle[0], grab), mix(button[1], handle[1], grab)];
  } else if (index === 2) {
    const select = cue("There's her first trace", 1);
    mouse = [mix(handle[0], firstRow[0], select), mix(handle[1], firstRow[1], select)];
    detail = cue('Open it', 0.46);
    showRule = cue('in the account record', 0.55);
  } else if (index === 3) {
    const back = smooth(elapsed / 0.9);
    detail = 1 - back;
    showRule = 1;
    mouse = [mix(firstRow[0], button[0], back), mix(firstRow[1], button[1], back)];
  } else if (index === 4) {
    press = 1 - smooth((elapsed - 0.12) / 0.43);
    page = elapsed < 0.14 ? 'lost' : 'waiting';
    insert = smooth((elapsed - 0.45) / 0.5);
    if (insert > 0) frame = second.states[running];
    if (cue('The server calls', 0.3) > 0) frame = second.states[invoked];
    if (cue('for this second attempt', 0.28) > 0) frame = second.states[saved];
  } else {
    frame = second.states[saved];
    page = elapsed < 0.24 ? 'waiting' : 'received';
    matched = cue('Match its trace', 0.35) > 0;
    const toReply = smooth((elapsed - 0.3) / 0.8);
    const toFile = cue('to the file', 1.2);
    const earlier = cue('The first answer', 0.65);
    mouse = [
      mix(mix(button[0], browserX + 351, toReply), dbX + 255, toFile),
      mix(mix(button[1], browserY + 528, toReply), dbY + 389, toFile) - earlier * 101,
    ];
  }
  c.save();
  // Paint the field outside the cropped monitor before applying the camera.
  box(c, 0, 0, 1920, 1080, '#f9dcae');
  c.translate(960, 540);
  c.scale(zoom, zoom);
  c.translate(-focusX, -focusY);
  desktop(c);
  file(c, frame, detail, showRule, insert, matched);
  browser(c, browserX, page, press, seconds, matched);
  cursor(c, mouse[0], mouse[1], press);
  c.restore();
}

export default { title: 'Which check came back?', beats, draw, check };
