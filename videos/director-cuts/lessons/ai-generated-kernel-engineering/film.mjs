import assert from 'node:assert/strict';

const row = [1, 2, 3, 4, 5];
const width = 8;
const epsilon = 1e-5;
const feature = row.length - 1;

// A single tile, with unit feature weights. Only active lanes read input memory.
function runTile(input, fill) {
  const reads = [];
  const lanes = Array.from({ length: width }, (_, i) => {
    if (i >= input.length) return fill;
    reads.push(i);
    return input[i];
  });
  const sum = lanes.reduce((total, x) => total + x * x, 0);
  const mean = sum / input.length;
  const output = input.map(x => x / Math.sqrt(mean + epsilon));
  return { reads, lanes, sum, mean, output };
}

const wrong = runTile(row, 1);
const fixed = runTile(row, 0);
const expectedMean = row.reduce((s, x) => s + x * x, 0) / row.length;
const reference = row.map(x => x / Math.sqrt(expectedMean + epsilon));
const units = wrong.lanes.flatMap((side, lane) =>
  Array.from({ length: side * side }, (_, i) => ({
    lane, side, column: i % side, level: Math.floor(i / side), padding: lane >= row.length,
  })),
);

function check() {
  assert.deepEqual(wrong.reads, [0, 1, 2, 3, 4]);
  assert.deepEqual(fixed.reads, wrong.reads);
  assert.deepEqual(wrong.lanes, [1, 2, 3, 4, 5, 1, 1, 1]);
  assert.deepEqual(fixed.lanes, [1, 2, 3, 4, 5, 0, 0, 0]);
  assert.equal(units.length, wrong.sum);
  assert.equal(units.filter(unit => !unit.padding).length, fixed.sum);
  assert.deepEqual([wrong.sum, fixed.sum, wrong.mean, fixed.mean], [58, 55, 11.6, 11]);
  assert.deepEqual(fixed.output, reference);
  assert.deepEqual([wrong, fixed].map(t => t.output[feature].toFixed(3)), ['1.468', '1.508']);
  assert(wrong.output.every((value, i) => value < reference[i]));
  const full = Array.from({ length: width }, (_, i) => i + 1);
  assert.deepEqual(runTile(full, 1), runTile(full, 0));
}

const beats = [
  {
    id: 'three-squares',
    say: 'Watch the end of the blue block. This generated kernel is adding up squares for a row of five numbers. Where did those three extra squares come from?',
    hold: 1.5,
  },
  {
    id: 'five-reads',
    say: 'Follow the five reads from memory. The kernel copies these values into a tile with eight slots. Its load mask stops the reads at the end of the row. Watch the slots on the right.',
    hold: 1.0,
  },
  {
    id: 'the-fill',
    say: 'Each of those slots got a one from the fill value in the generated code. Square all eight values. Five makes a block of twenty-five. Each of the three ones leaves a single square.',
    hold: 1.0,
  },
  {
    id: 'five-high',
    say: 'Stack the squares five high, since there are five values in the input. Each full stack adds one to the mean square. The blue squares make eleven stacks. The orange squares add another three fifths.',
    hold: 1.3,
  },
  {
    id: 'one-output',
    say: 'Follow the last input, five. Its weight is one. Root mean square normalization divides five by the square root of the mean square plus a small epsilon. Mark the reference output. Where will the kernel land with its larger divisor?',
    hold: 1.1,
  },
  {
    id: 'zero-fill',
    say: 'Keep the five reads. Change the fill to zero. The mean square falls back to eleven, and the last output meets the reference. A full tile would never use that fill. Keep the short row as a test.',
    hold: 2.8,
  },
];

const ink = '#18264e';
const muted = '#535c72';
const blue = '#264bba';
const red = '#b14124';
const paper = '#f9f4e8';
const blues = ['#2e54c2', '#2b50ba', '#294db1', '#365bc7', '#2b50b9', '#3255bb'];
const oranges = ['#ee6941', '#eb7046', '#ed633e'];
const limit = n => Math.max(0, Math.min(1, n));
const ease = n => { const t = limit(n); return t * t * (3 - 2 * t); };
const mix = (a, b, amount) => a + (b - a) * amount;
const laneX = i => 237 + 204 * i;
const stack = { x: 194, floor: 754, step: 84 };
const smallStack = { x: 146, floor: 708, step: 58 };

