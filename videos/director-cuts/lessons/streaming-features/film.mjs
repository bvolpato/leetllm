import assert from 'node:assert/strict';
import { Path2D } from '@napi-rs/canvas';
import { formatClock, publishWindow } from '../../../films/streaming-features/arithmetic.mjs';
import { countPublications, countWindow } from '../../../films/streaming-features/fixtures.mjs';

const title = 'North Pier, eleven to noon';
const beats = [
  {
    id: 'touchdown',
    say: 'Watch the feet. As soon as they touch the post, the camera records a landing. This one happened at eleven twelve.',
    hold: 0.9,
  },
  {
    id: 'first-publication',
    say: 'A second gull lands at eleven thirty-seven. At twelve twenty-two, the station sends the feature store its first count for the hour from eleven to noon.',
    hold: 0.9,
  },
  {
    id: 'prediction',
    say: 'A model asks for the count a minute later. It gets two. Watch where that number goes. The prediction log keeps a copy.',
    hold: 1,
  },
  {
    id: 'late-picture',
    say: 'Look at the time on this picture. The gull landed before noon. Its record took longer to reach the station. It comes in at twelve twenty-four.',
    hold: 0.9,
  },
  {
    id: 'same-hour',
    say: 'Here’s the revised count for the same pier and the same hour. Find the first two pictures on both strips. If we added the totals, each of those landings would count twice.',
    hold: 1.3,
  },
  {
    id: 'replace',
    say: 'Lay the new strip over the old one. The station sends a whole count each time, so the store replaces two with three.',
    hold: 1,
  },
  {
    id: 'retry',
    say: 'One more delivery comes in at twelve twenty-five. Look at the revision number on it. Which count should the next prediction get?',
    hold: 2.1,
  },
  {
    id: 'on-file',
    say: 'Three. That last delivery was a retry of revision one. The store keeps revision two. To replay the earlier prediction, read the two in its log.',
    hold: 3,
  },
];

// The pier camera uses the lesson's fixed event window and whole-count messages.
const key = 'North Pier/11:00/12:00';
const [first, revised, retry] = countPublications.map((message) => ({ ...message, key }));
const firstOnFile = publishWindow(null, first);
const current = publishWindow(firstOnFile, revised);
const afterRetry = publishWindow(current, retry);
const readTime = 12 * 60 + 23;
function countAt(minute) {
  return [first, revised, retry].filter((message) => message.time <= minute).reduce(publishWindow, null);
}
const recorded = countAt(readTime);
function check() {
  assert(countWindow.members.every(({ event }) => event >= countWindow.start && event < countWindow.end));
  assert.deepEqual(countWindow.members.map(({ event }) => formatClock(event)), ['11:12', '11:37', '11:50']);
  assert.deepEqual([first, revised, retry].map((m) => [formatClock(m.time), m.revision, m.count]),
    [['12:22', 1, 2], ['12:24', 2, 3], ['12:25', 1, 2]]);
  assert.deepEqual(first.members.map((m) => m.id), revised.members.slice(0, 2).map((m) => m.id));
  assert.equal(new Set([...first.members, ...revised.members].map((m) => m.id)).size, 3);
  assert.equal(first.count + revised.count, 5);
  assert.equal(countAt(first.time - 1), null);
  assert.deepEqual([recorded, current, afterRetry].map((m) => [m.revision, m.count]), [[1, 2], [2, 3], [2, 3]]);
  assert.equal(countAt(12 * 60 + 25).revision, 2);
  return true;
}

