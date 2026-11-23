import assert from 'node:assert/strict';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import { CONDITIONAL_ROWS } from '../../../films/language-modeling/fixtures.mjs';

const prompt = 'A red fox';
const next = 'runs';
const copyCount = 8;
const chance = (prefix, word) => CONDITIONAL_ROWS[prefix].find(([token]) => token === word)[1];
const firstChance = chance(prompt, next);
const secondChance = chance(prompt + ' ' + next, 'end');

function impressions(prefix, count) {
  return CONDITIONAL_ROWS[prefix].flatMap(([token, probability]) => {
    const copies = count * probability;
    assert.ok(Number.isInteger(copies), 'Each impression must carry one equal share.');
    return Array(copies).fill(token);
  });
}

// Only the two prints that reach "runs" need a second impression.
const firstWords = impressions(prompt, copyCount);
const endings = impressions(prompt + ' ' + next, firstWords.filter(word => word === next).length);
const prints = firstWords.map(word => ({ word, second: word === next ? endings.shift() : null }));

const beats = [
  {
    id: 'fox-on-the-page',
    say: 'A red fox. Those three words start our story. How likely is the model to add just one word, runs, and end the story there?',
    hold: 1.4,
  },
  {
    id: 'eight-impressions',
    say: 'Spread out the prints. Each one stands for an eighth of the probability. All eight start with the same words.',
    hold: 0.7,
  },
  {
    id: 'two-leaps',
    say: 'See the two foxes in midair? They get the word runs. The other six get waits. So after “A red fox,” this little language model gives runs a one-in-four chance.',
    hold: 0.85,
  },
  {
    id: 'read-the-longer-line',
    say: 'Follow those two. The model reads the word it just added. After “A red fox runs,” the next token can be the word on, or the signal to end the text. Each has half the chance.',
    hold: 1.05,
  },
  {
    id: 'end-impression',
    say: 'Read the print on the right. A red fox runs on. Now look at the seal on the left. It marks the end token. The last word on that print is runs.',
    hold: 1.15,
  },
  {
    id: 'count-from-the-prompt',
    say: 'Bring back the whole set. Starting from “A red fox,” how much of the original chance went through runs and ended there?',
    hold: 2.1,
  },
  {
    id: 'one-finished-line',
    say: 'One print out of eight. A quarter reached runs, and half of that quarter ended the story.',
    hold: 3,
  },
];

const clamp = n => Math.min(1, Math.max(0, n));
const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const ink = '#342b39';
const cream = '#fbefd7';
const red = '#a63324';
const blockWidth = 480;
const blockHeight = 210;
const cardWidth = 514;
const cardHeight = 304;

function type(ctx, str, x, y, size, color = ink, family = 'Serif', align = 'left', weight = 400) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

