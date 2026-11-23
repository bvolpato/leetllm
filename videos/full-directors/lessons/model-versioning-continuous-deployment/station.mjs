import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const hash = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const journey = Object.freeze({ destination: 'Harbor Point', hour: 17, minute: 30 });
const model = 'travel-v1';
const templates = Object.freeze({ 12: 'h:mm a', 24: 'HH:mm' });

function retain(id, format) {
  const image = JSON.stringify({ model, compiledTemplate: templates[format] });
  return Object.freeze({ id, image, digest: hash(image) });
}

const r1 = retain('R1', 12);
const r2 = retain('R2', 24);

function load(record) {
  assert.equal(hash(record.image), record.digest, 'The saved image must match its pin');
  return Object.freeze({ ...JSON.parse(record.image), release: record.id });
}

function printTicket(worker, train) {
  const { hour, minute, destination } = train;
  const minutes = String(minute).padStart(2, '0');
  const time =
    worker.compiledTemplate === templates[12]
      ? (hour % 12 || 12) + ':' + minutes + (hour >= 12 ? ' PM' : ' AM')
      : String(hour).padStart(2, '0') + ':' + minutes;
  return Object.freeze({ destination, time, servedBy: worker.release, model: worker.model });
}

const initialWorker = load(r2);
const initial = { source: templates[24], worker: initialWorker };
const restoredSource = { ...initial, source: templates[12] };
const rolledBack = { ...restoredSource, worker: load(r1) };
const first = printTicket(initial.worker, journey);
const reprint = printTicket(restoredSource.worker, journey);
const finalPrint = printTicket(rolledBack.worker, journey);

function check() {
  assert.notEqual(initial.source, restoredSource.source);
  assert.equal(restoredSource.worker, initial.worker);
  assert.deepEqual(first, reprint);
  assert.equal(reprint.time, '17:30');
  assert.equal(reprint.servedBy, 'R2');
  assert.notEqual(r1.digest, r2.digest);
  assert.throws(() => load({ ...r1, image: r2.image }));
  assert.equal(finalPrint.model, reprint.model);
  assert.equal(finalPrint.destination, reprint.destination);
  assert.equal(finalPrint.time, '5:30 PM');
  assert.equal(finalPrint.servedBy, 'R1');
}

const ink = '#193842';
const navy = '#304f62';
const red = '#a7392c';
const clamp = (t) => Math.max(0, Math.min(1, t));
function smooth(t) {
  t = clamp(t);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, t) => a + (b - a) * t;

function frame(ctx, x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

function shape(ctx, color, points) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const pair of points.slice(1)) ctx.lineTo(...pair);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function stroke(ctx, color, width, points) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const pair of points.slice(1)) ctx.lineTo(...pair);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function label(ctx, value, x, y, size, color = ink, family = 'Sans', weight = 500) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillText(value, x, y);
}

