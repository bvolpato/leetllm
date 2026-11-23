import assert from 'node:assert/strict';

const title = 'The rest at the end of the roll';

const beats = [
  {
    id: 'cut',
    say: 'Follow that loose piece of paper. Both music rolls play a single note and then a chord. Which roll gives the reader a beat of silence?',
    hold: 1.6,
  },
  {
    id: 'punches',
    say: 'Look across the width of the paper. Each lane is a pitch. The single hole fills one of five lanes, so the input is one fifth. The chord fills four of the five.',
    hold: 0.9,
  },
  {
    id: 'reader',
    say: 'Start both readers with a hidden state of zero. Read the first note. This little recurrent neural network weights the input, adds half its previous state, and applies tanh.',
    hold: 0.8,
  },
  {
    id: 'chord',
    say: 'Here comes the chord. This time the state from the single note goes back in with the new input. Both readers reach about point six two.',
    hold: 1.35,
  },
  {
    id: 'batch',
    say: 'Look at the third beat. The upper roll has paper here, with zero holes. To batch the rolls together, fill the empty slot below with a zero too. Should both readers advance?',
    hold: 1.8,
  },
  {
    id: 'rest',
    say: 'Follow the red marks. The rest gives the upper reader one more update. Half the old state goes into tanh, leaving about point three. The lower roll ended at the chord.',
    hold: 1.25,
  },
  {
    id: 'edge',
    say: 'Keep an eye on the lower mark as the padding changes. Still point six two. The length of each roll tells you where to read its final state.',
    hold: 2.7,
  },
];

// A column of holes is a chord. A blank column on paper is a real observation.
const pitchCount = 5;
const note = [3];
const chord = [0, 1, 3, 4];
const rolls = [[note, chord, []], [note, chord]];
const inputAt = (holes) => holes.length / pitchCount;
const update = (previous, input) => Math.tanh(0.8 * input + 0.5 * previous);

function statesAtLength(row, length) {
  const states = [0];
  for (const input of row.slice(0, length)) states.push(update(states.at(-1), input));
  return states;
}

const inputs = rolls.map((roll) => roll.map(inputAt));
const traces = inputs.map((row) => statesAtLength(row, row.length));
function check() {
  assert.deepEqual(inputs, [[0.2, 0.8, 0], [0.2, 0.8]]);
  for (const roll of rolls) {
    for (const column of roll) {
      assert.equal(new Set(column).size, column.length);
      assert.ok(column.every((lane) => Number.isInteger(lane) && lane >= 0 && lane < pitchCount));
    }
  }
  assert.deepEqual(traces[0].map((h) => h.toFixed(3)), ['0.000', '0.159', '0.616', '0.299']);
  assert.equal(traces[0][2], traces[1].at(-1));
  assert.equal(traces[0].at(-1), update(traces[1].at(-1), 0));
  for (const filler of [0, 0.9]) {
    const batched = [...inputs[1], filler];
    assert.deepEqual(statesAtLength(batched, rolls[1].length), traces[1]);
    assert.notEqual(statesAtLength(batched, batched.length).at(-1), traces[1].at(-1));
  }
  return true;
}

const start = 349;
const measure = 448;
const paperHeight = 216;
const tops = [219, 647];
const edge = (count) => start + count * measure;
const center = (column) => edge(column + 0.5);
const laneY = (top, lane) => top + 38 + lane * 35;
const ink = '#182a56';
const red = '#952a29';
const ground = '#a6bbe8';

function smooth(value) {
  const p = Math.max(0, Math.min(1, value));
  return p * p * (3 - 2 * p);
}

function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function text(ctx, value, x, y, size, color = ink, family = 'Lesson Sans', align = 'left', weight = 400) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = `${weight} ${size}px "${family}"`;
  ctx.fillText(value, x, y);
}

function polygon(ctx, points, fill) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// Fixed flecks give the work surface and the roll stock different grains.
let seed = 139;
function random() {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return seed / 4294967296;
}
const fibers = Array.from({ length: 220 }, () => [random(), random(), random()]);

function workSurface(ctx) {
  const light = ctx.createLinearGradient(0, 30, 1800, 1090);
  light.addColorStop(0, '#c1cff0');
  light.addColorStop(0.57, ground);
  light.addColorStop(1, '#8da6d6');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
  for (const [u, v, d] of fibers) {
    line(ctx, u * 1920, v * 1080, u * 1920 + 3 + d * 14, v * 1080 - d, '#36406116', 1.3);
  }
}

