import assert from 'node:assert/strict';
import { DELAY_FIXTURE } from '../../../films/boosted-trees/fixtures.mjs';

// The three readings reuse the lesson's regression fixture, in millimeters of ink rise.
const { actual, initial, leaves, learningRate } = DELAY_FIXTURE;
const residuals = actual.map((height, i) => height - initial[i]);
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const leafMeans = [...new Set(leaves)].map(leaf =>
  mean(residuals.filter((_, i) => leaves[i] === leaf)),
);
const corrected = initial.map((height, i) => height + learningRate * leafMeans[leaves[i]]);
const remaining = actual.map((height, i) => height - corrected[i]);

const beats = [
  {
    id: 'the-blue-edge',
    say: "Watch the red mark. That's how far we expected the ink to climb in a minute. Six millimeters. Look where the blue edge stopped.",
    hold: 1.0,
  },
  {
    id: 'three-strips',
    say: "Eight millimeters. Here are the other training strips. All three predictions started at six. These two strips are coated. The tall stain is on blotting paper.",
    hold: 0.9,
  },
  {
    id: 'signed-gaps',
    say: "We're fitting a boosted tree with squared error. Measure from each prediction to the ink. Four millimeters down, two up, fourteen up. Those signed gaps are the errors the tree learns from.",
    hold: 1.0,
  },
  {
    id: 'one-split',
    say: "Our tree splits on paper type. Each leaf gets the average error for its strips. The blotter has a leaf to itself. The coated strips share one. Minus four and plus two average to minus one.",
    hold: 1.1,
  },
  {
    id: 'quarter-step',
    say: "Our learning rate is one quarter. On the blotter, a quarter of fourteen adds three and a half millimeters to six. Now look at the middle strip. Where will its red mark go?",
    hold: 2.0,
  },
  {
    id: 'the-drop',
    say: "Watch those two red tips. They went down together. Both coated strips get a quarter of minus one. That puts their marks at five and three quarters. The first strip needed that drop. The middle one needed a rise.",
    hold: 1.1,
  },
  {
    id: 'what-remains',
    say: "Across the three strips, the mean squared error fell. But here the gap grew from two millimeters to two and a quarter. When we fit the next tree, this strip brings that new gap.",
    hold: 2.6,
  },
];

const W = 1920;
const H = 1080;
const baseline = 839;
const perMM = 26.5;
const heightAt = mm => baseline - mm * perMM;
const centers = [422, 936, 1490];
const half = 116;
const top = 204;
const bottom = 914;
const plum = '#2e2847';
const midBlue = '#293782';
const red = '#ac302b';
const apricot = '#fff4d9';
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const mix = (a, b, p) => a + (b - a) * p;

function line(ctx, x, y, x2, y2, color, width, dash = []) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function type(ctx, text, x, y, size, color, align = 'left', face = 'Sans', weight = 600) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function fade(ctx, opacity, paint) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(opacity);
  paint();
  ctx.restore();
}

function noise(i) {
  const n = Math.sin(i * 127.1 + 31.17) * 43758.5453;
  return n - Math.floor(n);
}

// Fibers stay registered to the paper as the camera moves into the stain.
const fibers = Array.from({ length: 790 }, (_, i) => ({
  x: (noise(i + 1) * 2 - 1) * half,
  y: mix(top, bottom, noise(i + 900)),
  length: 1.2 + noise(i + 1800) * 5.5,
  slant: noise(i + 2700) * 2.6 - 1.3,
}));
const edge = Array.from({ length: 161 }, (_, i) => ({
  x: mix(-half, half, i / 160),
  grain: (noise(i + 618) - 0.5) * 2 + 0.8 * Math.sin(i * 0.22) + 0.7 * Math.sin(i * 0.071),
}));

// Slight variations in the surface and in the thickness of the deposited dye.
const blooms = Array.from({ length: 76 }, (_, i) => ({
  x: mix(-half, half, noise(i + 321)),
  depth: noise(i + 2218),
  radius: 3 + 16 * noise(i + 541),
  stretch: 0.55 + 0.9 * noise(i + 761),
}));