const paths = new Map();
function path(ctx, data, color) {
  if (!paths.has(data)) paths.set(data, new Path2D(data));
  ctx.fillStyle = color;
  ctx.fill(paths.get(data));
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Deterministic marks stay attached to the paper as a print moves.
function random(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

let desk;
function workSurface() {
  if (desk) return desk;
  desk = createCanvas(1920, 1080);
  const d = desk.getContext('2d');
  const light = d.createLinearGradient(0, 0, 1700, 1080);
  light.addColorStop(0, '#e3cfae');
  light.addColorStop(.50, '#d8bfa4');
  light.addColorStop(1, '#bc9a87');
  d.fillStyle = light;
  d.fillRect(0, 0, 1920, 1080);
  const r = random(231);
  for (let i = 0; i < 36000; i++) {
    d.fillStyle = i % 3 ? 'rgba(87,55,49,.06)' : 'rgba(255,246,219,.36)';
    d.fillRect(1920 * r(), 1080 * r(), 1 + r() * 5, 0.6 + r() * 1.5);
  }
  return desk;
}

function fir(ctx, x, base, height, width, color) {
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(width, height);
  path(ctx, 'M0 -1 L.12 -.75 .08 -.76 .29 -.58 .2 -.6 .44 -.34 .31 -.38 .56 -.13 .13 -.2 .08 0 -.04 0 -.02 -.2 -.54 -.11 -.34 -.34 -.43 -.31 -.19 -.60 -.31 -.55 -.09 -.77 -.14 -.74 Z', color);
  ctx.restore();
}

let woods;
function forestBlock() {
  if (woods) return woods;
  woods = createCanvas(blockWidth * 3, blockHeight * 3);
  const c = woods.getContext('2d');
  c.scale(3, 3);
  c.fillStyle = '#e8ba9d';
  c.fillRect(0, 0, blockWidth, blockHeight);
  ellipse(c, 326, 53, 34, 34, '#f8e4ad');
  path(c, 'M0 94 Q44 68 86 76 T169 78 Q212 62 258 77 Q313 86 368 60 T480 56 L480 150 0 150Z', '#be9b9d');
  path(c, 'M0 102 Q84 71 164 105 Q253 135 322 97 T480 83 L480 160 0 160Z', '#998a91');
  const r = random(715);
  for (let j = 0; j < 30; j++) {
    const x = j * 18 + r() * 11;
    const y = 109 + 10 * Math.sin(j * .2);
    fir(c, x, y, 13 + r() * 22, 8 + r() * 5, '#857b84');
  }
  path(c, 'M0 119 Q58 97 144 113 T286 112 Q356 104 414 90 Q454 84 480 85 L480 210 0 210Z', '#eddbc5');
  path(c, 'M0 152 Q68 133 151 141 T290 144 Q364 119 480 116 L480 210 0 210Z', '#f8ebd6');
  path(c, 'M0 185 Q83 165 172 171 Q209 176 267 165 Q219 180 131 181 Q54 186 0 198Z', '#dacfc4');
  path(c, 'M281 198 Q377 171 480 165 L480 170 Q383 178 306 199Z', '#ddd0c2');
  // Linocut gouges in the drifts and the margins of the tree line.
  for (let j = 0; j < 150; j++) {
    const x = r() * 480, y = 128 + r() * 82, length = 2 + r() * 12;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + length * .6, y - 1.8, x + length, y - 1.7);
    c.lineTo(x + 1, y + .55);
    c.fillStyle = j % 4 ? '#dfd2c2' : '#cabaaf';
    c.fill();
  }
  for (const [x, y, h, w] of [[-3,150,98,51],[23,144,66,32],[39,128,37,17],[464,121,75,34],[487,132,105,50]]) {
    fir(c, x, y, h, w, '#574f60');
  }
  // A foreground birch makes the leap read against a stationary edge.
  path(c, 'M15 211 Q26 158 24 100 Q23 43 8 -4 L17 -4 Q35 61 34 103 Q40 67 55 48 L56 50 Q41 84 34 125 Q33 168 28 211Z', '#554654');
  path(c, 'M13 -2 L16 -2 Q32 52 31 76 L26 69 29 86 26 86 29 100 24 94 Q24 49 13 -2Z M26 123 L30 125 27 129Z M24 165 L28 164 24 176 22 175Z', '#c5a9a0');
  path(c, 'M442 210 Q444 186 452 172 L449 192 462 181 452 198 468 191 450 210Z M51 210 L45 193 52 201 55 187 57 203 66 198 60 210Z', '#86747a');
  for (let j = 0; j < 4200; j++) {
    c.fillStyle = j % 5 ? 'rgba(254,238,203,.22)' : 'rgba(73,48,64,.13)';
    c.fillRect(r() * blockWidth, r() * blockHeight, .35 + r(), .2 + r() * .5);
  }
  return woods;
}

const coat = '#c84729';
const shade = '#903d35';
const black = '#46323b';
const bib = '#fff0ce';

function head(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  path(ctx, 'M-24 4 L-25 -22 -9 -10 0 -12 12 -29 16 -9 Q21 -4 24 1 L50 12 35 19 7 24 -10 31 -28 18Z', coat);
  path(ctx, 'M-25 -22 L-12 -12 -23 -9Z M12 -29 L13 -12 3 -10Z', black);
  path(ctx, 'M-17 12 L-3 16 0 11 Q12 18 31 14 L47 12 37 18 15 24 -10 31 -23 24 -17 25 -27 16Z', bib);
  path(ctx, 'M42 8 L51 11 Q48 15 43 15Z M13 2 L23 4 18 6 15 5Z', black);
  path(ctx, 'M-9 -3 L-2 0 -10 -1Z M-13 0 L-4 4 -12 2Z M-18 2 L-10 6 -18 4Z', '#f4ad72');
  ctx.restore();
}

function leapingFox(c) {
  // The two far legs have a separate ink so the four paws remain legible.
  path(c, 'M108 68 C78 68 46 59 10 60 Q23 81 63 86 Q81 89 113 81Z', shade);
  path(c, 'M10 60 Q34 59 53 64 L41 67 49 70 37 71 45 75 31 76 Q17 68 10 60Z', bib);
  path(c, 'M117 65 Q104 88 91 94 L54 97 41 101 48 105 96 102 130 83Z M175 68 L206 88 228 79 240 80 238 84 206 98 162 81Z', shade);
  path(c, 'M111 61 Q127 43 157 47 Q183 49 207 36 L223 42 213 65 196 77 Q161 79 146 72 Q132 86 108 86 Q92 83 91 74Z', coat);
  path(c, 'M108 71 Q100 83 75 86 L46 84 31 86 27 91 43 92 76 94 Q111 95 130 77Z M184 66 Q191 77 211 82 L247 66 257 66 259 70 248 74 214 92 Q186 91 168 78Z', coat);
  path(c, 'M45 84 L31 86 27 91 44 92 59 89Z M232 73 L247 66 257 66 259 70 248 74 235 79Z', black);
  path(c, 'M203 44 L225 45 214 65 200 76 185 77 192 71 184 72 192 64 187 65Z', bib);
  head(c, 221, 36, -.06);
  path(c, 'M116 59 Q135 48 151 51 L132 54Z M110 65 L129 56 123 61Z M103 69 L117 62 112 67Z M158 58 L176 52 166 57Z M127 67 L142 62 135 66Z', '#ee9760');
}

function limb(c, x, y, angle, data, color, paw) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.translate(-x, -y);
  path(c, data, color);
  if (paw) path(c, paw, black);
  c.restore();
}

