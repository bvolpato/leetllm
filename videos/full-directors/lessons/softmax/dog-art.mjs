import { Path2D } from '@napi-rs/canvas';
const ink = '#27273a',
  tau = Math.PI * 2;
const plates = new Map();
function plate(c, d, color, stroke, width = 3) {
  if (!plates.has(d)) plates.set(d, new Path2D(d));
  const path = plates.get(d);
  if (color) {
    c.fillStyle = color;
    c.fill(path);
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.stroke(path);
  }
}
function oval(c, x, y, rx, ry, color, angle = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, tau);
  c.fill();
}
const sky =
  'M-12 232 C4 136 96 79 161 70 C257 19 336 52 420 35 C502 16 595 58 635 112 C694 154 714 214 722 249 Q378 283 -12 260 Z';
function meadow(c, sleep) {
  plate(c, sky, '#b9d5c5');
  oval(c, 529, 112, 53, 53, '#f4bf70');
  plate(
    c,
    'M-14 241 Q112 179 215 215 Q362 252 471 203 Q579 145 717 226 L727 257 Q422 281 -17 262 Z',
    '#80aaa1',
  );
  plate(
    c,
    'M-28 249 Q98 192 246 240 Q366 264 463 231 Q603 184 743 241 Q673 289 554 289 Q418 305 236 292 Q73 289 -28 249 Z',
    '#73937c',
  );
  plate(
    c,
    'M55 246 Q66 181 52 132 L43 105 L51 101 Q65 122 74 154 Q77 121 92 102 L98 105 Q83 141 84 171 L79 235 Z',
    '#544f48',
  );
  plate(
    c,
    'M43 153 Q10 145 22 125 Q-4 105 20 86 Q8 60 35 56 Q42 29 68 41 Q94 21 108 46 Q138 49 130 78 Q147 100 125 115 Q119 139 99 135 Q78 162 58 143 Z',
    '#476d66',
  );
  plate(
    c,
    'M27 91 Q45 63 66 62 M57 119 Q81 84 108 80 M69 74 L82 58 M37 125 L48 110',
    null,
    '#819c83',
    4,
  );
  for (const [x, y] of [
    [101, 264],
    [174, 243],
    [227, 276],
    [390, 281],
    [538, 261],
    [643, 244],
    [685, 256],
    [54, 257],
  ]) {
    c.save();
    c.translate(x, y);
    plate(c, 'M0 0 l-5 -10 M3 1 l5 -7 M-11 2 l-3 -4', null, '#465e54', 2.5);
    c.restore();
  }
  c.save();
  c.translate(712, 251);
  plate(
    c,
    'M-1 2 Q3 -13 -1 -41 M0 -13 Q-16 -21 -16 -29 Q-2 -27 1 -19 M0 -9 Q14 -24 20 -23 Q18 -13 0 -9',
    '#456858',
    '#456858',
    2,
  );
  for (let i = 0; i < 6; i++) {
    const a = (i * tau) / 6;
    oval(c, -1 + Math.cos(a) * 9, -42 + Math.sin(a) * 9, 9, 5, '#e47d52', a);
  }
  oval(c, -1, -42, 5, 5, '#624539');
  c.restore();
  oval(c, sleep ? 443 : 388, 252, sleep ? 151 : 107, sleep ? 11 : 7, '#567763');
}

