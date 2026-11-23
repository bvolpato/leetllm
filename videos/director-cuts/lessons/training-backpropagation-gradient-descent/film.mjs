import assert from 'node:assert/strict';
import { Path2D } from '@napi-rs/canvas';

const title = 'Bringing the goldfish into register';

const beats = [
  {
    id: 'cel-drop',
    say: "Look at the goldfish's mouth. The paint has slipped past the ink. A model can slide the whole color cel left or right. How far should it move?",
    hold: 0.9,
  },
  {
    id: 'register',
    say: 'Each cel has a cross. The ink cross stays put. Measure from there to the painted cross. The paint is three millimeters to the right.',
    hold: 0.8,
  },
  {
    id: 'square',
    say: "We'll score the miss by squaring that offset. Use it for the width, then use it again for the height. That gives us nine little squares of loss.",
    hold: 0.8,
  },
  {
    id: 'nudge',
    say: 'Suppose the paint slips a little farther right. Watch the square as it follows. One slide adds area along two edges.',
    hold: 0.9,
  },
  {
    id: 'two-strips',
    say: 'The strip on the right runs the full height of three. The strip on top runs the full width of three. Halve the nudge. Each strip halves in area. The tiny corner falls to a quarter.',
    hold: 1,
  },
  {
    id: 'backward',
    say: "As the nudge gets tiny, the corner's share vanishes. Back at three millimeters, each strip contributes three to the local slope. Both lead back to the same offset. Backpropagation adds those contributions. The gradient here is six.",
    hold: 1,
  },
  {
    id: 'descent',
    say: 'The loss rises as the paint moves right, so gradient descent moves it left. Set the learning rate to one half. How far left is half of six?',
    hold: 1.6,
  },
  {
    id: 'register-holds',
    say: 'Keep your eye on the mouth. Three millimeters. The paint meets the ink, and the two crosses make one.',
    hold: 2.8,
  },
];

const target = 0;
const initial = 3;
const rate = 0.5;
const scaleMM = 31;
const nudge = 0.48;
const register = { x: 1420, y: 635 };

function measure(position) {
  const error = position - target;
  const widthPath = error;
  const heightPath = error;
  return { error, loss: error * error, widthPath, heightPath, gradient: widthPath + heightPath };
}

const first = measure(initial);
const correction = rate * first.gradient;
const aligned = initial - correction;

function check() {
  assert.deepEqual(first, { error: 3, loss: 9, widthPath: 3, heightPath: 3, gradient: 6 });
  const h = 0.0001;
  const slope = (measure(initial + h).loss - measure(initial - h).loss) / (2 * h);
  assert.ok(Math.abs(slope - first.gradient) < 1e-9);
  for (const step of [nudge, nudge / 2]) {
    const addedArea = first.widthPath * step + first.heightPath * step + step * step;
    assert.ok(Math.abs(measure(initial + step).loss - first.loss - addedArea) < 1e-12);
  }
  assert.equal(aligned, target);
  assert.equal(measure(aligned).loss, 0);
  assert.equal(measure(initial - rate * first.widthPath).loss, 2.25);
  return true;
}

const ink = '#253c47';
const red = '#ce4232';
const blue = '#326d93';
const amber = '#a05d23';
const clamp = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => {
  const v = clamp(t);
  return v * v * (3 - 2 * v);
};
const mix = (a, b, t) => a + (b - a) * t;

function line(c, x1, y1, x2, y2, color, weight = 2) {
  c.strokeStyle = color;
  c.lineWidth = weight;
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}

function label(
  c,
  text,
  x,
  y,
  size,
  color = ink,
  align = 'left',
  family = 'Lesson Sans',
  bold = false,
) {
  c.fillStyle = color;
  c.font = (bold ? '600 ' : '') + size + 'px "' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(text, x, y);
}

function ellipse(c, x, y, rx, ry, fill, rotation = 0) {
  c.fillStyle = fill;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  c.fill();
}

