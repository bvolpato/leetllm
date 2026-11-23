import { freshMpsFixture } from '../../../films/mps-metal-mac-ml-training/arithmetic.mjs';
import { classNames } from '../../../films/mps-metal-mac-ml-training/fixtures.mjs';

const title = 'Which copy gets the ticket?';

const beats = [
  {
    id: 'correction',
    say: 'Someone just corrected a support ticket. The six on the CPU strip became minus twenty-one. Look one row down. Which number will the classifier read?',
    hold: 1.5,
  },
  {
    id: 'read-the-strip',
    say: 'Follow the reader across the strip named batch. It picked up the six. The average is still three and a half. Billing gets the ticket again.',
    hold: 1.1,
  },
  {
    id: 'two-tensors',
    say: 'Here’s how the six got there. Earlier, this CPU tensor held our ticket. The CPU and GPU on this Mac share a pool of physical memory. When we copied source to MPS, the Apple GPU device in PyTorch, we got a separate tensor. We named that copy batch.',
    hold: 0.8,
  },
  {
    id: 'change-the-copy',
    say: 'The correction is up here in source. Copy the corrected tensor to MPS again, and keep what the call returns. Now batch points to a fresh copy. Look at its last number.',
    hold: 1.2,
  },
  {
    id: 'read-again',
    say: 'Run the same classifier. These six numbers add up to minus six. Their average is minus one. Billing gets the average, Delivery gets zero, and Login gets the opposite of the average. Which score wins?',
    hold: 1.3,
  },
  {
    id: 'destination',
    say: 'Login takes the ticket. The weights stayed the same. What changed was the copy under the reader.',
    hold: 2.8,
  },
];

const fixture = freshMpsFixture();
const correction = -21;
const cpu = { device: fixture.sourceDevice, values: [...fixture.positions] };

function place(source, edition) {
  return { device: fixture.returnedDevice, values: [...source.values], edition };
}

function classify(batch) {
  const sum = batch.values.reduce((a, b) => a + b, 0);
  const mean = sum / batch.values.length;
  const scores = fixture.weights.map((weight, i) => weight * mean + fixture.biases[i]);
  return { sum, mean, scores, winner: scores.indexOf(Math.max(...scores)) };
}

const firstCopy = place(cpu, 1);
const editedCpu = { ...cpu, values: cpu.values.with(-1, correction) };
const freshCopy = place(editedCpu, 2);
const firstRead = classify(firstCopy);
const freshRead = classify(freshCopy);

function check() {
  function expect(condition, message) {
    if (!condition) throw new Error(message);
  }
  const source = { device: 'cpu', values: [...fixture.positions] };
  let batch = place(source, 1);
  source.values[source.values.length - 1] = correction;
  expect(batch.device === 'mps' && batch.values.at(-1) === 6, 'The first placed tensor must retain the six.');
  expect(classify(batch).mean === 3.5 && classNames[classify(batch).winner] === 'Billing', 'Billing must win the second read of copy 1.');
  const previous = batch;
  batch = place(source, 2);
  expect(previous.values !== batch.values && source.values !== batch.values, 'Each device-changing copy has its own storage.');
  expect(previous.values.at(-1) === 6 && batch.values.at(-1) === -21, 'Only the new copy includes the edit.');
  const result = classify(batch);
  expect(result.sum === -6 && result.mean === -1 && classNames[result.winner] === 'Login', 'The corrected ticket must reach Login.');
  for (const [read, expected] of [[firstRead, [3.5, 0, -3.5]], [freshRead, [-1, 0, 1]]]) {
    expect(read.scores.every((score, i) => score === expected[i]), 'The displayed class scores must match the fixture.');
  }
  return true;
}

const clamp = p => Math.max(0, Math.min(1, p));
const ease = p => {
  const t = clamp(p);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const printed = value => String(value).replace('-', '−');
const pi = Math.PI;

function gradient(ctx, x1, y1, x2, y2, stops) {
  const fill = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [p, color] of stops) fill.addColorStop(p, color);
  return fill;
}

function box(ctx, x, y, w, h, r, fill, line = null, width = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (line) {
    ctx.lineWidth = width;
    ctx.strokeStyle = line;
    ctx.stroke();
  }
}

function segment(ctx, x1, y1, x2, y2, ink, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = ink;
  ctx.lineWidth = width;
  ctx.stroke();
}

function dot(ctx, x, y, radius, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * pi);
  ctx.fill();
}