function word(ctx, value, x, y, size, options = {}) {
  const { color = ink, face = 'Sans', align = 'left', weight = 400 } = options;
  ctx.font = `${weight} ${size}px "Lesson ${face}"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(value), x, y);
}

function rule(ctx, x, y, endX, endY, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function bracket(ctx, x, end, y, label) {
  rule(ctx, x, y, end, y, muted);
  rule(ctx, x, y, x, y + 12, muted);
  rule(ctx, end, y, end, y + 12, muted);
  word(ctx, label, (x + end) / 2, y - 18, 34, { align: 'center', color: muted });
}

// A little paper tooth under two inks. Fixed coordinates keep the grain still.
const fibers = Array.from({ length: 1150 }, (_, i) => {
  const hash = Math.imul(i + 1, 0x45d9f3b) ^ Math.imul(i + 9, 0x119de1f3) >>> 7;
  return { x: (hash >>> 0) % 1920, y: ((Math.imul(hash, 7919) >>> 0) % 1080) };
});

function ground(ctx) {
  const wash = ctx.createLinearGradient(0, 0, 1490, 1080);
  wash.addColorStop(0, '#fffbef');
  wash.addColorStop(.65, paper);
  wash.addColorStop(1, '#eae7dd');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.fillStyle = '#4c50650a';
  for (const { x, y } of fibers) ctx.fillRect(x, y, 2 + (x % 6), 1);
}

function heading(ctx, title) {
  word(ctx, title, 132, 166, 87, { face: 'Serif' });
}

function under(ctx, alpha, paint) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= limit(alpha);
  paint();
  ctx.restore();
}

// A blue unit has a solid face. The orange fill has a diagonal cut as a second cue.
function stamp(ctx, x, y, step, padding, id) {
  const size = step * .945;
  const left = x + (step - size) / 2;
  const top = y + (step - size) / 2;
  ctx.fillStyle = padding ? '#973f26' : '#1b3582';
  ctx.fillRect(left + step * .029, top + step * .056, size, size);
  ctx.fillStyle = padding ? oranges[id % oranges.length] : blues[id % blues.length];
  ctx.fillRect(left, top, size, size);
  ctx.fillStyle = '#ffffff33';
  ctx.fillRect(left + 1, top + 1, size - 2, Math.max(1, step * .042));
  // Short swipes of the same ink leave visible edges on each unit when the pieces gather.
  ctx.fillStyle = '#ffffff0e';
  ctx.fillRect(left + size * .09, top + size * .12, size * (.35 + (id % 5) * .035), size * .025);
  ctx.fillRect(left + size * .1, top + size * .19, size * .21, size * .018);
  if (padding) {
    rule(ctx, left + size * .27, top + size * .73,
      left + size * .73, top + size * .27, '#fff0cf', Math.max(2, step * .085));
  }
}

function inSquare(unit) {
  const step = 35;
  return {
    x: laneX(unit.lane) + (unit.column - unit.side / 2) * step,
    y: 756 - (unit.level + 1) * step,
    step,
  };
}

function inStack(i, grid) {
  return {
    x: grid.x + Math.floor(i / row.length) * grid.step,
    y: grid.floor - (i % row.length + 1) * grid.step,
    step: grid.step,
  };
}

function between(a, b, p) {
  return { x: mix(a.x, b.x, p), y: mix(a.y, b.y, p), step: mix(a.step, b.step, p) };
}

function impression(ctx, unit, i, point) {
  stamp(ctx, point.x, point.y, point.step, unit.padding, i);
}

function opening(ctx, clock) {
  heading(ctx, 'Sum of squares');
  word(ctx, 'RMS normalization', 138, 226, 39, { color: muted });
  let landed = 0;
  for (const [i, unit] of units.entries()) {
    const p = unit.padding ? ease((clock.elapsed + .2 - .54 * (i - fixed.sum)) / 1.15) : 1;
    const point = inStack(i, stack);
    if (unit.padding && p > .993) landed++;
    point.x += (1 - p) * (240 + (i - fixed.sum) * 53);
    point.y -= (1 - p) * 130 + Math.sin(Math.PI * p) * 65;
    impression(ctx, unit, i, point);
  }
  const end = stack.x + stack.step * fixed.mean;
  rule(ctx, stack.x, 791, end, 791, muted);
  rule(ctx, end, 779, end, 801, muted);
  word(ctx, `Reference sum  ${fixed.sum}`, stack.x, 850, 41, { color: muted });
  word(ctx, 'Kernel sum', 1510, 491, 43, { align: 'center' });
  word(ctx, fixed.sum + landed, 1510, 651, 171, { face: 'Mono', align: 'center' });
}

function valueType(ctx, value, x, y, padding) {
  word(ctx, value, x, y, 74, {
    face: 'Mono', align: 'center', weight: 600, color: padding ? red : blue,
  });
}

function loadAndSquare(ctx, clock) {
  const loading = clock.index === 1;
  const lift = loading ? 0 : ease(clock.reveal('Square all eight values', 1.2));
  const copy = loading ? clock.reveal('The kernel copies', 1.65) : 1;
  const fill = loading ? clock.reveal('Watch the slots', .95) : 1;
  under(ctx, limit(1 - 2 * lift), () => heading(ctx, 'A masked load'));
  under(ctx, limit(2 * lift - 1), () => heading(ctx, 'Square each slot'));
  const y = mix(634, 336, lift);
  const boundary = (laneX(4) + laneX(5)) / 2;

  under(ctx, limit(1 - 2 * lift), () => {
    bracket(ctx, laneX(0) - 98, boundary - 3, 295, 'Input memory');
    for (const [i, value] of row.entries()) {
      const x = laneX(i) - 99;
      ctx.fillStyle = '#e0e4e8';
      ctx.fillRect(x, 317, 198, 115);
      rule(ctx, x, 432, x + 198, 432, ink, 4);
      valueType(ctx, value, laneX(i), 400, false);
    }
    rule(ctx, boundary, 306, boundary, 452, ink, 5);
    word(ctx, '8-slot tile', laneX(0) - 95, 595, 39, { color: muted });
  });
  under(ctx, limit(2 * lift - 1), () => {
    bracket(ctx, laneX(0) - 92, boundary - 11, 300, 'From the row');
    bracket(ctx, boundary + 11, laneX(7) + 92, 300, 'Masked fill');
  });

  for (const [i, value] of wrong.lanes.entries()) {
    const x = laneX(i);
    const padding = i >= row.length;
    ctx.fillStyle = padding ? '#efded1' : '#e2e5ef';
    ctx.fillRect(x - 97, y, 194, 111);
    rule(ctx, x - 97, y + 111, x + 97, y + 111, padding ? red : blue, 4);
    const p = ease(padding ? fill * 1.4 - (i - row.length) * .18 : copy * 1.6 - i * .14);
    if (!padding && p > 0 && p < 1) {
      rule(ctx, x, 441, x, mix(441, y + 14, p), '#6776ab', 3);
    }
    under(ctx, Math.min(1, p * 5), () => {
      const baseline = padding ? y + 81 : mix(400, y + 81, p);
      valueType(ctx, value, x, baseline, padding);
    });
  }
  under(ctx, (1 - lift) * fill, () => {
    word(ctx, 'Masked fill = 1', laneX(6), 842, 43, { align: 'center', color: red });
  });

  for (const [i, unit] of units.entries()) {
    const p = ease((lift - .16 - unit.level * .035) / .69);
    if (!p) continue;
    const dest = inSquare(unit);
    const point = between({ x: laneX(unit.lane) - 6, y: 452, step: 12 }, dest, p);
    under(ctx, p, () => impression(ctx, unit, i, point));
  }
  under(ctx, lift, () => {
    for (const [i, value] of wrong.lanes.entries()) {
      word(ctx, value * value, laneX(i), 822, 42, {
        face: 'Mono', align: 'center', color: i >= row.length ? red : blue,
      });
    }
  });
}

function gather(ctx, clock) {
  const progress = clock.reveal('Stack the squares', 2.9);
  const includeTail = clock.reveal('The orange squares', 1.2);
  const count = fixed.sum + Math.min(3, Math.floor(includeTail * 3 + 1e-9));
  heading(ctx, 'Divide by the row width');
  for (const [i, unit] of units.entries()) {
    const order = unit.padding ? i - fixed.sum : i / (fixed.sum - 1);
    const p = unit.padding
      ? ease(3 * includeTail - order)
      : ease(progress * 1.5 - .5 * order);
    const point = between(inSquare(unit), inStack(i, stack), p);
    point.y -= Math.sin(p * Math.PI) * (64 + 14 * unit.lane);
    impression(ctx, unit, i, point);
  }
  under(ctx, ease((progress - .62) / .38), () => {
    const top = stack.floor - row.length * stack.step;
    const left = stack.x - 28;
    rule(ctx, left, top, left, stack.floor, ink);
    rule(ctx, left, top, left + 13, top, ink);
    rule(ctx, left, stack.floor, left + 13, stack.floor, ink);
    word(ctx, row.length, left - 20, (top + stack.floor) / 2 + 19, 56, { face: 'Mono', align: 'right' });
    word(ctx, 'Mean square', 1522, 352, 43, { align: 'center' });
    word(ctx, `${count} ÷ ${row.length}`, 1522, 439, 66, { face: 'Mono', align: 'center' });
    rule(ctx, 1364, 473, 1680, 473, '#999eab');
    word(ctx, (count / row.length).toFixed(1), 1522, 599, 117, { face: 'Mono', align: 'center' });
  });
}

const axis = { left: 1037, right: 1768, y: 617, min: 1.45, max: 1.53 };
const axisX = v => mix(axis.left, axis.right, (v - axis.min) / (axis.max - axis.min));

function outputScale(ctx, refAlpha, kernelAlpha, move, repaired) {
  const refX = axisX(reference[feature]);
  const kx = mix(axisX(wrong.output[feature]), refX, move);
  rule(ctx, axis.left, axis.y, axis.right, axis.y, ink, 4);
  for (let i = 0; i <= 8; i++) {
    const x = mix(axis.left, axis.right, i / 8);
    rule(ctx, x, axis.y - 7, x, axis.y + 7, muted);
  }
  for (const edge of [axis.min, axis.max])
    word(ctx, edge.toFixed(2), axisX(edge), axis.y + 48, 30, { face: 'Mono', align: 'center', color: muted });

  const centered = { align: 'center' };
  under(ctx, refAlpha, () => {
    word(ctx, 'Reference', refX, 473, 40, { ...centered, color: blue });
    word(ctx, reference[feature].toFixed(3), refX, 539, 71, { ...centered, face: 'Mono', color: blue });
    rule(ctx, refX, 558, refX, axis.y, blue, 5);
    ctx.fillStyle = paper;
    ctx.strokeStyle = blue;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(refX, axis.y, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  });

  if (!kernelAlpha) return;
  ctx.save();
  ctx.globalAlpha *= kernelAlpha;
  const color = repaired ? blue : red;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(kx, axis.y + 2);
  ctx.lineTo(kx - 13, axis.y + 23);
  ctx.lineTo(kx + 13, axis.y + 23);
  ctx.closePath();
  ctx.fill();
  rule(ctx, kx, axis.y + 19, kx, 689, color, 4);
  // Only the endpoints of the moving pointer represent computed outputs.
  const readable = move === 0 || move === 1;
  if (readable) word(ctx, (repaired ? fixed : wrong).output[feature].toFixed(3), kx, 758, 64, {
    ...centered, face: 'Mono', color,
  });
  word(ctx, 'Kernel', kx, 812, 40, { ...centered, color });
  ctx.restore();
}

function output(ctx, clock) {
  const correcting = clock.index === 5;
  const zoom = correcting ? 1 : ease(clock.reveal('Follow the last input', 1.6));
  const erase = correcting ? ease(clock.reveal('Change the fill to zero', .8)) : 0;
  const marker = ease((erase - .46) / .54);
  const result = erase === 1 ? fixed : wrong;
  heading(ctx, 'Normalize the last feature');
  for (const [i, unit] of units.entries()) {
    const point = between(inStack(i, stack), inStack(i, smallStack), zoom);
    under(ctx, unit.padding ? 1 - erase : 1, () => impression(ctx, unit, i, point));
  }
  under(ctx, zoom, () => {
    word(ctx, `Masked fill = ${result.lanes.at(-1)}`, smallStack.x, 354, 42, { face: 'Mono', color: erase === 1 ? ink : red });
    word(ctx, 'Mean square', smallStack.x, 799, 35, { color: muted });
    word(ctx, `${result.sum} ÷ ${row.length} = ${result.mean}`, smallStack.x, 870, 67, { face: 'Mono' });
    const refAlpha = correcting ? 1 : clock.reveal('Mark the reference output', .5);
    const kernelAlpha = correcting ? 1 : clock.reveal('larger divisor', .5);
    let denominatorTerm = 'mean square';
    if (refAlpha > 0) denominatorTerm = expectedMean;
    if (kernelAlpha > 0) denominatorTerm = result.mean;
    word(ctx, `${row[feature]} / √(${denominatorTerm} + ε)`, 1410, 288, 58, { face: 'Serif', align: 'center' });
    word(ctx, `weight = 1     ε = ${epsilon}`, 1410, 354, 32, {
      face: 'Mono', align: 'center', color: muted,
    });
    outputScale(ctx, refAlpha, kernelAlpha, marker, erase === 1);
  });
}

function draw(ctx, clock) {
  ground(ctx);
  if (clock.index === 0) opening(ctx, clock);
  else if (clock.index <= 2) loadAndSquare(ctx, clock);
  else if (clock.index === 3) gather(ctx, clock);
  else output(ctx, clock);
}

export default { title: 'The three extra squares in a generated RMSNorm kernel', beats, draw, check };
