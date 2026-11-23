import { createCanvas, loadImage, Path2D } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';

export const C = {
  paper: '#f4eddd',
  ink: '#1d3134',
  muted: '#586967',
  line: '#bbbcac',
  teal: '#146b65',
  red: '#a54531',
  gold: '#ba812e',
  blue: '#386987',
  white: '#fffcf1',
  dark: '#193338',
  light: '#c4dad0',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const clip = (t) => Math.max(0, Math.min(1, t));
export function text(g, s, x, y, size = 28, color = C.ink, opts = {}) {
  g.fillStyle = color;
  g.textAlign = opts.align ?? 'left';
  g.font = (opts.weight ?? 400) + ' ' + size + 'px "Lesson ' + (opts.family ?? 'Sans') + '"';
  g.fillText(String(s), x, y);
}
export const mono = (g, s, x, y, size = 28, color = C.ink, align = 'left') =>
  text(g, s, x, y, size, color, { family: 'Mono', align });
export const serif = (g, s, x, y, size = 42, color = C.ink, align = 'left') =>
  text(g, s, x, y, size, color, { family: 'Serif', align });
export function rect(g, x, y, w, h, fill, stroke = null, sw = 1) {
  if (fill) {
    g.fillStyle = fill;
    g.fillRect(x, y, w, h);
  }
  if (stroke) {
    g.lineWidth = sw;
    g.strokeStyle = stroke;
    g.strokeRect(x, y, w, h);
  }
}
export function line(g, x, y, xx, yy, color = C.line, w = 2) {
  g.strokeStyle = color;
  g.lineWidth = w;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.stroke();
}
export function dot(g, x, y, r, color, stroke = null, w = 1) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  if (color) {
    g.fillStyle = color;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = w;
    g.stroke();
  }
}
function shape(g, d, color, stroke = null, w = 1) {
  const p = new Path2D(d);
  if (color) {
    g.fillStyle = color;
    g.fill(p);
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = w;
    g.stroke(p);
  }
}
export function arrow(g, x, y, xx, yy, color, w = 4, head = 13) {
  line(g, x, y, xx, yy, color, w);
  const a = Math.atan2(yy - y, xx - x);
  for (const side of [-1, 1])
    line(
      g,
      xx,
      yy,
      xx - head * Math.cos(a + side * 0.5),
      yy - head * Math.sin(a + side * 0.5),
      color,
      w,
    );
}
export function paintWall(g) {
  const shade = g.createLinearGradient(0, 0, 1600, 900);
  shade.addColorStop(0, '#e3e2d0');
  shade.addColorStop(0.45, '#f5efdf');
  shade.addColorStop(1, '#e9e0ce');
  rect(g, 0, 0, 1600, 900, shade);
}
export function head(g, title, section, hasNote = true) {
  text(g, section, 70, hasNote ? 37 : 72, 23, C.teal, { weight: 600 });
  serif(g, title, 66, hasNote ? 102 : 152, 62);
  line(g, 70, 185, 1530, 185, C.line);
}
export function note(g, s, color = C.ink) {
  line(g, 70, 127, 1530, 127, C.line);
  text(g, s, 70, 160, 31, color);
}
function ellipse(g, x, y, rx, ry, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}
function makeArt(draw) {
  const surface = createCanvas(900, 600),
    g = surface.getContext('2d');
  draw(g);
  return surface;
}
function dog(g) {
  const sky = g.createLinearGradient(0, 0, 0, 600);
  sky.addColorStop(0, '#b4d5ce');
  sky.addColorStop(0.5, '#d9dfae');
  sky.addColorStop(1, '#809255');
  rect(g, 0, 0, 900, 600, sky);
  for (let i = 0; i < 13; i++) {
    const x = i * 85 - 45;
    rect(g, x + 16, 116, 18, 200, '#6b7557');
    ellipse(g, x, 120, 85, 110, i % 2 ? '#759875' : '#729081');
  }
  shape(g, 'M0 395 Q300 262 499 295 T900 323 V600 H0Z', '#99a86d');
  shape(g, 'M0 542 Q350 402 900 473 L900 600 H0Z', '#c4b185');
  ellipse(g, 480, 488, 230, 20, '#9d926d');
  shape(
    g,
    'M312 343 Q276 328 255 289 Q238 270 230 285 Q227 323 284 376 L305 393Z',
    '#a66c40',
    '#573b32',
    5,
  );
  shape(
    g,
    'M344 335 C391 300 460 329 517 314 Q554 291 575 225 Q587 192 628 209 L681 237 Q697 249 735 252 Q742 278 705 294 L655 308 Q637 342 615 374 L599 463 L624 471 Q634 484 608 487 L568 485 L563 395 L535 393 L517 469 L534 474 Q540 484 523 486 L484 483 L489 398 Q425 420 365 393 L330 469 L343 477 Q345 488 325 487 L288 482 L303 435 L309 386 Q296 355 344 335Z',
    '#d49d64',
    '#604539',
    6,
  );
  shape(g, 'M579 223 Q603 192 630 228 Q634 255 611 296 Q591 309 578 284Z', '#7c4e36');
  shape(g, 'M645 262 Q675 251 723 257 Q718 281 699 285 L655 285Z', '#dfb88b');
  ellipse(g, 730, 257, 11, 8, '#342c2b');
  dot(g, 655, 239, 6, '#372d28');
  line(g, 566, 285, 622, 314, '#587e78', 13);
  for (let i = 0; i < 29; i++) {
    const x = (i * 151) % 900,
      y = 485 + ((i * 91) % 110);
    line(g, x, y, x - 6, y - 13, '#8c945e', 2);
  }
}
function bowl(g) {
  const wall = g.createLinearGradient(0, 0, 900, 500);
  wall.addColorStop(0, '#c3d4c9');
  wall.addColorStop(1, '#91aba2');
  rect(g, 0, 0, 900, 600, wall);
  rect(g, 0, 380, 900, 220, '#b88463');
  for (let i = 0; i < 12; i++) line(g, 0, 403 + i * 18, 900, 393 + i * 19, '#a67556', 2);
  ellipse(g, 461, 502, 250, 24, '#93745c');
  ellipse(g, 450, 345, 254, 63, '#586873');
  for (const [x, y, r] of [
    [332, 310, 71],
    [441, 263, 72],
    [535, 289, 78],
    [600, 331, 65],
    [390, 333, 79],
    [490, 341, 75],
    [288, 339, 54],
  ]) {
    const grad = g.createRadialGradient(x - 21, y - 24, 4, x, y, r);
    grad.addColorStop(0, '#ffc46b');
    grad.addColorStop(0.65, '#eb9034');
    grad.addColorStop(1, '#bd602c');
    dot(g, x, y, r, grad);
    shape(g, 'M' + (x - 5) + ' ' + (y - r + 4) + 'q13 -25 38 -17q-15 21 -38 17', '#557952');
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4;
      dot(g, x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.71, 2, '#dc893e');
    }
  }
  shape(
    g,
    'M195 340 Q435 415 706 340 Q671 476 508 497 H401 Q240 466 195 340Z',
    '#e6dfc6',
    '#687884',
    5,
  );
  shape(g, 'M201 351 Q453 419 697 351 L692 367 Q449 432 209 368Z', '#426d83');
  shape(g, 'M249 421 Q449 485 654 419 Q642 440 626 451 Q459 504 278 447Z', '#6b8990');
}
const bike = await loadImage(fileURLToPath(new URL('./bicycle.svg', import.meta.url)));
const prints = [bike, makeArt(dog), makeArt(bowl)];
export function spokeDetail(g, wheel, x, y, w, h) {
  rect(g, x - 7, y - 7, w + 14, h + 14, C.white);
  const left = wheel === 'rear' ? 116 : 684;
  g.drawImage(bike, left, 360, 290, 104, x, y, w, h);
}
export function photo(
  g,
  id,
  x,
  y,
  w,
  h,
  { pin = true, caption = '', angle = 0, pinDrop = 1 } = {},
) {
  g.save();
  g.translate(x + w / 2, y + h / 2);
  g.rotate(angle);
  g.translate(-w / 2, -h / 2);
  const rim = Math.max(5, w * 0.02),
    tail = caption ? Math.max(28, w * 0.065) : rim;
  g.save();
  g.shadowColor = '#18241c45';
  g.shadowBlur = w * 0.024;
  g.shadowOffsetY = 7;
  rect(g, -rim, -rim, w + 2 * rim, h + rim + tail, C.white);
  g.restore();
  g.drawImage(prints[id], 0, 0, w, h);
  if (caption)
    text(g, caption, 0, h + tail * 0.73, Math.max(18, Math.min(31, tail * 0.6)), C.muted);
  if (pin) {
    const y = -rim * 0.48 - 26 * (1 - pinDrop);
    dot(g, w * 0.5, y, Math.max(4, w * 0.009), '#795048');
    dot(g, w * 0.5 - 1, y - 2, Math.max(2, w * 0.006), '#c5825e');
  }
  g.restore();
}

