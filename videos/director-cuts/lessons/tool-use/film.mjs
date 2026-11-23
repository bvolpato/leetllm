import assert from 'node:assert/strict';
import { RETRY_TRACE } from '../../../films/tool-use/fixtures.mjs';

const title = 'Did Lena’s hold go through?';
const beats = [
  {
    id: 'pickup-band',
    say: 'Lena asked for one copy of River Walk. Her assistant proposed a hold. Her app checked her permission and sent the request to the library.',
    hold: 0.9,
  },
  {
    id: 'lost-on-the-way',
    say: 'Follow the library’s reply on its way back to her phone. Did it get there?',
    hold: 1.7,
  },
  {
    id: 'two-views',
    say: 'The call timed out. From her phone, Lena can’t tell whether the hold went through. A fresh reservation could tie up a second copy.',
    hold: 0.6,
  },
  {
    id: 'under-her-name',
    say: 'Look under her name. Her app gave this reservation an operation key, seventeen. The library recorded the key, the book, and the hold number together.',
    hold: 0.9,
  },
  {
    id: 'same-key',
    say: 'Her app tries again. Watch the key on the second attempt. Seventeen, for the same book. The library finds Lena’s original request under that key.',
    hold: 1.0,
  },
  {
    id: 'back-to-lena',
    say: 'Watch the return trip. This time her assistant gets the saved hold number and can tell Lena her copy is reserved. The app sent the request twice. The library placed one hold. That’s an idempotent retry.',
    hold: 2.5,
  },
];

const saved = RETRY_TRACE.committed.ledger;
const bookTitle = 'River Walk';
const ink = '#24283f';
const cream = '#fff2d6';
const plum = '#4e3444';
const blue = '#334d89';
const limit = value => Math.max(0, Math.min(1, value));
const smooth = value => value * value * (3 - 2 * value);
const lerp = (a, b, t) => a + (b - a) * t;

function box(c, x, y, w, h, color, radius = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fill();
}

