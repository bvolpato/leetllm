import assert from 'node:assert/strict';
import { Path2D } from '@napi-rs/canvas';

const beats = [
  {
    id: 'flight',
    say: 'There’s a moment in the puppy’s stride when all four paws leave the ground. Someone searching for a dog running has picked this take. Its caption is our first match.',
    hold: 0.9,
  },
  {
    id: 'two-takes',
    say: 'The search turns up two more captions. An encoder represents the search and each caption as vectors. Compare their directions. The hound and the sleeper tie. Which caption would you train the search to rank lower?',
    hold: 2.1,
  },
  {
    id: 'one-mark',
    say: 'For training, a softmax turns these scores into shares of one whole. At a temperature of point two, the hound and the sleeper each get twenty-nine percent. Give all the target share to the puppy and watch the arrows.',
    hold: 1.2,
  },
  {
    id: 'the-stride',
    say: 'The contrastive loss pushes each share toward its target. Here it calls for both newcomers’ scores to come down. Look at the hound’s stride. We’d be teaching the encoder to penalize a second good answer.',
    hold: 1.0,
  },
  {
    id: 'second-mark',
    say: 'Mark the hound as a match too. Split the target evenly between the two runners. The hound still has twenty-nine percent of the model’s share. Now its target is fifty.',
    hold: 1.1,
  },
  {
    id: 'feet',
    say: 'See how the hound’s arrow has turned up? The sleeping dog still gets pushed down. That’s our hard negative. Its caption scored as high as a runner’s, and those paws stayed right there on the ground.',
    hold: 2.3,
  },
];

const prints = [
  { caption: 'A puppy runs', subject: 'puppy', score: 0.83 },
  { caption: 'A hound sprints', subject: 'hound', score: 0.76 },
  { caption: 'A dog sleeps', subject: 'sleeper', score: 0.76 },
];
const scores = prints.map((print) => print.score);
const temperature = 0.2;
const firstTarget = [1, 0, 0];
const auditedTarget = [0.5, 0.5, 0];

function comparison(values, target) {
  const peak = Math.max(...values);
  const weights = values.map((s) => Math.exp((s - peak) / temperature));
  const total = weights.reduce((a, b) => a + b, 0);
  const shares = weights.map((w) => w / total);
  return {
    shares,
    loss: -target.reduce((sum, t, i) => sum + t * Math.log(shares[i]), 0),
    // Direction of steepest descent in score space, before the encoder backpropagates.
    push: shares.map((p, i) => (target[i] - p) / temperature),
  };
}

const single = comparison(scores, firstTarget);
const audited = comparison(scores, auditedTarget);
const pct = (value) => Math.round(100 * value) + '%';

function check() {
  assert.deepEqual(single.shares.map(pct), ['42%', '29%', '29%']);
  assert.deepEqual(single.shares, audited.shares);
  assert.equal(prints[1].score, prints[2].score);
  assert.deepEqual(single.push.map(Math.sign), [1, -1, -1]);
  assert.deepEqual(audited.push.map(Math.sign), [1, 1, -1]);
  assert.equal(single.push[2], audited.push[2]);
  for (const target of [firstTarget, auditedTarget]) {
    const row = comparison(scores, target);
    for (const [i, push] of row.push.entries()) {
      const perturbed = (delta) => scores.map((s, j) => s + (i === j ? delta : 0));
      const h = 0.00001;
      const slope = (comparison(perturbed(h), target).loss - comparison(perturbed(-h), target).loss) / (2 * h);
      assert(Math.abs(push + slope) < 1e-7);
    }
  }
  return true;
}