function standingFox(c, stride) {
  path(c, 'M109 63 Q77 65 64 81 Q46 97 16 96 Q60 115 90 93 L125 76Z', shade);
  path(c, 'M16 96 Q36 99 53 90 L45 97 55 97 47 101 56 102 Q35 106 16 96Z', bib);
  limb(c, 109, 77, -.46 * stride, 'M116 77 L127 91 124 110 137 110 139 115 119 115 116 96 100 82Z', shade);
  limb(c, 186, 74, .58 * stride, 'M193 71 L195 88 212 101 221 100 222 105 211 108 184 88 179 75Z', shade);
  path(c, 'M98 65 Q113 46 147 51 Q179 57 201 42 L217 48 213 67 Q194 85 163 79 L140 76 Q131 85 116 87 L99 83Z', coat);
  limb(c, 109, 75, .55 * stride, 'M103 71 L119 83 106 100 101 112 112 112 114 117 93 117 95 99Z', coat, 'M95 99 L105 101 101 112 112 112 114 117 93 117Z');
  limb(c, 185, 71, -.62 * stride, 'M180 70 L192 69 189 90 195 111 205 114 205 118 189 117 179 92Z', coat, 'M183 103 L193 103 195 111 205 114 205 118 189 117Z');
  path(c, 'M204 46 L223 44 212 69 194 80 183 78 191 72 185 72 196 60 191 62Z', bib);
  head(c, 222, 38, .04);
  path(c, 'M112 61 Q130 51 146 55 L126 57Z M110 66 L129 58 119 64Z M104 70 L117 64 113 68Z M150 62 L170 57 158 62Z', '#ee9760');
}

