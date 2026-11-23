import { Path2D } from '@napi-rs/canvas';

const outlines = new Map();
function path(data) {
  if (!outlines.has(data)) outlines.set(data, new Path2D(data));
  return outlines.get(data);
}

function shape(c, data, fill, stroke, width = 1.8) {
  const p = path(data);
  if (fill) {
    c.fillStyle = fill;
    c.fill(p);
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke(p);
  }
}

function ellipse(c, x, y, rx, ry, color, rotation = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rotation, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
}

const ink = '#2e302e';
const sparrowBody = 'M133 279 Q184 246 239 184 Q278 146 318 139 Q331 98 364 79 Q399 58 440 73 Q477 86 482 123 Q487 143 475 161 Q500 208 483 254 Q464 307 398 326 Q365 338 298 329 Q238 320 193 311 L147 312 Z';
const robinBody = 'M176 272 Q202 229 242 187 Q268 150 313 128 Q324 96 355 76 Q394 52 433 73 Q472 85 480 125 Q485 145 474 173 Q499 225 469 277 Q441 327 374 334 Q309 345 247 315 L186 307 Z';
const wing = 'M318 151 Q281 144 244 174 Q192 218 139 291 L116 313 Q188 306 243 275 Q294 243 322 190 Q333 163 318 151 Z';

function plumage(c, sparrow) {
  // The pale breast is engraved with short, directional cuts.
  c.save();
  c.clip(path(sparrow ? sparrowBody : robinBody));
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 14; col++) {
      const phase = Math.sin(row * 23.7 + col * 11.2);
      const x = 240 + col * 17 + (row % 2) * 7 + phase * 5;
      const y = 181 + row * 15 + phase * 5;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 3, y + 6, x - 4 - row * 0.6, y + 10 + phase * 2);
      c.lineWidth = 0.9 + (phase + 1) * 0.5;
      c.strokeStyle = row > 6 ? '#918578' : '#a79884';
      c.stroke();
    }
  }
  c.restore();
}

function feathers(c, sparrow) {
  shape(c, wing, sparrow ? '#826348' : '#796a56', ink, 2.7);
  c.save();
  c.clip(path(wing));
  // Long primary feathers converge near the end of the folded wing.
  for (let i = 0; i < 8; i++) {
    const x = 225 + i * 14;
    const y = 177 + i * 2;
    const tip = 114 + i * 8;
    const bottom = 313 - i * 0.8;
    shape(c, `M${x} ${y} Q${x - 19} 233 ${tip} ${bottom} Q${tip + 25} ${bottom + 2} ${x + 19} ${y + 12} Z`,
      sparrow ? '#493e34' : '#554e43', sparrow ? '#dec6a0' : '#a39a80', 2.4);
  }
  shape(c, 'M185 242 Q213 193 243 166 Q276 140 316 148 L330 169 Q291 213 260 222 Q222 229 185 242Z',
    sparrow ? '#ad7549' : '#95846a');
  for (let i = 0; i < 12; i++) {
    const x = 214 + (i % 6) * 17 + Math.floor(i / 6) * 9;
    const y = 212 - (i % 6) * 7 - Math.floor(i / 6) * 14;
    shape(c, `M${x + 7} ${y - 10} q7 -2 8 1 q-6 13 -28 20 q13 -10 20 -21Z`,
      sparrow ? '#493829' : '#786c58');
  }
  if (sparrow) {
    shape(c, 'M188 240 Q224 223 256 217 Q285 211 302 197 L295 209 Q269 225 241 229 L187 248Z', '#f1e1b6');
    shape(c, 'M196 251 Q231 234 259 232 L251 237 Q224 242 196 254Z', '#cda579');
  }
  c.restore();
}

function foot(c, x, y, lean) {
  c.save();
  c.translate(x, y);
  const footpath = `M0 -38 L${lean} -3 Q${lean + 7} -3 ${lean + 20} -2 Q${lean + 27} -1 ${lean + 25} 7 M${lean} -3 Q${lean + 9} 0 ${lean + 9} 7 Q${lean + 8} 11 ${lean + 4} 12 M${lean} -3 Q${lean - 15} -9 ${lean - 19} -7 Q${lean - 24} -6 ${lean - 22} 1`;
  shape(c, footpath, null, ink, 5);
  shape(c, footpath, null, '#ba9274', 2.4);
  c.restore();
}

