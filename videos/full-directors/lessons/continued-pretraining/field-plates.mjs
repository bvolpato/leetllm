// Two field-guide prints. All coordinates are in the local space of a 700 × 704 plate.
import { createCanvas, Path2D } from '@napi-rs/canvas';

const width = 700;
const height = 704;
const cache = new Map();

function shape(ctx, d, fill, outline, weight = 1) {
  const p = new Path2D(d);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(p);
  }
  if (outline) {
    ctx.lineWidth = weight;
    ctx.strokeStyle = outline;
    ctx.stroke(p);
  }
}

function ellipse(ctx, x, y, rx, ry, color, angle = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function noise(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function texture(ctx, rand) {
  for (let i = 0; i < 15500; i++) {
    ctx.fillStyle = i % 3 ? '#fffae812' : '#10242913';
    const size = 0.3 + rand() * 1.4;
    ctx.fillRect(rand() * width, rand() * height, size * 1.9, size);
  }
}

function staghorn(ctx, rand, x, y, length, angle, thickness, depth, body, shadow, light) {
  const dx = Math.sin(angle),
    dy = -Math.cos(angle);
  const bend = (rand() - 0.5) * length * 0.46;
  const ex = x + dx * length + bend,
    ey = y + dy * length;
  const cx = x + dx * length * 0.48,
    cy = y + dy * length * 0.48;
  const endAngle = Math.atan2(ex - cx, cy - ey);
  function center(t) {
    return [
      (1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t * t * ex,
      (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * ey,
    ];
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const r = thickness / 2;
  const nx = Math.cos(angle) * r,
    ny = Math.sin(angle) * r;
  const tx = Math.cos(endAngle) * r * 0.65,
    ty = Math.sin(endAngle) * r * 0.65;
  ctx.beginPath();
  ctx.moveTo(x - nx, y - ny);
  ctx.quadraticCurveTo(cx - nx, cy - ny, ex - tx, ey - ty);
  ctx.quadraticCurveTo(ex + Math.sin(endAngle) * r, ey - Math.cos(endAngle) * r, ex + tx, ey + ty);
  ctx.quadraticCurveTo(cx + nx, cy + ny, x + nx, y + ny);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();

  // The small projecting cups give the branches their coral surface.
  const count = Math.max(3, Math.floor(length / 8));
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1),
      [px, py] = center(t);
    const side = i % 2 ? 1 : -1;
    const rr = r * (1 - 0.35 * t);
    const bx = px + Math.cos(angle) * rr * 0.88 * side;
    const by = py + Math.sin(angle) * rr * 0.88 * side;
    const a = angle + side * (0.49 + rand() * 0.24);
    const bud = rr * (0.54 + rand() * 0.4);
    const tipX = bx + Math.sin(a) * bud,
      tipY = by - Math.cos(a) * bud;
    ctx.beginPath();
    ctx.moveTo(bx, by + bud * 0.45);
    ctx.lineTo(tipX, tipY);
    ctx.lineWidth = Math.max(2, rr * 0.51);
    ctx.strokeStyle = side > 0 ? shadow : body;
    ctx.stroke();
    ellipse(ctx, tipX, tipY, Math.max(1.5, rr * 0.26), Math.max(0.8, rr * 0.105), light, a);
    ellipse(
      ctx,
      px - rr * 0.21,
      py + rand() * 2,
      Math.max(0.8, rr * 0.13),
      Math.max(0.9, rr * 0.23),
      light,
      angle,
    );
  }
  if (!depth) {
    ellipse(ctx, ex, ey, r * 0.63, r * 0.36, light, endAngle);
    return;
  }
  const fork = rand() > 0.47 ? 1 : -1;
  staghorn(
    ctx,
    rand,
    ex,
    ey,
    length * (0.65 + 0.11 * rand()),
    endAngle * 0.86 - fork * (0.17 + rand() * 0.24),
    thickness * 0.74,
    depth - 1,
    body,
    shadow,
    light,
  );
  const [sx, sy] = center(0.6 + rand() * 0.22);
  staghorn(
    ctx,
    rand,
    sx,
    sy,
    length * (0.58 + 0.12 * rand()),
    endAngle * 0.88 + fork * (0.46 + rand() * 0.35),
    thickness * 0.62,
    depth - 1,
    body,
    shadow,
    light,
  );
}

function fish(ctx, x, y, s, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(s, s);
  shape(
    ctx,
    'M-32 -1 Q-12 -20 9 -13 Q21 -10 33 -1 Q19 14 1 13 Q-17 12 -32 2 L-45 12 Q-41 0 -45 -12 Z',
    '#d6e6d1',
  );
  shape(ctx, 'M-21 0 Q0 1 15 -5 Q8 7 -8 7 Z', '#6eaaa9');
  ellipse(ctx, 21, -3, 1.8, 1.8, '#15445f');
  ctx.restore();
}

function reef(ctx, rand) {
  const water = ctx.createLinearGradient(0, 0, 300, height);
  water.addColorStop(0, '#7ab6bf');
  water.addColorStop(0.36, '#448ea6');
  water.addColorStop(1, '#214968');
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 9; i++) {
    const x = -330 + i * 144 + rand() * 38;
    shape(ctx, 'M' + x + ' -10 l43 0 -213 623 Z', '#e1f4d714');
  }
  for (let y = 4; y < 220; y += 8) {
    for (let j = 0; j < 5; j++) {
      const x = rand() * width - 60,
        len = (0.3 + rand()) * (126 - y * 0.38);
      shape(ctx, `M${x} ${y} q${len * 0.36} -4 ${len} -1`, null, '#e6f1d34c', 1.4);
    }
  }
  for (const [x, y, s, angle] of [
    [100, 136, 0.66, -0.12],
    [199, 113, 0.81, -0.1],
    [277, 151, 0.59, -0.18],
    [375, 95, 0.45, -0.17],
    [427, 122, 0.54, -0.15],
    [480, 89, 0.36, -0.14],
  ]) {
    fish(ctx, x, y, s, angle);
  }
  shape(ctx, 'M0 480 Q91 479 185 550 Q272 593 401 520 Q568 441 700 446 V704 H0 Z', '#34657c');
  for (const [x, len, ang] of [
    [34, 160, -0.36],
    [125, 122, 0.41],
    [550, 139, 0.47],
    [608, 182, 0.52],
  ]) {
    staghorn(ctx, rand, x, 703, len, ang, 32, 4, '#428291', '#367584', '#76a8a7');
  }
  shape(
    ctx,
    'M-10 632 Q75 576 173 627 Q255 675 322 638 Q444 568 520 630 Q614 664 710 600 V714 H-10 Z',
    '#21475e',
  );
  for (const [x, y, len, ang, th, levels] of [
    [301, 750, 178, -0.68, 53, 4],
    [390, 722, 181, 0.42, 47, 4],
    [298, 748, 218, 0.03, 62, 4],
    [245, 735, 144, -0.63, 43, 3],
    [460, 741, 145, 0.66, 41, 3],
  ]) {
    staghorn(ctx, rand, x, y, len, ang, th, levels, '#ed9776', '#bb645e', '#ffd9a3');
  }
}

function leaf(ctx, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  shape(ctx, 'M0 0 Q5 -17 33 -16 Q25 2 0 0 Z', color);
  ctx.restore();
}

function robin(ctx, rand) {
  ctx.fillStyle = '#d8cf93';
  ctx.fillRect(0, 0, width, height);
  ellipse(ctx, 430, 212, 175, 175, '#efe1ab');
  shape(
    ctx,
    'M-30 568 Q93 425 161 218 Q185 122 158 -10 L191 -10 Q217 160 187 265 Q172 315 166 347 Q243 250 276 153 Q270 275 167 390 Q117 520 49 656 Z',
    '#bcc395',
  );
  shape(
    ctx,
    'M720 425 Q550 307 526 195 Q566 290 633 329 Q606 235 636 133 Q625 267 720 346 Z',
    '#c4c794',
  );
  for (let i = 0; i < 92; i++) {
    const left = i % 2,
      x = left ? rand() * 136 - 19 : 580 + rand() * 156;
    leaf(ctx, x, rand() * 350, rand() * 5, 0.55 + rand() * 0.7, '#a7b58a');
  }
  // Feet grip the top of the bough. The silhouette includes the long tail behind the folded wing.
  shape(
    ctx,
    'M-30 690 Q230 612 427 530 Q579 458 731 448 L734 466 Q577 483 452 552 Q270 644 50 731 H-30 Z',
    '#403e3c',
  );
  shape(ctx, 'M-16 704 Q307 591 425 540 Q560 475 688 459', null, '#b48f60', 4);
  shape(
    ctx,
    'M447 535 Q506 465 506 407 Q518 457 477 521 Z M600 477 Q646 434 674 384 Q658 437 631 474 Z',
    '#484a40',
  );
  for (let i = 0; i < 48; i++) {
    const t = rand(),
      x = 687 * t;
    const y = 686 - 262 * t + 22 * t * t;
    shape(ctx, `M${x} ${y + 15 + rand() * 12} l${16 + rand() * 22} -10`, null, '#c2a97b', 1.8);
  }
  for (const [x, y, ang, sc] of [
    [645, 414, -0.3, 1.1],
    [657, 405, -1.6, 0.8],
    [509, 436, -2.1, 0.72],
    [506, 419, -1.3, 0.84],
    [658, 400, -0.9, 0.6],
  ]) {
    leaf(ctx, x, y, ang, sc, '#698067');
  }

  shape(ctx, 'M261 424 Q198 495 77 582 Q59 597 83 590 Q175 570 285 504 L350 432 Z', '#313f45');
  shape(ctx, 'M267 437 Q199 520 97 573 M270 457 Q200 531 124 566', null, '#78827e', 3);
  shape(
    ctx,
    'M357 491 L369 546 L344 568 M369 545 Q385 532 405 538 M369 546 Q394 539 406 549 M406 464 L428 519 L409 536 M428 520 Q453 515 462 523 M427 519 Q451 507 461 512',
    null,
    '#544b3f',
    5,
  );
  shape(
    ctx,
    'M208 468 C252 410 258 319 318 243 C351 201 331 142 379 115 C429 84 495 111 508 161 Q517 190 507 214 C533 239 552 294 534 359 C517 416 467 470 408 498 C341 531 261 508 208 468 Z',
    '#394958',
  );
  shape(
    ctx,
    'M427 175 Q455 211 509 209 C554 259 554 338 522 387 C500 425 469 452 427 471 Q362 444 356 399 Q359 257 427 175 Z',
    '#c66c47',
  );
  shape(
    ctx,
    'M353 413 Q381 458 429 459 Q470 453 506 416 Q474 477 396 501 Q336 520 291 500 Z',
    '#f0dabb',
  );
  shape(ctx, 'M461 179 Q481 175 508 173 L565 186 L506 198 Q474 202 456 192 Z', '#e7bd69');
  shape(ctx, 'M485 189 L562 186 L507 198 L485 197 Z', '#766243');
  shape(ctx, 'M398 124 Q440 106 477 133 M382 136 Q411 113 444 119', null, '#7e8980', 3);
  ellipse(ctx, 466, 158, 17, 16, '#efe4c4', -0.13);
  ellipse(ctx, 467, 158, 12.5, 12.5, '#202a32');
  ellipse(ctx, 471, 154, 3.7, 3.7, '#fff5db');
  shape(
    ctx,
    'M392 239 C349 229 312 246 285 289 C257 336 233 422 175 501 Q170 511 190 505 C267 485 345 412 385 344 Q416 283 392 239 Z',
    '#52606a',
  );
  shape(
    ctx,
    'M303 310 Q330 259 378 255 Q400 258 392 285 Q382 316 344 342 Q311 358 277 367 Z',
    '#626f76',
  );
  for (let i = 0; i < 6; i++) {
    const x = 288 + i * 15,
      y = 339 + i * 3;
    shape(
      ctx,
      `M${x} ${y} Q${x - 38} ${y + 103} ${185 + i * 10} ${501 - i * 8}`,
      null,
      i % 2 ? '#33434e' : '#a0a499',
      3.7,
    );
  }
  for (let i = 0; i < 95; i++) {
    const x = 378 + rand() * 159,
      y = 223 + rand() * 231;
    if (((x - 451) / 88) ** 2 + ((y - 326) / 115) ** 2 > 0.84 || x < 403 - (y - 250) * 0.16)
      continue;
    shape(ctx, `M${x} ${y} q5 9 12 11`, null, i % 2 ? '#dc9168' : '#ae634d', 2.3);
  }
  for (let i = 0; i < 53; i++) {
    const x = 285 + rand() * 108,
      y = 244 + rand() * 94;
    if (((x - 340) / 60) ** 2 + ((y - 290) / 47) ** 2 > 0.9) continue;
    shape(ctx, `M${x} ${y} q-2 10 -12 13`, null, '#93a09d', 2.2);
  }
  shape(
    ctx,
    'M424 179 Q409 181 400 192 M430 188 Q417 191 409 201 M436 197 Q426 198 418 207',
    null,
    '#e8d7b3',
    3.6,
  );
}

export function plate(kind) {
  if (!cache.has(kind)) {
    const canvas = createCanvas(width, height),
      ctx = canvas.getContext('2d');
    const rand = noise(kind === 'reef' ? 79521 : 18166);
    if (kind === 'reef') reef(ctx, rand);
    else robin(ctx, rand);
    texture(ctx, rand);
    cache.set(kind, canvas);
  }
  return cache.get(kind);
}