function type(ctx, value, x, y, size, family, color, align = 'left', weight = 400) {
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function screw(ctx, x, y, angle) {
  dot(ctx, x, y + 2, 12, '#0e211f');
  dot(ctx, x, y, 10, gradient(ctx, x - 7, y - 7, x + 7, y + 7, [[0, '#efdba3'], [0.52, '#a29368'], [1, '#574d34']]));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  segment(ctx, -6, 2, 6, 2, '#c6bb8c', 2.5);
  segment(ctx, -6, 0, 6, 0, '#494839', 3);
  ctx.restore();
}

// One continuous casting surrounds the two tape sockets. Only the lower socket has a read head.
function cabinet(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 0, 1920, 1080, [[0, '#492f32'], [.43, '#302224'], [1, '#191922']]);
  ctx.fillRect(0, 0, 1920, 1080);
  for (let i = 0; i < 88; i++) {
    const y = i * 14 - 32;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(390, y + Math.sin(i * .26) * 40, 1230, y - 25, 1920, y + 52);
    ctx.strokeStyle = i % 3 ? '#593f3826' : '#150d132e';
    ctx.lineWidth = i % 3 + 1;
    ctx.stroke();
  }
  ctx.save();
  ctx.shadowColor = '#0e0c10c9';
  ctx.shadowOffsetY = 27;
  ctx.shadowBlur = 34;
  box(ctx, 61, 95, 1798, 817, 65, '#141e1d');
  ctx.restore();
  box(ctx, 56, 78, 1808, 817, 64, gradient(ctx, 0, 78, 0, 895, [[0, '#abbb9a'], [.025, '#536f5f'], [.22, '#284b44'], [.95, '#263b36'], [1, '#122923']]));
  box(ctx, 71, 92, 1778, 779, 52, gradient(ctx, 120, 100, 1800, 860, [[0, '#547a69'], [.34, '#365e52'], [.7, '#35594e'], [1, '#284a42']]), '#738c73', 2);
  for (const [x, y, a] of [[100, 121, -.6], [1820, 121, .4], [100, 842, .8], [1820, 842, -.4]]) screw(ctx, x, y, a);
  type(ctx, 'Unified memory', 141, 166, 61, 'Serif', '#f7eed4');
  type(ctx, 'Apple silicon', 1094, 174, 33, 'Sans', '#d4dfc8', 'right');
  type(ctx, 'Ticket classifier', 1204, 166, 61, 'Serif', '#f7eed4');
  segment(ctx, 135, 211, 1115, 211, '#98b098', 2);
  segment(ctx, 1196, 211, 1786, 211, '#98b098', 2);
  segment(ctx, 1154, 129, 1154, 807, '#243e34', 4);
  segment(ctx, 1158, 129, 1158, 807, '#69826c', 2);
}

const socketX = 141, socketWidth = 964, tapeHeight = 145;
const cpuY = 328, batchY = 579;
const digitX = i => socketX + 100 + i * 153;

function socket(ctx, y) {
  box(ctx, socketX - 7, y - 8, socketWidth + 14, tapeHeight + 18, 20, '#8a9d82');
  box(ctx, socketX - 6, y - 8, socketWidth + 12, tapeHeight + 14, 19, '#263e36');
  box(ctx, socketX, y, socketWidth, tapeHeight, 13, '#101817', '#162b23', 5);
}

function roller(ctx, x, y, value, ink, nextValue = value, turn = 0) {
  const w = 131, h = 103;
  box(ctx, x - w / 2 - 3, y - 3, w + 6, h + 6, 9, '#0d1918');
  box(ctx, x - w / 2, y, w, h, 6, gradient(ctx, x, y, x, y + h, [[0, '#1b2929'], [.32, '#34413d'], [.56, '#202d29'], [1, '#101c1b']]));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - w / 2, y + 2, w, h - 4);
  ctx.clip();
  function face(number, top) {
    const corrected = number === correction;
    if (corrected) {
      ctx.fillStyle = gradient(ctx, x, top, x, top + h, [[0, '#ccb98e'], [.34, '#fff0cc'], [.68, '#f2ddb0'], [1, '#bea97d']]);
      ctx.fillRect(x - w / 2, top, w, h);
    }
    type(ctx, printed(number), x, top + h / 2 - 1, 59, 'Mono', corrected ? '#792d24' : ink, 'center');
  }
  face(value, y - h * turn);
  if (turn > 0) face(nextValue, y + h * (1 - turn));
  ctx.restore();
  segment(ctx, x - w / 2 + 2, y + h / 2 + 1, x + w / 2 - 2, y + h / 2 + 1, '#0a17184f', 1.6);
}