const ink = '#172e43';
const blue = '#116587';
const red = '#a63e27';
const coat = '#f5e7c5';
const shadedCoat = '#a7b7ad';
const paths = new Map();
function shape(ctx, data, fill) {
  if (!paths.has(data)) paths.set(data, new Path2D(data));
  ctx.fillStyle = fill;
  ctx.fill(paths.get(data));
}
function ellipse(ctx, x, y, rx, ry, fill, rotation = 0) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, 2 * Math.PI);
  ctx.fill();
}
function line(ctx, points, color, width) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}
function type(ctx, text, x, y, size, family, color, align = 'left', style = '') {
  ctx.fillStyle = color;
  ctx.font = `${style} ${size}px "Lesson ${family}"`.trim();
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const bounded = (t) => Math.max(0, Math.min(1, t));

// Each pose runs from the upper joint through the wrist or hock to the toe.
// Two offset legs on each side give the animals a four-beat gallop.
const fore = [
  [[39,-8],[58,9],[96,24],[110,22]],
  [[39,-8],[50,17],[67,58],[79,60]],
  [[39,-8],[27,24],[3,56],[11,59]],
  [[39,-8],[16,14],[-1,23],[15,35]],
  [[39,-8],[57,7],[56,25],[73,25]],
];
const hind = [
  [[-47,0],[-61,15],[-106,18],[-121,33]],
  [[-47,0],[-40,26],[-69,37],[-65,51]],
  [[-47,0],[-13,21],[-20,48],[1,58]],
  [[-47,0],[-25,17],[-46,52],[-37,59]],
  [[-47,0],[-52,16],[-88,48],[-84,55]],
];
function joints(keys, phase) {
  const time = (phase % 1) * keys.length;
  const k = Math.floor(time);
  return keys[k].map((point, i) => point.map((v, j) =>
    mix(v, keys[(k + 1) % keys.length][i][j], smooth(time - k))));
}
function leg(ctx, keys, phase, far, stout) {
  const p = joints(keys, phase);
  const widths = [stout ? 10 : 8, 6, 2.6, 2];
  const color = far ? shadedCoat : coat;
  for (let i = 0; i < 3; i++) {
    const [x, y] = p[i], [u, v] = p[i + 1];
    const len = Math.hypot(u - x, v - y), nx = (y - v) / len, ny = (u - x) / len;
    const a = widths[i], b = widths[i + 1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + a * nx, y + a * ny);
    ctx.lineTo(u + b * nx, v + b * ny);
    ctx.lineTo(u - b * nx, v - b * ny);
    ctx.lineTo(x - a * nx, y - a * ny);
    ctx.fill();
    ellipse(ctx, x, y, a, a, color);
  }
  ellipse(ctx, p[3][0], p[3][1], 5.4, 2.8, color, -0.08);
}

function runner(ctx, phase, puppy) {
  const rise = 6 * Math.cos(phase * 2 * Math.PI);
  ctx.save();
  ctx.translate(0, -rise);
  ctx.scale(puppy ? 0.89 : 1, puppy ? 1.06 : 1);
  leg(ctx, hind, (phase + 0.09) % 1, true, puppy);
  leg(ctx, fore, (phase + 0.12) % 1, true, puppy);

  ctx.save();
  ctx.translate(-49, -7);
  ctx.rotate((puppy ? -0.38 : -0.06) + rise * 0.011);
  shape(ctx, 'M 5 -11 C -14 -18 -33 -2 -50 -11 Q -63 -16 -71 -27 Q -71 -13 -55 -5 C -35 7 -13 -2 5 4 Z', coat);
  ctx.restore();
  leg(ctx, hind, phase, false, puppy);
  if (puppy) {
    shape(ctx, 'M -67 -4 Q -70 -29 -48 -36 C -28 -41 -5 -29 15 -35 Q 34 -39 48 -47 L 60 -30 C 57 -9 48 13 30 16 Q 9 20 -9 11 Q -28 1 -43 11 Q -63 16 -67 -4 Z', coat);
    shape(ctx, 'M -63 -22 Q -56 -38 -41 -37 Q -26 -37 -29 -25 Q -34 -12 -51 -10 Q -61 -10 -63 -22 Z', '#395c6c');
  } else {
    shape(ctx, 'M -65 -2 C -67 -21 -53 -30 -30 -32 Q -8 -33 13 -37 Q 39 -42 60 -56 L 76 -41 Q 61 -28 52 -8 C 46 15 27 23 14 10 Q 0 -6 -14 -8 C -30 -9 -41 9 -51 13 Q -63 14 -65 -2 Z', coat);
    shape(ctx, 'M -4 -29 Q 9 -32 31 -38 Q 18 -30 14 -26 Q 8 -22 -4 -20 Z', '#bcc0ac');
  }
  leg(ctx, fore, phase, false, puppy);

  ctx.save();
  ctx.translate(puppy ? 55 : 66, puppy ? -42 : -51);
  ctx.rotate(0.04 * Math.cos(phase * 2 * Math.PI));
  if (puppy) {
    shape(ctx, 'M -21 -5 Q -19 -27 0 -29 Q 17 -31 24 -14 Q 30 -9 44 -10 L 45 -2 Q 40 9 25 9 Q 20 20 -1 18 L -20 16 Z', coat);
    shape(ctx, 'M -13 -23 Q -23 -31 -36 -26 Q -44 -21 -48 -18 Q -50 -13 -39 -12 Q -26 -10 -16 -3 Q -8 0 -7 -9 Z', '#303d49');
    ellipse(ctx, 16, -14, 2.5, 3, '#203241');
    ellipse(ctx, 42, -9, 5.4, 4.0, '#263645');
  } else {
    shape(ctx, 'M -21 2 Q -16 -15 -4 -16 Q 9 -18 18 -9 Q 38 -6 56 -8 L 55 -3 Q 48 3 29 4 Q 17 12 1 12 L -17 16 Z', coat);
    shape(ctx, 'M -6 -13 L -31 -27 Q -27 -11 -13 -7 L -22 -8 Q -20 -2 -9 0 Z', '#bac3b3');
    ellipse(ctx, 13, -8, 2.2, 2.3, '#203241');
    ellipse(ctx, 54, -7, 4.8, 2.7, '#263645');
  }
  ctx.restore();
  ctx.restore();
}

function sleeping(ctx, time) {
  const breath = Math.sin(time * 2) * 0.014;
  ctx.save();
  ctx.scale(1, 1 + breath);
  shape(ctx, 'M -107 -7 Q -114 -37 -89 -59 C -67 -82 -15 -78 12 -63 Q 37 -56 48 -37 L 62 -12 Q 53 2 27 2 L -79 2 Q -98 2 -107 -7 Z', coat);
  shape(ctx, 'M -100 -48 Q -78 -81 -43 -73 C -47 -54 -68 -56 -64 -40 Q -74 -26 -91 -33 Z', '#527381');
  shape(ctx, 'M -97 -32 Q -89 -5 -53 -7 Q -36 -6 -19 -16 Q -17 -6 -30 -1 Q -77 16 -100 0 Q -113 -9 -109 -25 Z', shadedCoat);
  ctx.restore();
  shape(ctx, 'M -6 -19 Q 27 -25 63 -13 Q 90 -11 93 -5 Q 95 2 83 2 L 33 2 Q 6 0 -6 -9 Z', '#bdc4b5');
  shape(ctx, 'M 10 -41 Q 29 -67 53 -57 Q 69 -53 74 -34 Q 81 -24 105 -20 Q 112 -18 111 -13 Q 106 -1 84 -3 L 51 -7 Q 33 1 16 -7 Q 1 -17 10 -41 Z', coat);
  shape(ctx, 'M 31 -55 Q 11 -54 5 -34 C -5 -11 6 -1 20 -7 Q 32 -11 35 -27 Q 37 -41 31 -55 Z', '#344e60');
  line(ctx, [[60,-32],[64,-29],[70,-30]], '#283948', 2.2);
  ellipse(ctx, 106, -19, 6, 4, '#213747');
  line(ctx, [[87,-9],[95,-9],[100,-11]], '#879b99', 1.5);
}

const specks = Array.from({length: 540}, (_, i) => {
  const rand = (n) => {
    const v = Math.sin(n * 27.163 + 71.29) * 38251.9;
    return v - Math.floor(v);
  };
  return [rand(i * 3), rand(i * 3 + 1), rand(i * 3 + 2)];
});

function exposure(ctx, subject, time, hero, flightStudy) {
  // A contact print of a motion study. The fixed wall and its foot line make the airborne pose readable.
  const w = 520 + hero * 455, h = 296, floor = 244;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, 0, w, h);
  sky.addColorStop(0, '#183851');
  sky.addColorStop(0.5, '#2c6480');
  sky.addColorStop(1, '#44778a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  for (let x = 12; x < w; x += 52) {
    line(ctx, [[x,0],[x-0.5,floor]], '#c4d8ce39', 1.25);
    line(ctx, [[x,floor+1],[x-24,h]], '#aec8c32a', 1);
  }
  for (let y = 22; y < floor; y += 52)
    line(ctx, [[0,y],[w,y+0.6]], '#d2e2cf35', 1);
  ctx.fillStyle = '#18374b';
  ctx.fillRect(0, floor+1, w, h-floor);
  line(ctx, [[0,floor],[w,floor]], '#b5cabb', 2);
  for (let i = 0; i < 125; i++) {
    const [x, y, n] = specks[i];
    line(ctx, [[w*x,floor+3+y*48],[w*x+3+n*11,floor+3+y*48]], '#d8e3d438', 0.8);
  }
  const frame = Math.floor(time * 12);
  const phase = ((frame + (subject === 'puppy' ? 1 : 5)) % 12) / 12;
  const x = w / 2 + hero * 176 + (subject === 'sleeper' || flightStudy ? 0 : 14 * Math.sin(time * 0.9));
  if (subject === 'sleeper') {
    ellipse(ctx, x, floor+4, 166, 9, '#102c40b0');
    ctx.save();
    ctx.translate(x, floor);
    ctx.scale(1.65, 1.65);
    sleeping(ctx, time);
    ctx.restore();
  } else {
    const scale = 1.55, pup = subject === 'puppy';
    const pose = flightStudy ? 0 : phase;
    const hipHeight = (stride) => {
      const toeBottom = Math.max(...[[hind, 0], [hind, 0.09], [fore, 0], [fore, 0.12]]
        .map(([keys, offset]) => joints(keys, stride + offset)[3][1] + 2.8));
      const swing = Math.cos(2 * Math.PI * stride);
      const suspension = Math.max(0, 23 * swing - 1);
      return floor - suspension - scale * ((pup ? 1.06 : 1) * toeBottom - 6 * swing);
    };
    const modelY = hipHeight(pose);
    ellipse(ctx, x + 2, floor+3, 100 + 6 * Math.cos(pose * Math.PI * 2), 6, '#102c4099');
    if (hero > 0.05) {
      // Successive exposures register the same puppy farther along the wall.
      for (const [offset, lag, density] of [[455, 0.55, 0.22], [245, 0.28, 0.4]]) {
        const earlier = (phase + 1 - lag) % 1;
        ctx.save();
        ctx.globalAlpha *= hero * density;
        ctx.translate(x - offset * hero, hipHeight(earlier));
        ctx.scale(scale, scale);
        runner(ctx, earlier, pup);
        ctx.restore();
      }
    }
    ctx.save();
    ctx.translate(x, modelY);
    ctx.scale(scale, scale);
    runner(ctx, pose, pup);
    ctx.restore();
    if (flightStudy > 0) {
      ctx.save();
      ctx.globalAlpha *= flightStudy;
      // Two chalk ticks register the trailing paw above the track.
      const rearToe = x - 121 * scale;
      const toeY = modelY + (33 - 6) * scale;
      const markX = rearToe - 7;
      line(ctx, [[markX,toeY+6],[markX,floor-2]], '#f4d39a', 1.7);
      line(ctx, [[markX-8,toeY+6],[markX+8,toeY+6]], '#f4d39a', 2.4);
      line(ctx, [[markX-8,floor-2],[markX+8,floor-2]], '#f4d39a', 2.4);
      ctx.restore();
    }
  }
  for (const [x, y, n] of specks) {
    ctx.fillStyle = n < 0.6 ? '#e1e4c838' : '#102d482e';
    ctx.fillRect(x*w, y*h, 0.8 + 1.3*n, 0.7 + n);
  }
  ctx.restore();
}