function waitingFox(c) {
  path(c, 'M-42 0 Q-49 -24 -33 -42 Q-15 -55 -6 -78 L12 -75 Q31 -58 24 -27 L31 7 44 10 45 15 -5 17Z', coat);
  path(c, 'M9 -67 Q30 -66 25 -45 L19 -36 24 -38 18 -28 20 -29 10 -17 12 -31 8 -29Z', bib);
  path(c, 'M15 -25 L23 -29 26 -4 31 7 43 8 45 14 22 14Z', black);
  head(c, 11, -75, .14);
  path(c, 'M-36 -36 Q-61 -24 -55 -4 Q-45 22 -8 18 Q27 17 49 -4 Q30 0 15 -3 Q-4 -5 -21 0 Q-48 1 -36 -36Z', shade);
  path(c, 'M-9 16 Q17 6 18 -2 Q34 0 49 -4 Q33 12 -9 16Z', bib);
  path(c, 'M-32 -34 L-21 -48 -25 -38Z M-29 -29 L-15 -44 -20 -33Z M-25 -27 L-10 -40 -16 -30Z M-44 -7 Q-40 5 -29 9 Q-41 7 -44 -7Z', '#ed996b');
}

function cutFox(ctx, pose, entry = 1, advance = 0) {
  ctx.save();
  if (pose === 'waits') {
    ctx.translate(256, 160);
    ctx.scale(1.14, 1.14);
    ellipse(ctx, -4, 18, 70, 4, '#d2bfb2');
    waitingFox(ctx);
  } else {
    const leap = pose === next;
    const x = (leap ? 66 : 77) + 43 * advance - (1 - entry) * 235;
    const stride = Math.sin(entry * Math.PI * 4) * Math.sin(entry * Math.PI);
    ellipse(ctx, x + 146, 174, leap ? 63 : 87, leap ? 2.6 : 3.5, '#d7c2b1');
    ctx.translate(x, (leap ? 17 : 34) - 6 * Math.abs(stride) - advance * 5);
    ctx.scale(1.18, 1.18);
    if (leap) leapingFox(ctx);
    else standingFox(ctx, stride);
  }
  ctx.restore();
}

let stock;
function paper() {
  if (stock) return stock;
  stock = createCanvas(cardWidth * 3, cardHeight * 3);
  const c = stock.getContext('2d');
  c.scale(3, 3);
  const r = random(518);
  c.fillStyle = cream;
  c.beginPath();
  c.moveTo(1, 1);
  for (let x = 1; x < cardWidth - 1; x += 2) c.lineTo(x, .3 + r() * 1.1);
  for (let y = 1; y < cardHeight - 1; y += 2) c.lineTo(cardWidth - .3 - r(), y);
  for (let x = cardWidth - 1; x > 1; x -= 2) c.lineTo(x, cardHeight - .5 - r() * 1.2);
  for (let y = cardHeight - 1; y > 1; y -= 2) c.lineTo(.3 + r(), y);
  c.closePath();
  c.fill();
  c.clip();
  for (let i = 0; i < 4700; i++) {
    c.fillStyle = i % 4 ? 'rgba(145,100,65,.055)' : 'rgba(255,255,245,.62)';
    c.fillRect(r() * cardWidth, r() * cardHeight, .45 + r() * 1.6, .25 + r() * .8);
  }
  return stock;
}

function endSeal(c, t) {
  if (!t) return;
  c.save();
  c.translate(456, 264);
  const press = 1 + .14 * (1 - t);
  c.scale(press, press);
  c.rotate(-.07);
  c.globalAlpha *= t;
  // A binder's end ornament. It sits outside the line of type.
  path(c, 'M-30 -16 Q-30 -21 -22 -21 L21 -21 Q30 -21 30 -13 L30 15 Q29 22 22 22 L-22 22 Q-30 21 -30 14Z', red);
  c.strokeStyle = cream;
  c.lineWidth = .9;
  c.strokeRect(-26, -17, 52, 34);
  type(c, 'END', 0, 8, 20, cream, 'Sans', 'center', 700);
  c.restore();
}

function illustration(c, pose, entry, advance) {
  c.drawImage(forestBlock(), 0, 0, blockWidth, blockHeight);
  cutFox(c, pose, entry, advance);
}