function wash(ctx, x, y, u, v, stops) {
  const gradient = ctx.createLinearGradient(x, y, u, v);
  for (const [at, color] of stops) gradient.addColorStop(at, color);
  return gradient;
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function coast(ctx) {
  ctx.fillStyle = wash(ctx, 0, 0, 0, 282, [
    [0, '#9ecad2'],
    [0.71, '#e3e9d7'],
    [1, '#f0ddbd'],
  ]);
  ctx.fillRect(0, 0, 1920, 330);
  ellipse(ctx, 733, 71, 37, 37, '#ffe6b1');
  ctx.fillStyle = '#a0c4c1';
  ctx.fillRect(0, 158, 1920, 102);
  shape(ctx, '#7c9fa0', [
    [0, 111],
    [162, 123],
    [235, 140],
    [328, 147],
    [360, 159],
    [475, 168],
    [0, 170],
  ]);
  shape(ctx, '#6d9093', [
    [790, 175],
    [905, 153],
    [989, 150],
    [1031, 132],
    [1069, 129],
    [1112, 116],
    [1250, 119],
    [1377, 143],
    [1552, 154],
    [1631, 177],
  ]);
  for (let i = 0; i < 19; i++) {
    const x = (i * 177) % 1880,
      y = 172 + ((i * 23) % 44);
    stroke(ctx, '#cfdbce', 3, [
      [x, y],
      [x + 36 + (i % 5) * 9, y],
    ]);
  }
  // A distant platform roof and its cast-iron brackets frame the view through the booth.
  shape(ctx, '#536e73', [
    [0, 0],
    [548, 0],
    [0, 76],
  ]);
  stroke(ctx, '#8b9c94', 6, [
    [0, 81],
    [549, 4],
  ]);
  for (const x of [78, 948, 1818]) {
    frame(ctx, x, -24, 22, 264, 0, '#647f80');
    frame(ctx, x + 2, -24, 6, 264, 0, '#9daea3');
    stroke(ctx, '#688184', 9, [
      [x + 14, 62],
      [x + 84, 0],
    ]);
  }
  frame(ctx, 0, 224, 1920, 20, 0, '#5e6e6d');
  frame(ctx, 0, 244, 1920, 28, 0, '#acc1b9');
}

function counter(ctx) {
  ctx.fillStyle = wash(ctx, 300, 258, 1540, 1090, [
    [0, '#b6ceca'],
    [0.51, '#d7dfce'],
    [1, '#dfd7b9'],
  ]);
  ctx.fillRect(0, 268, 1920, 812);
  shape(ctx, '#dce3cf', [
    [0, 484],
    [902, 268],
    [1235, 268],
    [0, 597],
  ]);
  shape(ctx, '#c2d5c9', [
    [460, 1080],
    [1920, 737],
    [1920, 793],
    [714, 1080],
  ]);
  // Sparse mineral flecks belong to the counter and stay in place as the camera moves.
  for (let i = 0; i < 350; i++) {
    const x = ((i * 617) ^ (i * 17)) % 1920;
    const y = 270 + (((i * 401) ^ (i * 53)) % 810);
    shape(ctx, i % 3 ? '#becab9' : '#edf0da', [
      [x, y],
      [x + 2 + (i % 4), y - 1],
      [x + 5, y + 2 + (i % 3)],
      [x + 1, y + 2],
    ]);
  }
  shape(ctx, 'rgba(47,77,76,.15)', [
    [0, 688],
    [1041, 432],
    [1143, 488],
    [0, 761],
  ]);
}

function trainEmblem(ctx, x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 28);
  ctx.lineTo(0, 13);
  ctx.lineTo(48, 13);
  ctx.bezierCurveTo(68, 13, 76, 19, 83, 28);
  ctx.closePath();
  ctx.fill();
  for (const [x1, y1, x2] of [
    [-25, 13, -5],
    [-40, 20, -5],
    [-19, 27, -5],
    [-1, 35, 88],
    [-17, 41, 73],
  ]) {
    stroke(ctx, color, 3, [
      [x1, y1],
      [x2, y1],
    ]);
  }
  ctx.restore();
}

