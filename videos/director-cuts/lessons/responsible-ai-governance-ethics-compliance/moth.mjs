import { createCanvas, Path2D } from '@napi-rs/canvas';
import { createHash } from 'node:crypto';

// Both print files come from this drawing. Only the extra mark changes.
const forewing =
  'M 10 -29 C 121 -91 315 -199 486 -219 C 520 -225 549 -223 548 -209 C 545 -173 505 -84 467 -35 Q 449 -12 440 -14 Q 419 18 405 15 Q 384 48 362 42 Q 339 67 317 58 Q 275 81 231 75 Q 136 62 32 12 Z';
const hindwing =
  'M 17 -10 C 103 0 247 -39 345 -4 C 365 39 338 101 291 151 Q 279 172 262 167 Q 242 194 223 183 Q 202 211 181 192 Q 142 210 111 183 Q 63 165 37 103 Q 23 70 12 33 Z';

function ink(ctx, path, fill, stroke, width = 1) {
  const p = new Path2D(path);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(p);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke(p);
  }
}
function oval(ctx, x, y, rx, ry, angle, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, 2 * Math.PI);
  ctx.fillStyle = fill;
  ctx.fill();
}
function randomSequence(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function etching(ctx, contour, random) {
  ctx.save();
  ctx.clip(new Path2D(contour));
  for (let i = 0; i < 2800; i++) {
    const x = random() * 555,
      y = random() * 445 - 230;
    const length = 1 + 5 * random();
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,238,178,.31)' : 'rgba(46,23,29,.25)';
    ctx.fillRect(x, y, length, 1.15);
  }
  ctx.restore();
}
function eyespot(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.32);
  ctx.scale(size, size);
  // Offset nested ovals give the irregular edge of deposited pigment.
  oval(ctx, 0, 0, 62, 47, 0, '#593342');
  oval(ctx, 1, -1, 54, 40, -0.035, '#fff0b4');
  oval(ctx, 3, 0, 44, 32, 0.035, '#ad6543');
  oval(ctx, 3, -1, 36, 26, 0.02, '#30232f');
  ink(ctx, 'M -16 3 Q -4 -20 26 -13 Q 11 -4 -16 3 Z', '#f2dfb1');
  ctx.restore();
}
function wing(ctx, side, revised) {
  const random = randomSequence(734);
  ctx.save();
  ctx.scale(side, 1);
  const hind = ctx.createLinearGradient(40, -28, 202, 221);
  hind.addColorStop(0, '#cf8f60');
  hind.addColorStop(0.48, '#f1b770');
  hind.addColorStop(1, '#ab5947');
  ink(ctx, hindwing, hind, '#563844', 3);
  ctx.save();
  ctx.clip(new Path2D(hindwing));
  ink(ctx, 'M 40 81 Q 156 192 348 37 M 53 96 Q 175 213 347 57', null, '#774451', 7);
  for (let i = 0; i < 14; i++) {
    const x = 75 + i * 18,
      y = 177 + 27 * Math.sin(i / 4) - i * 3.1;
    ink(ctx, `M 20 3 Q ${x - 58} 71 ${x} ${y}`, null, '#9b5c46', 1.9);
  }
  ctx.restore();
  etching(ctx, hindwing, random);

  const fore = ctx.createLinearGradient(40, 14, 510, -196);
  fore.addColorStop(0, '#9a5a49');
  fore.addColorStop(0.28, '#d58c53');
  fore.addColorStop(0.7, '#e4a75d');
  fore.addColorStop(1, '#bc6a4c');
  ink(ctx, forewing, fore, '#55333c', 3.2);
  ctx.save();
  ctx.clip(new Path2D(forewing));
  ink(ctx, 'M 64 -100 Q 151 -11 115 97 L 165 89 Q 209 9 134 -120 Z', '#a2624e');
  ink(ctx, 'M 77 -102 Q 161 -10 133 104', null, '#edd59b', 7);
  ink(
    ctx,
    'M 512 -248 Q 537 -137 424 -37 Q 324 58 222 79 L 366 112 L 592 -137 L 582 -260 Z',
    '#744551',
  );
  ink(ctx, 'M 512 -245 Q 519 -153 428 -57 Q 342 38 225 72', null, '#f4d492', 8);
  ink(ctx, 'M 525 -241 Q 541 -149 442 -47 Q 351 58 248 81', null, '#d38464', 4);
  for (const [x, y] of [
    [519, -207],
    [543, -167],
    [490, -82],
    [429, -15],
    [366, 44],
    [305, 64],
    [225, 69],
  ]) {
    ink(ctx, `M 16 -23 Q 138 -2 ${x} ${y}`, null, 'rgba(99,53,51,.72)', 2.35);
  }
  for (let i = 0; i < 48; i++) {
    const a = random() * 82 + 34,
      h = random() * 22;
    ink(ctx, `M ${a} ${-35 - h} q 26 -9 57 -12`, null, 'rgba(255,222,151,.4)', 1.55);
  }
  const scallops = [
    [489, -122],
    [468, -87],
    [441, -53],
    [414, -26],
    [383, 2],
    [349, 28],
    [314, 45],
  ];
  for (const [x, y] of scallops) {
    ink(ctx, `M ${x - 9} ${y + 3} q 12 -16 18 -16 q -3 12 -18 20 Z`, '#efc17b');
  }
  etching(ctx, forewing, random);
  eyespot(ctx, 220, -39, 1.05);
  if (revised && side === 1) eyespot(ctx, 372, -105, 0.8);
  ctx.restore();
  ctx.restore();
}
function body(ctx) {
  ink(
    ctx,
    'M -17 -54 C -39 -21 -18 16 -16 52 Q -12 100 0 126 Q 16 98 20 44 Q 26 5 18 -49 Z',
    '#51383b',
    '#372b34',
    2,
  );
  for (let i = 0; i < 11; i++) {
    const y = 9 + i * 9,
      half = 17 - i * 0.93;
    ink(ctx, `M -${half} ${y} Q 0 ${y + 12} ${half} ${y - 1}`, null, '#c29369', 3);
  }
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ink(ctx, 'M 9 -64 Q 40 -158 112 -160 Q 64 -155 14 -66 Z', '#59403e');
    for (let i = 0; i < 29; i++) {
      const t = (i + 1) / 31;
      const x = 10 + 100 * t,
        y = -64 - 96 * (1 - (1 - t) ** 2.6);
      const h = 12 * Math.sin(t * Math.PI);
      ink(
        ctx,
        `M ${x} ${y} q -2 ${-h} -1 ${-h - 4} M ${x} ${y} q 4 ${h} 9 ${h + 1}`,
        null,
        '#6d4942',
        1.9,
      );
    }
    ctx.restore();
  }
  oval(ctx, 0, -45, 25, 40, 0, '#5e403b');
  const random = randomSequence(289);
  for (let i = 0; i < 390; i++) {
    const a = random() * Math.PI * 2,
      r = Math.sqrt(random());
    const x = r * 24 * Math.cos(a),
      y = -44 + r * 38 * Math.sin(a);
    ink(ctx, `M ${x} ${y} q 1 4 ${x / 9} 8`, null, i % 3 ? '#c49b6e' : '#7f5142', 1.35);
  }
  oval(ctx, 0, -81, 16, 13, 0, '#513740');
}

export function makePrintFile(number, revised) {
  const canvas = createCanvas(1200, 530),
    ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f4e8ce';
  ctx.fillRect(0, 0, 1200, 530);
  const random = randomSequence(199);
  for (let i = 0; i < 7700; i++) {
    ctx.fillStyle = i % 4 ? 'rgba(110,72,40,.075)' : 'rgba(255,255,245,.51)';
    ctx.fillRect(random() * 1200, random() * 530, random() * 4 + 1, 1);
  }
  ctx.translate(600, 276);
  wing(ctx, -1, revised);
  wing(ctx, 1, revised);
  body(ctx);
  const bytes = canvas.toBuffer('image/png');
  return { number, canvas, bytes, digest: createHash('sha256').update(bytes).digest('hex') };
}
