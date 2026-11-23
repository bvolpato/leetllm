import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { layoutAllocation, stableSoftmax } from 'vizmatic';
import { SCORES, VALUES } from '../../../films/flash-attention/fixtures.mjs';
import { slate } from './studio.mjs';

const data = JSON.parse(readFileSync(new URL('./weighted-area-states.json', import.meta.url)));
const { old, full, oldHeight, columns } = data;
const paper = '#fbf3dd', ink = '#172b36', blue = '#2355b6', sky = '#5588da', orange = '#d65326';
const left = 188, floor = 815, unitWidth = 900, unitHeight = 14.3;
const x = mass => left + unitWidth * mass;
const y = value => floor - unitHeight * value;
const mean = full.weightedSum / full.mass;
const settledOld = data.squeeze.at(-1);
const incomingArea = columns[2] * VALUES[2];
const denominatorOnlyMean = (old.weightedSum + incomingArea) / full.mass;
const shortNumber = value => Number(value.toFixed(3)).toString();
const sample = (states, progress) => states[Math.round(progress * (states.length - 1))];
const valueColors = [sky, blue, orange];
const names = ['fix', 'this', 'test'];
const fixedColumns = layoutAllocation({
  x: left, y: floor, width: unitWidth * full.mass, height: 1, capacity: full.mass,
  parts: columns.map((value, i) => ({ id: names[i], label: names[i], value })),
}).parts;