function tape(ctx, y, values, kind, edit = 0, read = null) {
  const cpuStrip = kind === 'cpu';
  const base = cpuStrip ? ['#e9c47e', '#a78350', '#755938'] : ['#a6c5c2', '#648c8d', '#455e60'];
  box(ctx, socketX + 6, y + 5, socketWidth - 12, tapeHeight - 11, 11,
    gradient(ctx, 0, y, 0, y + tapeHeight, [[0, base[0]], [.16, base[1]], [.84, base[1]], [1, base[2]]]));
  values.forEach((value, i) => {
    const lastCpu = cpuStrip && i === values.length - 1;
    const ink = cpuStrip ? '#f8dea6' : '#dbf8ee';
    roller(ctx, digitX(i), y + 21, value, ink, lastCpu ? correction : value, lastCpu ? edit : 0);
  });
  if (read !== null) {
    const x = lerp(digitX(0), digitX(5), read);
    ctx.fillStyle = '#f6c46f';
    ctx.beginPath();
    ctx.moveTo(x, y + 98);
    ctx.lineTo(x + 19, y + 124);
    ctx.lineTo(x - 19, y + 124);
    ctx.closePath();
    ctx.fill();
    box(ctx, x - 39, y + 123, 78, 14, 4, '#ffdea3', '#5f553b', 2);
  }
}

function bayLabel(ctx, y, name, device, edition) {
  type(ctx, name, 147, y, 49, 'Mono', '#fff3d3');
  type(ctx, device, name === 'batch' ? 335 : 353, y + 2, 34, 'Sans', '#d5e0cc');
  if (edition) type(ctx, 'Copy ' + edition, 1096, y + 2, 34, 'Sans', '#d6e7d9', 'right');
}

function bank(ctx, { edit, exchange, scan, code, firstPlacement }) {
  bayLabel(ctx, cpuY - 47, 'source', 'CPU tensor');
  socket(ctx, cpuY);
  tape(ctx, cpuY, cpu.values, 'cpu', edit);

  const replay = firstPlacement !== null;
  const edition = exchange === 0 ? firstCopy.edition : exchange === 1 ? freshCopy.edition : null;
  if (!replay || firstPlacement === 1) bayLabel(ctx, batchY - 47, 'batch', 'MPS tensor', edition);
  socket(ctx, batchY);
  ctx.save();
  ctx.beginPath();
  if (replay) {
    // Expose the new strip as it comes out from underneath its source.
    ctx.rect(socketX, cpuY + tapeHeight + 7, socketWidth, batchY - cpuY);
    ctx.clip();
    if (firstPlacement > 0) tape(ctx, lerp(cpuY, batchY, firstPlacement), firstCopy.values, 'mps');
  } else {
    ctx.roundRect(socketX + 3, batchY + 2, socketWidth - 6, tapeHeight - 4, 10);
    ctx.clip();
    // Copy 1 leaves intact as the new cartridge takes its place under the name batch.
    const pitch = tapeHeight + 26;
    if (exchange < 1) tape(ctx, batchY + pitch * exchange, firstCopy.values, 'mps', 0, scan);
    if (exchange > 0) tape(ctx, batchY - pitch * (1 - exchange), freshCopy.values, 'mps', 0, scan);
  }
  ctx.restore();

  if (code) {
    box(ctx, 143, 761, 962, 64, 9, '#1c382f', '#658773', 2);
    type(ctx, code, 624, 793, 40, 'Mono', '#f6db98', 'center');
  } else {
    type(ctx, 'One feature across six positions', 624, 793, 37, 'Serif', '#e2e8d3', 'center');
  }
}