const path = (data) => new Path2D(data);
const body = path(
  'M314 214 C360 157 412 98 489 69 C570 37 665 45 730 76 C807 107 829 153 862 179 C882 196 912 194 934 204 Q945 210 931 217 Q941 226 925 232 C888 241 871 255 844 279 C790 327 742 360 644 367 C544 377 459 347 399 304 Q349 270 313 263 Q324 241 314 214 Z',
);
const tail = path(
  'M343 203 C274 208 226 148 170 132 C103 111 70 124 16 98 C46 176 104 219 181 237 C98 236 70 260 14 267 C56 298 104 316 156 312 C111 343 82 399 23 425 C120 440 221 395 266 336 Q304 280 350 257 Z',
);
const dorsal = path(
  'M393 140 C458 94 492 13 521 -32 Q524 -41 532 -31 L552 -6 Q576 -3 591 15 Q623 9 641 34 Q670 31 699 63 L724 97 Q562 54 393 164 Z',
);
const ventral = path('M411 300 Q367 343 309 376 C370 388 461 368 505 334 L529 306 Z');
const pelvic = path('M624 338 C603 373 576 394 559 412 Q638 406 687 349 Z');
const pectoral = path(
  'M718 237 C688 249 622 261 584 305 C622 305 674 298 707 272 Q727 254 718 237 Z',
);
const rays = path(
  'M318 230 Q184 179 54 126 M314 237 Q185 211 111 174 M316 242 Q161 267 52 267 M319 247 Q219 287 123 301 M323 248 Q198 360 65 408 M327 249 Q233 359 157 390 M437 128 Q495 66 527 -20 M473 106 Q516 61 551 2 M522 83 Q559 47 588 19 M577 69 Q609 49 639 37 M408 327 Q368 357 334 370 M451 334 Q410 363 371 373 M650 352 Q615 382 583 398 M703 250 Q641 275 605 296',
);
const gill = path(
  'M785 157 Q811 191 798 222 Q787 252 754 269 M788 160 Q800 184 797 198 M923 218 Q897 224 874 218 M851 246 Q862 243 870 240 M338 222 Q353 232 354 249',
);
const sections = [tail, dorsal, ventral, pelvic, body, pectoral];
const bodyWash = path(
  'M330 254 Q493 302 612 276 C701 256 734 199 802 176 Q826 168 867 182 L950 224 L870 310 L653 406 L444 360 Z',
);
const backWash = path(
  'M319 211 Q424 133 555 124 Q682 115 749 142 Q799 160 850 159 L798 84 L635 19 L442 49 Z',
);
const flank = path(
  'M405 212 Q457 181 492 165 C557 139 600 147 652 138 Q615 170 558 185 Q498 206 405 212 Z',
);
const scaleMarks = new Path2D();
for (let row = 0; row < 5; row++) {
  for (let col = 0; col < 8; col++) {
    const x = 405 + col * 42 + (row % 2) * 21;
    const y = 145 + row * 34 - 18 * Math.sin(col / 3);
    scaleMarks.moveTo(x, y);
    scaleMarks.bezierCurveTo(x + 16, y + 2, x + 19, y + 16, x + 3, y + 24);
  }
}

function colorFish(c) {
  const fins = c.createLinearGradient(80, 110, 393, 320);
  fins.addColorStop(0, '#f3aa65');
  fins.addColorStop(0.47, '#e77843');
  fins.addColorStop(1, '#c64d3a');
  c.fillStyle = fins;
  for (const fin of sections.slice(0, 4)) c.fill(fin);
  const wash = c.createLinearGradient(601, 65, 650, 366);
  wash.addColorStop(0, '#d35039');
  wash.addColorStop(0.51, '#ee8042');
  wash.addColorStop(1, '#f4bf78');
  c.fillStyle = wash;
  c.fill(body);
  c.save();
  c.clip(body);
  c.fillStyle = '#f7cc91';
  c.fill(bodyWash);
  c.fillStyle = '#dd5e39';
  c.fill(backWash);
  c.fillStyle = '#ef9957';
  c.fill(flank);
  c.strokeStyle = 'rgba(255,228,159,0.55)';
  c.lineWidth = 3;
  c.stroke(scaleMarks);
  c.restore();
  c.fillStyle = '#dc7345';
  c.fill(pectoral);
  ellipse(c, 827, 163, 24, 23, '#ffe9ba', -0.15);
}

