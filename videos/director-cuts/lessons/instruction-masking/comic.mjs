import { Path2D } from '@napi-rs/canvas';

export const ink = '#292439';
export const stock = '#fff6de';
const strokes = new Map();

export function shape(ctx, data, color, outline = ink, width = 2.8) {
  if (!strokes.has(data)) strokes.set(data, new Path2D(data));
  const contour = strokes.get(data);
  if (color) {
    ctx.fillStyle = color;
    ctx.fill(contour);
  }
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = width;
    ctx.stroke(contour);
  }
}

function oval(ctx, x, y, rx, ry, fill, stroke = null, width = 2) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

// The two dot patterns stay fixed as the characters and ball move.
function screenTone(x, y, w, h) {
  const path = new Path2D();
  for (let j = 0; j * 6 < h; j++) {
    for (let i = 0; i * 6 < w; i++) {
      const left = x + i * 6 + (j % 2) * 3;
      const top = y + j * 6;
      path.moveTo(left + 0.9, top);
      path.arc(left, top, 0.9, 0, 2 * Math.PI);
    }
  }
  return path;
}

const windowTone = screenTone(52, 160, 246, 138);
const parkTone = screenTone(468, 160, 470, 120);

function cityWindow(ctx) {
  ctx.fillStyle = '#b4adcc';
  ctx.fillRect(0, 0, 480, 500);
  // The afternoon light falls through a sash window behind the caller.
  shape(ctx, 'M46 35 L305 35 L300 350 L46 390Z', '#f5c3a2');
  ctx.fillStyle = '#deac91';
  ctx.fill(windowTone);
  shape(ctx, 'M49 294 L89 291 L88 264 L120 261 L120 226 L138 226 L138 262 L165 260 L165 288 L193 287 L193 241 L217 240 L218 279 L247 278 L248 231 L265 229 L264 204 L280 204 L281 231 L301 229 L300 342 L47 381Z', '#bab1c5', null);
  shape(ctx, 'M49 312 L300 279 L300 294 L50 329Z M100 50 L111 49 L112 371 L100 375Z', '#fff0cf', '#635674', 2);
  shape(ctx, 'M23 381 L346 329 L347 344 L23 401Z', '#e7cebf');
  shape(ctx, 'M303 35 L335 35 L333 330 L299 337Z', '#d3c6d4');
  shape(ctx, 'M322 172 L320 327 M310 239 L309 325', null, '#a99bb5', 1.5);
  shape(ctx, 'M348 396 L385 366 L427 384 L479 361 L480 480 L347 480Z', '#9588ad', null);
}