const ink = '#20394c';
const blue = '#265c79';
const red = '#a23c24';
const paper = '#f6efdb';
const clamp = (n) => Math.min(1, Math.max(0, n));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const rect = (g, x, y, w, h, fill) => { g.fillStyle = fill; g.fillRect(x, y, w, h); };
function line(g, x, y, x2, y2, color, width = 2) {
  g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2);
  g.strokeStyle = color; g.lineWidth = width; g.stroke();
}
function ellipse(g, x, y, rx, ry, color, angle = 0) {
  g.beginPath(); g.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2); g.fillStyle = color; g.fill();
}
function type(g, value, x, y, size, fill = ink, family = 'Sans', align = 'left', style = '') {
  g.font = `${style} ${size}px "Lesson ${family}"`.trim();
  g.textAlign = align; g.fillStyle = fill; g.fillText(String(value), x, y);
}
// Fixed cuts are shared between the full frame and its contact print.
const cuts = new Map();
function cut(g, fill, path) {
  if (!cuts.has(path)) cuts.set(path, new Path2D(path));
  g.fillStyle = fill; g.fill(cuts.get(path));
}
function poly(g, fill, points) {
  g.beginPath();
  for (let i = 0; i < points.length; i += 2) {
    if (!i) g.moveTo(points[i], points[i+1]); else g.lineTo(points[i], points[i+1]);
  }
  g.closePath(); g.fillStyle = fill; g.fill();
}
function random(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
const rand = random(5112);
const seaCuts = Array.from({ length: 135 }, () => {
  const depth = rand();
  return { x: rand() * 1110 - 95, y: 220 + depth * 323, w: 8 + rand() * (9 + 73 * depth), depth, phase: rand() * 6.28 };
});
const gouges = Array.from({ length: 54 }, () => ({ x: rand(), y: rand(), len: 4 + rand() * 40 }));
const grains = Array.from({ length: 410 }, () => [rand() * 1920, rand() * 1080, 1 + rand() * 5]);

function water(g, drift) {
  rect(g, 0, 0, 960, 540, '#f3d7af');
  const sky = g.createLinearGradient(0, 0, 0, 213);
  sky.addColorStop(0, '#c2d6d1'); sky.addColorStop(0.65, '#f8dcc1'); sky.addColorStop(1, '#f9d7a7');
  rect(g, 0, 0, 960, 218, sky);
  cut(g, '#f6ead2', 'M0 62 Q92 47 157 58 Q207 62 251 46 Q289 36 339 41 Q287 44 255 55 Q201 72 130 66 Q58 61 0 73Z');
  cut(g, '#839c9b', 'M0 135 Q42 130 75 148 L99 151 L123 172 L151 175 L180 181 L188 189 L223 192 L238 202 L269 204 L290 215 L0 220Z');
  cut(g, '#526f74', 'M0 157 L37 167 L56 187 L89 189 L99 195 L129 197 L149 209 L171 212 L190 220 L0 224Z');
  rect(g, 0, 214, 960, 326, '#82b9b2');
  cut(g, '#619fa4', 'M0 258 C128 256 200 271 315 256 S547 245 662 250 S852 260 960 237 L960 540 L0 540Z');
  cut(g, '#467f90', 'M0 338 Q110 309 243 326 T479 323 Q589 307 723 321 T960 296 L960 540 L0 540Z');
  cut(g, '#33697e', 'M0 395 Q89 364 199 389 T430 388 Q503 377 600 392 T827 377 Q885 369 960 380 L960 540 L0 540Z');
  cut(g, '#244e69', 'M0 464 Q112 420 229 456 T458 451 Q557 425 693 452 T960 424 L960 540 L0 540Z');
  for (const s of seaCuts) {
    const x = s.x + (drift ? Math.sin(drift * 0.63 + s.phase) * 5 * s.depth : 0);
    const h = 0.75 + 3.9 * s.depth;
    g.beginPath(); g.moveTo(x, s.y);
    g.quadraticCurveTo(x + s.w * 0.45, s.y - h * 2.1, x + s.w, s.y - h * 0.65);
    g.quadraticCurveTo(x + s.w * 0.48, s.y - h * 0.65, x + s.w * 0.13, s.y + h * 0.45);
    g.closePath(); g.fillStyle = s.phase < 2.2 ? '#c4d6bf' : s.depth < 0.5 ? '#548c97' : '#518a98'; g.fill();
  }
  // A little breakwater establishes a fixed horizon in all three exposures.
  cut(g, '#536d72', 'M0 241 L139 232 L237 230 L238 234 L147 238 L0 250Z');
  for (let i = 0; i < 10; i++) {
    const x = 17 + i * 23, y = 234 - i * 0.64;
    rect(g, x, y, 3.3, 13 - i * 0.6, '#536d72');
  }
  rect(g, 218, 213, 5, 18, '#596e70'); rect(g, 217, 211, 7, 3, '#c57755');
}

function post(g) {
  cut(g, '#564a43', 'M554 349 Q611 336 689 347 L681 540 L551 540Z');
  cut(g, '#a17455', 'M556 353 Q586 360 617 358 L608 540 L551 540Z');
  cut(g, '#c7946b', 'M558 356 Q581 361 596 359 L584 541 L551 540Z');
  cut(g, '#795b4d', 'M617 356 L649 351 L642 540 L607 540Z');
  cut(g, '#df6747', 'M555 350 Q613 359 688 346 L686 386 L671 387 L670 382 L659 392 L628 393 L626 388 L614 394 L582 393 L579 390 L554 392Z');
  cut(g, '#ac4938', 'M633 356 L688 346 L686 386 L671 387 L670 382 L659 392 L630 392Z');
  ellipse(g, 622, 348, 67.5, 9, '#e0a976', -0.022);
  ellipse(g, 619, 346, 48.5, 4, '#a57b60', -0.022);
  for (const s of gouges) {
    const x = 557 + s.x * 123, y = 397 + s.y * 145;
    line(g, x, y, x - s.len / 22, y + s.len, s.x < 0.5 ? '#95684e' : '#574c48', 1.6);
  }
  // Two slanting strands wind around the foot of the post.
  cut(g, '#83745c', 'M553 464 Q615 496 684 474 L683 499 Q617 517 552 489Z');
  for (let i = 0; i < 16; i++) {
    const x = 554 + i * 8.2, y = 467 + 15 * Math.sin(i * Math.PI / 16) + i * 0.47;
    poly(g, '#ceb98c', [x,y,x+4,y+1,x+1,y+14,x-4,y+12]);
  }
}

function leg(g, x, far, stretched) {
  const knee = 58 + stretched * 5, heel = 50 + stretched * 32;
  const toe = x + 3 + (1 - stretched) * -19;
  const color = far ? '#bc7752' : '#d68a5c';
  poly(g, color, [x-5,34,x+1,34,x-2,knee,toe+2,heel,toe+12,heel-1,toe+23,heel+2,toe+13,heel+5,toe+2,heel+4,toe-8,heel+4,toe-11,heel+1,toe-3,heel-1,x-7,knee]);
}

function wing(g, lift) {
  // A raised wing shows its dark primary feathers. Folding rotates the tip behind the tail.
  g.save(); g.translate(2, -5); g.rotate(-0.72 * (1 - lift));
  g.scale(1, 0.42 + lift * 0.58);
  cut(g, '#364e62', 'M29 8 C5 -24 -26 -77 -57 -104 C-96 -140 -162 -176 -236 -186 Q-238 -182 -222 -168 L-211 -157 L-224 -162 Q-224 -155 -195 -134 L-200 -136 Q-201 -128 -168 -107 L-175 -109 Q-163 -93 -135 -80 Q-137 -76 -116 -63 Q-87 -24 -36 11 Q6 28 29 8Z');
  cut(g, '#93acb6', 'M25 7 Q-4 -37 -54 -97 Q-87 -133 -159 -160 L-135 -136 L-160 -148 L-124 -115 L-147 -128 L-111 -96 L-128 -103 Q-100 -75 -87 -71 Q-43 -2 -5 14Z');
  cut(g, '#bfcbd0', 'M22 7 C-5 -31 -21 -67 -60 -100 Q-85 -121 -117 -136 Q-86 -110 -69 -85 L-98 -105 L-66 -67 L-86 -80 Q-74 -54 -51 -40 Q-37 -12 -7 9Z');
  cut(g, '#dce1d9', 'M26 8 Q8 -37 -42 -78 Q-24 -53 -20 -40 L-39 -56 L-29 -36 L-42 -46 Q-19 -6 -8 6Z');
  cut(g, '#e5e1cd', 'M-208 -174 l-13 -6 q-5 -1 2 4 l18 10Z M-199 -156 l-11 -5 l4 5 l15 8Z M-174 -130 l-11 -6 10 10 9 4Z');
  g.restore();
}

function gull(g, x, y, lift, extended, scale, angle, mirror, index) {
  g.save(); g.translate(x, y); g.scale(mirror ? -scale : scale, scale); g.rotate(angle);
  // The far wing silhouettes the near wing when the gull brakes.
  g.save(); g.translate(1, -9);
  g.rotate(index === 1 ? -0.81 : 1.16 + 0.19 * lift);
  g.scale(0.72, index === 1 ? 0.33 : 0.59 + 0.13 * lift);
  cut(g, '#6f8995', 'M20 23 Q-12 -33 -62 -103 Q-97 -150 -166 -187 Q-177 -192 -168 -179 L-146 -150 L-157 -159 Q-150 -140 -124 -112 L-130 -116 Q-116 -89 -90 -68 Q-81 -36 -36 9Z');
  cut(g, '#bec9c6', 'M19 18 Q-20 -66 -102 -139 Q-56 -86 -48 -61 L-65 -74 Q-39 -20 -9 7Z');
  g.restore();
  leg(g, 17, true, extended);
  cut(g, '#c8ceca', 'M-84 1 L-181 -9 L-197 -22 Q-201 -23 -196 -14 L-181 0 L-197 -6 L-184 9 Q-144 25 -81 29Z');
  cut(g, '#fcf3d9', 'M-101 12 Q-81 -13 -34 -12 Q22 -11 42 -30 Q46 -49 60 -56 Q84 -68 100 -54 Q109 -48 109 -31 Q96 -22 90 -9 Q84 26 50 37 Q18 57 -22 49 Q-68 47 -101 25 L-147 18Z');
  cut(g, '#d9d9c8', 'M-135 18 Q-78 23 -40 34 Q13 50 48 34 Q23 54 -15 52 Q-59 51 -100 28Z');
  if (index === 2) {
    cut(g, '#584d48', 'M42 -30 Q46 -49 60 -56 Q84 -68 100 -54 Q109 -48 109 -31 Q98 -22 90 -9 Q61 -10 42 -30Z');
    cut(g, '#ece3cb', 'M82 -48 Q89 -55 97 -49 Q89 -51 82 -46Z M85 -38 Q91 -35 97 -40 Q94 -34 88 -35Z');
  }
  cut(g, index === 2 ? '#c65338' : '#eab451', 'M101 -46 L121 -44 Q137 -42 147 -34 Q131 -34 117 -31 L105 -29 L99 -30Z');
  cut(g, '#a95a3d', 'M132 -38 L144 -34 L133 -33 L127 -34Z');
  ellipse(g, 90, -44, 5, 5, '#e6c363'); ellipse(g, 90.5, -44, 2.8, 2.8, ink);
  if (index === 1) {
    cut(g, '#6d665b', 'M32 -9 Q-16 -29 -78 -4 L-153 8 L-166 15 L-143 14 L-150 18 Q-111 23 -74 19 Q-20 39 16 19 Q32 8 32 -9Z');
    cut(g, '#bcaa8e', 'M27 -8 Q-14 -24 -72 -3 Q-98 4 -118 9 L-89 7 L-100 12 L-72 10 Q-33 23 9 11Z');
    cut(g, '#eee1c4', 'M-68 -2 l19 -4 -9 8Z M-43 -9 l18 -3 -9 8Z M-19 -11 l16 1 -8 4Z M-73 7 l14 -2 -7 6Z M-46 5 l19 -2 -9 6Z M-22 3 l18 -2 -10 7Z M4 -3 l13 1 -7 5Z');
  } else {
    wing(g, lift);
  }
  leg(g, -10, false, extended);
  g.restore();
}

const poses = [
  { x: 625, y: 249, lift: 0.58, size: 1.17, mirror: false },
  { x: 634, y: 254, lift: 0.08, size: 1.11, mirror: true },
  { x: 629, y: 243, lift: 0.92, size: 1.23, mirror: false },
];

function exposure(g, index, approach = 1, drift = 0) {
  g.save(); g.beginPath(); g.rect(0, 0, 960, 540); g.clip();
  water(g, drift); post(g);
  const p = poses[index], glide = 1 - approach;
  ellipse(g, p.x + 2, 346, 8 + 29 * approach, 2 + 2 * approach, '#795942');
  gull(g, p.x - glide * 287, p.y - glide * 64,
    p.lift + glide * 0.27, 1 - 0.76 * glide, p.size, -glide * 0.09, p.mirror, index);
  g.restore();
}

const sheetWidth = 1590, sheetHeight = 316;
const frameWidth = 304, frameHeight = frameWidth * 9 / 16;
const photoX = (i) => 38 + i * 332;
const photoY = 72;
const solo = { x: 122, y: 252, s: 1.054, extra: 102 };
const upper = { x: 172, y: 175, s: 0.99, extra: 0 };
const lower = { x: 172, y: 510, s: 0.99, extra: 0 };
function interpolate(a, b, t) {
  return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), s: mix(a.s, b.s, t), extra: mix(a.extra, b.extra, t) };
}
function folio(g) {
  rect(g, 0, 0, 1920, 1080, '#37677a');
  for (let y = 0; y < 1080; y += 12) {
    line(g, 0, y, 1920, y + 4, '#3a6c7d', 3);
  }
  cut(g, '#1f4858', 'M43 28 L1884 20 L1897 1063 L45 1072Z');
  cut(g, '#c5b597', 'M35 20 L1876 10 L1883 1053 L39 1062Z');
  cut(g, '#e6dbc1', 'M37 15 Q823 6 1873 5 L1876 1045 Q885 1044 36 1055Z');
  const wash = g.createLinearGradient(37, 0, 1866, 1020);
  wash.addColorStop(0, '#faf0d7'); wash.addColorStop(0.46, '#eee4ca'); wash.addColorStop(1, '#dfd1b3');
  rect(g, 58, 25, 1793, 1004, wash);
  for (const [x, y, w] of grains) {
    if (x > 61 && x < 1846 && y > 26 && y < 1022) rect(g, x, y, w, 1.1, '#bcae903a');
  }
  type(g, 'North Pier', 129, 125, 77, ink, 'Serif');
  type(g, `${formatClock(countWindow.start)}–${formatClock(countWindow.end)}`, 1788, 118, 53, ink, 'Mono', 'right');
  line(g, 129, 148, 1787, 148, '#928d7f', 2);
}