function paperPath(ctx, x, index) {
  ctx.beginPath();
  ctx.moveTo(x - half, bottom);
  for (let j = 36; j >= 0; j--)
    ctx.lineTo(x - half + noise(500 + j + index) * 1.7, mix(top, bottom, j / 36));
  for (let j = 0; j <= 50; j++)
    ctx.lineTo(x + mix(-half, half, j / 50), top + noise(index * 19 + j) * 4.5);
  for (let j = 0; j <= 36; j++)
    ctx.lineTo(x + half - noise(160 + j + index) * 1.2, mix(top, bottom, j / 36));
  ctx.closePath();
}

function wetEdge(ctx, x, y, spread, offset = 0) {
  ctx.beginPath();
  ctx.moveTo(x - half, bottom);
  for (const f of edge) ctx.lineTo(x + f.x, y + offset + f.grain * spread);
  ctx.lineTo(x + half, bottom);
  ctx.closePath();
}

function strip(ctx, x, i, level) {
  ctx.save();
  ctx.shadowColor = '#36304059';
  ctx.shadowOffsetX = 9;
  ctx.shadowOffsetY = 8;
  ctx.shadowBlur = 13;
  paperPath(ctx, x, i);
  ctx.fillStyle = '#fff5de';
  ctx.fill();
  ctx.restore();

  ctx.save();
  paperPath(ctx, x, i);
  ctx.clip();
  const stock = ctx.createLinearGradient(x - half, 0, x + half, 0);
  stock.addColorStop(0, '#dfd6be');
  stock.addColorStop(0.055, '#f6edd5');
  stock.addColorStop(0.48, '#fff8e6');
  stock.addColorStop(0.88, '#faf0d8');
  stock.addColorStop(1, '#e7ddc3');
  ctx.fillStyle = stock;
  ctx.fillRect(x - half, top, 2 * half, bottom - top);

  const y = heightAt(level);
  wetEdge(ctx, x, y, 1.7, -2.2);
  ctx.fillStyle = '#a5add9';
  ctx.fill();
  wetEdge(ctx, x, y, 1.15);
  const ink = ctx.createLinearGradient(0, y, 0, baseline + 35);
  ink.addColorStop(0, '#7373bd');
  ink.addColorStop(0.09, '#5356af');
  ink.addColorStop(0.48, '#3e43a3');
  ink.addColorStop(1, '#272b77');
  ctx.fillStyle = ink;
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (const [j, stain] of blooms.entries()) {
    const cy = mix(y + 2, baseline + 8, stain.depth);
    const x0 = x + stain.x;
    const wash = ctx.createRadialGradient(x0, cy, 0, x0, cy, stain.radius);
    wash.addColorStop(0, j % 3 ? '#27176e25' : '#d7c8f53b');
    wash.addColorStop(1, '#6867bc00');
    ctx.fillStyle = wash;
    ctx.beginPath();
    ctx.ellipse(x0, cy, stain.radius, stain.radius * stain.stretch, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // Each short stroke is a capillary channel at the edge of the ink.
  ctx.beginPath();
  for (let j = 0; j < edge.length; j++) {
    const f = edge[j];
    const yy = y + f.grain * 1.5;
    ctx.moveTo(x + f.x, yy + 5);
    ctx.lineTo(x + f.x + noise(j) - 0.5, yy - 1 - 3 * noise(j + 23));
  }
  ctx.strokeStyle = '#7474b675';
  ctx.lineWidth = 0.65;
  ctx.stroke();

  for (const [overInk, tint] of [[false, '#79705a25'], [true, '#fff9df3d']]) {
    ctx.beginPath();
    for (const f of fibers) {
      if ((f.y >= y) !== overInk) continue;
      ctx.moveTo(x + f.x, f.y);
      ctx.lineTo(x + f.x + f.slant, f.y + f.length);
    }
    ctx.strokeStyle = tint;
    ctx.lineWidth = 0.68;
    ctx.stroke();
  }
  type(ctx, ['A', 'B', 'C'][i], x, top + 72, 56, '#847a69', 'center', 'Serif', 400);
  ctx.restore();
}

function bath(ctx) {
  const rim = 133;
  const width = 1644;
  const y = baseline + 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rim, y, width, 116, [10, 10, 32, 32]);
  const bathFill = ctx.createLinearGradient(0, y, 0, y + 116);
  bathFill.addColorStop(0, '#7779bb');
  bathFill.addColorStop(0.08, '#343584');
  bathFill.addColorStop(0.68, '#262363');
  bathFill.addColorStop(0.91, '#45477f');
  bathFill.addColorStop(1, '#9994bf');
  ctx.fillStyle = bathFill;
  ctx.fill();
  ctx.strokeStyle = '#4c496e';
  ctx.lineWidth = 2;
  ctx.stroke();
  line(ctx, rim + 11, y + 3, rim + width - 11, y + 3, '#dcdaf5', 4);
  for (const x of centers) {
    ctx.beginPath();
    ctx.ellipse(x, y + 3, half + 14, 5.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#b2aeda';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y + 2, half + 2, 3.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#363681';
    ctx.fill();
  }
  line(ctx, rim + 32, y + 101, rim + width - 32, y + 101, '#b9bad46b', 2);
  ctx.restore();
}

function advance(clock, beat, phrase, span) {
  if (clock.index < beat) return 0;
  if (clock.index > beat) return 1;
  return ease(clock.reveal(phrase, span));
}

function camera(clock) {
  const pullBack = advance(clock, 1, 'Here are the other', 1.65);
  const findPair = advance(clock, 4, 'Now look at the middle strip', 1.55);
  const inspectB = advance(clock, 5, 'The middle one', 1.55);
  const pair = findPair - inspectB;
  const close = 1 - pullBack + inspectB;
  return {
    zoom: mix(1, 4.35, close) + pair * 0.65,
    cx: mix(W / 2, centers[1], close) + pair * ((centers[0] + centers[1]) / 2 - W / 2),
    cy: mix(H / 2, 660, close) + pair * 83,
    close,
    pair,
  };
}

function position(cam, x, y) {
  return [W / 2 + (x - cam.cx) * cam.zoom, H / 2 + (y - cam.cy) * cam.zoom];
}

function mark(ctx, cam, i, value, ghost = false) {
  const [x0, y] = position(cam, centers[i] - half, heightAt(value));
  const [x1] = position(cam, centers[i] + half, heightAt(value));
  if (ghost) {
    line(ctx, x0 - 4, y, x1 + 5, y, '#ffdfb3', 4, [10, 9]);
    return;
  }
  line(ctx, x0 - 8, y + 1, x1 + 20, y + 1, '#fff3d6', 9);
  line(ctx, x0 - 8, y, x1 + 20, y, red, 5);
  ctx.fillStyle = red;
  ctx.beginPath();
  ctx.moveTo(x1 + 5, y - 9);
  ctx.lineTo(x1 + 21, y);
  ctx.lineTo(x1 + 5, y + 9);
  ctx.fill();
}

function signed(n) { return (n < 0 ? '−' : '+') + Math.abs(n); }

function brace(ctx, x1, x2, y, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y + 15);
  ctx.quadraticCurveTo(x1, y, x1 + 15, y);
  ctx.lineTo(x2 - 15, y);
  ctx.quadraticCurveTo(x2, y, x2, y + 15);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function wideLabels(ctx, cam, levels, clock, showGaps, showLeaves, blotterMove) {
  const place = (x, y) => position(cam, x, y);
  const [a] = place(centers[0], 0);
  const [b] = place(centers[1], 0);
  const [c] = place(centers[2], 0);
  const [, heading] = place(0, 119);
  const [, groupLine] = place(0, 177);
  const meanA = advance(clock, 3, 'Minus four and plus two', 0.5);
  const meanC = advance(clock, 3, 'The blotter has a leaf', 0.5);
  for (const [x, name, group, average] of [
    [(a + b) / 2, 'Coated paper', 0, meanA],
    [c, 'Blotting paper', 1, meanC],
  ]) {
    type(ctx, name, x, heading - 10 - 28 * showLeaves, 46, plum, 'center', 'Serif', 400);
    fade(ctx, average, () =>
      type(ctx, 'Leaf mean  ' + signed(leafMeans[group]) + ' mm', x, heading + 32, 36, midBlue, 'center'));
  }
  brace(ctx, a - 40, b + 40, groupLine, '#77708e');
  brace(ctx, c - 80, c + 80, groupLine, '#77708e');

  for (let i = 0; i < centers.length; i++) {
    const x = centers[i];
    const [left, predY] = place(x - half, heightAt(levels[i]));
    const [right, actualY] = place(x + half, heightAt(actual[i]));
    const beforeGap = 1 - showGaps;
    fade(ctx, beforeGap, () => {
      type(ctx, actual[i] + ' mm', right + 20, actualY, 43, midBlue);
      type(ctx, '6', left - 20, predY, 43, red, 'right');
    });
    fade(ctx, showGaps, () => {
      const isMoved = i === 2 && blotterMove > 0;
      const annotationX = right + 20;
      const sign = residuals[i] > 0 ? -1 : 1;
      const arrowY = actualY;
      const bottomY = place(0, heightAt(initial[i]))[1];
      fade(ctx, isMoved ? 1 - blotterMove : 1, () => {
        line(ctx, annotationX, bottomY, annotationX, arrowY, midBlue, 3);
        line(ctx, annotationX, arrowY, annotationX - 6, arrowY - sign * 9, midBlue, 3);
        line(ctx, annotationX, arrowY, annotationX + 6, arrowY - sign * 9, midBlue, 3);
        type(ctx, signed(residuals[i]), annotationX + 14, (arrowY + bottomY) / 2, 40, plum);
      });
      if (isMoved) fade(ctx, blotterMove, () => {
        type(ctx, corrected[i] + ' mm', left - 17, predY, 38, red, 'right');
        type(ctx, actual[i] + ' mm', right + 16, actualY, 37, midBlue);
      });
    });
  }
}

function pairLabels(ctx, cam, level, drop) {
  const [a, y] = position(cam, centers[0], heightAt(level));
  const [b] = position(cam, centers[1], heightAt(level));
  const halfWidth = cam.zoom * half;
  // The tie joins the two predictions that receive the same leaf value.
  line(ctx, a + halfWidth + 24, y, b - halfWidth - 14, y, red, 3, [7, 9]);
  type(ctx, 'Coated paper', (a + b) / 2, 152, 62, plum, 'center', 'Serif', 400);
  type(ctx, 'Shared leaf   −1 mm', (a + b) / 2, 216, 42, midBlue, 'center');
  for (let i = 0; i < 2; i++) {
    const [x, inkY] = position(cam, centers[i], heightAt(actual[i]));
    type(ctx, ['A', 'B'][i], x, 395, 66, '#827766', 'center', 'Serif', 400);
    type(ctx, actual[i] + ' mm', x + halfWidth + 19, inkY, 41, midBlue);
  }
  const label = drop > 0.99 ? '5.75 mm' : '6 mm';
  type(ctx, label, (a + b) / 2, y + 53, 48, red, 'center');
}

function closeLabels(ctx, cam, level, inkRise, drop, remnant) {
  const [left, observedY] = position(cam, centers[1] - half, heightAt(actual[1]));
  const [right, redY] = position(cam, centers[1] + half, heightAt(level));
  const [, oldY] = position(cam, centers[1], heightAt(initial[1]));
  const [, labelY] = position(cam, 0, 576);
  type(ctx, 'Coated paper  /  B', left, Math.max(100, labelY), 50, plum, 'left', 'Serif', 400);
  const oldOpacity = 1 - drop;
  fade(ctx, inkRise, () => {
    line(ctx, right + 5, observedY, right + 54, observedY, midBlue, 3);
    type(ctx, 'Ink  8 mm', right + 71, observedY, 43, midBlue);
  });
  fade(ctx, oldOpacity, () =>
    type(ctx, 'Prediction  6 mm', right + 42, redY, 41, red));
  fade(ctx, drop, () => {
    type(ctx, 'Was 6 mm', left - 22, oldY - 6, 38, plum, 'right');
    type(ctx, 'Now 5.75 mm', right + 40, redY, 43, red);
  });
  fade(ctx, drop, () => {
    const x = right - 124;
    const hi = observedY + 5;
    const lo = mix(oldY, redY, remnant) - 3;
    line(ctx, x, hi, x, lo, apricot, 4);
    line(ctx, x - 10, hi, x + 10, hi, apricot, 4);
    line(ctx, x - 10, lo, x + 10, lo, apricot, 4);
    const reading = remnant < 0.5 ? 'Old gap  ' + residuals[1] : 'Gap  ' + remaining[1];
    type(ctx, reading + ' mm', x - 25, (hi + lo) / 2, 48, apricot, 'right');
  });
}

const settled = fraction => ease((fraction - 0.78) / 0.22);

function draw(ctx, clock) {
  const cam = camera(clock);
  const sky = ctx.createLinearGradient(80, 0, 1820, H);
  sky.addColorStop(0, '#e7e3ed');
  sky.addColorStop(0.52, '#d5cfe1');
  sky.addColorStop(1, '#b1acc3');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const rise = clock.index === 0 ? ease(clock.elapsed / 2.2) : 1;
  const showGaps = advance(clock, 2, 'Measure from each prediction', 0.7);
  const showLeaves = advance(clock, 3, 'Our tree splits', 0.65);
  const blotterMove = advance(clock, 4, 'On the blotter', 1.15);
  const drop = clock.index === 5 ? ease(clock.elapsed / 1.0) : Number(clock.index > 5);
  const remnant = advance(clock, 6, 'here the gap grew', 0.68);
  const levels = corrected.map((height, i) => mix(initial[i], height, i === 2 ? blotterMove : drop));

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.cx, -cam.cy);
  for (let i = 0; i < centers.length; i++) {
    strip(ctx, centers[i], i, i === 1 ? mix(5.15, actual[i], rise) : actual[i]);
  }
  bath(ctx);
  ctx.restore();

  for (let i = 0; i < centers.length; i++) {
    const moved = i === 2 ? blotterMove : drop;
    fade(ctx, moved, () => mark(ctx, cam, i, initial[i], true));
    mark(ctx, cam, i, levels[i]);
  }
  fade(ctx, settled(1 - cam.close - cam.pair), () =>
    wideLabels(ctx, cam, levels, clock, showGaps, showLeaves, blotterMove));
  fade(ctx, settled(cam.pair), () => pairLabels(ctx, cam, levels[1], drop));
  const stopped = clock.index === 0 ? ease((clock.elapsed - 2.2) / 0.45) : 1;
  fade(ctx, settled(cam.close), () => closeLabels(ctx, cam, levels[1], stopped, drop, remnant));
}

function check() {
  assert.deepEqual(residuals, [-4, 2, 14]);
  assert.deepEqual(leafMeans, [-1, 14]);
  assert.deepEqual(corrected, [5.75, 5.75, 9.5]);
  assert.deepEqual(remaining, [-3.75, 2.25, 10.5]);
  assert.deepEqual([residuals, remaining].map(gaps => mean(gaps.map(gap => gap ** 2))), [72, 43.125]);
  assert.ok(Math.abs(remaining[1]) > Math.abs(residuals[1]));
  assert.ok(heightAt(corrected[1]) > heightAt(initial[1]));
  assert.ok(heightAt(corrected[2]) < heightAt(initial[2]));
}

export default { title: 'Why did the middle mark move down?', beats, draw, check };