function printFace(c, print, first, second, entry, fadeInk) {
  c.drawImage(paper(), 0, 0, cardWidth, cardHeight);
  c.save();
  c.translate(17, 16);
  c.beginPath();
  c.rect(0, 0, blockWidth, blockHeight);
  c.clip();
  if (first < 1) illustration(c, 'start', entry, 0);
  if (first > 0) {
    c.save();
    if (first < 1) {
      c.beginPath();
      c.rect(0, 0, blockWidth * first, blockHeight);
      c.clip();
    }
    illustration(c, print.word, 1, print.second === 'on' ? second : 0);
    c.restore();
  }
  if (fadeInk > 0) {
    c.fillStyle = `rgba(249,235,208,${fadeInk * .69})`;
    c.fillRect(0, 0, blockWidth, blockHeight);
  }
  c.restore();

  const baseY = 274, gap = 9;
  type(c, prompt, 23, baseY, 35, '#3c3036');
  const wordX = 23 + c.measureText(prompt).width + gap;
  if (first > 0) {
    c.save();
    c.globalAlpha = first;
    type(c, print.word, wordX, baseY, 35, fadeInk > 0 ? '#614c46' : red);
    if (second > 0 && print.second === 'on') {
      const afterX = wordX + c.measureText(print.word).width + gap;
      c.globalAlpha = second;
      type(c, print.second, afterX, baseY, 35, red);
    }
    c.restore();
  }
  if (print.second === 'end') endSeal(c, second);
}

function sheetPose(i) {
  // The two running foxes share the left column. The six waiting foxes sit together on the right.
  const cell = [0, 4, 1, 2, 3, 5, 6, 7][i];
  return {
    x: [267, 758, 1196, 1634][cell % 4],
    y: 301 + Math.floor(cell / 4) * 293,
    s: .815,
    a: [-.018,.011,-.009,.018,.009,-.013,.015,-.008][i],
  };
}

function pilePose(i) {
  return { x: 960 + i * 2.5, y: 470 + i * 2.8, s: 2.75, a: -.023 + i * .0019 };
}

function pairPose(i) {
  if (prints[i].word === next) {
    return { x: i === 0 ? 523 : 1397, y: i === 0 ? 452 : 493, s: 1.60, a: i === 0 ? -.027 : .021 };
  }
  const p = sheetPose(i);
  if (p.y < 400) return { ...p, x: p.x + 1530, y: p.y - 160 };
  return { ...p, y: p.y + 950 };
}

function between(a, b, t) {
  return { x: mix(a.x,b.x,t), y: mix(a.y,b.y,t), s: mix(a.s,b.s,t), a: mix(a.a,b.a,t) };
}

function fraction(probability) {
  for (let den = 1; den <= copyCount; den++) {
    const num = probability * den;
    if (Number.isInteger(num)) return [num, den];
  }
  throw new Error('Probability has no exact fraction on this sheet.');
}

function ratio(c, probability, x, y) {
  const [num, den] = fraction(probability);
  type(c, String(num), x, y - 10, 66, ink, 'Serif', 'center');
  c.fillStyle = ink;
  c.fillRect(x - 29, y, 58, 3.5);
  type(c, String(den), x, y + 60, 66, ink, 'Serif', 'center');
}

function annotation(c, clock, time) {
  const { index } = clock;
  c.save();
  if (index === 1) {
    c.globalAlpha = smooth((time - 1.1) / .65);
    type(c, 'Eight equal shares', 960, 849, 55, ink, 'Serif', 'center');
  } else if (index === 2) {
    c.globalAlpha = smooth(time / .55);
    type(c, 'runs  ·  2 of 8', 267, 825, 49, ink, 'Serif', 'center');
    c.globalAlpha = clock.reveal('The other six', .55);
    type(c, 'waits  ·  6 of 8', 1196, 825, 49, ink, 'Serif', 'center');
  } else if (index === 3 || index === 4) {
    const on = index === 3 ? clock.reveal('the next token', .55) : 1;
    const end = index === 3 ? clock.reveal('or the signal', .55) : 1;
    c.globalAlpha = (1 - on) * smooth((time - .95) / .6);
    type(c, 'After “A red fox runs”', 960, 843, 55, ink, 'Serif', 'center');
    c.globalAlpha = end;
    type(c, 'end  ·  ½', 523, 824, 57, ink, 'Serif', 'center');
    c.globalAlpha = on;
    type(c, 'on  ·  ½', 1397, 824, 57, ink, 'Serif', 'center');
  } else if (index === 6) {
    const arrive = smooth(time / .6);
    c.globalAlpha = arrive;
    const x = [638, 940, 1268];
    const probabilities = [firstChance, secondChance, firstChance * secondChance];
    for (const [i, label] of ['runs', 'end after runs', 'both'].entries()) {
      ratio(c, probabilities[i], x[i], 811);
      type(c, label, x[i], 925, 42, ink, 'Sans', 'center');
    }
    type(c, '×', 789, 834, 54, ink, 'Serif', 'center');
    type(c, '=', 1102, 834, 54, ink, 'Serif', 'center');
  }
  c.restore();
}