function caller(ctx) {
  ctx.save();
  ctx.translate(61, 205);
  ctx.scale(0.99, 0.99);
  const skin = '#c47f60';
  const light = '#e1a37a';
  const hair = '#443547';
  // Wool sweater, neck and a three-quarter profile facing the handset.
  shape(ctx, 'M37 258 Q45 216 76 197 L113 176 L135 168 L166 172 Q193 175 213 193 L246 215 L291 250 L297 281 L32 281Z', '#e87553');
  shape(ctx, 'M99 183 L117 164 L119 132 L157 115 L176 120 L162 152 Q157 164 164 176 L178 184 Q158 211 129 205 Q107 201 99 183Z', skin);
  shape(ctx, 'M117 157 Q127 173 154 178 L161 155 L166 137Z', '#965c50', null);
  shape(ctx, 'M102 183 Q126 209 158 197 Q168 192 175 181 L186 185 Q155 226 112 205 L94 190Z', '#fff0cc');
  shape(ctx, 'M63 236 Q72 218 88 209 M60 245 L70 233 M190 211 Q181 221 178 236 M204 215 L196 230 M79 255 L90 229', null, '#854d51', 2.2);
  shape(ctx, 'M101 103 C95 78 106 46 129 34 C157 22 192 30 200 59 Q205 72 200 85 Q202 94 214 104 Q216 109 204 112 Q200 115 203 120 L200 123 Q204 130 194 132 Q190 150 176 152 Q151 155 131 138 L115 125Z', light);
  shape(ctx, 'M176 49 Q190 55 195 70 L201 74 L200 61 L194 46Z', '#c4876c', null);
  shape(ctx, 'M106 105 C84 92 78 67 85 53 C74 46 81 32 89 31 C83 19 98 11 111 14 C111 2 129 0 140 8 C154 -1 168 7 173 15 C192 7 207 24 205 33 C220 41 213 60 200 63 Q187 63 181 54 Q170 60 155 53 Q152 74 134 88 L136 117 L127 123 L116 111Z', hair);
  shape(ctx, 'M91 44 Q90 32 102 29 M113 22 Q126 12 135 24 M148 24 Q159 17 166 29 M91 63 Q98 47 110 51 M111 69 Q116 55 128 57 M180 38 Q192 34 197 43', null, '#816176', 2.4);
  shape(ctx, 'M127 91 Q111 76 105 91 Q102 104 117 115 Q125 119 130 112', light);
  shape(ctx, 'M112 95 Q119 89 124 103 M188 86 L198 86 M189 79 Q195 76 201 79 M190 120 Q196 122 201 120', null, ink, 2.6);
  oval(ctx, 195, 88, 2, 3.2, ink);
  oval(ctx, 122, 111, 3.5, 3.5, stock, ink, 1.5);
  // Both forearms and the thumb share the same point of contact with the phone.
  shape(ctx, 'M209 202 Q224 178 246 160 L254 147 L272 155 Q260 178 255 198 L236 230Z', light);
  shape(ctx, 'M177 256 L196 202 L210 183 Q218 177 228 182 L253 196 Q245 226 227 253 L223 273Z', '#eb865d');
  shape(ctx, 'M209 184 Q224 179 249 196 M205 191 Q220 186 246 204 M219 223 L233 203', null, '#874c50', 2);
  shape(ctx, 'M248 153 L246 135 L251 121 L259 110 L270 117 L279 139 L272 158 L259 171Z', light);
  shape(ctx, 'M246 141 L235 90 Q234 86 239 83 L261 77 Q266 76 267 81 L280 134 Q281 139 276 140 L253 147 Q248 148 246 141Z', '#51485e');
  shape(ctx, 'M241 91 L260 86 L269 124 L250 129Z', '#b0c5d7', null);
  shape(ctx, 'M246 139 Q239 124 241 119 Q242 115 245 117 L256 133 L266 136 M271 149 Q279 144 277 139 L272 129 Q269 125 267 129 L269 139', light, ink, 2.2);
  ctx.restore();
}

function park(ctx) {
  ctx.fillStyle = '#f5c297';
  ctx.fillRect(463, 18, 488, 455);
  ctx.fillStyle = '#dd997b';
  ctx.fill(parkTone);
  oval(ctx, 848, 225, 46, 46, '#ffe6af');
  shape(ctx, 'M465 289 Q481 262 501 271 Q517 246 535 267 Q557 239 578 258 Q594 245 612 267 Q634 247 648 267 Q673 233 696 257 Q715 247 731 263 Q761 227 780 253 Q800 236 819 253 Q842 226 862 247 Q878 223 896 239 Q917 223 943 237 L944 358 L461 358Z', '#bb9eaa', null);
  shape(ctx, 'M466 320 Q610 296 757 296 Q860 289 940 273 L946 373 L466 401Z', '#d9b48a', null);
  shape(ctx, 'M464 315 L946 268 M465 326 L945 277', null, '#8a788a', 2);
  for (let i = 0; i < 10; i++) {
    const x = 477 + i * 51;
    const y = 315 - i * 5;
    ctx.fillStyle = '#8a788a';
    ctx.fillRect(x, y - 8, 3.5, 34);
  }
  shape(ctx, 'M460 362 Q621 314 758 327 L939 302 L947 478 L461 478Z', '#c4bc89', null);
  shape(ctx, 'M460 431 Q596 375 722 379 Q834 366 944 345 L944 472 L460 478Z', '#a6a37d', null);
  shape(ctx, 'M478 379 l12 -3 m-3 7 l18 -4 M834 350 l15 -2 M571 367 l13 -4 M576 370 l6 -2 M871 381 l27 -7 M905 338 l10 -2 M526 428 l18 -6 M544 428 l12 -3 M807 427 l16 -3', null, '#83816c', 2);
}