function inkFish(c) {
  c.strokeStyle = ink;
  c.lineWidth = 3.8;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  // Only the exposed fin contours carry ink where the body overlaps them.
  c.save();
  const outsideBody = path('M-5 -60 H960 V460 H-5 Z');
  outsideBody.addPath(body);
  c.clip(outsideBody, 'evenodd');
  for (const fin of sections.slice(0, 4)) c.stroke(fin);
  c.restore();
  c.stroke(body);
  c.lineWidth = 2.6;
  c.stroke(pectoral);
  c.stroke(gill);
  c.strokeStyle = 'rgba(54,58,61,.56)';
  c.lineWidth = 1.8;
  c.stroke(rays);
  c.strokeStyle = 'rgba(58,67,69,.28)';
  c.lineWidth = 1.3;
  c.stroke(scaleMarks);
  c.strokeStyle = ink;
  c.lineWidth = 3;
  c.beginPath();
  c.ellipse(827, 163, 25, 24, -0.15, 0, Math.PI * 2);
  c.stroke();
  ellipse(c, 834, 163, 12, 14, ink);
  ellipse(c, 838, 158, 3.8, 3.8, '#fff7df');
  ellipse(c, 888, 193, 3, 2, ink);
}

// Fiber marks remain fixed to the paper as the camera travels.
const fibers = new Path2D();
let seed = 7021;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
for (let i = 0; i < 1500; i++) {
  const x = 75 + random() * 1765,
    y = 110 + random() * 865;
  fibers.moveTo(x, y);
  fibers.lineTo(x + 0.8 + random() * 3.5, y + random() * 1.4);
}

function paper(c) {
  c.fillStyle = '#aec8cb';
  c.fillRect(-3000, -3000, 8000, 8000);
  const light = c.createLinearGradient(140, 80, 1760, 1000);
  light.addColorStop(0, '#fffbee');
  light.addColorStop(0.63, '#fcf7e7');
  light.addColorStop(1, '#eae4d6');
  c.save();
  c.shadowColor = '#556b6999';
  c.shadowOffsetX = 4;
  c.shadowOffsetY = 13;
  c.shadowBlur = 15;
  c.fillStyle = light;
  c.fillRect(74, 81, 1770, 903);
  c.restore();
  c.strokeStyle = '#797e7535';
  c.lineWidth = 1;
  c.strokeRect(75, 82, 1768, 901);
  c.strokeStyle = 'rgba(82,89,72,.13)';
  c.lineWidth = 1;
  c.stroke(fibers);
  // The punched edge and field-guide corners identify the animation paper.
  for (const x of [631, 958, 1285]) {
    c.beginPath();
    c.roundRect(x - (x === 958 ? 12 : 32), 101, x === 958 ? 24 : 64, 22, 9);
    c.fillStyle = '#a5b7b7';
    c.fill();
    c.strokeStyle = '#738b8b';
    c.lineWidth = 2;
    c.stroke();
  }
  for (const [x, y, dx, dy] of [
    [157, 177, 1, 1],
    [1757, 177, -1, 1],
    [157, 906, 1, -1],
    [1757, 906, -1, -1],
  ]) {
    line(c, x, y, x + 30 * dx, y, '#8f969080', 1.5);
    line(c, x, y, x, y + 22 * dy, '#8f969080', 1.5);
  }
}

function cross(c, x, y, color, weight) {
  line(c, x - 13, y, x + 13, y, color, weight);
  line(c, x, y - 13, x, y + 13, color, weight);
}

function placeFish(c, fn) {
  c.save();
  c.translate(221, 245);
  c.scale(1.19, 1.19);
  fn(c);
  c.restore();
}