const fur = '#fff3d8';
const shadowFur = '#d5bfa5';
// The rear pair of legs prints first so the two near legs have a clean silhouette.
function runningDog(c) {
  plate(
    c,
    'M110 97 Q106 138 76 158 L15 177 Q3 181 9 187 Q15 192 36 187 L95 178 Q118 170 142 140 L188 110 Z',
    shadowFur,
    ink,
    3.8,
  );
  plate(
    c,
    'M276 114 Q283 142 324 169 L374 180 Q391 189 399 181 Q404 175 391 168 L342 154 Q326 133 320 103 Z',
    shadowFur,
    ink,
    3.8,
  );
  plate(
    c,
    'M107 94 C68 90 39 58 15 49 Q2 43 4 51 Q14 75 49 101 Q71 120 108 122 Q92 151 68 173 L15 203 Q5 210 11 216 Q20 220 34 213 L91 187 Q116 175 139 148 Q157 126 186 126 Q224 132 261 131 Q278 153 303 160 Q321 164 344 153 L391 119 Q408 115 410 108 Q410 99 393 101 L330 130 Q318 132 304 117 Q338 109 355 85 L377 80 Q395 85 419 76 L448 60 Q457 54 454 45 L418 45 Q406 33 393 33 Q371 27 351 41 L319 61 Q293 78 257 72 Q217 69 179 69 Q135 65 107 94 Z',
    fur,
    ink,
    4.7,
  );
  plate(c, 'M6 49 Q23 51 45 71 Q54 83 58 93 Q24 78 6 55 Z', ink);
  plate(
    c,
    'M103 101 Q122 72 155 72 Q187 70 203 73 Q201 91 181 101 Q164 107 145 126 Q126 135 115 127 Q104 122 103 101 Z',
    ink,
  );
  plate(c, 'M281 76 Q306 73 327 59 Q336 56 343 54 L356 83 Q345 98 335 104 Q312 101 301 95 Z', ink);
  plate(c, 'M344 49 Q350 42 356 40 L372 84 L361 88 Z', '#d49731', ink, 2);
  plate(
    c,
    'M378 38 Q381 55 368 67 Q351 85 323 77 Q306 71 291 73 Q300 59 320 53 Q344 47 360 38 Q368 34 378 38 Z',
    ink,
  );
  plate(c, 'M310 69 Q338 66 355 52 M326 72 L343 66', null, '#62565b', 2.8);
  plate(c, 'M447 44 Q455 42 458 45 Q462 52 450 59 Q444 54 447 44 Z', ink);
  oval(c, 400, 43, 4.4, 5.6, ink);
  plate(
    c,
    'M423 67 Q436 68 443 61 M153 115 Q164 109 169 103 M158 118 l11 -7 M273 114 l12 9 M277 111 l10 7',
    null,
    ink,
    2,
  );
}
function sleepingDog(c) {
  plate(
    c,
    'M67 147 C66 106 98 61 151 52 C202 42 254 58 282 87 C307 89 329 104 346 118 L367 145 Q383 150 403 149 Q417 150 416 161 Q414 177 382 183 L333 191 Q284 213 215 211 Q124 216 84 185 Q66 173 67 147 Z',
    fur,
    ink,
    4.5,
  );
  plate(
    c,
    'M70 148 C65 113 98 69 138 57 Q156 53 175 52 Q191 72 175 89 Q157 110 135 113 Q102 118 95 144 Q87 155 70 148 Z',
    ink,
  );
  plate(c, 'M253 88 Q277 87 301 106 L287 155 Q270 161 249 147 Q232 119 253 88 Z', ink);
  plate(
    c,
    'M283 94 Q289 95 298 101 Q277 123 283 156 L273 162 Q259 125 283 94 Z',
    '#d49731',
    ink,
    2,
  );
  plate(
    c,
    'M314 104 Q332 115 333 130 Q326 160 301 174 Q282 181 279 171 Q279 159 285 141 Q294 109 314 104 Z',
    ink,
  );
  plate(c, 'M308 129 Q301 151 292 160 M311 137 L304 152', null, '#62565b', 2.8);
  plate(
    c,
    'M383 183 Q393 175 408 171 Q429 171 442 179 Q447 187 432 190 L375 193 Q359 195 351 191',
    fur,
    ink,
    3.8,
  );
  plate(c, 'M405 150 Q415 148 418 154 Q419 160 408 165 Q402 158 405 150 Z', ink);
  plate(
    c,
    'M345 136 Q352 144 361 138 M384 173 Q394 174 400 170 M426 180 l4 5 M419 181 l3 6',
    null,
    ink,
    3.3,
  );
  plate(
    c,
    'M110 139 C89 151 88 168 111 183 Q150 205 209 190 Q245 178 267 156 Q276 150 279 155 Q278 175 254 194 Q215 221 152 215 Q89 213 71 180 Q59 158 70 139',
    fur,
    ink,
    4.3,
  );
  plate(c, 'M215 187 Q245 179 268 156 Q275 152 278 155 Q276 173 255 193 Q239 198 223 196 Z', ink);
  plate(
    c,
    'M101 170 Q117 184 137 186 M106 165 l14 11 M145 61 l-14 6 M151 65 l-12 6',
    null,
    '#7f7268',
    2.4,
  );
}

export function illustration(ctx, x, y, scale, asleep) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  meadow(ctx, asleep);
  ctx.translate(205, 34);
  if (asleep) sleepingDog(ctx);
  else runningDog(ctx);
  ctx.restore();
}