function label(ctx, text, px, py, size, color = ink, face = 'Sans', align = 'left') {
  ctx.font = `400 ${size}px "Lesson ${face}"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, px, py);
}

function line(ctx, ax, ay, bx, by, color, width, dash = []) {
  ctx.beginPath();
  ctx.setLineDash(dash);
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.setLineDash([]);
}

function circle(ctx, cx, cy, radius, color) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function block(ctx, start, width, bottom, top, color) {
  if (width <= 0 || top <= bottom) return;
  ctx.fillStyle = color;
  ctx.fillRect(start, y(top), width, (top - bottom) * unitHeight);
}

function bracket(ctx, a, b, text, color) {
  const at = floor + 35;
  line(ctx, a + 2, at, b - 2, at, color, 3);
  line(ctx, a + 2, at - 10, a + 2, at + 10, color, 3);
  line(ctx, b - 2, at - 10, b - 2, at + 10, color, 3);
  label(ctx, text, (a + b) / 2, at + 64, 46, color, 'Mono', 'center');
}

function oldMark(ctx) {
  const level = y(oldHeight);
  line(ctx, left - 65, level, left + 4, level, blue, 6);
  circle(ctx, left - 65, level, 9, blue);
  label(ctx, oldHeight.toFixed(2), left - 18, level - 24, 43, blue, 'Mono', 'right');
}

function meanMark(ctx, value, caption, color = ink, dash = []) {
  const level = y(value), end = x(full.mass);
  line(ctx, left, level, end + 40, level, paper, 12, dash);
  line(ctx, left, level, end + 40, level, color, 5, dash);
  circle(ctx, end + 40, level, 11, color);
  label(ctx, caption, end + 63, level - 12, 49, color);
  label(ctx, value.toFixed(3), end + 60, level + 62, 59, color, 'Mono');
}

function base(ctx, headline, titleY = 145) {
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 1920, 1080);
  label(ctx, headline, 112, titleY, 86, ink, 'Serif');
  line(ctx, left - 12, floor + 2, x(full.mass) + 10, floor + 2, '#485258', 4);
}

function incomingTile(ctx, width, leveling) {
  const end = x(width);
  // The orange area that crosses the seam equals the area lost on the right.
  const reach = Math.sqrt(leveling);
  const tongue = width * unitWidth * reach;
  block(ctx, end - tongue, tongue, oldHeight, oldHeight + (mean - oldHeight) * reach, orange);
  block(ctx, end, unitWidth * columns[2], 0, VALUES[2] + (mean - VALUES[2]) * leveling, orange);
}

function denominatorOnly(ctx, clock, rewind) {
  const [, width, rescaledArea] = settledOld;
  const end = x(width);
  const resultPhrase = 'would change the blend';
  const restoreArea = rewind === 1 ? clock.reveal(resultPhrase, 1, { captionStart: false }) : 0;
  const area = rescaledArea + (old.weightedSum - rescaledArea) * restoreArea;
  base(ctx, 'What if we keep the old area?', 90);
  block(ctx, left, end - left, 0, area / width, blue);
  incomingTile(ctx, width, 1 - rewind);
  bracket(ctx, left, end, 'width ' + shortNumber(width), blue);
  bracket(ctx, end, x(full.mass), 'width ' + shortNumber(columns[2]), orange);
  meanMark(ctx, mean, 'Correct', slate, [12, 12]);
  if (rewind === 1) {
    label(
      ctx, 'area ≈ ' + shortNumber(area), (left + end) / 2, floor - 92, 46, paper, 'Mono', 'center',
    );
    label(
      ctx, 'value ' + VALUES[2], x(full.mass) - 24, y(VALUES[2]) + 62, 48, paper, 'Mono', 'right',
    );
  }
  if (restoreArea === 1 && clock.elapsed >= clock.wordCue(resultPhrase).end) {
    meanMark(ctx, denominatorOnlyMean, 'Too high');
  }
}

function rescale(ctx, clock) {
  const beat = clock.beat.id;
  const rescaling = beat === 'c06-b01', adding = beat === 'c06-b02';
  if (beat === 'c06-b03') {
    const rewind = clock.reveal('Rescaling only the denominator', 0.8);
    const returnToCorrect = clock.reveal('Different floating-point associations', 0);
    if (rewind > 0 && !returnToCorrect) {
      denominatorOnly(ctx, clock, rewind);
      return;
    }
  }
  const progress = rescaling ? clock.reveal('Multiply the saved', 3) : 1;
  const [reference, width, area] = sample(data.squeeze, progress);
  const arrival = rescaling ? 0 : adding ? clock.reveal('Add the incoming', 0.6) : 1;
  const leveling = rescaling ? 0 : adding ? clock.reveal('do we divide', 2.1) : 1;
  const dense = !rescaling && (!adding || clock.reveal('The answer matches', 0) === 1);
  const headline = rescaling ? (progress === 0 ? 'Which way will the blue edge move?' : 'The old blend stays level')
    : leveling === 0 ? 'Where will the two tiles settle?' : 'One blend for the row';
  base(ctx, headline);
  const end = x(width), originalEnd = x(old.mass);
  if (arrival < 1 && progress > 0) {
    ctx.save();
    ctx.globalAlpha = 1 - arrival;
    line(ctx, end, y(oldHeight), originalEnd, y(oldHeight), blue, 4, [11, 12]);
    line(ctx, originalEnd, y(oldHeight), originalEnd, floor, blue, 4, [11, 12]);
    ctx.restore();
  }
  block(ctx, left, end - left, 0, oldHeight, blue);
  oldMark(ctx);
  if (rescaling) {
    label(ctx, 'Reference score', left, 318, 46);
    label(ctx, shortNumber(reference), left, 406, 80, ink, 'Mono');
    label(ctx, 'Incoming score  3', x(old.mass), 318, 48, orange, 'Sans', 'right');
    label(ctx, 'area ' + shortNumber(area), (left + end) / 2, y(oldHeight / 2) + 18, 54, paper, 'Mono', 'center');
    bracket(ctx, left, end, 'width ' + shortNumber(width), blue);
    if (progress === 1) {
      const a = end + 32, b = originalEnd - 30, cy = y(oldHeight / 2);
      line(ctx, b, cy, a, cy, blue, 4);
      line(ctx, a, cy, a + 22, cy - 13, blue, 4);
      line(ctx, a, cy, a + 22, cy + 13, blue, 4);
      label(ctx, '× ' + shortNumber(width / old.mass), (a + b) / 2, cy - 25, 47, blue, 'Mono', 'center');
    }
    return;
  }
  ctx.save();
  ctx.globalAlpha = arrival;
  incomingTile(ctx, width, leveling);
  ctx.restore();
  if (leveling < 1) {
    bracket(ctx, left, end, shortNumber(width), blue);
    if (arrival === 1) bracket(ctx, end, x(full.mass), '1', orange);
  } else {
    bracket(ctx, left, x(full.mass), 'weight ' + shortNumber(full.mass), ink);
    meanMark(ctx, mean, dense ? 'Dense = tiled' : 'Row mean');
  }
}

function transfer(ctx, clock) {
  const question = clock.beat.id === 'c09-b01';
  const replace = question ? 0 : clock.reveal('replaces its contribution', 3);
  const [value, numerator, average] = sample(data.replacement, replace);
  const target = question && clock.reveal('Predict which parts', 0) === 1;
  const dense = !question && clock.reveal('still agree', 0) === 1;
  const retain = question ? 0 : clock.reveal('Temporary scores disappear', 1.6);
  const headline = question ? (target ? 'If 40 becomes 4, where is the mean?' : 'Keep the three scores fixed')
    : retain > 0 ? 'Keep the row summary' : replace === 0 ? 'If 40 becomes 4, where is the mean?' : 'The last value falls';
  base(ctx, headline);
  const values = [VALUES[0], VALUES[1], value];
  for (const [i, { bounds }] of fixedColumns.entries()) {
    // Level all columns by the same fraction to preserve their total area.
    const height = values[i] + (average - values[i]) * retain;
    block(ctx, bounds.x, bounds.width, 0, height, valueColors[i]);
    if (retain === 0) bracket(ctx, bounds.x, bounds.x + bounds.width, String(SCORES[i]), valueColors[i]);
  }
  // The dotted roof and the old mean stay in the same two places during the fall.
  if (replace > 0 && retain === 0) {
    const last = fixedColumns[2].bounds;
    line(ctx, last.x, y(VALUES[2]), last.x + last.width, y(VALUES[2]), orange, 4, [12, 12]);
    line(ctx, last.x + last.width, y(VALUES[2]), last.x + last.width, y(value), orange, 4, [12, 12]);
    line(ctx, x(full.mass) + 12, y(mean), x(full.mass) + 42, y(mean), ink, 4);
  }
  if (retain === 0) {
    label(ctx, 'Score', left - 26, floor + 95, 45, ink, 'Sans', 'right');
    label(ctx, shortNumber(value), x(full.mass) - 20, floor - 13, 45, paper, 'Mono', 'right');
  } else {
    bracket(ctx, left, x(full.mass), 'weight ' + shortNumber(full.mass), ink);
    if (retain === 1) {
      block(ctx, left, unitWidth * full.mass, 0, average, blue);
      label(ctx, 'area ' + shortNumber(numerator), x(full.mass / 2), y(average / 2) + 17, 47, paper, 'Mono', 'center');
    }
  }
  meanMark(ctx, average, dense ? 'Dense = tiled' : 'Row mean');
}

export function drawWeightedArea(ctx, clock) {
  const id = clock.beat.id;
  if (!['c06-b01', 'c06-b02', 'c06-b03', 'c09-b01', 'c09-b02'].includes(id)) return false;
  ctx.save();
  try {
    if (id.startsWith('c06')) rescale(ctx, clock);
    else transfer(ctx, clock);
  } finally {
    ctx.restore();
  }
  return true;
}

export function checkWeightedArea() {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} differs from ${b}`);
  const probabilities = stableSoftmax(SCORES);
  assert.deepEqual(VALUES, [10, 20, 40]);
  assert.deepEqual(SCORES, [1, 2, 3]);
  assert.equal(data.squeeze.length, 91);
  assert.equal(data.replacement.length, 91);
  for (const [reference, width, area] of data.squeeze) {
    close(width, Math.exp(1 - reference) + Math.exp(2 - reference));
    close(area, width * oldHeight);
  }
  close(oldHeight, (10 * Math.exp(-1) + 20) / (Math.exp(-1) + 1));
  close(settledOld[1], columns[0] + columns[1]);
  for (const [i, weight] of columns.entries()) close(weight / full.mass, probabilities[i]);
  close(full.weightedSum, settledOld[2] + incomingArea);
  assert.ok(mean < VALUES[2]);
  assert.ok(denominatorOnlyMean > Math.max(...VALUES));
  for (const [value, numerator, average] of data.replacement) {
    close(average, probabilities[0] * VALUES[0] + probabilities[1] * VALUES[1] + probabilities[2] * value);
    close(numerator, full.mass * average);
  }
  close(mean, data.replacement[0][2]);
  assert.equal(data.replacement.at(-1)[0], 4);
  return true;
}