function printer(ctx, worker, loading) {
  // The title band is cast into the curved hood. The dark display reports the serving worker.
  shape(ctx, 'rgba(47,66,64,.20)', [
    [87, 427],
    [984, 343],
    [1087, 431],
    [1206, 529],
    [186, 647],
    [76, 571],
  ]);
  frame(ctx, 84, 347, 932, 239, 43, '#804736');
  frame(
    ctx,
    73,
    333,
    924,
    234,
    40,
    wash(ctx, 0, 330, 0, 570, [
      [0, '#e18b65'],
      [0.24, '#d26445'],
      [0.82, '#bf5039'],
      [1, '#9d402f'],
    ]),
  );
  ctx.beginPath();
  ctx.moveTo(80, 374);
  ctx.quadraticCurveTo(74, 333, 104, 293);
  ctx.lineTo(184, 199);
  ctx.quadraticCurveTo(197, 181, 227, 182);
  ctx.lineTo(877, 182);
  ctx.quadraticCurveTo(908, 182, 922, 204);
  ctx.lineTo(978, 292);
  ctx.quadraticCurveTo(997, 323, 995, 365);
  ctx.bezierCurveTo(756, 381, 343, 390, 80, 374);
  ctx.closePath();
  ctx.fillStyle = wash(ctx, 0, 183, 15, 385, [
    [0, '#f7ba8e'],
    [0.23, '#ef9c71'],
    [0.74, '#dc7e58'],
    [1, '#cd6247'],
  ]);
  ctx.fill();
  stroke(ctx, '#edb18a', 4, [
    [124, 288],
    [159, 240],
    [201, 198],
    [868, 198],
  ]);
  for (let i = 0; i < 3; i++) {
    stroke(ctx, '#9d4b37', 3, [
      [115, 395 + i * 9],
      [270, 400 + i * 9],
    ]);
    stroke(ctx, '#e99568', 2, [
      [115, 397 + i * 9],
      [270, 402 + i * 9],
    ]);
  }
  trainEmblem(ctx, 226, 247, 1.13, '#813f32');
  label(ctx, 'Harbor Line', 361, 307, 70, '#703a32', 'Serif');
  for (let i = 0; i < 7; i++)
    stroke(ctx, '#bc664b', 4, [
      [760 + i * 16, 253],
      [779 + i * 16, 280],
    ]);
  frame(ctx, 300, 385, 643, 96, 14, '#934933');
  frame(ctx, 304, 388, 634, 88, 12, '#f6c698');
  frame(ctx, 309, 393, 624, 77, 8, '#283f47');
  label(ctx, 'Serving worker', 333, 444, 41, '#f5ebd6', 'Sans', 600);
  frame(ctx, 636, 401, 2, 58, 1, '#93a6a1');
  label(ctx, worker.release, 667, 451, 53, loading ? '#c5bda8' : '#f7d09b', 'Mono', 600);
  const format = worker.compiledTemplate === templates[12] ? '12h' : '24h';
  label(ctx, format, 790, 447, 42, '#d4dfce', 'Mono');
  frame(ctx, 129, 497, 821, 53, 22, '#f1ae83');
  frame(ctx, 137, 501, 805, 41, 17, '#713f36');
  frame(ctx, 151, 507, 776, 26, 9, '#24373a');
}

function terminal(ctx, { git, archive, selected, loaded }) {
  const X = 1103,
    Y = 163,
    W = 664,
    H = 340;
  shape(ctx, 'rgba(71,87,81,.20)', [
    [X + 61, Y + H + 8],
    [X + W + 4, Y + H - 24],
    [1907, 540],
    [X + 122, 574],
    [X - 45, 546],
  ]);
  frame(ctx, X, Y, W, H, 22, '#516a6c');
  frame(ctx, X + 2, Y + 1, W - 9, H - 10, 20, '#334b53');
  frame(ctx, X + 21, Y + 19, W - 42, H - 45, 11, '#f0ecda');
  const contentX = X + 49;
  frame(ctx, X + 21, Y + 19, W - 42, 65, [10, 10, 0, 0], '#cedad0');
  // Both views belong to the same operator terminal.
  if (archive) {
    label(ctx, 'Release archive', contentX, Y + 67, 42, ink, 'Sans', 600);
    label(ctx, r1.id, contentX, Y + 177, 91, red, 'Mono', 600);
    label(ctx, 'Saved image', contentX + 160, Y + 131, 37, ink, 'Sans', 600);
    const format = rolledBack.worker.compiledTemplate === templates[12] ? '12-hour' : '24-hour';
    label(ctx, format + ' template', contentX + 160, Y + 183, 40, ink);
    label(ctx, 'Model  ' + rolledBack.worker.model, contentX, Y + 242, 36, navy, 'Mono');
    stroke(ctx, '#adbcb0', 2, [
      [contentX, Y + 259],
      [X + W - 46, Y + 259],
    ]);
    label(
      ctx,
      loaded ? 'Loaded on worker' : selected ? 'Loading image…' : 'Available for rollback',
      contentX,
      Y + 297,
      31,
      loaded ? navy : red,
      'Sans',
      600,
    );
  } else {
    label(ctx, 'Git', contentX, Y + 67, 41, ink, 'Sans', 700);
    label(ctx, '/  ticket template', contentX + 81, Y + 66, 37, ink);
    label(ctx, 'Departure format', contentX, Y + 139, 35, navy);
    const format = git === templates[12] ? '12-hour' : '24-hour';
    label(ctx, format, contentX, Y + 223, 76, git === templates[12] ? red : ink, 'Sans', 700);
    stroke(ctx, '#adbcb0', 2, [
      [contentX, Y + 246],
      [X + W - 45, Y + 246],
    ]);
    label(ctx, git, contentX, Y + 294, 36, navy, 'Mono');
  }
  shape(ctx, '#849e9b', [
    [X + 9, Y + H - 9],
    [X + W - 9, Y + H - 9],
    [X + W + 63, Y + H + 31],
    [X - 62, Y + H + 31],
  ]);
  shape(ctx, '#485f63', [
    [X - 62, Y + H + 31],
    [X + W + 63, Y + H + 31],
    [X + W + 51, Y + H + 42],
    [X - 49, Y + H + 42],
  ]);
  for (let row = 0; row < 3; row++) {
    const y = Y + H - 3 + row * 9;
    for (let key = 0; key < 16; key++) {
      const x = X + 25 + key * 39 - row * 4;
      shape(ctx, '#5b7677', [
        [x, y],
        [x + 33, y],
        [x + 34, y + 5],
        [x - 1, y + 5],
      ]);
    }
  }
}

