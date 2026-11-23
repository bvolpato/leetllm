import { createCanvas } from '@napi-rs/canvas';
import { loss, optimum } from '../../../films/scaling-laws/arithmetic.mjs';

const budget = 100;
const tall = { n: 5, d: 20 };
const square = { n: 10, d: 10 };
const floor = 1;
const warp = '#473774';
const weft = '#b83c25';
const ink = '#29233b';
const quiet = '#635b6c';

const beats = [
  {
    id: 'last-crossing',
    say: 'Follow the red thread. Each row is a group of training tokens. It crosses every column of model weights. That last stitch spends the hundredth unit of work.',
    hold: 0.75,
  },
  {
    id: 'half-the-weights',
    say: 'Suppose we train a model half this size. Keep all the work we paid for. Take these five columns and lay the two pieces end to end. How many rows can we afford now?',
    hold: 1.9,
  },
  {
    id: 'twice-the-tokens',
    say: 'Twenty. Half as many weights can see twice as many tokens. In the big matrix multiplies of dense training, each weight and token pair costs about six operations across the forward and backward passes. Both shapes have the same training budget.',
    hold: 0.8,
  },
  {
    id: 'two-samples',
    say: 'Which shape would predict new text better? Score smaller runs on the same held-out text, then fit a scaling law to their losses. In this example, both cords start at a fitted floor of one. A shorter cord predicts less surprise at the next token.',
    hold: 1,
  },
  {
    id: 'first-fit',
    say: 'Look at the square. More weights shorten the purple part, the penalty for limited model size. Fewer tokens lengthen the red part. Which end comes up short?',
    hold: 1.35,
  },
  {
    id: 'change-the-fit',
    say: 'The square wins this time. Now suppose runs on a different training set give us twice the penalty for limited data. Keep both shapes the same. Watch the red ends.',
    hold: 1.5,
  },
  {
    id: 'new-choice',
    say: 'The square’s cord has passed the tall one. With only ten rows, doubling its data penalty costs it more. For this fit, I’d give the smaller model twenty rows of tokens.',
    hold: 3.6,
  },
];

const clamp = (v) => Math.max(0, Math.min(1, v));
function smooth(v) {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, t) => a + (b - a) * t;