function paper(ctx, left, right, top) {
  const bottom = top + paperHeight;
  ctx.save();
  ctx.shadowColor = '#27345657';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 12;
  const sheet = ctx.createLinearGradient(left, top, right, bottom + 240);
  sheet.addColorStop(0, '#eccc95');
  sheet.addColorStop(0.27, '#ffe4ad');
  sheet.addColorStop(0.76, '#ffe6b7');
  sheet.addColorStop(1, '#f4d59b');
  ctx.fillStyle = sheet;
  ctx.fillRect(left, top, right - left, paperHeight);
  ctx.restore();
  line(ctx, left, top + 1, right, top + 1, '#fff3d1', 3);
  line(ctx, left, bottom - 1, right, bottom - 1, '#ba965b', 2);
  for (const [u, v, d] of fibers) {
    const x = left + u * (right - left);
    const y = top + 3 + v * (paperHeight - 6);
    line(ctx, x, y, Math.min(right, x + d * 13), y + 0.5, '#75512120', 1);
  }
  for (let lane = 0; lane < pitchCount; lane++) {
    const y = laneY(top, lane);
    line(ctx, left, y, right, y, '#946e413d', 2);
  }
  for (let n = 0; n <= 3; n++) {
    const x = edge(n);
    if (x > left && x < right) {
      line(ctx, x, top + 4, x, top + 21, '#b18d57', 3);
      line(ctx, x, bottom - 22, x, bottom - 5, '#b18d57', 3);
    }
  }
}

