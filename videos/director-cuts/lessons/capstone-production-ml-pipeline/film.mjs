import assert from 'node:assert/strict';
import {
  OFFLINE_CASES,
  promotionPolicy,
} from '../../../films/capstone-production-ml-pipeline/fixtures.mjs';
import { probeRelease } from '../../../films/capstone-production-ml-pipeline/model.mjs';

const parcel = OFFLINE_CASES.find((row) => row.id === 'eval-1');
const before = probeRelease('v1', parcel.x);
const after = probeRelease('v0', parcel.x);
const report = { day: 8, release: 'v1', p95ms: 130, costDelta: 0.14 };
const excess = Math.round(100 * report.costDelta);
const beats = [
  {
    id: 'noon',
    say: 'At noon, this parcel was running nine minutes behind. Version one scored the delay at point nine eight. Half a point is enough to send a warning. Keep that scan.',
    hold: 1,
  },
  {
    id: 'outcomes',
    say: 'On day eight, the service is still fast. Now the carrier has reported which parcels actually arrived late. Counting warnings and missed late deliveries, version one costs fourteen percent more than baseline. The policy allows no increase.',
    hold: 0.9,
  },
  {
    id: 'recover',
    say: 'That breach calls for a rollback. The controller checks that the latest report matches the serving release and its policy. It reloads the previous package. The saved input transform, model, and warning threshold all come back together.',
    hold: 0.9,
  },
  {
    id: 'same-scan',
    say: 'The production setting now says version zero. What will this parcel get? Replay the same nine minutes and look at the reply.',
    hold: 1.65,
  },
  {
    id: 'reply',
    say: 'Zero, from version zero. The scan falls below the warning threshold. In production, verify the version on a request that actually reached a serving worker.',
    hold: 1,
  },
  {
    id: 'inbox',
    say: 'Open the noon message. The next scan goes through the restored model. The customer can still read the warning we already sent.',
    hold: 2.7,
  },
];

function check() {
  assert.equal(parcel.x, 9);
  assert.equal(report.release, before.release);
  assert(report.p95ms < promotionPolicy.latency);
  assert(report.costDelta > promotionPolicy.cost);
  assert.equal(excess, 14);
  assert.equal(before.input, after.input);
  assert.deepEqual([before.release, after.release], ['v1', 'v0']);
  assert.notEqual(before.digest, after.digest);
  assert.equal(before.model.threshold, 0.5);
  assert.equal(after.model.threshold, before.model.threshold);
  assert(Math.abs(before.score - 0.98) < 1e-12);
  assert.equal(after.score, 0);
  assert.deepEqual([before.warning, after.warning], [true, false]);
}