function labelTime(g, index, x, y) {
  const t = countWindow.members[index].event;
  type(g, formatClock(t), x, y, 42, ink, 'Mono', 'center');
}

function cropExposure(g, index, x, y, w, h, zoom = 1.16) {
  const scale = Math.max(w / 960, h / 540) * zoom;
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.translate(x - (scale * 960 - w) * 0.62, y - (scale * 540 - h) * 0.29);
  g.scale(scale, scale); exposure(g, index); g.restore();
}

function contactStrip(g, message, place, { members = message.members.length, total = true, mark = 0, incoming = false, redelivery = false } = {}) {
  g.save(); g.translate(place.x, place.y); g.scale(place.s, place.s);
  const h = sheetHeight + place.extra;
  g.fillStyle = '#3c33251a'; g.fillRect(2, 9, sheetWidth, h);
  g.fillStyle = '#4f442936'; g.fillRect(1, 4, sheetWidth, h);
  rect(g, 0, 0, sheetWidth, h, paper);
  // The narrow red and blue selvedges let a returned first strip keep its identity.
  rect(g, 0, 0, 13, h, message.revision === 1 ? red : blue);
  if (total) {
    type(g, `Revision ${message.revision}`, 39, 51, 44, message.revision === 1 ? red : blue, 'Sans', 'left', '600');
    type(g, `${redelivery ? 'Retried' : 'Issued'} ${formatClock(message.time)}`, 1547, 51, 40, ink, 'Mono', 'right');
  }
  for (let i = 0; i < members; i++) {
    const x = photoX(i), fraction = clamp(members - i);
    g.save(); g.globalAlpha *= fraction;
    cropExposure(g, i, x, photoY, frameWidth, frameHeight + place.extra);
    g.strokeStyle = '#24475999'; g.lineWidth = 2; g.strokeRect(x, photoY, frameWidth, frameHeight + place.extra);
    labelTime(g, i, x + frameWidth/2, 293 + place.extra);
    if (mark && i < 2) line(g, x + 77, 301 + place.extra, x + 77 + mark * 147, 301 + place.extra, '#ae5438', 4);
    g.restore();
  }
  if (total) {
    line(g, 1058, 93, 1058, 277 + place.extra, '#c5bfad', 2);
    g.translate(0, place.extra / 2);
    type(g, incoming ? 'Incoming' : 'On file', 1306, 101, 39, ink, 'Sans', 'center');
    type(g, message.count, 1306, 231, 164, ink, 'Serif', 'center');
    type(g, 'landings', 1306, 285, 47, ink, 'Sans', 'center');
  }
  g.restore();
}