// A two-color railway engraving remains identical on every copy of the ticket.
function engraving(ctx) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(10, 224, 511, 65);
  ctx.clip();
  shape(ctx, '#d5d1a7', [
    [5, 258],
    [81, 234],
    [150, 244],
    [226, 228],
    [323, 248],
    [418, 229],
    [530, 246],
    [530, 297],
    [5, 297],
  ]);
  for (let i = 0; i < 6; i++) {
    const y = 254 + i * 7;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(86, y - 20, 149, y + 7, 224, y - 9);
    ctx.bezierCurveTo(296, y - 19, 386, y - 6, 531, y - 21);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#a8b7a2';
    ctx.stroke();
  }
  // Negative spaces between the piers describe a curved stone viaduct.
  ctx.beginPath();
  ctx.moveTo(20, 247);
  ctx.quadraticCurveTo(259, 241, 500, 212);
  ctx.lineTo(500, 239);
  ctx.quadraticCurveTo(259, 266, 20, 270);
  ctx.closePath();
  ctx.fillStyle = '#698b82';
  ctx.fill();
  for (let i = 0; i < 12; i++) {
    const x = 20 + i * 42,
      top = 250 - i * 1.4 - i * i * 0.105;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + 39, top - 3);
    ctx.lineTo(x + 39, 288);
    ctx.lineTo(x + 33, 288);
    ctx.lineTo(x + 33, top + 20);
    ctx.bezierCurveTo(x + 33, top + 3, x + 7, top + 4, x + 7, top + 22);
    ctx.lineTo(x + 7, 289);
    ctx.lineTo(x, 289);
    ctx.closePath();
    ctx.fill();
  }
  trainEmblem(ctx, 302, 210, 0.65, '#52746c');
  ctx.restore();
}

function ticketEdge(ctx) {
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(528, 0);
  ctx.arc(540, 0, 12, Math.PI, 0, true);
  ctx.lineTo(719, 0);
  ctx.lineTo(732, 13);
  ctx.lineTo(732, 295);
  ctx.lineTo(719, 308);
  ctx.lineTo(552, 308);
  ctx.arc(540, 308, 12, 0, Math.PI, true);
  ctx.lineTo(8, 308);
  ctx.quadraticCurveTo(0, 308, 0, 300);
  ctx.lineTo(0, 8);
  ctx.quadraticCurveTo(0, 0, 8, 0);
  ctx.closePath();
}