function cels(c, offset, drop) {
  const dx = scaleMM * offset;
  c.save();
  c.translate(dx, -92 * drop);
  c.rotate(-0.024 * drop);
  c.globalAlpha = 1 - 0.35 * drop;
  // A faint beveled acetate edge travels with the pigment plate.
  c.strokeStyle = 'rgba(83,138,155,.32)';
  c.lineWidth = 2.2;
  c.strokeRect(90, 145, 1635, 784);
  c.fillStyle = 'rgba(161,207,214,.055)';
  c.fillRect(90, 145, 1635, 784);
  placeFish(c, colorFish);
  cross(c, register.x, register.y, red, 4.2);
  c.restore();
  placeFish(c, inkFish);
  cross(c, register.x, register.y, ink, 2.6);
}

function state(clock) {
  const { index, elapsed, reveal } = clock;
  let close = index === 0 ? 0 : 1;
  if (index === 1) close = ease(reveal('Each cel', 2.3));
  if (index === 6) close = 1 - ease(reveal('How far left', 1.8));
  if (index === 7) close = 0;
  let trial = 0;
  if (index === 3) trial = nudge * ease(reveal('Suppose the paint', 1.05));
  if (index === 4) trial = nudge * (1 - 0.5 * ease(reveal('Halve the nudge', 0.85)));
  if (index === 5) trial = (nudge / 2) * (1 - ease(reveal('As the nudge gets tiny', 1.7)));
  const fix = index === 7 ? ease(reveal('Keep your eye', 1.65)) : 0;
  return {
    offset: mix(initial + trial, aligned, fix),
    trial,
    close,
    drop: index === 0 ? 1 - ease(elapsed / 0.64) : 0,
    width: index < 2 ? 0 : index === 2 ? ease(reveal('Use it for the width', 0.72)) : 1,
    height: index < 2 ? 0 : index === 2 ? ease(reveal('then use it again', 1)) : 1,
  };
}

function cameraFor(close) {
  const zoom = mix(1, 4.7, close);
  const x = mix(register.x, 547, close);
  const y = mix(register.y, 735, close);
  return { zoom, x, y, unit: scaleMM * zoom };
}

function markDistance(c, x, y, length, opacity) {
  if (opacity <= 0 || length < 1) return;
  c.save();
  c.globalAlpha *= opacity;
  line(c, x, y, x + length, y, ink, 2);
  line(c, x, y - 7, x, y + 7, ink, 2);
  line(c, x + length, y - 7, x + length, y + 7, ink, 2);
  label(c, '3 mm', x + length / 2, y + 44, 38, ink, 'center', 'Lesson Mono');
  c.restore();
}