// Coordinates refer to the entire source print, so a grounded box and a crop stay registered.
export const areas = {
  vent: [0.43, 0.295, 0.31, 0.175],
  tag: [0.26, 0.705, 0.4, 0.092],
  layout: [0.12, 0.085, 0.76, 0.83],
};
function rackArt(g) {
  const casing = g.createLinearGradient(0, 0, 850, 600);
  casing.addColorStop(0, '#738986');
  casing.addColorStop(0.5, '#354c4f');
  casing.addColorStop(1, '#758280');
  rect(g, 0, 0, 900, 600, casing);
  rect(g, 108, 51, 684, 498, '#26393c', '#aabbb4', 6);
  for (const x of [129, 752]) {
    rect(g, x, 68, 20, 454, '#657675');
    for (let y = 80; y < 510; y += 30) rect(g, x + 5, y, 10, 14, '#25393b');
  }
  for (let i = 0; i < 5; i++) {
    const y = 87 + 62 * i;
    rect(g, 165, y, 562, 57, i % 2 ? '#697a75' : '#8a9690', '#22383b', 3);
    for (let k = 0; k < 18; k++) {
      rect(g, 190 + k * 27, y + 13, 12, 28, '#2b3f43');
      line(g, 190 + k * 27, y + 41, 202 + k * 27, y + 41, '#b3bcb0', 2);
    }
    for (const x of [176, 714]) {
      dot(g, x, y + 29, 5, '#d1d4c6');
      line(g, x - 3, y + 31, x + 3, y + 27, '#445658', 1);
    }
  }
  const [x, y, w, h] = areas.vent.map((v, i) => v * (i % 2 ? 600 : 900));
  shape(
    g,
    'M' +
      x +
      ' ' +
      (y + 7) +
      ' L' +
      (x + w - 12) +
      ' ' +
      y +
      ' L' +
      (x + w) +
      ' ' +
      (y + h - 16) +
      ' L' +
      (x + w - 35) +
      ' ' +
      (y + h) +
      ' L' +
      (x + 8) +
      ' ' +
      (y + h - 4) +
      'Z',
    '#c77e72',
    '#88524f',
    3,
  );
  shape(g, 'M' + (x + w - 34) + ' ' + (y + h) + 'l7 -22 27 6Z', '#f0ac91');
  const [tx, ty, tw, th] = areas.tag.map((v, i) => v * (i % 2 ? 600 : 900));
  rect(g, tx, ty, tw, th, '#ddd8ba', '#202e30', 2);
  mono(g, 'RACK-17', tx + 18, ty + th * 0.78, 42, '#1e3233');
  for (let i = 0; i < 26; i++) rect(g, tx + 228 + i * 4, ty + 9, (i % 3) + 1, 36, '#364547');
  for (const x of [120, 780]) for (const y of [61, 537]) dot(g, x, y, 4, '#d9dbce');
}
let rackImage;
export function rack(g, x, y, w, h, outline = null, crop = null) {
  rackImage ??= makeArt(rackArt);
  const a = crop ?? [0, 0, 1, 1];
  rect(g, x - 6, y - 6, w + 12, h + 12, C.white);
  g.drawImage(rackImage, a[0] * 900, a[1] * 600, a[2] * 900, a[3] * 600, x, y, w, h);
  if (outline) {
    const [u, v, du, dv] = areas[outline];
    rect(
      g,
      x + ((u - a[0]) / a[2]) * w,
      y + ((v - a[1]) / a[3]) * h,
      (du / a[2]) * w,
      (dv / a[3]) * h,
      null,
      outline === 'tag' ? '#ffc469' : '#84efdf',
      5,
    );
  }
}
export function slot(g, x, y, w, h, color) {
  rect(g, x, y, w, h, '#dadccd', color, 2);
}