function ticket(ctx, data) {
  ticketEdge(ctx);
  ctx.fillStyle = wash(ctx, 0, 0, 570, 308, [
    [0, '#fff0c9'],
    [0.62, '#f8e6bd'],
    [1, '#eed6a9'],
  ]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  frame(ctx, 546, -1, 187, 311, 0, '#efd6ab');
  for (let i = 0; i < 3; i++)
    stroke(ctx, '#ba5e43', 2, [
      [560, 16 + i * 5],
      [710, 16 + i * 5],
    ]);
  for (let i = 0; i < 3; i++)
    stroke(ctx, '#bb694f', 2, [
      [560, 279 + i * 4],
      [710, 279 + i * 4],
    ]);
  ctx.setLineDash([8, 8]);
  stroke(ctx, '#aa9676', 2, [
    [540, 13],
    [540, 295],
  ]);
  ctx.setLineDash([]);
  label(ctx, data.destination, 34, 77, 59, ink, 'Serif');
  label(ctx, 'DEPARTURE', 37, 125, 28, navy, 'Sans', 600);
  const [number, period] = data.time.split(' ');
  label(ctx, number, 28, 220, 109, ink, 'Sans', 700);
  if (period) label(ctx, period, 40 + ctx.measureText(number).width, 215, 63, red, 'Sans', 700);
  engraving(ctx);
  label(ctx, 'Served by', 555, 88, 35, ink, 'Sans', 600);
  label(ctx, data.servedBy, 551, 177, 88, red, 'Mono', 600);
  label(ctx, 'Model', 556, 217, 28, navy);
  label(ctx, data.model, 555, 255, 32, ink, 'Mono');
  ctx.restore();
}

const slotY = 523,
  issueX = 175,
  rightX = 1068;
function piece(ctx, data, feed, lift = 0, previous = false) {
  const stackedX = previous ? rightX + 13 : rightX,
    stackedY = previous ? 629 : 615;
  const x = mix(issueX, stackedX, lift);
  const y = mix(slotY - 308 + 308 * feed, stackedY, lift) - 65 * Math.sin(lift * Math.PI);
  ctx.save();
  if (feed < 1) {
    ctx.beginPath();
    ctx.rect(100, slotY, 899, 557);
    ctx.clip();
  }
  ctx.translate(x, y);
  ctx.rotate(lift * (previous ? 0.036 : -0.017));
  ctx.save();
  ctx.translate(6 + lift * 4, 10 + 13 * Math.sin(lift * Math.PI));
  ticketEdge(ctx);
  ctx.fillStyle = 'rgba(48,64,53,.18)';
  ctx.fill();
  ctx.restore();
  ticket(ctx, data);
  if (feed < 1 && feed > 0) {
    ctx.fillStyle = wash(ctx, 0, slotY - y, 0, slotY - y + 22, [
      [0, 'rgba(76,57,36,.25)'],
      [1, 'rgba(76,57,36,0)'],
    ]);
    ctx.fillRect(0, slotY - y, 732, 22);
  }
  ctx.restore();
}

// The timetable stays in view while the running image and Git change independently.
export function drawStation(ctx, clock) {
  const at = (beat, words, span = 0) => {
    if (clock.beat.beatIndex !== beat) return Number(clock.beat.beatIndex > beat);
    return smooth(clock.reveal(words, span));
  };
  const firstFeed = Math.min(1, (clock.seconds + 0.3) / 1.3);
  const edit = at(0, 'restore the twelve-hour template');
  const aside = at(0, 'Keep the first copy', 1.3);
  const secondFeed = at(1, 'Send the same departure', 1.35);
  const archive = at(2, 'Open the archive');
  const selected = at(2, 'Load its saved image', 1.1);
  const placed = at(2, 'Open the archive', 1.25);
  const lastFeed = at(2, 'Print that departure', 1.3);
  coast(ctx);
  counter(ctx);
  frame(ctx, 115, 40, 1510, 91, 8, '#304b51');
  label(ctx, 'TIMETABLE', 145, 98, 34, '#e6c294', 'Mono');
  label(ctx, journey.destination, 450, 102, 48, '#fff0d5', 'Serif');
  label(ctx, '17:30', 1240, 106, 57, '#fff0d5', 'Mono', 600);
  terminal(ctx, {
    git: edit ? restoredSource.source : initial.source,
    archive,
    selected: selected > 0,
    loaded: selected === 1,
  });
  printer(ctx, selected === 1 ? rolledBack.worker : initial.worker, selected > 0 && selected < 1);
  piece(ctx, first, firstFeed, aside, true);
  if (secondFeed > 0) piece(ctx, reprint, secondFeed, placed);
  if (lastFeed > 0) piece(ctx, finalPrint, lastFeed);
}
export { check as checkStation };