function draw(ctx, clock) {
  const { index, elapsed } = clock;
  const spread = index === 0 ? 0 : index === 1 ? smooth(elapsed / 1.65) : 1;
  let pair = 0;
  if (index === 3) pair = smooth(elapsed / 1.6);
  if (index === 4) pair = 1;
  if (index === 5) pair = 1 - smooth(elapsed / 1.55);
  const markOn = index === 4 ? smooth(elapsed / .7) : Number(index > 4);
  const markEnd = index === 4 ? smooth(clock.reveal('Now look', .45)) : Number(index > 4);
  const isolate = index >= 5 ? smooth((1 - pair) * 1.15) : 0;
  ctx.drawImage(workSurface(), 0, 0);
  for (let i = prints.length - 1; i >= 0; i--) {
    const print = prints[i];
    const state = between(between(pilePose(i), sheetPose(i), spread), pairPose(i), pair);
    let first = Number(index >= 2);
    if (index === 1 && print.word === next) first = smooth((elapsed - clock.speechDuration) / .65);
    if (index === 2 && print.word !== next) first = smooth(clock.reveal('The other six', .8));
    const second = print.second === 'end' ? markEnd : markOn;
    const muted = print.second === 'end' ? 0 : isolate;
    state.y -= isolate * (print.second === 'end' ? 11 : 0);
    ctx.save();
    ctx.translate(state.x, state.y);
    ctx.rotate(state.a);
    ctx.scale(state.s, state.s);
    ctx.translate(-cardWidth / 2, -cardHeight / 2);
    // Cast the shadow once. Keep the ink and type flush with the paper.
    ctx.save();
    ctx.shadowColor = 'rgba(65,38,37,.37)';
    ctx.shadowOffsetY = 4 * state.s;
    ctx.shadowBlur = 8 * state.s;
    ctx.fillStyle = cream;
    ctx.fillRect(2, 2, cardWidth - 4, cardHeight - 4);
    ctx.restore();
    const entry = index === 0 ? smooth(elapsed / 1.45) : 1;
    printFace(ctx, print, first, second, entry, muted);
    ctx.restore();
  }
  annotation(ctx, clock, elapsed);
}

function check() {
  for (const prefix of [prompt, prompt + ' ' + next]) {
    const row = CONDITIONAL_ROWS[prefix];
    assert.ok(row.every(([, p]) => p >= 0 && p <= 1));
    assert.equal(row.reduce((sum, [, p]) => sum + p, 0), 1);
  }
  const runners = prints.filter(p => p.word === next);
  const finished = runners.filter(p => p.second === 'end');
  assert.equal(prints.length, copyCount);
  assert.equal(prints.filter(p => p.word === 'waits' && p.second === null).length, 6);
  assert.equal(runners.length, 2);
  assert.equal(runners.filter(p => p.second === 'on').length, 1);
  assert.deepEqual(prints.slice(0, 2).map(p => p.second), ['end', 'on']);
  assert.equal(runners.length / copyCount, firstChance);
  assert.equal(finished.length / runners.length, secondChance);
  assert.equal(finished.length / copyCount, firstChance * secondChance);
  assert.deepEqual(fraction(finished.length / copyCount), [1, 8]);
}

export default { title: 'Where the fox story ends', beats, draw, check };