function winding(ctx, top, run) {
  const x = 196, rx = 72, ry = 25, bottom = top + paperHeight;
  // The oval end exposes the wound layers. The leader leaves underneath the roll.
  const under = ctx.createLinearGradient(x + 50, 0, x + 133, 0);
  under.addColorStop(0, '#634c3477');
  under.addColorStop(1, '#705b3a00');
  ctx.fillStyle = under;
  ctx.fillRect(x + 50, top, 84, paperHeight);
  const cylinder = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
  for (const [at, color] of [[0, '#b2905d'], [0.21, '#f0d39e'], [0.56, '#ffe9bc'], [0.77, '#f2d399'], [1, '#a58050']]) {
    cylinder.addColorStop(at, color);
  }
  ctx.fillStyle = cylinder;
  ctx.beginPath();
  ctx.moveTo(x - rx, top);
  ctx.lineTo(x - rx, bottom);
  ctx.ellipse(x, bottom, rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(x + rx, top);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, top, rx, ry, 0, 0, 2 * Math.PI);
  ctx.fillStyle = '#efcd94';
  ctx.fill();
  for (let radius = rx - 2; radius > 19; radius -= 5) {
    ctx.beginPath();
    ctx.ellipse(x, top, radius, radius * ry / rx, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#977244a8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(x, top, 18, 7, 0, 0, 2 * Math.PI);
  ctx.fillStyle = '#574636';
  ctx.fill();
  text(ctx, run, x, top + 137, 69, '#695235', 'Lesson Serif', 'center');
}

function punch(ctx, x, y) {
  // A beveled cut shows the blue surface and a narrow shadow below the paper.
  const w = 102, h = 24, left = x - w / 2, top = y - h / 2;
  const cut = ctx.createLinearGradient(0, top, 0, top + h);
  cut.addColorStop(0, '#324268');
  cut.addColorStop(0.28, '#5f739c');
  cut.addColorStop(0.55, '#94abd6');
  cut.addColorStop(1, ground);
  polygon(ctx, [[left + 4, top], [left + w, top], [left + w, top + h - 3],
    [left + w - 4, top + h], [left, top + h], [left, top + 3]], cut);
  line(ctx, left + 1, top + h + 1, left + w - 4, top + h + 1, '#fff3cf', 2.5);
}

function musicRoll(ctx, index) {
  const top = tops[index], roll = rolls[index];
  paper(ctx, 196, edge(roll.length), top);
  roll.forEach((holes, col) => {
    for (const lane of holes) punch(ctx, center(col), laneY(top, lane));
  });
  winding(ctx, top, index === 0 ? 'A' : 'B');
}

function offcut(ctx, elapsed) {
  const p = smooth(elapsed / 2.6);
  if (p === 1) return;
  const top = tops[1];
  ctx.save();
  ctx.translate(edge(2) + 7 + 665 * p, top + 12 + 190 * p);
  ctx.rotate(0.024 + 0.26 * p);
  ctx.shadowColor = '#17285150';
  ctx.shadowOffsetY = 12 + p * 23;
  ctx.shadowBlur = 12 + p * 22;
  paper(ctx, 0, measure, 0);
  ctx.restore();
}

function filler(ctx, alpha, value) {
  if (alpha === 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const x = edge(2) + 18, y = tops[1] + 6, w = measure - 18, h = paperHeight - 12;
  ctx.strokeStyle = '#4c6388';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([11, 10]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.rect(x + 3, y + 3, w - 6, h - 6);
  ctx.clip();
  for (let d = -h; d < w; d += 24) {
    line(ctx, x + d, y + h, x + d + h, y, '#32446921', 2);
  }
  text(ctx, value, x + w / 2, y + 98, 62, ink, 'Lesson Mono', 'center');
  text(ctx, 'padding', x + w / 2, y + 153, 39, ink, 'Lesson Sans', 'center', 600);
  ctx.restore();
}

function readMark(ctx, row, position, alpha) {
  const top = tops[row], x = edge(position);
  const observed = Math.min(rolls[row].length, Math.floor(position + 1e-8));
  const state = traces[row][observed];
  ctx.save();
  ctx.globalAlpha = alpha;
  // The number changes only on a completed beat. The cursor travels continuously.
  line(ctx, x, top - 5, x, top + paperHeight + 26, '#fff2ce', 8);
  line(ctx, x, top - 5, x, top + paperHeight + 26, red, 4);
  polygon(ctx, [[x - 13, top - 18], [x + 13, top - 18], [x, top - 1]], red);
  polygon(ctx, [[x - 10, top + paperHeight + 28], [x + 10, top + paperHeight + 28], [x, top + paperHeight + 17]], red);
  text(ctx, 'h = ' + state.toFixed(3), x, top + paperHeight + 88, 54, '#762321', 'Lesson Mono', 'center');
  ctx.restore();
}

// Follow the loose end, then move close enough to count all five pitch lanes.
// Each move ends at the starting camera position of the following beat.
function camera(clock) {
  const { index, reveal } = clock;
  const chordFraming = center(0) + 0.63 * measure;
  if (index === 0) {
    const close = 1 - smooth(reveal('Both music rolls', 1.25));
    return [1 + 0.35 * close, 960 + 183 * close, 540 + 25 * close];
  }
  if (index === 1) {
    const close = smooth(reveal('Look across the width', 1.4));
    const pan = smooth(reveal('The chord fills', 1.35));
    const target = center(0) + (chordFraming - center(0)) * pan;
    return [1 + 0.94 * close, 960 + (target - 960) * close, 540 - 208 * close];
  }
  if (index === 2) {
    const close = 1 - smooth(reveal('Start both readers', 1.35));
    return [1 + 0.94 * close, 960 + (chordFraming - 960) * close, 540 - 208 * close];
  }
  return [1, 960, 540];
}

function draw(ctx, clock) {
  const [zoom, x, y] = camera(clock);
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.translate(-x, -y);
  drawTable(ctx, clock);
  ctx.restore();
}

function drawTable(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  workSurface(ctx);
  musicRoll(ctx, 0);
  musicRoll(ctx, 1);
  if (index === 0) offcut(ctx, elapsed);

  if (index === 0) {
    ctx.save();
    ctx.globalAlpha = reveal('Both music rolls', 1.4);
    text(ctx, 'Which roll has the rest?', 117, 105, 72, ink, 'Lesson Serif');
    ctx.restore();
  } else if (index >= 2) {
    ctx.save();
    ctx.globalAlpha = index === 2 ? smooth((reveal('Start both readers', 1.65) - 0.65) / 0.35) : 1;
    text(ctx, 'h = tanh(0.8 × input + 0.5 × old h)', 118, 104, 55, ink, 'Lesson Mono');
    ctx.restore();
  }

  const firstInput = index > 1 ? 1 : index === 1 ? reveal('The single hole') : 0;
  const secondInput = index > 1 ? 1 : index === 1 ? reveal('The chord fills') : 0;
  const restInput = index > 4 ? 1 : index === 4 ? reveal('Look at the third beat') : 0;
  for (const [col, alpha] of [firstInput, secondInput, restInput].entries()) {
    if (!alpha) continue;
    ctx.save();
    ctx.globalAlpha = alpha;
    let label = col === 2 ? '0  ·  rest' : inputs[0][col].toFixed(1);
    if (index === 1 && col < 2) label = rolls[0][col].length + '/5 = ' + label;
    text(ctx, label, center(col), tops[0] - 32, 43, ink, 'Lesson Mono', 'center');
    ctx.restore();
  }

  if (index < 2) return;
  const readerAlpha = index === 2 ? smooth((reveal('Start both readers', 1.45) - 0.58) / 0.42) : 1;
  let sharedPosition = 2;
  if (index === 2) sharedPosition = smooth(reveal('Read the first note', 1.3));
  if (index === 3) sharedPosition = 1 + smooth(reveal('Here comes the chord', 1.55));
  const lastStep = index > 5 ? 1 : index === 5 ? smooth(reveal('Follow the red marks', 1.6)) : 0;
  const fillerAlpha = index > 4 ? 1 : index === 4 ? reveal('fill the empty slot') : 0;
  const changed = index === 6 && reveal('as the padding changes', 0.45) === 1;
  filler(ctx, fillerAlpha, changed ? '0.9' : '0');
  readMark(ctx, 0, sharedPosition + lastStep, readerAlpha);
  readMark(ctx, 1, sharedPosition, readerAlpha);
}

export default { title, beats, draw, check };