function lossPaper(c, clock, s, camera) {
  const { index, reveal } = clock;
  const { x, y, unit } = camera;
  const side = unit * initial;
  const extra = unit * s.trial;
  if (index === 1) {
    markDistance(c, x, y + 65, side, ease(reveal('Measure from there', 0.55)));
    return;
  }
  if (index === 7) {
    const remaining = s.offset * unit;
    c.fillStyle = 'rgba(218,120,86,.25)';
    c.fillRect(x, y - remaining, remaining, remaining);
    return;
  }
  if (index < 2) return;
  c.save();
  c.globalAlpha *= s.close;
  const w = side * s.width,
    h = side * s.height;
  c.save();
  c.globalAlpha = 1;
  c.fillStyle = 'rgba(218,120,86,.25)';
  c.fillRect(x, y - h, w, h);
  c.restore();
  if (w > 0) {
    c.strokeStyle = '#b35c44';
    c.lineWidth = 2.4;
    c.strokeRect(x, y - h, w, h);
    for (let i = 1; i < initial; i++) {
      if (unit * i < w) line(c, x + unit * i, y, x + unit * i, y - h, '#b97f65', 2);
      if (unit * i < h) line(c, x, y - unit * i, x + w, y - unit * i, '#b97f65', 2);
    }
  }
  if (index < 3) markDistance(c, x, y + 65, side, 1);
  if (extra > 0) {
    c.fillStyle = '#6f9eb9';
    c.fillRect(x + side, y - side, extra, side);
    c.fillStyle = '#e4ad60';
    c.fillRect(x, y - side - extra, side, extra);
    c.fillStyle = '#534348';
    c.fillRect(x + side, y - side - extra, extra, extra);
  }
  // Put both registration crosses back on top of the lower edge of the construction.
  cross(c, x, y, ink, 4);
  cross(c, x + s.offset * unit, y, red, 4);
  if (index === 4 || index === 5) {
    const right = index === 4 ? ease(reveal('The strip on the right', 0.4)) : 1;
    const top = index === 4 ? ease(reveal('The strip on top', 0.4)) : 1;
    c.save();
    c.globalAlpha *= right;
    line(c, x + side + extra + 15, y - 3, x + side + extra + 15, y - side + 3, blue, 3);
    label(c, '3', x + side + extra + 30, y - side / 2 + 15, 49, blue, 'left', 'Lesson Mono');
    c.restore();
    c.save();
    c.globalAlpha *= top;
    line(c, x + 2, y - side - extra - 15, x + side - 2, y - side - extra - 15, amber, 3);
    label(c, '3', x + side / 2, y - side - extra - 31, 49, amber, 'center', 'Lesson Mono');
    c.restore();
  }
  const tx = 1137;
  if (index === 2) {
    const visible = ease(reveal("We'll score the miss", 0.5));
    c.save();
    c.globalAlpha *= visible;
    label(c, 'Squared error', tx, 421, 49, ink, 'left', 'Lesson Serif');
    if (s.height > 0) {
      c.globalAlpha *= s.height;
      label(c, '3 × 3', tx, 514, 71, ink, 'left', 'Lesson Mono');
      const total = ease(reveal('That gives us nine', 0.45));
      c.globalAlpha *= total;
      label(c, '= 9 mm²', tx, 606, 66, red, 'left', 'Lesson Mono');
    }
    c.restore();
  }
  if (index === 5) {
    const sum = ease(reveal('Both lead back', 0.55));
    c.save();
    c.globalAlpha *= sum;
    label(c, 'Gradient', tx, 421, 49, ink, 'left', 'Lesson Serif');
    label(c, '3', tx, 524, 76, blue, 'left', 'Lesson Mono');
    label(c, '+', tx + 70, 524, 64, ink, 'left', 'Lesson Mono');
    label(c, '3', tx + 136, 524, 76, amber, 'left', 'Lesson Mono');
    c.globalAlpha *= ease(reveal('Backpropagation adds', 0.55));
    label(c, '= ' + first.gradient, tx + 207, 524, 76, ink, 'left', 'Lesson Mono');
    c.restore();
  }
  if (index === 6) {
    label(c, 'Move left', tx, 421, 49, ink, 'left', 'Lesson Serif');
    c.save();
    c.globalAlpha *= ease(reveal('Set the learning rate', 0.65));
    label(c, '½ × ' + first.gradient, tx, 527, 79, ink, 'left', 'Lesson Mono');
    c.restore();
  }
  c.restore();
}

function draw(c, clock) {
  const s = state(clock);
  const camera = cameraFor(s.close);
  c.save();
  c.translate(camera.x, camera.y);
  c.scale(camera.zoom, camera.zoom);
  c.translate(-register.x, -register.y);
  paper(c);
  cels(c, s.offset, s.drop);
  c.restore();
  lossPaper(c, clock, s, camera);
  if (clock.index === 0 || clock.index === 7) {
    const showing =
      clock.index === 0
        ? ease(clock.reveal('The paint has slipped', 0.5))
        : ease(clock.reveal('the two crosses', 0.6));
    c.save();
    c.globalAlpha *= showing;
    const x = register.x + (clock.index === 0 ? (initial * scaleMM) / 2 : 0);
    label(
      c,
      clock.index === 0 ? '3 mm right' : '0 mm',
      x,
      register.y + 78,
      45,
      ink,
      'center',
      'Lesson Mono',
    );
    c.restore();
  }
}

export default { title, beats, draw, check };
