// The jacket and folding-map plates are adapted from the approved River Walk short.
import { Path2D } from '@napi-rs/canvas';
import { EDGES } from '../../../films/graph-rag/fixtures.mjs';
const ink = '#162a4f',
  blue = '#234695',
  red = '#c84630',
  ivory = '#fff1d7',
  mapInk = '#245347',
  water = '#7bbdbe';
const bookID = EDGES[0].to,
  bookName = 'River Walk',
  parkID = 'place:river';
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function line(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function label(ctx, string, x, y, size, color = ink, family = 'Sans', align = 'left', style = '') {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = (style ? style + ' ' : '') + size + 'px "Lesson ' + family + '"';
  ctx.fillText(string, x, y);
}
const shapes = new Map();
function shape(ctx, d, color, stroke = 0) {
  if (!shapes.has(d)) shapes.set(d, new Path2D(d));
  if (stroke) {
    ctx.strokeStyle = color;
    ctx.lineWidth = stroke;
    ctx.stroke(shapes.get(d));
  } else {
    ctx.fillStyle = color;
    ctx.fill(shapes.get(d));
  }
}
function heron(ctx) {
  shape(
    ctx,
    'M57 485 C102 434 141 410 193 397 C243 385 277 384 291 353 C302 327 260 322 276 287 C284 267 308 264 325 270 L364 279 L323 283 C308 283 297 286 297 298 C297 312 332 330 323 358 C311 402 268 416 256 448 C218 455 181 462 134 466 Z',
    ivory,
  );
  shape(ctx, 'M319 271 L393 273 L324 282 Z', '#efb444');
  ellipse(ctx, 316, 275, 3.4, 3.4, ink);
  shape(
    ctx,
    'M141 450 Q195 416 249 408 M127 460 Q194 438 241 424 M201 451 Q233 438 252 420 M280 287 Q266 307 291 327',
    blue,
    2.2,
  );
  shape(ctx, 'M222 455 L211 498 L237 514 M237 453 L239 495 L263 507', '#ffc96b', 3.5);
}

export function jacket(ctx, match) {
  rect(ctx, 0, 0, 530, 660, red);
  ctx.save();
  ctx.beginPath();
  ctx.rect(36, 0, 494, 660);
  ctx.clip();
  rect(ctx, 36, 0, 494, 660, '#ed7953');
  ellipse(ctx, 432, 322, 88, 88, '#ffca68');
  shape(ctx, 'M20 370 Q104 307 195 346 T380 336 Q485 304 552 337 L552 680 L20 680 Z', '#303769');
  shape(ctx, 'M16 402 Q111 340 203 373 T404 362 Q473 344 541 361 L545 681 L16 681 Z', '#273f87');
  shape(ctx, 'M0 514 Q114 491 209 502 T410 457 Q478 441 537 454 L541 662 L0 665 Z', '#386caa');
  for (let i = 0; i < 23; i++) {
    const x = 48 + ((i * 83) % 454),
      y = 475 + ((i * 17) % 172);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 15, y + 4, x + 33, y - 5, x + 50 + (i % 5) * 7, y - 4);
    ctx.strokeStyle = i % 3 ? '#7cb9c4' : ivory;
    ctx.lineWidth = (i % 3) + 1;
    ctx.stroke();
  }
  heron(ctx);
  for (let i = 0; i < 15; i++) {
    const x = 385 + i * 12,
      top = 610 - ((i * 29) % 91);
    line(ctx, x, 660, x - 30, top, ink, 2);
    line(ctx, x - 31, top, x - 36, top - 22, ink, 4);
  }
  label(ctx, 'River', 62, 112, 100, ink, 'Serif');
  label(ctx, 'Walk', 124, 208, 110, ink, 'Serif', 'left', 'italic');
  ctx.restore();
  rect(ctx, 0, 0, 39, 660, blue);
  for (let x = 3; x < 39; x += 5) line(ctx, x, 0, x, 660, '#ffffff19', 1.2);
  rect(ctx, -2, 539, 303, 79, ivory);
  rect(ctx, -2, 539, 9, 79, ink);
  label(ctx, bookID, 26, 594, 44, ink, 'Mono');
  if (match > 0) rect(ctx, 26, 604, 266 * match, 5, red);
}

const river =
  'M-55 449 C62 430 18 320 142 314 C265 307 302 380 360 328 C427 268 337 227 465 190 C546 168 565 123 660 139';
const trail = 'M-20 338 C62 228 171 238 246 263 C357 298 255 187 337 156 Q390 129 426 91';
export function mapPrint(ctx) {
  rect(ctx, 0, 0, 636, 492, '#e5e6c7');
  shape(
    ctx,
    'M-10 245 Q88 183 186 209 Q252 226 287 209 Q369 197 354 258 Q319 331 246 298 Q122 239 6 367 Z',
    '#b4c995',
  );
  shape(ctx, 'M425 122 Q492 67 639 74 L639 318 Q583 283 567 232 Q544 174 402 208 Z', '#b5c995');
  for (let i = 0; i < 7; i++) {
    ctx.save();
    ctx.translate(-3 * i, 13 * i);
    shape(ctx, 'M-40 272 C118 163 203 255 280 219 S379 98 487 92 Q565 98 666 41', '#98b294', 1.6);
    ctx.restore();
  }
  shape(ctx, river, '#558e9b', 44);
  shape(ctx, river, water, 39);
  ctx.save();
  ctx.setLineDash([8, 8]);
  shape(ctx, trail, '#a95b40', 4.5);
  ctx.restore();
  for (const [x, y] of [
    [33, 208],
    [60, 207],
    [74, 226],
    [104, 198],
    [149, 208],
    [271, 227],
    [467, 118],
    [526, 119],
    [552, 104],
    [485, 143],
  ]) {
    shape(ctx, 'M' + x + ' ' + y + ' l8 -20 8 20 h-6 v7 h-4 v-7 Z', '#6d906b');
  }
  ctx.save();
  ctx.translate(293, 343);
  ctx.rotate(0.32);
  rect(ctx, -17, -39, 34, 78, '#d4ad7b');
  for (let i = -36; i < 37; i += 8) line(ctx, -14, i, 14, i, '#886b55', 2);
  line(ctx, -18, -43, -18, 43, mapInk, 4);
  line(ctx, 18, -43, 18, 43, mapInk, 4);
  ctx.restore();
  label(ctx, 'PARK MAP', 28, 44, 29, mapInk, 'Sans', 'left', '600');
  label(ctx, bookName, 25, 127, 81, mapInk, 'Serif');
  rect(ctx, 0, 404, 636, 88, '#f3f0d9');
  label(ctx, parkID, 30, 463, 43, mapInk, 'Mono');
}