function line(c, x, y, u, v, color, width = 1) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function shape(c, color, trace) {
  c.beginPath();
  trace();
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

function type(c, value, x, y, size, color = ink, family = 'Sans', style = '400') {
  c.fillStyle = color;
  c.font = style + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillText(value, x, y);
}

function gradient(c, x, y, u, v, stops) {
  const g = c.createLinearGradient(x, y, u, v);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
}

// Fixed flecks keep the laminate and the relief print still between frames.
function flecks(count, seed) {
  let n = seed;
  function next() {
    n = (Math.imul(1664525, n) + 1013904223) >>> 0;
    return n / 4294967296;
  }
  return Array.from({ length: count }, () => [next(), next(), next(), next()]);
}
const laminate = flecks(850, 45);
const engraving = flecks(260, 26);

function desk(c) {
  c.fillStyle = gradient(c, 260, 0, 1800, 1100, [[0, '#faf0df'], [0.55, '#f2dbbf'], [1, '#d1ab95']]);
  c.fillRect(-400, -400, 2750, 1920);
  for (const [a, b, size, hue] of laminate) {
    const x = a * 2470 - 270, y = b * 1480 - 200;
    line(c, x, y, x + size * 5 + 1, y + (hue - .5) * 5,
      hue > .64 ? '#fff6de99' : '#865f6539', 1 + size * 1.4);
  }
  // A strip of morning light crosses the counter, underneath both objects.
  c.fillStyle = gradient(c, 0, 0, 1100, 540, [
    [0, '#d2a69831'], [.26, '#eabda911'], [.30, '#fff6de60'], [.66, '#fff6de60'],
    [.70, '#ad837635'], [.76, '#ad837635'], [.80, '#fff3ce36'], [1, '#fff3ce00'],
  ]);
  c.fillRect(-400, -400, 2750, 1920);
}

function castShadow(c, x, y, w, h, radius, dx, dy) {
  c.save();
  c.shadowColor = '#47303d55';
  c.shadowOffsetX = dx;
  c.shadowOffsetY = dy;
  c.shadowBlur = 25;
  box(c, x, y, w, h, '#665056', radius);
  c.restore();
}

// Jacket art is a two-color river valley cut into a blue printing block.
function jacket(c) {
  const w = 648, h = 770;
  castShadow(c, 2, 10, w, h, 8, 21, 22);
  box(c, -3, 12, w + 9, h + 5, '#854a47', 8);
  box(c, 10, 8, w - 6, h + 4, '#e4cea2', 5);
  for (let y = h + 1; y < h + 13; y += 3) line(c, 18, y, w, y, '#af9678', 1);
  c.save();
  c.beginPath();
  c.roundRect(0, 0, w, h, 7);
  c.clip();
  box(c, 0, 0, w, h, '#edaa82');
  shape(c, '#fbce98', () => {
    c.arc(500, 222, 96, 0, 2 * Math.PI);
  });
  for (let i = 0; i < 17; i++) {
    const x = 366 + 30 * Math.sin(i * 5);
    const y = 164 + i * 11;
    line(c, x, y, 640, y + 1, '#edaa8288', i % 3 === 0 ? 3 : 1);
  }
  shape(c, '#9292b3', () => {
    c.moveTo(0, 365);
    c.bezierCurveTo(65, 325, 132, 345, 200, 313);
    c.bezierCurveTo(295, 270, 315, 254, 371, 286);
    c.bezierCurveTo(454, 339, 538, 257, 648, 281);
    c.lineTo(w, h); c.lineTo(0, h);
  });
  shape(c, '#657aa7', () => {
    c.moveTo(0, 310);
    c.bezierCurveTo(135, 295, 190, 405, 292, 383);
    c.bezierCurveTo(390, 359, 452, 287, 648, 327);
    c.lineTo(w, h); c.lineTo(0, h);
  });
  shape(c, blue, () => {
    c.moveTo(0, 425);
    c.bezierCurveTo(92, 379, 176, 343, 307, 388);
    c.bezierCurveTo(422, 414, 523, 332, 648, 356);
    c.lineTo(w, h); c.lineTo(0, h);
  });
  for (const [x, y, size] of engraving) {
    const left = x * w, top = 414 + y * 360;
    line(c, left, top, left + 4 + size * 23, top - 2 - size * 7, '#b9bbcc75', 1.5);
  }
  shape(c, '#fce3ac', () => {
    c.moveTo(435, 344);
    c.bezierCurveTo(401, 361, 302, 372, 337, 386);
    c.bezierCurveTo(365, 400, 512, 399, 477, 433);
    c.bezierCurveTo(447, 461, 211, 473, 235, 528);
    c.bezierCurveTo(259, 577, 508, 589, 475, 667);
    c.bezierCurveTo(456, 710, 350, 740, 334, 770);
    c.lineTo(85, 770);
    c.bezierCurveTo(104, 710, 352, 687, 353, 645);
    c.bezierCurveTo(355, 595, 143, 608, 145, 529);
    c.bezierCurveTo(147, 455, 386, 448, 433, 422);
    c.bezierCurveTo(453, 405, 325, 399, 319, 384);
    c.bezierCurveTo(313, 368, 388, 362, 435, 344);
  });
  // A small arched bridge gives scale to the winding river.
  shape(c, ink, () => {
    c.moveTo(263, 383); c.lineTo(371, 371); c.lineTo(371, 384);
    c.lineTo(358, 386); c.bezierCurveTo(353, 363, 292, 375, 296, 393);
    c.lineTo(263, 397);
  });
  line(c, 260, 380, 375, 368, cream, 3);
  type(c, 'River', 63, 136, 127, ink, 'Serif');
  type(c, 'Walk', 114, 254, 127, ink, 'Serif', 'italic');
  box(c, 525, 24, 98, 53, cream, 1);
  type(c, saved.book, 549, 62, 34, ink, 'Mono');
  box(c, 0, 0, 43, h, gradient(c, 0, 0, 43, 0, [
    [0, '#412f566e'], [.43, '#593a5f13'], [.69, '#36274855'], [.83, '#fff2ad6b'], [1, '#f5c09300'],
  ]));
  for (let y = 11; y < h; y += 8) line(c, 2, y, 24, y + 1.2, '#e7c1bd36', 1);
  c.restore();
}

const bookFrame = { x: 1070, y: 79, angle: .048 };
const phoneFrame = { x: 185, y: 118, angle: -.036 };
function place(c, frame) {
  c.translate(frame.x, frame.y);
  c.rotate(frame.angle);
}
function point(frame, x, y) {
  return {
    x: frame.x + x * Math.cos(frame.angle) - y * Math.sin(frame.angle),
    y: frame.y + x * Math.sin(frame.angle) + y * Math.cos(frame.angle),
  };
}

const tabW = 200, tabH = 78;
function replyTab(c, x, y) {
  box(c, x, y, tabW, tabH, plum, 3);
  type(c, saved.result, x + 19, y + 52, 42, cream, 'Mono');
}
function keyTab(c, x, y) {
  box(c, x, y, 264, 64, '#ffcf72', 3);
  type(c, saved.operation, x + 13, y + 46, 40, ink, 'Mono');
  line(c, x + 172, y + 10, x + 172, y + 54, '#a27744', 2);
  type(c, saved.book, x + 194, y + 46, 40, ink, 'Mono');
}

function pickupBand(c, highlight) {
  c.save();
  c.rotate(-.016);
  box(c, 0, 509, 659, 200, '#302e486b', 1);
  const strip = gradient(c, 0, 500, 662, 580, [
    [0, '#b54136'], [.045, '#df634a'], [.12, '#f98e69'], [.60, '#f79571'], [.94, '#f08062'], [1, '#b04b42'],
  ]);
  box(c, -4, 494, 659, 204, strip, 2);
  line(c, 1, 497, 652, 497, '#ffe4aa91', 2);
  line(c, 1, 693, 652, 693, '#bb554e', 2);
  for (let y = 507; y < 688; y += 14) line(c, 235, y, 235, y + 7, '#894e4b', 2);
  type(c, 'LIBRARY HOLD', 18, 551, 24, ink, 'Sans', '600');
  replyTab(c, 17, 573);
  type(c, 'Pickup for', 265, 537, 31, ink);
  type(c, 'Lena', 260, 619, 90, ink, 'Serif', 'italic');
  keyTab(c, 266, 626);
  if (highlight > 0) {
    c.globalAlpha *= highlight;
    line(c, 277, 681, 521, 681, ink, 3);
  }
  c.restore();
}

function phone(c, timedOut, secondCall, delivery, answer, clock) {
  const width = 570, height = 761;
  castShadow(c, 0, 0, width, height, 50, 18, 21);
  box(c, -3, 0, width + 6, height + 7, '#80665d', 52);
  box(c, 0, 0, width, height, ink, 50);
  box(c, 12, 11, width - 24, height - 23, '#fef6e6', 39);
  box(c, 232, 21, 102, 13, ink, 8);
  // The request and its two attempts keep their places while the status changes.
  type(c, 'Lena’s assistant', 47, 104, 36, plum, 'Sans', '600');
  line(c, 46, 129, 521, 129, '#bcb3a5', 2);
  type(c, bookTitle, 45, 220, 71, ink, 'Serif', 'italic');
  type(c, 'Reserve one copy', 48, 269, 34, ink);
  line(c, 46, 315, 521, 315, '#bcb3a5', 2);
  type(c, 'Attempt 1', 49, 376, 38, ink, 'Sans', '600');
  keyTab(c, 252, 328);
  if (timedOut) {
    type(c, 'Timed out', 49, 442, 53, '#97412f');
  } else {
    type(c, 'Waiting', 49, 442, 53, ink);
    for (let i = 0; i < 3; i++) {
      const alpha = .28 + .72 * (.5 + .5 * Math.sin(clock.seconds * 3.4 - i * .9));
      c.save(); c.globalAlpha *= alpha;
      box(c, 251 + i * 19, 426, 10, 10, plum, 5);
      c.restore();
    }
  }
  if (secondCall > 0) {
    c.save();
    c.globalAlpha *= secondCall;
    line(c, 46, 480, 521, 480, '#bcb3a5', 2);
    type(c, 'Attempt 2', 49, 543, 38, ink, 'Sans', '600');
    keyTab(c, 252, 495);
    if (delivery === 1) {
      replyTab(c, 49, 564);
      c.globalAlpha *= answer;
      type(c, 'Your copy is reserved.', 49, 702, 43, ink, 'Serif');
    } else {
      c.globalAlpha *= 1 - smooth(limit(delivery * 2.5));
      type(c, 'Waiting', 49, 630, 53, ink);
    }
    c.restore();
  }
  box(c, 229, height - 32, 112, 6, '#55495e', 3);
}

const bandAngle = bookFrame.angle - .016;
function bandPoint(x, y) {
  return point({ ...bookFrame, angle: bandAngle }, x, y);
}
const bookReply = bandPoint(17, 573);
const phoneReply = point(phoneFrame, 49, 564);
const phoneKey = point(phoneFrame, 252, 495);
const bookKey = bandPoint(266, 626);

function flyingPrint(c, t, from, to, drawPrint, angles, lost = false) {
  if (t <= 0 || t >= 1) return;
  const u = smooth(t);
  const travel = lost ? u * .30 : u;
  const arc = Math.sin(Math.PI * travel);
  c.save();
  const lift = drawPrint === keyTab ? 90 : -14;
  c.translate(lerp(from.x, to.x, travel), lerp(from.y, to.y, travel) - lift * arc);
  c.rotate(lerp(angles[0], angles[1], travel) + .042 * arc);
  c.scale(1 + .06 * arc, 1 + .06 * arc);
  if (lost) {
    // The return ink breaks up in the gap. The print on the book stays intact.
    const erasure = smooth(limit((t - .48) / .52));
    for (let n = 0; n < 13; n++) {
      const delay = ((n * 5) % 13) * .017;
      const decay = limit((erasure - delay) * 1.4);
      if (decay === 1) continue;
      c.save();
      c.globalAlpha *= 1 - decay;
      c.translate(-8 * decay * (n % 4), 20 * decay * Math.sin(n));
      c.beginPath(); c.rect(-1, n * 6, tabW + 2, 6.1); c.clip();
      drawPrint(c, 0, 0);
      c.restore();
    }
  } else {
    c.shadowColor = '#37233744';
    c.shadowOffsetY = 9 * arc;
    c.shadowBlur = 10 * arc;
    drawPrint(c, 0, 0);
  }
  c.restore();
}

function draw(c, clock) {
  const cue = (index, phrase, length) => {
    if (clock.index < index) return 0;
    if (clock.index > index) return 1;
    return clock.reveal(phrase, length);
  };
  const insertion = smooth(limit(clock.seconds / 1.65));
  const lost = cue(1, 'Follow the library’s reply', 2.8);
  const timedOut = cue(1, 'back to her phone', .45) >= 1 && lost >= 1;
  const detail = smooth(cue(3, 'Look under her name', 1.25));
  const secondCall = smooth(cue(4, 'Her app tries again', .55));
  const resubmit = cue(4, 'Watch the key', 2.4);
  const replay = cue(5, 'Watch the return trip', 1.85);
  const answer = smooth(cue(5, 'and can tell Lena', .5));
  const opening = 1 - smooth(limit(clock.seconds / 3.1));

  c.save();
  c.fillStyle = '#f1dbc1';
  c.fillRect(0, 0, 1920, 1080);
  c.translate(960, 504);
  // Cut to what the caller can see, then to the library record it cannot see.
  if (clock.index === 2) {
    c.scale(1.86, 1.86);
    c.translate(-480, -395);
  } else if (clock.index === 3) {
    const zoom = 2.06 + .10 * detail;
    c.scale(zoom, zoom);
    c.translate(-1377, -634);
  } else {
    const zoom = 1.09 + .05 * opening;
    c.scale(zoom, zoom);
    c.translate(-958 + 12 * opening, -477);
  }
  desk(c);
  c.save();
  place(c, phoneFrame);
  phone(c, timedOut, secondCall, replay, answer, clock);
  c.restore();
  c.save();
  place(c, bookFrame);
  c.save();
  c.translate(24 * (1 - insertion), -185 * (1 - insertion));
  c.rotate(-.063 * (1 - insertion));
  jacket(c);
  c.restore();
  pickupBand(c, detail * (1 - replay));
  c.restore();
  flyingPrint(c, lost, bookReply, phoneReply, replyTab, [bandAngle, phoneFrame.angle], true);
  flyingPrint(c, resubmit, phoneKey, bookKey, keyTab, [phoneFrame.angle, bandAngle]);
  flyingPrint(c, replay, bookReply, phoneReply, replyTab, [bandAngle, phoneFrame.angle]);
  c.restore();
}

function check() {
  const { committed, timedOut, retrying, replayed, retryResult } = RETRY_TRACE;
  assert.deepEqual(saved, { operation: 'op-17', book: 'B7', result: 'hold-1' });
  assert.equal(committed.requests, 1);
  assert.equal(timedOut.caller, 'Timed out');
  assert.equal(timedOut.effects, 1);
  assert.equal(retrying.requests, 2);
  assert.deepEqual(retrying.ledger, saved);
  assert.equal(retrying.caller, 'Unknown outcome');
  assert.equal(retryResult.replayed, true);
  assert.equal(replayed.caller, 'Verified ' + saved.result);
  assert.equal(replayed.effects, committed.effects);
}

export default { title, beats, draw, check };