function logEntry(g, value) {
  type(g, `${formatClock(readTime)} prediction`, 157, 909, 46, ink, 'Mono');
  line(g, 675, 909, 855, 909, '#aba28b', 2);
  g.save(); g.globalAlpha = value;
  type(g, `${recorded.count} landings`, 898, 909 + 9 * (1 - value), 63, blue, 'Serif', 'left', 'italic');
  g.restore();
}

function fullPicture(g, index, approach, t, timestamp, received = 0) {
  g.save(); g.scale(2, 2); exposure(g, index, approach, t); g.restore();
  pictureTime(g, index, timestamp, received);
}
function pictureTime(g, index, timestamp, received) {
  if (timestamp) {
    g.save(); g.globalAlpha *= timestamp;
    rect(g, 69, 59, 478, 84, '#fff4ddf5');
    type(g, 'North Pier', 91, 116, 49, ink, 'Serif');
    type(g, formatClock(countWindow.members[index].event), 524, 115, 45, ink, 'Mono', 'right');
    g.restore();
  }
  if (received > 0) {
    g.save(); g.globalAlpha *= received;
    rect(g, 69, 143, 478, 69, '#295d6a');
    type(g, `Received ${formatClock(revised.time)}`, 91, 191, 39, '#fff2d8', 'Mono');
    g.restore();
  }
}