const ink = '#182b49';
const blue = '#244a99';
const bright = '#355fc0';
const alert = '#af402c';
const paper = '#fff9ec';
const muted = '#566671';
const clamp = (n) => Math.min(1, Math.max(0, n));
function ease(n) {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
}
function box(c, x, y, w, h, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function poly(c, color, pts) {
  c.fillStyle = color;
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
function line(c, x1, y1, x2, y2, color, width = 2) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function circle(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
function label(c, text, x, y, size, color = ink, weight = 500, family = 'Sans', align = 'left') {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillStyle = color;
  c.fillText(text, x, y);
}
function wash(c, x1, y1, x2, y2, a, b) {
  const g = c.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}
function chevron(c, x, y, size, color) {
  poly(c, color, [
    [x, y],
    [x + size * 0.5, y],
    [x + size, y + size * 0.5],
    [x + size * 0.5, y + size],
    [x, y + size],
    [x + size * 0.5, y + size * 0.5],
  ]);
}

function packingBench(c) {
  c.fillStyle = wash(c, -700, -160, 2000, 1250, '#b4ccc4', '#789b99');
  c.fillRect(-1300, -800, 5200, 2900);
  c.save();
  c.translate(310, 530);
  c.rotate(-0.108);
  box(c, -1060, -696, 1592, 1444, 5, '#6d847b');
  box(c, -1085, -720, 1588, 1440, 4, '#8e674b');
  c.fillStyle = wash(c, -1050, -420, 610, 880, '#e6c59a', '#be916a');
  c.fillRect(-1085, -720, 1582, 1417);
  // Short, fixed fibers give the carton a different surface from the glass.
  c.strokeStyle = '#84552e2c';
  c.lineWidth = 1.25;
  c.beginPath();
  for (let i = 0; i < 600; i++) {
    const x = -1078 + ((i * 7297) % 1567);
    const y = -718 + ((i * 3571) % 1409);
    c.moveTo(x, y);
    c.lineTo(x + 3 + (i % 13), y + (i % 5) - 2);
  }
  c.stroke();
  c.fillStyle = '#846343';
  c.fillRect(-1080, -12, 1577, 4);
  c.fillStyle = '#e8b656aa';
  c.fillRect(-1080, -54, 1577, 95);
  for (let x = -1070; x < 460; x += 74) chevron(c, x, -25, 39, '#76583d6b');
  // The blue parcel strap passes behind the handset.
  c.fillStyle = '#2e568e';
  c.fillRect(-388, -720, 71, 1417);
  for (let x = -383; x < -316; x += 5) line(c, x, -720, x, 696, '#aec3cd40', 1.7);
  c.restore();
}

function deliveryVan(c, x, y) {
  c.save();
  c.translate(x, y);
  box(c, 1, 68, 199, 8, 4, '#475f73');
  poly(c, ink, [
    [0, 2],
    [116, 2],
    [118, 19],
    [160, 19],
    [185, 47],
    [199, 51],
    [199, 69],
    [0, 69],
  ]);
  poly(c, '#ed7349', [
    [3, 0],
    [116, 0],
    [116, 57],
    [2, 57],
  ]);
  poly(c, '#d8593d', [
    [119, 21],
    [157, 21],
    [180, 45],
    [193, 50],
    [193, 58],
    [119, 58],
  ]);
  poly(c, '#f5e6b7', [
    [127, 25],
    [155, 25],
    [171, 45],
    [127, 45],
  ]);
  line(c, 120, 23, 120, 66, ink, 2);
  line(c, 128, 51, 137, 51, ink, 3);
  box(c, -3, 59, 200, 8, 2, '#ebcd92');
  box(c, 187, 53, 10, 5, 2, paper);
  for (const wheel of [35, 160]) {
    circle(c, wheel, 67, 16, ink);
    circle(c, wheel, 67, 8, '#e7d7a7');
    circle(c, wheel, 67, 3, blue);
  }
  chevron(c, 23, 14, 24, paper);
  chevron(c, 44, 14, 24, paper);
  c.restore();
}

// A three-ink street illustration lives in the parcel app.
function street(c, travel) {
  c.save();
  c.beginPath();
  c.rect(0, 0, 468, 295);
  c.clip();
  c.fillStyle = '#c6dadb';
  c.fillRect(0, 0, 468, 295);
  circle(c, 358, 45, 61, '#fbe1a4');
  const houses = [
    [-28, 62, 103],
    [58, 99, 100],
    [142, 80, 93],
    [224, 130, 106],
    [322, 66, 91],
    [399, 95, 102],
  ];
  for (const [x, y, w] of houses) {
    c.fillStyle = '#a1bec0';
    c.fillRect(x, y, w, 235 - y);
    poly(c, '#769da7', [
      [x - 5, y],
      [x + w * 0.48, y - 26],
      [x + w + 4, y],
    ]);
    c.fillStyle = '#779ba7';
    for (let col = 0; col < 3; col++)
      for (let row = 0; row < 2; row++) c.fillRect(x + 12 + 24 * col, y + 14 + 24 * row, 8, 13);
  }
  c.fillStyle = '#608692';
  c.fillRect(0, 197, 468, 14);
  c.fillStyle = '#9eafb0';
  c.fillRect(0, 211, 468, 84);
  poly(c, '#708e9d', [
    [-50, 244],
    [503, 225],
    [503, 263],
    [-30, 293],
  ]);
  for (let i = -1; i < 7; i++)
    line(c, i * 99, 273 - i * 2.8, i * 99 + 46, 271.6 - i * 2.8, '#d8d9be', 4);
  deliveryVan(c, 109 + travel * 46, 153);
  c.restore();
}
function phone(c, arrival, travel, buzz, opened) {
  c.save();
  c.translate(190 + buzz, 72);
  c.rotate(-0.041);
  box(c, 13, 27, 531, 850, 68, '#695b5152');
  box(c, 8, 14, 525, 849, 65, '#705a4ba6');
  box(c, 0, 0, 527, 852, 65, '#4a5360');
  box(c, 4, 4, 519, 839, 62, '#dad9ce');
  box(c, 10, 10, 507, 826, 56, ink);
  box(c, 20, 20, 487, 806, 47, paper);
  box(c, 200, 34, 116, 19, 10, '#2c3746');
  circle(c, 296, 43, 4, '#47647b');
  label(c, 'Parcel post', 46, 123, 59, ink, 600, 'Serif');
  c.save();
  c.translate(27, 154);
  c.beginPath();
  c.rect(0, 0, 468, 295 - 85 * opened);
  c.clip();
  c.translate(0, -85 * opened);
  street(c, travel);
  c.restore();
  c.save();
  c.translate(0, -85 * opened);
  label(c, opened > 0.5 ? 'Parcel 01' : 'Inbox', 48, 512, 51, ink, 700);
  line(c, 48, 533, 474, 533, '#ccc5b7');
  c.save();
  c.globalAlpha *= arrival;
  c.translate(0, -29 * (1 - arrival));
  circle(c, 60, 580, 10, alert);
  label(c, opened > 0.5 ? 'Message sent' : 'Parcel 01', 87, 592, 32, muted, 600);
  label(c, '12:00', 473, 591, 33, muted, 400, 'Mono', 'right');
  label(c, 'Your parcel', 48, 665, 58, ink, 500, 'Serif');
  label(c, 'may be late.', 48, 728, 58, ink, 500, 'Serif');
  c.restore();
  c.restore();
  box(c, 196, 801, 133, 7, 4, ink);
  c.restore();
}

const lid = { x: 835, y: 103, w: 1020, h: 677 };
function laptop(c) {
  c.save();
  c.translate(lid.x, lid.y);
  box(c, 13, 23, lid.w + 11, lid.h + 29, 35, '#52646163');
  box(c, 0, 0, lid.w, lid.h, 34, '#949fa0');
  box(c, 4, 3, lid.w - 8, lid.h - 9, 32, '#cad0ca');
  box(c, 11, 10, lid.w - 22, lid.h - 21, 27, '#26343f');
  box(c, 25, 32, lid.w - 50, lid.h - 63, 9, '#f5f3e9');
  circle(c, lid.w / 2, 19, 4, '#607984');
  box(c, 51, 662, 917, 26, 11, '#50626a');
  poly(c, '#607278', [
    [0, 681],
    [1020, 681],
    [1162, 887],
    [-113, 887],
  ]);
  poly(c, '#c0c8c6', [
    [0, 676],
    [1020, 676],
    [1156, 876],
    [-110, 876],
  ]);
  poly(c, '#9ca9aa', [
    [40, 693],
    [985, 693],
    [1040, 788],
    [-12, 788],
  ]);
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 15; k++) {
      const x = 53 + k * 62.1 - row * 9;
      const y = 701 + 26 * row;
      poly(c, '#465763', [
        [x, y],
        [x + 52 + row, y],
        [x + 50 + row, y + 16],
        [x - 3, y + 16],
      ]);
    }
  }
  poly(c, '#95a4a6', [
    [359, 799],
    [652, 799],
    [664, 858],
    [343, 858],
  ]);
  poly(c, '#b7c2c0', [
    [361, 801],
    [650, 801],
    [662, 856],
    [345, 856],
  ]);
  c.restore();
}

function toolbar(c, version) {
  c.fillStyle = ink;
  c.fillRect(0, 0, 970, 84);
  chevron(c, 28, 27, 28, '#f5a676');
  chevron(c, 51, 27, 28, '#f5a676');
  label(c, 'Release lab', 101, 57, 39, '#fff8e8', 600);
  label(c, 'Production   ' + version, 935, 55, 31, '#f1e8d6', 500, 'Mono', 'right');
}

function reportView(c, costProgress) {
  label(c, 'Day ' + report.day + ' outcomes', 43, 169, 58, ink, 500, 'Serif');
  label(c, 'Response time  ·  p95 ' + report.p95ms + ' ms', 46, 229, 32, muted);
  line(c, 45, 258, 922, 258, '#b3bab3');
  label(c, 'Warning cost', 45, 320, 39, ink, 600);
  const x = 240,
    length = 470;
  label(c, 'Baseline', 45, 397, 33);
  label(c, before.release, 45, 469, 37, blue, 600, 'Mono');
  box(c, x, 363, length, 32, 3, '#9caaa9');
  line(c, x + length, 341, x + length, 486, ink, 3);
  if (costProgress > 0) {
    c.save();
    c.globalAlpha *= costProgress;
    box(c, x, 431, length, 36, 3, blue);
    c.fillStyle = '#d76440';
    c.fillRect(x + length, 431, length * report.costDelta, 36);
    label(c, '+' + excess + '%', 925, 464, 49, alert, 700, 'Sans', 'right');
    c.restore();
  } else {
    label(c, 'Awaiting outcomes', x, 464, 34, muted);
  }
  label(c, 'Allowed increase   0%', 46, 555, 33, muted, 500, 'Mono');
}
function packageView(c, opening) {
  label(c, 'Restore previous release', 43, 172, 57, ink, 500, 'Serif');
  const raise = Math.round(30 * opening);
  poly(c, '#b9c6ca', [
    [53, 340],
    [82, 259],
    [292, 259],
    [308, 280],
    [347, 280],
    [313, 494],
    [48, 494],
  ]);
  poly(c, blue, [
    [48, 335],
    [78, 239],
    [197, 239],
    [213, 264],
    [334, 264],
    [303, 484],
    [48, 484],
  ]);
  for (let i = 0; i < 3; i++) {
    const x = 76 + i * 7,
      y = 304 + i * 11 - raise;
    poly(c, i === 2 ? paper : '#c8d2db', [
      [x, y],
      [x + 212, y],
      [x + 192, y + 126],
      [x - 20, y + 126],
    ]);
    line(c, x + 21, y + 19, x + 139, y + 19, '#83939b', 3);
  }
  poly(c, bright, [
    [45, 331],
    [305, 331],
    [286, 484],
    [49, 484],
  ]);
  label(c, after.release, 92, 437, 75, paper, 600, 'Mono');
  for (const [i, name] of ['Input transform', 'Model', 'Warning threshold'].entries()) {
    const yy = 294 + i * 83;
    circle(c, 394, yy - 12, 12, opening > i / 3 ? blue : '#acb9b8');
    label(c, name, 430, yy, 42, ink, 600);
  }
}

function replayView(c, replaying, returned) {
  label(c, 'Parcel 01', 44, 168, 58, ink, 500, 'Serif');
  label(c, 'Scan delay   ' + parcel.x + ' min', 925, 163, 37, ink, 500, 'Mono', 'right');
  line(c, 44, 202, 925, 202, '#b3bab3');
  const left = 185,
    right = 889;
  const pos = (score) => left + (right - left) * score;
  const thresholdX = pos(before.model.threshold);
  c.fillStyle = '#f1e0cb';
  c.fillRect(thresholdX, 273, right - thresholdX + 2, 228);
  label(c, 'Warn at ' + before.model.threshold.toFixed(2), thresholdX + 13, 254, 30, alert, 600);
  line(c, thresholdX, 267, thresholdX, 503, alert, 3);
  function row(probe, y, color, opacity) {
    c.save();
    c.globalAlpha *= opacity;
    const end = pos(probe.score);
    label(c, probe.release, 45, y + 12, 43, color, 600, 'Mono');
    line(c, left, y, right, y, '#a7afa8', 3);
    line(c, left, y, end, y, color, 8);
    circle(c, end, y, 12, color);
    label(
      c,
      probe.score.toFixed(2),
      end,
      y - 24,
      45,
      color,
      600,
      'Mono',
      probe.warning ? 'right' : 'left',
    );
    c.restore();
  }
  row(before, 344, returned > 0 ? '#6c797a' : alert, 1);
  if (returned > 0) row(after, 463, blue, returned);
  if (replaying > 0 && returned < 1) {
    c.save();
    c.globalAlpha = replaying * (1 - returned);
    label(c, 'Replaying scan…', 44, 563, 35, blue, 500);
    c.restore();
  }
  if (returned > 0) {
    c.save();
    c.globalAlpha = returned;
    label(c, 'Reply from ' + after.release + '   ·   No warning', 44, 563, 45, blue, 600);
    c.restore();
  }
}
function draw(c, clock) {
  const { index, elapsed, reveal } = clock;
  const widen = index === 0 ? ease(reveal('Version one', 1.55)) : 1;
  // Follow the evidence to the laptop, then widen for the replay so the
  // existing warning and the new decision can be read in the same shot.
  const close =
    index === 1
      ? ease(elapsed / 1.3)
      : index === 2
        ? 1
        : index === 3
          ? 1 - ease(reveal('What will', 1.25))
          : 0;
  const zoom = 1.2 - 0.2 * widen + 0.44 * close;
  const cx = 415 + 545 * widen + 470 * close;
  const cy = 486 + 54 * widen - 74 * close;
  c.save();
  c.translate(960, 540);
  c.scale(zoom, zoom);
  c.translate(-cx, -cy);
  packingBench(c);
  const arrival = index ? 1 : ease((elapsed + 0.04) / 0.73);
  const buzz =
    index === 0 && elapsed < 0.58 ? Math.sin(elapsed * 47) * 4 * (1 - elapsed / 0.58) : 0;
  const opened = index === 5 ? ease(reveal('the noon message', 0.8)) : 0;
  phone(c, arrival, index ? 1 : ease(elapsed / 2.7), buzz, opened);
  laptop(c);
  c.save();
  c.translate(lid.x + 25, lid.y + 32);
  c.beginPath();
  c.roundRect(0, 0, 970, 614, 8);
  c.clip();
  if (index === 0 && widen < 1) {
    c.fillStyle = '#344858';
    c.fillRect(0, 0, 970, 614);
    c.globalAlpha = widen;
    c.fillStyle = '#f5f3e9';
    c.fillRect(0, 0, 970, 614);
  }
  toolbar(c, index < 3 ? before.release : after.release);
  if (index === 1) {
    reportView(c, ease(reveal('which parcels', 0.85)));
  } else if (index === 2) {
    packageView(c, ease(reveal('It reloads', 1.2)));
  } else {
    const replay = index === 3 ? ease(reveal('Replay', 0.35)) : Number(index > 3);
    const returned = index === 3 ? ease(reveal('look at', 0.55)) : Number(index > 3);
    replayView(c, replay, returned);
  }
  c.restore();
  c.restore();
}

export default { title: 'The warning at noon', beats, draw, check };