function twig(c) {
  shape(c, 'M-41 414 Q99 386 183 365 Q251 349 342 350 Q448 356 543 321 L555 322 Q463 369 352 363 Q257 358 185 377 Q62 415 -41 438Z', '#827159', '#423d32', 2);
  shape(c, 'M-35 417 Q79 396 181 370 Q266 348 348 353 Q440 360 522 332', null, '#c0a885', 3.6);
  shape(c, 'M93 392 Q67 375 51 333 Q72 368 108 388Z', '#796951', '#463d31');
  shape(c, 'M514 334 Q537 313 546 284 Q543 310 529 330Z', '#6f6250', '#4e4335');
  shape(c, 'M544 296 Q535 281 543 270 Q555 278 544 296Z', '#917848', '#514332');
  shape(c, 'M526 318 Q536 294 563 293 Q555 312 526 318Z', '#9f9361', '#514c39');
  shape(c, 'M529 315 L556 298', null, '#6d6548', 1.2);
  for (let i = 0; i < 27; i++) {
    const x = i * 17;
    const y = x < 190 ? 411 - x * 0.235 : 362 - Math.sin((x - 190) / 290 * Math.PI) * 6;
    shape(c, `M${x} ${y} q9 -4 16 -4`, null, '#615540', 1.5);
  }
}

export function drawFieldPlate(c, sparrow) {
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  twig(c);
  foot(c, 349, 353, -7);
  foot(c, 395, 354, -3);
  shape(c, sparrow
    ? 'M232 246 Q165 284 45 349 L62 353 L51 361 Q143 346 243 296Z'
    : 'M239 251 Q185 271 101 300 L108 307 L98 312 Q174 308 252 292Z',
  sparrow ? '#695849' : '#796c58', ink, 2.5);
  shape(c, sparrow ? 'M62 351 Q144 314 214 271 M71 355 Q153 329 219 284' : 'M113 305 Q175 288 221 271',
    null, '#b5a083', 2);
  shape(c, sparrow ? sparrowBody : robinBody, sparrow ? '#d7cbb5' : '#dbcdb1', ink, 3.2);
  plumage(c, sparrow);
  if (sparrow) {
    shape(c, 'M263 166 Q299 135 322 133 Q336 99 364 83 Q407 58 440 76 Q466 84 477 111 Q437 124 412 146 Q376 171 347 183 Q305 171 273 189Z', '#9e5d3c');
    shape(c, 'M346 99 Q382 61 427 72 Q453 77 467 94 Q435 90 415 104 Q383 118 357 132 Q355 111 346 99Z', '#9a9788');
    shape(c, 'M347 147 Q380 140 414 117 Q440 103 460 115 Q471 124 473 143 Q455 162 420 169 Q386 176 353 169Z', '#eee2c8');
    shape(c, 'M409 112 Q427 99 444 104 Q461 107 478 122 L478 135 Q456 126 440 126 Q423 128 409 123Z', '#363733');
    shape(c, 'M471 141 Q486 148 477 170 Q482 184 471 207 L470 217 L459 206 L454 215 L446 199 L443 205 Q434 183 414 170 Q449 166 471 141Z', '#363733');
    shape(c, 'M347 152 Q373 133 402 130', null, '#714c39', 2);
    shape(c, 'M469 124 L521 135 L475 148 L463 139Z', '#443f36', ink, 2.5);
    shape(c, 'M472 138 L518 135 L478 145Z', '#a19075');
  } else {
    shape(c, 'M266 168 Q298 134 313 128 Q326 88 363 72 Q413 52 451 86 L433 113 Q397 132 375 177 L309 201Z', '#8b816a');
    shape(c, 'M409 92 Q445 75 467 105 Q482 122 477 154 Q472 169 478 180 Q484 217 457 244 Q431 270 387 272 Q371 268 354 251 Q375 224 368 201 Q359 168 376 137 Q390 108 409 92Z', '#c16a3e');
    shape(c, 'M475 127 L526 134 L476 140Z', '#423d35', ink, 2.4);
    for (let i = 0; i < 28; i++) {
      const x = 380 + (i % 7) * 12 + (i % 2) * 2;
      const y = 168 + Math.floor(i / 7) * 19 + Math.sin(i) * 5;
      shape(c, `M${x} ${y} q3 4 1 8`, null, '#a45b3c', 1.4);
    }
  }
  feathers(c, sparrow);
  const eyeY = sparrow ? 116 : 118;
  ellipse(c, 445, eyeY, 9.5, 9, '#c3a47c');
  ellipse(c, 445, eyeY, 7.8, 7.4, '#25292b');
  ellipse(c, 447.2, eyeY - 2.8, 1.9, 1.8, '#fffbdf');
  c.restore();
}