function print(ctx, i, x, y, scale, time, hero, flightStudy) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const w = 560 + 455 * hero, h = 403;
  ctx.fillStyle = '#695d4723';
  ctx.fillRect(-w/2+4, 5, w, h);
  ctx.fillStyle = '#f9f4e2';
  ctx.fillRect(-w/2, 0, w, h);
  ctx.translate(-w/2+20, 18);
  exposure(ctx, prints[i].subject, time, hero, flightStudy);
  type(ctx, prints[i].caption, (w-40)/2, 357, 44, 'Serif', ink, 'center');
  ctx.restore();
}

function arrow(ctx, x, y, push, opacity) {
  if (Math.abs(push) < 0.003 || opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  const up = push > 0;
  ctx.translate(x, y);
  ctx.scale(1, up ? -1 : 1);
  const t = Math.min(1, Math.abs(push) / 0.26);
  ctx.scale(1, t);
  const color = up ? blue : red;
  // The arrows encode the sign. Their full height is the same for both directions.
  shape(ctx, 'M -4 -37 Q -5 -42 0 -43 Q 5 -42 5 -37 L 3 22 L 15 8 Q 18 5 21 9 Q 23 11 20 16 L 3 40 Q 0 45 -4 39 L -23 17 Q -27 12 -22 9 Q -19 7 -16 11 L -4 23 Z', color);
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed, seconds, reveal } = clock;
  const unfold = index === 0 ? 0 : index === 1 ? smooth(reveal('The search turns up', 1.6)) : 1;
  const cosines = index === 1 ? reveal('Compare their directions', 0.7) : Number(index > 1);
  const asShares = index === 2 ? smooth(reveal('a softmax', 0.8)) : Number(index > 2);
  const mark = index === 2 ? smooth(reveal('Give all the target share', 0.65)) : Number(index > 2);
  const flightStudy = index === 3 ? reveal('Look at the hound’s stride', 0.45) : Number(index > 3);
  const corrected = index === 4 ? smooth(reveal('Split the target evenly', 0.95)) : Number(index > 4);
  const nameNegative = index === 5 ? reveal('our hard negative', 0.6) : 0;
  const t = index === 5 ? seconds - elapsed + Math.min(elapsed, clock.speechDuration) : seconds;

  const paper = ctx.createLinearGradient(0, 0, 1810, 1070);
  paper.addColorStop(0, '#fbf5e5');
  paper.addColorStop(0.65, '#eee4cc');
  paper.addColorStop(1, '#dfd1b5');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 1920, 1080);
  for (const [x,y,n] of specks) {
    ctx.fillStyle = '#705e4030';
    ctx.fillRect(x*1920, y*1080, n*2+0.5, 0.8);
  }

  type(ctx, 'Caption search', 90, 83, 39, 'Sans', '#665443');
  type(ctx, '“A dog is running”', 85, 173, 85, 'Serif', ink);
  const centers = [366, 960, 1554];
  const y = mix(214, 246, unfold);
  const heroScale = mix(1.70, 1, unfold);
  // A single oversize print gives way to the complete contact sheet.
  for (let i = 2; i >= 0; i--) {
    if (i && !unfold) continue;
    const arrival = i === 2 ? smooth(bounded((unfold - 0.16) / 0.84)) : unfold;
    const x = i === 0 ? mix(960, centers[i], unfold) : mix(2420 + i*180, centers[i], arrival);
    print(ctx, i, x, y + (1 - arrival) * (i ? 42 : 0), i === 0 ? heroScale : 1,
      t, i === 0 ? 1-unfold : 0, i === 1 ? flightStudy : 0);
  }

  if (cosines <= 0) return;
  // When the operation changes, exchange the measurement and its label together.
  const showingShare = asShares >= 0.5;
  const numberOpacity = cosines * Math.abs(1 - 2 * asShares);
  for (const [i, x] of centers.entries()) {
    ctx.save();
    ctx.globalAlpha = numberOpacity;
    type(ctx, showingShare ? pct(single.shares[i]) : scores[i].toFixed(2),
      x, 754, 74, 'Mono', ink, 'center');
    type(ctx, showingShare ? 'model share' : 'toy cosine', x, 803, 36, 'Sans', '#544c42', 'center');
    ctx.restore();
    if (!mark) continue;
    const target = corrected < 0.5 ? firstTarget[i] : auditedTarget[i];
    const signChanges = Math.sign(single.push[i]) !== Math.sign(audited.push[i]);
    const push = corrected < 0.5 ? single.push[i] : audited.push[i];
    const arrowTransition = signChanges ? Math.abs(1 - 2 * corrected) ** 2 : 1;
    arrow(ctx, x + 154, 728, push * arrowTransition, mark);
    ctx.save();
    ctx.globalAlpha = mark * (i === 2 ? 1 : Math.abs(1 - 2 * corrected));
    type(ctx, pct(target) + ' target', x, 875, 44, 'Sans', target ? blue : red, 'center');
    ctx.restore();
  }
  if (nameNegative > 0) {
    ctx.save();
    ctx.globalAlpha = nameNegative;
    ctx.translate(centers[2], 219);
    ctx.rotate(-0.035);
    type(ctx, 'hard negative', 0, 0, 48, 'Serif', red, 'center', 'italic');
    line(ctx, [[-128,8],[-48,10],[75,9],[133,7]], red, 3);
    ctx.restore();
  }
}

export default { title: 'Which dog is the hard negative?', beats, draw, check };