function settleIntoPrint(g, index, location, t, received = false) {
  if (t >= 1) return;
  // Interpolate in screen space so the field camera becomes the exact printed exposure.
  const x = mix(0, location.x + photoX(index) * location.s, t);
  const y = mix(0, location.y + photoY * location.s, t);
  const w = mix(1920, frameWidth * location.s, t);
  const h = mix(1080, (frameHeight + location.extra) * location.s, t);
  cropExposure(g, index, x, y, w, h, mix(1, 1.16, t));
  if (t < 0.5) {
    g.save(); g.globalAlpha = 1 - t * 2;
    g.translate(x, y); g.scale(w / 1920, h / 1080);
    pictureTime(g, index, 1, received ? 1 : 0);
    g.restore();
  }
}

function draw(g, c) {
  const e = c.elapsed;
  const cue = (phrase, span) => ease(c.reveal(phrase, span));
  if (c.index === 0) {
    const approach = ease(e / 1.68);
    fullPicture(g, 0, approach, e * (1 - approach), 1);
    return;
  }
  if (c.index === 3) {
    const approach = ease(e / 1.1);
    fullPicture(g, 2, approach, e * (1 - approach), 1, cue('It comes in', 0.45));
    return;
  }
  folio(g);
  switch (c.index) {
    case 1: {
      const second = cue('eleven thirty-seven', 0.65);
      const issued = cue('At twelve twenty-two', 0.32);
      contactStrip(g, first, solo, { members: 1 + second, total: issued > 0.6 });
      settleIntoPrint(g, 0, solo, ease(e / 1.38));
      break;
    }
    case 2: {
      contactStrip(g, firstOnFile, solo);
      const capture = cue('Watch where', 1.2);
      logEntry(g, capture);
      if (capture > 0 && capture < 1) {
        g.save(); g.globalAlpha = Math.sin(capture * Math.PI) * 0.78;
        type(g, recorded.count, mix(solo.x + 1306 * solo.s, 913, capture),
          mix(solo.y + (231 + solo.extra / 2) * solo.s, 909, capture), mix(150, 63, capture), blue, 'Serif', 'center');
        g.restore();
      }
      break;
    }
    case 4: {
      const mark = cue('Find the first two pictures', 0.8);
      contactStrip(g, firstOnFile, upper, { mark });
      contactStrip(g, revised, lower, { mark, incoming: true });
      logEntry(g, 1);
      settleIntoPrint(g, 2, lower, ease(e / 1.45), true);
      break;
    }
    case 5: {
      const lay = ease(e / 1.55);
      const center = cue('The station sends', 0.8);
      const oldPosition = interpolate(upper, solo, center);
      contactStrip(g, firstOnFile, oldPosition);
      contactStrip(g, current, interpolate(lower, oldPosition, lay), { incoming: lay < 1 });
      logEntry(g, 1);
      break;
    }
    case 6: {
      const move = ease(e / 1.25);
      contactStrip(g, current, interpolate(solo, upper, move));
      contactStrip(g, retry, interpolate({ ...lower, x: 2000 }, lower, move), { incoming: true, redelivery: true });
      logEntry(g, 1);
      break;
    }
    case 7: {
      const away = cue('That last delivery', 1.25);
      const settle = cue('The store keeps', 1);
      contactStrip(g, afterRetry, interpolate(upper, solo, settle));
      if (away < 1) contactStrip(g, retry, interpolate(lower, { ...lower, x: -1690 }, away), { incoming: true, redelivery: true });
      logEntry(g, 1);
      break;
    }
  }
}

export default { title, beats, draw, check };