function tennisBall(ctx, x, y, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  oval(ctx, 0, 0, 15, 15, '#e0e562', ink, 2.8);
  shape(ctx, 'M-10 -10 Q-1 -6 -4 0 Q-10 7 -4 14 M6 -13 Q3 -6 12 -1', null, '#ffffcf', 2.2);
  ctx.restore();
}

function spaniel(ctx, seconds, flight) {
  const jump = Math.sin(Math.PI * flight);
  const bob = Math.cos(seconds * 2.0) * 0.7;
  const x = 698 - 19 * jump;
  const y = 335 - 34 * jump + bob;
  oval(ctx, 773, 430, 104 - 20 * jump, 9, '#858274');
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.06 * jump);
  // A feathery tail hinges at the rump.
  ctx.save();
  ctx.translate(149, 29);
  ctx.rotate(0.16 * Math.sin(7 * seconds));
  shape(ctx, 'M-8 2 Q15 -2 29 -23 Q45 -46 61 -56 Q59 -44 55 -37 L65 -44 Q60 -29 52 -22 L58 -24 Q43 -2 29 6 Q10 16 -2 14Z', '#ae5c40');
  shape(ctx, 'M25 -9 Q42 -21 53 -39', null, '#d78c59', 2.3);
  ctx.restore();
  // Hind legs, barrel and white socks.
  shape(ctx, 'M109 30 Q146 23 153 43 Q150 65 158 78 L172 85 Q178 90 173 94 L152 93 Q146 91 139 80 L116 62Z', '#ae674e');
  shape(ctx, 'M39 34 Q59 47 47 66 L28 86 L12 85 Q7 81 15 75 L27 58Z', '#bd7c5a');
  shape(ctx, 'M18 -3 Q38 -17 55 -10 Q87 9 114 8 Q145 5 154 29 Q168 58 146 68 L135 85 Q133 91 137 94 Q137 99 131 100 L109 99 Q104 96 109 88 L116 77 L119 62 Q89 67 62 55 Q45 54 37 63 L24 89 Q22 96 12 96 L-5 95 Q-11 93 -7 87 L4 82 L12 58 Q8 37 4 20Z', '#d48a55');
  shape(ctx, 'M56 -8 Q80 8 110 10 Q135 7 147 21 Q136 21 133 29 Q126 39 113 38 Q97 41 92 30 Q81 24 73 28 Q61 26 56 -8Z', '#a95e43', null);
  shape(ctx, 'M7 36 Q15 48 11 62 L3 81 Q-5 81 -8 88 Q-13 96 -4 97 L17 97 Q23 96 28 86 L41 56 L39 38Z', '#ffdfb0');
  shape(ctx, 'M-1 91 l3 -5 M6 93 l4 -6 M116 96 l4 -5 M126 96 l3 -5', null, '#996a54', 1.7);
  shape(ctx, 'M9 -6 Q22 -21 37 -10 L48 6 Q50 18 40 40 L33 34 L30 49 L23 40 L20 48 Q4 36 -2 21Z', '#ffdeb2');
  // The blaze and muzzle turn left, into the incoming ball.
  shape(ctx, 'M-14 -62 Q4 -77 26 -69 Q48 -62 44 -38 Q42 -18 27 -4 Q12 8 -7 5 Q-21 5 -31 -8 Q-46 -8 -49 -19 Q-49 -27 -40 -29 L-27 -34 Q-26 -52 -14 -62Z', '#d58a52');
  shape(ctx, 'M-18 -54 Q-14 -61 -8 -63 Q-3 -50 -12 -40 Q-20 -33 -19 -29 Q-8 -27 -4 -20 Q-2 -8 -13 -5 Q-27 -3 -34 -11 Q-45 -11 -48 -19 Q-52 -27 -41 -28 L-28 -34Z', '#ffe5bd', null);
  shape(ctx, 'M12 -62 Q33 -79 48 -61 Q54 -52 61 -44 Q71 -33 60 -20 Q52 -13 44 -6 Q31 11 19 -2 Q10 -13 16 -29 Q22 -45 12 -62Z', '#9d573f');
  shape(ctx, 'M33 -56 Q43 -45 37 -30 Q29 -16 32 -9 M43 -48 Q52 -38 46 -28', null, '#c48052', 2.8);
  shape(ctx, 'M-46 -25 Q-55 -25 -52 -18 Q-48 -11 -43 -15 L-38 -22 Q-38 -25 -46 -25Z', ink);
  shape(ctx, 'M-23 -43 Q-17 -51 -10 -47', null, ink, 2.4);
  oval(ctx, -18, -39, 3.8, 5.2, ink);
  oval(ctx, -19, -41, 1.2, 1.4, '#fff5dd');
  shape(ctx, 'M-10 3 Q8 6 28 -6 L34 0 Q19 13 -7 13Z', '#598da2');
  oval(ctx, 4, 15, 4, 5, '#efbd53', ink, 1.6);
  if (flight >= 1) tennisBall(ctx, -44, -3, -0.3);
  shape(ctx, 'M-36 0 Q-26 7 -18 1 Q-12 -3 -11 -8 M-36 -17 l1 0 m6 2 l1 0 m-3 3 l1 0', null, ink, 2.3);
  ctx.restore();

  if (flight < 1) {
    const ballX = 497 + (x - 44 - 497) * flight;
    const ballY = 313 + (y - 3 - 313) * flight - Math.sin(flight * Math.PI) * 65;
    tennisBall(ctx, ballX, ballY, flight * 4);
  }
}