function label(ctx, value, x, y, size, color = ink, options = {}) {
  ctx.fillStyle = color;
  ctx.font = `${options.italic ? 'italic ' : ''}${options.weight || 400} ${size}px "Lesson ${options.family || 'Sans'}"`;
  ctx.textAlign = options.align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

function line(ctx, x, y, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function faded(ctx, alpha, draw) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  draw();
  ctx.restore();
}

function rng(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// The warp and the weft are bundles of fibers. The overpass alternates at each crossing.
const unit = 60;
const margin = 21;
let artwork;
function makeCloth() {
  const random = rng(103);
  const ground = createCanvas(384, 384);
  const paper = ground.getContext('2d');
  for (let i = 0; i < 4200; i++) {
    const x = random() * ground.width;
    const y = random() * ground.height;
    line(paper, x, y, x + 1 + random() * 5, y + random() * 1.6,
      i % 3 ? 'rgba(85,66,53,.09)' : 'rgba(255,255,255,.7)', 0.55 + random());
  }

  function ribbon(ctx, x, y, length, breadth, blue) {
    const start = -breadth / 2;
    const gradient = ctx.createLinearGradient(0, start, 0, -start);
    const colors = blue
      ? ['#2f2755', '#63518e', '#7b6a9d', '#59467e', '#3e315e']
      : ['#9b3024', '#d55c3b', '#e08054', '#c04b32', '#973a2d'];
    for (const [i, p] of [0, 0.12, 0.35, 0.83, 1].entries()) gradient.addColorStop(p, colors[i]);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, start, length, breadth);
    for (let k = 1; k < breadth - 1; k += 2.8) {
      const cy = start + k;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      for (let dx = 0; dx <= length; dx += 12) {
        ctx.lineTo(Math.min(length, dx + 12), cy + 0.6 * Math.sin(dx / 19 + k));
      }
      ctx.strokeStyle = k % 3 < 1.5 ? 'rgba(252,232,194,.43)' : 'rgba(43,22,52,.4)';
      ctx.lineWidth = 1 + random() * 0.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  function swatch(cols, rows, parity, lastRow) {
    const canvas = createCanvas(cols * unit + 2 * margin, rows * unit + 2 * margin);
    const ctx = canvas.getContext('2d');
    ctx.translate(margin, margin);
    for (let col = 0; col < cols; col++) {
      const x = (col + 0.5) * unit;
      const breadth = unit - 5;
      for (let k = -breadth / 2; k < breadth / 2; k += 2.7) {
        const drift = random() * 4 - 2;
        const tip = -3 - random() * 11;
        line(ctx, x + k + drift, tip, x + k, 4, '#766389', 1.5);
        line(ctx, x + k, rows * unit - 3, x + k - drift, rows * unit - tip, '#68577d', 1.5);
      }
      ctx.save();
      ctx.translate(x, 0);
      ctx.rotate(Math.PI / 2);
      ribbon(ctx, 0, 0, rows * unit, breadth, true);
      ctx.restore();
    }
    for (let row = 0; row < rows; row++) {
      if (row === rows - 1 && !lastRow) continue;
      const y = (row + 0.5) * unit;
      const breadth = unit - 5;
      for (let k = -breadth / 2; k < breadth / 2; k += 3) {
        const tip = 1.5 + random() * 5;
        line(ctx, -tip, y + k + random() * 2, 3, y + k, '#b25d46', 1.3);
        line(ctx, cols * unit - 3, y + k, cols * unit + tip, y + k - random() * 2, '#b6684b', 1.3);
      }
      ribbon(ctx, 0, y, cols * unit, breadth, false);
      for (let col = 0; col < cols; col++) {
        if ((row + col + parity) % 2) continue;
        const x = (col + 0.5) * unit;
        ctx.save();
        ctx.translate(x, row * unit + 0.5);
        ctx.rotate(Math.PI / 2);
        ribbon(ctx, 0, 0, unit - 1, unit - 5, true);
        const shade = ctx.createLinearGradient(0, 0, unit, 0);
        shade.addColorStop(0, 'rgba(34,14,35,.23)');
        shade.addColorStop(0.22, 'rgba(34,14,35,0)');
        shade.addColorStop(0.68, 'rgba(34,14,35,0)');
        shade.addColorStop(1, 'rgba(34,14,35,.28)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, -(unit - 5) / 2, unit - 1, unit - 5);
        ctx.restore();
      }
    }
    return canvas;
  }
  return {
    ground,
    purpleCord: twist(true),
    redCord: twist(false),
    left: swatch(5, 10, 0, true),
    right: swatch(5, 10, 1, true),
    openLeft: swatch(5, 10, 0, false),
    openRight: swatch(5, 10, 1, false),
  };
}

function background(ctx, cloth) {
  const light = ctx.createLinearGradient(0, 0, 1820, 1080);
  light.addColorStop(0, '#fdf8ef');
  light.addColorStop(0.57, '#f4ede2');
  light.addColorStop(1, '#e8dfd4');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.fillStyle = ctx.createPattern(cloth.ground, 'repeat');
  ctx.fillRect(0, 0, 1920, 1080);
}

function piece(ctx, texture, x, y, cell, lift = 0) {
  const s = cell / unit;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.shadowColor = 'rgba(52,29,48,.28)';
  ctx.shadowBlur = 4 + lift * 13;
  ctx.shadowOffsetX = 1 + 4 * lift;
  ctx.shadowOffsetY = 4 + 11 * lift;
  ctx.drawImage(texture, -margin, -margin);
  ctx.restore();
}

function bracket(ctx, x0, x1, y, text, color, size) {
  line(ctx, x0, y, x1, y, color, 2);
  for (const x of [x0, x1]) line(ctx, x, y - 6, x, y + 6, color, 2);
  label(ctx, text, (x0 + x1) / 2, y + 44, size, color, { align: 'center' });
}

function hero(ctx, clock, cloth) {
  const { index, elapsed, reveal } = clock;
  const move = index === 0 ? 0 : index === 1 ? smooth(reveal('Take these five columns', 3.3)) : 1;
  const pullBack = index === 0 ? smooth((elapsed - 2.2) / 3.4) : 1;
  const shift = smooth(move / 0.54);
  const slide = smooth((move - 0.54) / 0.46);
  const cell = mix(106, 71 / (1 + shift), pullBack);
  const baseX = mix(86, mix(465, 751, move), pullBack);
  const baseY = mix(-422, mix(112, 109, move), pullBack);
  const leftY = baseY + cell * 10 * shift;
  const rightX = baseX + cell * 5 * (1 - slide) + Math.sin(Math.PI * move) * 36;
  const rightY = baseY - 22 * Math.sin(Math.PI * move);
  const sewn = index ? 1 : smooth((elapsed + 0.42) / 4.1);
  const sine = Math.sin(Math.PI * move);

  // The loose weft straightens into the last row as the shuttle moves right.
  if (sewn < 1) {
    const y = baseY + 9.5 * cell;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(baseX + 3, y);
    ctx.bezierCurveTo(baseX - 130, y + 10, baseX - 100, y + 201 * (1 - sewn), baseX - 295 * (1 - sewn), y + 100 * (1 - sewn));
    ctx.strokeStyle = '#cb5a39';
    ctx.lineWidth = cell * 0.47 * (1 - sewn);
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  function half(full, open, x, y, offset, lift) {
    if (sewn < 1) {
      piece(ctx, open, x, y, cell);
      ctx.save();
      const width = clamp(2 * sewn - offset) * cell * 5;
      ctx.beginPath();
      ctx.rect(x - 7, y + 9 * cell, width + (width ? 7 : 0), 1.4 * cell);
      ctx.clip();
      piece(ctx, full, x, y, cell);
      ctx.restore();
    } else {
      piece(ctx, full, x, y, cell, lift);
    }
  }
  half(cloth.left, cloth.openLeft, baseX, leftY, 0, 0);
  half(cloth.right, cloth.openRight, rightX, rightY, 1, sine);
  const shuttleAlpha = index ? 0 : 1 - smooth((elapsed - 3.7) / 0.55);
  faded(ctx, shuttleAlpha, () => {
    ctx.translate(baseX + cell * 10 * sewn + 42 * (1 - shuttleAlpha), baseY + 9.5 * cell);
    ctx.scale(cell / unit, cell / unit);
    ctx.shadowColor = 'rgba(60,31,39,.45)';
    ctx.shadowOffsetY = 5;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.bezierCurveTo(25, -30, 67, -28, 103, 0);
    ctx.bezierCurveTo(71, 27, 25, 28, -8, 0);
    ctx.fillStyle = '#b27b54';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#744b3a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#5b3932';
    ctx.beginPath();
    ctx.ellipse(46, 0, 31, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let x = 24; x <= 66; x += 4) {
      line(ctx, x, -8, x - 1.6, 8, x % 8 === 0 ? '#e99566' : '#cb6344', 4);
    }
  });
  const number = index ? budget : 90 + Math.floor(10 * sewn);
  label(ctx, number, 1390, 505, 137, ink, { align: 'center', family: 'Serif' });
  label(ctx, 'crossings', 1390, 566, 46, quiet, { align: 'center' });
  const known = pullBack * (1 - Math.min(1, 5 * sine));
  faded(ctx, known, () => {
    const n = move < 0.5 ? square.n : tall.n;
    const d = budget / n;
    const bottom = baseY + d * cell;
    bracket(ctx, baseX, baseX + n * cell, bottom + 34, n + ' weight units', warp, 41);
    line(ctx, baseX - 35, baseY, baseX - 35, bottom, weft);
    for (const y of [baseY, bottom]) line(ctx, baseX - 42, y, baseX - 28, y, weft);
    const hideAnswer = index === 1 && move > 0.5;
    label(ctx, hideAnswer ? '? token units' : d + ' token units', baseX - 60, (baseY + bottom) / 2 + 12, 41, weft, { align: 'right' });
  });
  if (index === 2) {
    faded(ctx, reveal('costs about six operations', 0.55), () => {
      label(ctx, 'Dense training FLOPs', 1390, 698, 36, quiet, { align: 'center' });
      label(ctx, '≈ 6 × weights × tokens', 1390, 768, 55, ink, { family: 'Serif', align: 'center' });
    });
  }
}

// Paint one turn of a three-ply cord. The parts at the back are painted first.
function twist(purple) {
  const pitch = 58;
  const bitmap = createCanvas(pitch, 68);
  const ctx = bitmap.getContext('2d');
  const strokes = [];
  for (let ply = 0; ply < 3; ply++) {
    const phase = (x) => 2 * Math.PI * (x / pitch + ply / 3);
    for (let x = -12; x < pitch + 12; x += 2) {
      const y = (at) => 34 + 13 * Math.sin(phase(at));
      strokes.push({ x, y: y(x), next: y(x + 2), z: Math.cos(phase(x + 1)) });
    }
  }
  strokes.sort((a, b) => a.z - b.z);
  ctx.lineCap = 'round';
  for (const { x, y, next, z } of strokes) {
    const light = (z + 1) / 2;
    const hue = purple ? 259 : 14;
    const color = (l) => 'hsl(' + hue + ', ' + (purple ? 27 : 63) + '%, ' + l + '%)';
    line(ctx, x, y, x + 2, next, color(24 + light * 20), 24);
    line(ctx, x, y - 2, x + 2, next - 2, color(35 + light * 22), 15);
    line(ctx, x, y - 5, x + 2, next - 5, color(49 + light * 20), 3);
    line(ctx, x, y + 2, x + 2, next + 2, color(34 + light * 16), 1.2);
  }
  return bitmap;
}

function cord(ctx, tile, x, y, length) {
  if (length <= 0) return;
  ctx.save();
  ctx.translate(x, y - tile.height / 2);
  ctx.fillStyle = ctx.createPattern(tile, 'repeat-x');
  ctx.shadowColor = 'rgba(67,43,44,.23)';
  ctx.shadowOffsetY = 6;
  ctx.shadowBlur = 5;
  ctx.fillRect(0, 0, length, tile.height);
  ctx.restore();
}

const lossX = 185;
const nat = 690;
const pos = (score) => lossX + (score - floor) * nat;

// The stitch at the end of each cord carries the sample to its loss on the shared scale.
function measurement(ctx, cloth, plan, y, coefficient, shown, showValue, keepMark) {
  const purple = (2 / Math.sqrt(plan.n)) * nat;
  const value = loss(plan.n, plan.d, 2, coefficient);
  const end = pos(value);
  const length = (end - lossX) * shown;
  cord(ctx, cloth.purpleCord, lossX, y, Math.min(purple, length));
  cord(ctx, cloth.redCord, lossX + purple, y, Math.max(0, length - purple));
  if (keepMark > 0) {
    const previous = pos(loss(plan.n, plan.d));
    faded(ctx, keepMark, () => {
      for (const dx of [-4, 3]) line(ctx, previous + dx - 3, y - 21, previous + dx + 2, y + 21, '#59352e', 3);
    });
  }
  const isSquare = plan === square;
  const cell = 12.4;
  const x = end - plan.n * cell / 2;
  const edge = y + (isSquare ? 45 : -45);
  const top = isSquare ? edge : edge - cell * plan.d;
  line(ctx, end, y, x + cell * 0.45, edge, '#675459', 2.4);
  line(ctx, end, y, x + (plan.n - 0.45) * cell, edge, '#675459', 2.4);
  piece(ctx, isSquare ? cloth.left : cloth.right, x, top, cell);
  piece(ctx, isSquare ? cloth.right : cloth.left, x + (isSquare ? 5 * cell : 0), top + (isSquare ? 0 : 10 * cell), cell);
  line(ctx, end, y - 29, end, y + 20, ink, 3);
  label(ctx, plan.n + ' × ' + plan.d, x + plan.n * cell + 22, top + 67, 51, ink, { family: 'Serif' });
  faded(ctx, showValue, () => {
    label(ctx, value.toFixed(3), end + 22, y + 16, 49, ink, { family: 'Mono' });
  });
}

function samples(ctx, clock, cloth) {
  const { index, reveal, elapsed } = clock;
  const appear = index === 3 ? smooth((elapsed + 0.08) / 2.5) : 1;
  const changed = index < 5 ? 0 : index === 5 ? smooth(reveal('Watch the red ends', 2.55)) : 1;
  const coefficient = mix(2, 4, changed);
  const showValue = index === 3 ? smooth(reveal('fit a scaling law', 0.6)) : 1;
  label(ctx, 'Predicted loss', lossX, 140, 81, ink, { family: 'Serif' });
  label(ctx, 'nats per token', lossX + 565, 137, 36, quiet);

  const base = 248;
  line(ctx, lossX, base, pos(3.18), base, '#877c79', 2.4);
  for (let step = 0; step <= 21; step++) {
    const x = pos(1 + step / 10);
    const big = step % 5 === 0;
    line(ctx, x, base, x, base - (big ? 16 : 7), quiet, big ? 2 : 1);
    if (big) label(ctx, String(1 + step / 10), x, base - 27, 35, quiet, { family: 'Mono', align: 'center' });
  }
  const rows = [565, 702];
  line(ctx, lossX, base, lossX, rows[1] + 31, '#aa998e');
  const focus = index === 4 ? smooth(reveal('Which end', 0.5))
    : index === 5 ? 1 - smooth(reveal('Now suppose', 0.45))
    : index === 6 ? smooth(elapsed / 0.65) : 0;
  faded(ctx, focus, () => {
    const chosen = index < 6 ? square : tall;
    const x = pos(loss(chosen.n, chosen.d, 2, coefficient));
    ctx.setLineDash([5, 9]);
    line(ctx, x, base + 2, x, rows[1] + 36, '#8c7165', 3);
    ctx.setLineDash([]);
  });
  measurement(ctx, cloth, tall, rows[0], coefficient, appear, showValue, changed);
  measurement(ctx, cloth, square, rows[1], coefficient, appear, showValue, changed);
  faded(ctx, showValue, () => {
    const y = 379;
    label(ctx, 'Example fit', lossX, y, 37, quiet);
    label(ctx, '1  +', lossX + 250, y, 44, ink, { family: 'Mono' });
    label(ctx, '2 / √N', lossX + 402, y, 44, warp, { family: 'Mono' });
    label(ctx, '+', lossX + 600, y, 44, quiet);
    const b = changed > 0 && changed < 1 ? coefficient.toFixed(1) : String(coefficient);
    label(ctx, b + ' / √D', lossX + 663, y, 44, weft, { family: 'Mono' });
    label(ctx, 'weights', lossX + 402, y + 43, 32, warp);
    label(ctx, 'tokens', lossX + 663, y + 43, 32, weft);
  });
}

function draw(ctx, clock) {
  artwork ??= makeCloth();
  ctx.save();
  background(ctx, artwork);
  if (clock.index < 3) hero(ctx, clock, artwork);
  else samples(ctx, clock, artwork);
  ctx.restore();
}

function check() {
  function verify(value, message) {
    if (!value) throw new Error(message);
  }
  for (const { n, d } of [square, tall]) verify(n * d === budget, 'Every weave must spend 100 units.');
  const a = (p, b) => loss(p.n, p.d, 2, b);
  verify(a(square, 2).toFixed(3) === '2.265' && a(tall, 2).toFixed(3) === '2.342', 'Check the original loss fit.');
  verify(a(square, 4).toFixed(3) === '2.897' && a(tall, 4).toFixed(3) === '2.789', 'Check the revised loss fit.');
  verify(optimum(budget) === square.n && optimum(budget, 2, 4) === tall.n, 'The preferred allocation should move.');
  const tie = (2 / Math.sqrt(tall.n) - 2 / Math.sqrt(square.n)) /
    (1 / Math.sqrt(square.d) - 1 / Math.sqrt(tall.d));
  verify(tie > 2 && tie < 4 && Math.abs(pos(a(square, tie)) - pos(a(tall, tie))) < 1e-8, 'The two cord ends have to cross.');
}

export default { title: 'One Hundred Crossings', beats, draw, check };