function meter(ctx, value) {
  const x = 1199, y = 245, w = 586, h = 273;
  box(ctx, x - 6, y - 6, w + 12, h + 12, 37, gradient(ctx, x, y, x, y + h, [[0, '#a99c76'], [.5, '#706b51'], [1, '#dbcba3']]));
  box(ctx, x, y, w, h, 31, '#292d25');
  box(ctx, x + 9, y + 9, w - 18, h - 18, 23, gradient(ctx, x, y, x + 110, y + h, [[0, '#e4d3a7'], [.4, '#f7efd5'], [1, '#d3bf95']]));
  const cx = x + w / 2, cy = y + 218;
  const radius = 185;
  const angle = n => -pi / 2 + n * pi / 10.5;
  for (let i = -8; i <= 8; i++) {
    const n = i / 2, a = angle(n), major = i % 4 === 0;
    const inner = radius - (major ? 15 : 8);
    const dx = Math.cos(a), dy = Math.sin(a);
    segment(ctx, cx + dx * radius, cy + dy * radius, cx + dx * inner, cy + dy * inner, '#4d5145', major ? 4 : 2);
    if (major) {
      type(ctx, printed(n), cx + dx * (radius - 38), cy + dy * (radius - 38), 31, 'Mono', '#484a3e', 'center');
    }
  }
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 7, angle(-4), angle(4));
  ctx.strokeStyle = '#8c886b';
  ctx.lineWidth = 2;
  ctx.stroke();
  const a = angle(value), dx = Math.cos(a), dy = Math.sin(a);
  ctx.save();
  ctx.shadowColor = '#423b314d';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 5;
  ctx.beginPath();
  ctx.moveTo(cx - dy * 5 - dx * 17, cy + dx * 5 - dy * 17);
  ctx.lineTo(cx + dx * (radius - 3), cy + dy * (radius - 3));
  ctx.lineTo(cx + dy * 5 - dx * 17, cy - dx * 5 - dy * 17);
  ctx.closePath();
  ctx.fillStyle = '#a44029';
  ctx.fill();
  ctx.restore();
  dot(ctx, cx, cy, 12, '#3c463b');
  dot(ctx, cx, cy, 6, '#a19872');
  type(ctx, 'Mean', x + 72, cy + 7, 41, 'Serif', '#424d40');
}

function annunciator(ctx, read, showScores, lamps) {
  classNames.forEach((name, i) => {
    const x = 1200, y = 548 + i * 87, w = 584, h = 73;
    const lit = lamps && i === read.winner;
    box(ctx, x - 2, y - 2, w + 4, h + 6, 11, '#8c997c');
    box(ctx, x, y, w, h, 11, '#253a30');
    box(ctx, x + 5, y + 4, w - 10, h - 9, 8, lit
      ? gradient(ctx, x, y, x + w * .8, y + h, [[0, '#f4c166'], [.55, '#ffe2a5'], [1, '#ddad64']])
      : gradient(ctx, x, y, x + w, y + h, [[0, '#314139'], [1, '#25352e']]));
    const ink = lit ? '#3e311c' : '#d3dfcb';
    dot(ctx, x + 29, y + 35, 8, lit ? '#aa5329' : '#617563');
    type(ctx, name, x + 56, y + 34, 48, 'Serif', ink);
    segment(ctx, x + w - 144, y + 14, x + w - 144, y + h - 19, lit ? '#c29c64' : '#5d7063', 2);
    if (showScores) type(ctx, printed(read.scores[i]), x + w - 74, y + 35, 43, 'Mono', ink, 'center');
  });
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const edit = index === 0 ? ease(elapsed / 1.15) : index === 2 ? 0 : 1;
  let exchange = index > 3 ? 1 : 0;
  let firstPlacement = null;
  let code = null;
  let scan = null;
  let read = firstRead;
  let mean = read.mean;
  let lamps = true;
  let showScores = true;
  if (index === 1 || index === 4) {
    const progress = clamp(elapsed / 2.65);
    scan = progress < 1 ? progress : null;
    lamps = showScores = progress === 1;
    if (index === 4) {
      read = freshRead;
      const settle = ease((elapsed - 2.1) / 1.2);
      mean = lerp(firstRead.mean, freshRead.mean, settle);
      showScores = elapsed >= 3.35;
      lamps = elapsed >= clock.speechDuration + .35;
    }
  }
  if (index === 2) {
    firstPlacement = ease(reveal('When we copied source', 2.2));
    code = firstPlacement > 0 ? 'batch = source.to("mps")' : 'First placement';
  }
  if (index === 3) {
    code = 'batch = source.to("mps")';
    exchange = ease(reveal('Copy the corrected tensor', 1.6));
  }
  if (index === 5) {
    read = freshRead;
    mean = freshRead.mean;
  }

  ctx.save();
  // Start on the two physical strips. Pull back to include the destination when it becomes the question.
  if (index === 0 || index === 2) {
    const close = index === 2 ? 1 : 1 - ease(reveal('Look one row down', 1.8));
    const scale = lerp(1, 1.82, close);
    ctx.translate(960, 540);
    ctx.scale(scale, scale);
    ctx.translate(-lerp(960, 610, close), -lerp(540, 527, close));
  }
  cabinet(ctx);
  bank(ctx, { edit, exchange, scan, code, firstPlacement });
  meter(ctx, mean);
  annunciator(ctx, read, showScores, lamps);
  ctx.restore();
}

export default { title, beats, draw, check };