function sitter(ctx) {
  // The sitter's other hand holds the phone at the edge of the dog-run panel.
  shape(ctx, 'M459 389 L483 375 L511 342 L518 322 L530 309 Q535 307 537 313 L533 323 L552 324 L558 346 Q552 359 536 367 L508 400 L479 428 L459 428Z', '#edb18e');
  shape(ctx, 'M462 381 L482 369 L512 394 L482 429 L461 441Z', '#7586b5');
  shape(ctx, 'M478 375 L500 398 M480 383 L494 397', null, '#4b577d', 2);
  shape(ctx, 'M523 331 L521 284 Q520 279 525 278 L546 275 Q551 275 551 280 L557 329 Q557 334 553 334 L531 337 Q524 338 523 331Z', '#545267');
  shape(ctx, 'M525 286 L547 283 L551 316 L529 319Z', '#b8c7d5', null);
  shape(ctx, 'M519 342 Q520 324 528 316 Q532 313 535 316 Q537 318 534 324 L529 335 Q541 330 546 334', '#edb18e', ink, 2.3);
}

export const panels = [
  { x: 26, y: 28, w: 425, h: 432 },
  { x: 462, y: 28, w: 472, h: 432 },
];

export function drawComic(ctx, seconds, flight) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const [index, { x, y, w, h }] of panels.entries()) {
    ctx.fillStyle = '#c8ad95';
    ctx.fillRect(x + 2.5, y + 3, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    if (index === 0) {
      cityWindow(ctx);
      caller(ctx);
    } else {
      park(ctx);
      spaniel(ctx, seconds, flight);
      sitter(ctx);
    }
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = ink;
    ctx.strokeRect(x, y, w, h);
  }
}
